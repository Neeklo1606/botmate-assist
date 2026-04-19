/**
 * Временный «фундамент готов» — показывает, что дизайн-система,
 * шрифты и palette подняты. Заменяется лендингом на следующем шаге.
 */
import { createFileRoute } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { Container } from "@/components/layout/container";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "botme — AI-ассистенты, которые продают за вас" },
      {
        name: "description",
        content:
          "Подключаем AI-ассистента к Telegram, сайту, Avito и CRM за 3 дня. Отвечает за 7 секунд, квалифицирует лида, доводит до сделки.",
      },
      { property: "og:title", content: "botme — AI-ассистенты, которые продают за вас" },
      {
        property: "og:description",
        content:
          "Подключаем AI-ассистента к Telegram, сайту, Avito и CRM за 3 дня.",
      },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <Container className="py-24 md:py-32">
        <div className="max-w-[640px]">
          <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-accent" />
            v1 · фундамент готов
          </div>
          <h1 className="text-4xl md:text-5xl font-semibold tracking-tight">
            Дизайн-система, типы и mock-репозиторий подняты.
          </h1>
          <p className="mt-4 text-base text-muted-foreground">
            Палитра{" "}
            <span className="font-medium text-foreground">Graphite Ink</span>{" "}
            <span className="rounded-sm bg-accent px-1 font-mono text-[13px] text-accent-ink">
              #0F1113
            </span>
            , акцент{" "}
            <span className="font-medium text-foreground">Electric Lime</span>{" "}
            <span className="rounded-sm bg-accent px-1 font-mono text-[13px] text-accent-ink">
              #C5F04A
            </span>
            , шрифты Geist, токены радиусов и теней — всё в{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 font-mono text-[13px]">
              src/styles.css
            </code>
            .
          </p>

          <div className="mt-8 flex flex-wrap items-center gap-3">
            <Button variant="brand" size="lg">
              Запустить за 3 дня
            </Button>
            <Button variant="outline" size="lg">
              Посмотреть демо
            </Button>
          </div>

          <div className="mt-12 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[
              { label: "Brand", value: "Geist 600" },
              { label: "Body", value: "Geist 400 / 15px" },
              { label: "Radius", value: "8 / 12 / 16" },
              { label: "Accent", value: "#C5F04A" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-lg border border-border bg-surface p-4"
              >
                <div className="text-xs text-muted-foreground">{item.label}</div>
                <div className="mt-1 text-sm font-medium tabular">{item.value}</div>
              </div>
            ))}
          </div>
        </div>
      </Container>
    </main>
  );
}
