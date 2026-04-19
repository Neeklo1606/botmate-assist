/**
 * Хуки программы «Первые 100 клиентов».
 */
import { useQuery } from "@tanstack/react-query";
import { repository } from "@/lib/mock/repository";
import { qk } from "@/lib/query-keys";

export const useFirst100Stats = () =>
  useQuery({ queryKey: qk.first100.stats, queryFn: () => repository.getFirst100Stats() });

export const useFirst100Benefits = () =>
  useQuery({ queryKey: qk.first100.benefits, queryFn: () => repository.listFirst100Benefits() });

export const useFirst100Math = () =>
  useQuery({ queryKey: qk.first100.math, queryFn: () => repository.listFirst100Math() });
