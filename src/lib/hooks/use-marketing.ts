/**
 * Хуки для marketing-страниц: cases, scenarios, integrations, team, legal.
 */
import { useQuery } from "@tanstack/react-query";
import { repository } from "@/lib/mock/repository";
import { qk } from "@/lib/query-keys";
import type { Niche } from "@/types/entities";

export const useCaseStudies = () =>
  useQuery({
    queryKey: qk.marketing.caseStudies,
    queryFn: () => repository.listCaseStudies(),
  });

export const useCaseStudy = (slug: string) =>
  useQuery({
    queryKey: qk.marketing.caseBySlug(slug),
    queryFn: () => repository.getCaseBySlug(slug),
  });

export const useScenarioDetails = () =>
  useQuery({
    queryKey: qk.marketing.scenarioDetails,
    queryFn: () => repository.listScenarioDetails(),
  });

export const useScenarioDetail = (niche: Niche) =>
  useQuery({
    queryKey: qk.marketing.scenarioByNiche(niche),
    queryFn: () => repository.getScenarioByNiche(niche),
  });

export const useIntegrationsList = () =>
  useQuery({
    queryKey: qk.marketing.integrations,
    queryFn: () => repository.listIntegrations(),
  });

export const useTeamPeople = () =>
  useQuery({
    queryKey: qk.marketing.team,
    queryFn: () => repository.listTeamPeople(),
  });

export const useLegalDoc = (slug: "privacy" | "offer") =>
  useQuery({
    queryKey: qk.marketing.legal(slug),
    queryFn: () => repository.getLegalDoc(slug),
  });
