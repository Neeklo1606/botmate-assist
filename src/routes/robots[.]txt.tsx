/**
 * /robots.txt — server route. Отвечает text/plain.
 * Открываем индексацию для всех маркетинговых страниц, закрываем кабинет и auth.
 */
import { createFileRoute } from "@tanstack/react-router";
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import type * as _StartTypes from "@tanstack/start-client-core";
import { getSiteOrigin } from "@/lib/seo";

export const Route = createFileRoute("/robots.txt")({
  server: {
    handlers: {
      GET: () => {
        const origin = getSiteOrigin();
        const body = [
          "User-agent: *",
          "Allow: /",
          "Disallow: /app",
          "Disallow: /app/",
          "Disallow: /login",
          "Disallow: /signup",
          "Disallow: /callback",
          "",
          `Sitemap: ${origin}/sitemap.xml`,
          "",
        ].join("\n");
        return new Response(body, {
          headers: {
            "Content-Type": "text/plain; charset=utf-8",
            "Cache-Control": "public, max-age=3600",
          },
        });
      },
    },
  },
});
