# System Overview

## Purpose
Дает краткую системную картину для всех команд до перехода в детальные документы.

## Scope
Слои платформы, ключевые компоненты и сквозные потоки выполнения.

## Status
done

## Owner
platform-team

## Last updated
2026-04-25

## Overview

- Платформа состоит из client/API/runtime/intelligence/platform/data слоев.
- Backend централизует безопасность, маршрутизацию, контроль лимитов и аудит.
- Frontend работает через UI-BFF для стабильного продуктового контракта.

## Components

- Client: Admin Web, Widget SDK, Telegram Adapter, Public API clients.
- API: Fastify API + UI-BFF + auth/tenant middleware + `/api/v1/*` policy.
- Runtime: ChatRuntime, ContextBuilder, PromptBuilder, ModelRouter, ToolRuntime.
- Intelligence: hybrid RAG, reranking, relevance filtering, guardrails.
- Platform: usage, billing enforcement, feature flags, experiments, observability, event bus.
- Data/Infra: PostgreSQL RLS + `pgvector`, Redis cache + `BullMQ`, workers/DLQ, media storage, backup runbook.

## P0 locked decisions

- Vector store: PostgreSQL with `pgvector` (ADR-001).
- Queue: Redis with `BullMQ` (ADR-002).
- API versioning: `/api/v1/*` (ADR-003).
- Error format: minimal unified envelope with `code`, `message`, `trace_id` (ADR-004).
- Backup strategy: base policy with `RPO <= 1h`, `RTO <= 4h` (ADR-005).

## Flows

- Runtime flow: intake -> session/state -> context -> prompt -> route -> tools/model -> response -> persistence.
- Governance flow: request -> auth/permissions -> limits/billing -> runtime -> usage/events/logs.
- Ops flow: scheduled jobs -> queue workers -> retries -> DLQ -> replay.
