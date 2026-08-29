import { neon } from "@neondatabase/serverless";

type Row = Record<string, unknown>;

const schemaStatements = [
  `CREATE TABLE IF NOT EXISTS users (id TEXT PRIMARY KEY, email TEXT NOT NULL UNIQUE, display_name TEXT, role TEXT NOT NULL DEFAULT 'owner', created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS products (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, name TEXT NOT NULL, slug TEXT NOT NULL UNIQUE, website_url TEXT NOT NULL, tagline TEXT NOT NULL, description TEXT NOT NULL, category TEXT, logo_key TEXT, screenshot_key TEXT, background_key TEXT, accent_color TEXT NOT NULL DEFAULT '#ff5c35', social_handle TEXT, disabled_at TEXT, created_at TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS reservations (id TEXT PRIMARY KEY, user_id TEXT, status TEXT NOT NULL, expires_at TEXT NOT NULL, expected_amount_cents INTEGER NOT NULL DEFAULT 0, is_outbid BOOLEAN NOT NULL DEFAULT FALSE, stripe_session_id TEXT UNIQUE, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS reservation_minutes (reservation_id TEXT NOT NULL, minute_index INTEGER NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE, PRIMARY KEY (reservation_id, minute_index))`,
  `CREATE TABLE IF NOT EXISTS ownerships (id TEXT PRIMARY KEY, user_id TEXT NOT NULL, reservation_id TEXT, product_id TEXT, purchased_at TEXT NOT NULL, purchase_price_cents INTEGER NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE)`,
  `CREATE TABLE IF NOT EXISTS ownership_minutes (ownership_id TEXT NOT NULL, minute_index INTEGER NOT NULL, active BOOLEAN NOT NULL DEFAULT TRUE, PRIMARY KEY (ownership_id, minute_index))`,
  `CREATE TABLE IF NOT EXISTS payments (id TEXT PRIMARY KEY, user_id TEXT, reservation_id TEXT, stripe_session_id TEXT NOT NULL UNIQUE, amount_cents INTEGER NOT NULL, currency TEXT NOT NULL DEFAULT 'usd', status TEXT NOT NULL, created_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS payment_provider_settings (key TEXT PRIMARY KEY, value TEXT NOT NULL, updated_at TEXT NOT NULL)`,
  `CREATE TABLE IF NOT EXISTS analytics_events (id TEXT PRIMARY KEY, event_type TEXT NOT NULL, minute_index INTEGER NOT NULL, visitor_hash TEXT, path TEXT, occurred_at TEXT NOT NULL)`,
];

function postgresSql(sqlText: string): string {
  let index = 0;
  const isIgnoreInsert = /INSERT\s+OR\s+IGNORE\s+INTO/i.test(sqlText);
  let result = sqlText.replace(/INSERT\s+OR\s+IGNORE\s+INTO/gi, "INSERT INTO");
  // D1 stores booleans as SQLite integers; Neon stores these columns as booleans.
  result = result.replace(/\b(active|is_outbid)\s*=\s*1\b/gi, "$1 = TRUE");
  result = result.replace(/\b(active|is_outbid)\s*=\s*0\b/gi, "$1 = FALSE");
  result = result.replace(/(reservation_minutes[^;]*VALUES\s*\([^)]*),\s*1\)/gi, "$1, TRUE)");
  result = result.replace(/(ownerships[^;]*active\)\s*VALUES\s*\([^)]*),\s*1\)/gi, "$1, TRUE)");
  result = result.replace(/\?/g, () => `$${++index}`);
  if (isIgnoreInsert) result = `${result} ON CONFLICT DO NOTHING`;
  return result;
}

export function createNeonD1(connectionString: string) {
  const sql = neon(connectionString);
  let initialized: Promise<void> | null = null;
  const ensureSchema = async () => {
    if (!initialized) initialized = schemaStatements.reduce((chain, statement) => chain.then(() => sql.query(statement, [])), Promise.resolve()).then(() => undefined);
    await initialized;
  };
  const statement = (text: string, values: unknown[] = []) => {
    const query = postgresSql(text);
    return {
      bind(...bound: unknown[]) {
        const normalized = /\bis_outbid\b/i.test(text)
          ? bound.map((value, index) => (index === 4 && (value === 0 || value === 1) ? Boolean(value) : value))
          : bound;
        return statement(text, normalized);
      },
      async first<T extends Row>(): Promise<T | null> {
        await ensureSchema();
        const rows = await sql.query<T>(query, values);
        return rows[0] ?? null;
      },
      async all<T extends Row>(): Promise<{ results: T[] }> {
        await ensureSchema();
        return { results: await sql.query<T>(query, values) };
      },
      async run(): Promise<{ success: true }> {
        await ensureSchema();
        await sql.query(query, values);
        return { success: true };
      },
    };
  };
  return {
    prepare(text: string) { return statement(text); },
    async batch(statements: ReturnType<typeof statement>[]) {
      await ensureSchema();
      await Promise.all(statements.map((item) => item.run()));
      return statements.map(() => ({ success: true }));
    },
  };
}
