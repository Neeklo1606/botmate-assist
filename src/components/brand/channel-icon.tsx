/**
 * ChannelIcon — рендерит SVG-иконку под type канала.
 * Не цветные (line-style), наследуют currentColor.
 */
import {
  MessageCircle,
  Globe,
  Tag,
  Send,
  MessageSquare,
  Instagram,
  type LucideIcon,
} from "lucide-react";
import type { ChannelId } from "@/types/entities";
import { cn } from "@/lib/utils";

const map: Record<ChannelId, LucideIcon> = {
  telegram: Send,
  website: Globe,
  avito: Tag,
  vk: MessageSquare,
  whatsapp: MessageCircle,
  instagram: Instagram,
};

interface ChannelIconProps {
  id: ChannelId;
  className?: string;
}

export function ChannelIcon({ id, className }: ChannelIconProps) {
  const Icon = map[id];
  return <Icon strokeWidth={1.5} className={cn("h-5 w-5", className)} />;
}
