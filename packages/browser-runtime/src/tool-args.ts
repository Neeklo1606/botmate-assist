import { z } from "zod";
import type { BrowserToolId } from "./constants.js";
import type { BrowserStep } from "./step-plan.js";

const OpenArgsSchema = z.object({
  url: z.string().min(1).max(4096),
  waitUntil: z.enum(["domcontentloaded", "load", "networkidle"]).optional(),
});

const ClickArgsSchema = z.object({
  selector: z.string().min(1).max(4096),
  timeoutMs: z.number().int().positive().max(120_000).optional(),
});

const TypeArgsSchema = z.object({
  selector: z.string().min(1).max(4096),
  text: z.string().max(8000),
  timeoutMs: z.number().int().positive().max(120_000).optional(),
});

const ExtractArgsSchema = z.object({
  selector: z.string().min(1).max(4096),
  mode: z.enum(["text", "inner_html"]),
  timeoutMs: z.number().int().positive().max(120_000).optional(),
});

const WaitArgsSchema = z.object({
  waitKind: z.enum(["selector", "load"]),
  selector: z.string().min(1).max(4096).optional(),
  timeoutMs: z.number().int().positive().max(120_000).optional(),
});

const ScreenshotArgsSchema = z.object({
  fullPage: z.boolean().optional(),
});

const CloseArgsSchema = z.object({
  reason: z.string().max(128).optional(),
});

export function browserStepsFromToolCall(toolId: BrowserToolId, raw: unknown): BrowserStep[] {
  switch (toolId) {
    case "browser.open": {
      const a = OpenArgsSchema.parse(raw);
      return [{ kind: "open", url: a.url, waitUntil: a.waitUntil }];
    }
    case "browser.click": {
      const a = ClickArgsSchema.parse(raw);
      return [{ kind: "click", selector: a.selector, timeoutMs: a.timeoutMs }];
    }
    case "browser.type": {
      const a = TypeArgsSchema.parse(raw);
      return [{ kind: "type", selector: a.selector, text: a.text, timeoutMs: a.timeoutMs }];
    }
    case "browser.extract": {
      const a = ExtractArgsSchema.parse(raw);
      return [{ kind: "extract", selector: a.selector, mode: a.mode, timeoutMs: a.timeoutMs }];
    }
    case "browser.wait": {
      const a = WaitArgsSchema.parse(raw);
      return [{ kind: "wait", waitKind: a.waitKind, selector: a.selector, timeoutMs: a.timeoutMs }];
    }
    case "browser.screenshot": {
      const a = ScreenshotArgsSchema.parse(raw);
      return [{ kind: "screenshot", fullPage: a.fullPage }];
    }
    case "browser.close": {
      const a = CloseArgsSchema.parse(raw ?? {});
      return [{ kind: "close", reason: a.reason }];
    }
  }
}
