import { useState } from 'react';
import { Thermometer, Wind, Droplets, Gauge, Mountain, ArrowRight, Sun, X, AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { mockStations } from '@/data/mockStations';

// Show wind if station has a wind URL, is WunderGround, or has hasWindSensor flag
const hasWind = (station: { urls: { wind?: string }; source: string; hasWindSensor?: boolean }): boolean =>
  !!station.urls.wind || station.source === 'wunderground' || !!station.hasWindSensor;

interface StationsSummaryProps {
  onSelectStation: (id: string) => void;
}

export function StationsSummary({ onSelectStation }: StationsSummaryProps) {
  const [dismissedWarnings, setDismissedWarnings] = useState<Set<string>>(new Set());

  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      {mockStations.map((s) => {
        const trendArrow =
          s.weather.temperatureTrend === 'rising'
            ? '↑'
            : s.weather.temperatureTrend === 'falling'
              ? '↓'
              : '→';

        const stationHasWind = hasWind(s);

        return (
          <Card
            key={s.id}
            className="cursor-pointer transition-all hover:shadow-md hover:border-primary/50 active:scale-[0.98] relative overflow-hidden"
            onClick={() => onSelectStation(s.id)}
          >
            {/* Unreachable overlay */}
            {s.unreachable && !dismissedWarnings.has(s.id) && (
              <div className="absolute inset-0 z-10 bg-background/80 backdrop-blur-[2px] flex flex-col items-center justify-center gap-1 p-4">
                <button
                  className="absolute top-2 right-2 p-1 rounded-md hover:bg-muted transition-colors"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDismissedWarnings((prev) => new Set(prev).add(s.id));
                  }}
                >
                  <X className="h-3.5 w-3.5 text-muted-foreground" />
                </button>
                <AlertTriangle className="h-5 w-5 text-warning" />
                <p className="text-sm font-semibold text-foreground text-center">
                  Problemi nel raggiungere la stazione
                </p>
                <p className="text-[11px] text-muted-foreground text-center">
                  I dati potrebbero non essere aggiornati
                </p>
              </div>
            )}

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
                    {s.source === 'wunderground' && (
                      <span className="ml-1 rounded bg-info/20 px-1 text-[10px] text-info">WU</span>
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

                {stationHasWind ? (
                  <>
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
                  </>
                ) : (
                  <>
                    {s.weather.solarRadiation != null ? (
                      <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1.5 col-span-2">
                        <Sun className="h-3 w-3 text-warning" />
                        <span className="font-mono font-medium">{s.weather.solarRadiation}</span>
                        <span className="text-muted-foreground">W/m²</span>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 rounded-md bg-muted px-2 py-1.5 col-span-2">
                        <Gauge className="h-3 w-3 text-muted-foreground" />
                        <span className="font-mono font-medium">
                          {s.weather.dailyExtremes.dailyRain.toFixed(1)}
                        </span>
                        <span className="text-muted-foreground">mm pioggia</span>
                      </div>
                    )}
                  </>
                )}
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

              {/* Detail button */}
              <Button
                variant="outline"
                size="sm"
                className="w-full text-xs"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelectStation(s.id);
                }}
              >
                Vedi dettaglio dati
                <ArrowRight className="ml-1 h-3 w-3" />
              </Button>
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
