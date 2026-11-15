import assert from "node:assert/strict";
import { randomUUID } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { localSql } from "./local-db.mjs";
const base = process.env.BASE_URL || "http://127.0.0.1:8793";
if (!/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(base))
  throw new Error("Integração altera dados: permitida somente no banco local.");
localSql("DELETE FROM auth_limits;");
let passed = 0;
const results = [];
function check(name, fn) {
  fn();
  passed++;
  results.push({ name, status: "passed" });
  console.log("OK", name);
}
function client() {
  let cookie = "";
  return async (path, method = "GET", body, origin = base) => {
    const response = await fetch(base + "/api" + path, {
      method,
      headers: {
        Origin: origin,
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...(cookie ? { Cookie: cookie } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    });
    if (response.headers.get("set-cookie"))
      cookie = response.headers.get("set-cookie").split(";")[0];
    return {
      status: response.status,
      data: await response.json(),
      headers: response.headers,
    };
  };
}
const a = client(),
  b = client(),
  anon = client();
const suffix = randomUUID(),
  password = randomUUID() + "H!";
let r = await a("/health");
check("D1 health real", () => assert.equal(r.data.database, "ok"));
r = await a("/products");
const products = r.data;
check("H01 catálogo seed com oito produtos", () =>
  assert.ok(products.length >= 8),
);
r = await a("/products/" + products[0].id);
check("H02 detalhes de produto", () =>
  assert.equal(r.data.name, products[0].name),
);
r = await a("/products?q=Chocolate&category=1&max=1300&available=1");
check("H03 busca e filtros combinados", () => {
  assert.ok(r.data.length);
  assert.ok(
    r.data.every(
      (p) =>
        p.name.includes("Chocolate") && p.price_cents <= 1300 && p.stock > 0,
    ),
  );
});
r = await a("/products/999999");
check("Produto inexistente retorna 404", () => assert.equal(r.status, 404));
r = await a("/auth/register", "POST", {
  name: "Teste Cliente",
  email: suffix + "@example.test",
  password,
});
const userId = r.data.id;
check("H04 cadastro persistido e cookie seguro", () => {
  assert.equal(r.status, 201);
  assert.match(r.headers.get("set-cookie"), /HttpOnly/i);
  assert.match(r.headers.get("set-cookie"), /SameSite=Lax/i);
});
r = await a("/auth/logout", "POST", {});
r = await a("/account");
check("H05 logout revoga sessão", () => assert.equal(r.status, 401));
r = await a("/auth/login", "POST", {
  email: suffix + "@example.test",
  password: "senha-incorreta-123",
});
check("H05 senha incorreta é rejeitada", () => assert.equal(r.status, 401));
r = await a("/auth/login", "POST", {
  email: suffix + "@example.test",
  password,
});
check("H05 login real", () => assert.equal(r.status, 200));
r = await a("/account", "PATCH", { name: "Cliente Atualizado" });
r = await a("/account");
check("H06 perfil alterado persiste", () =>
  assert.equal(r.data.name, "Cliente Atualizado"),
);
r = await a("/account", "PATCH", { name: "Ataque" }, "https://evil.example");
check("CSRF origem externa bloqueada", () => assert.equal(r.status, 403));
r = await anon("/admin/products");
check("Admin exige autenticação", () => assert.equal(r.status, 401));
r = await a("/admin/products");
check("Cliente não acessa administração", () => assert.equal(r.status, 403));
const body = {
  key: randomUUID(),
  payment: "pix_simulado",
  address: {
    cep: "01001-000",
    street: "Rua de Teste",
    number: "123",
    district: "Centro",
    city: "São Paulo",
    state: "SP",
  },
  items: [
    { productId: products[0].id, quantity: 2 },
    { productId: products[1].id, quantity: 1 },
  ],
  total_cents: 1,
};
r = await a("/orders", "POST", { ...body, items: [] });
check("H11 carrinho vazio rejeitado", () => assert.equal(r.status, 400));
r = await a("/orders", "POST", {
  ...body,
  address: { ...body.address, cep: "inválido" },
});
check("H13 CEP inválido rejeitado", () => assert.equal(r.status, 400));
r = await a("/orders", "POST", body);
const orderId = r.data.id;
check("H07-H13 pedido criado no D1 com endereço e PIX simulado", () =>
  assert.equal(r.status, 201),
);
r = await a("/orders/" + orderId);
check("H09-H12 preços recalculados e confirmação íntegra", () => {
  assert.equal(
    r.data.total_cents,
    products[0].price_cents * 2 + products[1].price_cents,
  );
  assert.equal(r.data.items.length, 2);
  assert.equal(r.data.street, body.address.street);
  assert.equal(r.data.history[0].status, "recebido");
});
r = await a("/orders", "POST", body);
check("H11 mesma chave não duplica pedido", () =>
  assert.equal(r.data.id, orderId),
);
r = await a("/orders", "POST", {
  ...body,
  items: [{ productId: products[0].id, quantity: 1 }],
});
check("H11 chave repetida com conteúdo diferente rejeitada", () =>
  assert.equal(r.status, 409),
);
await b("/auth/register", "POST", {
  name: "Outro Cliente",
  email: "b-" + suffix + "@example.test",
  password,
});
r = await b("/orders/" + orderId);
check("Isolamento de pedidos de outro cliente", () =>
  assert.equal(r.status, 404),
);
r = await a("/orders/me");
check("H14 acompanhamento dos próprios pedidos", () =>
  assert.ok(r.data.some((o) => o.id === orderId)),
);
localSql(`UPDATE users SET role='admin' WHERE id='${userId}';`);
r = await a("/admin/products");
check("H15 administrador autorizado pelo servidor", () =>
  assert.equal(r.status, 200),
);
const product = {
  name: "Cupcake de Teste " + suffix,
  description: "Produto criado pelo teste integrado, sem venda real.",
  category_id: 3,
  price_cents: 1990,
  stock: 2,
  active: 1,
  image: "/images/coco.svg",
};
r = await a("/admin/products", "POST", product);
const pid = r.data.id;
check("H15 cadastrar produto", () => assert.equal(r.status, 201));
r = await a("/admin/products/" + pid, "PATCH", {
  ...product,
  stock: 1,
  price_cents: 2090,
});
check("H15 editar preço e estoque", () => assert.equal(r.status, 200));
const stockBody = {
  ...body,
  key: randomUUID(),
  items: [{ productId: pid, quantity: 2 }],
};
r = await a("/orders", "POST", stockBody);
check("H11 estoque insuficiente aborta lote", () =>
  assert.equal(r.status, 409),
);
r = await a("/products/" + pid);
check("Falha de compra não altera estoque", () =>
  assert.equal(r.data.stock, 1),
);
const concurrent = await Promise.all([
  a("/orders", "POST", {
    ...stockBody,
    key: randomUUID(),
    items: [{ productId: pid, quantity: 1 }],
  }),
  b("/orders", "POST", {
    ...stockBody,
    key: randomUUID(),
    items: [{ productId: pid, quantity: 1 }],
  }),
]);
check("Concorrência não vende além do estoque", () =>
  assert.deepEqual(concurrent.map((v) => v.status).sort(), [201, 409]),
);
r = await a("/admin/products/" + pid, "DELETE", {});
r = await a("/products/" + pid);
check("H15 desativação lógica remove do catálogo", () =>
  assert.equal(r.status, 404),
);
r = await a("/admin/orders");
check("H16 lista pedidos e clientes", () =>
  assert.ok(r.data.some((o) => o.id === orderId && o.customer)),
);
r = await a("/admin/orders/" + orderId + "/status", "PATCH", {
  status: "entregue",
});
check("H16 impede salto inválido de status", () => assert.equal(r.status, 409));
for (const status of ["preparacao", "entrega", "entregue"]) {
  r = await a("/admin/orders/" + orderId + "/status", "PATCH", { status });
  check("H16 transição " + status, () => assert.equal(r.status, 200));
}
r = await a("/orders/" + orderId);
check("H14 histórico completo persistido", () =>
  assert.equal(r.data.history.length, 4),
);
const cancel = await a("/orders", "POST", {
  ...body,
  key: randomUUID(),
  items: [{ productId: products[0].id, quantity: 1 }],
});
const before = await a("/products/" + products[0].id);
await a("/admin/orders/" + cancel.data.id + "/status", "PATCH", {
  status: "cancelado",
});
const after = await a("/products/" + products[0].id);
check("H16 cancelamento devolve estoque exatamente uma vez", () =>
  assert.equal(after.data.stock, before.data.stock + 1),
);
r = await a("/admin/orders/" + cancel.data.id + "/status", "PATCH", {
  status: "cancelado",
});
check("H16 cancelamento repetido não duplica estoque", () =>
  assert.equal(r.status, 409),
);
r = await a("/admin/reports/sales?from=2000-01-01&to=2099-12-31");
check("H17 relatório total, ranking, dias e status", () => {
  assert.ok(r.data.summary.orders >= 2);
  assert.ok(r.data.top.length);
  assert.ok(r.data.daily.length);
  assert.ok(r.data.distribution.length);
});
r = await a("/admin/reports/sales?from=1990-01-01&to=1990-01-02");
check("H17 período sem vendas retorna zero", () =>
  assert.equal(r.data.summary.total_cents, 0),
);
localSql(`UPDATE sessions SET expires_at=0 WHERE user_id='${userId}';`);
r = await a("/account");
check("Sessão expirada rejeitada", () => assert.equal(r.status, 401));
for (let i = 0; i < 16; i++)
  r = await anon("/auth/login", "POST", {
    email: "ausente@example.test",
    password,
  });
check("Limite persistido de tentativas de autenticação", () =>
  assert.equal(r.status, 429),
);
localSql("DELETE FROM auth_limits;");
mkdirSync("docs/evidencias", { recursive: true });
writeFileSync(
  "docs/evidencias/integracao.json",
  JSON.stringify(
    {
      environment: "Wrangler local / workerd / D1",
      passed,
      failed: 0,
      results,
    },
    null,
    2,
  ),
);
console.log(`${passed} verificações aprovadas`);
