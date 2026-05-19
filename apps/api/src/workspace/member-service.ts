import type { PrismaClient } from "@botmate/database";
import type { Role } from "@botmate/shared";
import { TenantOperationalError } from "@botmate/runtime";
import { assertTenantOperational } from "./workspace-saas-service.js";

function isOwner(role: string): boolean {
  return role === "OWNER";
}

function isAdmin(role: string): boolean {
  return role === "ADMIN" || role === "OWNER";
}

export async function updateMemberRole(
  prisma: PrismaClient,
  input: {
    tenantId: string;
    actorUserId: string;
    actorRole: Role;
    targetUserId: string;
    newRole: Exclude<Role, "OWNER">;
  },
) {
  if (!isAdmin(input.actorRole)) {
    throw new TenantOperationalError("FORBIDDEN_001", "ADMIN or OWNER required", 403);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    select: { suspendedAt: true, archivedAt: true },
  });
  if (!tenant) throw new TenantOperationalError("NOT_FOUND_001", "Tenant not found", 404);
  assertTenantOperational(tenant);

  const target = await prisma.user.findFirst({
    where: { id: input.targetUserId, tenantId: input.tenantId },
  });
  if (!target) throw new TenantOperationalError("NOT_FOUND_001", "Member not found", 404);
  if (isOwner(target.role)) {
    throw new TenantOperationalError("CANNOT_CHANGE_OWNER", "Cannot change owner role via API", 403);
  }
  if (input.actorRole === "ADMIN" && input.newRole === "ADMIN") {
    // allowed
  }
  if (input.targetUserId === input.actorUserId && input.newRole === "VIEWER") {
    throw new TenantOperationalError("CANNOT_DEMOTE_SELF", "Cannot demote yourself to viewer", 403);
  }

  const updated = await prisma.user.update({
    where: { id: target.id },
    data: { role: input.newRole },
    select: { id: true, email: true, fullName: true, role: true, createdAt: true },
  });

  return updated;
}

export async function removeMember(
  prisma: PrismaClient,
  input: {
    tenantId: string;
    actorUserId: string;
    actorRole: Role;
    targetUserId: string;
  },
) {
  if (!isAdmin(input.actorRole)) {
    throw new TenantOperationalError("FORBIDDEN_001", "ADMIN or OWNER required", 403);
  }

  const tenant = await prisma.tenant.findUnique({
    where: { id: input.tenantId },
    select: { suspendedAt: true, archivedAt: true },
  });
  if (!tenant) throw new TenantOperationalError("NOT_FOUND_001", "Tenant not found", 404);
  assertTenantOperational(tenant);

  if (input.targetUserId === input.actorUserId) {
    throw new TenantOperationalError("CANNOT_REMOVE_SELF", "Cannot remove yourself", 403);
  }

  const target = await prisma.user.findFirst({
    where: { id: input.targetUserId, tenantId: input.tenantId },
  });
  if (!target) throw new TenantOperationalError("NOT_FOUND_001", "Member not found", 404);

  if (isOwner(target.role)) {
    const ownerCount = await prisma.user.count({
      where: { tenantId: input.tenantId, role: "OWNER" },
    });
    if (ownerCount <= 1) {
      throw new TenantOperationalError("LAST_OWNER", "Cannot remove the only owner", 403);
    }
  }

  await prisma.user.delete({ where: { id: target.id } });
}
