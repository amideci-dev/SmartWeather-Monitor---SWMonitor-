import { Wind, Navigation, Gauge } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WindData } from '@/types/weather';

interface WindCardProps {
  data: WindData;
}

export function WindCard({ data }: WindCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Wind className="h-4 w-4 text-accent" />
          Vento
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Wind compass + current */}
        <div className="flex items-center gap-6">
          <div className="relative flex h-24 w-24 shrink-0 items-center justify-center rounded-full border-2 border-primary/20 bg-muted/50">
            <Navigation
              className="h-8 w-8 text-primary"
              style={{ transform: `rotate(${data.directionDegrees}deg)` }}
            />
            <span className="absolute -bottom-5 text-xs font-bold text-primary">{data.direction}</span>
          </div>
          <div className="flex-1 space-y-2">
            <div>
              <p className="text-xs text-muted-foreground">Velocità attuale</p>
              <p className="text-3xl font-bold font-mono">{data.speed} <span className="text-sm font-normal text-muted-foreground">km/h</span></p>
            </div>
            <div className="flex gap-4">
              <div>
                <p className="text-xs text-muted-foreground">Beaufort</p>
                <p className="font-mono font-semibold">{data.beaufort} bft</p>
              </div>
              <div className="flex-1">
                <p className="text-xs text-muted-foreground">Stato</p>
                <p className="text-sm font-medium italic">{data.beaufortDescription}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Wind chill */}
        {(data.windChill !== null || data.feelsLike !== null) && (
          <div className="grid grid-cols-2 gap-4">
            {data.windChill !== null && (
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Wind Chill</p>
                <p className="text-xl font-bold font-mono">{data.windChill}°C</p>
              </div>
            )}
            {data.feelsLike !== null && (
              <div className="rounded-lg bg-muted/50 p-3 text-center">
                <p className="text-xs text-muted-foreground mb-1">Percepita</p>
                <p className="text-xl font-bold font-mono">{data.feelsLike}°C</p>
              </div>
            )}
          </div>
        )}

        {/* Averages */}
        <div className="border-t pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Medie Vento
          </p>
          <div className="grid grid-cols-4 gap-2">
            {[
              { label: '10 min', value: data.averages.min10 },
              { label: '15 min', value: data.averages.min15 },
              { label: '30 min', value: data.averages.min30 },
              { label: '60 min', value: data.averages.min60 },
            ].map((avg) => (
              <div key={avg.label} className="rounded-md bg-muted/50 p-2 text-center">
                <p className="text-[10px] text-muted-foreground">{avg.label}</p>
                <p className="font-mono font-bold text-sm">{avg.value}</p>
                <p className="text-[10px] text-muted-foreground">km/h</p>
              </div>
            ))}
          </div>
        </div>

        {/* Gusts */}
        <div className="border-t pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Raffiche
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Ultima ora</span>
              <span className="font-mono font-medium">{data.gusts.lastHour} km/h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Oggi</span>
              <span className="font-mono font-medium">{data.gusts.today} km/h <span className="text-muted-foreground text-xs">({data.gusts.todayTime})</span></span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
