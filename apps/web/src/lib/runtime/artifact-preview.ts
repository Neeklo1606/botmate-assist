/**
 * Builds absolute preview URLs for authenticated cookie-binary artifact streaming.
 * Prefer same-origin API deployments — cross-origin `<img>` omits credentials by default.
 */
export function runtimeArtifactAuthenticatedPreviewUrl(hrefPath: string): string {
  const raw =
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_URL ??
    "http://localhost:3001";
  try {
    const u = new URL(raw);
    const path = hrefPath.startsWith("/") ? hrefPath : `/${hrefPath}`;
    return `${u.origin}${path}`;
  } catch {
    return hrefPath.startsWith("/") ? hrefPath : `/${hrefPath}`;
  }
}

/** Signed-binary preview (`binary-signed`) — token in query supports `<img>` / new-tab without cookies. */
export function runtimeArtifactSignedPreviewUrl(downloadPath: string, token: string): string {
  const base =
    (import.meta as ImportMeta & { env?: Record<string, string> }).env?.VITE_API_URL ?? "http://localhost:3001";
  try {
    const origin = new URL(base).origin;
    const path = downloadPath.startsWith("/") ? downloadPath : `/${downloadPath}`;
    return `${origin}${path}?token=${encodeURIComponent(token)}`;
  } catch {
    const path = downloadPath.startsWith("/") ? downloadPath : `/${downloadPath}`;
    return `${path}?token=${encodeURIComponent(token)}`;
  }
}
