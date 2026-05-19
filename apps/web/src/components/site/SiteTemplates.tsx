/**
 * SiteTemplates — 6 готовых шаблонов с разными mock-preview.
 */
import { motion } from "framer-motion";
import { ArrowUpRight } from "lucide-react";
import { Container } from "@/components/layout/container";

const ease = [0.2, 0.8, 0.2, 1] as const;

interface Tpl {
  name: string;
  cat: string;
  desc: string;
  meta: string;
  render: () => React.ReactNode;
}

function MiniHero({
  bg,
  textColor = "var(--ink-dark)",
  eyebrow,
  h,
  sub,
  cta,
  ctaStyle = "accent",
  decor,
}: {
  bg: string;
  textColor?: string;
  eyebrow: string;
  h: string;
  sub: string;
  cta: string;
  ctaStyle?: "accent" | "dark";
  decor?: React.ReactNode;
}) {
  return (
    <div
      className="relative flex h-full flex-col items-center justify-center px-4 py-6 text-center"
      style={{ background: bg }}
    >
      {decor}
      <div
        className="font-mono text-[9px] uppercase"
        style={{ color: textColor, opacity: 0.6, letterSpacing: "0.05em" }}
      >
        {eyebrow}
      </div>
      <div
        className="mt-2 font-display text-[16px] font-semibold leading-tight"
        style={{ color: textColor, letterSpacing: "-0.02em", whiteSpace: "pre-line" }}
      >
        {h}
      </div>
      <div
        className="mt-1.5 font-mono text-[10px]"
        style={{ color: textColor, opacity: 0.55 }}
      >
        {sub}
      </div>
      <span
        className="mt-3 rounded px-3 py-1 text-[10px] font-medium"
        style={{
          background: ctaStyle === "accent" ? "var(--accent)" : "var(--bg-base)",
          color: ctaStyle === "accent" ? "var(--bg-base)" : "var(--ink-dark)",
        }}
      >
        {cta}
      </span>
    </div>
  );
}

const TEMPLATES: Tpl[] = [
  {
    name: "Эксперт",
    cat: "EXPERT",
    desc: "Курс или консультации. Презентация себя как специалиста.",
    meta: "5 секций · готов за 8 минут",
    render: () => (
      <MiniHero
        bg="linear-gradient(160deg, #2A2418 0%, #1A1612 100%)"
        eyebrow="Эксперт"
        h={"Стать нутрициологом\nза 4 месяца"}
        sub="Онлайн-курс"
        cta="Начать"
      />
    ),
  },
  {
    name: "Услуги",
    cat: "SERVICES",
    desc: "Услуга с понятной ценой. Для агентств и фрилансеров.",
    meta: "6 секций · готов за 9 минут",
    render: () => (
      <MiniHero
        bg="var(--bg-base)"
        eyebrow="Услуги"
        h={"Дизайн интерьера\nс гарантией"}
        sub="Москва · СПб · онлайн"
        cta="Обсудить"
        decor={
          <div className="absolute left-0 right-0 top-0 flex flex-col gap-1 p-2">
            <span
              className="h-px"
              style={{ background: "var(--accent)", opacity: 0.6 }}
            />
            <span
              className="h-px w-2/3"
              style={{ background: "var(--accent)", opacity: 0.4 }}
            />
            <span
              className="h-px w-1/3"
              style={{ background: "var(--accent)", opacity: 0.25 }}
            />
          </div>
        }
      />
    ),
  },
  {
    name: "Курс / школа",
    cat: "COURSE",
    desc: "Онлайн-обучение с программой и расписанием.",
    meta: "7 секций · готов за 10 минут",
    render: () => (
      <MiniHero
        bg="rgba(197,240,74,0.25)"
        textColor="var(--bg-base)"
        eyebrow="Школа"
        h={"Школа английского\nдля взрослых"}
        sub="Старт 1 марта"
        cta="Записаться"
        ctaStyle="dark"
      />
    ),
  },
  {
    name: "Локальный бизнес",
    cat: "LOCAL",
    desc: "Кафе, салон, мастерская. С картой и часами работы.",
    meta: "5 секций · готов за 7 минут",
    render: () => (
      <MiniHero
        bg="linear-gradient(180deg, #1A1A1E 0%, #111113 100%)"
        eyebrow="Локально"
        h={"Кофейня «Север»\nна Литейном"}
        sub="С 8:00 до 22:00"
        cta="Меню"
      />
    ),
  },
  {
    name: "Мероприятие",
    cat: "EVENT",
    desc: "Конференция, мастер-класс, концерт. С регистрацией.",
    meta: "6 секций · готов за 8 минут",
    render: () => (
      <MiniHero
        bg="var(--bg-elevated)"
        eyebrow="Конференция"
        h={"Конференция\nUX 2026"}
        sub="12 марта · Москва"
        cta="Участвовать"
        decor={
          <div
            className="absolute -right-6 -top-6 h-24 w-24 rounded-full"
            style={{ background: "rgba(197,240,74,0.12)" }}
          />
        }
      />
    ),
  },
  {
    name: "Лид-магнит",
    cat: "FREEBIE",
    desc: "PDF, чек-лист, гайд. Для сбора контактов.",
    meta: "4 секции · готов за 5 минут",
    render: () => (
      <MiniHero
        bg="var(--bg-base)"
        eyebrow="Гайд"
        h={"Гайд: 10 ошибок\nв продажах"}
        sub="Бесплатно по email"
        cta="Скачать"
      />
    ),
  },
];

export function SiteTemplates() {
  return (
    <section
      id="templates"
      className="py-20 lg:py-32"
      style={{ background: "var(--bg-base)" }}
    >
      <Container size="wide">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease }}
          className="max-w-[720px]"
        >
          <div
            className="inline-flex items-center gap-2 font-mono text-[12px]"
            style={{ color: "var(--ink-dark-muted)" }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--accent)" }}
            />
            Шаблоны
          </div>
          <h2
            className="mt-4 font-display font-semibold text-[36px] lg:text-[52px]"
            style={{
              color: "var(--ink-dark)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            С чего начать.
          </h2>
          <p
            className="mt-5 text-[16px] lg:text-[18px]"
            style={{ color: "var(--ink-dark-muted)", lineHeight: 1.55 }}
          >
            Шесть стартовых шаблонов под популярные ниши. Можно начать с
            пустого холста.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {TEMPLATES.map((t, i) => (
            <motion.div
              key={t.name}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease, delay: i * 0.08 }}
              className="tpl-card group flex cursor-pointer flex-col overflow-hidden rounded-[16px]"
              style={{
                background: "var(--bg-elevated)",
                border: "1px solid var(--border-dark)",
              }}
            >
              <div className="relative h-[200px] overflow-hidden">
                <div className="tpl-preview h-full w-full">{t.render()}</div>
              </div>
              <div
                className="flex flex-col p-[18px]"
                style={{ background: "var(--bg-elevated)" }}
              >
                <div className="flex items-start justify-between gap-3">
                  <div
                    className="text-[15px] font-medium"
                    style={{ color: "var(--ink-dark)" }}
                  >
                    {t.name}
                  </div>
                  <span
                    className="rounded font-mono text-[10px] uppercase"
                    style={{
                      background: "var(--bg-soft)",
                      color: "var(--ink-dark-subtle)",
                      border: "1px solid var(--border-dark)",
                      padding: "2px 8px",
                      letterSpacing: "0.05em",
                    }}
                  >
                    {t.cat}
                  </span>
                </div>
                <p
                  className="mt-1.5 text-[12px]"
                  style={{ color: "var(--ink-dark-muted)", lineHeight: 1.5 }}
                >
                  {t.desc}
                </p>
                <div className="mt-3.5 toolbar-row">
                  <span
                    className="font-mono text-[10px]"
                    style={{ color: "var(--ink-dark-subtle)" }}
                  >
                    {t.meta}
                  </span>
                  <ArrowUpRight
                    className="tpl-arrow h-3.5 w-3.5"
                    style={{ color: "var(--ink-dark-muted)" }}
                  />
                </div>
              </div>
            </motion.div>
          ))}
        </div>

        <p
          className="mt-8 text-center text-[13px]"
          style={{ color: "var(--ink-dark-muted)" }}
        >
          Каждый шаблон адаптируется под твой бизнес. Botme не штампует
          одинаковые сайты.
        </p>
      </Container>

      <style>{`
        .tpl-card { transition: transform 200ms cubic-bezier(0.2,0.8,0.2,1), border-color 200ms; }
        .tpl-card:hover { transform: translateY(-2px); border-color: var(--border-dark-strong); }
        .tpl-preview { transition: transform 300ms cubic-bezier(0.2,0.8,0.2,1); }
        .tpl-card:hover .tpl-preview { transform: scale(1.04); }
        .tpl-arrow { transition: transform 200ms cubic-bezier(0.2,0.8,0.2,1), color 200ms; }
        .tpl-card:hover .tpl-arrow { transform: translate(2px, -2px); color: var(--accent); }
      `}</style>
    </section>
  );
}
