/**
 * LaunchSection — компактный таймлайн «3 дня до запуска».
 */
import { Container } from "@/components/layout/container";
import { Section, SectionHeading } from "@/components/layout/section";
import { useLocale } from "@/lib/i18n/locale";

export function LaunchSection() {
  const { t } = useLocale();

  const days = [
    { day: t("launch.day1"), title: t("launch.day1Title"), description: t("launch.day1Desc") },
    { day: t("launch.day2"), title: t("launch.day2Title"), description: t("launch.day2Desc") },
    { day: t("launch.day3"), title: t("launch.day3Title"), description: t("launch.day3Desc") },
  ];

  return (
    <Section tone="muted" size="md">
      <Container>
        <SectionHeading
          eyebrow={t("launch.eyebrow")}
          title={t("launch.title")}
          description={t("launch.desc")}
        />

        <ol className="grid gap-3 md:grid-cols-3">
          {days.map((d, idx) => (
            <li key={d.day} className="relative rounded-xl border border-border bg-surface p-5">
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
