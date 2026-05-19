import type { AuthUser } from "@botmate/shared";
import type { User } from "@/types/entities";

function buildInitials(name: string): string {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length >= 2) return (parts[0]![0]! + parts[1]![0]!).toUpperCase();
  return (parts[0]?.slice(0, 2) || "BM").toUpperCase();
}

function mapRole(role: AuthUser["role"]): User["role"] {
  switch (role) {
    case "OWNER":
      return "owner";
    case "ADMIN":
      return "admin";
    case "OPERATOR":
    case "VIEWER":
    default:
      return "editor";
  }
}

export function mapAuthUserToEntity(user: AuthUser): User {
  const localPart = user.email.split("@")[0] ?? "user";
  return {
    id: user.id,
    name: user.fullName,
    username: `@${localPart}`,
    email: user.email,
    avatarInitials: buildInitials(user.fullName),
    workspaceName: "Workspace",
    role: mapRole(user.role),
    plan: "start",
    tenantId: user.tenantId,
  };
}
