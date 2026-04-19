/**
 * Хуки лендинга. Компоненты страниц никогда не читают mock напрямую,
 * только через эти хуки → repository.
 */

import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { repository, type DemoRequestPayload } from "@/lib/mock/repository";
import { qk } from "@/lib/query-keys";

export const useChannels = () =>
  useQuery({ queryKey: qk.landing.channels, queryFn: () => repository.listChannels() });

export const useFeatures = () =>
  useQuery({ queryKey: qk.landing.features, queryFn: () => repository.listFeatures() });

export const useScenarios = () =>
  useQuery({ queryKey: qk.landing.scenarios, queryFn: () => repository.listScenarios() });

export const usePricing = () =>
  useQuery({ queryKey: qk.landing.pricing, queryFn: () => repository.listPricing() });

export const usePricingComparison = () =>
  useQuery({
    queryKey: qk.landing.pricingComparison,
    queryFn: () => repository.listPricingComparison(),
  });

export const useFaq = () =>
  useQuery({ queryKey: qk.landing.faq, queryFn: () => repository.listFaq() });

export const useCases = () =>
  useQuery({ queryKey: qk.landing.cases, queryFn: () => repository.listCases() });

export const useTrustLogos = () =>
  useQuery({ queryKey: qk.landing.trust, queryFn: () => repository.listTrustLogos() });

export const useBenefits = () =>
  useQuery({ queryKey: qk.landing.benefits, queryFn: () => repository.listBenefits() });

export const useHowItWorks = () =>
  useQuery({ queryKey: qk.landing.how, queryFn: () => repository.listHowItWorks() });

export const useHeroChat = () =>
  useQuery({ queryKey: qk.landing.heroChat, queryFn: () => repository.getHeroChat() });

export const useCreateDemoRequest = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: DemoRequestPayload) => repository.createDemoRequest(payload),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: qk.first100.stats });
    },
  });
};
