interface D1PreparedStatement {
  bind(...values: unknown[]): D1PreparedStatement;
  run(): Promise<unknown>;
  all<T = unknown>(): Promise<{ results: T[] }>;
  first<T = unknown>(colName?: string): Promise<T | null>;
}

interface D1Database {
  prepare(query: string): D1PreparedStatement;
  batch(statements: D1PreparedStatement[]): Promise<unknown[]>;
}

interface Fetcher {
  fetch(request: Request): Promise<Response>;
}

interface R2Bucket {
  put(key: string, value: ReadableStream | ArrayBuffer | string): Promise<unknown>;
  get(key: string): Promise<unknown>;
}

declare module "cloudflare:workers" {
  export const env: {
    DB: D1Database;
    UPLOADS?: R2Bucket;
    DODO_PAYMENTS_API_KEY?: string;
    /** Optional reusable Pay What You Want product. Fixed-price IDs are ignored. */
    DODO_PAYMENTS_PRODUCT_ID?: string;
    DODO_PAYMENTS_ENVIRONMENT?: "test" | "live";
    DODO_PAYMENTS_WEBHOOK_SECRET?: string;
  };
}
