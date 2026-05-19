import { Prisma, PrismaClient } from "@prisma/client";

declare global {
  // eslint-disable-next-line no-var
  var __botmate_prisma__: PrismaClient | undefined;
}

export const prisma =
  global.__botmate_prisma__ ??
  new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  global.__botmate_prisma__ = prisma;
}

export { PrismaClient, Prisma };
export type { Role, SessionStatus, MessageRole, Provider, ToolInvocationStatus } from "@prisma/client";
