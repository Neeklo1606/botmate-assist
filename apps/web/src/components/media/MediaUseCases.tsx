/**
 * MediaUseCases — 3 кейса.
 */
import { motion } from "framer-motion";
import { Container } from "@/components/layout/container";

const ease = [0.2, 0.8, 0.2, 1] as const;

const CASES = [
  {
    badge: "ЭКСПЕРТ",
    title: "Контент, пока ты ведёшь клиентов",
    body: "Нутрициологи, психологи, коучи. Студия делает посты в фоне, ты только нажимаешь «опубликовать».",
    statN: "30 постов",
    statL: "В МЕСЯЦ ВМЕСТО 4",
    quote: "Раньше тратила субботу на тексты. Теперь три минуты в день на проверку.",
    src: "Анна Т. · нутрициолог",
  },
  {
    badge: "БИЗНЕС",
    title: "Социалки, которые работают сами",
    body: "Кафе, салоны, локальные магазины. Регулярные публикации без штатного SMM.",
    statN: "+47%",
    statL: "ОХВАТ ЗА МЕСЯЦ",
    quote: "Контент-план на 30 дней за один вечер. Это сэкономило мне 60 тысяч на дизайнере.",
    src: "Дмитрий К. · кафе «Сила»",
  },
  {
    badge: "АГЕНТСТВО",
    title: "10 клиентов в одной студии",
    body: "Маркетинговые агентства ведут несколько брендов параллельно. Каждый со своим голосом и стилем.",
    statN: "10 брендов",
    statL: "НА ОДНОМ АККАУНТЕ",
    quote: "Производство контента в 6 раз быстрее. Команда переключилась на стратегию.",
    src: "Студия «Север»",
  },
];

export function MediaUseCases() {
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
          <div className="inline-flex items-center gap-2 font-mono text-[12px]" style={{ color: "var(--ink-dark-muted)" }}>
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            Кому подходит
          </div>
          <h2 className="mt-4 font-display font-semibold text-[36px] lg:text-[52px]"
            style={{ color: "var(--ink-dark)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
            Кто уже делает контент в botme.
          </h2>
          <p className="mt-5 text-[16px] lg:text-[18px]" style={{ color: "var(--ink-dark-muted)", lineHeight: 1.55 }}>
            Эксперты, малый бизнес, агентства. У каждого свой ритм публикаций.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-4 lg:grid-cols-3">
          {CASES.map((c, i) => (
            <motion.div
              key={c.badge}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease, delay: i * 0.08 }}
              className="flex flex-col rounded-[20px] border p-8"
              style={{
                background: "var(--bg-base)",
                borderColor: "var(--border-dark)",
              }}
            >
              <span
                className="inline-flex w-fit items-center rounded font-mono text-[11px] uppercase"
                style={{
                  background: "rgba(197,240,74,0.12)",
                  color: "var(--accent)",
                  padding: "4px 8px",
                  letterSpacing: "0.05em",
                }}
              >
                {c.badge}
              </span>
              <h3 className="mt-4 font-display text-[20px] font-semibold"
                style={{ color: "var(--ink-dark)", letterSpacing: "-0.01em" }}>
                {c.title}
              </h3>
              <p className="mt-2 text-[14px]" style={{ color: "var(--ink-dark-muted)", lineHeight: 1.55 }}>
                {c.body}
              </p>
              <div className="mt-auto pt-6">
                <div
                  className="font-display text-[36px] font-medium tabular-nums"
                  style={{ color: "var(--ink-dark)", letterSpacing: "-0.02em", lineHeight: 1 }}
                >
                  {c.statN}
                </div>
                <div className="mt-1.5 font-mono text-[12px]" style={{ color: "var(--ink-dark-muted)", letterSpacing: "0.04em" }}>
                  {c.statL}
                </div>
              </div>
              <div
                className="mt-4 border-t pt-4"
                style={{ borderColor: "var(--border-dark)" }}
              >
                <p className="text-[13px] italic" style={{ color: "var(--ink-dark-muted)", lineHeight: 1.55 }}>
                  «{c.quote}»
                </p>
                <div className="mt-2 font-mono text-[11px]" style={{ color: "var(--ink-dark-subtle)" }}>
                  {c.src}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </Container>
    </section>
  );
}
