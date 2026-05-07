import {
  Outlet,
  Link,
  HeadContent,
  Scripts,
  createRootRouteWithContext,
  useRouter,
} from "@tanstack/react-router";
import { useEffect } from "react";
import { QueryClient, QueryClientProvider, useQuery } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/sonner";
import { LocaleProvider } from "@/lib/i18n/locale";
import { repository } from "@/lib/mock/repository";
import { qk } from "@/lib/query-keys";
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

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ru">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

/**
 * AuthSync — пробрасывает текущего user в router.context.auth,
 * чтобы beforeLoad в _app.tsx видел актуальное состояние без
 * локального стораджа. Чисто in-memory на уровне TanStack Query cache.
 */
function AuthSync() {
  const router = useRouter();
  const { data: user } = useQuery({
    queryKey: qk.auth.currentUser,
    queryFn: () => repository.getCurrentUser(),
    staleTime: Infinity,
  });

  useEffect(() => {
    router.update({
      context: {
        ...router.options.context,
        auth: {
          isAuthenticated: !!user,
          user: user ?? null,
        },
      },
    });
    router.invalidate();
  }, [user, router]);

  return null;
}

function RootComponent() {
  const { queryClient } = Route.useRouteContext();
  return (
    <QueryClientProvider client={queryClient}>
      <LocaleProvider>
        <AuthSync />
        <Outlet />
        <Toaster richColors position="top-center" />
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
      { title: "Botme" },
      { property: "og:title", content: "Botme" },
      { name: "twitter:title", content: "Botme" },
      { name: "description", content: "Создание ИИ агента" },
      { property: "og:description", content: "Создание ИИ агента" },
      { name: "twitter:description", content: "Создание ИИ агента" },
      { property: "og:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5733b852-b34f-4ec9-91b0-48c52bb10b05/id-preview-91d5218c--c5266d52-731d-4813-a65e-333c0d9062ac.lovable.app-1776621917109.png" },
      { name: "twitter:image", content: "https://pub-bb2e103a32db4e198524a2e9ed8f35b4.r2.dev/5733b852-b34f-4ec9-91b0-48c52bb10b05/id-preview-91d5218c--c5266d52-731d-4813-a65e-333c0d9062ac.lovable.app-1776621917109.png" },
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

