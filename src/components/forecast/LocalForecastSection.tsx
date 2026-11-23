import { useMemo } from 'react';
import { CartesianGrid, ComposedChart, Line, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar } from 'recharts';
import { ExternalLink, Mountain, Snowflake, Wind } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LocalForecast } from '@/types/localForecast';
import { dayLabel, fmtNum, nowRomeNaive, skyInfo } from '@/lib/localForecast';

interface Props {
  forecast?: LocalForecast;
  locationName: string;
  loading?: boolean;
}

const formatTick = (t: string) => `${t.slice(8, 10)}/${t.slice(5, 7)} ${t.slice(11, 13)}h`;

export function LocalForecastSection({ forecast, locationName, loading = false }: Props) {
  const hourly = useMemo(() => forecast?.hourly ?? [], [forecast]);
  const daily = forecast?.daily ?? [];
  const nextHours = useMemo(() => {
    const now = nowRomeNaive();
    // la fascia di 3 ore in corso inizia fino a 3 ore prima di adesso
    const from = hourly.findIndex((h) => h.t > now) - 1;
    return hourly.slice(Math.max(from, 0), Math.max(from, 0) + 8);
  }, [hourly]);

  const unavailable = !forecast || forecast.unreachable || (!hourly.length && !daily.length);

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-start gap-3">
        <div>
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="text-lg font-bold">Previsione ufficiale locale</h3>
            <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
              Dato aperto PAT
            </span>
          </div>
          <p className="mt-1 text-sm text-muted-foreground">
            {locationName}{forecast?.elevation ? ` · ${forecast.elevation} m` : ''} · zero termico, quota neve e neve fresca
          </p>
        </div>
      </div>

      {unavailable && (
        <Card>
          <CardContent className="p-6 text-center text-sm text-muted-foreground">
            {loading ? 'Caricamento previsione locale…' : 'Previsione locale momentaneamente non disponibile.'}
          </CardContent>
        </Card>
      )}

      {!unavailable && (
        <>
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3 xl:grid-cols-6">
            {daily.map((d) => {
              const sky = skyInfo(d.sky);
              const Icon = sky.icon;
              const label = dayLabel(d.date);
              return (
                <Card key={d.date}>
                  <CardContent className="space-y-1.5 p-3">
                    <p className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground">
                      {label.weekday} {label.day}
                    </p>
                    <div className="flex items-center gap-2">
                      <Icon className="h-6 w-6 shrink-0 text-primary" aria-label={sky.label} />
                      <p className="text-[11px] leading-tight text-muted-foreground">{sky.label}</p>
                    </div>
                    <p className="font-mono text-lg font-bold">
                      {fmtNum(d.tMin)}° / {fmtNum(d.tMax)}°
                    </p>
                    <dl className="space-y-0.5 text-[11px] text-muted-foreground">
                      <div className="flex justify-between"><dt>Precipitazioni</dt><dd className="font-mono">{fmtNum(d.rain, 1)} mm</dd></div>
                      <div className="flex justify-between"><dt>Probabilità</dt><dd className="font-mono">{fmtNum(d.rainProb)}%</dd></div>
                      <div className="flex justify-between"><dt>Neve fresca</dt><dd className="font-mono">{fmtNum(d.freshSnow)} cm</dd></div>
                      <div className="flex justify-between"><dt>Zero termico</dt><dd className="font-mono">{fmtNum(d.freezingLevel)} m</dd></div>
                      <div className="flex justify-between"><dt>Raffiche</dt><dd className="font-mono">{fmtNum(d.windGust)} km/h</dd></div>
                    </dl>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {hourly.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Mountain className="h-4 w-4 text-primary" />
                  Zero termico e quota neve
                </CardTitle>
                <p className="text-xs text-muted-foreground">
                  Fasce di 3 ore. La quota neve compare solo quando sono previste precipitazioni; le barre sono la neve fresca (cm).
                </p>
              </CardHeader>
              <CardContent>
                <div className="h-[280px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <ComposedChart data={hourly} margin={{ top: 10, right: 8, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" className="opacity-25" />
                      <XAxis dataKey="t" tickFormatter={formatTick} minTickGap={36} tick={{ fontSize: 10 }} />
                      <YAxis yAxisId="m" tick={{ fontSize: 10 }} unit=" m" width={56} />
                      <YAxis yAxisId="cm" orientation="right" tick={{ fontSize: 10 }} unit=" cm" width={48} />
                      <Tooltip
                        labelFormatter={(t: string) => formatTick(t)}
                        formatter={(value: number | null, name: string) => [value === null ? '—' : value, name]}
                      />
                      <Bar yAxisId="cm" dataKey="freshSnow" name="Neve fresca (cm)" fill="hsl(var(--primary))" fillOpacity={0.35} />
                      <Line yAxisId="m" dataKey="freezingLevel" name="Zero termico (m)" stroke="hsl(var(--accent))" strokeWidth={2} dot={false} />
                      <Line yAxisId="m" dataKey="snowLevel" name="Quota neve (m)" stroke="hsl(var(--primary))" strokeWidth={2} dot={{ r: 2 }} connectNulls={false} />
                    </ComposedChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          )}

          {nextHours.length > 0 && (
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Wind className="h-4 w-4 text-primary" />
                  Prossime ore
                </CardTitle>
              </CardHeader>
              <CardContent className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-xs">
                  <thead>
                    <tr className="text-left text-[11px] uppercase tracking-wide text-muted-foreground">
                      <th className="py-1 pr-2 font-semibold">Ora</th>
                      <th className="px-2 font-semibold">Cielo</th>
                      <th className="px-2 font-semibold">Temp.</th>
                      <th className="px-2 font-semibold">Pioggia</th>
                      <th className="px-2 font-semibold"><Snowflake className="inline h-3 w-3" /> Neve</th>
                      <th className="px-2 font-semibold">Zero term.</th>
                      <th className="px-2 font-semibold">Vento</th>
                    </tr>
                  </thead>
                  <tbody>
                    {nextHours.map((h) => {
                      const sky = skyInfo(h.sky);
                      const Icon = sky.icon;
                      return (
                        <tr key={h.t} className="border-t">
                          <td className="py-1.5 pr-2 font-mono">{h.t.slice(8, 10)}/{h.t.slice(5, 7)} {h.t.slice(11, 16)}</td>
                          <td className="px-2"><Icon className="inline h-4 w-4 text-primary" aria-label={sky.label} /> <span className="hidden sm:inline">{sky.label}</span></td>
                          <td className="px-2 font-mono">{fmtNum(h.temp)}°</td>
                          <td className="px-2 font-mono">{fmtNum(h.rain, 1)} mm ({fmtNum(h.rainProb)}%)</td>
                          <td className="px-2 font-mono">{fmtNum(h.freshSnow)} cm{h.snowLevel !== null ? ` · ${fmtNum(h.snowLevel)} m` : ''}</td>
                          <td className="px-2 font-mono">{fmtNum(h.freezingLevel)} m</td>
                          <td className="px-2 font-mono">{fmtNum(h.windSpeed)} <span className="text-muted-foreground">({fmtNum(h.windGust)})</span> km/h</td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </CardContent>
            </Card>
          )}

          <p className="text-[11px] text-muted-foreground">
            Fonte: <a href="https://meteo.report" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">meteo.report <ExternalLink className="h-3 w-3" /></a>
            {' '}(Meteotrentino · open data Provincia autonoma di Trento). Orari locali.
          </p>
        </>
      )}
    </section>
  );
}
