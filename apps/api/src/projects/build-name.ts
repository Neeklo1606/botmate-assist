import type { ProjectKind } from "@botmate/shared";

export function buildProjectName(kind: ProjectKind, data: Record<string, unknown>): string {
  const brand =
    (data.brandName as string) ||
    (data.companyName as string) ||
    (data.offer as string) ||
    "";
  const fallback: Record<ProjectKind, string> = {
    assistant: "Ваш ассистент",
    media: "Ваша медиа-студия",
    site: "Ваш лендинг",
  };
  if (!brand.trim()) return fallback[kind];
  const prefix: Record<ProjectKind, string> = {
    assistant: "Ассистент",
    media: "Медиа-студия",
    site: "Лендинг",
  };
  return `${prefix[kind]} · ${brand.trim().slice(0, 40)}`;
}
