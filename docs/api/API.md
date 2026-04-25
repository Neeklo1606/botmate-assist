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

- Core: `/auth/*`, `/tenants/*`, `/integrations/*`, `/agents/*`, `/assistants/*`
- Runtime: `/chat/send`, `/chat/stream`, `/sessions/*`, `/tools/*`
- Knowledge: `/knowledge-bases/*`
- Platform: `/usage/*`, `/api-keys/*`, `/events/*`, `/jobs/*`, `/observability/*`, `/experiments/*`
- Channels: `/channels/widget/*`, `/channels/telegram/*`
- UI-BFF: `/api/ui/builder/*`, `/api/ui/crm/*`, `/api/ui/knowledge/*`, `/api/ui/media/*`, `/api/ui/billing/*`, `/api/ui/preview/*`

## Auth

- JWT/session auth для пользователей.
- API key auth для внешних интеграций.
- Tenant scope и role checks обязательны для всех protected endpoints.
- Permission policy проверяется до доступа к runtime/tool actions.

## Errors

- Стандартизированный error envelope.
- Коды ошибок: auth, validation, permission, rate-limit, billing-limit, runtime, provider.
- Все ошибки коррелируются с `traceId`.
- Для retriable ошибок указывать retry-hint.
