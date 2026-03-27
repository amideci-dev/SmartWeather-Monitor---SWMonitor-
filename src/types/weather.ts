export interface WeatherStation {
  id: string;
  name: string;
  location: string;
  altitude: number;
  lastUpdate: string;
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
  dewPoint: number;
  perceivedTemp: number;
  wetBulb: number;
  rainIntensity: number;
  pressure: number;
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
}

export interface WindData {
  direction: string;
  directionDegrees: number;
  speed: number;
  beaufort: number;
  beaufortDescription: string;
  windChill: number;
  feelsLike: number;
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
