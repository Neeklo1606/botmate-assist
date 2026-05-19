import type { PrismaClient } from "@botmate/database";
import type { Role } from "@botmate/shared";
import { assertCanAddWorkspaceMember, PlanLimitError, TenantOperationalError } from "@botmate/runtime";
import { normalizeEmail } from "../password.js";
import { buildInviteAcceptUrl, generateInviteToken, hashInviteToken } from "./invite-token.js";
import { assertTenantOperational } from "./workspace-saas-service.js";

const INVITE_TTL_MS = 7 * 86_400_000;

export async function createWorkspaceInvite(
  prisma: PrismaClient,
  input: {
    tenantId: string;
    invitedByUserId: string;
    email: string;
    role: Exclude<Role, "OWNER">;
  },
) {
  const tenant = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    select: { suspendedAt: true, archivedAt: true, name: true },
  });
  if (!tenant) throw new TenantOperationalError("NOT_FOUND_001", "Tenant not found", 404);
  assertTenantOperational(tenant);

  await assertCanAddWorkspaceMember(prisma, input.tenantId);

  const email = normalizeEmail(input.email);

  const existingUser = await prisma.user.findUnique({ where: { email } });
  if (existingUser) {
    if (existingUser.tenantId === input.tenantId) {
      throw new TenantOperationalError("INVITE_ALREADY_MEMBER", "User is already in this workspace", 409);
    }
    throw new TenantOperationalError(
      "INVITE_EMAIL_TAKEN",
      "Email belongs to another workspace",
      409,
    );
  }

  const pending = await prisma.tenantInvite.findUnique({
    where: { tenantId_email: { tenantId: input.tenantId, email } },
  });
  if (pending && !pending.revokedAt && !pending.acceptedAt && pending.expiresAt > new Date()) {
    throw new TenantOperationalError("INVITE_PENDING_EXISTS", "Pending invite already exists", 409);
  }

  const rawToken = generateInviteToken();
  const tokenHash = hashInviteToken(rawToken);
  const expiresAt = new Date(Date.now() + INVITE_TTL_MS);

  const invite = await prisma.tenantInvite.upsert({
    where: { tenantId_email: { tenantId: input.tenantId, email } },
    create: {
      tenantId: input.tenantId,
      email,
      role: input.role,
      tokenHash,
      invitedByUserId: input.invitedByUserId,
      expiresAt,
    },
    update: {
      role: input.role,
      tokenHash,
      invitedByUserId: input.invitedByUserId,
      expiresAt,
      revokedAt: null,
      acceptedAt: null,
    },
  });

  const inviteUrl = buildInviteAcceptUrl(rawToken);
  const emailPreview = {
    subject: `Join ${tenant.name} on Botmate`,
    body: `You have been invited to join ${tenant.name}.\n\nAccept: ${inviteUrl}\n\nExpires: ${expiresAt.toISOString()}`,
  };

  return {
    invite,
    inviteUrl,
    emailPreview,
    status: "pending" as const,
  };
}

export async function listWorkspaceInvites(prisma: PrismaClient, tenantId: string) {
  const rows = await prisma.tenantInvite.findMany({
    where: { tenantId },
    orderBy: { createdAt: "desc" },
    take: 50,
  });
  const now = new Date();
  return rows.map((r) => ({
    id: r.id,
    email: r.email,
    role: r.role,
    status:
      r.acceptedAt ? ("accepted" as const)
      : r.revokedAt ? ("revoked" as const)
      : r.expiresAt <= now ? ("expired" as const)
      : ("pending" as const),
    expiresAt: r.expiresAt.toISOString(),
    createdAt: r.createdAt.toISOString(),
  }));
}

export async function revokeWorkspaceInvite(
  prisma: PrismaClient,
  tenantId: string,
  inviteId: string,
) {
  const row = await prisma.tenantInvite.findFirst({
    where: { id: inviteId, tenantId },
  });
  if (!row) throw new TenantOperationalError("NOT_FOUND_001", "Invite not found", 404);
  if (row.acceptedAt) {
    throw new TenantOperationalError("INVITE_ALREADY_ACCEPTED", "Invite already accepted", 409);
  }
  await prisma.tenantInvite.update({
    where: { id: inviteId },
    data: { revokedAt: new Date() },
  });
}

export async function acceptWorkspaceInvite(
  prisma: PrismaClient,
  input: { token: string; password: string; fullName: string },
) {
  const tokenHash = hashInviteToken(input.token.trim());
  const invite = await prisma.tenantInvite.findUnique({
    where: { tokenHash },
    include: { tenant: { select: { suspendedAt: true, archivedAt: true, name: true } } },
  });
  if (!invite || invite.revokedAt || invite.acceptedAt) {
    throw new TenantOperationalError("INVITE_INVALID", "Invalid or used invite", 400);
  }
  if (invite.expiresAt <= new Date()) {
    throw new TenantOperationalError("INVITE_EXPIRED", "Invite expired", 410);
  }
  assertTenantOperational(invite.tenant);

  const email = invite.email;
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    throw new TenantOperationalError("INVITE_EMAIL_TAKEN", "Email already registered", 409);
  }

  await assertCanAddWorkspaceMember(prisma, invite.tenantId);

  const { hashPassword } = await import("../password.js");
  const user = await prisma.$transaction(async (tx) => {
    const created = await tx.user.create({
      data: {
        tenantId: invite.tenantId,
        email,
        fullName: input.fullName.trim(),
        passwordHash: hashPassword(input.password),
        role: invite.role,
      },
    });
    await tx.tenantInvite.update({
      where: { id: invite.id },
      data: { acceptedAt: new Date() },
    });
    return created;
  });

  return {
    user: {
      id: user.id,
      tenantId: user.tenantId,
      email: user.email,
      fullName: user.fullName,
      role: user.role,
    },
    tenantName: invite.tenant.name,
  };
}

export { PlanLimitError, TenantOperationalError };
