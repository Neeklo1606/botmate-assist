import { KNOWLEDGE_VECTOR_DIMENSION } from "../knowledge/constants.js";

export type KnowledgeEmbeddingProviderId = "openai" | "ollama" | "openrouter";

export interface EmbedTextsResult {
  embeddings: number[][];
  provider: KnowledgeEmbeddingProviderId;
  model: string;
  durationMs: number;
}

function assertDimension(vec: number[]): void {
  if (vec.length !== KNOWLEDGE_VECTOR_DIMENSION) {
    throw new Error(`EMBEDDING_DIM_MISMATCH:want_${KNOWLEDGE_VECTOR_DIMENSION}_got_${vec.length}`);
  }
}

export interface KnowledgeEmbeddingClients {
  openAiApiKey: string | null;
  openRouterApiKey: string | null;
  ollamaBaseUrl: string | null;
}

export function resolveKnowledgeEmbeddingProvider(): KnowledgeEmbeddingProviderId {
  const raw = (process.env.KNOWLEDGE_EMBEDDING_PROVIDER ?? "openai").trim().toLowerCase();
  if (raw === "openai" || raw === "ollama" || raw === "openrouter") return raw;
  return "openai";
}

export function resolveKnowledgeEmbeddingModel(provider: KnowledgeEmbeddingProviderId): string {
  if (provider === "openai") {
    return process.env.KNOWLEDGE_EMBEDDING_MODEL?.trim() || "text-embedding-3-small";
  }
  if (provider === "ollama") {
    return process.env.OLLAMA_EMBEDDING_MODEL?.trim() || "nomic-embed-text";
  }
  return process.env.OPENROUTER_EMBEDDING_MODEL?.trim() || "openai/text-embedding-3-small";
}

async function embedOpenAi(inputs: string[], model: string, apiKey: string): Promise<number[][]> {
  const res = await fetch("https://api.openai.com/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, input: inputs }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OPENAI_EMBEDDINGS_HTTP_${res.status}:${body.slice(0, 280)}`);
  }
  const json = (await res.json()) as {
    data?: Array<{ embedding?: number[]; index?: number }>;
  };
  const rows = json.data ?? [];
  rows.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return rows.map((r) => {
    const emb = r.embedding ?? [];
    assertDimension(emb);
    return emb;
  });
}

async function embedOpenRouter(inputs: string[], model: string, apiKey: string): Promise<number[][]> {
  const res = await fetch("https://openrouter.ai/api/v1/embeddings", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({ model, input: inputs }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OPENROUTER_EMBEDDINGS_HTTP_${res.status}:${body.slice(0, 280)}`);
  }
  const json = (await res.json()) as {
    data?: Array<{ embedding?: number[]; index?: number }>;
  };
  const rows = json.data ?? [];
  rows.sort((a, b) => (a.index ?? 0) - (b.index ?? 0));
  return rows.map((r) => {
    const emb = r.embedding ?? [];
    assertDimension(emb);
    return emb;
  });
}

async function embedOllamaOne(text: string, model: string, baseUrl: string): Promise<number[]> {
  const url = `${baseUrl.replace(/\/$/, "")}/api/embeddings`;
  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ model, prompt: text }),
  });
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(`OLLAMA_EMBEDDINGS_HTTP_${res.status}:${body.slice(0, 280)}`);
  }
  const json = (await res.json()) as { embedding?: number[] };
  const emb = json.embedding ?? [];
  assertDimension(emb);
  return emb;
}

/** Batch embedding — OpenAI/OpenRouter accept arrays; Ollama is invoked per row (serialized). */
export async function embedTextsForKnowledge(
  inputs: string[],
  clients: KnowledgeEmbeddingClients,
  opts?: { providerOverride?: KnowledgeEmbeddingProviderId; modelHint?: string },
): Promise<EmbedTextsResult> {
  const started = Date.now();
  const provider = opts?.providerOverride ?? resolveKnowledgeEmbeddingProvider();
  const model = opts?.modelHint?.trim() || resolveKnowledgeEmbeddingModel(provider);

  let embeddings: number[][] = [];

  if (provider === "openai") {
    const key = clients.openAiApiKey?.trim();
    if (!key) throw new Error("OPENAI_KEY_MISSING_FOR_EMBEDDINGS");
    embeddings = await embedOpenAi(inputs, model, key);
  } else if (provider === "openrouter") {
    const key = clients.openRouterApiKey?.trim();
    if (!key) throw new Error("OPENROUTER_KEY_MISSING_FOR_EMBEDDINGS");
    embeddings = await embedOpenRouter(inputs, model, key);
  } else {
    const base = clients.ollamaBaseUrl?.trim();
    if (!base) throw new Error("OLLAMA_BASE_URL_MISSING_FOR_EMBEDDINGS");
    embeddings = [];
    for (const t of inputs) {
      embeddings.push(await embedOllamaOne(t, model, base));
    }
  }

  return {
    embeddings,
    provider,
    model,
    durationMs: Date.now() - started,
  };
}
