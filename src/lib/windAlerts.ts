import { WeatherStation } from '@/types/weather';

export interface WindAlertThreshold {
  label: string;
  minSpeed: number;
  maxSpeed: number;
  severity: 'warning' | 'high' | 'critical';
}

export const WIND_THRESHOLDS: WindAlertThreshold[] = [
  { label: 'Vento forte', minSpeed: 50, maxSpeed: 61, severity: 'warning' },
  { label: 'Burrasca moderata', minSpeed: 62, maxSpeed: 74, severity: 'warning' },
  { label: 'Burrasca forte', minSpeed: 75, maxSpeed: 87, severity: 'high' },
  { label: 'Tempesta', minSpeed: 88, maxSpeed: 101, severity: 'high' },
  { label: 'Tempesta violenta', minSpeed: 102, maxSpeed: 117, severity: 'critical' },
  { label: 'Uragano', minSpeed: 118, maxSpeed: Infinity, severity: 'critical' },
];

export interface WindAlert {
  id: string;
  stationId: string;
  stationName: string;
  type: 'current' | 'gust';
  speed: number;
  time: string;
  threshold: WindAlertThreshold;
}

function getThreshold(speed: number): WindAlertThreshold | null {
  return WIND_THRESHOLDS.find(t => speed >= t.minSpeed && speed <= t.maxSpeed) ?? null;
}

export function generateWindAlerts(stations: WeatherStation[]): WindAlert[] {
  const alerts: WindAlert[] = [];

  for (const station of stations) {
    const { wind } = station;

    // Check current wind speed
    const currentThreshold = getThreshold(wind.speed);
    if (currentThreshold) {
      alerts.push({
        id: `${station.id}-current`,
        stationId: station.id,
        stationName: station.name,
        type: 'current',
        speed: wind.speed,
        time: station.lastUpdate,
        threshold: currentThreshold,
      });
    }

    // Check today's max gust
    const gustThreshold = getThreshold(wind.gusts.today);
    if (gustThreshold) {
      alerts.push({
        id: `${station.id}-gust`,
        stationId: station.id,
        stationName: station.name,
        type: 'gust',
        speed: wind.gusts.today,
        time: wind.gusts.todayTime ?? '',
        threshold: gustThreshold,
      });
    }
  }

  // Sort by severity (critical first) then speed
  const severityOrder = { critical: 0, high: 1, warning: 2 };
  alerts.sort((a, b) => {
    const diff = severityOrder[a.threshold.severity] - severityOrder[b.threshold.severity];
    return diff !== 0 ? diff : b.speed - a.speed;
  });

  return alerts;
}
