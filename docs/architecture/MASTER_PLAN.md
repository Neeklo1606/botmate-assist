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
