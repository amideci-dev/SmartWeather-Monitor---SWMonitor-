import { useState } from 'react';
import { Bell, Wind, Droplets, AlertTriangle } from 'lucide-react';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { ScrollArea } from '@/components/ui/scroll-area';
import { StationAlert } from '@/lib/windAlerts';

const severityStyles = {
  warning: {
    dot: 'bg-yellow-500',
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-700 dark:text-yellow-400',
    icon: 'text-yellow-500',
  },
  high: {
    dot: 'bg-orange-500',
    bg: 'bg-orange-500/10',
    text: 'text-orange-700 dark:text-orange-400',
    icon: 'text-orange-500',
  },
  critical: {
    dot: 'bg-red-500',
    bg: 'bg-red-500/10',
    text: 'text-red-700 dark:text-red-400',
    icon: 'text-red-500',
  },
};

interface AlertsBellProps {
  alerts: StationAlert[];
  onSelectStation?: (id: string) => void;
}

export function AlertsBell({ alerts, onSelectStation }: AlertsBellProps) {
  const [open, setOpen] = useState(false);
  const [seen, setSeen] = useState(false);

  const handleOpen = (isOpen: boolean) => {
    setOpen(isOpen);
    if (isOpen && alerts.length > 0) setSeen(true);
  };

  const hasCritical = alerts.some(a => {
    const sev = a.kind === 'wind' ? a.threshold.severity : a.severity;
    return sev === 'critical';
  });
  const hasHigh = alerts.some(a => {
    const sev = a.kind === 'wind' ? a.threshold.severity : a.severity;
    return sev === 'high';
  });

  const dotColor = hasCritical ? 'bg-red-500' : hasHigh ? 'bg-orange-500' : 'bg-yellow-500';

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button className="relative p-1.5 rounded-lg hover:bg-muted transition-colors">
          <Bell className="h-5 w-5 text-muted-foreground" />
          {alerts.length > 0 && (
            <>
              <span className={`absolute -top-0.5 -right-0.5 h-4 min-w-[16px] px-1 rounded-full ${dotColor} text-[10px] font-bold text-white flex items-center justify-center`}>
                {alerts.length}
              </span>
              <span className={`absolute -top-0.5 -right-0.5 h-4 min-w-[16px] rounded-full ${dotColor} animate-ping opacity-40`} />
            </>
          )}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-80 p-0 z-[100]" align="end">
        <div className="flex items-center justify-between px-4 py-3 border-b">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-accent" />
            <span className="text-sm font-bold">Alert Meteo</span>
            <span className="rounded-full bg-accent/10 px-1.5 py-0.5 text-[10px] font-semibold text-accent">
              {alerts.length}
            </span>
          </div>
        </div>

        {alerts.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">
            Nessun alert attivo
          </div>
        ) : (
          <ScrollArea className="max-h-80">
            <div className="divide-y">
              {alerts.map((alert) => {
                if (alert.kind === 'wind') {
                  const styles = severityStyles[alert.threshold.severity];
                  return (
                    <button
                      key={alert.id}
                      onClick={() => {
                        onSelectStation?.(alert.stationId);
                        setOpen(false);
                      }}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 rounded-full p-1.5 ${styles.bg}`}>
                          <Wind className={`h-3.5 w-3.5 ${styles.icon}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${styles.text}`}>
                              {alert.threshold.label}
                            </span>
                            <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                            {!alert.isRecent && (
                              <span className="text-[9px] bg-muted px-1 rounded text-muted-foreground">passato</span>
                            )}
                          </div>
                          <p className="text-xs text-foreground mt-0.5">
                            <span className="font-semibold">{alert.stationName}</span>
                            {' — '}
                            {alert.type === 'gust' ? 'Raffica' : 'Velocità'}{' '}
                            <span className="font-mono font-bold">{alert.speed} km/h</span>
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {alert.type === 'gust' ? `Raffica max ore ${alert.time}` : alert.time}
                          </p>
                        </div>
                      </div>
                    </button>
                  );
                } else {
                  const styles = severityStyles[alert.severity];
                  return (
                    <div
                      key={alert.id}
                      className="w-full text-left px-4 py-3 hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex items-start gap-3">
                        <div className={`mt-0.5 rounded-full p-1.5 ${styles.bg}`}>
                          <Droplets className={`h-3.5 w-3.5 ${styles.icon}`} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className={`text-xs font-bold ${styles.text}`}>
                              Livello in aumento
                            </span>
                            <span className={`h-1.5 w-1.5 rounded-full ${styles.dot}`} />
                          </div>
                          <p className="text-xs text-foreground mt-0.5">
                            <span className="font-semibold">{alert.hydrometerName}</span>
                            {' — '}
                            <span className="font-mono font-bold">+{alert.increasePercent}%</span>
                            {' rispetto alla media 2h'}
                          </p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">
                            {alert.river} — {alert.currentLevel} m (media {alert.averageLevel.toFixed(2)} m)
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                }
              })}
            </div>
          </ScrollArea>
        )}
      </PopoverContent>
    </Popover>
  );
}
