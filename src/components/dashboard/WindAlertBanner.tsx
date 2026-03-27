import { useState } from 'react';
import { Wind, Droplets, X } from 'lucide-react';
import { StationAlert } from '@/lib/windAlerts';

interface AlertBannerProps {
  alerts: StationAlert[];
}

const severityBg = {
  warning: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-600',
};

export function AlertBanner({ alerts }: AlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  // Filter: only show recent wind alerts + all hydro alerts in the banner
  const bannerAlerts = alerts.filter(a => {
    if (a.kind === 'wind') return a.isRecent;
    return true; // hydro alerts always shown
  });

  if (dismissed || bannerAlerts.length === 0) return null;

  const topAlert = bannerAlerts[0];
  const severity = topAlert.kind === 'wind' ? topAlert.threshold.severity : topAlert.severity;
  const bg = severityBg[severity];

  return (
    <div className={`${bg} text-white px-4 py-2 flex items-center gap-3 text-sm`}>
      {topAlert.kind === 'wind' ? (
        <Wind className="h-4 w-4 shrink-0 animate-pulse" />
      ) : (
        <Droplets className="h-4 w-4 shrink-0 animate-pulse" />
      )}
      <div className="flex-1 min-w-0">
        {topAlert.kind === 'wind' ? (
          <>
            <span className="font-bold">{topAlert.threshold.label}</span>
            {' — '}
            <span>{topAlert.stationName}:</span>{' '}
            <span className="font-mono font-bold">{topAlert.speed} km/h</span>
            {topAlert.type === 'gust' && (
              <span className="opacity-80"> (raffica ore {topAlert.time})</span>
            )}
          </>
        ) : (
          <>
            <span className="font-bold">Livello idrometrico in aumento</span>
            {' — '}
            <span>{topAlert.hydrometerName}:</span>{' '}
            <span className="font-mono font-bold">+{topAlert.increasePercent}%</span>
            <span className="opacity-80"> rispetto alla media 2h</span>
          </>
        )}
        {bannerAlerts.length > 1 && (
          <span className="ml-2 opacity-80">
            +{bannerAlerts.length - 1} {bannerAlerts.length - 1 === 1 ? 'altro alert' : 'altri alert'}
          </span>
        )}
      </div>
      <button
        onClick={() => setDismissed(true)}
        className="p-1 rounded hover:bg-white/20 transition-colors shrink-0"
      >
        <X className="h-3.5 w-3.5" />
      </button>
    </div>
  );
}
