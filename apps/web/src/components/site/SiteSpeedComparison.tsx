/**
 * SiteSpeedComparison — обычный путь vs botme.
 */
import { motion } from "framer-motion";
import { X, Check } from "lucide-react";
import { Container } from "@/components/layout/container";

const ease = [0.2, 0.8, 0.2, 1] as const;

const SLOW = [
  "Поиск дизайнера на фрилансе - 2 дня",
  "Согласование макета - 4 дня",
  "Программирование - 5 дней",
  "Покупка домена и хостинга - 1 день",
  "Подключение SSL и аналитики - 1 день",
  "Правки и доработки - 1 день",
];

const FAST = [
  "5 минут - отвечаешь на вопросы брифа",
  "2 минуты - botme генерирует лендинг",
  "15 минут - правишь под себя",
  "5 минут - выбираешь домен и публикуешь",
  "Работает сразу с SSL и Метрикой",
];

export function SiteSpeedComparison() {
  return (
    <section className="py-20 lg:py-32" style={{ background: "var(--bg-base)" }}>
      <Container size="wide">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease }}
          className="max-w-[820px]"
        >
          <div
            className="inline-flex items-center gap-2 font-mono text-[12px]"
            style={{ color: "var(--ink-dark-muted)" }}
          >
            <span
              className="h-1.5 w-1.5 rounded-full"
              style={{ background: "var(--accent)" }}
            />
            Сравнение скорости
          </div>
          <h2
            className="mt-4 font-display font-semibold text-[36px] lg:text-[52px]"
            style={{
              color: "var(--ink-dark)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Сколько времени на лендинг
            <br />
            у обычного предпринимателя.
          </h2>
          <p
            className="mt-5 text-[16px] lg:text-[18px]"
            style={{ color: "var(--ink-dark-muted)", lineHeight: 1.55 }}
          >
            А сколько — в botme.
          </p>
        </motion.div>

        <div className="mt-12 grid grid-cols-1 gap-4 lg:grid-cols-2">
          {/* SLOW */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease }}
            className="rounded-[20px] p-8"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid var(--border-dark)",
            }}
          >
            <span
              className="rounded font-mono text-[10px] uppercase"
              style={{
                background: "var(--bg-soft)",
                color: "var(--ink-dark-subtle)",
                padding: "4px 8px",
                letterSpacing: "0.05em",
              }}
            >
              Обычный путь
            </span>
            <div
              className="mt-6 font-display tabular-nums"
              style={{
                color: "var(--ink-dark-muted)",
                fontSize: 64,
                fontWeight: 500,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              14 дней
            </div>
            <div
              className="mt-1 font-mono text-[11px] uppercase"
              style={{ color: "var(--ink-dark-subtle)", letterSpacing: "0.05em" }}
            >
              От идеи до опубликованного
            </div>
            <ul className="mt-7 flex flex-col gap-2.5">
              {SLOW.map((s) => (
                <li key={s} className="flex items-start gap-2.5">
                  <X
                    className="mt-1 h-3 w-3 shrink-0"
                    strokeWidth={2}
                    style={{ color: "var(--ink-dark-subtle)" }}
                  />
                  <span
                    className="text-[13px] line-through"
                    style={{ color: "var(--ink-dark-muted)" }}
                  >
                    {s}
                  </span>
                </li>
              ))}
            </ul>
            <div
              className="mt-7 flex items-center justify-between border-t pt-5"
              style={{ borderColor: "var(--border-dark)" }}
            >
              <span
                className="font-mono text-[11px]"
                style={{ color: "var(--ink-dark-subtle)" }}
              >
                Цена
              </span>
              <span
                className="font-display text-[18px] font-medium"
                style={{ color: "var(--ink-dark-muted)" }}
              >
                60 000 - 150 000 ₽
              </span>
            </div>
          </motion.div>

          {/* FAST */}
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, margin: "-40px" }}
            transition={{ duration: 0.5, ease, delay: 0.25 }}
            className="relative overflow-hidden rounded-[20px] p-8"
            style={{
              background: "var(--bg-elevated)",
              border: "1px solid rgba(197,240,74,0.5)",
            }}
          >
            <div
              aria-hidden
              className="pointer-events-none absolute inset-0"
              style={{
                background:
                  "radial-gradient(ellipse 80% 60% at 50% 100%, rgba(197,240,74,0.06), transparent 60%)",
              }}
            />
            <span
              className="relative rounded font-mono text-[10px] uppercase"
              style={{
                background: "var(--accent)",
                color: "var(--bg-base)",
                padding: "4px 8px",
                letterSpacing: "0.05em",
              }}
            >
              В botme
            </span>
            <div
              className="relative mt-6 font-display tabular-nums"
              style={{
                color: "var(--ink-dark)",
                fontSize: 64,
                fontWeight: 500,
                letterSpacing: "-0.03em",
                lineHeight: 1,
              }}
            >
              30 минут
            </div>
            <div
              className="relative mt-1 font-mono text-[11px] uppercase"
              style={{ color: "var(--ink-dark-muted)", letterSpacing: "0.05em" }}
            >
              От идеи до опубликованного
            </div>
            <ul className="relative mt-7 flex flex-col gap-2.5">
              {FAST.map((s) => (
                <li key={s} className="flex items-start gap-2.5">
                  <Check
                    className="mt-1 h-3 w-3 shrink-0"
                    strokeWidth={2.5}
                    style={{ color: "var(--accent)" }}
                  />
                  <span
                    className="text-[13px]"
                    style={{ color: "var(--ink-dark)" }}
                  >
                    {s}
                  </span>
                </li>
              ))}
            </ul>
            <div
              className="relative mt-7 flex items-end justify-between border-t pt-5"
              style={{ borderColor: "var(--border-dark)" }}
            >
              <span
                className="font-mono text-[11px]"
                style={{ color: "var(--ink-dark-subtle)" }}
              >
                Цена
              </span>
              <div className="text-right">
                <div
                  className="font-display text-[18px] font-medium"
                  style={{ color: "var(--ink-dark)" }}
                >
                  От 4 900 ₽/мес
                </div>
                <div
                  className="text-[11px]"
                  style={{ color: "var(--ink-dark-muted)" }}
                >
                  Включая хостинг и домен
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </Container>
    </section>
  );
}
