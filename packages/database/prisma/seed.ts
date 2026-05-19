/**
 * Dev-only database seed. Never runs in production unless explicitly enabled.
 *
 * Required when ENABLE_DEV_SEED=true:
 *   DEV_SEED_EMAIL, DEV_SEED_PASSWORD, DEV_SEED_NAME (optional)
 */
import { PrismaClient } from "@prisma/client";
import { randomBytes, scryptSync } from "node:crypto";

const prisma = new PrismaClient();

const SCRYPT_N = 16384;
const SCRYPT_R = 8;
const SCRYPT_P = 1;
const KEY_LEN = 64;

/** Must match apps/api/src/password.ts */
function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LEN, {
    N: SCRYPT_N,
    r: SCRYPT_R,
    p: SCRYPT_P,
  }).toString("hex");
  return `scrypt$${salt}$${derived}`;
}

async function main() {
  if (process.env.ENABLE_DEMO_SEED === "true") {
    const { runDemoRuntimeSeed } = await import("./demo-runtime-seed.js");
    await runDemoRuntimeSeed(prisma);
    return;
  }

  if (process.env.ENABLE_DEV_SEED !== "true") {
    console.log(
      "[seed] Skipped (ENABLE_DEV_SEED=true for dev user, ENABLE_DEMO_SEED=true for sales demo data)",
    );
    return;
  }

  const email = process.env.DEV_SEED_EMAIL?.trim().toLowerCase();
  const password = process.env.DEV_SEED_PASSWORD;
  const fullName = process.env.DEV_SEED_NAME?.trim() || "Dev User";

  if (!email || !password) {
    throw new Error(
      "[seed] DEV_SEED_EMAIL and DEV_SEED_PASSWORD are required when ENABLE_DEV_SEED=true",
    );
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    console.log(`[seed] User already exists: ${email}`);
    return;
  }

  const tenant = await prisma.tenant.create({
    data: { name: `${email.split("@")[0]}-workspace` },
  });

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email,
      fullName,
      passwordHash: hashPassword(password),
      role: "ADMIN",
    },
  });

  console.log(`[seed] Created dev user ${email} in tenant ${tenant.id}`);
}

main()
  .catch((err) => {
    console.error("[seed] Failed:", err);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
