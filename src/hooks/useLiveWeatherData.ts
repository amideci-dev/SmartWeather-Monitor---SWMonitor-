import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface LiveStationData {
  id: string;
  unreachable: boolean;
  noData?: boolean;
  lastUpdate?: string;
  error?: string;
  weather?: any;
  wind?: any;
}

interface LiveWeatherResponse {
  success: boolean;
  timestamp: string;
  stations: LiveStationData[];
  hydrometers: LiveStationData[];
  snowStations?: any[];
}

async function fetchLiveData(): Promise<LiveWeatherResponse> {
  const url = import.meta.env.VITE_API_URL;

  // Produzione (Cloudflare Pages): collector sul NAS
  if (url) {
    const res = await fetch(url, { signal: AbortSignal.timeout(30000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    if (!data?.success) throw new Error(data?.error || 'Unknown error');
    return data;
  }

  // Anteprima Lovable (VITE_API_URL non impostata): funzione Supabase come prima
  const { data, error } = await supabase.functions.invoke('fetch-weather-data');
  if (error) throw new Error(error.message);
  if (!data?.success) throw new Error(data?.error || 'Unknown error');
  return data;
}

export function useLiveWeatherData() {
  return useQuery({
    queryKey: ['live-weather-data'],
    queryFn: fetchLiveData,
    refetchInterval: 5 * 60 * 1000, // Refresh every 5 minutes
    staleTime: 2 * 60 * 1000, // Consider data stale after 2 minutes
    retry: 2,
  });
}
