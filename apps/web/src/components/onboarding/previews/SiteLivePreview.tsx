/**
 * SiteLivePreview — мини-лендинг, растущий по мере заполнения брифа.
 */
import { AnimatePresence, motion } from "framer-motion";
import { Check } from "lucide-react";

interface Props {
  data: Record<string, unknown>;
}

const TYPE_LABEL: Record<string, string> = {
  expert: "ЭКСПЕРТ",
  service: "УСЛУГА",
  course: "КУРС",
  local: "ЛОКАЛЬНЫЙ",
  event: "СОБЫТИЕ",
  freebie: "ЛИД-МАГНИТ",
};

const TYPE_CTA: Record<string, string> = {
  expert: "Записаться",
  course: "Записаться",
  service: "Заказать",
  local: "Забронировать",
  event: "Зарегистрироваться",
  freebie: "Скачать",
};

const PAIN_LABEL: Record<string, string> = {
  notime: "Нет времени",
  cost: "Дорого",
  skill: "Нет навыков",
  results: "Не получается",
  trust: "Не доверяют",
  choice: "Слишком много вариантов",
  fear: "Страх неудачи",
  support: "Нужна поддержка",
};

const BENEFIT_LABEL: Record<string, string> = {
  speed: "Быстрый результат",
  guarantee: "Гарантия возврата",
  personal: "Индивидуальный подход",
  support_24_7: "Поддержка 24/7",
  community: "Закрытое комьюнити",
  online: "Полностью онлайн",
  certificate: "Сертификат",
  bonus: "Бонусы",
};

const fadeUp = {
  initial: { opacity: 0, y: 12, scale: 0.96 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, y: -8 },
  transition: { duration: 0.35, ease: [0.2, 0.8, 0.2, 1] as [number, number, number, number] },
};

export function SiteLivePreview({ data }: Props) {
  const name = (data.name as string) || "";
  const type = (data.type as string) || "";
  const offerName = (data.offerName as string) || "";
  const offerDesc = (data.offerDescription as string) || "";
  const price = data.price as number | undefined;
  const audience = (data.audience as string) || "";
  const pains = Array.isArray(data.audiencePains) ? (data.audiencePains as string[]) : [];
  const mainResult = (data.mainResult as string) || "";
  const benefits = Array.isArray(data.additionalBenefits)
    ? (data.additionalBenefits as string[])
    : [];
  const yearsExp = data.yearsExp as number | undefined;
  const clientsCount = data.clientsCount as number | undefined;
  const testimonial = (data.testimonial as string) || "";
  const leadDestination = (data.leadDestination as string) || "";

  const ctaText = TYPE_CTA[type] ?? "Узнать больше";

  return (
    <div className="overflow-hidden rounded-2xl border border-border-dark bg-bg-base">
      {/* Browser bar */}
      <div className="flex h-7 items-center gap-1.5 border-b border-border-dark bg-bg-soft px-3">
        <span className="h-2 w-2 rounded-full bg-border-dark-strong" />
        <span className="h-2 w-2 rounded-full bg-border-dark-strong" />
        <span className="h-2 w-2 rounded-full bg-border-dark-strong" />
        <span className="ml-2 truncate font-mono text-[10px] text-ink-dark-subtle">
          {name ? `${name.toLowerCase().replace(/\s+/g, "-")}.botme.site` : "yourbrand.botme.site"}
        </span>
      </div>

      {/* Page */}
      <div className="flex flex-col gap-3 p-3">
        {/* Hero */}
        <motion.div
          layout
          {...fadeUp}
          className="relative overflow-hidden rounded-xl border border-border-dark p-4"
          style={{
            background:
              "linear-gradient(135deg, rgba(197,240,74,0.10) 0%, var(--bg-elevated) 60%)",
          }}
        >
          <span className="inline-flex items-center rounded border border-accent/30 bg-accent/10 px-1.5 py-0.5 font-mono text-[8px] uppercase tracking-wide text-accent">
            {TYPE_LABEL[type] ?? "Ваш тип"}
          </span>
          <h2 className="mt-2 font-display text-[14px] font-semibold leading-[1.15] tracking-[-0.02em] text-ink-dark">
            {offerName || name || "Ваше предложение"}
          </h2>
          <p className="mt-1.5 text-[10px] leading-[1.4] text-ink-dark-muted">
            {offerDesc || "Описание появится после шага 2"}
          </p>
          <div className="mt-3 toolbar-row">
            <span className="inline-flex h-6 items-center rounded bg-accent px-2.5 text-[10px] font-medium text-bg-base">
              {ctaText}
            </span>
            {typeof price === "number" && price > 0 && (
              <span className="font-mono text-[10px] text-ink-dark tabular-nums">
                от {price.toLocaleString("ru-RU")} ₽
              </span>
            )}
          </div>
        </motion.div>

        <AnimatePresence>
          {audience && (
            <motion.div
              key="audience"
              layout
              {...fadeUp}
              className="rounded-xl border border-border-dark bg-bg-elevated p-3"
            >
              <div className="font-mono text-[8px] uppercase tracking-wide text-ink-dark-subtle">
                Для кого
              </div>
              <div className="mt-1 text-[11px] text-ink-dark">{audience}</div>
              {pains.length > 0 && (
                <ul className="mt-2 flex flex-col gap-1">
                  {pains.slice(0, 3).map((p) => (
                    <li
                      key={p}
                      className="flex items-center gap-1.5 text-[10px] text-ink-dark-muted"
                    >
                      <Check className="h-2.5 w-2.5 text-accent" />
                      {PAIN_LABEL[p] ?? p}
                    </li>
                  ))}
                </ul>
              )}
            </motion.div>
          )}

          {mainResult && (
            <motion.div
              key="result"
              layout
              {...fadeUp}
              className="rounded-xl border border-border-dark bg-bg-elevated p-3 text-center"
            >
              <div className="font-mono text-[8px] uppercase tracking-wide text-ink-dark-subtle">
                Вы получите
              </div>
              <div className="mt-1.5 font-display text-[14px] font-semibold text-ink-dark">
                {mainResult}
              </div>
              {benefits.length > 0 && (
                <div className="mt-2 flex flex-wrap justify-center gap-1">
                  {benefits.map((b) => (
                    <span
                      key={b}
                      className="rounded-full border border-border-dark bg-bg-soft px-2 py-0.5 text-[9px] text-ink-dark"
                    >
                      {BENEFIT_LABEL[b] ?? b}
                    </span>
                  ))}
                </div>
              )}
            </motion.div>
          )}

          {(yearsExp || clientsCount || testimonial) && (
            <motion.div
              key="proof"
              layout
              {...fadeUp}
              className="rounded-xl bg-bg-soft p-2.5"
            >
              <div className="flex items-center justify-around">
                {typeof yearsExp === "number" && yearsExp > 0 && (
                  <Mini value={String(yearsExp)} label="лет опыта" />
                )}
                {typeof clientsCount === "number" && clientsCount > 0 && (
                  <Mini value={String(clientsCount)} label="клиентов" />
                )}
              </div>
              {testimonial && (
                <p className="mt-2 text-center text-[9px] italic text-ink-dark-muted leading-[1.4]">
                  {testimonial}
                </p>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Form (always) */}
        <motion.div
          layout
          {...fadeUp}
          className="rounded-xl border border-border-dark bg-bg-elevated p-3"
        >
          <div className="text-center text-[10px] font-medium text-ink-dark">
            Оставьте заявку
          </div>
          <div className="mt-2 flex flex-col gap-1.5">
            <span className="h-3 rounded bg-bg-soft" />
            <span className="h-3 rounded bg-bg-soft" />
            <span className="h-3 rounded bg-bg-soft" />
          </div>
          <div className="mt-2 flex h-6 items-center justify-center rounded bg-accent text-[10px] font-medium text-bg-base">
            Отправить
          </div>
          {leadDestination && (
            <div className="mt-2 text-center font-mono text-[9px] text-ink-dark-subtle">
              Заявки → {leadDestination}
            </div>
          )}
        </motion.div>
      </div>

      {/* Footer */}
      <div className="border-t border-border-dark bg-bg-base px-3 py-2 text-center font-mono text-[8px] text-ink-dark-subtle">
        {name || "your brand"} · сделано в botme
      </div>
    </div>
  );
}

function Mini({ value, label }: { value: string; label: string }) {
  return (
    <div className="flex flex-col items-center">
      <span className="font-display text-[14px] font-semibold text-ink-dark tabular-nums">
        {value}
      </span>
      <span className="font-mono text-[8px] uppercase text-ink-dark-subtle">
        {label}
      </span>
    </div>
  );
}
