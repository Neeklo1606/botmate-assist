/**
 * /legal/offer — Договор-оферта.
 */
import { createFileRoute } from "@tanstack/react-router";
import { LegalLayout } from "@/components/landing/legal-layout";
import { useLegalDoc } from "@/lib/hooks/use-marketing";

export const Route = createFileRoute("/_marketing/legal/offer")({
  head: () => ({
    meta: [
      { title: "Договор-оферта botme" },
      {
        name: "description",
        content:
          "Условия использования сервиса botme. Стоимость, возврат средств, обязательства сторон.",
      },
      { property: "og:title", content: "Договор-оферта botme" },
    ],
  }),
  component: OfferPage,
});

function OfferPage() {
  const { data: doc, isLoading } = useLegalDoc("offer");
  return <LegalLayout doc={doc} isLoading={isLoading} />;
}
