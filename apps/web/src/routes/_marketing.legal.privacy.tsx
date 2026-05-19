/**
 * /legal/privacy — Политика конфиденциальности.
 */
import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/landing/legal-layout";
import { useLegalDoc } from "@/lib/hooks/use-marketing";
import { buildPageMeta, canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/_marketing/legal/privacy")({
  head: () => ({
    meta: buildPageMeta({
      title: "Политика конфиденциальности — botme",
      description:
        "Как botme обрабатывает персональные данные. Соответствие 152-ФЗ. Хранение данных в РФ. Права субъекта ПД.",
      path: "/legal/privacy",
    }),
    links: [canonicalLink("/legal/privacy")],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { data: doc, isLoading } = useLegalDoc("privacy");
  return <LegalLayout doc={doc} isLoading={isLoading} />;
}
