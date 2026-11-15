import { Hono, type Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { getCookie, setCookie, deleteCookie } from "hono/cookie";
import { z } from "zod";
import {
  registration,
  credentials,
  profile,
  checkout,
  productInput,
  statuses,
  canTransition,
  type User,
  type Status,
} from "../shared/domain";
import { digest, passwordHash, verifyPassword } from "./security";
type Env = {
  Bindings: { DB: D1Database; ASSETS: Fetcher };
  Variables: { user: User; sessionHash: string };
};
const app = new Hono<Env>();
function fail(
  status: 400 | 401 | 403 | 404 | 409 | 413 | 429,
  message: string,
): never {
  throw new HTTPException(status, { message });
}
app.onError((error, c) => {
  if (error instanceof z.ZodError)
    return c.json(
      {
        error: "Confira os campos informados.",
        fields: error.issues.map((i) => ({
          path: i.path.join("."),
          message: i.message,
        })),
      },
      400,
    );
  if (error instanceof HTTPException)
    return c.json({ error: error.message }, error.status);
  return c.json({ error: "Não foi possível concluir. Tente novamente." }, 500);
});
app.use("/api/*", async (c, next) => {
  c.header("Cache-Control", "no-store");
  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "same-origin");
  c.header("X-Frame-Options", "DENY");
  if (!["GET", "HEAD", "OPTIONS"].includes(c.req.method)) {
    if (c.req.header("origin") !== new URL(c.req.url).origin)
      fail(403, "Origem da solicitação inválida.");
    if (!c.req.header("content-type")?.startsWith("application/json"))
      fail(400, "Envie dados em JSON.");
    const reader = c.req.raw.body?.getReader();
    let size = 0;
    const chunks: Uint8Array[] = [];
    if (reader) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        size += value.byteLength;
        if (size > 16384) {
          await reader.cancel();
          fail(413, "Dados excedem o limite.");
        }
        chunks.push(value);
      }
    }
    const bytes = new Uint8Array(size);
    let offset = 0;
    for (const chunk of chunks) {
      bytes.set(chunk, offset);
      offset += chunk.length;
    }
    try {
      c.req.json = async () => JSON.parse(new TextDecoder().decode(bytes));
    } catch {
      fail(400, "JSON inválido.");
    }
  }
  await next();
});
const json = async (c: Context<Env>) => {
  try {
    return await c.req.json();
  } catch {
    fail(400, "JSON inválido.");
  }
};
// Every private route resolves an unexpired opaque session on the server.
app.use("/api/*", async (c, next) => {
  const token = getCookie(c, "session");
  if (token) {
    const tokenHash = await digest(token);
    const u = await c.env.DB.prepare(
      "SELECT u.id,u.name,u.email,u.role FROM sessions s JOIN users u ON u.id=s.user_id WHERE s.token_hash=? AND s.expires_at>?",
    )
      .bind(tokenHash, Date.now())
      .first<User>();
    if (u) {
      c.set("user", u);
      c.set("sessionHash", tokenHash);
    }
  }
  await next();
});
const customer = (c: { get: (name: "user") => User }) =>
  c.get("user") || fail(401, "Entre na sua conta para continuar.");
app.use("/api/admin/*", async (c, next) => {
  if (customer(c).role !== "admin")
    fail(403, "Acesso restrito à administração.");
  await next();
});
async function newSession(c: Parameters<typeof json>[0], userId: string) {
  const token = crypto.randomUUID() + crypto.randomUUID();
  await c.env.DB.batch([
    c.env.DB.prepare("DELETE FROM sessions WHERE expires_at<?").bind(
      Date.now(),
    ),
    c.env.DB.prepare(
      "INSERT INTO sessions(token_hash,user_id,expires_at) VALUES(?,?,?)",
    ).bind(await digest(token), userId, Date.now() + 7 * 86400000),
  ]);
  setCookie(c, "session", token, {
    httpOnly: true,
    secure: new URL(c.req.url).protocol === "https:",
    sameSite: "Lax",
    path: "/",
    maxAge: 604800,
  });
}
async function authLimit(c: Parameters<typeof json>[0]) {
  const key = await digest(c.req.header("cf-connecting-ip") || "local");
  const now = Date.now();
  const row = await c.env.DB.prepare(
    "INSERT INTO auth_limits(key,attempts,expires_at) VALUES(?,1,?) ON CONFLICT(key) DO UPDATE SET attempts=CASE WHEN expires_at<? THEN 1 ELSE attempts+1 END,expires_at=CASE WHEN expires_at<? THEN excluded.expires_at ELSE expires_at END RETURNING attempts",
  )
    .bind(key, now + 15 * 60000, now, now)
    .first<{ attempts: number }>();
  if ((row?.attempts || 0) > 15)
    fail(429, "Muitas tentativas. Aguarde 15 minutos.");
  await c.env.DB.prepare("DELETE FROM auth_limits WHERE expires_at<?")
    .bind(now)
    .run();
}
app.get("/api/health", async (c) => {
  await c.env.DB.prepare("SELECT 1").first();
  return c.json({ status: "ok", database: "ok", payments: "simulated" });
});
app.get("/api/categories", async (c) =>
  c.json(
    (await c.env.DB.prepare("SELECT * FROM categories ORDER BY id").all())
      .results,
  ),
);
const productSelect =
  "SELECT p.*,c.name AS category FROM products p JOIN categories c ON c.id=p.category_id";
app.get("/api/products", async (c) => {
  const query = z
    .object({
      q: z.string().max(100).default(""),
      category: z.coerce.number().int().nonnegative().default(0),
      max: z.coerce.number().int().min(0).max(100000).default(100000),
      available: z.enum(["0", "1"]).default("0"),
      page: z.coerce.number().int().min(1).max(1000).default(1),
    })
    .parse(c.req.query());
  const result = await c.env.DB.prepare(
    productSelect +
      " WHERE p.active=1 AND p.name LIKE ? AND (?=0 OR p.category_id=?) AND p.price_cents<=? AND (?='0' OR p.stock>0) ORDER BY p.id LIMIT 24 OFFSET ?",
  )
    .bind(
      "%" + query.q + "%",
      query.category,
      query.category,
      query.max,
      query.available,
      (query.page - 1) * 24,
    )
    .all();
  return c.json(result.results);
});
app.get("/api/products/:id", async (c) => {
  const p = await c.env.DB.prepare(
    productSelect + " WHERE p.id=? AND p.active=1",
  )
    .bind(c.req.param("id"))
    .first();
  return c.json(p || fail(404, "Cupcake não encontrado."));
});
app.post("/api/auth/register", async (c) => {
  await authLimit(c);
  const data = registration.parse(await json(c));
  const id = crypto.randomUUID();
  try {
    await c.env.DB.prepare(
      "INSERT INTO users(id,name,email,password) VALUES(?,?,?,?)",
    )
      .bind(id, data.name, data.email, await passwordHash(data.password))
      .run();
  } catch {
    fail(409, "Não foi possível cadastrar este e-mail.");
  }
  await newSession(c, id);
  return c.json(
    { id, name: data.name, email: data.email, role: "customer" },
    201,
  );
});
app.post("/api/auth/login", async (c) => {
  await authLimit(c);
  const data = credentials.parse(await json(c));
  const user = await c.env.DB.prepare("SELECT * FROM users WHERE email=?")
    .bind(data.email)
    .first<User & { password: string }>();
  const dummy = "pbkdf2-sha256$100000$dummy$" + "0".repeat(64);
  const valid = await verifyPassword(data.password, user?.password || dummy);
  if (!user || !valid) fail(401, "E-mail ou senha inválidos.");
  if (c.get("sessionHash"))
    await c.env.DB.prepare("DELETE FROM sessions WHERE token_hash=?")
      .bind(c.get("sessionHash"))
      .run();
  await newSession(c, user.id);
  return c.json({
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  });
});
app.post("/api/auth/logout", async (c) => {
  if (c.get("sessionHash"))
    await c.env.DB.prepare("DELETE FROM sessions WHERE token_hash=?")
      .bind(c.get("sessionHash"))
      .run();
  deleteCookie(c, "session", { path: "/" });
  return c.json({ ok: true });
});
app.get("/api/auth/me", (c) => c.json(c.get("user") || null));
app.get("/api/account", (c) => c.json(customer(c)));
app.patch("/api/account", async (c) => {
  const u = customer(c);
  const data = profile.parse(await json(c));
  await c.env.DB.prepare("UPDATE users SET name=? WHERE id=?")
    .bind(data.name, u.id)
    .run();
  return c.json({ ...u, ...data });
});
app.get("/api/orders/me", async (c) => {
  const u = customer(c);
  return c.json(
    (
      await c.env.DB.prepare(
        "SELECT * FROM orders WHERE user_id=? ORDER BY created_at DESC LIMIT 100",
      )
        .bind(u.id)
        .all()
    ).results,
  );
});
app.get("/api/orders/:id", async (c) => {
  const u = customer(c);
  const order = await c.env.DB.prepare(
    "SELECT o.*,a.cep,a.street,a.number,a.district,a.city,a.state,a.complement FROM orders o JOIN addresses a ON a.id=o.address_id WHERE o.id=? AND (o.user_id=? OR ?='admin')",
  )
    .bind(c.req.param("id"), u.id, u.role)
    .first();
  if (!order) fail(404, "Pedido não encontrado.");
  const [items, history] = await c.env.DB.batch([
    c.env.DB.prepare("SELECT * FROM order_items WHERE order_id=?").bind(
      order.id,
    ),
    c.env.DB.prepare(
      "SELECT status,created_at FROM order_status_history WHERE order_id=? ORDER BY id",
    ).bind(order.id),
  ]);
  return c.json({ ...order, items: items.results, history: history.results });
});
app.post("/api/orders", async (c) => {
  const u = customer(c);
  const data = checkout.parse(await json(c));
  const hash = await digest(JSON.stringify({ ...data, key: undefined }));
  const existing = await c.env.DB.prepare(
    "SELECT id,request_hash FROM orders WHERE user_id=? AND idempotency_key=?",
  )
    .bind(u.id, data.key)
    .first<{ id: string; request_hash: string }>();
  if (existing) {
    if (existing.request_hash !== hash)
      fail(409, "A chave já foi usada com outro pedido.");
    return c.json({ id: existing.id }, 200);
  }
  const id = crypto.randomUUID(),
    addressId = crypto.randomUUID();
  const a = data.address;
  const statements = [
    c.env.DB.prepare(
      "INSERT INTO addresses(id,user_id,cep,street,number,district,city,state,complement) VALUES(?,?,?,?,?,?,?,?,?)",
    ).bind(
      addressId,
      u.id,
      a.cep,
      a.street,
      a.number,
      a.district,
      a.city,
      a.state,
      a.complement,
    ),
    c.env.DB.prepare(
      "INSERT INTO orders(id,user_id,address_id,payment,idempotency_key,request_hash) VALUES(?,?,?,?,?,?)",
    ).bind(id, u.id, addressId, data.payment, data.key, hash),
  ];
  for (const item of data.items) {
    // A scalar subquery and trigger validate product and reserve stock inside the atomic batch.
    statements.push(
      c.env.DB.prepare(
        "INSERT INTO order_items(order_id,product_id,name,quantity,unit_price_cents) VALUES(?,?,(SELECT name FROM products WHERE id=?),?,(SELECT price_cents FROM products WHERE id=?))",
      ).bind(id, item.productId, item.productId, item.quantity, item.productId),
    );
  }
  statements.push(
    c.env.DB.prepare(
      "INSERT INTO order_status_history(order_id,status,changed_by) VALUES(?,'recebido',?)",
    ).bind(id, u.id),
  );
  try {
    await c.env.DB.batch(statements);
  } catch {
    const duplicate = await c.env.DB.prepare(
      "SELECT id,request_hash FROM orders WHERE user_id=? AND idempotency_key=?",
    )
      .bind(u.id, data.key)
      .first<{ id: string; request_hash: string }>();
    if (duplicate?.request_hash === hash) return c.json({ id: duplicate.id });
    fail(
      409,
      "Produto indisponível ou estoque insuficiente. Atualize seu carrinho.",
    );
  }
  return c.json({ id }, 201);
});
app.get("/api/admin/products", async (c) =>
  c.json(
    (await c.env.DB.prepare(productSelect + " ORDER BY p.id LIMIT 500").all())
      .results,
  ),
);
app.post("/api/admin/products", async (c) => {
  const p = productInput.parse(await json(c));
  const row = await c.env.DB.prepare(
    "INSERT INTO products(name,description,category_id,price_cents,stock,active,image) VALUES(?,?,?,?,?,?,?) RETURNING id",
  )
    .bind(
      p.name,
      p.description,
      p.category_id,
      p.price_cents,
      p.stock,
      p.active,
      p.image,
    )
    .first();
  return c.json(row, 201);
});
app.patch("/api/admin/products/:id", async (c) => {
  const p = productInput.parse(await json(c));
  const r = await c.env.DB.prepare(
    "UPDATE products SET name=?,description=?,category_id=?,price_cents=?,stock=?,active=?,image=? WHERE id=? RETURNING id",
  )
    .bind(
      p.name,
      p.description,
      p.category_id,
      p.price_cents,
      p.stock,
      p.active,
      p.image,
      c.req.param("id"),
    )
    .first();
  return c.json(r || fail(404, "Produto não encontrado."));
});
app.delete("/api/admin/products/:id", async (c) => {
  const r = await c.env.DB.prepare(
    "UPDATE products SET active=0 WHERE id=? RETURNING id",
  )
    .bind(c.req.param("id"))
    .first();
  return c.json(r || fail(404, "Produto não encontrado."));
});
app.get("/api/admin/orders", async (c) =>
  c.json(
    (
      await c.env.DB.prepare(
        "SELECT o.*,u.name AS customer,u.email FROM orders o JOIN users u ON u.id=o.user_id ORDER BY o.created_at DESC LIMIT 100",
      ).all()
    ).results,
  ),
);
app.patch("/api/admin/orders/:id/status", async (c) => {
  const { status } = z
    .object({ status: z.enum(statuses) })
    .parse(await json(c));
  const id = c.req.param("id");
  const order = await c.env.DB.prepare("SELECT status FROM orders WHERE id=?")
    .bind(id)
    .first<{ status: Status }>();
  if (!order) fail(404, "Pedido não encontrado.");
  if (!canTransition(order.status, status))
    fail(409, "Transição de status inválida.");
  const result = await c.env.DB.batch([
    c.env.DB.prepare(
      "UPDATE orders SET status=? WHERE id=? AND status=? RETURNING id",
    ).bind(status, id, order.status),
    c.env.DB.prepare(
      "INSERT INTO order_status_history(order_id,status,changed_by) SELECT ?,?,? WHERE changes()>0",
    ).bind(id, status, customer(c).id),
  ]);
  if (!result[0].results.length)
    fail(409, "Pedido alterado por outra sessão. Atualize a página.");
  return c.json({ ok: true });
});
app.get("/api/admin/reports/sales", async (c) => {
  const { from, to } = z
    .object({
      from: z.iso.date().default("2000-01-01"),
      to: z.iso.date().default("2099-12-31"),
    })
    .parse(c.req.query());
  if (from > to) fail(400, "Período inválido.");
  const params = [from + "T00:00:00-03:00", to + "T23:59:59.999-03:00"];
  const condition =
    "julianday(o.created_at) BETWEEN julianday(?) AND julianday(?)";
  const [summary, top, distribution, daily] = await c.env.DB.batch([
    c.env.DB.prepare(
      `SELECT COUNT(*) AS orders,COALESCE(SUM(CASE WHEN o.status!='cancelado' THEN total_cents ELSE 0 END),0) AS total_cents FROM orders o WHERE ${condition}`,
    ).bind(...params),
    c.env.DB.prepare(
      `SELECT i.name,SUM(i.quantity) AS quantity,SUM(i.quantity*i.unit_price_cents) AS total_cents FROM order_items i JOIN orders o ON o.id=i.order_id WHERE o.status!='cancelado' AND ${condition} GROUP BY i.product_id,i.name ORDER BY quantity DESC LIMIT 10`,
    ).bind(...params),
    c.env.DB.prepare(
      `SELECT status,COUNT(*) AS count FROM orders o WHERE ${condition} GROUP BY status`,
    ).bind(...params),
    c.env.DB.prepare(
      `SELECT date(o.created_at,'-3 hours') AS day,SUM(total_cents) AS total_cents FROM orders o WHERE o.status!='cancelado' AND ${condition} GROUP BY day ORDER BY day`,
    ).bind(...params),
  ]);
  return c.json({
    summary: summary.results[0],
    top: top.results,
    distribution: distribution.results,
    daily: daily.results,
  });
});
app.all("/api/*", (c) => c.json({ error: "Rota não encontrada." }, 404));
app.get("*", (c) => c.env.ASSETS.fetch(c.req.raw));
export default app;
