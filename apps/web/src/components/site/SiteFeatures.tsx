/**
 * SiteFeatures — 6 фич + mock-builder с inspector.
 */
import { motion } from "framer-motion";
import {
  Globe,
  ClipboardList,
  BarChart3,
  Smartphone,
  Search,
  Edit3,
  AlignLeft,
  AlignCenter,
  AlignRight,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/layout/container";

const ease = [0.2, 0.8, 0.2, 1] as const;

interface Feat {
  Icon: LucideIcon;
  title: string;
  body: string;
}

const FEATS: Feat[] = [
  {
    Icon: Globe,
    title: "Собственный домен",
    body: "Свой .ru или поддомен .botme.app. SSL автоматически.",
  },
  {
    Icon: ClipboardList,
    title: "Формы с интеграциями",
    body: "Заявки летят в Telegram, amoCRM, Google Sheets.",
  },
  {
    Icon: BarChart3,
    title: "Аналитика",
    body: "Яндекс.Метрика встроена. Видишь конверсию и источники.",
  },
  {
    Icon: Smartphone,
    title: "Адаптив",
    body: "Mobile-first дизайн. Без отдельной мобильной версии.",
  },
  {
    Icon: Search,
    title: "SEO из коробки",
    body: "Метатеги, sitemap, robots — всё генерируется автоматически.",
  },
  {
    Icon: Edit3,
    title: "Правки в один клик",
    body: "Меняй текст, цвета, секции — без перевыпуска. Сразу live.",
  },
];

export function SiteFeatures() {
  return (
    <section className="py-20 lg:py-32" style={{ background: "var(--bg-elevated)" }}>
      <Container size="wide">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease }}
          className="mx-auto max-w-[720px] text-center"
        >
          <div
            className="inline-flex items-center gap-2 font-mono text-[12px]"
            style={{ color: "var(--ink-dark-muted)" }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--accent)" }}
            />
            Что внутри
          </div>
          <h2
            className="mt-4 font-display font-semibold text-[36px] lg:text-[52px]"
            style={{
              color: "var(--ink-dark)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Не «генератор шаблонов».
            <br />
            Полноценный сайт.
          </h2>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-10 lg:grid-cols-[5fr_7fr] lg:gap-16">
          {/* LEFT — features list */}
          <div className="flex flex-col gap-[18px]">
            {FEATS.map((f, i) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 8 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.35, ease, delay: i * 0.05 }}
                className="flex items-start gap-3.5"
              >
                <div
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-[8px]"
                  style={{
                    background: "var(--bg-base)",
                    border: "1px solid var(--border-dark)",
                  }}
                >
                  <f.Icon
                    className="h-4 w-4"
                    strokeWidth={1.75}
                    style={{ color: "var(--ink-dark)" }}
                  />
                </div>
                <div>
                  <h4
                    className="text-[14px] font-semibold"
                    style={{ color: "var(--ink-dark)" }}
                  >
                    {f.title}
                  </h4>
                  <p
                    className="mt-1 text-[13px]"
                    style={{ color: "var(--ink-dark-muted)", lineHeight: 1.5 }}
                  >
                    {f.body}
                  </p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* RIGHT — mock builder */}
          <motion.div
            initial={{ opacity: 0, y: 12, scale: 0.98 }}
            whileInView={{ opacity: 1, y: 0, scale: 1 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease }}
            className="relative overflow-hidden rounded-[16px]"
            style={{
              background: "var(--bg-base)",
              border: "1px solid var(--border-dark)",
              height: 540,
            }}
          >
            {/* Top bar */}
            <div
              className="flex h-8 items-center justify-between px-3"
              style={{
                background: "var(--bg-soft)",
                borderBottom: "1px solid var(--border-dark)",
              }}
            >
              <div className="flex items-center gap-1.5">
                {[1, 2, 3].map((i) => (
                  <span
                    key={i}
                    className="h-2 w-2 rounded-full"
                    style={{ background: "var(--ink-dark-subtle)" }}
                  />
                ))}
              </div>
              <span
                className="font-mono text-[10px]"
                style={{ color: "var(--ink-dark-muted)" }}
              >
                anna-fitness.botme.app/edit
              </span>
              <span
                className="rounded px-2 py-0.5 text-[10px] font-medium"
                style={{ background: "var(--accent)", color: "var(--bg-base)" }}
              >
                Опубликовать
              </span>
            </div>

            <div className="grid h-[calc(100%-32px)] grid-cols-[65fr_35fr]">
              {/* Preview area with selected H1 */}
              <div className="relative flex items-center justify-center p-6">
                <div className="relative">
                  <div
                    className="font-display text-[24px] font-semibold leading-tight"
                    style={{
                      color: "var(--ink-dark)",
                      letterSpacing: "-0.03em",
                      padding: "8px 12px",
                      border: "1px solid var(--accent)",
                      borderRadius: 4,
                    }}
                  >
                    Сильное тело
                    <br />
                    за 8 недель
                  </div>
                  {/* corner handles */}
                  {[
                    { top: -3, left: -3 },
                    { top: -3, right: -3 },
                    { bottom: -3, left: -3 },
                    { bottom: -3, right: -3 },
                  ].map((pos, i) => (
                    <span
                      key={i}
                      className="absolute h-1.5 w-1.5"
                      style={{ background: "var(--accent)", ...pos }}
                    />
                  ))}
                </div>
              </div>

              {/* Inspector */}
              <div
                className="p-3.5"
                style={{
                  background: "var(--bg-elevated)",
                  borderLeft: "1px solid var(--border-dark)",
                }}
              >
                <div
                  className="font-mono text-[10px] uppercase"
                  style={{
                    color: "var(--ink-dark-subtle)",
                    letterSpacing: "0.05em",
                  }}
                >
                  Выделен: Заголовок
                </div>

                <Field label="Текст">
                  <div
                    className="rounded-[6px] px-2.5 py-2 text-[11px]"
                    style={{
                      background: "var(--bg-base)",
                      border: "1px solid var(--border-dark)",
                      color: "var(--ink-dark)",
                    }}
                  >
                    Сильное тело за 8 недель
                    <span
                      className="ml-0.5 inline-block animate-pulse"
                      style={{
                        width: 1,
                        height: 10,
                        background: "var(--accent)",
                        verticalAlign: "middle",
                      }}
                    />
                  </div>
                </Field>

                <Field label="Размер">
                  <div
                    className="flex overflow-hidden rounded-[6px]"
                    style={{ border: "1px solid var(--border-dark)" }}
                  >
                    {["S", "M", "L", "XL"].map((s) => (
                      <span
                        key={s}
                        className="flex-1 py-1.5 text-center font-mono text-[10px]"
                        style={{
                          background: s === "M" ? "var(--bg-soft)" : "transparent",
                          color: s === "M" ? "var(--ink-dark)" : "var(--ink-dark-muted)",
                        }}
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </Field>

                <Field label="Выравнивание">
                  <div
                    className="flex overflow-hidden rounded-[6px]"
                    style={{ border: "1px solid var(--border-dark)" }}
                  >
                    {[AlignLeft, AlignCenter, AlignRight].map((I, i) => (
                      <span
                        key={i}
                        className="flex flex-1 items-center justify-center py-1.5"
                        style={{
                          background: i === 1 ? "var(--bg-soft)" : "transparent",
                        }}
                      >
                        <I
                          className="h-3 w-3"
                          strokeWidth={1.75}
                          style={{
                            color:
                              i === 1 ? "var(--ink-dark)" : "var(--ink-dark-muted)",
                          }}
                        />
                      </span>
                    ))}
                  </div>
                </Field>

                <Field label="Цвет">
                  <div
                    className="flex items-center gap-2 rounded-[6px] px-2 py-1.5"
                    style={{
                      background: "var(--bg-base)",
                      border: "1px solid var(--border-dark)",
                    }}
                  >
                    <span
                      className="h-3.5 w-3.5 rounded"
                      style={{
                        background: "var(--ink-dark)",
                        border: "1px solid var(--border-dark-strong)",
                      }}
                    />
                    <span
                      className="font-mono text-[10px]"
                      style={{ color: "var(--ink-dark)" }}
                    >
                      #F4F4F1
                    </span>
                  </div>
                </Field>

                <Field label="Анимация">
                  <div
                    className="relative h-4 w-7 rounded-full"
                    style={{ background: "var(--accent)" }}
                  >
                    <span
                      className="absolute top-0.5 h-3 w-3 rounded-full"
                      style={{ background: "var(--bg-base)", right: 2 }}
                    />
                  </div>
                </Field>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="mt-3">
      <div
        className="mb-1 font-mono text-[9px] uppercase"
        style={{ color: "var(--ink-dark-subtle)", letterSpacing: "0.05em" }}
      >
        {label}
      </div>
      {children}
    </div>
  );
}
