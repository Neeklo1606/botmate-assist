import type { ProjectDto } from "@botmate/shared";
import type { Project } from "./types";

export function dtoToProject(dto: ProjectDto): Project {
  return {
    id: dto.id,
    userId: dto.userId,
    kind: dto.kind,
    name: dto.name,
    status: dto.status,
    briefData: dto.briefData,
    stats: dto.stats as Project["stats"],
    createdAt: dto.createdAt,
    updatedAt: dto.updatedAt,
    readyAt: dto.readyAt,
  };
}
