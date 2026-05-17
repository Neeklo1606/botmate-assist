/**
 * SEO helpers — единый источник правды для meta-тегов маркетинговых роутов.
 *
 * Зачем:
 *  — На каждом роуте должны быть canonical + og:url + og:image + twitter — без копипасты.
 *  — Site origin определяется один раз: сначала VITE_SITE_URL (production),
 *    иначе window.location.origin (preview), иначе фиксированный fallback.
 *
 * Использование в роутe:
 *
 *    import { buildPageMeta } from "@/lib/seo";
 *
 *    head: () => ({
 *      meta: buildPageMeta({
 *        title: "Тарифы botme — от 4 900 ₽",
 *        description: "...",
 *        path: "/pricing",
 *      }),
 *      links: [{ rel: "canonical", href: canonicalHref("/pricing") }],
 *    });
 */

const FALLBACK_ORIGIN = "https://botmate-assist.lovable.app";

/** Resolve site origin. Predicтable on SSR (env), corrected on client (location). */
export function getSiteOrigin(): string {
  // Env-инжект через Vite. Для production выставить VITE_SITE_URL=https://botme.ru.
  const envOrigin =
    typeof import.meta !== "undefined"
      ? (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_SITE_URL
      : undefined;
  if (envOrigin) return envOrigin.replace(/\/$/, "");
  if (typeof window !== "undefined" && window.location?.origin) {
    return window.location.origin;
  }
  return FALLBACK_ORIGIN;
}

/** Абсолютный URL для canonical / og:url. */
export function canonicalHref(path: string): string {
  const origin = getSiteOrigin();
  const clean = path.startsWith("/") ? path : `/${path}`;
  return `${origin}${clean}`;
}

/** Абсолютный URL для og:image (принимает относительный путь от /public). */
export function absoluteImage(relPath: string): string {
  const origin = getSiteOrigin();
  const clean = relPath.startsWith("/") ? relPath : `/${relPath}`;
  return `${origin}${clean}`;
}

export interface PageMetaInput {
  title: string;
  description: string;
  /** Абсолютный путь без origin: «/pricing», «/cases/kontur». */
  path: string;
  /** Относительный путь к og-image от /public. По умолчанию /og-default.jpg. */
  image?: string;
  /** og:type (default «website», для кейсов и блог-постов — «article»). */
  type?: "website" | "article";
  /** Поисковая видимость (для legal/internal — false). */
  noindex?: boolean;
}

type MetaTag =
  | { title: string }
  | { name: string; content: string }
  | { property: string; content: string };

/**
 * Полный набор meta-тегов: title, description, OG, Twitter, robots.
 * canonical и og:image обязательны на каждом маркетинг-роуте.
 */
export function buildPageMeta(input: PageMetaInput): MetaTag[] {
  const {
    title,
    description,
    path,
    image = "/og-default.jpg",
    type = "website",
    noindex = false,
  } = input;
  const url = canonicalHref(path);
  const imageUrl = absoluteImage(image);

  const tags: MetaTag[] = [
    { title },
    { name: "description", content: description },

    // Open Graph
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { property: "og:image", content: imageUrl },
    { property: "og:image:width", content: "1216" },
    { property: "og:image:height", content: "640" },
    { property: "og:locale", content: "ru_RU" },
    { property: "og:site_name", content: "botme" },

    // Twitter
    { name: "twitter:card", content: "summary_large_image" },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: imageUrl },
  ];

  if (noindex) {
    tags.push({ name: "robots", content: "noindex, nofollow" });
  } else {
    tags.push({ name: "robots", content: "index, follow" });
  }

  return tags;
}

/** Helper для links: canonical в одну строчку. */
export function canonicalLink(path: string) {
  return { rel: "canonical" as const, href: canonicalHref(path) };
}
