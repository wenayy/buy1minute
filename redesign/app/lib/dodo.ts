const DYNAMIC_PRODUCT_KEY_PREFIX = "dodo_dynamic_product_id";

type DodoEnvironment = "test" | "live";

type DodoProduct = {
  product_id?: string;
  price?: {
    type?: string;
    pay_what_you_want?: boolean;
  };
};

function apiBase(environment: DodoEnvironment): string {
  return environment === "live" ? "https://live.dodopayments.com" : "https://test.dodopayments.com";
}

async function fetchDodo(apiKey: string, environment: DodoEnvironment, path: string, init?: RequestInit) {
  return fetch(`${apiBase(environment)}${path}`, {
    ...init,
    headers: {
      authorization: `Bearer ${apiKey}`,
      "content-type": "application/json",
      ...init?.headers,
    },
  });
}

async function isDynamicProduct(apiKey: string, environment: DodoEnvironment, productId: string): Promise<boolean> {
  try {
    const response = await fetchDodo(apiKey, environment, `/products/${encodeURIComponent(productId)}`);
    if (!response.ok) return false;
    const product = (await response.json()) as DodoProduct;
    return product.price?.type === "one_time_price" && product.price.pay_what_you_want === true;
  } catch {
    return false;
  }
}

export async function getOrCreateDynamicProduct(args: {
  apiKey: string;
  database: D1Database;
  environment: DodoEnvironment;
  configuredProductId?: string;
}): Promise<string> {
  const { apiKey, database, environment, configuredProductId } = args;
  const settingKey = `${DYNAMIC_PRODUCT_KEY_PREFIX}_${environment}`;

  await database.prepare(
    "CREATE TABLE IF NOT EXISTS payment_provider_settings (key TEXT PRIMARY KEY NOT NULL, value TEXT NOT NULL, updated_at TEXT NOT NULL)",
  ).run();

  const saved = await database
    .prepare("SELECT value FROM payment_provider_settings WHERE key = ?")
    .bind(settingKey)
    .first<{ value: string }>();

  for (const candidate of [saved?.value, configuredProductId]) {
    if (candidate && (await isDynamicProduct(apiKey, environment, candidate))) {
      if (saved?.value !== candidate) {
        await database.prepare(
          "INSERT INTO payment_provider_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
        ).bind(settingKey, candidate, new Date().toISOString()).run();
      }
      return candidate;
    }
  }

  const response = await fetchDodo(apiKey, environment, "/products", {
    method: "POST",
    body: JSON.stringify({
      name: "Buy1Minute Ownership Slot",
      description: "One permanent Buy1Minute daily 60-second homepage takeover slot.",
      tax_category: "digital_products",
      price: {
        currency: "USD",
        discount: 0,
        price: 100,
        suggested_price: 100,
        pay_what_you_want: true,
        type: "one_time_price",
      },
    }),
  });

  const product = (await response.json().catch(() => ({}))) as DodoProduct & { error?: string; message?: string };
  if (!response.ok || !product.product_id) {
    throw new Error(product.error ?? product.message ?? "Could not configure dynamic checkout product");
  }

  await database.prepare(
    "INSERT INTO payment_provider_settings (key, value, updated_at) VALUES (?, ?, ?) ON CONFLICT(key) DO UPDATE SET value = excluded.value, updated_at = excluded.updated_at",
  ).bind(settingKey, product.product_id, new Date().toISOString()).run();

  return product.product_id;
}

export function dodoCheckoutBase(environment: DodoEnvironment): string {
  return apiBase(environment);
}
