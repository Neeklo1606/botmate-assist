# Media Manager

## Purpose
Определяет единый стандарт управления медиа-ресурсами в продукте.

## Scope
Сущности медиа, UX-функции и ограничения хранения/использования файлов.

## Status
in-progress

## Owner
product-frontend-team

## Last updated
2026-04-25

## Features

- Upload и preview.
- Folder hierarchy и навигация.
- Tags и поиск.
- Reuse одного файла в разных сущностях.
- Usage map перед удалением.

## Logic

- Базовые сущности: `MediaFolder`, `MediaFile`, `MediaUsage`.
- Иерархия: `/media/products`, `/media/avatars`, `/media/kb`, `/media/uploads`.
- Использование файла в любой бизнес-сущности фиксируется через `MediaUsage`.

## Constraints

- Запрещены raw URL в бизнес-моделях.
- Разрешена только ссылка через `MediaFile.id`.
- Удаление файла блокируется при активных usage-связях.
