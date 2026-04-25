import { prisma } from "./prisma";
import { hashPassword, normalizeEmail, verifyPassword } from "./password";

const DEFAULT_SEED_EMAIL = "dsc-23@yandex.ru";
const DEFAULT_SEED_PASSWORD = "123123123";
const DEFAULT_SEED_NAME = "Джон Уик";

export interface AuthUserView {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: "OWNER" | "ADMIN" | "OPERATOR";
}

function toAuthView(input: {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: "OWNER" | "ADMIN" | "OPERATOR";
}): AuthUserView {
  return {
    id: input.id,
    tenantId: input.tenantId,
    email: input.email,
    fullName: input.fullName,
    role: input.role,
  };
}

export async function registerUser(input: {
  email: string;
  password: string;
  fullName: string;
}): Promise<{ status: "created"; user: AuthUserView } | { status: "exists" }> {
  const email = normalizeEmail(input.email);
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { status: "exists" };
  }

  const tenant = await prisma.tenant.create({
    data: {
      name: `${email}-workspace`,
    },
  });

  const row = await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email,
      fullName: input.fullName.trim(),
      passwordHash: hashPassword(input.password),
      role: "ADMIN",
    },
  });

  return {
    status: "created",
    user: toAuthView({
      id: row.id,
      tenantId: row.tenantId,
      email: row.email,
      fullName: row.fullName,
      role: row.role,
    }),
  };
}

export async function loginUser(input: {
  email: string;
  password: string;
}): Promise<{ status: "ok"; user: AuthUserView } | { status: "invalid" }> {
  const email = normalizeEmail(input.email);
  const row = await prisma.user.findUnique({ where: { email } });
  if (!row) {
    return { status: "invalid" };
  }
  const valid = verifyPassword(input.password, row.passwordHash);
  if (!valid) {
    return { status: "invalid" };
  }
  return {
    status: "ok",
    user: toAuthView({
      id: row.id,
      tenantId: row.tenantId,
      email: row.email,
      fullName: row.fullName,
      role: row.role,
    }),
  };
}

export async function ensureDefaultSeedUser(): Promise<void> {
  const existing = await prisma.user.findUnique({
    where: { email: DEFAULT_SEED_EMAIL },
  });
  if (existing) {
    return;
  }

  const tenant = await prisma.tenant.create({
    data: { name: "dsc-23-workspace" },
  });

  await prisma.user.create({
    data: {
      tenantId: tenant.id,
      email: DEFAULT_SEED_EMAIL,
      fullName: DEFAULT_SEED_NAME,
      passwordHash: hashPassword(DEFAULT_SEED_PASSWORD),
      role: "ADMIN",
    },
  });
}
