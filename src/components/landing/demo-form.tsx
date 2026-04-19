/**
 * DemoForm — форма заявки. RHF + zod из /lib/schemas.
 * Используется на главной (Demo секция), в /first-100 и /pricing.
 * source-prop проставляет hidden поле для трекинга.
 */
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import { Check, Loader2 } from "lucide-react";
import { useState } from "react";

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
import { demoRequestSchema, type DemoRequestInput } from "@/lib/schemas";
import { useCreateDemoRequest } from "@/lib/hooks/use-landing";
import { nicheOptions } from "@/lib/format";
import { cn } from "@/lib/utils";

interface DemoFormProps {
  source?: DemoRequestInput["source"];
  variant?: "light" | "dark";
  ctaLabel?: string;
  className?: string;
}

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
    formState: { errors, isSubmitting },
  } = useForm<DemoRequestInput>({
    resolver: zodResolver(demoRequestSchema),
    defaultValues: { name: "", contact: "", niche: "real_estate", source },
  });

  const niche = watch("niche");

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
      <div
        className={cn(
          "flex flex-col items-start gap-3 rounded-xl border p-6",
          isDark
            ? "border-border-strong/30 bg-background/5 text-background"
            : "border-border bg-surface text-foreground",
          className,
        )}
      >
        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent text-accent-ink">
          <Check className="h-5 w-5" strokeWidth={2} />
        </div>
        <div>
          <div className="text-lg font-semibold">Готово, мы получили заявку</div>
          <p className={cn("mt-1 text-sm", isDark ? "text-background/70" : "text-ink-muted")}>
            Менеджер напишет в течение 30 минут в рабочее время. По срочным вопросам, в Telegram{" "}
            <a className="underline-offset-2 hover:underline" href="https://t.me/botme_support">
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
      </div>
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
        <Field id="demo-name" label="Как вас зовут" isDark={isDark} error={errors.name?.message}>
          <Input
            id="demo-name"
            autoComplete="name"
            placeholder="Иван"
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
        >
          <Input
            id="demo-contact"
            placeholder="+7 999 123-45-67 или @ivan"
            className={cn(
              isDark &&
                "border-border-strong/30 bg-background/5 text-background placeholder:text-background/40",
            )}
            {...register("contact")}
          />
        </Field>

        <Field id="demo-niche" label="Ниша" isDark={isDark} error={errors.niche?.message}>
          <Select
            value={niche}
            onValueChange={(v) => setValue("niche", v as DemoRequestInput["niche"])}
          >
            <SelectTrigger
              id="demo-niche"
              className={cn(isDark && "border-border-strong/30 bg-background/5 text-background")}
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

        <p className={cn("text-xs", isDark ? "text-background/60" : "text-ink-subtle")}>
          Отправляя заявку, вы соглашаетесь с обработкой персональных данных.
        </p>
      </div>
    </form>
  );
}

function Field({
  id,
  label,
  isDark,
  error,
  children,
}: {
  id: string;
  label: string;
  isDark: boolean;
  error?: string;
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
        <p className={cn("mt-1.5 text-xs", isDark ? "text-accent" : "text-destructive")}>{error}</p>
      ) : null}
    </div>
  );
}
