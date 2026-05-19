import mammoth from "mammoth";
import {
  KNOWLEDGE_MAX_EXTRACT_CHARS,
} from "./constants.js";

function sanitizeExtractedText(raw: string): string {
  const noNull = raw.replace(/\u0000/g, "");
  const collapsed = noNull.replace(/\r\n/g, "\n").trim();
  return collapsed.slice(0, KNOWLEDGE_MAX_EXTRACT_CHARS);
}

export async function extractPlainText(buffer: Buffer, mimeType: string): Promise<string> {
  const mt = mimeType.toLowerCase().split(";")[0]?.trim() ?? "";

  if (mt === "text/plain" || mt === "text/markdown") {
    const decoded = buffer.toString("utf8");
    return sanitizeExtractedText(decoded);
  }

  if (mt === "application/pdf") {
    const pdfParseMod = await import("pdf-parse");
    const pdfParse = pdfParseMod.default as (data: Buffer) => Promise<{ text: string }>;
    try {
      const res = await pdfParse(buffer);
      return sanitizeExtractedText(res.text ?? "");
    } catch {
      throw new Error("PDF_PARSE_FAILED");
    }
  }

  if (
    mt === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mt === "application/msword"
  ) {
    const res = await mammoth.extractRawText({ buffer });
    return sanitizeExtractedText(res.value ?? "");
  }

  throw new Error(`UNSUPPORTED_MIME:${mt}`);
}
