# Master Plan

## Purpose
Фиксирует целевую архитектуру и очередность реализации SaaS-платформы.

## Scope
Backend, runtime, frontend, product, data, infra, governance и delivery-фазы.

## Status
in-progress

## Owner
platform-team

## Last updated
2026-04-25

## Overview

- Multi-tenant SaaS для ассистентов, агентов, знаний, медиа и биллинга.
- Базовый стек: `Fastify + Prisma + PostgreSQL + Redis + Queue`.
- Изоляция: `tenant_id + PostgreSQL RLS`.

## P0 Decisions Locked

- ADR-001: `pgvector` как vector store в PostgreSQL.
- ADR-002: `BullMQ` как queue subsystem на Redis.
- ADR-003: versioning policy `/api/v1/*`.
- ADR-004: минимальный unified error envelope.
- ADR-005: базовая backup strategy с `RPO <= 1h`, `RTO <= 4h`.

Ссылки:
- `docs/architecture/ADR-001-vectorstore-pgvector.md`
- `docs/architecture/ADR-002-queue-bullmq.md`
- `docs/architecture/ADR-003-api-versioning-v1.md`
- `docs/architecture/ADR-004-error-format-minimal.md`
- `docs/architecture/ADR-005-backup-strategy-basic.md`

## Components

- Core: Agent, Assistant, versions, session/state/message.
- Runtime: chat/context/prompt/model/tools.
- Knowledge: KB + graph + retrieval quality layer.
- Product: media manager, billing CMS, UI-BFF, channel adapters.
- Platform: usage, limits, observability, events, jobs, security.

## Flows

- Build flow: docs -> tasks -> checklist -> implementation.
- Runtime flow: message -> context -> prompt -> model/tools -> response.
- Governance flow: usage -> billing checks -> enforcement -> logs/events.

## Delivery Phases

- P0 foundation/runtime/auth/api keys/chat
- P1 knowledge/tools/media
- P2 billing/experiments/analytics/hardening
