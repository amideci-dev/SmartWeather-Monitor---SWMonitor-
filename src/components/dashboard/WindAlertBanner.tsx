import { useState } from 'react';
import { Wind, X } from 'lucide-react';
import { WindAlert } from '@/lib/windAlerts';

interface WindAlertBannerProps {
  alerts: WindAlert[];
}

const severityBg = {
  warning: 'bg-yellow-500',
  high: 'bg-orange-500',
  critical: 'bg-red-600',
};

export function WindAlertBanner({ alerts }: WindAlertBannerProps) {
  const [dismissed, setDismissed] = useState(false);

  if (dismissed || alerts.length === 0) return null;

  // Show the most critical alert in the banner
  const topAlert = alerts[0];
  const bg = severityBg[topAlert.threshold.severity];

  return (
    <div className={`${bg} text-white px-4 py-2 flex items-center gap-3 text-sm`}>
      <Wind className="h-4 w-4 shrink-0 animate-pulse" />
      <div className="flex-1 min-w-0">
        <span className="font-bold">{topAlert.threshold.label}</span>
        {' — '}
        <span>{topAlert.stationName}:</span>
        {' '}
        <span className="font-mono font-bold">{topAlert.speed} km/h</span>
        {topAlert.type === 'gust' && (
          <span className="opacity-80"> (raffica ore {topAlert.time})</span>
        )}
        {alerts.length > 1 && (
          <span className="ml-2 opacity-80">
            +{alerts.length - 1} {alerts.length - 1 === 1 ? 'altro alert' : 'altri alert'}
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
