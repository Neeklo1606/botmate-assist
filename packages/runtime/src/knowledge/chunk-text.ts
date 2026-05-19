import {
  KNOWLEDGE_CHUNK_OVERLAP_TOKENS,
  KNOWLEDGE_MAX_CHUNK_TOKENS,
  KNOWLEDGE_TARGET_CHUNK_TOKENS,
  estimateTokens,
} from "./constants.js";

export interface KnowledgeChunkDraft {
  ordinal: number;
  content: string;
  tokenEstimate: number;
  metadata: Record<string, unknown>;
}

function paragraphsFromText(text: string): string[] {
  const normalized = text.replace(/\r\n/g, "\n").trim();
  if (!normalized) return [];
  return normalized
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
}

/** Takes the last ~overlapTokens worth of characters as context glue for the next chunk. */
function overlapCarry(previousChunk: string, overlapTokens: number): string {
  if (!previousChunk.trim() || overlapTokens <= 0) return "";
  const approxChars = overlapTokens * 4;
  const slice = previousChunk.slice(Math.max(0, previousChunk.length - approxChars)).trim();
  return slice ? `${slice}\n\n` : "";
}

function hardSliceParagraph(p: string): string[] {
  const maxChars = Math.max(256, KNOWLEDGE_MAX_CHUNK_TOKENS * 4);
  if (p.length <= maxChars) return [p];
  const parts: string[] = [];
  for (let i = 0; i < p.length; i += maxChars) {
    parts.push(p.slice(i, i + maxChars));
  }
  return parts;
}

/** Paragraph-merged chunking with tail overlap; hard-slices pathological huge paragraphs. */
export function chunkKnowledgeText(text: string, sourceMime: string): KnowledgeChunkDraft[] {
  const rawParas = paragraphsFromText(text);
  const paras = rawParas.flatMap(hardSliceParagraph);
  if (paras.length === 0) return [];

  const chunks: KnowledgeChunkDraft[] = [];
  let buf = "";
  let ordinal = 0;

  const pushChunk = (body: string): void => {
    const trimmed = body.trim();
    if (!trimmed) return;
    ordinal += 1;
    chunks.push({
      ordinal,
      content: trimmed,
      tokenEstimate: estimateTokens(trimmed),
      metadata: {
        sourceMime,
      },
    });
  };

  for (const p of paras) {
    const merged = buf ? `${buf}\n\n${p}` : p;
    const mergedTok = estimateTokens(merged);

    if (mergedTok > KNOWLEDGE_MAX_CHUNK_TOKENS && buf.trim()) {
      pushChunk(buf);
      buf = `${overlapCarry(buf, KNOWLEDGE_CHUNK_OVERLAP_TOKENS)}${p}`;
      continue;
    }

    buf = merged;

    if (estimateTokens(buf) >= KNOWLEDGE_TARGET_CHUNK_TOKENS) {
      pushChunk(buf);
      buf = overlapCarry(buf, KNOWLEDGE_CHUNK_OVERLAP_TOKENS);
    }
  }

  pushChunk(buf);

  return chunks;
}
