# Documentation Governance

## Purpose
Задает обязательные правила ведения документации и связи `docs <-> tasks <-> checklists`.

## Scope
Все документы в `docs/*`, включая архитектуру, runtime, API, БД, frontend, product, checklists и задачи.

## Status
done

## Owner
platform-team

## Last updated
2026-04-25

## Rules

- НИ ОДНОЙ ФИЧИ БЕЗ ДОКУМЕНТА.
- СНАЧАЛА ДОКУМЕНТАЦИЯ -> ПОТОМ КОД.
- Нельзя писать код без обновления docs.
- Все изменения логики обязаны обновлять соответствующий doc.
- Каждая задача должна быть в `docs/tasks/*`.
- Каждая задача должна быть в `docs/checklists/*`.
- Каждая фича должна ссылаться на документацию.
- Checklist обновляется при каждом шаге выполнения.

## Structure

- `docs/INDEX.md`
- `docs/architecture/*`
- `docs/runtime/*`
- `docs/api/*`
- `docs/database/*`
- `docs/frontend/*`
- `docs/product/*`
- `docs/backend/*`
- `docs/infra/*`
- `docs/checklists/*`
- `docs/tasks/*`
