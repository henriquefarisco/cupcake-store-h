import { test, expect } from "@playwright/test";
import { randomUUID } from "node:crypto";
import { localSql } from "../../scripts/local-db.mjs";
test.beforeAll(() => localSql("DELETE FROM auth_limits;"));
async function admin(page: import("@playwright/test").Page) {
  const r = await page.request.post("/api/auth/register", {
    headers: { Origin: "http://127.0.0.1:8793" },
    data: {
      name: "Reteste técnico",
      email: randomUUID() + "@example.test",
      password: randomUUID() + "H!",
    },
  });
  expect(r.status()).toBe(201);
  const u = await r.json();
  localSql(`UPDATE users SET role='admin' WHERE id='${u.id}';`);
  await page.goto("/admin");
}
test("B03 B04 quantidade vazia sem zero e feedback real de adição", async ({
  page,
}, info) => {
  await page.goto("/produto/1");
  const input = page.getByLabel("Quantidade", { exact: true });
  await input.fill("");
  await expect(input).toHaveValue("");
  await expect(
    page.getByRole("button", { name: /Adicionar à sacola/ }),
  ).toBeDisabled();
  await page.screenshot({
    path: `docs/evidencias/correcao-quantidade-${info.project.name}.png`,
    fullPage: true,
  });
  await input.fill("3");
  await expect(input).toHaveValue("3");
  await page.getByRole("button", { name: /Adicionar à sacola/ }).click();
  await expect(page.getByRole("status")).toContainText(
    "3 cupcakes adicionados",
  );
  await page.goto("/carrinho");
  const cartInput = page.getByLabel("Quantidade de Chocolate Belga");
  await cartInput.fill("");
  await expect(cartInput).toHaveValue("");
  await cartInput.fill("2");
  await expect(cartInput).toHaveValue("2");
  await expect(
    page.getByText("R$ 25,80", { exact: true }).first(),
  ).toBeVisible();
  await cartInput.fill("");
  await cartInput.blur();
  await expect(cartInput).toHaveValue("2");
  await expect(page.getByRole("alert")).toContainText("quantidade inteira");
  await page.goto("/produto/1");
  await input.fill("50");
  await page.getByRole("button", { name: /Adicionar à sacola/ }).click();
  await expect(page.getByRole("status")).toContainText(
    "48 cupcakes adicionados",
  );
  await input.fill("1");
  await page.getByRole("button", { name: /Adicionar à sacola/ }).click();
  await expect(page.getByRole("status")).toContainText(
    "Nenhum cupcake adicionado",
  );
  await expect(page.getByRole("link", { name: "Sacola 50" })).toBeVisible();
  await page.screenshot({
    path: `docs/evidencias/correcao-sacola-${info.project.name}.png`,
    fullPage: true,
  });
});
test("B01 B05 preço brasileiro e formulário visível com foco", async ({
  page,
}, info) => {
  await admin(page);
  const button = page.getByRole("button", {
    name: "Editar Frutas Vermelhas",
    exact: true,
  });
  await button.scrollIntoViewIfNeeded();
  await button.click();
  await expect(page.getByLabel("Nome", { exact: true })).toBeFocused();
  await expect(
    page.getByRole("heading", { name: "Editar cupcake", exact: true }),
  ).toBeInViewport();
  const before = await page.request.get("/api/products/8");
  const original = await before.json();
  await page.getByLabel("Preço em reais").fill("15,90");
  await page
    .getByRole("button", { name: "Salvar produto", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Editar cupcake", exact: true }),
  ).toHaveCount(0);
  expect(
    (await (await page.request.get("/api/products/8")).json()).price_cents,
  ).toBe(1590);
  await button.click();
  await page.getByLabel("Preço em reais").fill("12,9x");
  await page
    .getByRole("button", { name: "Salvar produto", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("Informe um preço");
  await page.screenshot({
    path: `docs/evidencias/correcao-preco-${info.project.name}.png`,
    fullPage: true,
  });
  await page.request.patch("/api/admin/products/8", {
    headers: { Origin: "http://127.0.0.1:8793" },
    data: original,
  });
});
test("B02 filtros recuperam após limpar datas e mostram intervalo inválido", async ({
  page,
}, info) => {
  await admin(page);
  await page
    .getByRole("button", { name: "Relatório de vendas", exact: true })
    .click();
  await expect(page.locator(".metrics")).toBeVisible();
  await page.getByLabel("Data inicial").fill("1990-01-01");
  await page.getByLabel("Data final").fill("1990-01-02");
  await expect(page.locator(".metrics").first()).toContainText("R$ 0,00");
  await page.getByLabel("Data inicial").fill("");
  await page.getByLabel("Data final").fill("");
  await expect(page.locator(".metrics")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.getByLabel("Data final").fill("2020-01-01");
  await page.getByLabel("Data inicial").fill("2026-01-01");
  await expect(page.getByRole("alert")).toContainText("data inicial");
  await expect(page.locator(".metrics")).toHaveCount(0);
  await page.getByLabel("Data inicial").fill("");
  await page.getByLabel("Data final").fill("");
  await expect(page.locator(".metrics")).toBeVisible();
  await expect(page.getByRole("alert")).toHaveCount(0);
  await page.screenshot({
    path: `docs/evidencias/correcao-filtros-${info.project.name}.png`,
    fullPage: true,
  });
});
