import type { ToolExecutionContext } from "../tool-runtime.js";
import type { ToolNormalizedResult } from "../tool-runtime.js";
import { normalizeToolResult } from "../tool-runtime.js";
import { assertSafeHttpUrl } from "./ssrf.js";

const MAX_RESPONSE_BYTES = Number(process.env.TOOL_HTTP_MAX_RESPONSE_BYTES ?? `${256 * 1024}`);

export async function executeConfiguredHttpTool(input: {
  ctx: ToolExecutionContext;
  urlTemplate: string;
  method: "GET" | "POST";
  headers?: Record<string, string>;
  args: Record<string, unknown>;
  allowedHosts: ReadonlySet<string>;
  timeoutMs: number;
  signal?: AbortSignal;
}): Promise<ToolNormalizedResult> {
  const urlFilled = interpolateTemplate(input.urlTemplate, input.args);
  const url = assertSafeHttpUrl(urlFilled, input.allowedHosts);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), input.timeoutMs);
  const signal =
    input.signal ?
      AbortSignal.any([input.signal, controller.signal])
    : controller.signal;

  try {
    const body =
      input.method === "POST" ?
        JSON.stringify(sanitizeArgsForHttp(input.args))
      : undefined;

    const res = await fetch(url.toString(), {
      method: input.method,
      headers: {
        ...(input.headers ?? {}),
        ...(input.method === "POST" ? { "Content-Type": "application/json" } : {}),
      },
      body,
      signal,
    });

    const buf = await readBodyWithCap(res.body, MAX_RESPONSE_BYTES);
    const text = new TextDecoder().decode(buf);

    if (!res.ok) {
      return {
        ok: false,
        error: {
          code: `HTTP_${res.status}`,
          message: text.slice(0, 2048),
        },
      };
    }

    let parsed: unknown = text;
    try {
      parsed = JSON.parse(text) as unknown;
    } catch {
      /* plain text ok */
    }

    return normalizeToolResult({ ok: true, data: { status: res.status, body: parsed } });
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    const retryable =
      msg.includes("abort") || msg.includes("Abort") || msg.includes("fetch failed") || msg.includes("ECONNRESET");
    if (retryable) {
      const e = new Error(`TOOL_HTTP_RETRYABLE:${msg}`);
      e.name = "ToolHttpRetryableError";
      throw e;
    }
    return { ok: false, error: { code: "TOOL_HTTP_FAILED", message: msg.slice(0, 512) } };
  } finally {
    clearTimeout(timer);
  }
}

function interpolateTemplate(template: string, args: Record<string, unknown>): string {
  return template.replace(/\{args\.([^}]+)\}/g, (_, key: string) => {
    const k = String(key).trim();
    if (!/^[a-zA-Z0-9_]+$/.test(k)) return "";
    const v = args[k];
    if (v === undefined || v === null) return "";
    return encodeURIComponent(String(v));
  });
}

function sanitizeArgsForHttp(args: Record<string, unknown>): Record<string, unknown> {
  const out: Record<string, unknown> = {};
  for (const [k, v] of Object.entries(args)) {
    if (/^[a-zA-Z0-9_]+$/.test(k)) out[k] = v;
  }
  return out;
}

async function readBodyWithCap(body: ReadableStream<Uint8Array> | null, maxBytes: number): Promise<Uint8Array> {
  if (!body) return new Uint8Array();
  const reader = body.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      total += value.byteLength;
      if (total > maxBytes) {
        await reader.cancel();
        throw new Error("TOOL_HTTP_BODY_TOO_LARGE");
      }
      chunks.push(value);
    }
  }
  const merged = new Uint8Array(total);
  let offset = 0;
  for (const c of chunks) {
    merged.set(c, offset);
    offset += c.byteLength;
  }
  return merged;
}
