import { execFileSync } from "node:child_process";
import { writeFileSync, mkdirSync, unlinkSync } from "node:fs";
import { randomUUID } from "node:crypto";
export function localSql(sql) {
  if (
    process.env.BASE_URL &&
    !/^http:\/\/(127\.0\.0\.1|localhost):\d+$/.test(process.env.BASE_URL)
  )
    throw new Error("SQL de teste somente local.");
  mkdirSync(".local", { recursive: true });
  const file = ".local/test-" + randomUUID() + ".sql";
  writeFileSync(file, sql);
  try {
    return execFileSync(
      process.execPath,
      [
        "node_modules/wrangler/bin/wrangler.js",
        "d1",
        "execute",
        "DB",
        "--local",
        "--file",
        file,
        "--json",
      ],
      { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] },
    );
  } finally {
    unlinkSync(file);
  }
}
