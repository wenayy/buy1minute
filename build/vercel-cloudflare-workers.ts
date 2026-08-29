// Compatibility shim for Vercel/Nitro builds. Cloudflare provides this
// module at runtime; Vercel uses process.env and has no D1 binding by default.
export const env = {
  ...process.env,
  DB: undefined,
  UPLOADS: undefined,
};
