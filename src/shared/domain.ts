import { z } from "zod";
export const credentials = z.object({
  email: z
    .email()
    .max(254)
    .transform((v) => v.toLowerCase().trim()),
  password: z.string().min(12).max(128),
});
export const profile = z.object({ name: z.string().trim().min(2).max(100) });
export const registration = credentials.extend(profile.shape);
export const address = z.object({
  cep: z.string().regex(/^\d{5}-?\d{3}$/),
  street: z.string().trim().min(3).max(120),
  number: z.string().trim().min(1).max(20),
  district: z.string().trim().min(2).max(80),
  city: z.string().trim().min(2).max(80),
  state: z
    .string()
    .regex(
      /^(AC|AL|AP|AM|BA|CE|DF|ES|GO|MA|MT|MS|MG|PA|PB|PR|PE|PI|RJ|RN|RS|RO|RR|SC|SP|SE|TO)$/,
    ),
  complement: z.string().max(120).default(""),
});
export const checkout = z
  .object({
    items: z
      .array(
        z.object({
          productId: z.number().int().positive(),
          quantity: z.number().int().min(1).max(50),
        }),
      )
      .min(1)
      .max(20),
    address,
    payment: z.enum(["pix_simulado", "entrega"]),
    key: z.uuid(),
  })
  .superRefine((v, c) => {
    if (new Set(v.items.map((i) => i.productId)).size !== v.items.length)
      c.addIssue({
        code: "custom",
        message: "Produtos duplicados no carrinho",
      });
  });
export const productInput = z.object({
  name: z.string().trim().min(3).max(100),
  description: z.string().trim().min(8).max(1000),
  category_id: z.number().int().positive(),
  price_cents: z.number().int().min(100).max(100000),
  stock: z.number().int().min(0).max(10000),
  active: z.number().int().min(0).max(1),
  image: z.string().regex(/^\/images\/[a-z0-9-]+\.svg$/),
});
export const statuses = [
  "recebido",
  "preparacao",
  "entrega",
  "entregue",
  "cancelado",
] as const;
export type Status = (typeof statuses)[number];
export const statusLabels: Record<Status, string> = {
  recebido: "Pedido recebido",
  preparacao: "Em preparação",
  entrega: "Saiu para entrega",
  entregue: "Entregue",
  cancelado: "Cancelado",
};
export function canTransition(from: Status, to: Status) {
  return (
    {
      recebido: ["preparacao", "cancelado"],
      preparacao: ["entrega", "cancelado"],
      entrega: ["entregue"],
      entregue: [],
      cancelado: [],
    } as Record<Status, Status[]>
  )[from].includes(to);
}
export const money = (cents: number) =>
  new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(
    cents / 100,
  );
export function cartTotal(items: { price_cents: number; quantity: number }[]) {
  return items.reduce((sum, i) => sum + i.price_cents * i.quantity, 0);
}
export interface Product {
  id: number;
  name: string;
  description: string;
  category_id: number;
  category: string;
  price_cents: number;
  stock: number;
  active: number;
  image: string;
}
export interface User {
  id: string;
  name: string;
  email: string;
  role: "customer" | "admin";
}
