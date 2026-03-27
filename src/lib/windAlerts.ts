import { WeatherStation, Hydrometer } from '@/types/weather';

export type AlertSeverity = 'warning' | 'high' | 'critical';

// ─── Wind Alerts ───

export interface WindAlertThreshold {
  label: string;
  minSpeed: number;
  maxSpeed: number;
  severity: AlertSeverity;
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
  kind: 'wind';
  stationId: string;
  stationName: string;
  type: 'current' | 'gust';
  speed: number;
  time: string;
  threshold: WindAlertThreshold;
  isRecent: boolean; // true if event happened within last 30 min
}

// ─── Hydrometer Alerts ───

export interface HydroAlert {
  id: string;
  kind: 'hydro';
  hydrometerId: string;
  hydrometerName: string;
  river: string;
  currentLevel: number;
  averageLevel: number;
  increasePercent: number;
  time: string;
  severity: AlertSeverity;
}

export type StationAlert = WindAlert | HydroAlert;

// ─── Helpers ───

function getWindThreshold(speed: number): WindAlertThreshold | null {
  return WIND_THRESHOLDS.find(t => speed >= t.minSpeed && speed <= t.maxSpeed) ?? null;
}

/**
 * Parse a time string like "17:24" or "01:00" and check if it's within
 * the last `minutes` minutes relative to `now`. Also handles lastUpdate
 * format "27/03/2026 ore 17:24".
 */
function isWithinMinutes(timeStr: string, minutes: number, referenceUpdate: string): boolean {
  if (!timeStr || timeStr === '—' || timeStr === '00:00') return false;

  // Extract HH:MM
  const match = timeStr.match(/(\d{1,2}):(\d{2})/);
  if (!match) return false;
  const eventH = parseInt(match[1], 10);
  const eventM = parseInt(match[2], 10);

  // Extract reference date/time from lastUpdate "27/03/2026 ore 17:24"
  const refMatch = referenceUpdate.match(/(\d{2})\/(\d{2})\/(\d{4})\s+ore\s+(\d{1,2}):(\d{2})/);
  if (!refMatch) return false;
  const refH = parseInt(refMatch[4], 10);
  const refM = parseInt(refMatch[5], 10);

  const refTotalMin = refH * 60 + refM;
  const eventTotalMin = eventH * 60 + eventM;
  const diff = refTotalMin - eventTotalMin;

  return diff >= 0 && diff <= minutes;
}

export function generateWindAlerts(stations: WeatherStation[]): WindAlert[] {
  const alerts: WindAlert[] = [];

  for (const station of stations) {
    const { wind } = station;

    // Current wind speed
    const currentThreshold = getWindThreshold(wind.speed);
    if (currentThreshold) {
      alerts.push({
        id: `${station.id}-current`,
        kind: 'wind',
        stationId: station.id,
        stationName: station.name,
        type: 'current',
        speed: wind.speed,
        time: station.lastUpdate,
        threshold: currentThreshold,
        isRecent: true, // current readings are always recent
      });
    }

    // Today's max gust
    const gustThreshold = getWindThreshold(wind.gusts.today);
    if (gustThreshold) {
      const isRecent = isWithinMinutes(wind.gusts.todayTime, 30, station.lastUpdate);
      alerts.push({
        id: `${station.id}-gust`,
        kind: 'wind',
        stationId: station.id,
        stationName: station.name,
        type: 'gust',
        speed: wind.gusts.today,
        time: wind.gusts.todayTime ?? '',
        threshold: gustThreshold,
        isRecent,
      });
    }
  }

  const severityOrder = { critical: 0, high: 1, warning: 2 };
  alerts.sort((a, b) => {
    const diff = severityOrder[a.threshold.severity] - severityOrder[b.threshold.severity];
    return diff !== 0 ? diff : b.speed - a.speed;
  });

  return alerts;
}

// ─── Hydrometer Alert Generation ───

function getHydroSeverity(increasePercent: number): AlertSeverity {
  if (increasePercent >= 100) return 'critical';
  if (increasePercent >= 60) return 'high';
  return 'warning';
}

export function generateHydroAlerts(hydrometers: Hydrometer[]): HydroAlert[] {
  const alerts: HydroAlert[] = [];

  for (const hydro of hydrometers) {
    const { history } = hydro;
    if (history.length < 5) continue;

    // Last 30 min readings (assuming 15-min intervals → ~2 readings)
    const recent30 = history.slice(-2);
    // Previous 2 hours before those (~8 readings at 15-min intervals)
    const olderEnd = history.length - 2;
    const olderStart = Math.max(0, olderEnd - 8);
    const older2h = history.slice(olderStart, olderEnd);

    if (older2h.length === 0) continue;

    const avg2h = older2h.reduce((sum, r) => sum + r.level, 0) / older2h.length;
    if (avg2h <= 0) continue;

    // Check if any recent reading exceeds avg by 30%
    const maxRecent = Math.max(...recent30.map(r => r.level));
    const increasePercent = ((maxRecent - avg2h) / avg2h) * 100;

    if (increasePercent >= 30) {
      alerts.push({
        id: `hydro-${hydro.id}`,
        kind: 'hydro',
        hydrometerId: hydro.id,
        hydrometerName: hydro.name,
        river: hydro.river,
        currentLevel: maxRecent,
        averageLevel: avg2h,
        increasePercent: Math.round(increasePercent),
        time: hydro.lastUpdate,
        severity: getHydroSeverity(increasePercent),
      });
    }
  }

  const severityOrder = { critical: 0, high: 1, warning: 2 };
  alerts.sort((a, b) => severityOrder[a.severity] - severityOrder[b.severity]);

  return alerts;
}
