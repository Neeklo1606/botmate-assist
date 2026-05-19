/**
 * AssistantLivePreview — мини-кабинет ассистента, обновляется по мере брифа.
 */
import { motion } from "framer-motion";
import * as Icons from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { initials } from "@/lib/onboarding/shared";

interface Props {
  data: Record<string, unknown>;
}

const INDUSTRY_LABEL: Record<string, string> = {
  realestate: "НЕДВИЖИМОСТЬ",
  auto: "АВТО",
  clinic: "КЛИНИКА",
  services: "УСЛУГИ",
  edu: "ОБРАЗОВАНИЕ",
  retail: "РОЗНИЦА",
  agency: "АГЕНТСТВО",
  other: "ДРУГОЕ",
};

const TASK_META: Record<string, { label: string; icon: string }> = {
  qualify: { label: "Квалифицирует заявки", icon: "Filter" },
  sell: { label: "Ведёт по воронке", icon: "TrendingUp" },
  support: { label: "Отвечает на вопросы", icon: "LifeBuoy" },
  book: { label: "Записывает на встречу", icon: "Calendar" },
  calculate: { label: "Считает стоимость", icon: "Calculator" },
  collect: { label: "Собирает данные", icon: "Database" },
};

const CHANNEL_LABEL: Record<string, string> = {
  telegram: "Telegram",
  website: "Сайт",
  avito: "Avito",
  vk: "ВКонтакте",
  whatsapp: "WhatsApp",
  instagram: "Instagram",
};

const TONE_DEFAULT_GREETING: Record<string, string> = {
  friendly: "Привет! Расскажите, что ищете — помогу подобрать",
  neutral: "Здравствуйте. Чем мы можем вам помочь?",
  business: "Добрый день. Опишите запрос, обработаем в порядке очереди.",
  energetic: "Привет! Готов помочь — что нужно?",
};

function getIcon(name: string): LucideIcon {
  const c = (Icons as unknown as Record<string, LucideIcon>)[name];
  return c ?? Icons.Circle;
}

export function AssistantLivePreview({ data }: Props) {
  const companyName = (data.companyName as string) || "";
  const industry = (data.industry as string) || "";
  const tasks = Array.isArray(data.tasks) ? (data.tasks as string[]) : [];
  const channels = Array.isArray(data.channels) ? (data.channels as string[]) : [];
  const tone = (data.tone as string) || "";
  const greeting = (data.greeting as string) || "";
  const greetingText = greeting || (tone ? TONE_DEFAULT_GREETING[tone] : "");

  return (
    <div className="flex flex-col overflow-hidden rounded-2xl border border-border-dark bg-bg-elevated">
      {/* Top */}
      <div className="flex h-9 items-center justify-between border-b border-border-dark bg-bg-soft px-3.5">
        <span className="font-mono text-[10px] text-ink-dark-subtle">
          botme.app/inbox
        </span>
        <span className="flex items-center gap-1.5 font-mono text-[10px] text-ink-dark-subtle">
          <span className="h-1.5 w-1.5 rounded-full bg-accent" />
          live preview
        </span>
      </div>

      {/* Content */}
      <div className="flex flex-col gap-5 p-5">
        {/* Profile */}
        <motion.div layout className="flex items-center gap-3.5">
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/15 font-mono text-[14px] text-accent">
            {initials(companyName)}
          </div>
          <div className="min-w-0 flex-1">
            <div className="truncate text-[16px] font-medium text-ink-dark">
              {companyName || "Ассистент"}
            </div>
            <div className="mt-1 flex flex-wrap items-center gap-2">
              <span className="flex items-center gap-1.5 text-[11px] text-ink-dark-muted">
                <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                онлайн
              </span>
              {industry && (
                <span className="rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[10px] uppercase text-accent">
                  {INDUSTRY_LABEL[industry] ?? industry}
                </span>
              )}
            </div>
          </div>
        </motion.div>

        {/* Tasks */}
        <motion.div layout>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-ink-dark-subtle">
            Делает
          </div>
          {tasks.length === 0 ? (
            <p className="text-[13px] italic text-ink-dark-subtle">
              Выберите задачи на шаге 2
            </p>
          ) : (
            <ul className="flex flex-col gap-2">
              {tasks.map((t) => {
                const meta = TASK_META[t];
                const Icon = getIcon(meta?.icon ?? "Circle");
                return (
                  <li key={t} className="flex items-center gap-2 text-[13px] text-ink-dark">
                    <Icon className="h-3.5 w-3.5 text-accent" />
                    {meta?.label ?? t}
                  </li>
                );
              })}
            </ul>
          )}
        </motion.div>

        {/* Channels */}
        <motion.div layout>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-ink-dark-subtle">
            Каналы
          </div>
          {channels.length === 0 ? (
            <p className="text-[13px] italic text-ink-dark-subtle">
              Выберите каналы на шаге 3
            </p>
          ) : (
            <div className="flex flex-wrap gap-1.5">
              {channels.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1.5 rounded-full bg-bg-soft px-2.5 py-1 text-[11px] text-ink-dark"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-accent" />
                  {CHANNEL_LABEL[c] ?? c}
                </span>
              ))}
            </div>
          )}
        </motion.div>

        {/* Greeting bubble */}
        <motion.div layout>
          <div className="mb-2 font-mono text-[10px] uppercase tracking-wide text-ink-dark-subtle">
            Приветствие
          </div>
          {greetingText ? (
            <div className="max-w-[90%] rounded-[14px] rounded-bl-[4px] border border-border-dark bg-bg-soft px-3.5 py-3 text-[13px] text-ink-dark">
              {greetingText}
            </div>
          ) : (
            <p className="text-[13px] italic text-ink-dark-subtle">
              Сообщение появится после выбора тона
            </p>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="border-t border-border-dark bg-bg-base px-4 py-3 text-[12px] text-ink-dark-muted">
        Это предварительный вариант. Полную настройку сделаем после регистрации.
      </div>
    </div>
  );
}
