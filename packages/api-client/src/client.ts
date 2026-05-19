import {
  ApiClientError,
  AppendChatMessageBodySchema,
  AssistantsListResponseSchema,
  AssistantArchiveResponseSchema,
  AssistantDtoSchema,
  AuthLogoutResponseSchema,
  AuthMeResponseSchema,
  AuthSuccessResponseSchema,
  ChatAppendAutoResponseSchema,
  ChatAppendPersistResponseSchema,
  ChatMessagesListResponseSchema,
  ChatSessionArchiveResponseSchema,
  ChatSessionSummaryDtoSchema,
  ChatSessionsListResponseSchema,
  CreateAssistantBodySchema,
  CreateChatSessionBodySchema,
  CreateLeadBodySchema,
  CreateProjectBodySchema,
  HealthResponseSchema,
  LeadArchiveResponseSchema,
  LeadDtoSchema,
  LeadsListQuerySchema,
  LeadsListResponseSchema,
  LoginRequestSchema,
  PaginationQuerySchema,
  PatchAssistantBodySchema,
  PatchChatSessionBodySchema,
  PatchLeadBodySchema,
  PatchProjectBodySchema,
  ProjectArchiveResponseSchema,
  ProjectDtoSchema,
  ProjectsListResponseSchema,
  RegisterRequestSchema,
  RuntimeBrowserSessionsQuerySchema,
  RuntimeBrowserSessionsResponseSchema,
  RuntimeExecutionDetailSchema,
  RuntimeExecutionsQuerySchema,
  RuntimeExecutionsResponseSchema,
  RuntimeNotificationsQuerySchema,
  RuntimeNotificationsResponseSchema,
  RuntimeOverviewResponseSchema,
  RuntimePolicyEventsQuerySchema,
  RuntimePolicyEventsResponseSchema,
  ExecutionTimelineQuerySchema,
  ExecutionTimelineResponseSchema,
  RuntimeQueuesResponseSchema,
  ExecutionGraphResponseSchema,
  ExecutionFactsQuerySchema,
  ExecutionFactsResponseSchema,
  RuntimeArtifactsQuerySchema,
  RuntimeArtifactsListResponseSchema,
  RuntimeArtifactDetailResponseSchema,
  RuntimeConsistencyReportSchema,
  ArtifactSignedTokenResponseSchema,
  ExecutionOperationalMarkBodySchema,
  ExecutionOperationalMarkRowSchema,
  ReplayVisibilityMatrixSchema,
  RuntimeExecutionNoteCreateBodySchema,
  RuntimeExecutionNoteCreateResponseSchema,
  RuntimeExecutionNotesQuerySchema,
  RuntimeExecutionNotesResponseSchema,
  RuntimeIncidentAckBodySchema,
  RuntimeIncidentAckRowSchema,
  RuntimeConsistencyPersistAckBodySchema,
  RuntimeConsistencyPersistAckResponseSchema,
  RuntimeActivityFactsQuerySchema,
  RuntimeActivityFactsResponseSchema,
  RuntimeBookmarkUpsertBodySchema,
  RuntimeBookmarkRowSchema,
  RuntimeArtifactPreviewTokenSchema,
  RuntimeIncidentsQuerySchema,
  RuntimeIncidentsResponseSchema,
  RuntimeReconcileEnqueueResponseSchema,
  ProductEventBodySchema,
  ProductEventResponseSchema,
  ProductFeedbackBodySchema,
  ProductFeedbackResponseSchema,
  TenantActivationSnapshotSchema,
  WorkspaceOverviewSchema,
  WorkspaceUsageSummarySchema,
  WorkspaceMembersResponseSchema,
  WorkspaceSupportDiagnosticsV2Schema,
  WorkspaceOnboardingStateSchema,
  WorkspaceInvitesResponseSchema,
  WorkspaceInviteCreateResponseSchema,
  WorkspaceInviteCreateBodySchema,
  type WorkspaceInviteCreateBody,
  AcceptInviteRequestSchema,
  type AcceptInviteRequest,
  AcceptInviteResponseSchema,
  IntegrationOpenAiStatusSchema,
  PlanEntitlementsSchema,
  ApiKeysListResponseSchema,
  CreateApiKeyBodySchema,
  CreateApiKeyResponseSchema,
  NotificationsListResponseSchema,
  NotificationsUnreadCountSchema,
  KnowledgeBasesListResponseSchema,
  KnowledgeBaseDtoSchema,
  CreateKnowledgeBaseBodySchema,
  KnowledgeDocumentsListResponseSchema,
  KnowledgeDocumentUploadBodySchema,
  KnowledgeDocumentUploadResponseSchema,
  type CreateApiKeyBody,
  type CreateKnowledgeBaseBody,
  type KnowledgeDocumentUploadBody,
  parseApiErrorResponse,
  type RuntimeArtifactPreviewTokenPayload,
  type AppendChatMessageBody,
  type CreateAssistantBody,
  type ExecutionOperationalMarkPayload,
  type CreateChatSessionBody,
  type CreateLeadBody,
  type CreateProjectBody,
  type LeadsListQuery,
  type LoginRequest,
  type PaginationQuery,
  type PatchAssistantBody,
  type PatchChatSessionBody,
  type PatchLeadBody,
  type PatchProjectBody,
  type RegisterRequest,
  type RuntimeIncidentAckPayload,
  type RuntimeBookmarkUpsertPayload,
  type RuntimeConsistencyPersistAckPayload,
  type RuntimeExecutionNoteCreatePayload,
  type RuntimeExecutionsQuery,
  type ExecutionTimelineQuery,
  type ExecutionFactsQuery,
  type RuntimeArtifactsQuery,
  type RuntimeActivityFactsQuery,
  type RuntimeIncidentsQuery,
  type RuntimeExecutionNotesQuery,
  type ProductEventBody,
  type ProductFeedbackBody,
} from "@botmate/shared";
import type { ApiClientConfig, RequestInterceptor, RequestOptions, ResponseInterceptor } from "./types.js";

export class BotmateApiClient {
  private readonly config: ApiClientConfig;
  private requestInterceptors: RequestInterceptor[] = [];
  private responseInterceptors: ResponseInterceptor[] = [];

  constructor(config: ApiClientConfig) {
    this.config = {
      credentials: "include",
      ...config,
      baseUrl: config.baseUrl.replace(/\/$/, ""),
    };
  }

  useRequest(interceptor: RequestInterceptor): () => void {
    this.requestInterceptors.push(interceptor);
    return () => {
      this.requestInterceptors = this.requestInterceptors.filter((i) => i !== interceptor);
    };
  }

  useResponse(interceptor: ResponseInterceptor): () => void {
    this.responseInterceptors.push(interceptor);
    return () => {
      this.responseInterceptors = this.responseInterceptors.filter((i) => i !== interceptor);
    };
  }

  setAccessToken(getter: ApiClientConfig["getAccessToken"]): void {
    this.config.getAccessToken = getter;
  }

  async health() {
    return this.request("/health", { method: "GET" }, HealthResponseSchema);
  }

  async register(body: RegisterRequest) {
    const payload = RegisterRequestSchema.parse(body);
    return this.request(
      "/api/v1/auth/register",
      { method: "POST", body: payload },
      AuthSuccessResponseSchema,
    );
  }

  async login(body: LoginRequest) {
    const payload = LoginRequestSchema.parse(body);
    return this.request(
      "/api/v1/auth/login",
      { method: "POST", body: payload },
      AuthSuccessResponseSchema,
    );
  }

  async logout() {
    return this.request("/api/v1/auth/logout", { method: "POST" }, AuthLogoutResponseSchema);
  }

  async me() {
    return this.request("/api/v1/auth/me", { method: "GET" }, AuthMeResponseSchema);
  }

  async listProjects(query?: PaginationQuery) {
    const q = PaginationQuerySchema.parse(query ?? {});
    const params = new URLSearchParams({
      page: String(q.page),
      pageSize: String(q.pageSize),
    });
    return this.request(
      `/api/v1/projects?${params.toString()}`,
      { method: "GET" },
      ProjectsListResponseSchema,
    );
  }

  async createProject(body: CreateProjectBody) {
    const payload = CreateProjectBodySchema.parse(body);
    return this.request("/api/v1/projects", { method: "POST", body: payload }, ProjectDtoSchema);
  }

  async getProject(id: string) {
    const encoded = encodeURIComponent(id);
    return this.request(`/api/v1/projects/${encoded}`, { method: "GET" }, ProjectDtoSchema);
  }

  async patchProject(id: string, body: PatchProjectBody) {
    const encoded = encodeURIComponent(id);
    const payload = PatchProjectBodySchema.parse(body);
    return this.request(`/api/v1/projects/${encoded}`, { method: "PATCH", body: payload }, ProjectDtoSchema);
  }

  async archiveProject(id: string) {
    const encoded = encodeURIComponent(id);
    return this.request(
      `/api/v1/projects/${encoded}`,
      { method: "DELETE" },
      ProjectArchiveResponseSchema,
    );
  }

  async listAssistants(query?: PaginationQuery) {
    const q = PaginationQuerySchema.parse(query ?? {});
    const params = new URLSearchParams({
      page: String(q.page),
      pageSize: String(q.pageSize),
    });
    return this.request(
      `/api/v1/assistants?${params.toString()}`,
      { method: "GET" },
      AssistantsListResponseSchema,
    );
  }

  async createAssistant(body: CreateAssistantBody) {
    const payload = CreateAssistantBodySchema.parse(body);
    return this.request("/api/v1/assistants", { method: "POST", body: payload }, AssistantDtoSchema);
  }

  async getAssistant(id: string) {
    const encoded = encodeURIComponent(id);
    return this.request(`/api/v1/assistants/${encoded}`, { method: "GET" }, AssistantDtoSchema);
  }

  async patchAssistant(id: string, body: PatchAssistantBody) {
    const encoded = encodeURIComponent(id);
    const payload = PatchAssistantBodySchema.parse(body);
    return this.request(`/api/v1/assistants/${encoded}`, { method: "PATCH", body: payload }, AssistantDtoSchema);
  }

  async archiveAssistant(id: string) {
    const encoded = encodeURIComponent(id);
    return this.request(
      `/api/v1/assistants/${encoded}`,
      { method: "DELETE" },
      AssistantArchiveResponseSchema,
    );
  }

  async listChatSessions(query?: PaginationQuery) {
    const q = PaginationQuerySchema.parse(query ?? {});
    const params = new URLSearchParams({
      page: String(q.page),
      pageSize: String(q.pageSize),
    });
    return this.request(
      `/api/v1/chat/sessions?${params.toString()}`,
      { method: "GET" },
      ChatSessionsListResponseSchema,
    );
  }

  async createChatSession(body?: CreateChatSessionBody) {
    const payload = CreateChatSessionBodySchema.parse(body ?? {});
    return this.request(`/api/v1/chat/sessions`, { method: "POST", body: payload }, ChatSessionSummaryDtoSchema);
  }

  async patchChatSession(id: string, body: PatchChatSessionBody) {
    const encoded = encodeURIComponent(id);
    const payload = PatchChatSessionBodySchema.parse(body);
    return this.request(
      `/api/v1/chat/sessions/${encoded}`,
      { method: "PATCH", body: payload },
      ChatSessionSummaryDtoSchema,
    );
  }

  async archiveChatSession(id: string) {
    const encoded = encodeURIComponent(id);
    return this.request(
      `/api/v1/chat/sessions/${encoded}`,
      { method: "DELETE" },
      ChatSessionArchiveResponseSchema,
    );
  }

  async listChatMessages(sessionId: string, query?: PaginationQuery) {
    const q = PaginationQuerySchema.parse(query ?? {});
    const encoded = encodeURIComponent(sessionId);
    const params = new URLSearchParams({
      page: String(q.page),
      pageSize: String(q.pageSize),
    });
    return this.request(
      `/api/v1/chat/sessions/${encoded}/messages?${params.toString()}`,
      { method: "GET" },
      ChatMessagesListResponseSchema,
    );
  }

  /** Workspace USER→AI round-trip (persists USER + ASSISTANT rows). */
  async appendChatAuto(sessionId: string, content: string) {
    const encoded = encodeURIComponent(sessionId);
    const payload = AppendChatMessageBodySchema.parse({ content, mode: "auto" });
    return this.request(
      `/api/v1/chat/sessions/${encoded}/messages`,
      { method: "POST", body: payload },
      ChatAppendAutoResponseSchema,
    );
  }

  /** Operator/system rows only (`persist_only`). */
  async appendChatPersist(sessionId: string, body: Omit<AppendChatMessageBody, "mode">) {
    const encoded = encodeURIComponent(sessionId);
    const payload = AppendChatMessageBodySchema.parse({ ...body, mode: "persist_only" });
    return this.request(
      `/api/v1/chat/sessions/${encoded}/messages`,
      { method: "POST", body: payload },
      ChatAppendPersistResponseSchema,
    );
  }

  async listLeads(query?: LeadsListQuery) {
    const q = LeadsListQuerySchema.parse(query ?? {});
    const params = new URLSearchParams({
      page: String(q.page),
      pageSize: String(q.pageSize),
    });
    if (q.pipelineStatus) params.set("pipelineStatus", q.pipelineStatus);
    if (q.source) params.set("source", q.source);
    if (q.search?.trim()) params.set("search", q.search.trim());
    return this.request(`/api/v1/leads?${params.toString()}`, { method: "GET" }, LeadsListResponseSchema);
  }

  async createLead(body: CreateLeadBody) {
    const payload = CreateLeadBodySchema.parse(body);
    return this.request(`/api/v1/leads`, { method: "POST", body: payload }, LeadDtoSchema);
  }

  async getLead(id: string) {
    const encoded = encodeURIComponent(id);
    return this.request(`/api/v1/leads/${encoded}`, { method: "GET" }, LeadDtoSchema);
  }

  async patchLead(id: string, body: PatchLeadBody) {
    const encoded = encodeURIComponent(id);
    const payload = PatchLeadBodySchema.parse(body);
    return this.request(`/api/v1/leads/${encoded}`, { method: "PATCH", body: payload }, LeadDtoSchema);
  }

  async archiveLead(id: string) {
    const encoded = encodeURIComponent(id);
    return this.request(`/api/v1/leads/${encoded}`, { method: "DELETE" }, LeadArchiveResponseSchema);
  }

  async runtimeOverview() {
    return this.request("/api/v1/runtime/overview", { method: "GET" }, RuntimeOverviewResponseSchema);
  }

  async runtimeExecutions(query?: Partial<RuntimeExecutionsQuery>) {
    const q = RuntimeExecutionsQuerySchema.parse(query ?? {});
    const params = new URLSearchParams({
      page: String(q.page),
      pageSize: String(q.pageSize),
    });
    if (q.assistantId) params.set("assistantId", q.assistantId);
    return this.request(
      `/api/v1/runtime/executions?${params.toString()}`,
      { method: "GET" },
      RuntimeExecutionsResponseSchema,
    );
  }

  async runtimeExecutionDetail(executionId: string) {
    const encoded = encodeURIComponent(executionId);
    return this.request(
      `/api/v1/runtime/executions/${encoded}`,
      { method: "GET" },
      RuntimeExecutionDetailSchema,
    );
  }

  async runtimeBrowserSessions(query?: { page?: number; pageSize?: number }) {
    const q = RuntimeBrowserSessionsQuerySchema.parse(query ?? {});
    const params = new URLSearchParams({
      page: String(q.page),
      pageSize: String(q.pageSize),
    });
    return this.request(
      `/api/v1/runtime/browser-sessions?${params.toString()}`,
      { method: "GET" },
      RuntimeBrowserSessionsResponseSchema,
    );
  }

  async runtimeNotifications(query?: { page?: number; pageSize?: number }) {
    const q = RuntimeNotificationsQuerySchema.parse(query ?? {});
    const params = new URLSearchParams({
      page: String(q.page),
      pageSize: String(q.pageSize),
    });
    return this.request(
      `/api/v1/runtime/notifications?${params.toString()}`,
      { method: "GET" },
      RuntimeNotificationsResponseSchema,
    );
  }

  async runtimePolicyEvents(query?: { page?: number; pageSize?: number }) {
    const q = RuntimePolicyEventsQuerySchema.parse(query ?? {});
    const params = new URLSearchParams({
      page: String(q.page),
      pageSize: String(q.pageSize),
    });
    return this.request(
      `/api/v1/runtime/policy-events?${params.toString()}`,
      { method: "GET" },
      RuntimePolicyEventsResponseSchema,
    );
  }

  async runtimeQueues() {
    return this.request("/api/v1/runtime/queues", { method: "GET" }, RuntimeQueuesResponseSchema);
  }

  async runtimeExecutionTimeline(executionId: string, query?: Partial<ExecutionTimelineQuery>) {
    const q = ExecutionTimelineQuerySchema.parse(query ?? {});
    const encoded = encodeURIComponent(executionId);
    const params = new URLSearchParams({ limit: String(q.limit) });
    if (q.cursor) params.set("cursor", q.cursor);
    return this.request(
      `/api/v1/runtime/executions/${encoded}/timeline?${params.toString()}`,
      { method: "GET" },
      ExecutionTimelineResponseSchema,
    );
  }

  async runtimeExecutionGraph(executionId: string) {
    const encoded = encodeURIComponent(executionId);
    return this.request(`/api/v1/runtime/executions/${encoded}/graph`, { method: "GET" }, ExecutionGraphResponseSchema);
  }

  async runtimeExecutionFacts(executionId: string, query?: Partial<ExecutionFactsQuery>) {
    const q = ExecutionFactsQuerySchema.parse(query ?? {});
    const encoded = encodeURIComponent(executionId);
    const params = new URLSearchParams({
      page: String(q.page),
      pageSize: String(q.pageSize),
    });
    return this.request(
      `/api/v1/runtime/executions/${encoded}/facts?${params.toString()}`,
      { method: "GET" },
      ExecutionFactsResponseSchema,
    );
  }

  async runtimeReplayMatrix(executionId: string) {
    const encoded = encodeURIComponent(executionId);
    return this.request(
      `/api/v1/runtime/executions/${encoded}/replay-matrix`,
      { method: "GET" },
      ReplayVisibilityMatrixSchema,
    );
  }

  async runtimeArtifacts(query?: Partial<RuntimeArtifactsQuery>) {
    const q = RuntimeArtifactsQuerySchema.parse(query ?? {});
    const params = new URLSearchParams({
      page: String(q.page),
      pageSize: String(q.pageSize),
    });
    if (q.browserSessionId) params.set("browserSessionId", q.browserSessionId);
    return this.request(
      `/api/v1/runtime/artifacts?${params.toString()}`,
      { method: "GET" },
      RuntimeArtifactsListResponseSchema,
    );
  }

  async runtimeArtifactDetail(artifactId: string) {
    const encoded = encodeURIComponent(artifactId);
    return this.request(
      `/api/v1/runtime/artifacts/${encoded}`,
      { method: "GET" },
      RuntimeArtifactDetailResponseSchema,
    );
  }

  async runtimeActivityFacts(query?: Partial<RuntimeActivityFactsQuery>) {
    const q = RuntimeActivityFactsQuerySchema.parse(query ?? {});
    const params = new URLSearchParams({
      page: String(q.page),
      pageSize: String(q.pageSize),
    });
    if (q.kindPrefix) params.set("kindPrefix", q.kindPrefix);
    return this.request(
      `/api/v1/runtime/activity-facts?${params.toString()}`,
      { method: "GET" },
      RuntimeActivityFactsResponseSchema,
    );
  }

  async runtimeIncidents(query?: Partial<RuntimeIncidentsQuery>) {
    const q = RuntimeIncidentsQuerySchema.parse(query ?? {});
    const params = new URLSearchParams();
    if (q.cluster) params.set("cluster", q.cluster);
    if (q.severity) params.set("severity", q.severity);
    const qs = params.toString();
    return this.request(
      `/api/v1/runtime/incidents${qs ? `?${qs}` : ""}`,
      { method: "GET" },
      RuntimeIncidentsResponseSchema,
    );
  }

  async acknowledgeRuntimeIncident(body: RuntimeIncidentAckPayload) {
    const payload = RuntimeIncidentAckBodySchema.parse(body);
    return this.request("/api/v1/runtime/incidents/ack", { method: "POST", body: payload }, RuntimeIncidentAckRowSchema);
  }

  async acknowledgeRuntimeConsistency(body: RuntimeConsistencyPersistAckPayload) {
    const payload = RuntimeConsistencyPersistAckBodySchema.parse(body);
    return this.request(
      "/api/v1/runtime/consistency/ack",
      { method: "POST", body: payload },
      RuntimeConsistencyPersistAckResponseSchema,
    );
  }

  async upsertRuntimeBookmark(body: RuntimeBookmarkUpsertPayload) {
    const payload = RuntimeBookmarkUpsertBodySchema.parse(body);
    return this.request("/api/v1/runtime/bookmarks", { method: "POST", body: payload }, RuntimeBookmarkRowSchema);
  }

  async deleteRuntimeBookmark(executionId: string) {
    const encoded = encodeURIComponent(executionId);
    await this.request(`/api/v1/runtime/bookmarks/${encoded}`, { method: "DELETE" });
  }

  async listRuntimeExecutionNotes(executionId: string, query?: Partial<RuntimeExecutionNotesQuery>) {
    const q = RuntimeExecutionNotesQuerySchema.parse(query ?? {});
    const encoded = encodeURIComponent(executionId);
    const params = new URLSearchParams({
      page: String(q.page),
      pageSize: String(q.pageSize),
    });
    return this.request(
      `/api/v1/runtime/executions/${encoded}/notes?${params.toString()}`,
      { method: "GET" },
      RuntimeExecutionNotesResponseSchema,
    );
  }

  async createRuntimeExecutionNote(
    executionId: string,
    body: RuntimeExecutionNoteCreatePayload,
  ) {
    const payload = RuntimeExecutionNoteCreateBodySchema.parse(body);
    const encoded = encodeURIComponent(executionId);
    return this.request(
      `/api/v1/runtime/executions/${encoded}/notes`,
      { method: "POST", body: payload },
      RuntimeExecutionNoteCreateResponseSchema,
    );
  }

  async runtimeOperationalMark(executionId: string, body: ExecutionOperationalMarkPayload) {
    const payload = ExecutionOperationalMarkBodySchema.parse(body);
    const encoded = encodeURIComponent(executionId);
    return this.request(
      `/api/v1/runtime/executions/${encoded}/operational-mark`,
      { method: "POST", body: payload },
      ExecutionOperationalMarkRowSchema,
    );
  }

  async runtimeReconcileEnqueue() {
    return this.request("/api/v1/runtime/reconcile/enqueue", { method: "POST" }, RuntimeReconcileEnqueueResponseSchema);
  }

  async runtimeArtifactPreviewToken(
    artifactId: string,
    body?: RuntimeArtifactPreviewTokenPayload,
  ) {
    const payload = RuntimeArtifactPreviewTokenSchema.parse(body ?? {});
    const encoded = encodeURIComponent(artifactId);
    return this.request(
      `/api/v1/runtime/artifacts/${encoded}/preview-token`,
      { method: "POST", body: payload },
      ArtifactSignedTokenResponseSchema,
    );
  }

  async runtimeConsistencyReport() {
    return this.request("/api/v1/runtime/consistency", { method: "GET" }, RuntimeConsistencyReportSchema);
  }

  async getProductActivation() {
    return this.request("/api/v1/product/activation", { method: "GET" }, TenantActivationSnapshotSchema);
  }

  async recordProductEvent(body: ProductEventBody) {
    const payload = ProductEventBodySchema.parse(body);
    return this.request("/api/v1/product/events", { method: "POST", body: payload }, ProductEventResponseSchema);
  }

  async submitProductFeedback(body: ProductFeedbackBody) {
    const payload = ProductFeedbackBodySchema.parse(body);
    return this.request("/api/v1/product/feedback", { method: "POST", body: payload }, ProductFeedbackResponseSchema);
  }

  async getWorkspaceOverview() {
    return this.request("/api/v1/workspace/overview", { method: "GET" }, WorkspaceOverviewSchema);
  }

  async getWorkspaceUsage() {
    return this.request("/api/v1/workspace/usage", { method: "GET" }, WorkspaceUsageSummarySchema);
  }

  async getWorkspaceMembers() {
    return this.request("/api/v1/workspace/members", { method: "GET" }, WorkspaceMembersResponseSchema);
  }

  async getWorkspaceSupportDiagnostics() {
    return this.request(
      "/api/v1/workspace/support-diagnostics",
      { method: "GET" },
      WorkspaceSupportDiagnosticsV2Schema,
    );
  }

  async getWorkspaceOnboarding() {
    return this.request("/api/v1/workspace/onboarding", { method: "GET" }, WorkspaceOnboardingStateSchema);
  }

  async createWorkspaceInvite(body: WorkspaceInviteCreateBody) {
    const payload = WorkspaceInviteCreateBodySchema.parse(body);
    return this.request(
      "/api/v1/workspace/invites",
      { method: "POST", body: payload },
      WorkspaceInviteCreateResponseSchema,
    );
  }

  async listWorkspaceInvites() {
    return this.request("/api/v1/workspace/invites", { method: "GET" }, WorkspaceInvitesResponseSchema);
  }

  async revokeWorkspaceInvite(inviteId: string) {
    return this.request(`/api/v1/workspace/invites/${inviteId}`, { method: "DELETE" });
  }

  async patchWorkspaceMemberRole(userId: string, role: "ADMIN" | "OPERATOR" | "VIEWER") {
    return this.request(`/api/v1/workspace/members/${userId}`, {
      method: "PATCH",
      body: { role },
    });
  }

  async removeWorkspaceMember(userId: string) {
    return this.request(`/api/v1/workspace/members/${userId}`, { method: "DELETE" });
  }

  async acceptInvite(body: AcceptInviteRequest) {
    const payload = AcceptInviteRequestSchema.parse(body);
    return this.request("/api/v1/auth/accept-invite", { method: "POST", body: payload }, AcceptInviteResponseSchema);
  }

  async getWorkspaceEntitlements() {
    return this.request("/api/v1/workspace/entitlements", { method: "GET" }, PlanEntitlementsSchema);
  }

  async getOpenAiIntegrationStatus() {
    return this.request("/api/v1/integrations/openai/status", { method: "GET" }, IntegrationOpenAiStatusSchema);
  }

  async listKnowledgeBases() {
    return this.request("/api/v1/knowledge/bases", { method: "GET" }, KnowledgeBasesListResponseSchema);
  }

  async createKnowledgeBase(body: CreateKnowledgeBaseBody) {
    const payload = CreateKnowledgeBaseBodySchema.parse(body);
    return this.request(
      "/api/v1/knowledge/bases",
      { method: "POST", body: payload },
      KnowledgeBaseDtoSchema,
    );
  }

  async listKnowledgeDocuments(baseId: string) {
    const encoded = encodeURIComponent(baseId);
    return this.request(
      `/api/v1/knowledge/bases/${encoded}/documents`,
      { method: "GET" },
      KnowledgeDocumentsListResponseSchema,
    );
  }

  async uploadKnowledgeDocument(baseId: string, body: KnowledgeDocumentUploadBody) {
    const payload = KnowledgeDocumentUploadBodySchema.parse(body);
    const encoded = encodeURIComponent(baseId);
    return this.request(
      `/api/v1/knowledge/bases/${encoded}/documents`,
      { method: "POST", body: payload },
      KnowledgeDocumentUploadResponseSchema,
    );
  }

  async deleteKnowledgeDocument(baseId: string, documentId: string) {
    const encodedBase = encodeURIComponent(baseId);
    const encodedDoc = encodeURIComponent(documentId);
    return this.request(
      `/api/v1/knowledge/bases/${encodedBase}/documents/${encodedDoc}`,
      { method: "DELETE" },
    );
  }

  async listApiKeys() {
    return this.request("/api/v1/api-keys", { method: "GET" }, ApiKeysListResponseSchema);
  }

  async createApiKey(body: CreateApiKeyBody) {
    const payload = CreateApiKeyBodySchema.parse(body);
    return this.request("/api/v1/api-keys", { method: "POST", body: payload }, CreateApiKeyResponseSchema);
  }

  async revokeApiKey(id: string) {
    const encoded = encodeURIComponent(id);
    return this.request(`/api/v1/api-keys/${encoded}`, { method: "DELETE" });
  }

  async listNotifications(query?: { cursor?: string; limit?: number }) {
    const params = new URLSearchParams();
    if (query?.cursor) params.set("cursor", query.cursor);
    if (query?.limit) params.set("limit", String(query.limit));
    const qs = params.toString();
    return this.request(
      `/api/v1/notifications${qs ? `?${qs}` : ""}`,
      { method: "GET" },
      NotificationsListResponseSchema,
    );
  }

  async markNotificationRead(id: string) {
    const encoded = encodeURIComponent(id);
    return this.request(`/api/v1/notifications/${encoded}/read`, { method: "PATCH" });
  }

  async getNotificationsUnreadCount() {
    return this.request(
      "/api/v1/notifications/unread-count",
      { method: "GET" },
      NotificationsUnreadCountSchema,
    );
  }

  async request<T>(
    path: string,
    options: RequestOptions,
    schema?: { parse: (data: unknown) => T },
  ): Promise<T> {
    const url = `${this.config.baseUrl}${path.startsWith("/") ? path : `/${path}`}`;
    const headers: Record<string, string> = {
      Accept: "application/json",
      ...this.config.defaultHeaders,
      ...options.headers,
    };

    if (options.body !== undefined) {
      headers["Content-Type"] = "application/json";
    }

    const token = this.config.getAccessToken?.();
    if (token) {
      headers.Authorization = token.startsWith("Bearer ") ? token : `Bearer ${token}`;
    }

    const apiKey = this.config.getApiKey?.();
    if (apiKey) {
      headers["x-api-key"] = apiKey;
    }

    let init: RequestInit = {
      method: options.method ?? "GET",
      headers,
      credentials: this.config.credentials,
      signal: options.signal,
      body: options.body !== undefined ? JSON.stringify(options.body) : undefined,
    };

    for (const interceptor of this.requestInterceptors) {
      init = await interceptor({ path, init });
    }

    const fetchFn = this.config.fetch ?? fetch;
    let response = await fetchFn(url, init);

    for (const interceptor of this.responseInterceptors) {
      response = await interceptor({ path, response });
    }

    const text = await response.text();
    const json = text ? safeJsonParse(text) : null;

    if (!response.ok) {
      const apiError = parseApiErrorResponse(json, response.status);
      if (apiError) {
        throw apiError;
      }
      throw new ApiClientError({
        code: "HTTP_ERROR",
        message: text || response.statusText,
        status: response.status,
      });
    }

    if (schema) {
      return schema.parse(json);
    }

    return json as T;
  }
}

export function createApiClient(config: ApiClientConfig): BotmateApiClient {
  return new BotmateApiClient(config);
}

function safeJsonParse(text: string): unknown {
  try {
    return JSON.parse(text) as unknown;
  } catch {
    return { raw: text };
  }
}

export { AuthSuccessResponseSchema, AuthMeResponseSchema };
