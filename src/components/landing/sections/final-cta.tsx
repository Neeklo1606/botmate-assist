/**
 * FinalCTA — финальный тёмный блок (второй dark на странице).
 * Одна строка ценности + 2 CTA + микро-копи.
 */
import { Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { track } from "@/lib/analytics";

export function FinalCTA() {
  return (
    <Section tone="ink" size="md" data-hide-sticky-cta>
      <Container>
        <div className="mx-auto max-w-[760px] text-center text-background">
          <h2 className="font-display text-3xl font-semibold tracking-[-0.02em] md:text-[42px]">
            Запустите ассистента за 3 дня. Платите, когда увидите первые лиды.
          </h2>
          <p className="mt-4 text-[15px] text-background/70 md:text-base">
            Бесплатное демо за 30 минут. Возврат в первые 14 дней. Без долгих контрактов.
          </p>

          <div className="mt-7 flex flex-col items-center justify-center gap-3 sm:flex-row">
            <Button asChild variant="signal" size="lg">
              <Link
                to="/"
                hash="demo"
                onClick={() => track("cta-click", { location: "final-cta", intent: "demo" })}
              >
                Получить демо
                <ArrowRight className="h-4 w-4" strokeWidth={1.5} />
              </Link>
            </Button>
            <Button asChild variant="ink" size="lg">
              <Link
                to="/first-100"
                onClick={() => track("cta-click", { location: "final-cta", intent: "first-100" })}
              >
                Программа «Первые 100»
              </Link>
            </Button>
          </div>
        </div>
      </Container>
    </Section>
  );
}
