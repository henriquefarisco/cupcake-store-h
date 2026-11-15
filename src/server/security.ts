const encoder = new TextEncoder();
export const hex = (data: ArrayBuffer) =>
  Array.from(new Uint8Array(data), (b) => b.toString(16).padStart(2, "0")).join(
    "",
  );
export const digest = async (value: string) =>
  hex(await crypto.subtle.digest("SHA-256", encoder.encode(value)));
export async function passwordHash(
  password: string,
  salt: string = crypto.randomUUID(),
) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(password),
    "PBKDF2",
    false,
    ["deriveBits"],
  );
  return `pbkdf2-sha256$100000$${salt}$${hex(await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt: encoder.encode(salt), iterations: 100000 }, key, 256))}`;
}
export async function verifyPassword(password: string, stored: string) {
  const salt = stored.split("$")[2];
  const candidate = await passwordHash(password, salt);
  let difference = candidate.length ^ stored.length;
  for (let i = 0; i < candidate.length; i++)
    difference |= candidate.charCodeAt(i) ^ (stored.charCodeAt(i) || 0);
  return difference === 0;
}
