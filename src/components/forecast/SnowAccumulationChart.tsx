import { useMemo } from 'react';
import { AlertTriangle, ExternalLink, Mountain, Snowflake } from 'lucide-react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildSnowEstimate, isSnowDepthFresh } from '@/lib/snowEstimate';
import { EnsembleForecast } from '@/types/forecast';
import { SnowStation } from '@/types/weather';

const formatDay = (time: string) => `${time.slice(8, 10)}/${time.slice(5, 7)}`;
const formatHour = (time: string) => `${formatDay(time)} · ${time.slice(11, 16)}`;

export function SnowAccumulationChart({ forecast, snowStation }: { forecast: EnsembleForecast; snowStation?: SnowStation }) {
  const estimate = useMemo(() => buildSnowEstimate(forecast), [forecast]);
  if (!estimate) return null;

  const depthFresh = snowStation ? isSnowDepthFresh(snowStation.lastUpdate) : false;
  const currentDepth = snowStation?.currentDepth;
  const theoreticalDepth = depthFresh && typeof currentDepth === 'number'
    ? Math.round((currentDepth + estimate.totalMean) * 10) / 10
    : null;
  const chartData = estimate.points.map((point) => ({ ...point, range: [point.low, point.high] }));

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-wrap items-center gap-2">
          <Snowflake className="h-5 w-5 text-primary" />
          <CardTitle className="text-base">Stima accumulo di neve fresca</CardTitle>
          <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">Stima indicativa</span>
        </div>
        <p className="text-xs text-muted-foreground">
          {forecast.location.name} · {forecast.model.shortName} · conversione da precipitazioni e temperature orarie
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        {!depthFresh && snowStation && (
          <div className="flex gap-2 rounded-lg border border-warning/40 bg-warning/10 p-3 text-xs">
            <AlertTriangle className="h-4 w-4 shrink-0 text-warning" />
            <p>
              Nivometro non aggiornato (ultimo dato: {snowStation.lastUpdate}). La neve fresca è comunque stimata dai modelli, ma il manto complessivo non viene calcolato.
            </p>
          </div>
        )}

        <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-[11px] text-muted-foreground">Nivometro {snowStation?.campoNeveCode || ''}</p>
            <p className="mt-1 font-mono text-xl font-bold">{typeof currentDepth === 'number' ? `${currentDepth} cm` : '—'}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{depthFresh ? 'Dato aggiornato' : 'Ultimo dato non recente'}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-[11px] text-muted-foreground">Neve fresca stimata</p>
            <p className="mt-1 font-mono text-xl font-bold text-primary">+{estimate.totalMean} cm</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{forecast.model.kind === 'ensemble' ? 'Media dei dati disponibili' : 'Singola traiettoria'}</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-[11px] text-muted-foreground">{forecast.model.kind === 'ensemble' ? '80% degli scenari' : 'Traiettoria AROME'}</p>
            <p className="mt-1 font-mono text-xl font-bold">{forecast.model.kind === 'ensemble' ? `${estimate.totalLow}–${estimate.totalHigh} cm` : `${estimate.totalMean} cm`}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">Variabilità della stima</p>
          </div>
          <div className="rounded-lg bg-muted/50 p-3">
            <p className="text-[11px] text-muted-foreground">Manto teorico finale</p>
            <p className="mt-1 font-mono text-xl font-bold">{theoreticalDepth === null ? '—' : `${theoreticalDepth} cm`}</p>
            <p className="mt-1 text-[10px] text-muted-foreground">{depthFresh ? 'Senza compattazione o fusione' : 'Richiede nivometro aggiornato'}</p>
          </div>
        </div>

        <div className="h-[300px] w-full sm:h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={chartData} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-25" />
              <XAxis dataKey="time" tickFormatter={formatDay} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} interval={23} minTickGap={24} />
              <YAxis yAxisId="cumulative" domain={[0, 'auto']} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit=" cm" width={58} />
              <YAxis yAxisId="hourly" orientation="right" domain={[0, 'auto']} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit=" cm/h" width={62} />
              <Tooltip
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload;
                  if (!active || !row) return null;
                  return (
                    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-lg">
                      <p className="mb-1 font-semibold">{formatHour(row.time)}</p>
                      <p className="font-mono">Accumulo medio: {row.mean} cm</p>
                      {forecast.model.kind === 'ensemble' && <p className="text-muted-foreground">80% scenari: {row.low}–{row.high} cm</p>}
                      <p className="mt-0.5 text-info">Ultima ora: +{row.hourlyMean} cm</p>
                    </div>
                  );
                }}
              />
              {forecast.model.kind === 'ensemble' && (
                <Area yAxisId="cumulative" type="monotone" dataKey="range" stroke="none" fill="hsl(var(--primary))" fillOpacity={0.13} isAnimationActive={false} />
              )}
              <Bar yAxisId="hourly" dataKey="hourlyMean" fill="hsl(var(--info))" fillOpacity={0.35} maxBarSize={5} isAnimationActive={false} />
              <Line yAxisId="cumulative" type="monotone" dataKey="mean" stroke="hsl(var(--accent))" strokeWidth={2.5} dot={false} isAnimationActive={false} />
            </ComposedChart>
          </ResponsiveContainer>
        </div>

        <div className="flex flex-wrap justify-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
          <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-accent" />Accumulo medio</span>
          {forecast.model.kind === 'ensemble' && <span className="flex items-center gap-1.5"><span className="h-3 w-4 bg-primary/15" />Fascia 80% scenari</span>}
          <span className="flex items-center gap-1.5"><span className="h-2 w-2 bg-info/40" />Neve fresca oraria</span>
        </div>

        <div className="flex flex-col gap-2 border-t pt-3 text-[11px] leading-relaxed text-muted-foreground sm:flex-row">
          <p>
            Conversione indicativa: 1 mm di precipitazione = 0,6–1,5 cm di neve secondo la temperatura; sopra 2°C viene considerata pioggia. Non include compattazione, fusione, vento o differenze di quota.
          </p>
          {snowStation && (
            <a href={snowStation.urls.nivometro} target="_blank" rel="noopener noreferrer" className="inline-flex shrink-0 items-center gap-1 font-medium text-primary hover:underline">
              <Mountain className="h-3 w-3" /> Fonte nivometro <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
