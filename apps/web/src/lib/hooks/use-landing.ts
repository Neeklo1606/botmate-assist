/**
 * Хуки лендинга. Возвращают данные из repository, при locale="en" мерджат EN-переводы.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repository, type DemoRequestPayload } from "@/lib/mock/repository";
import { qk } from "@/lib/query-keys";
import { useLocale } from "@/lib/i18n/locale";
import {
  benefitsEn,
  casesEn,
  channelsEn,
  faqEn,
  featuresEn,
  heroChatEn,
  howEn,
  pricingEn,
  scenariosEn,
  trustLogosEn,
} from "@/lib/i18n/mock-en";

function localize<T extends { id: string }>(
  items: T[],
  isEn: boolean,
  dict: Record<string, Partial<T>>,
): T[] {
  if (!isEn) return items;
  return items.map((it) => {
    const overrides = dict[it.id];
    return overrides ? ({ ...it, ...overrides } as T) : it;
  });
}

export const useChannels = () => {
  const { locale } = useLocale();
  return useQuery({
    queryKey: [...qk.landing.channels, locale],
    queryFn: async () => localize(await repository.listChannels(), locale === "en", channelsEn),
  });
};

export const useFeatures = () => {
  const { locale } = useLocale();
  return useQuery({
    queryKey: [...qk.landing.features, locale],
    queryFn: async () => localize(await repository.listFeatures(), locale === "en", featuresEn),
  });
};

export const useScenarios = () => {
  const { locale } = useLocale();
  return useQuery({
    queryKey: [...qk.landing.scenarios, locale],
    queryFn: async () => localize(await repository.listScenarios(), locale === "en", scenariosEn),
  });
};

export const usePricing = () => {
  const { locale } = useLocale();
  return useQuery({
    queryKey: [...qk.landing.pricing, locale],
    queryFn: async () => {
      const plans = await repository.listPricing();
      if (locale !== "en") return plans;
      return plans.map((p) => {
        const o = pricingEn[p.id];
        if (!o) return p;
        return { ...p, ...o, cta: { ...p.cta, ...o.cta } };
      });
    },
  });
};

export const usePricingComparison = () =>
  useQuery({
    queryKey: qk.landing.pricingComparison,
    queryFn: () => repository.listPricingComparison(),
  });

export const useFaq = () => {
  const { locale } = useLocale();
  return useQuery({
    queryKey: [...qk.landing.faq, locale],
    queryFn: async () => localize(await repository.listFaq(), locale === "en", faqEn),
  });
};

export const useCases = () => {
  const { locale } = useLocale();
  return useQuery({
    queryKey: [...qk.landing.cases, locale],
    queryFn: async () => localize(await repository.listCases(), locale === "en", casesEn),
  });
};

export const useTrustLogos = () => {
  const { locale } = useLocale();
  return useQuery({
    queryKey: [...qk.landing.trust, locale],
    queryFn: async () => localize(await repository.listTrustLogos(), locale === "en", trustLogosEn),
  });
};

export const useBenefits = () => {
  const { locale } = useLocale();
  return useQuery({
    queryKey: [...qk.landing.benefits, locale],
    queryFn: async () => localize(await repository.listBenefits(), locale === "en", benefitsEn),
  });
};

export const useHowItWorks = () => {
  const { locale } = useLocale();
  return useQuery({
    queryKey: [...qk.landing.how, locale],
    queryFn: async () => localize(await repository.listHowItWorks(), locale === "en", howEn),
  });
};

export const useHeroChat = () => {
  const { locale } = useLocale();
  return useQuery({
    queryKey: [...qk.landing.heroChat, locale],
    queryFn: async () => localize(await repository.getHeroChat(), locale === "en", heroChatEn),
  });
};

export const useCreateDemoRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DemoRequestPayload) => repository.createDemoRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.first100.stats });
    },
  });
};
