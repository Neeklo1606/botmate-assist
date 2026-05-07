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
  }
}

export function WizardStep({ step, data, errors, setField }: Props) {
  return (
    <div className="flex flex-col gap-6 md:gap-8">
      <header className="flex flex-col">
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
      <div className="flex flex-col gap-6">
        {step.fields
          .filter((f) => (f.showIf ? f.showIf(data) : true))
          .map((f) => renderField(f, data, errors, setField))}
      </div>
    </div>
  );
}
