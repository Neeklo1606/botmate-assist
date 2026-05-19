import { z } from "zod";

export const ToolExecutionActionDescriptorSchema = z.object({
  kind: z.literal("TOOL_EXECUTION"),
  toolId: z.string().min(1).optional(),
});

export const BrowserCommandActionDescriptorSchema = z.object({
  kind: z.literal("BROWSER_COMMAND"),
  commandType: z.string().min(1).optional(),
});

export const OperatorActionDescriptorSchema = z.object({
  kind: z.literal("OPERATOR_ACTION"),
  actionType: z.string().min(1).optional(),
});

export const ReplayExecutionActionDescriptorSchema = z.object({
  kind: z.literal("REPLAY_EXECUTION"),
  replayMode: z.enum(["observe", "mutate", "unknown"]).optional(),
  replayReason: z.string().max(512).optional(),
  replayOriginExecutionId: z.string().min(1).optional(),
});

export const SafeSystemActionSurfaceSchema = z.enum(["browser.cleanup", "artifact.cleanup"]);

export const SafeSystemActionDescriptorSchema = z.object({
  kind: z.literal("SAFE_SYSTEM_ACTION"),
  surface: SafeSystemActionSurfaceSchema,
});

export const QueueJobActionDescriptorSchema = z.object({
  kind: z.literal("QUEUE_JOB"),
  jobName: z.string().min(1),
});

export const ArtifactAccessActionDescriptorSchema = z.object({
  kind: z.literal("ARTIFACT_ACCESS"),
  artifactId: z.string().min(1).optional(),
  access: z.enum(["read", "write", "delete"]).optional(),
});

export const McpCallActionDescriptorSchema = z.object({
  kind: z.literal("MCP_CALL"),
  serverId: z.string().min(1).optional(),
  toolId: z.string().min(1).optional(),
});

export const PolicyActionDescriptorSchema = z.discriminatedUnion("kind", [
  ToolExecutionActionDescriptorSchema,
  BrowserCommandActionDescriptorSchema,
  OperatorActionDescriptorSchema,
  ReplayExecutionActionDescriptorSchema,
  SafeSystemActionDescriptorSchema,
  QueueJobActionDescriptorSchema,
  ArtifactAccessActionDescriptorSchema,
  McpCallActionDescriptorSchema,
]);

export type PolicyActionDescriptor = z.infer<typeof PolicyActionDescriptorSchema>;
