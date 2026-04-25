# Frontend Architecture

## Purpose
Определяет структуру UI-продукта и правила интеграции frontend с backend/runtime.

## Scope
Страницы, состояние приложения и потоки данных через BFF.

## Status
in-progress

## Owner
frontend-team

## Last updated
2026-04-25

## Pages

- dashboard
- builder
- knowledge
- media
- billing
- crm
- team/settings

## State

- Global slices: `user`, `tenant`, `permissions`, `featureFlags`, `assistantDraft`.
- Server state: query/mutation client + доменные query keys.
- UI state не хранит бизнес-истину, источник истины всегда backend/BFF.

## Data flow

- UI -> `/api/ui/*` (BFF) -> core backend services.
- Builder preview -> `/api/ui/preview/*` -> ChatRuntime/SSE.
- Widget/Admin preview используют один runtime контракт с разным auth context.
