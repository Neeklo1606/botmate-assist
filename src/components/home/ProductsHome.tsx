/**
 * ProductsHome — три карточки продуктов (Assistant LIVE, Media SOON, Site SOON).
 */
import { Link } from "@tanstack/react-router";
import { motion } from "framer-motion";
import {
  ArrowUpRight,
  Check,
  LayoutTemplate,
  MessagesSquare,
  Sparkles,
  type LucideIcon,
} from "lucide-react";
import { Container } from "@/components/layout/container";

const ease = [0.2, 0.8, 0.2, 1] as const;

interface Product {
  to: "/assistant" | "/media" | "/site";
  icon: LucideIcon;
  status: "live" | "soon";
  title: string;
  description: string;
  features: string[];
  cta: string;
}

const products: Product[] = [
  {
    to: "/assistant",
    icon: MessagesSquare,
    status: "live",
    title: "Ассистент",
    description:
      "Отвечает клиентам в Telegram, на сайте, в Avito и WhatsApp. Ведёт по сценарию, квалифицирует, передаёт в CRM.",
    features: [
      "Запуск за 3 дня",
      "Все каналы из коробки",
      "Без кода и разработчиков",
    ],
    cta: "Открыть Ассистент",
  },
  {
    to: "/media",
    icon: Sparkles,
    status: "soon",
    title: "Медиа-студия",
    description:
      "Делает посты, карусели, обложки сторис, баннеры. GPT генерирует тексты и изображения под твой бренд.",
    features: [
      "Контент на месяц вперёд",
      "В стиле твоего бренда",
      "С автопубликацией",
    ],
    cta: "Узнать больше",
  },
  {
    to: "/site",
    icon: LayoutTemplate,
    status: "soon",
    title: "Сайт-конструктор",
    description:
      "Собирает лендинг по короткому брифу. Готовая страница с твоими текстами, картинками и формой за 10 минут.",
    features: [
      "Бриф из 7 вопросов",
      "Готов к публикации сразу",
      "Свой домен и SSL",
    ],
    cta: "Узнать больше",
  },
];

export function ProductsHome() {
  return (
    <section
      id="products"
      className="py-20 lg:py-32"
      style={{ background: "var(--bg-base)" }}
    >
      <Container size="wide">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-80px" }}
          transition={{ duration: 0.5, ease }}
          className="mx-auto max-w-[800px] text-center"
        >
          <span
            className="inline-flex items-center rounded-full border px-3.5 py-1.5 text-[12px] font-mono"
            style={{
              background: "var(--bg-soft)",
              borderColor: "var(--border-dark)",
              color: "var(--ink-dark-muted)",
            }}
          >
            Три продукта
          </span>
          <h2
            className="mt-5 font-display font-semibold text-[32px] lg:text-[56px]"
            style={{
              color: "var(--ink-dark)",
              letterSpacing: "-0.03em",
              lineHeight: 1.05,
            }}
          >
            Каждый из них — отдельный продукт.
            <br />
            Все вместе — твой помощник.
          </h2>
          <p
            className="mt-5 text-[16px] lg:text-[18px]"
            style={{ color: "var(--ink-dark-muted)" }}
          >
            Используй один — или подключай все три по мере роста.
          </p>
        </motion.div>

        <div className="mt-12 grid gap-3 sm:gap-4 lg:mt-16 lg:grid-cols-3">
          {products.map((p, idx) => (
            <ProductCard key={p.title} product={p} delay={idx * 0.08} />
          ))}
        </div>

        <div
          className="mt-8 text-center text-[13px] font-mono"
          style={{ color: "var(--ink-dark-subtle)" }}
        >
          Все три продукта работают на одном аккаунте. Подключай по мере роста.
        </div>
      </Container>
    </section>
  );
}

function ProductCard({
  product,
  delay,
}: {
  product: Product;
  delay: number;
}) {
  const Icon = product.icon;
  const isLive = product.status === "live";
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-80px" }}
      transition={{ duration: 0.5, ease, delay }}
    >
      <Link
        to={product.to}
        className="product-card group flex h-full flex-col rounded-[20px] border p-7 transition-all"
        style={{
          background: "var(--bg-elevated)",
          borderColor: "var(--border-dark)",
          transitionTimingFunction: "cubic-bezier(0.2,0.8,0.2,1)",
          transitionDuration: "200ms",
        }}
      >
        {/* Icon chip */}
        <div
          className="product-icon flex h-12 w-12 items-center justify-center rounded-[12px] border transition-all"
          style={{
            background: "var(--bg-soft)",
            borderColor: "var(--border-dark)",
            color: "var(--ink-dark)",
            transitionDuration: "200ms",
          }}
        >
          <Icon className="h-6 w-6" strokeWidth={1.75} />
        </div>

        {/* Status */}
        <div
          className="mt-4 text-[11px] font-mono uppercase tracking-wider"
          style={{
            color: isLive ? "var(--accent)" : "var(--ink-dark-subtle)",
          }}
        >
          {isLive ? "● LIVE" : "○ SOON"}
        </div>

        {/* Title */}
        <h3
          className="mt-5 font-display font-semibold text-[22px] lg:text-[28px]"
          style={{
            color: "var(--ink-dark)",
            letterSpacing: "-0.02em",
          }}
        >
          {product.title}
        </h3>

        {/* Description */}
        <p
          className="mt-2 text-[14px] lg:text-[15px]"
          style={{
            color: "var(--ink-dark-muted)",
            lineHeight: 1.5,
          }}
        >
          {product.description}
        </p>

        {/* Features */}
        <ul className="mt-6 flex flex-col gap-2.5">
          {product.features.map((f) => (
            <li
              key={f}
              className="flex items-center gap-2.5 text-[14px]"
              style={{ color: "var(--ink-dark-muted)" }}
            >
              <Check
                className="h-3.5 w-3.5 shrink-0"
                style={{ color: "var(--accent)" }}
                strokeWidth={2.5}
              />
              {f}
            </li>
          ))}
        </ul>

        <div className="mt-auto pt-7">
          <div
            className="product-cta inline-flex items-center gap-1 text-sm font-medium transition-colors"
            style={{ color: "var(--ink-dark)" }}
          >
            {product.cta}
            <ArrowUpRight className="product-arrow h-4 w-4 transition-transform" strokeWidth={2} />
          </div>
        </div>
      </Link>

      <style>{`
        .product-card:hover {
          border-color: var(--border-dark-strong);
          background: linear-gradient(180deg, var(--bg-soft) 0%, var(--bg-elevated) 100%);
          transform: translateY(-2px);
        }
        .product-card:hover .product-icon {
          background: rgba(197,240,74,0.15);
          border-color: rgba(197,240,74,0.3);
          color: var(--accent);
        }
        .product-card:hover .product-cta {
          color: var(--accent);
        }
        .product-card:hover .product-arrow {
          transform: translate(2px, -2px);
        }
      `}</style>
    </motion.div>
  );
}
