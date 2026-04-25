# Knowledge OS

## Purpose
Описывает продуктовый слой знаний в стиле Obsidian поверх RAG-инфраструктуры.

## Scope
Граф знаний, редактор заметок, связи и влияние на runtime retrieval.

## Status
in-progress

## Owner
product-knowledge-team

## Last updated
2026-04-25

## Features

- Notes editor (`KnowledgeNode`).
- Link management (`KnowledgeLink`).
- Graph visualization (`KnowledgeGraph`).
- Drag-and-connect взаимодействие.
- Фильтрация по тегам/типам/релевантности.

## Logic

- Node - атом знания.
- Link - семантическая связь между узлами.
- Graph - агрегированная карта знаний для базы/ассистента.
- Изменения графа инициируют reindex/update jobs.

## Constraints

- Узлы и связи должны быть tenant-scoped.
- Любое редактирование графа должно быть versioned/audited.
- Медиа в узлах подключается только через `MediaFile.id`.
