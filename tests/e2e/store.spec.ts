import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { localSql } from "../../scripts/local-db.mjs";
test.beforeAll(() => {
  localSql("DELETE FROM auth_limits;");
});
test("H01-H03 vitrine, filtros, detalhes e navegação por teclado", async ({
  page,
}, info) => {
  await page.goto("/");
  await expect(
    page.getByRole("heading", { name: /A vida merece/ }),
  ).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Pular para o conteúdo" }),
  ).toBeFocused();
  await page.getByRole("heading", { name: /A vida merece/ }).click();
  await page.screenshot({
    path: `docs/evidencias/inicio-${info.project.name}.png`,
    fullPage: true,
  });
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Encontre seu favorito" }).click();
  await page.getByLabel("Buscar cupcake").fill("Chocolate");
  await expect(page.locator(".product-card")).toHaveCount(1);
  await page.getByLabel("Categoria", { exact: true }).selectOption("1");
  await page.getByLabel("Preço máximo").selectOption("1300");
  await page.getByLabel("Em estoque").check();
  await expect(
    page.getByRole("heading", { name: "Chocolate Belga" }),
  ).toBeVisible();
  await page.getByRole("heading", { name: "Chocolate Belga" }).click();
  await expect(page.getByText(/Contém leite, ovos e glúten/)).toBeVisible();
  await expect(page.getByLabel("Quantidade", { exact: true })).toBeVisible();
});
test("H04-H14 compra completa, carrinho, perfil, confirmação e logout", async ({
  page,
}, info) => {
  const email = randomUUID() + "@example.test",
    password = randomUUID() + "A!";
  await page.goto("/cadastro");
  await page.getByLabel("Seu nome").fill("Cliente de Avaliação");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Criar conta", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Olá, Cliente." }),
  ).toBeVisible();
  await page.getByLabel("Seu nome").fill("Cliente Atualizado");
  await page.getByRole("button", { name: "Salvar dados" }).click();
  await expect(page.getByRole("status")).toContainText("atualizados");
  await page.goto("/produto/1");
  await page.getByLabel("Quantidade", { exact: true }).fill("2");
  await page.getByRole("button", { name: /Adicionar à sacola/ }).click();
  await page.getByRole("link", { name: /Sacola/ }).click();
  await expect(
    page.getByText("R$ 25,80", { exact: true }).first(),
  ).toBeVisible();
  await page.getByLabel("Quantidade de Chocolate Belga").fill("3");
  await expect(
    page.getByText("R$ 38,70", { exact: true }).first(),
  ).toBeVisible();
  await page.reload();
  await expect(page.getByLabel("Quantidade de Chocolate Belga")).toHaveValue(
    "3",
  );
  await page.getByRole("link", { name: "Revisar e continuar" }).click();
  for (const [label, value] of [
    ["CEP", "01001-000"],
    ["Rua", "Rua de Teste"],
    ["Número", "123"],
    ["Bairro", "Centro"],
    ["Cidade", "São Paulo"],
    ["UF (ex.: SP)", "SP"],
  ])
    await page.getByLabel(label, { exact: true }).fill(value);
  await page.getByRole("radio", { name: "PIX simulado", exact: true }).check();
  await page.getByRole("button", { name: "Confirmar pedido simulado" }).click();
  await expect(
    page.getByRole("heading", { name: "Seu carinho está a caminho." }),
  ).toBeVisible();
  await expect(
    page.getByText("R$ 38,70", { exact: true }).first(),
  ).toBeVisible();
  await page.screenshot({
    path: `docs/evidencias/pedido-${info.project.name}.png`,
    fullPage: true,
  });
  await page
    .getByRole("link", { name: "Meus pedidos", exact: true })
    .first()
    .click();
  await expect(page.locator(".order-row")).toHaveCount(1);
  await page.goto("/conta");
  await page.getByRole("button", { name: "Sair da conta" }).click();
  await expect(
    page.getByRole("link", { name: "Entrar", exact: true }).last(),
  ).toBeVisible();
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill(email);
  await page.getByLabel("Senha").fill(password);
  await page.getByRole("button", { name: "Entrar na minha conta" }).click();
  await expect(
    page.getByRole("heading", { name: "Olá, Cliente." }),
  ).toBeVisible();
});
test("H15-H17 administração real de produto, pedido e relatório", async ({
  page,
}) => {
  const testName = "Cupcake E2E " + randomUUID().slice(0, 8);
  const base = "http://127.0.0.1:8793";
  const password = randomUUID() + "H!";
  const response = await page.request.post("/api/auth/register", {
    headers: { Origin: base },
    data: {
      name: "Administrador Teste",
      email: randomUUID() + "@example.test",
      password,
    },
  });
  expect(response.status()).toBe(201);
  const u = await response.json();
  localSql(`UPDATE users SET role='admin' WHERE id='${u.id}';`);
  const order = await page.request.post("/api/orders", {
    headers: { Origin: base },
    data: {
      key: randomUUID(),
      payment: "entrega",
      items: [{ productId: 2, quantity: 1 }],
      address: {
        cep: "01001-000",
        street: "Rua Teste",
        number: "1",
        district: "Centro",
        city: "São Paulo",
        state: "SP",
      },
    },
  });
  expect(order.status()).toBe(201);
  const oid = (await order.json()).id;
  await page.goto("/admin");
  await page.getByRole("button", { name: "Cadastrar cupcake" }).click();
  await page.getByLabel("Nome", { exact: true }).fill(testName);
  await page
    .getByLabel("Descrição e ingredientes")
    .fill("Cupcake de teste com chocolate. Contém leite e glúten.");
  await page.getByRole("button", { name: "Salvar produto" }).click();
  await expect(
    page
      .getByRole("button", { name: "Editar " + testName, exact: true })
      .last(),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Editar " + testName, exact: true })
    .last()
    .click();
  await page.getByLabel("Preço em reais").fill("19.90");
  await page.getByRole("button", { name: "Salvar produto" }).click();
  await expect(
    page.locator(".admin-list .order-row").filter({ hasText: testName }),
  ).toContainText("19,90");
  await page.getByRole("button", { name: "Pedidos", exact: true }).click();
  const row = page.locator(".order-row").filter({ hasText: oid.slice(0, 8) });
  await row.getByRole("button", { name: "Em preparação" }).click();
  await expect(row.getByText("Em preparação", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: "Relatório de vendas", exact: true })
    .click();
  await expect(page.getByText("Pedidos no período")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Produtos mais vendidos" }),
  ).toBeVisible();
});
test("Erros, recuperação da API, carrinho vazio e proteção de rotas", async ({
  page,
}) => {
  await page.goto("/carrinho");
  await expect(
    page.getByRole("heading", { name: "Sua sacola espera por um carinho." }),
  ).toBeVisible();
  await page.goto("/admin");
  await expect(
    page.getByRole("link", { name: "Entrar", exact: true }).last(),
  ).toBeVisible();
  await page.goto("/nao-existe");
  await expect(
    page.getByRole("heading", { name: "Esta página saiu do forno errado." }),
  ).toBeVisible();
  await page.route("**/api/products?**", (route) =>
    route.fulfill({
      status: 503,
      contentType: "application/json",
      body: JSON.stringify({ error: "Falha de teste recuperável." }),
    }),
  );
  await page.goto("/catalogo");
  await expect(page.getByRole("alert")).toContainText("Falha de teste");
  await page.unroute("**/api/products?**");
  await page.getByRole("button", { name: "Tentar novamente" }).click();
  await expect(page.locator(".product-card").first()).toBeVisible();
  await page.goto("/entrar");
  await page.getByLabel("E-mail", { exact: true }).fill("ausente@example.test");
  await page.getByLabel("Senha").fill("senha-incorreta-123");
  await page.getByRole("button", { name: "Entrar na minha conta" }).click();
  await expect(page.getByRole("alert")).toContainText(
    "E-mail ou senha inválidos",
  );
});
