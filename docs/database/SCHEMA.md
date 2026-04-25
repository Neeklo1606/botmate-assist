# Schema

## Purpose
Фиксирует целевые сущности хранения данных без SQL-реализации.

## Scope
Бизнес-сущности, связи и индексные требования для SaaS платформы.

## Status
in-progress

## Owner
backend-data-team

## Last updated
2026-04-25

## Entities

- Identity/Tenancy: Tenant, User, TenantMembership.
- Assistant/Agent: Agent, AgentVersion, Assistant, AssistantVersion.
- Runtime: ChatSession, Message, ConversationState, MessageBuffer.
- Knowledge: KnowledgeBase, KnowledgeSource, KnowledgeDocument, KnowledgeChunk, KnowledgeNode, KnowledgeLink, KnowledgeGraph.
- Tools: ToolDefinition, ToolInvocation, MethodPolicy.
- Integrations: IntegrationAccount, ModelCatalog, ModelCapability.
- Media: MediaFolder, MediaFile, MediaUsage.
- Billing/Usage: UsageLedger, Product, SubscriptionPlan, FeatureLimit, UserSubscription.
- Platform: ApiKey, FeatureFlag, Experiment, AuditLog, JobRun, DeadLetterItem, EventLog.
- Control: IdempotencyKey, ApiErrorLog (with trace correlation).

## Relations

- Tenant 1:N почти ко всем tenant-scoped сущностям.
- Assistant N:1 Agent, Assistant 1:N AssistantVersion.
- Agent 1:N AgentVersion.
- ChatSession 1:N Message; ChatSession 1:1 ConversationState.
- KnowledgeBase 1:N KnowledgeNode/KnowledgeLink/KnowledgeDocument.
- MediaFile 1:N MediaUsage; MediaFolder 1:N MediaFile.
- SubscriptionPlan 1:N FeatureLimit; UserSubscription N:1 Product/Plan.

## Indexes

- Обязательные составные индексы: `(tenant_id, id)` или `(tenant_id, foreign_id)`.
- Частые фильтры: status, created_at, updated_at, assistant_id, session_id.
- Full-text/keyword index для knowledge search + `pgvector` index для embeddings.
- Уникальные индексы для API keys, external ids, idempotency keys.
