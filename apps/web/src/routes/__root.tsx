import {
  Outlet,
  Link,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { LocaleProvider } from "@/lib/i18n/locale";
import { AuthProvider } from "@/lib/auth";
import { attachAuthInterceptors } from "@/lib/api/client";
import { PLAUSIBLE_DOMAIN, PLAUSIBLE_SRC } from "@/lib/analytics";
import type { AuthRouterState } from "@/router";

import appCss from "../styles.css?url";

interface RouterContext {
  queryClient: QueryClient;
  auth: AuthRouterState;
}

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-background px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-semibold tracking-tight text-foreground">404</h1>
        <h2 className="mt-4 text-xl font-semibold text-foreground">Страница не найдена</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Адрес изменился или такой страницы у нас нет.
        </p>
        <div className="mt-6">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground transition-colors hover:bg-primary-hover"
          >
            На главную
          </Link>
        </div>
      </div>
    </div>
  );
}

const CLIENT_PROCESS_ENV =
  'window.process=window.process||{env:{NODE_ENV:"production",TSS_ROUTER_BASEPATH:"",TSS_SERVER_FN_BASE:"",TSS_DEV_SERVER:"true",TSS_DEV_SSR_STYLES_ENABLED:"false",TSS_DEV_SSR_STYLES_BASEPATH:"",TSS_INLINE_CSS_ENABLED:"false",TSS_DISABLE_CSRF_MIDDLEWARE_WARNING:"false"}};';

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <script dangerouslySetInnerHTML={{ __html: CLIENT_PROCESS_ENV }} />
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();

  useEffect(() => {
    attachAuthInterceptors(queryClient);
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <AuthProvider>
          <Outlet />
          <Toaster richColors position="top-center" />
        </AuthProvider>
      </LocaleProvider>
    </QueryClientProvider>
  );
}

export const Route = createRootRouteWithContext<RouterContext>()({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      // Defaults — каждый маркетинг-роут переопределяет своим buildPageMeta(...)
      { name: "author", content: "botme" },
      { name: "theme-color", content: "#0F1115" },
      { property: "og:site_name", content: "botme" },
      { property: "og:locale", content: "ru_RU" },
      { name: "twitter:card", content: "summary_large_image" },
      { property: "og:type", content: "website" },
    ],
    links: [
      // Preconnect к Google Fonts — экономит ~100–300ms на TTF.
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: appCss },
      { rel: "icon", href: "/favicon.ico" },
    ],
    scripts: [
      // Plausible — lightweight, без cookies. defer не блокирует рендер.
      // Скрипт инжектит window.plausible(name, { props }), который дергает src/lib/analytics.ts.
      {
        src: PLAUSIBLE_SRC,
        defer: true,
        "data-domain": PLAUSIBLE_DOMAIN,
      },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

