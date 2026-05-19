/**
 * WizardStep — рендер одного шага: header + список field-компонентов.
 */
import type { WizardStepDef, FieldDef } from "@/lib/onboarding/types";
import { TextField } from "./fields/TextField";
import { TextareaField } from "./fields/TextareaField";
import { SelectField } from "./fields/SelectField";
import { PillSelectField } from "./fields/PillSelectField";
import { PillMultiField } from "./fields/PillMultiField";
import { CardSelectField } from "./fields/CardSelectField";
import { CardMultiField } from "./fields/CardMultiField";
import { NumberField } from "./fields/NumberField";
import { UrlField } from "./fields/UrlField";
import { FileUploadField } from "./fields/FileUploadField";
import { ColorField } from "./fields/ColorField";
import { ToneField } from "./fields/ToneField";
import { CheckboxField } from "./fields/CheckboxField";
import { CheckCircle2 } from "lucide-react";

interface Props {
  step: WizardStepDef;
  data: Record<string, unknown>;
  errors: Record<string, string>;
  setField: (name: string, value: unknown) => void;
}

function renderField(
  field: FieldDef,
  data: Record<string, unknown>,
  errors: Record<string, string>,
  setField: (name: string, value: unknown) => void,
) {
  const v = data[field.name];
  const err = errors[field.name];
  const common = {
    name: field.name,
    label: field.label,
    helperText: field.helperText,
    required: field.required,
    error: err,
    placeholder: field.placeholder,
  };
  switch (field.type) {
    case "text":
      return (
        <TextField
          key={field.name}
          {...common}
          value={(v as string) ?? ""}
          onChange={(val) => setField(field.name, val)}
        />
      );
    case "textarea":
      return (
        <TextareaField
          key={field.name}
          {...common}
          rows={field.rows}
          value={(v as string) ?? ""}
          onChange={(val) => setField(field.name, val)}
        />
      );
    case "select":
      return (
        <SelectField
          key={field.name}
          {...common}
          options={field.options ?? []}
          value={(v as string) ?? ""}
          onChange={(val) => setField(field.name, val)}
        />
      );
    case "pill-single":
      return (
        <PillSelectField
          key={field.name}
          label={field.label}
          helperText={field.helperText}
          required={field.required}
          error={err}
          options={field.options ?? []}
          value={(v as string) ?? ""}
          onChange={(val) => setField(field.name, val)}
        />
      );
    case "pill-multi":
      return (
        <PillMultiField
          key={field.name}
          label={field.label}
          helperText={field.helperText}
          required={field.required}
          error={err}
          options={field.options ?? []}
          max={field.max}
          min={field.min}
          value={(v as string[]) ?? []}
          onChange={(val) => setField(field.name, val)}
        />
      );
    case "card-single":
      return (
        <CardSelectField
          key={field.name}
          label={field.label}
          helperText={field.helperText}
          required={field.required}
          error={err}
          options={field.options ?? []}
          value={(v as string) ?? ""}
          onChange={(val) => setField(field.name, val)}
        />
      );
    case "card-multi":
      return (
        <CardMultiField
          key={field.name}
          label={field.label}
          helperText={field.helperText}
          required={field.required}
          error={err}
          options={field.options ?? []}
          max={field.max}
          value={(v as string[]) ?? []}
          onChange={(val) => setField(field.name, val)}
        />
      );
    case "number":
      return (
        <NumberField
          key={field.name}
          {...common}
          min={field.min}
          max={field.max}
          value={(v as number) ?? 0}
          onChange={(val) => setField(field.name, val)}
        />
      );
    case "url":
      return (
        <UrlField
          key={field.name}
          {...common}
          value={(v as string) ?? ""}
          onChange={(val) => setField(field.name, val)}
        />
      );
    case "file-upload":
      return (
        <FileUploadField
          key={field.name}
          name={field.name}
          label={field.label}
          helperText={field.helperText}
          required={field.required}
          error={err}
          value={(v as { name: string } | null) ?? null}
          onChange={(val) => setField(field.name, val)}
        />
      );
    case "color":
      return (
        <ColorField
          key={field.name}
          {...common}
          value={(v as string) ?? ""}
          onChange={(val) => setField(field.name, val)}
        />
      );
    case "tone":
      return (
        <ToneField
          key={field.name}
          label={field.label}
          helperText={field.helperText}
          required={field.required}
          error={err}
          options={field.options}
          value={(v as string) ?? ""}
          onChange={(val) => setField(field.name, val)}
        />
      );
    case "checkbox":
      return (
        <CheckboxField
          key={field.name}
          name={field.name}
          label={field.label}
          helperText={field.helperText}
          required={field.required}
          error={err}
          value={v === true}
          onChange={(val) => setField(field.name, val)}
          withLegalLinks={field.name === "consent"}
        />
      );
  }
}

export function WizardStep({ step, data, errors, setField }: Props) {
  const isAuth = step.kind === "auth";
  const visibleFields = step.fields.filter((f) =>
    f.showIf ? f.showIf(data) : true,
  );
  const consentField = isAuth
    ? visibleFields.find((f) => f.type === "checkbox")
    : undefined;
  const inputFields = isAuth
    ? visibleFields.filter((f) => f.type !== "checkbox")
    : visibleFields;

  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <header className="flex flex-col">
        {isAuth && (
          <div className="mb-5 inline-flex h-16 w-16 items-center justify-center rounded-full bg-accent/15 [animation:pulse_2.4s_ease-in-out_infinite]">
            <CheckCircle2
              className="h-9 w-9 text-accent"
              strokeWidth={1.75}
              aria-hidden
            />
          </div>
        )}
        {step.optional && (
          <span className="mb-3 inline-flex w-fit items-center rounded-[4px] border border-border-dark bg-bg-soft px-2.5 py-1 font-mono text-[11px] uppercase tracking-wide text-ink-dark-subtle">
            Опционально
          </span>
        )}
        <h1 className="font-display font-semibold text-ink-dark text-[28px] leading-[1.1] tracking-[-0.03em] md:text-[36px]">
          {step.title}
        </h1>
        {step.description && (
          <p className="mt-3 max-w-[580px] text-[16px] leading-[1.55] text-ink-dark-muted md:text-[18px]">
            {step.description}
          </p>
        )}
      </header>
      {isAuth ? (
        <div className="rounded-2xl border border-border-dark bg-bg-elevated p-6 md:p-7">
          <div className="flex flex-col gap-6">
            {inputFields.map((f) => renderField(f, data, errors, setField))}
          </div>
          {consentField && (
            <div className="mt-6 border-t border-border-dark pt-5">
              {renderField(consentField, data, errors, setField)}
            </div>
          )}
        </div>
      ) : (
        <div className="flex flex-col gap-6">
          {visibleFields.map((f) => renderField(f, data, errors, setField))}
        </div>
      )}
    </div>
  );
}
