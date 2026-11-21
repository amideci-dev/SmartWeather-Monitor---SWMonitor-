import { describe, expect, it } from 'vitest';
import { forecastLocations, forecastModels } from '@/data/forecastLocations';
import { parseEnsembleResponse } from '@/lib/forecast';
import { buildSnowEstimate, estimateFreshSnowCm, isSnowDepthFresh } from '@/lib/snowEstimate';

describe('snow accumulation estimate', () => {
  it('converts precipitation using temperature and excludes rain above 2°C', () => {
    expect(estimateFreshSnowCm(10, -10)).toBe(15);
    expect(estimateFreshSnowCm(10, -4)).toBe(10);
    expect(estimateFreshSnowCm(10, 1)).toBeCloseTo(4);
    expect(estimateFreshSnowCm(10, 2)).toBe(0);
    expect(estimateFreshSnowCm(0, -10)).toBe(0);
  });

  it('builds cumulative mean and uncertainty from the model members', () => {
    const times = Array.from({ length: 4 }, (_, hour) => `2026-11-21T0${hour}:00`);
    const forecast = parseEnsembleResponse({
      utc_offset_seconds: 0,
      hourly: {
        time: times,
        temperature_2m: [-5, -5, -5, 2],
        temperature_2m_member01: [2, 2, 2, 2],
        precipitation: [1, 1, 1, 0],
        precipitation_member01: [1, 1, 1, 0],
        snowfall: [null, null, null, null],
        snowfall_member01: [null, null, null, null],
      },
    }, forecastLocations[0], forecastModels[0]);
    const estimate = buildSnowEstimate(forecast, new Date('2026-11-21T00:00:00Z'))!;
    expect(estimate.points).toHaveLength(4);
    expect(estimate.totalMean).toBe(1.8);
    expect(estimate.totalLow).toBe(0.4);
    expect(estimate.totalHigh).toBe(3.2);
  });

  it('uses the nivometer baseline only for recent readings', () => {
    const now = new Date(2026, 10, 21, 18, 0);
    expect(isSnowDepthFresh('21/11/2026 ore 15:00', now)).toBe(true);
    expect(isSnowDepthFresh('21/11/2026 ore 11:59', now)).toBe(false);
    expect(isSnowDepthFresh('30/03/2026 ore 22:30', now)).toBe(false);
  });
});
