export type ForecastLocationId = 'san-martino' | 'passo-rolle';
export type ForecastModelId = 'ecmwf_ifs025' | 'gfs_seamless' | 'icon_seamless' | 'meteofrance_arome_france_hd';
export type ForecastCondition = 'dry' | 'partly-cloudy' | 'cloudy' | 'rain' | 'snow' | 'storm';

export interface ForecastLocation {
  id: ForecastLocationId;
  name: string;
  shortName: string;
  altitude: number;
  latitude: number;
  longitude: number;
}

export interface ForecastModel {
  id: ForecastModelId;
  name: string;
  shortName: string;
  provider: string;
  description: string;
  kind: 'ensemble' | 'deterministic';
}

export interface EnsembleMember {
  id: string;
  label: string;
  temperature: (number | null)[];
  precipitation: (number | null)[];
  snowfall: (number | null)[];
  weatherCode: (number | null)[];
  cloudCover: (number | null)[];
}

export interface EnsembleForecast {
  location: ForecastLocation;
  model: ForecastModel;
  times: string[];
  utcOffsetSeconds: number;
  elevation: number;
  members: EnsembleMember[];
  fetchedAt: string;
}

export interface ForecastStats {
  hours: number;
  memberCount: number;
  tempMin: number;
  tempMax: number;
  tempTrend: number;
  spread: number;
  agreement: 'alto' | 'medio' | 'basso' | 'non valutabile';
  precipitationProbability: number;
  snowProbability: number;
  snowAvailable: boolean;
  heavyPrecipitationProbability: number;
  meanPrecipitationTotal: number;
}

export interface DailyForecast {
  date: string;
  tempMin: number;
  tempMax: number;
  precipitationProbability: number;
  snowProbability: number;
  meanPrecipitationTotal: number;
  condition: ForecastCondition;
}

export interface HourlyForecast {
  time: string;
  temperature: number;
  precipitation: number;
  precipitationProbability: number;
  snowfall: number;
  snowProbability: number;
  snowAvailable: boolean;
  condition: ForecastCondition;
}
