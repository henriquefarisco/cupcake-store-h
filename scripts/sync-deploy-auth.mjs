import { readFileSync } from "node:fs";
import { join } from "node:path";
import { homedir } from "node:os";
import { execFileSync } from "node:child_process";
const repo = "henriquefarisco/cupcake-store-h";
// Use a dedicated scoped API token if already supplied. Never print credentials.
let token = process.env.CLOUDFLARE_API_TOKEN,
  expires = "";
if (!token) {
  execFileSync(
    process.execPath,
    ["node_modules/wrangler/bin/wrangler.js", "whoami"],
    { stdio: ["ignore", "pipe", "pipe"] },
  );
  const path =
    process.platform === "win32"
      ? join(
          process.env.APPDATA,
          "xdg.config",
          ".wrangler",
          "config",
          "default.toml",
        )
      : join(homedir(), ".config", ".wrangler", "config", "default.toml");
  const config = readFileSync(path, "utf8");
  token = config.match(/oauth_token\s*=\s*"([^"]+)"/)?.[1];
  expires = config.match(/expiration_time\s*=\s*"([^"]+)"/)?.[1] || "";
  if (
    !token ||
    !expires ||
    new Date(expires).getTime() < Date.now() + 10 * 60000
  )
    throw new Error(
      "OAuth ausente ou perto da expiração. Execute wrangler whoami/login localmente.",
    );
}
execFileSync("gh", ["secret", "set", "CLOUDFLARE_API_TOKEN", "--repo", repo], {
  input: token,
  stdio: ["pipe", "pipe", "pipe"],
});
execFileSync("gh", ["secret", "set", "CLOUDFLARE_ACCOUNT_ID", "--repo", repo], {
  input:
    process.env.CLOUDFLARE_ACCOUNT_ID || "02778426fceaa1cd02353a06c6a30fe3",
  stdio: ["pipe", "pipe", "pipe"],
});
execFileSync(
  "gh",
  [
    "variable",
    "set",
    "CLOUDFLARE_AUTH_EXPIRES_AT",
    "--repo",
    repo,
    "--body",
    expires,
  ],
  { stdio: ["ignore", "pipe", "pipe"] },
);
console.log(
  expires
    ? "Secrets sincronizados com OAuth temporário; expira em " +
        expires +
        ". Sincronize antes de novos deploys."
    : "Secrets sincronizados com API token fornecido no ambiente.",
);
