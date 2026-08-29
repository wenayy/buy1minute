import { createNeonD1 } from "./vercel-neon-d1";

const connectionString = process.env.DATABASE_URL?.trim();

// Compatibility shim for Vercel/Nitro builds. Cloudflare provides the D1
// binding at runtime; Vercel uses Neon when DATABASE_URL is configured.
export const env = {
  ...process.env,
  DB: connectionString ? createNeonD1(connectionString) : undefined,
  UPLOADS: undefined,
};
