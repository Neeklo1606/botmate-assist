/**
 * BriefView — read-only отображение всех ответов брифа.
 * Берёт config (по kind) и матчит metadata к briefData.
 */
import type { Project } from "@/lib/projects/types";
import { getOnboardingConfig } from "@/lib/onboarding/configs";
import type { FieldDef } from "@/lib/onboarding/types";

export function BriefView({ project }: { project: Project }) {
  const config = getOnboardingConfig(project.kind);
  const data = project.briefData ?? {};

  return (
    <div className="space-y-5">
      <div className="rounded-xl p-5" style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}>
        <h3 className="font-display text-base font-semibold text-white">Ваш бриф</h3>
        <p className="mt-1 text-sm" style={{ color: "rgba(255,255,255,0.6)" }}>
          На основе этих ответов мы настраиваем проект. Чтобы изменить — свяжитесь с поддержкой.
        </p>
      </div>

      {config.steps.map((step) => {
        const visible = step.fields.filter((f) => f.name in data && data[f.name] !== "" && data[f.name] != null);
        if (visible.length === 0) return null;
        return (
          <section
            key={step.id}
            className="rounded-xl"
            style={{ background: "#1a1a1a", border: "1px solid #2a2a2a" }}
          >
            <header className="border-b px-5 py-3" style={{ borderColor: "#2a2a2a" }}>
              <h4 className="font-display text-sm font-semibold text-white">{step.title}</h4>
            </header>
            <dl className="divide-y" style={{ borderColor: "#2a2a2a" }}>
              {visible.map((f) => (
                <div key={f.name} className="grid grid-cols-1 gap-1 px-5 py-3 sm:grid-cols-[200px_1fr] sm:gap-4">
                  <dt className="text-xs font-medium" style={{ color: "rgba(255,255,255,0.5)" }}>{f.label}</dt>
                  <dd className="text-sm text-white">{formatValue(f, data[f.name])}</dd>
                </div>
              ))}
            </dl>
          </section>
        );
      })}
    </div>
  );
}

function formatValue(f: FieldDef, raw: unknown): string {
  if (raw == null) return "—";
  if (Array.isArray(raw)) {
    return raw
      .map((v) => labelFor(f, String(v)))
      .filter(Boolean)
      .join(", ") || "—";
  }
  if (typeof raw === "boolean") return raw ? "Да" : "Нет";
  return labelFor(f, String(raw));
}

function labelFor(f: FieldDef, value: string): string {
  if (!f.options) return value;
  const o = f.options.find((opt) => opt.value === value);
  return o?.label ?? value;
}
