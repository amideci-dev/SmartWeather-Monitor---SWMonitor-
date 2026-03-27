import { Thermometer, Droplets, Gauge, CloudRain, ArrowDown, ArrowUp, Minus } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { WeatherData } from '@/types/weather';

const TrendIcon = ({ trend }: { trend: 'rising' | 'falling' | 'stable' }) => {
  if (trend === 'rising') return <ArrowUp className="h-3.5 w-3.5 text-destructive" />;
  if (trend === 'falling') return <ArrowDown className="h-3.5 w-3.5 text-info" />;
  return <Minus className="h-3.5 w-3.5 text-muted-foreground" />;
};

interface WeatherCardProps {
  data: WeatherData;
}

export function WeatherCard({ data }: WeatherCardProps) {
  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Thermometer className="h-4 w-4 text-accent" />
          Meteo
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        {/* Main readings */}
        <div className="grid grid-cols-3 gap-4">
          {/* Temperature */}
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">Temperatura</p>
            <p className="text-2xl font-bold font-mono tracking-tight">{data.temperature.toFixed(1)}°</p>
            <div className="flex items-center justify-center gap-1 mt-1">
              <TrendIcon trend={data.temperatureTrend} />
              <span className="text-xs text-muted-foreground">{data.temperatureTrendValue}°/h</span>
            </div>
          </div>

          {/* Humidity */}
          <div className="rounded-lg bg-muted/50 p-3 text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">Umidità</p>
            <div className="flex items-center justify-center gap-1">
              <Droplets className="h-4 w-4 text-info" />
              <p className="text-2xl font-bold font-mono">{data.humidity}%</p>
            </div>
            <div className="flex items-center justify-center gap-1 mt-1">
              <TrendIcon trend={data.humidityTrend} />
              <span className="text-xs text-muted-foreground">{data.humidityTrendValue}%/h</span>
            </div>
          </div>

          {/* Pressure */}
          {data.pressure !== null && (
            <div className="rounded-lg bg-muted/50 p-3 text-center">
              <p className="text-xs font-medium text-muted-foreground mb-1">Pressione</p>
              <div className="flex items-center justify-center gap-1">
                <Gauge className="h-4 w-4 text-primary" />
                <p className="text-lg font-bold font-mono">{data.pressure.toFixed(1)}</p>
              </div>
              <div className="flex items-center justify-center gap-1 mt-1">
                <TrendIcon trend={data.pressureTrend} />
                <span className="text-xs text-muted-foreground">{data.pressureTrendValue} hPa/h</span>
              </div>
            </div>
          )}
        </div>

        {/* Secondary readings */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-muted-foreground">Punto di rugiada</span>
            <span className="font-mono font-medium">{data.dewPoint}°C</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Temp. percepita</span>
            <span className="font-mono font-medium">{data.perceivedTemp}°C</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Bulbo umido</span>
            <span className="font-mono font-medium">{data.wetBulb}°C</span>
          </div>
          <div className="flex justify-between">
            <span className="text-muted-foreground">Intensità pioggia</span>
            <span className="font-mono font-medium">{data.rainIntensity} mm/h</span>
          </div>
        </div>

        {/* Daily Extremes */}
        <div className="border-t pt-4">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3">
            Estremi Odierni
          </p>
          <div className="grid grid-cols-2 gap-x-6 gap-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Min</span>
              <span className="font-mono font-medium text-info">{data.dailyExtremes.tempMin}°C <span className="text-muted-foreground text-xs">({data.dailyExtremes.tempMinTime})</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Max</span>
              <span className="font-mono font-medium text-destructive">{data.dailyExtremes.tempMax}°C <span className="text-muted-foreground text-xs">({data.dailyExtremes.tempMaxTime})</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Raffica max</span>
              <span className="font-mono font-medium">{data.dailyExtremes.maxGust} km/h <span className="text-muted-foreground text-xs">({data.dailyExtremes.maxGustTime})</span></span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Pioggia</span>
              <span className="font-mono font-medium">{data.dailyExtremes.dailyRain} mm</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
