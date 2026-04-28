/**
 * /sitemap.xml — server route. Динамически собираем карту сайта из:
 *  — статических маркетинговых страниц,
 *  — детальных кейсов (cases.$slug) — slug'и из mock repository,
 *  — детальных сценариев (scenarios.$niche) — все валидные niches.
 *
 * Кабинет, auth и legacy-страницы исключены (см. robots.txt).
 */
import { createFileRoute } from "@tanstack/react-router";
import { getSiteOrigin } from "@/lib/seo";
import { repository } from "@/lib/mock/repository";
import type { Niche } from "@/types/entities";

const STATIC_PATHS: Array<{ path: string; changefreq: string; priority: string }> = [
  { path: "/", changefreq: "weekly", priority: "1.0" },
  { path: "/features", changefreq: "monthly", priority: "0.9" },
  { path: "/integrations", changefreq: "monthly", priority: "0.8" },
  { path: "/scenarios", changefreq: "monthly", priority: "0.8" },
  { path: "/cases", changefreq: "weekly", priority: "0.9" },
  { path: "/pricing", changefreq: "monthly", priority: "0.9" },
  { path: "/first-100", changefreq: "weekly", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.6" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/contacts", changefreq: "monthly", priority: "0.5" },
  { path: "/legal/privacy", changefreq: "yearly", priority: "0.3" },
  { path: "/legal/offer", changefreq: "yearly", priority: "0.3" },
];

const NICHES: Niche[] = [
  "real_estate",
  "auto",
  "clinic",
  "services",
  "online_school",
  "agency",
];

export const Route = createFileRoute("/sitemap.xml")({
  server: {
    handlers: {
      GET: async () => {
        const origin = getSiteOrigin();
        const today = new Date().toISOString().split("T")[0];
        const cases = await repository.listCaseStudies();

        const urls: string[] = [];

        for (const s of STATIC_PATHS) {
          urls.push(
            `  <url>
    <loc>${origin}${s.path}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>${s.changefreq}</changefreq>
    <priority>${s.priority}</priority>
  </url>`,
          );
        }

        for (const c of cases) {
          urls.push(
            `  <url>
    <loc>${origin}/cases/${c.slug}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
          );
        }

        for (const n of NICHES) {
          urls.push(
            `  <url>
    <loc>${origin}/scenarios/${n}</loc>
    <lastmod>${today}</lastmod>
    <changefreq>monthly</changefreq>
    <priority>0.7</priority>
  </url>`,
          );
        }

        const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.join("\n")}
</urlset>`;

        return new Response(xml, {
          headers: {
            "Content-Type": "application/xml; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
