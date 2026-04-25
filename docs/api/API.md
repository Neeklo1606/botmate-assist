# API

## Purpose
Описывает публичную структуру API и UI-BFF контракт на уровне модулей.

## Scope
Endpoint-группы, auth модель и стандарты ошибок/валидации.

## Status
in-progress

## Owner
backend-api-team

## Last updated
2026-04-25

## Endpoints

- Core: `/api/v1/auth/*`, `/api/v1/tenants/*`, `/api/v1/integrations/*`, `/api/v1/agents/*`, `/api/v1/assistants/*`
- Runtime: `/api/v1/chat/send`, `/api/v1/chat/stream`, `/api/v1/sessions/*`, `/api/v1/tools/*`
- Knowledge: `/api/v1/knowledge-bases/*`
- Platform: `/api/v1/usage/*`, `/api/v1/api-keys/*`, `/api/v1/events/*`, `/api/v1/jobs/*`, `/api/v1/observability/*`, `/api/v1/experiments/*`
- Channels: `/api/v1/channels/widget/*`, `/api/v1/channels/telegram/*`
- UI-BFF: `/api/v1/ui/builder/*`, `/api/v1/ui/crm/*`, `/api/v1/ui/knowledge/*`, `/api/v1/ui/media/*`, `/api/v1/ui/billing/*`, `/api/v1/ui/preview/*`

## Auth

- JWT/session auth для пользователей.
- API key auth для внешних интеграций.
- Tenant scope и role checks обязательны для всех protected endpoints.
- Permission policy проверяется до доступа к runtime/tool actions.

## Errors

- Стандартизированный минимальный error envelope (ADR-004):
- 
```json
{
  "error": {
    "code": "CATEGORY_001",
    "message": "Human readable message",
    "trace_id": "trace-id"
  }
}
```
- Коды ошибок: auth, validation, permission, rate-limit, billing-limit, runtime, provider.
- Все ошибки коррелируются с `traceId`.
- Для retriable ошибок указывать retry-hint.
