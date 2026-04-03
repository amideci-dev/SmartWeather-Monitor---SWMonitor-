import { MapPin, Mountain, Clock, CheckCircle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { WeatherStation } from '@/types/weather';

interface StationHeaderProps {
  station: WeatherStation;
}

/** Check if lastUpdate is within the last N minutes */
function isRecentUpdate(lastUpdate: string, minutes: number): boolean {
  // Parse "DD/MM/YYYY ore HH:MM"
  const match = lastUpdate.match(/(\d{2})\/(\d{2})\/(\d{4})\s+ore\s+(\d{1,2}):(\d{2})/);
  if (!match) return false;
  const d = new Date(
    parseInt(match[3]),
    parseInt(match[2]) - 1,
    parseInt(match[1]),
    parseInt(match[4]),
    parseInt(match[5])
  );
  return (Date.now() - d.getTime()) < minutes * 60000;
}

export function StationHeader({ station }: StationHeaderProps) {
  const isRecent = isRecentUpdate(station.lastUpdate, 30);

  return (
    <Card className="border-l-4 border-l-accent">
      <CardContent className="flex flex-wrap items-center gap-x-6 gap-y-2 p-4">
        <div className="flex items-center gap-2">
          <span className="text-3xl">{station.weather.conditionIcon}</span>
          <div>
            <h2 className="text-lg font-bold leading-tight">{station.name}</h2>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <MapPin className="h-3 w-3" />
              {station.location}
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1">
          <Mountain className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm font-mono font-semibold">{station.altitude} m</span>
        </div>

        <div className="flex items-center gap-1 rounded-md bg-muted px-2.5 py-1">
          <Clock className="h-3.5 w-3.5 text-muted-foreground" />
          <span className="text-sm">{station.lastUpdate}</span>
        </div>

        {isRecent && (
          <div className="flex items-center gap-1 rounded-full bg-green-500/15 px-2.5 py-1">
            <CheckCircle className="h-3.5 w-3.5 text-green-600 dark:text-green-400" />
            <span className="text-xs font-medium text-green-700 dark:text-green-400">Aggiornato</span>
          </div>
        )}

        <div className="ml-auto text-right">
          <p className="text-3xl font-bold font-mono">{station.weather.temperature.toFixed(1)}°C</p>
          <p className="text-xs text-muted-foreground">{station.weather.condition}</p>
        </div>
      </CardContent>
    </Card>
  );
}
