/**
 * LaunchSection — компактный таймлайн «3 дня до запуска».
 */
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";

const days = [
  {
    day: "День 1",
    title: "Загружаем базу знаний",
    description: "Берём ваши тексты, прайс, FAQ. Структурируем под ассистента.",
  },
  {
    day: "День 2",
    title: "Настраиваем сценарии и тон",
    description: "Прописываем поведение под нишу. Тестируем на реальных диалогах.",
  },
  {
    day: "День 3",
    title: "Подключаем каналы и CRM",
    description: "Telegram, сайт, Avito — на ваш выбор. Связываем с amoCRM или Bitrix24.",
  },
];

export function LaunchSection() {
  return (
    <Section tone="muted" size="md">
      <Container>
        <SectionHeading
          eyebrow="Запуск"
          title="3 дня от старта до первого диалога"
          description="Никаких «согласований 2 недели». Команда neeklo собирает ассистента руками, вы только утверждаете."
        />

        <ol className="grid gap-3 md:grid-cols-3">
          {days.map((d, idx) => (
            <li
              key={d.day}
              className="relative rounded-xl border border-border bg-surface p-5"
            >
              <div className="flex items-center gap-2 text-xs font-medium uppercase tracking-wide text-ink-subtle">
                <span className="font-mono tabular text-foreground">0{idx + 1}</span>
                <span>{d.day}</span>
              </div>
              <div className="mt-3 font-display text-lg font-semibold text-foreground">
                {d.title}
              </div>
              <p className="mt-2 text-sm text-ink-muted">{d.description}</p>
            </li>
          ))}
        </ol>
      </Container>
    </Section>
  );
}
