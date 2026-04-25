# Chat Runtime

## Purpose
Фиксирует стандартный pipeline обработки сообщений ассистента.

## Scope
Входные сообщения, контекст, prompt, model routing, tool execution, ответ и пост-обработка.

## Status
in-progress

## Owner
backend-runtime-team

## Last updated
2026-04-25

## Pipeline

`message -> context -> prompt -> model -> tools -> response`

## Steps

1. Ingress и авторизация (tenant/user/api-key/channel).
2. Session/state load (`ChatSession`, `ConversationState`, `MessageBuffer`).
3. Context build (persona, policy, history, memory, RAG context).
4. Prompt build (system + persona + tools + knowledge + memory).
5. Model routing (capability/cost/latency/fallback).
6. Tool execution при необходимости (validate -> permission -> sandbox -> queue).
7. Response build + guardrails + streaming/sync delivery.
8. Post-processing (persist state/messages, usage, events, structured logs).

## Edge cases

- Model/provider failure -> fallback chain.
- Tool timeout/error -> retry policy или graceful degradation.
- Session overflow -> history trimming + memory summary.
- Over-limit/billing block -> preflight reject без model/tool execution.
- Duplicate requests -> idempotency key handling.
