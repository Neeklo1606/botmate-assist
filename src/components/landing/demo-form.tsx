/**
 * DemoForm — премиум форма заявки.
 *
 * Особенности:
 *  — RHF + zod (demoRequestSchema) с inline-ошибками под полями.
 *  — Автодетект типа контакта (phone / email / @telegram) → подсказка справа в поле.
 *  — Валидация onChange после первой попытки submit (mode: "onTouched").
 *  — Success-state: lime-галочка с пульсирующим кольцом, краткая инструкция,
 *    кнопка «Отправить ещё одну».
 *
 * Используется на главной (Demo), /first-100, /pricing.
 * source-prop пробрасывается в payload для трекинга.
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Link } from "@tanstack/react-router";
import { AtSign, Check, Loader2, Mail, Phone } from "lucide-react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  demoRequestSchema,
  detectContactKind,
  type ContactKind,
  type DemoRequestInput,
} from "@/lib/schemas";
import { useCreateDemoRequest } from "@/lib/hooks/use-landing";
import { nicheOptions } from "@/lib/format";
import { cn } from "@/lib/utils";

interface DemoFormProps {
  source?: DemoRequestInput["source"];
  variant?: "light" | "dark";
  ctaLabel?: string;
  className?: string;
}

const CONTACT_LABEL: Record<Exclude<ContactKind, "unknown">, string> = {
  phone: "Телефон",
  email: "Email",
  telegram: "Telegram",
};

export function DemoForm({
  source = "landing",
  variant = "light",
  ctaLabel = "Запустить за 3 дня",
  className,
}: DemoFormProps) {
  const [done, setDone] = useState(false);
  const isDark = variant === "dark";
  const mutation = useCreateDemoRequest();

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting, isSubmitted },
  } = useForm<DemoRequestInput>({
    resolver: zodResolver(demoRequestSchema),
    mode: "onTouched",
    reValidateMode: "onChange",
    defaultValues: { name: "", contact: "", niche: "real_estate", source },
  });

  const niche = watch("niche");
  const contactValue = watch("contact");
  const contactKind = useMemo(() => detectContactKind(contactValue ?? ""), [contactValue]);

  const onSubmit = (data: DemoRequestInput) => {
    mutation.mutate(
      { ...data, source },
      {
        onSuccess: () => {
          toast.success("Заявка отправлена", {
            description: "Свяжемся в течение 30 минут в рабочее время.",
          });
          setDone(true);
          reset({ name: "", contact: "", niche: "real_estate", source });
        },
        onError: () => {
          toast.error("Не удалось отправить", {
            description: "Попробуйте ещё раз или напишите в Telegram @botme_support.",
          });
        },
      },
    );
  };

  if (done) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: [0.16, 1, 0.3, 1] }}
        className={cn(
          "flex flex-col items-start gap-4 rounded-xl border p-6 md:p-7",
          isDark
            ? "border-border-strong/30 bg-background/5 text-background"
            : "border-border bg-surface text-foreground",
          className,
        )}
      >
        <div className="relative">
          <span
            aria-hidden
            className="absolute inset-0 -z-10 animate-ping rounded-full bg-accent/40"
            style={{ animationDuration: "1.6s" }}
          />
          <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent text-accent-ink shadow-lift">
            <Check className="h-6 w-6" strokeWidth={2.25} />
          </div>
        </div>
        <div>
          <div className="font-display text-lg font-semibold">Готово, мы получили заявку</div>
          <p className={cn("mt-1.5 text-sm", isDark ? "text-background/70" : "text-ink-muted")}>
            Менеджер напишет в течение 30 минут в рабочее время. По срочным вопросам — Telegram{" "}
            <a
              className="font-medium underline-offset-2 hover:underline"
              href="https://t.me/botme_support"
            >
              @botme_support
            </a>
            .
          </p>
        </div>
        <Button
          type="button"
          variant={isDark ? "ink" : "outline"}
          size="sm"
          onClick={() => setDone(false)}
        >
          Отправить ещё одну
        </Button>
      </motion.div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      noValidate
      className={cn(
        "rounded-xl border p-5 md:p-6",
        isDark ? "border-border-strong/30 bg-background/5" : "border-border bg-surface",
        className,
      )}
    >
      <div className="grid gap-4">
        <Field
          id="demo-name"
          label="Как вас зовут"
          isDark={isDark}
          error={errors.name?.message}
        >
          <Input
            id="demo-name"
            autoComplete="name"
            placeholder="Иван"
            aria-invalid={Boolean(errors.name)}
            className={cn(
              isDark &&
                "border-border-strong/30 bg-background/5 text-background placeholder:text-background/40",
            )}
            {...register("name")}
          />
        </Field>

        <Field
          id="demo-contact"
          label="Телефон, email или @username"
          isDark={isDark}
          error={errors.contact?.message}
          hint={
            !errors.contact && contactKind !== "unknown" ? (
              <ContactHint kind={contactKind} isDark={isDark} />
            ) : null
          }
        >
          <div className="relative">
            <Input
              id="demo-contact"
              inputMode="text"
              autoComplete="tel"
              placeholder="+7 999 123-45-67 или @ivan"
              aria-invalid={Boolean(errors.contact)}
              className={cn(
                "pr-24",
                isDark &&
                  "border-border-strong/30 bg-background/5 text-background placeholder:text-background/40",
              )}
              {...register("contact")}
            />
            {contactKind !== "unknown" && !errors.contact ? (
              <span
                aria-hidden
                className={cn(
                  "pointer-events-none absolute right-2 top-1/2 -translate-y-1/2 inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[11px] font-medium",
                  isDark
                    ? "bg-accent/20 text-accent"
                    : "bg-accent/15 text-foreground",
                )}
              >
                <ContactIcon kind={contactKind} />
                {CONTACT_LABEL[contactKind]}
              </span>
            ) : null}
          </div>
        </Field>

        <Field id="demo-niche" label="Ниша" isDark={isDark} error={errors.niche?.message}>
          <Select
            value={niche}
            onValueChange={(v) => setValue("niche", v as DemoRequestInput["niche"])}
          >
            <SelectTrigger
              id="demo-niche"
              className={cn(
                isDark && "border-border-strong/30 bg-background/5 text-background",
              )}
            >
              <SelectValue placeholder="Выберите нишу" />
            </SelectTrigger>
            <SelectContent>
              {nicheOptions.map((opt) => (
                <SelectItem key={opt.value} value={opt.value}>
                  {opt.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>

        <Button
          type="submit"
          variant={isDark ? "signal" : "brand"}
          size="lg"
          disabled={isSubmitting || mutation.isPending}
          className="mt-2 w-full"
        >
          {isSubmitting || mutation.isPending ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" /> Отправляем…
            </>
          ) : (
            ctaLabel
          )}
        </Button>

        {isSubmitted && (errors.name || errors.contact) ? (
          <p
            role="alert"
            className={cn(
              "text-xs",
              isDark ? "text-accent" : "text-destructive",
            )}
          >
            Проверьте подсвеченные поля и отправьте ещё раз.
          </p>
        ) : null}

        <p className={cn("text-xs", isDark ? "text-background/60" : "text-ink-subtle")}>
          Отправляя заявку, вы соглашаетесь с{" "}
          <Link
            to="/legal/privacy"
            className={cn(
              "underline-offset-2 hover:underline",
              isDark ? "text-background/80" : "text-foreground",
            )}
          >
            обработкой персональных данных
          </Link>{" "}
          и условиями{" "}
          <Link
            to="/legal/offer"
            className={cn(
              "underline-offset-2 hover:underline",
              isDark ? "text-background/80" : "text-foreground",
            )}
          >
            оферты
          </Link>
          .
        </p>
      </div>
    </form>
  );
}

function ContactIcon({ kind }: { kind: Exclude<ContactKind, "unknown"> }) {
  if (kind === "phone") return <Phone className="h-3 w-3" strokeWidth={2} />;
  if (kind === "email") return <Mail className="h-3 w-3" strokeWidth={2} />;
  return <AtSign className="h-3 w-3" strokeWidth={2} />;
}

function ContactHint({
  kind,
  isDark,
}: {
  kind: Exclude<ContactKind, "unknown">;
  isDark: boolean;
}) {
  const text =
    kind === "phone"
      ? "Распознали телефон — позвоним или напишем в WhatsApp."
      : kind === "email"
        ? "Распознали email — отправим демо-доступ туда."
        : "Распознали Telegram — напишем в личку.";
  return (
    <span className={cn(isDark ? "text-background/60" : "text-ink-subtle")}>{text}</span>
  );
}

function Field({
  id,
  label,
  isDark,
  error,
  hint,
  children,
}: {
  id: string;
  label: string;
  isDark: boolean;
  error?: string;
  hint?: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <Label
        htmlFor={id}
        className={cn(
          "mb-1.5 block text-xs font-medium",
          isDark ? "text-background/70" : "text-ink-muted",
        )}
      >
        {label}
      </Label>
      {children}
      {error ? (
        <p
          role="alert"
          className={cn("mt-1.5 text-xs", isDark ? "text-accent" : "text-destructive")}
        >
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1.5 text-xs">{hint}</p>
      ) : null}
    </div>
  );
}
