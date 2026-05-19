import type { RuntimeSubsystem } from "@botmate/shared";
import {
  bumpControlPlaneGovernanceBypassBlocked,
  bumpControlPlaneGovernanceBypassObserved,
} from "../production/production-metrics.js";
import { forbidControlPlaneGovernanceBypass } from "../production/production-strict.js";
import { bumpRuntimeGovernanceDenied } from "../runtime-metrics.js";

export type GovernanceGateResult =
  | { ok: true }
  | { ok: false; code: string; message: string };

function parseCsvLower(raw?: string): Set<string> {
  const set = new Set<string>();
  if (!raw?.trim()) return set;
  for (const part of raw.split(",")) {
    const v = part.trim().toLowerCase();
    if (v) set.add(v);
  }
  return set;
}

export function runtimeDrainEnabledHard(): boolean {
  return process.env.RUNTIME_DRAIN_MODE?.trim().toLowerCase() === "hard";
}

/** Tenant-wide interactive runtime denylist — CSV tenant ids. */
export function tenantRuntimeHardDenied(tenantId: string): boolean {
  const tenants = parseCsvLower(process.env.RUNTIME_DISABLED_TENANTS);
  return tenants.has(tenantId.trim().toLowerCase());
}

/** Global kill-switch — values `all`, `*` or comma-separated subsystem ids (assistant,tool,browser,...). */
export function subsystemEmergencyDisabled(subsystem: RuntimeSubsystem): boolean {
  const raw = process.env.RUNTIME_EMERGENCY_DISABLE?.trim().toLowerCase();
  if (!raw) return false;
  if (raw === "all" || raw === "*") return true;
  return parseCsvLower(process.env.RUNTIME_EMERGENCY_DISABLE).has(subsystem);
}

function drainDeniesSubsystem(subsystem: RuntimeSubsystem): boolean {
  if (!runtimeDrainEnabledHard()) return false;
  return subsystem === "assistant" || subsystem === "tool" || subsystem === "browser" || subsystem === "operator";
}

/**
 * Lightweight deterministic governance — env-driven emergency stops without workflow engines.
 * Set `CONTROL_PLANE_GOVERNANCE_ENABLED=false` to bypass entirely (rollback lever).
 */
export function evaluateRuntimeSubsystemGate(input: {
  tenantId: string;
  subsystem: RuntimeSubsystem;
}): GovernanceGateResult {
  if (process.env.CONTROL_PLANE_GOVERNANCE_ENABLED === "false") {
    bumpControlPlaneGovernanceBypassObserved();
    if (forbidControlPlaneGovernanceBypass()) {
      bumpControlPlaneGovernanceBypassBlocked();
      bumpRuntimeGovernanceDenied();
      return {
        ok: false,
        code: "GOVERNANCE_BYPASS_FORBIDDEN",
        message:
          "CONTROL_PLANE_GOVERNANCE_ENABLED=false is forbidden when BOTMATE_PRODUCTION_STRICT=true",
      };
    }
    return { ok: true };
  }

  if (tenantRuntimeHardDenied(input.tenantId)) {
    bumpRuntimeGovernanceDenied();
    return {
      ok: false,
      code: "RUNTIME_TENANT_DISABLED",
      message: "Tenant runtime interactions disabled via RUNTIME_DISABLED_TENANTS",
    };
  }

  if (subsystemEmergencyDisabled(input.subsystem)) {
    bumpRuntimeGovernanceDenied();
    return {
      ok: false,
      code: "RUNTIME_EMERGENCY_DISABLE",
      message: `Subsystem ${input.subsystem} emergency-disabled via RUNTIME_EMERGENCY_DISABLE`,
    };
  }

  if (drainDeniesSubsystem(input.subsystem)) {
    bumpRuntimeGovernanceDenied();
    return {
      ok: false,
      code: "RUNTIME_DRAIN_MODE",
      message: "Runtime drain mode active — new executions rejected",
    };
  }

  return { ok: true };
}
