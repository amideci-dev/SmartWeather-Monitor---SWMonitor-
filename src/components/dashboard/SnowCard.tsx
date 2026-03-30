import { Snowflake, Mountain, ExternalLink, TrendingDown, TrendingUp } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { SnowStation } from '@/types/weather';
import {
  ResponsiveContainer,
  ComposedChart,
  Area,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
} from 'recharts';

interface SnowCardProps {
  data: SnowStation;
}

export function SnowCard({ data }: SnowCardProps) {
  const chartData = data.history.map((r) => ({
    date: r.date.slice(5), // MM-DD
    'Neve al suolo': r.hs,
    'Neve fresca': r.hn != null && r.hn > 0 ? r.hn : null,
  }));

  // Compute trend from last 3 readings
  const recent = data.history.filter((r) => r.hs != null).slice(-3);
  const trend =
    recent.length >= 2
      ? recent[recent.length - 1].hs! - recent[0].hs! > 0
        ? 'rising'
        : recent[recent.length - 1].hs! - recent[0].hs! < 0
          ? 'falling'
          : 'stable'
      : 'stable';

  // Latest campo neve reading
  const latestField = data.history[data.history.length - 1];

  return (
    <Card className="overflow-hidden">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Snowflake className="h-4 w-4 text-info" />
          {data.name}
          <span className="text-xs text-muted-foreground font-normal">
            {data.altitude} m
          </span>
          <a
            href={data.urls.campoNeve}
            target="_blank"
            rel="noopener noreferrer"
            className="ml-auto text-muted-foreground hover:text-primary transition-colors"
          >
            <ExternalLink className="h-3.5 w-3.5" />
          </a>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Automatic nivometer - primary reading */}
        <div className="flex items-center gap-4">
          <div className="rounded-xl bg-info/10 p-4 text-center min-w-[100px]">
            <p className="text-xs font-medium text-muted-foreground mb-1">
              Nivometro automatico
            </p>
            <div className="flex items-center justify-center gap-1.5">
              <Mountain className="h-5 w-5 text-info" />
              <p className="text-3xl font-black font-mono tracking-tighter text-info">
                {data.currentDepth}
              </p>
            </div>
            <p className="text-xs text-muted-foreground mt-1">cm</p>
          </div>

          <div className="flex-1 space-y-1.5">
            <div className="flex items-center gap-1.5 text-sm">
              {trend === 'falling' ? (
                <TrendingDown className="h-4 w-4 text-warning" />
              ) : trend === 'rising' ? (
                <TrendingUp className="h-4 w-4 text-success" />
              ) : null}
              <span className="text-muted-foreground">
                {trend === 'falling'
                  ? 'Manto in diminuzione'
                  : trend === 'rising'
                    ? 'Manto in aumento'
                    : 'Manto stabile'}
              </span>
            </div>
            {latestField && (
              <>
                <p className="text-xs text-muted-foreground">
                  Campo neve: <span className="font-medium text-foreground">{latestField.hs ?? '—'} cm</span>
                  {latestField.hn != null && latestField.hn > 0 && (
                    <span className="ml-2 text-info">+{latestField.hn} cm neve fresca</span>
                  )}
                </p>
                <p className="text-[10px] text-muted-foreground">
                  Ultimo rilievo manuale: {latestField.date}
                </p>
              </>
            )}
          </div>
        </div>

        {/* 30-day chart */}
        <div className="rounded-lg bg-muted/30 p-3">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Andamento ultimi 30 giorni (rilevazioni campo neve)
          </p>
          <ResponsiveContainer width="100%" height={180}>
            <ComposedChart data={chartData} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
              <XAxis
                dataKey="date"
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                interval="preserveStartEnd"
              />
              <YAxis
                tick={{ fontSize: 10 }}
                tickLine={false}
                axisLine={false}
                unit=" cm"
              />
              <Tooltip
                contentStyle={{
                  backgroundColor: 'hsl(var(--card))',
                  border: '1px solid hsl(var(--border))',
                  borderRadius: '8px',
                  fontSize: '12px',
                }}
                formatter={(value: number, name: string) => [`${value} cm`, name]}
                labelFormatter={(label) => `Data: ${label}`}
              />
              <Legend
                iconSize={10}
                wrapperStyle={{ fontSize: '11px' }}
              />
              <Area
                type="monotone"
                dataKey="Neve al suolo"
                stroke="hsl(var(--info))"
                fill="hsl(var(--info))"
                fillOpacity={0.15}
                strokeWidth={2}
                dot={false}
                connectNulls
              />
              <Bar
                dataKey="Neve fresca"
                fill="hsl(var(--accent))"
                fillOpacity={0.7}
                radius={[2, 2, 0, 0]}
                barSize={8}
              />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        {/* Additional details */}
        <div className="grid grid-cols-3 gap-3">
          <div className="rounded-lg bg-muted/50 p-2.5 text-center">
            <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Max stagionale</p>
            <p className="text-lg font-bold font-mono">
              {Math.max(...data.history.filter((r) => r.hs != null).map((r) => r.hs!))}
            </p>
            <p className="text-[10px] text-muted-foreground">cm</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2.5 text-center">
            <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Neve fresca max</p>
            <p className="text-lg font-bold font-mono">
              {Math.max(0, ...data.history.filter((r) => r.hn != null).map((r) => r.hn!))}
            </p>
            <p className="text-[10px] text-muted-foreground">cm</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-2.5 text-center">
            <p className="text-[10px] font-medium text-muted-foreground mb-0.5">Ubicazione</p>
            <p className="text-xs font-medium leading-tight">{data.location}</p>
          </div>
        </div>

        <p className="text-[10px] text-muted-foreground text-right">
          Aggiornamento: {data.lastUpdate}
        </p>
      </CardContent>
    </Card>
  );
}
