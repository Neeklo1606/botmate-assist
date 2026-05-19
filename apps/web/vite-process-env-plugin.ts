import type { Plugin } from "vite";

/** Browser-safe process.env for TanStack Start + react-dom when modules skip Vite define (e.g. /@fs/ in dev). */
const PROCESS_ENV_SNIPPET = `window.process=window.process||{env:{NODE_ENV:"production",TSS_ROUTER_BASEPATH:"",TSS_SERVER_FN_BASE:"",TSS_DEV_SERVER:"true",TSS_DEV_SSR_STYLES_ENABLED:"false",TSS_DEV_SSR_STYLES_BASEPATH:"",TSS_INLINE_CSS_ENABLED:"false",TSS_DISABLE_CSRF_MIDDLEWARE_WARNING:"false"}};`;

export function clientProcessEnvPlugin(): Plugin {
  return {
    name: "botmate-client-process-env",
    apply: "serve",
    transformIndexHtml: {
      order: "pre",
      handler(html) {
        if (html.includes("botmate-client-process-env")) return html;
        const tag = `<script id="botmate-client-process-env">${PROCESS_ENV_SNIPPET}</script>`;
        if (/<head[^>]*>/i.test(html)) {
          return html.replace(/<head([^>]*)>/i, `<head$1>${tag}`);
        }
        return `${tag}${html}`;
      },
    },
    transform(code, _id, options) {
      if (options?.ssr) return null;
      if (!code.includes("process.")) return null;
      if (code.includes("botmate-client-process-env-prelude")) return null;
      return {
        code: `/* botmate-client-process-env-prelude */${PROCESS_ENV_SNIPPET}\n${code}`,
        map: null,
      };
    },
  };
}
