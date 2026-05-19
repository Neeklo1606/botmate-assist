import { useEffect, type ReactElement } from "react";
import { ApiClientError } from "@botmate/shared";
import { trackProductEvent } from "@/lib/product-analytics";
import { Card, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const RUNTIME_ERROR_HINTS: Record<string, string> = {
  RUNTIME_API_DISABLED: "Раздел отключён на стороне API. Обратитесь к администратору.",
  RUNTIME_REDIS_UNAVAILABLE: "Не настроен Redis для очередей и событий. Свяжитесь с поддержкой.",
  RUNTIME_EXECUTION_NOT_FOUND: "Запуск не найден — используйте идентификатор из этой рабочей области.",
  ASSISTANT_RUN_ENQUEUE_DISABLED: "Внутренний асинхронный путь отключён — используйте чат как основной.",
  RECONCILE_ENQUEUE_COOLDOWN: "Подождите окончания паузы сверки и повторите.",
  VALIDATION_001: "Проверьте параметры запроса и попробуйте снова.",
  FORBIDDEN_001: "Действие недоступно вашей роли — обратитесь к администратору.",
};

const RUNTIME_SELF_DIAGNOSIS: Record<string, string[]> = {
  RUNTIME_REDIS_UNAVAILABLE: [
    "Сверьте, что Redis настроен и доступен.",
    "Свяжитесь с администратором, если проблема повторяется.",
  ],
  default: [
    "Обновите страницу — связь восстановится автоматически.",
    "Если запусков нет, отправьте первое сообщение в чате.",
    "Поделитесь кодом ошибки выше с поддержкой.",
  ],
};

export function RuntimeApiErrorCard(props: {
  title: string;
  error: unknown;
  className?: string;
}): ReactElement | null {
  useEffect(() => {
    if (!props.error) return;
    const code =
      props.error instanceof ApiClientError ? (props.error.code ?? "unknown") : "unknown";
    trackProductEvent("support.runtime_api_error", { props: { code } });
  }, [props.error]);

  if (!props.error) return null;
  const err = props.error;
  const api = err instanceof ApiClientError ? err : null;
  const message = api?.message ?? (err instanceof Error ? err.message : String(err));
  const code = api?.code;
  const hint = code ? RUNTIME_ERROR_HINTS[code] : undefined;

  return (
    <Card className={props.className ?? "border-red-500/30 bg-red-950/20"}>
      <CardHeader className="pb-2">
        <CardTitle className="text-base text-red-200">{props.title}</CardTitle>
        <CardDescription className="text-red-100/80">
          {code ? (
            <>
              <span className="font-mono text-[11px] text-red-200/90">{code}</span>
              {" — "}
            </>
          ) : null}
          {message}
        </CardDescription>
        {hint ? <p className="pt-2 text-[11px] text-red-100/65">{hint}</p> : null}
        <ul className="mt-2 list-inside list-disc space-y-0.5 text-[11px] text-red-100/55">
          {(code && RUNTIME_SELF_DIAGNOSIS[code] ? RUNTIME_SELF_DIAGNOSIS[code] : RUNTIME_SELF_DIAGNOSIS.default)?.map(
            (line) => (
              <li key={line}>{line}</li>
            ),
          )}
        </ul>
      </CardHeader>
    </Card>
  );
}
