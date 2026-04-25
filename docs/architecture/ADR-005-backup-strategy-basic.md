# ADR-005 Backup Strategy Basic

## Purpose
Зафиксировать базовую стратегию резервного копирования для P0.

## Scope
PostgreSQL, Redis, media storage, цели восстановления, базовый restore runbook.

## Status
done

## Owner
infra-team

## Last updated
2026-04-25

## Context

Аудит выявил блокер: backup strategy не описана.

## Decision

Принять базовую backup strategy:

- PostgreSQL: регулярные бэкапы + журналы для point-in-time восстановления.
- Redis: RDB snapshots + AOF.
- Media: versioned object storage snapshots/replication.
- Цели восстановления:
  - `RPO <= 1 hour`
  - `RTO <= 4 hours`

## Consequences

- Плюсы:
  - закрытие минимального операционного риска;
  - формализация recovery целей для P0.
- Минусы:
  - базовая стратегия требует регулярных проверок restore drill;
  - не покрывает full multi-region DR.

## Scope of applicability

- Все production данные платформы в P0.
- Backup расписание и restore процедуры фиксируются в infra docs.

## Rollback or migration trigger

- При изменении инфраструктуры/объемов стратегия обновляется и фиксируется новым ADR.
- Не реже квартала проводится restore drill review.
