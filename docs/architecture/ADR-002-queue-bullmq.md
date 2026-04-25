# ADR-002 Queue BullMQ

## Purpose
Зафиксировать выбор очередей для P0.

## Scope
Background jobs, retries, delayed jobs, runtime long tasks, ingestion jobs.

## Status
done

## Owner
platform-team

## Last updated
2026-04-25

## Context

Аудит выявил блокер: queue broker не выбран. Требуется быстрый и операционно простой выбор для P0.

## Decision

Используем `BullMQ` поверх Redis как queue subsystem.

## Consequences

- Плюсы:
  - быстрый запуск в текущем стеке (Redis уже принят);
  - поддержка retries, delayed jobs, scheduling;
  - хорошая интеграция с Node.js runtime.
- Минусы:
  - DLQ реализуется на уровне политики очередей/статусов;
  - при дальнейшем росте может потребоваться migration path на другой broker.

## Scope of applicability

- Queue orchestration для ingestion, sync, tool long tasks, notifications.
- Scheduler и worker pool используют BullMQ.

## Rollback or migration trigger

- Пересмотр решения при требованиях к advanced routing/throughput, которые выходят за возможности текущей конфигурации.
- Миграция фиксируется новым ADR.
