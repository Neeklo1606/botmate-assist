import { ToolPermissionDeniedError } from "../tool-runtime.js";
import type { ToolRiskTier } from "../tool-runtime.js";

export type WorkspaceRole = "OWNER" | "ADMIN" | "OPERATOR";

export function assertToolRiskTierAllowed(input: {
  toolId: string;
  tier: ToolRiskTier | undefined;
  userRole: WorkspaceRole | undefined;
  dangerousEnabled: ReadonlySet<string>;
}): void {
  const tier = input.tier ?? "standard";
  const role = input.userRole;

  if (tier === "elevated") {
    if (role !== "OWNER" && role !== "ADMIN") {
      throw new ToolPermissionDeniedError(input.toolId);
    }
  }

  if (tier === "dangerous") {
    if (!input.dangerousEnabled.has(input.toolId)) {
      throw new ToolPermissionDeniedError(input.toolId);
    }
    if (role !== "OWNER" && role !== "ADMIN") {
      throw new ToolPermissionDeniedError(input.toolId);
    }
  }
}
