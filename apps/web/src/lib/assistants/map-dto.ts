import type { AssistantDto } from "@botmate/shared";
import type { Assistant } from "@/types/entities";

export function dtoToAssistant(dto: AssistantDto): Assistant {
  return {
    id: dto.id,
    name: dto.name,
    niche: dto.niche,
    status: dto.status,
    channels: dto.channels,
    conversations7d: dto.conversations7d,
    leads7d: dto.leads7d,
    conversion: dto.conversion,
    updatedAt: dto.updatedAt,
  };
}
