import { createNeonD1 } from "./vercel-neon-d1";

let neonConnection = "";
let neonDatabase: ReturnType<typeof createNeonD1> | undefined;

// Compatibility shim for Vercel/Nitro builds. Cloudflare provides the D1
// binding at runtime; Vercel uses Neon when DATABASE_URL is configured.
export const env = new Proxy({} as Record<string, unknown>, {
  get(_target, property: string) {
    if (property === "DB") {
      const connectionString = process.env.DATABASE_URL?.trim() ?? "";
      if (!connectionString) return undefined;
      if (!neonDatabase || neonConnection !== connectionString) {
        neonConnection = connectionString;
        neonDatabase = createNeonD1(connectionString);
      }
      return neonDatabase;
    }
    if (property === "UPLOADS") return undefined;
    return process.env[property];
  },
});
