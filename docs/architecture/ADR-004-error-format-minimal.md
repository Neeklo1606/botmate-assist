# ADR-004 Error Format Minimal

## Purpose
Зафиксировать минимальный единый формат ошибок API для P0.

## Scope
Все API-ответы ошибок: auth, validation, permission, billing, rate-limit, runtime, provider.

## Status
done

## Owner
backend-api-team

## Last updated
2026-04-25

## Context

Аудит выявил блокер: нет общего каталога и структуры ошибок.

## Decision

Используем минимальный error envelope:

```json
{
  "error": {
    "code": "CATEGORY_001",
    "message": "Human readable message",
    "trace_id": "trace-id"
  }
}
```

Опционально разрешено поле `details` при необходимости диагностической информации.

## Consequences

- Плюсы:
  - единый контракт для frontend и интеграций;
  - упрощение мониторинга и поддержки;
  - быстрая унификация ошибок в P0.
- Минусы:
  - минимальный формат не покрывает расширенную taxonomy;
  - требуется последующий каталог кодов.

## Scope of applicability

- Все `/api/v1/*` endpoints.
- Ошибки runtime и BFF также следуют этому envelope.

## Rollback or migration trigger

- Расширение формата допускается только backward-compatible образом.
- Breaking изменения формата ошибок требуют нового ADR.
