/** Previsione locale ufficiale (meteo.report), letta dal collector. Gli orari sono ore locali "naive". */
export interface LocalForecastHour {
  t: string; // 2026-11-23T04:00:00
  temp: number | null;
  windDir: number | null;
  rain: number | null;
  rainProb: number | null;
  freshSnow: number | null;
  snowLevel: number | null;
  freezingLevel: number | null;
  windSpeed: number | null;
  windGust: number | null;
  sky: string | null;
  sun: number | null;
}

export interface LocalForecastDay {
  date: string; // 2026-11-23
  tMin: number | null;
  tMax: number | null;
  rain: number | null;
  rainProb: number | null;
  freshSnow: number | null;
  snowLevel: number | null;
  freezingLevel: number | null;
  windSpeed: number | null;
  windGust: number | null;
  sky: string | null;
  sun: number | null;
}

export interface LocalForecast {
  id: string;
  name?: string;
  elevation?: number;
  start?: string;
  end?: string;
  hourly?: LocalForecastHour[];
  daily?: LocalForecastDay[];
  unreachable?: boolean;
  error?: string;
}
