import { MapPin, Mountain, Clock } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { WeatherStation } from '@/types/weather';

interface StationHeaderProps {
  station: WeatherStation;
}

export function StationHeader({ station }: StationHeaderProps) {
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

        <div className="ml-auto text-right">
          <p className="text-3xl font-bold font-mono">{station.weather.temperature.toFixed(1)}°C</p>
          <p className="text-xs text-muted-foreground">{station.weather.condition}</p>
        </div>
      </CardContent>
    </Card>
  );
}
