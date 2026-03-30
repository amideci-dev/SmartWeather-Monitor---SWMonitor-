export type StationSource = 'html' | 'xml' | 'wunderground';

export interface WeatherStation {
  id: string;
  name: string;
  location: string;
  altitude: number;
  lat: number;
  lng: number;
  source: StationSource;
  lastUpdate: string;
  urls: {
    weather: string;
    wind?: string; // XML stations have wind in same URL
  };
  weather: WeatherData;
  wind: WindData;
}

export interface WeatherData {
  condition: string;
  conditionIcon: string;
  temperature: number;
  temperatureTrend: 'rising' | 'falling' | 'stable';
  temperatureTrendValue: number;
  humidity: number;
  humidityTrend: 'rising' | 'falling' | 'stable';
  humidityTrendValue: number;
  dewPoint: number | null;
  perceivedTemp: number | null;
  wetBulb: number | null;
  rainIntensity: number;
  pressure: number | null;
  pressureTrend: 'rising' | 'falling' | 'stable';
  pressureTrendValue: number;
  dailyExtremes: {
    tempMin: number;
    tempMinTime: string;
    tempMax: number;
    tempMaxTime: string;
    maxGust: number;
    maxGustTime: string;
    dailyRain: number;
    maxRainIntensity: number;
  };
  // Extra fields (WeatherUnderground)
  visibility?: number | null;      // km
  snowDepth?: number | null;       // cm
  uvIndex?: number | null;
  airQualityIndex?: number | null;
}

export interface WindData {
  direction: string;
  directionDegrees: number;
  speed: number;
  beaufort: number;
  beaufortDescription: string;
  windChill: number | null;
  feelsLike: number | null;
  averages: {
    min10: number;
    min15: number;
    min30: number;
    min60: number;
  };
  gusts: {
    lastHour: number;
    today: number;
    todayTime: string;
  };
}

export interface Hydrometer {
  id: string;
  name: string;
  location: string;
  river: string;
  lat: number;
  lng: number;
  url: string;
  sensorId: string;
  lastUpdate: string;
  currentLevel: number;
  currentFlow: number | null; // m³/s — not all have flow
  levelUnit: string;
  flowUnit: string;
  history: HydrometerReading[];
}

export interface HydrometerReading {
  time: string;
  level: number;
  flow: number | null;
}
