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
    rain?: string; // Pluviometer page URL
  };
  hasWinterRainDisclaimer?: boolean; // Pluviometer unreliable in winter
  hasWindSensor?: boolean; // XML stations: true if vento_al_suolo exists
  hasRainSensor?: boolean; // XML stations: true if pluviometro exists
  unreachable?: boolean; // Station currently unreachable
  noData?: boolean; // Station raggiunta ma senza misure disponibili
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
  // Extra fields (MeteoTrentino XML)
  solarRadiation?: number | null;  // W/m²
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

// ─── Snow / Nivometer types ───

export interface SnowFieldReading {
  date: string;       // YYYY-MM-DD
  hs: number | null;  // snow depth at ground (cm)
  hn: number | null;  // fresh snow (cm)
}

export interface SnowStation {
  id: string;
  name: string;
  location: string;
  altitude: number;
  lat: number;
  lng: number;
  linkedStationId: string; // links to WeatherStation.id
  urls: {
    nivometro: string;     // auto nivometer page
    campoNeve: string;     // manual field page
    campoNeveJson: string; // JSON API for field data
  };
  campoNeveCode: string;   // e.g. '4SMC', '31RO'
  lastUpdate: string;
  currentDepth: number | null; // cm; null se nella stagione non c'è ancora nessun rilievo
  history: SnowFieldReading[]; // last ~30 days from campo neve
  noData?: boolean;            // true: nessun rilievo da mostrare
  unavailable?: boolean;       // true: fonte non raggiungibile (diverso da "nessun rilievo in stagione")
}
