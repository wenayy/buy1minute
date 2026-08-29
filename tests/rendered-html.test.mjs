import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";

import { parseDollarAmountToCents } from "../app/lib/pricing.ts";

test("parses exact custom checkout amounts in cents", () => {
  assert.equal(parseDollarAmountToCents("99"), 9_900);
  assert.equal(parseDollarAmountToCents("99.9"), null);
  assert.equal(parseDollarAmountToCents("99.95"), null);
  assert.equal(parseDollarAmountToCents("0.01"), null);
  assert.equal(parseDollarAmountToCents("999"), 99_900);
  assert.equal(parseDollarAmountToCents("$99"), null);
});

test("checkout is server-limited to one minute and uses a dynamic cart amount", async () => {
  const route = await readFile(new URL("../app/api/checkout/route.ts", import.meta.url), "utf8");
  assert.match(route, /value\.length !== 1/);
  assert.match(route, /product_cart:\s*\[\{ product_id: productId, quantity: 1, amount: totalCents \}\]/);
  assert.match(route, /getOrCreateDynamicProduct/);
  assert.doesNotMatch(route, /value\.length > 10/);
});

test("payment confirmation uses the stored reservation amount and minute", async () => {
  const webhook = await readFile(new URL("../app/api/webhooks/dodo/route.ts", import.meta.url), "utf8");
  assert.match(webhook, /metadataAmount !== reservation\.expected_amount_cents/);
  assert.match(webhook, /indices\.length !== 1/);
  assert.match(webhook, /UPDATE ownership_minutes SET active = 0/);
});

test("live Visit hover remains high-contrast and long names stay contained", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.owned-takeover \.owner-cta:hover\{background:#0a0a09;color:#fff/);
  assert.match(css, /\.owned-takeover \.owner-heading h1\{[^}]*15cqw[^}]*overflow-wrap:anywhere/);
});

test("outbid action is visible without hover", async () => {
  const css = await readFile(new URL("../app/globals.css", import.meta.url), "utf8");
  assert.match(css, /\.outbid-link\{[^}]*color:#0a0a09!important[^}]*border:1px solid/);
  assert.match(css, /\.outbid-link:hover,.outbid-link:focus-visible\{[^}]*background:#ff4e24/);
});
