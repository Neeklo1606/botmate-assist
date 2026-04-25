# Runtime Checklist

## Purpose
Контроль выполнения runtime контура ассистента.

## Scope
Pipeline, reliability, streaming, observability, guardrails.

## Status
in-progress

## Owner
backend-runtime-team

## Last updated
2026-04-25

[ ] Chat runtime core (ChatSession/Message/ConversationState)
-> owner: backend-runtime
-> status: todo
-> doc: /docs/runtime/CHAT_RUNTIME.md

[ ] ContextBuilder and PromptBuilder
-> owner: backend-runtime
-> status: todo
-> doc: /docs/runtime/CHAT_RUNTIME.md

[ ] ModelRouter (fallback/cost/capability/latency)
-> owner: backend-runtime
-> status: todo
-> doc: /docs/runtime/CHAT_RUNTIME.md

[ ] ToolRuntime (validation/permissions/sandbox)
-> owner: backend-runtime
-> status: todo
-> doc: /docs/runtime/CHAT_RUNTIME.md

[ ] SSE `/chat/stream`
-> owner: backend-runtime
-> status: todo
-> doc: /docs/api/API.md

[ ] Retry + idempotency + queue + DLQ
-> owner: backend-runtime
-> status: todo
-> doc: /docs/architecture/SYSTEM_OVERVIEW.md

[ ] Structured logs + traceId + metrics
-> owner: backend-runtime
-> status: todo
-> doc: /docs/architecture/SYSTEM_OVERVIEW.md
