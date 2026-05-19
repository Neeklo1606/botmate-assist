/**
 * /legal/offer — Договор-оферта.
 */
import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/landing/legal-layout";
import { useLegalDoc } from "@/lib/hooks/use-marketing";
import { buildPageMeta, canonicalLink } from "@/lib/seo";

export const Route = createFileRoute("/_marketing/legal/offer")({
  head: () => ({
    meta: buildPageMeta({
      title: "Договор-оферта botme — условия использования сервиса",
      description:
        "Стоимость, порядок оплаты, возврат средств в первые 14 дней, обязательства сторон. Реквизиты ИП Клочко Никита Николаевич.",
      path: "/legal/offer",
    }),
    links: [canonicalLink("/legal/offer")],
  }),
  component: OfferPage,
});

function OfferPage() {
  const { data: doc, isLoading } = useLegalDoc("offer");
  return <LegalLayout doc={doc} isLoading={isLoading} />;
}
