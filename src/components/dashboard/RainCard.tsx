import { CloudRain, Droplets, AlertTriangle, ExternalLink } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeatherData } from '@/types/weather';

interface RainCardProps {
  data: WeatherData;
  rainUrl?: string;
  hasWinterDisclaimer?: boolean;
}

export function RainCard({ data, rainUrl, hasWinterDisclaimer }: RainCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <CloudRain className="h-4 w-4 text-info" />
          Pluviometro
          {rainUrl && (
            <a
              href={rainUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="ml-auto text-muted-foreground hover:text-primary transition-colors"
            >
              <ExternalLink className="h-3.5 w-3.5" />
            </a>
          )}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main readings */}
        <div className="grid grid-cols-3 gap-4">
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">Pioggia oggi</p>
            <div className="flex items-center justify-center gap-1">
              <Droplets className="h-4 w-4 text-info" />
              <p className="text-2xl font-bold font-mono tracking-tight">
                {data.dailyExtremes.dailyRain.toFixed(1)}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">mm</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">Intensità attuale</p>
            <p className="text-2xl font-bold font-mono tracking-tight">
              {data.rainIntensity.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">mm/h</p>
          </div>

          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">Max intensità</p>
            <p className="text-2xl font-bold font-mono tracking-tight">
              {data.dailyExtremes.maxRainIntensity.toFixed(1)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">mm/h</p>
          </div>
        </div>

        {/* Winter disclaimer */}
        {hasWinterDisclaimer && (
          <div className="flex gap-2 rounded-lg border border-warning/30 bg-warning/5 p-3">
            <AlertTriangle className="h-4 w-4 text-warning shrink-0 mt-0.5" />
            <p className="text-xs text-muted-foreground leading-relaxed">
              I dati di questo pluviometro nei mesi invernali sono da considerarsi non validi,
              in quanto la misura riporta solo la neve sciolta accumulatasi dentro all'imbuto pluviometrico.
            </p>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
