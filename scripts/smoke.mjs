const base = process.env.BASE_URL;
if (!base) throw new Error("Defina BASE_URL para o smoke somente leitura.");
for (const path of [
  "/",
  "/catalogo",
  "/pedidos",
  "/favicon.svg",
  "/api/health",
  "/api/products",
]) {
  const response = await fetch(base + path);
  if (!response.ok) throw new Error(path + ": " + response.status);
  if (path === "/api/health" && (await response.json()).database !== "ok")
    throw new Error("D1 indisponível");
  if (path === "/api/products" && (await response.json()).length < 8)
    throw new Error("Catálogo incompleto");
  console.log("OK", path);
}
const html = await (await fetch(base)).text();
for (const path of [...html.matchAll(/(?:src|href)="(\/assets\/[^\"]+)"/g)].map(
  (m) => m[1],
)) {
  if (!(await fetch(base + path)).ok) throw new Error("Asset falhou: " + path);
  console.log("OK", path);
}
console.log("Smoke somente leitura aprovado em " + base);
