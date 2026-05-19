/** pgvector column width — keep aligned with migration `vector(1536)`. */
export const KNOWLEDGE_VECTOR_DIMENSION = Number(process.env.KNOWLEDGE_VECTOR_DIM ?? "1536");

/** Upload / extraction guards (oversized chunk attack surface). */
export const KNOWLEDGE_MAX_UPLOAD_BYTES = Number(process.env.KNOWLEDGE_MAX_UPLOAD_BYTES ?? `${25 * 1024 * 1024}`);
export const KNOWLEDGE_MAX_EXTRACT_CHARS = Number(process.env.KNOWLEDGE_MAX_EXTRACT_CHARS ?? `${4_000_000}`);
export const KNOWLEDGE_MAX_CHUNKS_PER_DOCUMENT = Number(process.env.KNOWLEDGE_MAX_CHUNKS_PER_DOCUMENT ?? "2000");

/** Chunking defaults — paragraph-merged “semantic” windows with overlap. */
export const KNOWLEDGE_TARGET_CHUNK_TOKENS = Number(process.env.KNOWLEDGE_TARGET_CHUNK_TOKENS ?? "520");
export const KNOWLEDGE_CHUNK_OVERLAP_TOKENS = Number(process.env.KNOWLEDGE_CHUNK_OVERLAP_TOKENS ?? "80");
export const KNOWLEDGE_MAX_CHUNK_TOKENS = Number(process.env.KNOWLEDGE_MAX_CHUNK_TOKENS ?? "900");

/** Phase 11B — hard cap on pgvector `LIMIT` (ANN index migration is separate). */
export const KNOWLEDGE_VECTOR_SEARCH_MAX_TOP_K = Number(process.env.KNOWLEDGE_VECTOR_SEARCH_MAX_TOP_K ?? "32");

export function estimateTokens(text: string): number {
  return Math.max(1, Math.ceil(text.length / 4));
}
