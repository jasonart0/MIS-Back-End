import assert from "node:assert/strict";
import { after, test } from "node:test";

process.env.DATABASE_URL ??= "postgresql://local:local@127.0.0.1:1/mis_db?schema=public";
process.env.NODE_ENV = "development";
process.env.ALLOW_UNAUTHENTICATED_WRITES = "false";

const [{ app }, { prisma }, { env }] = await Promise.all([
  import("../src/app.js"),
  import("../src/core/database/prisma.js"),
  import("../src/config/env.js"),
]);
const server = app.listen(0);
await new Promise<void>((resolve, reject) => {
  server.once("error", reject);
  server.once("listening", resolve);
});
const address = server.address();
if (!address || typeof address === "string") throw new Error("Test HTTP server did not bind.");
const baseUrl = `http://127.0.0.1:${address.port}`;

after(async () => {
  await new Promise<void>((resolve, reject) => {
    server.close((error) => (error ? reject(error) : resolve()));
  });
  await prisma.$disconnect();
});

test("health endpoint is available without a database", async () => {
  const response = await fetch(`${baseUrl}/api/health`);
  assert.equal(response.status, 200);
  assert.deepEqual(await response.json(), { status: "ok" });
});

test("database health returns a sanitized unavailable response when PostgreSQL is offline", async () => {
  const response = await fetch(`${baseUrl}/api/health/database`);
  assert.equal(response.status, 503);
  const body = await response.json();
  assert.equal(body.error.code, "database_unavailable");
  assert.equal(JSON.stringify(body).includes("127.0.0.1"), false);
});

test("writes are denied unless the local development opt-in is enabled", async () => {
  const response = await fetch(`${baseUrl}/api/growth-hub/sales/leads`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ firstName: "Avery", lastName: "Morgan" }),
  });
  assert.equal(response.status, 403);
  assert.equal((await response.json()).error.code, "authentication_required");
});

test("sales data endpoints are disabled in production until authentication is configured", async () => {
  env.NODE_ENV = "production";
  try {
    const response = await fetch(`${baseUrl}/api/growth-hub/sales/leads`);
    assert.equal(response.status, 503);
    assert.equal((await response.json()).error.code, "authentication_not_configured");
  } finally {
    env.NODE_ENV = "development";
  }
});

test("malformed JSON receives a client error response", async () => {
  const response = await fetch(`${baseUrl}/api/growth-hub/sales/leads`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{",
  });
  assert.equal(response.status, 400);
  assert.equal((await response.json()).error.code, "invalid_json");
});
