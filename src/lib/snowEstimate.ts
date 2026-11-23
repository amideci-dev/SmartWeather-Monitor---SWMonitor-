import { EnsembleForecast } from '@/types/forecast';
import { forecastTimeToEpoch } from './forecast';

export interface SnowEstimatePoint {
  time: string;
  mean: number;
  low: number;
  high: number;
  hourlyMean: number;
}

export interface SnowEstimate {
  points: SnowEstimatePoint[];
  totalMean: number;
  totalLow: number;
  totalHigh: number;
}

const average = (values: number[]) => values.length
  ? values.reduce((sum, value) => sum + value, 0) / values.length
  : 0;

const round = (value: number, digits = 1) => {
  const factor = 10 ** digits;
  return Math.round(value * factor) / factor;
};

function percentile(values: number[], fraction: number) {
  const sorted = [...values].sort((a, b) => a - b);
  if (!sorted.length) return 0;
  const position = (sorted.length - 1) * fraction;
  const lower = Math.floor(position);
  const upper = Math.ceil(position);
  return sorted[lower] + (sorted[upper] - sorted[lower]) * (position - lower);
}

/** Snow-to-liquid conversion: 1 mm of water becomes 0.6–1.5 cm of fresh snow. */
export function estimateFreshSnowCm(precipitationMm: number, temperatureC: number) {
  if (precipitationMm <= 0 || temperatureC >= 2) return 0;
  const snowFraction = temperatureC <= 0.5 ? 1 : (2 - temperatureC) / 1.5;
  const snowToLiquidRatio = temperatureC <= -10
    ? 1.5
    : temperatureC <= -5
      ? 1.2
      : temperatureC <= -2
        ? 1
        : temperatureC <= 0
          ? 0.8
          : 0.6;
  return precipitationMm * snowToLiquidRatio * snowFraction;
}

export function buildSnowEstimate(
  forecast: EnsembleForecast,
  now = new Date(),
  hours = 168,
): SnowEstimate | null {
  const start = now.getTime();
  const end = now.getTime() + hours * 60 * 60 * 1000;
  const indices = forecast.times
    .map((time, index) => ({ index, epoch: forecastTimeToEpoch(time, forecast.utcOffsetSeconds) }))
    .filter(({ epoch }) => epoch >= start && epoch < end)
    .map(({ index }) => index);
  if (!indices.length) return null;

  const cumulativeByMember = forecast.members.map((member) => {
    let cumulative = 0;
    return indices.map((index) => {
      cumulative += estimateFreshSnowCm(
        Math.max(0, member.precipitation[index] || 0),
        member.temperature[index] ?? 2,
      );
      return cumulative;
    });
  });

  const points = indices.map((_, position) => {
    const cumulative = cumulativeByMember.map((values) => values[position]);
    return {
      time: forecast.times[indices[position]],
      mean: round(average(cumulative)),
      low: round(percentile(cumulative, 0.1)),
      high: round(percentile(cumulative, 0.9)),
      hourlyMean: round(average(cumulativeByMember.map((values) => {
        const previous = position > 0 ? values[position - 1] : 0;
        return values[position] - previous;
      })), 2),
    };
  });

  const lastPoint = points[points.length - 1];
  return {
    points,
    totalMean: lastPoint.mean,
    totalLow: lastPoint.low,
    totalHigh: lastPoint.high,
  };
}

export function isSnowDepthFresh(lastUpdate: string, now = new Date(), maxHours = 6) {
  // Con ora ("21/11/2026 ore 15:00"): vale se ha al massimo maxHours ore.
  const withTime = lastUpdate.match(/(\d{2})\/(\d{2})\/(\d{4})\s+ore\s+(\d{1,2}):(\d{2})/);
  if (withTime) {
    const update = new Date(
      Number(withTime[3]),
      Number(withTime[2]) - 1,
      Number(withTime[1]),
      Number(withTime[4]),
      Number(withTime[5]),
    );
    const age = now.getTime() - update.getTime();
    return age >= 0 && age <= maxHours * 60 * 60 * 1000;
  }

  // Solo data ("23/11/2026"): i rilievi dei campi neve sono giornalieri, quindi vale se è la data di oggi.
  const dateOnly = lastUpdate.match(/^\s*(\d{2})\/(\d{2})\/(\d{4})\s*$/);
  if (dateOnly) {
    return (
      Number(dateOnly[3]) === now.getFullYear() &&
      Number(dateOnly[2]) === now.getMonth() + 1 &&
      Number(dateOnly[1]) === now.getDate()
    );
  }
  return false;
}
