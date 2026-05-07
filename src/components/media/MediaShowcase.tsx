/**
 * MediaShowcase — galery grid из 8 mock-карточек контента.
 */
import { motion } from "framer-motion";
import { Container } from "@/components/layout/container";
import { MockPostCard } from "./parts/MockPostCard";
import { MockStoryCard } from "./parts/MockStoryCard";
import { MockBannerCard } from "./parts/MockBannerCard";

const ease = [0.2, 0.8, 0.2, 1] as const;

interface ShowcaseItem {
  kind: "post" | "story" | "banner";
  hideOnMobile?: boolean;
  // discriminated payload
  data: Record<string, string>;
}

const ITEMS: ShowcaseItem[] = [
  {
    kind: "post",
    data: {
      title: "5 продуктов,\nкоторые крадут\nутреннюю энергию",
      author: "Анна Травкина",
      handle: "@anna.nutrition",
      style: "warm",
      timestamp: "ВТ · 09:00",
    },
  },
  {
    kind: "post",
    data: {
      title: "Как поставить цель\nна год и не сорваться\nк февралю",
      author: "Игорь Ставров",
      handle: "@stavrov.coach",
      style: "minimal",
      timestamp: "ПН · 18:30",
    },
  },
  {
    kind: "story",
    data: {
      title: "Бесплатный\nвебинар\nуже завтра",
      style: "bright",
      cta: "СВАЙП ВВЕРХ",
    },
  },
  {
    kind: "banner",
    data: {
      title: "Январский интенсив",
      subtitle: "20 января, 19:00",
      style: "dark",
    },
  },
  {
    kind: "post",
    hideOnMobile: true,
    data: {
      title: "Почему отжимания\nне дают результата",
      author: "Степан К.",
      handle: "@stepan.fit",
      style: "dark",
      timestamp: "СР · 07:15",
    },
  },
  {
    kind: "post",
    hideOnMobile: true,
    data: {
      title: "Что такое\nнейропластичность\nпростыми словами",
      author: "Лена Морозова",
      handle: "@lena.psy",
      style: "bright",
      timestamp: "ЧТ · 12:00",
    },
  },
  {
    kind: "story",
    hideOnMobile: true,
    data: {
      title: "Открыта\nзапись",
      style: "minimal",
      cta: "ДАЛЕЕ",
    },
  },
  {
    kind: "banner",
    hideOnMobile: true,
    data: {
      title: "Скидка 30%",
      subtitle: "До 31 января",
      style: "warm",
    },
  },
];

export function MediaShowcase() {
  return (
    <section
      id="showcase"
      className="relative py-20 lg:py-32"
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
            Реальные примеры
          </div>
          <h2
            className="mt-4 font-display font-semibold text-[36px] lg:text-[56px]"
            style={{
              color: "var(--ink-dark)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Контент, который не выглядит сгенерированным.
          </h2>
          <p
            className="mt-5 max-w-[600px] text-[16px] lg:text-[18px]"
            style={{ color: "var(--ink-dark-muted)", lineHeight: 1.55 }}
          >
            Каждый пост подстраивается под голос и стиль твоего бренда. Не штамп,
            а отдельная единица контента.
          </p>
        </motion.div>

        <div className="mt-16 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {ITEMS.map((item, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 12 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true, margin: "-40px" }}
              transition={{ duration: 0.4, ease, delay: (i % 4) * 0.06 }}
              className={`showcase-item ${item.hideOnMobile ? "hidden sm:block" : ""}`}
            >
              {item.kind === "post" && (
                <MockPostCard
                  title={item.data.title}
                  author={item.data.author}
                  handle={item.data.handle}
                  style={item.data.style as "warm" | "minimal" | "dark" | "bright"}
                  timestamp={item.data.timestamp}
                />
              )}
              {item.kind === "story" && (
                <MockStoryCard
                  title={item.data.title}
                  style={item.data.style as "minimal" | "warm" | "bright"}
                  cta={item.data.cta}
                />
              )}
              {item.kind === "banner" && (
                <MockBannerCard
                  title={item.data.title}
                  subtitle={item.data.subtitle}
                  style={item.data.style as "dark" | "warm" | "bright"}
                />
              )}
            </motion.div>
          ))}
        </div>

        <p
          className="mt-8 text-center font-mono text-[12px]"
          style={{ color: "var(--ink-dark-subtle)" }}
        >
          Это всё сделано в Медиа-студии botme · сгенерировано за 12 минут
        </p>
      </Container>

      <style>{`
        .showcase-item > * {
          transition: transform 200ms cubic-bezier(0.2,0.8,0.2,1),
                      box-shadow 200ms cubic-bezier(0.2,0.8,0.2,1),
                      border-color 200ms;
        }
        .showcase-item:hover > * {
          transform: scale(1.02);
          box-shadow: 0 20px 40px rgba(0,0,0,0.4);
          border-color: var(--border-dark-strong) !important;
        }
      `}</style>
    </section>
  );
}
