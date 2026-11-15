import { execFileSync } from "node:child_process";
import { mkdirSync, writeFileSync, unlinkSync } from "node:fs";
import { randomUUID } from "node:crypto";
// Promote an existing account; passwords never pass through argv or public files.
const email = process.env.ADMIN_EMAIL;
if (!email || !/^[-a-zA-Z0-9._+]+@[a-zA-Z0-9.-]+$/.test(email))
  throw new Error("Defina ADMIN_EMAIL de uma conta já cadastrada.");
const remote = process.argv.includes("--remote");
mkdirSync(".local", { recursive: true });
const path = ".local/admin-" + randomUUID() + ".sql";
writeFileSync(path, `UPDATE users SET role='admin' WHERE email='${email}';`);
try {
  execFileSync(
    process.execPath,
    [
      "node_modules/wrangler/bin/wrangler.js",
      "d1",
      "execute",
      "DB",
      remote ? "--remote" : "--local",
      "--file",
      path,
    ],
    { stdio: "inherit" },
  );
} finally {
  unlinkSync(path);
}
