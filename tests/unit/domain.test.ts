import { describe, it, expect } from "vitest";
import {
  address,
  cartTotal,
  money,
  checkout,
  registration,
  canTransition,
} from "../../src/shared/domain";
import {
  passwordHash,
  verifyPassword,
  digest,
} from "../../src/server/security";
describe("Regras do domínio", () => {
  it("H07-H09 soma centavos sem arredondamento", () =>
    expect(
      cartTotal([
        { price_cents: 1290, quantity: 3 },
        { price_cents: 1390, quantity: 2 },
      ]),
    ).toBe(6650));
  it("H08 carrinho vazio tem total zero", () => expect(cartTotal([])).toBe(0));
  it("formata BRL", () => expect(money(1290)).toContain("12,90"));
  it("H04 valida nome email e senha", () => {
    expect(
      registration.safeParse({ name: "A", email: "errado", password: "abc" })
        .success,
    ).toBe(false);
    expect(
      registration.parse({
        name: "Maria",
        email: "MARIA@EXAMPLE.COM",
        password: "Senha-teste-123",
      }).email,
    ).toBe("maria@example.com");
  });
  it("H13 valida CEP e UF", () => {
    expect(
      address.safeParse({
        cep: "0",
        street: "Rua A",
        number: "1",
        district: "Bairro",
        city: "Cidade",
        state: "XX",
      }).success,
    ).toBe(false);
  });
  it("H11 rejeita carrinho vazio", () =>
    expect(checkout.safeParse({ items: [] }).success).toBe(false));
  it("H16 permite sequência de preparo e entrega", () => {
    expect(canTransition("recebido", "preparacao")).toBe(true);
    expect(canTransition("preparacao", "entrega")).toBe(true);
    expect(canTransition("entrega", "entregue")).toBe(true);
  });
  it("H16 impede reabertura e cancelamento após entrega", () => {
    expect(canTransition("entregue", "recebido")).toBe(false);
    expect(canTransition("entrega", "cancelado")).toBe(false);
    expect(canTransition("cancelado", "preparacao")).toBe(false);
  });
  it("H16 permite cancelamento antes do envio", () => {
    expect(canTransition("recebido", "cancelado")).toBe(true);
    expect(canTransition("preparacao", "cancelado")).toBe(true);
  });
  it("H05 hash tem salt individual e verifica senha", async () => {
    const hash = await passwordHash("Senha-teste-segura");
    expect(await verifyPassword("Senha-teste-segura", hash)).toBe(true);
    expect(await verifyPassword("outra-senha-segura", hash)).toBe(false);
    expect(await passwordHash("Senha-teste-segura")).not.toBe(hash);
  });
  it("hash da sessão é determinístico e não é o token", async () => {
    expect(await digest("token")).toBe(await digest("token"));
    expect(await digest("token")).toHaveLength(64);
  });
});
