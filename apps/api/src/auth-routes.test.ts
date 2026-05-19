/**
 * Auth route smoke tests (Phase 1).
 * Run: pnpm --filter @botmate/api exec tsx --test src/auth-routes.test.ts
 */
import assert from "node:assert/strict";
import { test } from "node:test";
import { config } from "dotenv";
import { resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { buildServer } from "./server.js";
import { SESSION_COOKIE_NAME } from "./session/cookies.js";

const __dirname = fileURLToPath(new URL(".", import.meta.url));
config({ path: resolve(__dirname, "../.env") });

process.env.JWT_SECRET ??= "test-jwt-secret-minimum-32-characters-long";
process.env.ENCRYPTION_MASTER_KEY ??= "test-encryption-master-key-32chars";
process.env.DATABASE_URL ??=
  "postgresql://postgres:postgres@localhost:5432/botmate_assist?schema=public";

const hasDb = !!process.env.DATABASE_URL;

test("GET /api/v1/auth/me returns 401 without session", async (t) => {
  if (!hasDb) {
    t.skip("DATABASE_URL not configured");
    return;
  }
  const app = await buildServer();
  await app.ready();
  const res = await app.inject({
    method: "GET",
    url: "/api/v1/auth/me",
  });
  assert.equal(res.statusCode, 401);
  await app.close();
});

test("auth register/login/logout/me cookie lifecycle", async (t) => {
  if (!hasDb) {
    t.skip("DATABASE_URL not configured");
    return;
  }

  const app = await buildServer();
  await app.ready();
  const email = `phase1_${Date.now()}@example.com`;
  const password = "test-password-12";

  const register = await app.inject({
    method: "POST",
    url: "/api/v1/auth/register",
    payload: { email, password, fullName: "Phase One Test" },
  });
  assert.equal(register.statusCode, 201);
  const setCookie = register.headers["set-cookie"];
  assert.ok(setCookie);
  const cookieHeader = Array.isArray(setCookie) ? setCookie.join("; ") : setCookie;
  assert.match(cookieHeader, new RegExp(`${SESSION_COOKIE_NAME}=`));
  assert.match(cookieHeader, /HttpOnly/i);

  const me = await app.inject({
    method: "GET",
    url: "/api/v1/auth/me",
    headers: { cookie: cookieHeader },
  });
  assert.equal(me.statusCode, 200);
  const meBody = me.json() as { user: { email: string } };
  assert.equal(meBody.user.email, email);

  const logout = await app.inject({
    method: "POST",
    url: "/api/v1/auth/logout",
    headers: { cookie: cookieHeader },
  });
  assert.equal(logout.statusCode, 200);

  const meAfter = await app.inject({
    method: "GET",
    url: "/api/v1/auth/me",
    headers: { cookie: cookieHeader },
  });
  assert.equal(meAfter.statusCode, 401);

  await app.close();
});
