/**
 * Типы для MockChat — выделены в отдельный файл, чтобы wrapper и lazy chunk
 * могли разделять интерфейс без подтягивания тяжёлой реализации.
 */
import type { ChatMessage } from "@/types/entities";

export interface MockChatProps {
  title?: string;
  subtitle?: string;
  messages: ChatMessage[];
  variant?: "light" | "dark";
  className?: string;
}
