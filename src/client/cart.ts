import type { Product } from "../shared/domain";
export type CartItem = Product & { quantity: number };
export function addToCart(
  items: CartItem[],
  product: Product,
  requested: number,
) {
  const current = items.find((item) => item.id === product.id)?.quantity ?? 0;
  const limit = Math.min(50, product.stock);
  const added =
    Number.isInteger(requested) && requested > 0
      ? Math.max(0, Math.min(requested, limit - current))
      : 0;
  const next =
    added === 0
      ? items
      : current > 0
        ? items.map((item) =>
            item.id === product.id
              ? { ...product, quantity: current + added }
              : item,
          )
        : [...items, { ...product, quantity: added }];
  const message =
    added === 0
      ? `Nenhum cupcake adicionado. Limite de ${limit} unidades deste produto na sacola.`
      : `${added} ${added === 1 ? "cupcake adicionado" : "cupcakes adicionados"} à sacola. Total deste produto: ${current + added}.${added < requested ? ` Limite de ${limit} unidades atingido.` : ""}`;
  return { items: next, added, message };
}
export function parsePrice(text: string): number | null {
  const normalized = text.trim();
  if (!/^\d+(?:[.,]\d{1,2})?$/.test(normalized)) return null;
  const cents = Math.round(Number(normalized.replace(",", ".")) * 100);
  return Number.isSafeInteger(cents) && cents >= 100 && cents <= 100000
    ? cents
    : null;
}
