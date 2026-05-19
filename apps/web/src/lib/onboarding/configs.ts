import type { OnboardingConfig, OnboardingProduct } from "./types";
import { assistantConfig } from "./configs/assistant-config";
import { mediaConfig } from "./configs/media-config";
import { siteConfig } from "./configs/site-config";

export function getOnboardingConfig(product: OnboardingProduct): OnboardingConfig {
  switch (product) {
    case "assistant":
      return assistantConfig;
    case "media":
      return mediaConfig;
    case "site":
      return siteConfig;
  }
}
