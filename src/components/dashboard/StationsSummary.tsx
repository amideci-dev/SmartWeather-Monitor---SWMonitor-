import { Thermometer, Wind, Droplets, Gauge, Mountain, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { mockStations } from '@/data/mockStations';

interface StationsSummaryProps {
  onSelectStation: (id: string) => void;
}

export function StationsSummary({ onSelectStation }: StationsSummaryProps) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {mockStations.map((s) => {
        const trendArrow =
          s.weather.temperatureTrend === 'rising'
            ? '↑'
            : s.weather.temperatureTrend === 'falling'
              ? '↓'
              : '→';

        return (
          <Card
            key={s.id}
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 active:scale-[0.98]"
            onClick={() => onSelectStation(s.id)}
          >
            <CardContent className="p-4 space-y-3">
              {/* Station name + altitude */}
              <div className="flex items-start justify-between gap-2">
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5">
                    <span className="text-lg">{s.weather.conditionIcon}</span>
                    <h3 className="font-bold text-sm truncate">{s.name}</h3>
                  </div>
                  <div className="flex items-center gap-1 text-[11px] text-muted-foreground mt-0.5">
                    <Mountain className="h-3 w-3" />
                    <span>{s.altitude} m</span>
                    {s.source === 'xml' && (
                      <span className="ml-1 rounded bg-warning/20 px-1 text-[10px] text-warning">XML</span>
                    )}
                  </div>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-2xl font-bold font-mono leading-none">
                    {s.weather.temperature.toFixed(1)}°
                  </p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">
                    {trendArrow} {s.weather.temperatureTrendValue}°/h
                  </p>
                </div>
              </div>

              {/* Key metrics row */}
              <div className="grid grid-cols-3 gap-2 text-xs">
                <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1.5">
                  <Droplets className="h-3 w-3 text-info" />
                  <span className="font-mono font-medium">{s.weather.humidity}%</span>
                </div>
                <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1.5">
                  <Wind className="h-3 w-3 text-primary" />
                  <span className="font-mono font-medium">{s.wind.speed}</span>
                  <span className="text-muted-foreground">km/h</span>
                </div>
                <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1.5">
                  <span className="text-muted-foreground text-[10px]">{s.wind.direction}</span>
                  <span className="font-mono font-medium text-[11px]">
                    {s.weather.dailyExtremes.maxGust}
                  </span>
                  <span className="text-muted-foreground text-[10px]">raff</span>
                </div>
              </div>

              {/* Daily extremes compact */}
              <div className="flex items-center justify-between text-[11px] text-muted-foreground border-t pt-2">
                <span>
                  Min <span className="font-mono font-medium text-info">{s.weather.dailyExtremes.tempMin}°</span>
                </span>
                <span>
                  Max <span className="font-mono font-medium text-destructive">{s.weather.dailyExtremes.tempMax}°</span>
                </span>
                <span>
                  Pioggia <span className="font-mono font-medium">{s.weather.dailyExtremes.dailyRain} mm</span>
                </span>
              </div>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
