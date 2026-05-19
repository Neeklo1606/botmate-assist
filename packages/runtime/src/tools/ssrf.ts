/** SSRF mitigation — hostname allowlists only (no raw IP literals except explicit localhost dev). */

const PRIVATE_IPV4_PREFIXES = [
  /^10\./,
  /^127\./,
  /^172\.(1[6-9]|2\d|3[0-1])\./,
  /^192\.168\./,
  /^169\.254\./,
];

export function assertSafeHttpUrl(urlStr: string, allowedHosts: ReadonlySet<string>): URL {
  let url: URL;
  try {
    url = new URL(urlStr);
  } catch {
    throw new Error("TOOL_HTTP_INVALID_URL");
  }

  if (url.protocol !== "https:" && !(url.protocol === "http:" && process.env.NODE_ENV !== "production")) {
    throw new Error("TOOL_HTTP_PROTOCOL_FORBIDDEN");
  }

  const host = url.hostname.toLowerCase();
  if (!host || host === "localhost") {
    if (process.env.NODE_ENV === "production") {
      throw new Error("TOOL_HTTP_LOCALHOST_FORBIDDEN");
    }
  }

  for (const re of PRIVATE_IPV4_PREFIXES) {
    if (re.test(host)) {
      throw new Error("TOOL_HTTP_PRIVATE_HOST_FORBIDDEN");
    }
  }

  if (!allowedHosts.has(host)) {
    throw new Error(`TOOL_HTTP_HOST_NOT_ALLOWED:${host}`);
  }

  return url;
}

export function mergeHttpAllowHosts(globalCsv: string | undefined, tenantHosts: readonly string[]): Set<string> {
  const set = new Set<string>();
  if (globalCsv) {
    for (const part of globalCsv.split(",")) {
      const h = part.trim().toLowerCase();
      if (h) set.add(h);
    }
  }
  for (const h of tenantHosts) {
    const x = h.trim().toLowerCase();
    if (x) set.add(x);
  }
  return set;
}
