import { describe, it, expect } from "vitest";
import { addToCart, parsePrice } from "../../src/client/cart";
import type { Product } from "../../src/shared/domain";
const product: Product = {
  id: 1,
  name: "Chocolate",
  description: "Cupcake de chocolate",
  category_id: 1,
  category: "Clássicos",
  price_cents: 1290,
  stock: 100,
  active: 1,
  image: "/images/chocolate.svg",
};
describe("Correções de entrada e feedback", () => {
  it("B01 converte vírgula e ponto sem aceitar texto parcial", () => {
    expect(parsePrice("12,90")).toBe(1290);
    expect(parsePrice("12.9")).toBe(1290);
    expect(parsePrice(" 12 ")).toBe(1200);
    for (const value of ["", "12,9x", "1.234,56", "0", "-2", "12,999"])
      expect(parsePrice(value)).toBeNull();
  });
  it("B04 informa quantos cupcakes foram efetivamente adicionados", () => {
    const r = addToCart([], product, 3);
    expect(r.added).toBe(3);
    expect(r.message).toContain("3 cupcakes adicionados");
    expect(r.items[0].quantity).toBe(3);
  });
  it("B04 não confirma adição ao atingir limite", () => {
    const r = addToCart([{ ...product, quantity: 50 }], product, 1);
    expect(r.added).toBe(0);
    expect(r.message).toContain("Nenhum cupcake adicionado");
    expect(r.items[0].quantity).toBe(50);
  });
  it("B04 relata adição parcial e respeita estoque", () => {
    const r = addToCart([{ ...product, quantity: 48 }], product, 5);
    expect(r.added).toBe(2);
    expect(r.message).toContain("2 cupcakes adicionados");
    expect(r.message).toContain("Limite de 50");
    expect(addToCart([], { ...product, stock: 2 }, 4).items[0].quantity).toBe(
      2,
    );
  });
});
