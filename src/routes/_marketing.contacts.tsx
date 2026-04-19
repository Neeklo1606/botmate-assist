/**
 * /contacts — форма обратной связи + контактная информация.
 */
import { createFileRoute } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Mail, MessageCircle, Send } from "lucide-react";
import { toast } from "sonner";
import { Container } from "@/components/layout/container";
import { Section } from "@/components/layout/section";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { contactRequestSchema, type ContactRequestInput } from "@/lib/schemas";
import { useCreateContactRequest } from "@/lib/hooks/use-marketing";

export const Route = createFileRoute("/_marketing/contacts")({
  head: () => ({
    meta: [
      { title: "Контакты — botme" },
      {
        name: "description",
        content: "Связаться с командой botme: Telegram-поддержка, email, форма обратной связи.",
      },
      { property: "og:title", content: "Контакты — botme" },
      {
        property: "og:description",
        content: "Свяжитесь с командой botme.",
      },
    ],
  }),
  component: ContactsPage,
});

function ContactsPage() {
  const createRequest = useCreateContactRequest();

  const form = useForm<ContactRequestInput>({
    resolver: zodResolver(contactRequestSchema),
    defaultValues: { name: "", email: "", topic: "", message: "" },
  });

  const onSubmit = (values: ContactRequestInput) => {
    createRequest.mutate(values, {
      onSuccess: () => {
        toast.success("Спасибо! Мы свяжемся в течение часа.");
        form.reset();
      },
      onError: () => {
        toast.error("Не удалось отправить. Попробуйте ещё раз.");
      },
    });
  };

  return (
    <Section size="lg">
      <Container>
        <div className="grid gap-12 md:grid-cols-12">
          <div className="md:col-span-5">
            <div className="mb-4 inline-flex items-center rounded-full border border-border bg-surface px-3 py-1 text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Контакты
            </div>
            <h1 className="font-display text-4xl font-semibold tracking-[-0.02em] md:text-5xl md:leading-[1.05]">
              Свяжитесь с командой botme
            </h1>
            <p className="mt-5 text-base text-ink-muted">
              Отвечаем в течение часа в рабочее время. Telegram — самый быстрый канал.
            </p>

            <div className="mt-8 space-y-4">
              <a
                href="https://t.me/botme_support"
                target="_blank"
                rel="noreferrer noopener"
                className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong"
              >
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-foreground text-background">
                  <Send className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-display text-base font-semibold text-foreground">
                    Telegram
                  </div>
                  <div className="text-sm text-ink-muted">@botme_support</div>
                </div>
              </a>

              <a
                href="mailto:hello@botme.ru"
                className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4 transition-colors hover:border-border-strong"
              >
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-foreground text-background">
                  <Mail className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-display text-base font-semibold text-foreground">Email</div>
                  <div className="text-sm text-ink-muted">hello@botme.ru</div>
                </div>
              </a>

              <div className="flex items-start gap-3 rounded-xl border border-border bg-surface p-4">
                <div className="flex h-10 w-10 flex-none items-center justify-center rounded-md bg-foreground text-background">
                  <MessageCircle className="h-5 w-5" strokeWidth={1.5} />
                </div>
                <div>
                  <div className="font-display text-base font-semibold text-foreground">
                    Время ответа
                  </div>
                  <div className="text-sm text-ink-muted">
                    Пн–Пт, 10:00–20:00 МСК. Лиды-демо — в любой день.
                  </div>
                </div>
              </div>
            </div>
          </div>

          <form
            onSubmit={form.handleSubmit(onSubmit)}
            className="md:col-span-7 space-y-4 rounded-xl border border-border bg-surface p-6 md:p-8"
            noValidate
          >
            <h2 className="font-display text-xl font-semibold text-foreground">
              Отправить сообщение
            </h2>

            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="contact-name">Имя</Label>
                <Input
                  id="contact-name"
                  {...form.register("name")}
                  placeholder="Никита"
                  aria-invalid={!!form.formState.errors.name}
                  className="mt-1.5"
                />
                {form.formState.errors.name ? (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.name.message}
                  </p>
                ) : null}
              </div>
              <div>
                <Label htmlFor="contact-email">Email</Label>
                <Input
                  id="contact-email"
                  type="email"
                  {...form.register("email")}
                  placeholder="you@company.ru"
                  aria-invalid={!!form.formState.errors.email}
                  className="mt-1.5"
                />
                {form.formState.errors.email ? (
                  <p className="mt-1 text-xs text-destructive">
                    {form.formState.errors.email.message}
                  </p>
                ) : null}
              </div>
            </div>

            <div>
              <Label htmlFor="contact-topic">Тема</Label>
              <Input
                id="contact-topic"
                {...form.register("topic")}
                placeholder="Кастомная интеграция / партнёрство / другое"
                aria-invalid={!!form.formState.errors.topic}
                className="mt-1.5"
              />
              {form.formState.errors.topic ? (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.topic.message}
                </p>
              ) : null}
            </div>

            <div>
              <Label htmlFor="contact-message">Сообщение</Label>
              <Textarea
                id="contact-message"
                {...form.register("message")}
                placeholder="Расскажите коротко — про бизнес, задачу, ожидания."
                rows={6}
                aria-invalid={!!form.formState.errors.message}
                className="mt-1.5 resize-none"
              />
              {form.formState.errors.message ? (
                <p className="mt-1 text-xs text-destructive">
                  {form.formState.errors.message.message}
                </p>
              ) : null}
            </div>

            <Button
              type="submit"
              variant="brand"
              size="lg"
              className="w-full"
              disabled={createRequest.isPending}
            >
              {createRequest.isPending ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Отправляем…
                </>
              ) : (
                "Отправить"
              )}
            </Button>
            <p className="text-center text-xs text-ink-subtle">
              Нажимая «Отправить», вы соглашаетесь с обработкой персональных данных.
            </p>
          </form>
        </div>
      </Container>
    </Section>
  );
}
