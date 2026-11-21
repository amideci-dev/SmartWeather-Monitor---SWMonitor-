import {
  DailyForecast,
  EnsembleForecast,
  EnsembleMember,
  ForecastLocation,
  ForecastModel,
  ForecastStats,
  HourlyForecast,
} from '@/types/forecast';

const API_URL = 'https://ensemble-api.open-meteo.com/v1/ensemble';
const VARIABLES = ['temperature_2m', 'precipitation', 'snowfall', 'weather_code', 'cloud_cover'] as const;

type NumericArray = (number | null)[];
interface EnsembleApiResponse {
  elevation?: number;
  utc_offset_seconds?: number;
  hourly?: Record<string, string[] | NumericArray | undefined>;
  reason?: string;
}

const finite = (values: (number | null | undefined)[]) =>
  values.filter((value): value is number => typeof value === 'number' && Number.isFinite(value));

const average = (values: (number | null | undefined)[]) => {
  const valid = finite(values);
  return valid.length ? valid.reduce((sum, value) => sum + value, 0) / valid.length : 0;
};

const percentile = (values: (number | null | undefined)[], fraction: number) => {
  const sorted = finite(values).sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
};

const round = (value: number, digits = 0) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

export function forecastTimeToEpoch(time: string, utcOffsetSeconds: number) {
  return Date.parse(`${time}:00Z`) - utcOffsetSeconds * 1000;
}

export function parseEnsembleResponse(
  payload: EnsembleApiResponse,
  location: ForecastLocation,
  model: ForecastModel,
  fetchedAt = new Date().toISOString(),
): EnsembleForecast {
  const hourly = payload.hourly;
  const times = hourly?.time;
  if (!hourly || !Array.isArray(times) || !times.length) {
    throw new Error(payload.reason || 'Risposta previsionale non valida');
  }

  const temperatureKeys = Object.keys(hourly)
    .filter((key) => key === 'temperature_2m' || /^temperature_2m_member\d+$/.test(key))
    .sort((a, b) => {
      if (a === 'temperature_2m') return -1;
      if (b === 'temperature_2m') return 1;
      return a.localeCompare(b, undefined, { numeric: true });
    });

  const members: EnsembleMember[] = temperatureKeys.map((temperatureKey) => {
    const suffix = temperatureKey.slice('temperature_2m'.length);
    const memberNumber = suffix.replace('_member', '');
    return {
      id: memberNumber || 'control',
      label: suffix ? `Scenario ${Number(memberNumber)}` : 'Controllo',
      temperature: (hourly[temperatureKey] || []) as NumericArray,
      precipitation: (hourly[`precipitation${suffix}`] || Array(times.length).fill(null)) as NumericArray,
      snowfall: (hourly[`snowfall${suffix}`] || Array(times.length).fill(null)) as NumericArray,
      weatherCode: (hourly[`weather_code${suffix}`] || Array(times.length).fill(null)) as NumericArray,
      cloudCover: (hourly[`cloud_cover${suffix}`] || Array(times.length).fill(null)) as NumericArray,
    };
  });

  if (!members.length) throw new Error('Nessuno scenario ensemble disponibile');

  let lastValidIndex = times.length - 1;
  while (
    lastValidIndex >= 0 &&
    members.every((member) => typeof member.temperature[lastValidIndex] !== 'number')
  ) {
    lastValidIndex -= 1;
  }
  if (lastValidIndex < 0) throw new Error('La previsione non contiene temperature valide');

  const trimmedTimes = (times as string[]).slice(0, lastValidIndex + 1);
  const trimmedMembers = members.map((member) => ({
    ...member,
    temperature: member.temperature.slice(0, lastValidIndex + 1),
    precipitation: member.precipitation.slice(0, lastValidIndex + 1),
    snowfall: member.snowfall.slice(0, lastValidIndex + 1),
    weatherCode: member.weatherCode.slice(0, lastValidIndex + 1),
    cloudCover: member.cloudCover.slice(0, lastValidIndex + 1),
  }));

  return {
    location,
    model,
    times: trimmedTimes,
    utcOffsetSeconds: payload.utc_offset_seconds || 0,
    elevation: payload.elevation || location.altitude,
    members: trimmedMembers,
    fetchedAt,
  };
}

export async function fetchEnsembleForecast(
  location: ForecastLocation,
  model: ForecastModel,
  signal?: AbortSignal,
): Promise<EnsembleForecast> {
  const params = new URLSearchParams({
    latitude: String(location.latitude),
    longitude: String(location.longitude),
    hourly: VARIABLES.join(','),
    models: model.id,
    forecast_days: '10',
    timezone: 'Europe/Rome',
  });
  const response = await fetch(`${API_URL}?${params}`, { signal });
  if (!response.ok) throw new Error(`Previsioni non disponibili (errore ${response.status})`);
  const payload = await response.json() as EnsembleApiResponse;
  return parseEnsembleResponse(payload, location, model);
}

function futureIndices(forecast: EnsembleForecast, now: Date, hours?: number) {
  const start = now.getTime() - 30 * 60 * 1000;
  const end = hours ? now.getTime() + hours * 60 * 60 * 1000 : Number.POSITIVE_INFINITY;
  return forecast.times
    .map((time, index) => ({ index, epoch: forecastTimeToEpoch(time, forecast.utcOffsetSeconds) }))
    .filter(({ epoch }) => epoch >= start && epoch < end)
    .map(({ index }) => index);
}

function meanTemperatureAt(forecast: EnsembleForecast, index: number) {
  return average(forecast.members.map((member) => member.temperature[index]));
}

function memberPrecipitationTotal(member: EnsembleMember, indices: number[]) {
  return indices.reduce((sum, index) => sum + Math.max(0, member.precipitation[index] || 0), 0);
}

function memberSnowfallTotal(member: EnsembleMember, indices: number[]) {
  return indices.reduce((sum, index) => sum + Math.max(0, member.snowfall[index] || 0), 0);
}

export function buildForecastStats(
  forecast: EnsembleForecast,
  now = new Date(),
  hours = 72,
): ForecastStats | null {
  const indices = futureIndices(forecast, now, hours);
  if (!indices.length) return null;

  const meanTemperatures = indices.map((index) => meanTemperatureAt(forecast, index));
  const firstWindow = meanTemperatures.slice(0, Math.min(24, meanTemperatures.length));
  const secondWindow = meanTemperatures.slice(-Math.min(24, meanTemperatures.length));
  const spreads = indices.map((index) => {
    const values = forecast.members.map((member) => member.temperature[index]);
    return percentile(values, 0.9) - percentile(values, 0.1);
  });
  const spread = average(spreads);
  const precipitationProbability = Math.round(
    forecast.members.filter((member) => memberPrecipitationTotal(member, indices) >= 1).length /
      forecast.members.length * 100,
  );
  const snowProbability = Math.round(
    forecast.members.filter((member) => memberSnowfallTotal(member, indices) >= 1).length /
      forecast.members.length * 100,
  );
  const snowAvailable = forecast.members.some((member) =>
    indices.some((index) => typeof member.snowfall[index] === 'number'),
  );
  const heavyPrecipitationProbability = Math.round(
    forecast.members.filter((member) =>
      indices.some((index) => (member.precipitation[index] || 0) >= 5),
    ).length / forecast.members.length * 100,
  );

  return {
    hours: indices.length,
    memberCount: forecast.members.length,
    tempMin: round(Math.min(...meanTemperatures), 1),
    tempMax: round(Math.max(...meanTemperatures), 1),
    tempTrend: round(average(secondWindow) - average(firstWindow), 1),
    spread: round(spread, 1),
    agreement: forecast.members.length === 1 ? 'non valutabile' : spread < 2 ? 'alto' : spread < 4 ? 'medio' : 'basso',
    precipitationProbability,
    snowProbability,
    snowAvailable,
    heavyPrecipitationProbability,
    meanPrecipitationTotal: round(average(forecast.members.map((member) =>
      memberPrecipitationTotal(member, indices),
    )), 1),
  };
}

export function buildForecastNarrative(stats: ForecastStats, modelName: string) {
  const trend = stats.tempTrend > 1 ? 'in rialzo' : stats.tempTrend < -1 ? 'in calo' : 'abbastanza stabili';
  if (stats.memberCount === 1) {
    const precipitation = stats.meanPrecipitationTotal >= 1
      ? `la traiettoria prevede ${stats.meanPrecipitationTotal} mm di precipitazioni`
      : 'la traiettoria prevalente è asciutta';
    const snow = !stats.snowAvailable
      ? '; il dato di neve non è disponibile da questa fonte'
      : stats.snowProbability === 100 ? ' con neve significativa' : ' senza neve significativa';
    const heavy = stats.heavyPrecipitationProbability === 100 ? ' Sono inoltre previsti rovesci intensi.' : '';
    return `${modelName}, prossime ${stats.hours} ore: temperature orarie tra ${stats.tempMin}°C e ${stats.tempMax}°C, ${trend}; ${precipitation}${snow}.${heavy} AROME è deterministico: offre una sola traiettoria e non una stima probabilistica dell’incertezza.`;
  }
  const precipitation = stats.precipitationProbability < 20
    ? 'prevale il tempo asciutto'
    : stats.precipitationProbability < 50
      ? 'sono possibili precipitazioni, ma gli scenari non sono concordi'
      : stats.precipitationProbability < 75
        ? 'le precipitazioni sono probabili'
        : 'le precipitazioni sono molto probabili';
  const snow = !stats.snowAvailable
    ? ' Il dato di neve non è disponibile da questa fonte.'
    : stats.snowProbability >= 30
      ? ` La neve compare nel ${stats.snowProbability}% degli scenari.`
      : stats.snowProbability >= 10
        ? ` Solo una minoranza degli scenari prevede neve (${stats.snowProbability}%).`
        : ' La neve appare poco probabile.';
  const heavy = stats.heavyPrecipitationProbability >= 30
    ? ` Rovesci intensi sono possibili nel ${stats.heavyPrecipitationProbability}% degli scenari.`
    : '';
  const agreement = stats.agreement === 'alto'
    ? 'Buon accordo'
    : stats.agreement === 'medio'
      ? 'Accordo discreto'
      : 'Scenari ancora molto diversi';

  return `${modelName}, prossime ${stats.hours} ore: temperature medie orarie tra ${stats.tempMin}°C e ${stats.tempMax}°C, ${trend}; ${precipitation} (${stats.precipitationProbability}% degli scenari).${snow}${heavy} ${agreement} tra i membri, con una dispersione media di ${stats.spread}°C.`;
}

function buildHourlyAt(forecast: EnsembleForecast, index: number): HourlyForecast {
  const temperature = meanTemperatureAt(forecast, index);
  const precipitationValues = forecast.members.map((member) => Math.max(0, member.precipitation[index] || 0));
  const snowfallValues = forecast.members.map((member) => Math.max(0, member.snowfall[index] || 0));
  const precipitation = average(precipitationValues);
  const snowfall = average(snowfallValues);
  const precipitationProbability = Math.round(
    precipitationValues.filter((value) => value >= 0.1).length / precipitationValues.length * 100,
  );
  const snowProbability = Math.round(
    snowfallValues.filter((value) => value >= 0.05).length / snowfallValues.length * 100,
  );
  const snowAvailable = forecast.members.some((member) => typeof member.snowfall[index] === 'number');
  const weatherCodes = finite(forecast.members.map((member) => member.weatherCode[index]));
  const cloudValues = finite(forecast.members.map((member) => member.cloudCover[index]));
  const cloudCover = average(cloudValues);
  const codeRatio = (codes: number[]) => weatherCodes.length
    ? weatherCodes.filter((code) => codes.includes(code)).length / weatherCodes.length
    : 0;

  let condition: HourlyForecast['condition'];
  if (codeRatio([95, 96, 99]) >= 0.2) {
    condition = 'storm';
  } else if (
    snowProbability >= 50 ||
    codeRatio([71, 73, 75, 77, 85, 86]) >= 0.5 ||
    (precipitation >= 0.1 && temperature <= 0 && (!snowAvailable || snowProbability >= 20))
  ) {
    condition = 'snow';
  } else if (
    precipitationProbability >= 50 ||
    codeRatio([51, 53, 55, 56, 57, 61, 63, 65, 66, 67, 80, 81, 82]) >= 0.5 ||
    (forecast.members.length === 1 && precipitation >= 0.1)
  ) {
    condition = 'rain';
  } else if (cloudCover >= 70 || codeRatio([3]) >= 0.5) {
    condition = 'cloudy';
  } else if (cloudCover >= 30 || codeRatio([2]) >= 0.5) {
    condition = 'partly-cloudy';
  } else {
    condition = 'dry';
  }

  return {
    time: forecast.times[index],
    temperature: round(temperature, 1),
    precipitation: round(precipitation, 2),
    precipitationProbability,
    snowfall: round(snowfall, 2),
    snowProbability,
    snowAvailable,
    condition,
  };
}

export function buildHourlyForecasts(forecast: EnsembleForecast, date: string): HourlyForecast[] {
  return forecast.times
    .map((time, index) => ({ time, index }))
    .filter(({ time }) => time.slice(0, 10) === date)
    .map(({ index }) => buildHourlyAt(forecast, index));
}

export function buildDailyForecasts(
  forecast: EnsembleForecast,
  now = new Date(),
  days = 7,
): DailyForecast[] {
  const indices = futureIndices(forecast, now);
  const groups = new Map<string, number[]>();
  indices.forEach((index) => {
    const date = forecast.times[index].slice(0, 10);
    groups.set(date, [...(groups.get(date) || []), index]);
  });

  return [...groups.entries()].slice(0, days).map(([date, dayIndices]) => {
    const meanTemperatures = dayIndices.map((index) => meanTemperatureAt(forecast, index));
    const precipitationProbability = Math.round(
      forecast.members.filter((member) => memberPrecipitationTotal(member, dayIndices) >= 1).length /
        forecast.members.length * 100,
    );
    const snowProbability = Math.round(
      forecast.members.filter((member) => memberSnowfallTotal(member, dayIndices) >= 1).length /
        forecast.members.length * 100,
    );
    const meanPrecipitationTotal = round(average(forecast.members.map((member) =>
      memberPrecipitationTotal(member, dayIndices),
    )), 1);
    const hourly = dayIndices.map((index) => buildHourlyAt(forecast, index));
    const cloudCover = average(dayIndices.flatMap((index) =>
      forecast.members.map((member) => member.cloudCover[index]),
    ));
    const condition: DailyForecast['condition'] = hourly.some((hour) => hour.condition === 'storm')
      ? 'storm'
      : snowProbability >= 30 || hourly.filter((hour) => hour.condition === 'snow').length >= 3
        ? 'snow'
        : precipitationProbability >= 50 || meanPrecipitationTotal >= 1 || hourly.some((hour) => hour.condition === 'rain')
          ? 'rain'
          : cloudCover >= 70
            ? 'cloudy'
            : cloudCover >= 30 ? 'partly-cloudy' : 'dry';

    return {
      date,
      tempMin: round(Math.min(...meanTemperatures), 1),
      tempMax: round(Math.max(...meanTemperatures), 1),
      precipitationProbability,
      snowProbability,
      meanPrecipitationTotal,
      condition,
    };
  });
}
