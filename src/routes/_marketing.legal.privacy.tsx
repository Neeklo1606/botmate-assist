/**
 * /legal/privacy — Политика конфиденциальности.
 */
import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/landing/legal-layout";
import { useLegalDoc } from "@/lib/hooks/use-marketing";

export const Route = createFileRoute("/_marketing/legal/privacy")({
  head: () => ({
    meta: [
      { title: "Политика конфиденциальности — botme" },
      {
        name: "description",
        content: "Как botme обрабатывает персональные данные. Соответствие 152-ФЗ. Хранение в РФ.",
      },
      { property: "og:title", content: "Политика конфиденциальности — botme" },
    ],
  }),
  component: PrivacyPage,
});

function PrivacyPage() {
  const { data: doc, isLoading } = useLegalDoc("privacy");
  return <LegalLayout doc={doc} isLoading={isLoading} />;
}
