# ADR-003 API Versioning v1

## Purpose
Зафиксировать P0 политику версионирования API.

## Scope
Public API, UI-BFF API, контракты каналов и клиентских SDK.

## Status
done

## Owner
backend-api-team

## Last updated
2026-04-25

## Context

Аудит выявил блокер: отсутствует policy версионирования API.

## Decision

Все новые endpoint-группы публикуются с префиксом `/api/v1/*`.

## Consequences

- Плюсы:
  - явная контрактная граница для клиентов;
  - проще управлять breaking changes;
  - предсказуемая эволюция API.
- Минусы:
  - потребуется поддержка нескольких версий при будущих релизах;
  - нужна дисциплина deprecation-процесса.

## Scope of applicability

- Core API и UI-BFF endpoints.
- Runtime, tools, usage, billing, channels, observability endpoints.

## Rollback or migration trigger

- При переходе на `/api/v2` действуют совместимые transition rules и deprecation window.
- Любое изменение versioning policy оформляется новым ADR.
