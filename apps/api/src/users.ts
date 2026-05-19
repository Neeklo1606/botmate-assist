import { prisma } from "@botmate/database";
import { hashPassword, normalizeEmail, verifyPassword } from "./password";

export interface AuthUserView {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: "OWNER" | "ADMIN" | "OPERATOR" | "VIEWER";
}

function toAuthView(input: {
  id: string;
  tenantId: string;
  email: string;
  fullName: string;
  role: "OWNER" | "ADMIN" | "OPERATOR" | "VIEWER";
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
      role: "OWNER",
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

