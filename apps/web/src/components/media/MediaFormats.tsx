/**
 * MediaFormats — 5 форматов контента.
 */
import { motion } from "framer-motion";
import { Image, Layers, Smartphone, Megaphone, FileText, type LucideIcon } from "lucide-react";
import { Container } from "@/components/layout/container";

const ease = [0.2, 0.8, 0.2, 1] as const;

interface Format {
  icon: LucideIcon;
  title: string;
  desc: string;
  tag: string;
}

const FORMATS: Format[] = [
  { icon: Image, title: "Пост в ленту", desc: "Квадрат 1080×1080. Текст и визуал в стиле бренда.", tag: "5 ВАРИАНТОВ ЗА РАЗ" },
  { icon: Layers, title: "Карусель", desc: "От 3 до 10 слайдов. С навигацией и финальным CTA.", tag: "ДЛЯ INSTAGRAM, VK" },
  { icon: Smartphone, title: "Обложка сторис", desc: "Вертикаль 1080×1920. Заголовок, анимация, действие.", tag: "STORIES, REELS" },
  { icon: Megaphone, title: "Баннер для рекламы", desc: "16:9 или 4:5 для Яндекс.Директ, VK Реклама, Telegram Ads.", tag: "С UTM ИЗ КОРОБКИ" },
  { icon: FileText, title: "Лонгрид для канала", desc: "Текст для Telegram, VK или блога. С разметкой и эмодзи.", tag: "ДО 4000 ЗНАКОВ" },
];

export function MediaFormats() {
  return (
    <section
      className="py-20 lg:py-32"
      style={{ background: "var(--bg-elevated)" }}
    >
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
            <span className="h-1.5 w-1.5 rounded-full" style={{ background: "var(--accent)" }} />
            Что генерируем
          </div>
          <h2
            className="mt-4 font-display font-semibold text-[36px] lg:text-[52px]"
            style={{ color: "var(--ink-dark)", letterSpacing: "-0.03em", lineHeight: 1.05 }}
          >
            Пять форматов. Бесконечно много контента.
          </h2>
          <p
            className="mt-5 text-[16px] lg:text-[18px]"
            style={{ color: "var(--ink-dark-muted)", lineHeight: 1.55 }}
          >
            От поста в ленту до карусели и обложки сторис. Меняй формат, оставляй
            смысл.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5">
          {FORMATS.map((f, i) => {
            const Icon = f.icon;
            return (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-40px" }}
                transition={{ duration: 0.4, ease, delay: i * 0.06 }}
                className="format-card flex flex-col items-start rounded-2xl border p-6"
                style={{
                  background: "var(--bg-base)",
                  borderColor: "var(--border-dark)",
                }}
              >
                <div
                  className="flex h-12 w-12 items-center justify-center rounded-xl border"
                  style={{
                    background: "var(--bg-soft)",
                    borderColor: "var(--border-dark)",
                  }}
                >
                  <Icon className="h-[22px] w-[22px]" strokeWidth={1.75} style={{ color: "var(--ink-dark)" }} />
                </div>
                <h3
                  className="mt-6 font-display text-[18px] font-semibold"
                  style={{ color: "var(--ink-dark)", letterSpacing: "-0.01em" }}
                >
                  {f.title}
                </h3>
                <p
                  className="mt-2 text-[13px]"
                  style={{ color: "var(--ink-dark-muted)", lineHeight: 1.5 }}
                >
                  {f.desc}
                </p>
                <div
                  className="mt-4 inline-flex items-center rounded font-mono text-[10px] uppercase"
                  style={{
                    background: "var(--bg-soft)",
                    border: "1px solid var(--border-dark)",
                    color: "var(--ink-dark-subtle)",
                    padding: "4px 8px",
                    letterSpacing: "0.05em",
                  }}
                >
                  {f.tag}
                </div>
              </motion.div>
            );
          })}
        </div>
      </Container>

      <style>{`
        .format-card { transition: transform 200ms cubic-bezier(0.2,0.8,0.2,1), border-color 200ms; }
        .format-card:hover { transform: translateY(-2px); border-color: var(--border-dark-strong); }
      `}</style>
    </section>
  );
}
