# ADR-001 Vector Store pgvector

## Purpose
Зафиксировать выбор векторного хранилища для P0 старта.

## Scope
RAG retrieval, хранение embeddings, фильтрация по tenant и операционная модель.

## Status
done

## Owner
platform-team

## Last updated
2026-04-25

## Context

Аудит выявил блокер: векторное хранилище не выбрано. Требуется P0 решение с минимальной операционной сложностью.

## Decision

Используем `pgvector` в PostgreSQL как primary vector store на старте.

## Consequences

- Плюсы:
  - один стек хранения (`PostgreSQL + pgvector`);
  - проще backup/restore и tenancy governance;
  - меньше DevOps overhead на P0.
- Минусы:
  - ограничение по производительности на очень больших объемах;
  - возможна миграция на dedicated vector DB при росте.

## Scope of applicability

- Все embeddings в P0/P1 хранятся в PostgreSQL с pgvector.
- Hybrid retrieval использует pgvector + keyword/BM25 слой.

## Rollback or migration trigger

- Рассмотреть миграцию при росте коллекции/нагрузки до порога, где SLA retrieval нарушается.
- Решение о миграции фиксировать отдельным ADR.
