import { Waves, TrendingUp, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Hydrometer } from '@/types/weather';
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from '@/components/ui/chart';
import { Area, AreaChart, XAxis, YAxis, CartesianGrid } from 'recharts';

interface HydrometerCardProps {
  data: Hydrometer;
}

const chartConfig = {
  level: { label: 'Livello (m)', color: 'hsl(var(--info))' },
  flow: { label: 'Portata (m³/s)', color: 'hsl(var(--accent))' },
};

export function HydrometerCard({ data }: HydrometerCardProps) {
  const hasFlow = data.currentFlow !== null;

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Waves className="h-5 w-5 text-info" />
            <CardTitle className="text-base">{data.name}</CardTitle>
          </div>
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Clock className="h-3 w-3" />
            {data.lastUpdate}
          </div>
        </div>
        <p className="text-xs text-muted-foreground">{data.river}</p>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current values */}
        <div className={`grid gap-4 ${hasFlow ? 'grid-cols-2' : 'grid-cols-1'}`}>
          <div className="rounded-lg bg-info/10 p-3 text-center">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Livello idrometrico
            </p>
            <p className="font-mono text-2xl font-bold text-info">
              {data.currentLevel.toFixed(2)}
            </p>
            <p className="text-xs text-muted-foreground">{data.levelUnit}</p>
          </div>
          {hasFlow && (
            <div className="rounded-lg bg-accent/10 p-3 text-center">
              <p className="text-xs font-medium text-muted-foreground mb-1">
                Portata
              </p>
              <p className="font-mono text-2xl font-bold text-accent">
                {data.currentFlow!.toFixed(2)}
              </p>
              <p className="text-xs text-muted-foreground">{data.flowUnit}</p>
            </div>
          )}
        </div>

        {/* Chart */}
        <div>
          <div className="flex items-center gap-1.5 mb-2">
            <TrendingUp className="h-3.5 w-3.5 text-muted-foreground" />
            <span className="text-xs font-medium text-muted-foreground">
              Andamento ultime ore
            </span>
          </div>
          <ChartContainer config={chartConfig} className="h-[140px] w-full">
            <AreaChart data={data.history}>
              <CartesianGrid strokeDasharray="3 3" className="stroke-border" />
              <XAxis
                dataKey="time"
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                className="fill-muted-foreground"
                width={35}
              />
              <ChartTooltip content={<ChartTooltipContent />} />
              <Area
                type="monotone"
                dataKey="level"
                stroke="hsl(var(--info))"
                fill="hsl(var(--info))"
                fillOpacity={0.15}
                strokeWidth={2}
              />
              {hasFlow && (
                <Area
                  type="monotone"
                  dataKey="flow"
                  stroke="hsl(var(--accent))"
                  fill="hsl(var(--accent))"
                  fillOpacity={0.1}
                  strokeWidth={2}
                />
              )}
            </AreaChart>
          </ChartContainer>
        </div>
      </CardContent>
    </Card>
  );
}
