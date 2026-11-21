import { describe, expect, it } from 'vitest';
import { forecastLocations, forecastModels } from '@/data/forecastLocations';
import {
  buildDailyForecasts,
  buildForecastNarrative,
  buildForecastStats,
  parseEnsembleResponse,
} from '@/lib/forecast';

const location = forecastLocations[0];
const model = forecastModels[0];
const times = Array.from({ length: 96 }, (_, index) => {
  const date = new Date(Date.UTC(2026, 10, 21, 0 + index));
  return date.toISOString().slice(0, 16);
});

function makeForecast() {
  return parseEnsembleResponse({
    elevation: 1450,
    utc_offset_seconds: 0,
    hourly: {
      time: times,
      temperature_2m: times.map((_, index) => index < 48 ? 0 : 3),
      temperature_2m_member01: times.map((_, index) => index < 48 ? 2 : 5),
      precipitation: times.map(() => 0),
      precipitation_member01: times.map((_, index) => index === 12 ? 6 : 0),
      snowfall: times.map(() => 0),
      snowfall_member01: times.map((_, index) => index === 12 ? 2 : 0),
    },
  }, location, model, '2026-11-21T12:00:00Z');
}

describe('ensemble forecasts', () => {
  it('reads both the control run and perturbed members', () => {
    const forecast = makeForecast();
    expect(forecast.members.map((member) => member.id)).toEqual(['control', '01']);
    expect(forecast.members[1].label).toBe('Scenario 1');
    expect(forecast.members[1].precipitation[12]).toBe(6);
  });

  it('calculates 72-hour precipitation, snow and temperature probabilities', () => {
    const stats = buildForecastStats(makeForecast(), new Date('2026-11-21T00:00:00Z'))!;
    expect(stats.precipitationProbability).toBe(50);
    expect(stats.snowProbability).toBe(50);
    expect(stats.heavyPrecipitationProbability).toBe(50);
    expect(stats.tempMin).toBe(1);
    expect(stats.tempMax).toBe(4);
    expect(stats.tempTrend).toBe(3);
  });

  it('writes a location-model narrative from the calculated values', () => {
    const stats = buildForecastStats(makeForecast(), new Date('2026-11-21T00:00:00Z'))!;
    const narrative = buildForecastNarrative(stats, model.name);
    expect(narrative).toContain('ECMWF IFS Ensemble');
    expect(narrative).toContain('50% degli scenari');
    expect(narrative).toContain('in rialzo');
  });

  it('limits the daily outlook to seven days', () => {
    const daily = buildDailyForecasts(makeForecast(), new Date('2026-11-21T00:00:00Z'));
    expect(daily).toHaveLength(4);
    expect(daily[1].precipitationProbability).toBe(0);
  });

  it('removes unavailable trailing hours instead of treating them as zero', () => {
    const payload = {
      hourly: {
        time: times.slice(0, 4),
        temperature_2m: [1, 2, null, null],
        precipitation: [0, 0, null, null],
        snowfall: [0, 0, null, null],
      },
    };
    const forecast = parseEnsembleResponse(payload, location, model);
    expect(forecast.times).toHaveLength(2);
    expect(forecast.members[0].temperature).toEqual([1, 2]);
  });

  it('describes AROME as deterministic rather than assigning ensemble agreement', () => {
    const forecast = parseEnsembleResponse({
      hourly: {
        time: times,
        temperature_2m: times.map(() => 1),
        precipitation: times.map(() => 0),
        snowfall: times.map(() => null),
      },
    }, location, forecastModels[3]);
    const stats = buildForecastStats(forecast, new Date('2026-11-21T00:00:00Z'))!;
    expect(stats.agreement).toBe('non valutabile');
    expect(stats.snowAvailable).toBe(false);
    expect(buildForecastNarrative(stats, forecast.model.name)).toContain('dato di neve non è disponibile');
    expect(buildForecastNarrative(stats, forecast.model.name)).toContain('non una stima probabilistica');
  });
});
