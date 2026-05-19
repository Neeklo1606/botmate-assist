import { createHash } from "node:crypto";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";

export interface WriteArtifactResult {
  storageKey: string;
  sha256: string;
  byteLength: number;
}

/** Local filesystem artifact backend — production swaps for S3/R2 implementing same surface. */
export class LocalArtifactStore {
  constructor(private readonly rootDir: string) {}

  resolveAbsolutePath(storageKey: string): string {
    const normalized = storageKey.replace(/^\/+/, "");
    const abs = join(this.rootDir, normalized);
    if (!abs.startsWith(this.rootDir)) {
      throw new Error("artifact_path_escape");
    }
    return abs;
  }

  async writeUtf8(relKey: string, body: string, _meta?: { contentType: string }): Promise<WriteArtifactResult> {
    return this.writeBuffer(relKey, Buffer.from(body, "utf8"));
  }

  async writeBuffer(relKey: string, body: Buffer): Promise<WriteArtifactResult> {
    const sha256 = createHash("sha256").update(body).digest("hex");
    const abs = this.resolveAbsolutePath(relKey);
    await mkdir(dirname(abs), { recursive: true });
    await writeFile(abs, body);
    return { storageKey: relKey.replace(/^\/+/, ""), sha256, byteLength: body.byteLength };
  }

  async delete(relKey: string): Promise<void> {
    const abs = this.resolveAbsolutePath(relKey);
    await unlink(abs).catch(() => undefined);
  }
}
