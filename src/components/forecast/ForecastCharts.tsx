import { useMemo } from 'react';
import {
  Area,
  Bar,
  CartesianGrid,
  ComposedChart,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EnsembleForecast } from '@/types/forecast';

const formatDay = (time: string) => `${time.slice(8, 10)}/${time.slice(5, 7)}`;
const formatHour = (time: string) => `${formatDay(time)} · ${time.slice(11, 16)}`;

function temperatureRange(members: EnsembleForecast['members'], index: number) {
  const values = members
    .map((member) => member.temperature[index])
    .filter((value): value is number => typeof value === 'number')
    .sort((a, b) => a - b);
  if (!values.length) return { mean: null, low: null, high: null };
  const mean = values.reduce((sum, value) => sum + value, 0) / values.length;
  return {
    mean: Math.round(mean * 10) / 10,
    low: values[Math.floor((values.length - 1) * 0.1)],
    high: values[Math.ceil((values.length - 1) * 0.9)],
  };
}

export function TemperatureSpaghettiChart({ forecast }: { forecast: EnsembleForecast }) {
  const data = useMemo(() => forecast.times.map((time, index) => {
    const range = temperatureRange(forecast.members, index);
    const row: Record<string, string | number | null> = { time, ...range };
    forecast.members.forEach((member) => {
      row[member.id] = member.temperature[index];
    });
    return row;
  }), [forecast]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{forecast.model.kind === 'ensemble' ? 'Spaghetti temperatura a 2 m' : 'Temperatura a 2 m'}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {forecast.model.kind === 'ensemble'
            ? 'Ogni linea sottile è uno scenario; quella arancione è la media dell’ensemble.'
            : 'Traiettoria deterministica della temperatura, senza scenari perturbati.'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full sm:h-[340px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={data} margin={{ top: 10, right: 12, left: -12, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-25" />
              <XAxis
                dataKey="time"
                tickFormatter={formatDay}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={23}
                minTickGap={24}
              />
              <YAxis
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                unit="°"
                width={48}
                domain={['auto', 'auto']}
              />
              <Tooltip
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload;
                  if (!active || !row) return null;
                  return (
                    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-lg">
                      <p className="mb-1 font-semibold">{formatHour(row.time)}</p>
                      <p className="font-mono">Media: {row.mean ?? '—'}°C</p>
                      {forecast.model.kind === 'ensemble' && (
                        <p className="mt-0.5 text-muted-foreground">
                          80% scenari: {row.low ?? '—'}° / {row.high ?? '—'}°C
                        </p>
                      )}
                    </div>
                  );
                }}
              />
              {forecast.model.kind === 'ensemble' && forecast.members.map((member) => (
                <Line
                  key={member.id}
                  type="linear"
                  dataKey={member.id}
                  stroke="hsl(var(--primary))"
                  strokeOpacity={member.id === 'control' ? 0.55 : 0.14}
                  strokeWidth={member.id === 'control' ? 1.4 : 0.8}
                  dot={false}
                  isAnimationActive={false}
                />
              ))}
              <Line
                type="linear"
                dataKey="mean"
                stroke="hsl(var(--accent))"
                strokeWidth={2.5}
                dot={false}
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
        {forecast.model.kind === 'ensemble' && (
          <div className="mt-2 flex flex-wrap justify-center gap-x-5 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-primary/40" />Scenari ensemble</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-accent" />Media</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export function PrecipitationForecastChart({ forecast }: { forecast: EnsembleForecast }) {
  const data = useMemo(() => forecast.times.map((time, index) => {
    const precipitation = forecast.members.map((member) => Math.max(0, member.precipitation[index] || 0));
    const snowfall = forecast.members.map((member) => Math.max(0, member.snowfall[index] || 0));
    return {
      time,
      precipitation: Math.round((precipitation.reduce((sum, value) => sum + value, 0) / precipitation.length) * 100) / 100,
      probability: Math.round(precipitation.filter((value) => value >= 0.1).length / precipitation.length * 100),
      snowProbability: Math.round(snowfall.filter((value) => value >= 0.05).length / snowfall.length * 100),
    };
  }), [forecast]);

  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-base">{forecast.model.kind === 'ensemble' ? 'Precipitazioni e probabilità oraria' : 'Precipitazioni previste'}</CardTitle>
        <p className="text-xs text-muted-foreground">
          {forecast.model.kind === 'ensemble'
            ? 'Barre: intensità media. Linee: quota di scenari con pioggia o neve.'
            : 'Barre: precipitazione prevista dalla singola traiettoria AROME.'}
        </p>
      </CardHeader>
      <CardContent>
        <div className="h-[280px] w-full sm:h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <ComposedChart data={data} margin={{ top: 10, right: 0, left: 0, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" className="opacity-25" />
              <XAxis
                dataKey="time"
                tickFormatter={formatDay}
                tick={{ fontSize: 11 }}
                tickLine={false}
                axisLine={false}
                interval={23}
                minTickGap={24}
              />
              <YAxis yAxisId="rain" tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit=" mm" width={62} tickFormatter={(value: number) => Number(value.toFixed(2)).toString()} />
              <YAxis yAxisId="probability" orientation="right" domain={[0, 100]} tick={{ fontSize: 11 }} tickLine={false} axisLine={false} unit="%" width={42} />
              <Tooltip
                content={({ active, payload }) => {
                  const row = payload?.[0]?.payload;
                  if (!active || !row) return null;
                  return (
                    <div className="rounded-lg border bg-card px-3 py-2 text-xs shadow-lg">
                      <p className="mb-1 font-semibold">{formatHour(row.time)}</p>
                      <p className="font-mono">Precipitazione media: {row.precipitation} mm/h</p>
                      {forecast.model.kind === 'ensemble' && (
                        <>
                          <p className="mt-0.5 text-info">Precipitazione: {row.probability}% scenari</p>
                          <p className="text-muted-foreground">Neve: {row.snowProbability}% scenari</p>
                        </>
                      )}
                    </div>
                  );
                }}
              />
              <Bar yAxisId="rain" dataKey="precipitation" fill="hsl(var(--info))" fillOpacity={0.7} maxBarSize={6} isAnimationActive={false} />
              {forecast.model.kind === 'ensemble' && (
                <>
                  <Area yAxisId="probability" type="monotone" dataKey="probability" stroke="hsl(var(--accent))" fill="hsl(var(--accent))" fillOpacity={0.08} strokeWidth={1.8} dot={false} isAnimationActive={false} />
                  <Line yAxisId="probability" type="monotone" dataKey="snowProbability" stroke="hsl(var(--primary))" strokeDasharray="4 3" strokeWidth={1.3} dot={false} isAnimationActive={false} />
                </>
              )}
            </ComposedChart>
          </ResponsiveContainer>
        </div>
        {forecast.model.kind === 'ensemble' && (
          <div className="mt-2 flex flex-wrap justify-center gap-x-4 gap-y-1 text-[11px] text-muted-foreground">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-sm bg-info" />Intensità media</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-accent" />Probabilità precipitazioni</span>
            <span className="flex items-center gap-1.5"><span className="h-0.5 w-5 bg-primary" />Probabilità neve</span>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
