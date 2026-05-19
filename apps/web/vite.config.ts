// @lovable.dev/vite-tanstack-config already includes the following — do NOT add them manually
// or the app will break with duplicate plugins:
//   - tanstackStart, viteReact, tailwindcss, tsConfigPaths, cloudflare (build-only),
//     componentTagger (dev-only), VITE_* env injection, @ path alias, React/TanStack dedupe,
//     error logger plugins, and sandbox detection (port/host/strictPort).
// You can pass additional config via defineConfig({ vite: { ... } }) if needed.
import { defineConfig } from "@lovable.dev/vite-tanstack-config";
import { clientProcessEnvPlugin } from "./vite-process-env-plugin";

/** TanStack Start client hydration reads process.env.TSS_* (hydrateStart.js). */
function tssEnvDefine(command: "serve" | "build") {
  return {
    "process.env.TSS_ROUTER_BASEPATH": JSON.stringify(""),
    "process.env.TSS_SERVER_FN_BASE": JSON.stringify(""),
    "process.env.TSS_DEV_SERVER": JSON.stringify(command === "serve" ? "true" : "false"),
    "process.env.TSS_DEV_SSR_STYLES_ENABLED": JSON.stringify("false"),
    "process.env.TSS_DEV_SSR_STYLES_BASEPATH": JSON.stringify(""),
    "process.env.TSS_INLINE_CSS_ENABLED": JSON.stringify("false"),
    "process.env.TSS_DISABLE_CSRF_MIDDLEWARE_WARNING": JSON.stringify("false"),
  } as const;
}

export default defineConfig((env) => ({
  define: tssEnvDefine(env.command),
  plugins: [clientProcessEnvPlugin()],
  server: {
    port: 8080,
    strictPort: false,
    allowedHosts: ["botmate.site-al.ru", "bot.neeklo.ru", "localhost", "127.0.0.1"],
  },
}));
