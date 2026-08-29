// Applies the drizzle SQL migrations to the local miniflare D1 database so the
// checkout/reservation flow works during `npm run dev`. Run once after the dev
// server has created the local D1 (i.e. after starting `npm run dev` once).
import { execFileSync } from "node:child_process";
import { existsSync, readdirSync, readFileSync } from "node:fs";
import path from "node:path";

const d1Dir = ".wrangler/state/v3/d1/miniflare-D1DatabaseObject";
if (!existsSync(d1Dir)) {
  console.error("No local D1 found yet. Start `npm run dev` once to create it, then re-run this.");
  process.exit(1);
}

const dbFile = readdirSync(d1Dir).find((file) => file.endsWith(".sqlite") && file !== "metadata.sqlite");
if (!dbFile) {
  console.error(`No D1 sqlite file found in ${d1Dir}`);
  process.exit(1);
}
const dbPath = path.join(d1Dir, dbFile);

try {
  const tables = execFileSync("sqlite3", [dbPath, ".tables"], { encoding: "utf8" });
  if (tables.includes("ownership_minutes")) {
    console.log("Local D1 already migrated — nothing to do.");
    process.exit(0);
  }
} catch {
  console.error("The `sqlite3` CLI is required. Install it (macOS ships with it) and retry.");
  process.exit(1);
}

const migrations = readdirSync("drizzle").filter((file) => file.endsWith(".sql")).sort();
for (const file of migrations) {
  execFileSync("sqlite3", [dbPath], {
    input: readFileSync(path.join("drizzle", file), "utf8"),
    stdio: ["pipe", "inherit", "inherit"],
  });
  console.log(`applied ${file}`);
}
console.log("Local D1 migrated. Restart `npm run dev` if it is running.");
