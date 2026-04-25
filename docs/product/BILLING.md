# Billing

## Purpose
Фиксирует продуктовую и платформенную логику тарификации и ограничений.

## Scope
Тарифы, подписки, лимиты и правила enforcement в runtime.

## Status
in-progress

## Owner
product-billing-team

## Last updated
2026-04-25

## Features

- Управление планами и подписками.
- Trial/upgrade/downgrade/renewal/cancel сценарии.
- Прозрачное отображение usage и лимитов в UI.

## Logic

- Сущности: `Product`, `SubscriptionPlan`, `FeatureLimit`, `UserSubscription`.
- Usage обновляет consumption counters.
- Billing service сверяет consumption с лимитами и политиками.
- Hard-limit enforcement выполняется preflight до runtime execution.

## Constraints

- Лимиты применяются на уровне tenant и API key scope.
- Превышение hard лимита всегда блокирует вызов модели/инструмента.
- История изменений подписок должна быть audit-traceable.
