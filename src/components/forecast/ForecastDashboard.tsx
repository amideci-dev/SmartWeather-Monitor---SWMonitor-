import { useMemo, useState } from 'react';
import {
  AlertTriangle,
  BarChart3,
  CloudRain,
  CloudSun,
  ExternalLink,
  FileText,
  Loader2,
  MapPin,
  RefreshCw,
  Snowflake,
  Thermometer,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { forecastLocations, forecastModels } from '@/data/forecastLocations';
import { useEnsembleForecast } from '@/hooks/useEnsembleForecast';
import { buildDailyForecasts, buildForecastNarrative, buildForecastStats } from '@/lib/forecast';
import { ForecastLocationId, ForecastModelId } from '@/types/forecast';
import { PrecipitationForecastChart, TemperatureSpaghettiChart } from './ForecastCharts';

const formatDay = (date: string) => {
  const formatted = new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export function ForecastDashboard() {
  const [locationId, setLocationId] = useState<ForecastLocationId>('san-martino');
  const [modelId, setModelId] = useState<ForecastModelId>('ecmwf_ifs025');
  const location = forecastLocations.find((item) => item.id === locationId)!;
  const model = forecastModels.find((item) => item.id === modelId)!;
  const { data, isLoading, isError, error, refetch, isFetching } = useEnsembleForecast(location, model);
  const stats = useMemo(() => data ? buildForecastStats(data) : null, [data]);
  const daily = useMemo(() => data ? buildDailyForecasts(data) : [], [data]);

  return (
    <div className="mx-auto max-w-7xl space-y-6 px-4 py-6">
      <section>
        <div className="flex items-center gap-2">
          <CloudSun className="h-6 w-6 text-primary" />
          <div>
            <h2 className="text-xl font-extrabold tracking-tight">Previsioni ensemble</h2>
            <p className="text-xs text-muted-foreground">Scenari, fenomeni e temperature per le due aree operative</p>
          </div>
        </div>
      </section>

      <Card>
        <CardContent className="grid gap-5 p-4 lg:grid-cols-2">
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Località</p>
            <Tabs value={locationId} onValueChange={(value) => setLocationId(value as ForecastLocationId)}>
              <TabsList className="grid h-auto w-full grid-cols-2">
                {forecastLocations.map((item) => (
                  <TabsTrigger key={item.id} value={item.id} className="gap-1.5 px-2 py-2">
                    <MapPin className="h-3.5 w-3.5" />
                    <span className="truncate">{item.shortName}</span>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
          <div>
            <p className="mb-2 text-[11px] font-bold uppercase tracking-wider text-muted-foreground">Modello</p>
            <Tabs value={modelId} onValueChange={(value) => setModelId(value as ForecastModelId)}>
              <TabsList className="grid h-auto w-full grid-cols-4">
                {forecastModels.map((item) => (
                  <TabsTrigger key={item.id} value={item.id} className="px-1.5 py-2 text-xs sm:px-3 sm:text-sm">
                    {item.shortName}
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>
        </CardContent>
      </Card>

      {isLoading && (
        <Card className="flex min-h-[360px] items-center justify-center">
          <div className="flex flex-col items-center gap-3 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
            <p className="text-sm font-medium">Caricamento scenari {model.shortName}…</p>
            <p className="text-xs">{location.name}</p>
          </div>
        </Card>
      )}

      {isError && !isLoading && (
        <Card className="border-destructive/40">
          <CardContent className="flex flex-col items-center gap-3 p-8 text-center">
            <AlertTriangle className="h-8 w-8 text-destructive" />
            <div>
              <p className="font-semibold">Previsioni momentaneamente non disponibili</p>
              <p className="mt-1 text-sm text-muted-foreground">{error instanceof Error ? error.message : 'Errore durante il caricamento'}</p>
            </div>
            <Button variant="outline" onClick={() => refetch()}><RefreshCw className="mr-2 h-4 w-4" />Riprova</Button>
          </CardContent>
        </Card>
      )}

      {data && stats && !isLoading && !isError && (
        <>
          <section className="space-y-4">
            <div className="flex flex-wrap items-start gap-3">
              <div>
                <div className="flex flex-wrap items-center gap-2">
                  <h3 className="text-lg font-bold">{data.model.name}</h3>
                  <span className="rounded-full bg-primary/10 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-primary">
                    {data.model.kind === 'ensemble' ? `${data.members.length} scenari` : 'Deterministico'}
                  </span>
                </div>
                <p className="mt-1 text-sm text-muted-foreground">{location.name} · {location.altitude} m · quota griglia {Math.round(data.elevation)} m</p>
                <p className="mt-1 max-w-3xl text-xs text-muted-foreground">{data.model.description}</p>
              </div>
              <Button variant="outline" size="sm" className="ml-auto" onClick={() => refetch()} disabled={isFetching}>
                <RefreshCw className={`mr-2 h-3.5 w-3.5 ${isFetching ? 'animate-spin' : ''}`} />
                Aggiorna
              </Button>
            </div>

            <Card className="border-l-4 border-l-accent bg-accent/5">
              <CardContent className="flex gap-3 p-4">
                <FileText className="mt-0.5 h-5 w-5 shrink-0 text-accent" />
                <div>
                  <p className="mb-1 text-xs font-bold uppercase tracking-wider text-accent">Lettura automatica · prossime {stats.hours} ore</p>
                  <p className="text-sm leading-relaxed">{buildForecastNarrative(stats, data.model.name)}</p>
                </div>
              </CardContent>
            </Card>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              <Card>
                <CardContent className="p-4">
                  <Thermometer className="mb-2 h-4 w-4 text-accent" />
                  <p className="text-[11px] font-medium text-muted-foreground">Temperature {stats.hours}h</p>
                  <p className="mt-1 font-mono text-xl font-bold">{stats.tempMin}° / {stats.tempMax}°C</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Tendenza {stats.tempTrend > 0 ? '+' : ''}{stats.tempTrend}°C</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <CloudRain className="mb-2 h-4 w-4 text-info" />
                  <p className="text-[11px] font-medium text-muted-foreground">{data.model.kind === 'ensemble' ? 'Probabilità precipitazioni' : 'Precipitazioni previste'}</p>
                  <p className="mt-1 font-mono text-xl font-bold">{data.model.kind === 'ensemble' ? `${stats.precipitationProbability}%` : `${stats.meanPrecipitationTotal} mm`}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">Accumulo medio {stats.meanPrecipitationTotal} mm</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <Snowflake className="mb-2 h-4 w-4 text-primary" />
                  <p className="text-[11px] font-medium text-muted-foreground">{!stats.snowAvailable ? 'Dato neve' : data.model.kind === 'ensemble' ? 'Scenari con neve' : 'Neve significativa'}</p>
                  <p className="mt-1 font-mono text-xl font-bold">{!stats.snowAvailable ? '—' : data.model.kind === 'ensemble' ? `${stats.snowProbability}%` : stats.snowProbability === 100 ? 'Sì' : 'No'}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{stats.snowAvailable ? 'Soglia: almeno 1 cm' : 'Non fornito da questo modello'}</p>
                </CardContent>
              </Card>
              <Card>
                <CardContent className="p-4">
                  <BarChart3 className="mb-2 h-4 w-4 text-primary" />
                  <p className="text-[11px] font-medium text-muted-foreground">{data.model.kind === 'ensemble' ? 'Accordo scenari' : 'Tipo di previsione'}</p>
                  <p className="mt-1 text-xl font-bold capitalize">{data.model.kind === 'ensemble' ? stats.agreement : 'Singola'}</p>
                  <p className="mt-1 text-[11px] text-muted-foreground">{data.model.kind === 'ensemble' ? `Dispersione ${stats.spread}°C` : 'Nessuna dispersione calcolabile'}</p>
                </CardContent>
              </Card>
            </div>
          </section>

          <div className="grid gap-6 xl:grid-cols-2">
            <TemperatureSpaghettiChart forecast={data} />
            <PrecipitationForecastChart forecast={data} />
          </div>

          <section>
            <div className="mb-3 flex items-center gap-2">
              <CloudSun className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-bold">Sintesi giornaliera</h3>
            </div>
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
              {daily.map((day) => (
                <Card key={day.date}>
                  <CardContent className="p-3">
                    <p className="text-xs font-bold">{formatDay(day.date)}</p>
                    <p className="mt-2 font-mono text-lg font-bold">{day.tempMin}° <span className="text-muted-foreground">/</span> {day.tempMax}°</p>
                    <div className="mt-2 flex items-center gap-1.5 text-[11px] text-info">
                      <CloudRain className="h-3.5 w-3.5" />
                      {data.model.kind === 'ensemble' ? `${day.precipitationProbability}%` : `${day.meanPrecipitationTotal} mm`}
                    </div>
                    {data.model.kind === 'ensemble' && day.snowProbability >= 10 && (
                      <div className="mt-1 flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <Snowflake className="h-3 w-3" /> Neve {day.snowProbability}%
                      </div>
                    )}
                    <p className="mt-2 text-[10px] text-muted-foreground">Media {day.meanPrecipitationTotal} mm</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </section>

          <div className="flex flex-col gap-2 border-t pt-4 text-[11px] text-muted-foreground sm:flex-row sm:items-center">
            <p>
              Fonte dati: <a href="https://open-meteo.com/en/docs/ensemble-api" target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 font-medium text-primary hover:underline">Open-Meteo <ExternalLink className="h-3 w-3" /></a>
              {' '}· caricamento {new Intl.DateTimeFormat('it-IT', { dateStyle: 'short', timeStyle: 'short', timeZone: 'Europe/Rome' }).format(new Date(data.fetchedAt))}
            </p>
            <p className="sm:ml-auto sm:text-right">Supporto operativo: non sostituisce i bollettini ufficiali di allerta.</p>
          </div>
        </>
      )}
    </div>
  );
}
