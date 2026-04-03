import { WeatherStation, Hydrometer } from '@/types/weather';
import { mockStations, mockHydrometers } from '@/data/mockStations';

interface LiveStationData {
  id: string;
  unreachable: boolean;
  lastUpdate?: string;
  error?: string;
  weather?: any;
  wind?: any;
}

/**
 * Merge live data into mock station definitions.
 * Mock data provides structure (id, name, location, lat, lng, source, urls, flags).
 * Live data overrides weather readings, wind readings, and lastUpdate.
 */
export function mergeStationsWithLiveData(
  liveStations: LiveStationData[] | undefined
): WeatherStation[] {
  if (!liveStations || liveStations.length === 0) return mockStations;

  return mockStations.map((mock) => {
    const live = liveStations.find((l) => l.id === mock.id);
    if (!live || live.unreachable) {
      return {
        ...mock,
        unreachable: live?.unreachable ?? false,
      };
    }

    const liveWeather = live.weather;
    const liveWind = live.wind;

    return {
      ...mock,
      unreachable: false,
      lastUpdate: live.lastUpdate || mock.lastUpdate,
      weather: liveWeather
        ? {
            ...mock.weather,
            condition: liveWeather.condition ?? mock.weather.condition,
            conditionIcon: liveWeather.conditionIcon ?? mock.weather.conditionIcon,
            temperature: liveWeather.temperature ?? mock.weather.temperature,
            temperatureTrend: liveWeather.temperatureTrend ?? mock.weather.temperatureTrend,
            temperatureTrendValue: liveWeather.temperatureTrendValue ?? mock.weather.temperatureTrendValue,
            humidity: liveWeather.humidity ?? mock.weather.humidity,
            humidityTrend: liveWeather.humidityTrend ?? mock.weather.humidityTrend,
            humidityTrendValue: liveWeather.humidityTrendValue ?? mock.weather.humidityTrendValue,
            dewPoint: liveWeather.dewPoint !== undefined ? liveWeather.dewPoint : mock.weather.dewPoint,
            perceivedTemp: liveWeather.perceivedTemp !== undefined ? liveWeather.perceivedTemp : mock.weather.perceivedTemp,
            wetBulb: liveWeather.wetBulb !== undefined ? liveWeather.wetBulb : mock.weather.wetBulb,
            rainIntensity: liveWeather.rainIntensity ?? mock.weather.rainIntensity,
            pressure: liveWeather.pressure !== undefined ? liveWeather.pressure : mock.weather.pressure,
            pressureTrend: liveWeather.pressureTrend ?? mock.weather.pressureTrend,
            pressureTrendValue: liveWeather.pressureTrendValue ?? mock.weather.pressureTrendValue,
            dailyExtremes: liveWeather.dailyExtremes
              ? { ...mock.weather.dailyExtremes, ...liveWeather.dailyExtremes }
              : mock.weather.dailyExtremes,
            solarRadiation: liveWeather.solarRadiation !== undefined
              ? liveWeather.solarRadiation
              : mock.weather.solarRadiation,
            visibility: liveWeather.visibility !== undefined ? liveWeather.visibility : mock.weather.visibility,
            uvIndex: liveWeather.uvIndex !== undefined ? liveWeather.uvIndex : mock.weather.uvIndex,
          }
        : mock.weather,
      wind: liveWind
        ? {
            ...mock.wind,
            ...liveWind,
          }
        : mock.wind,
    };
  });
}

interface LiveHydrometerData {
  id: string;
  unreachable: boolean;
  lastUpdate?: string;
  currentLevel?: number;
  currentFlow?: number | null;
  history?: { time: string; level: number; flow: number | null }[];
  error?: string;
}

export function mergeHydrometersWithLiveData(
  liveHydrometers: LiveHydrometerData[] | undefined
): Hydrometer[] {
  if (!liveHydrometers || liveHydrometers.length === 0) return mockHydrometers;

  return mockHydrometers.map((mock) => {
    const live = liveHydrometers.find((l) => l.id === mock.id);
    if (!live || live.unreachable || !live.history?.length) return mock;

    return {
      ...mock,
      lastUpdate: live.lastUpdate || mock.lastUpdate,
      currentLevel: live.currentLevel ?? mock.currentLevel,
      currentFlow: live.currentFlow ?? mock.currentFlow,
      history: live.history,
    };
  });
}
