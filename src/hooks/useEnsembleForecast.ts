import { useQuery } from '@tanstack/react-query';
import { fetchEnsembleForecast } from '@/lib/forecast';
import { ForecastLocation, ForecastModel } from '@/types/forecast';

export function useEnsembleForecast(location: ForecastLocation, model: ForecastModel) {
  return useQuery({
    queryKey: ['ensemble-forecast', location.id, model.id],
    queryFn: ({ signal }) => fetchEnsembleForecast(location, model, signal),
    refetchInterval: 30 * 60 * 1000,
    staleTime: 15 * 60 * 1000,
    retry: 2,
  });
}
