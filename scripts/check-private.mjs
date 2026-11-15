import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
const tracked = execFileSync("git", ["ls-files", "-z"], { encoding: "utf8" })
  .split("\0")
  .filter(Boolean);
const forbidden =
  /(^|\/)(\.local|entrega|\.wrangler)(\/|$)|(^|\/)(ACESSOS-LOCAL|TIMELINE-LOCAL)\.txt$|\.(pdf|docx)$|(^|\/)\.env($|\.(?!example$))|\.dev\.vars/;
const tokenPatterns = [
  /gh[pousr]_[A-Za-z0-9]{30,}/,
  /github_pat_[A-Za-z0-9_]{40,}/,
  /-----BEGIN (?:RSA |EC |OPENSSH )?PRIVATE KEY-----/,
];
for (const file of tracked) {
  if (forbidden.test(file))
    throw new Error("Arquivo privado rastreado: " + file);
  const text = readFileSync(file, "utf8");
  if (tokenPatterns.some((p) => p.test(text)))
    throw new Error("Possível segredo: " + file);
}
function walk(dir) {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = dir + "/" + entry.name;
    if (entry.isDirectory()) walk(path);
    else {
      if (
        /\.(pdf|docx|sql|txt)$|ACESSOS|TIMELINE|\.env/.test(path) &&
        !path.endsWith("robots.txt")
      )
        throw new Error("Arquivo indevido no build: " + path);
      if (tokenPatterns.some((p) => p.test(readFileSync(path, "utf8"))))
        throw new Error("Possível segredo no build");
    }
  }
}
if (existsSync("dist")) walk("dist");
console.log("Arquivos públicos e build verificados.");
