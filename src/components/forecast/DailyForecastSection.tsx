import { useMemo, useState } from 'react';
import { ChevronDown, Clock3, CloudRain, Snowflake, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { buildHourlyForecasts } from '@/lib/forecast';
import { DailyForecast, EnsembleForecast } from '@/types/forecast';
import { ForecastConditionIcon, forecastConditionLabels } from './ForecastConditionIcon';

const formatDay = (date: string) => {
  const formatted = new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    day: '2-digit',
    month: 'short',
    timeZone: 'UTC',
  }).format(new Date(`${date}T12:00:00Z`));
  return formatted.charAt(0).toUpperCase() + formatted.slice(1);
};

export function DailyForecastSection({ forecast, daily }: { forecast: EnsembleForecast; daily: DailyForecast[] }) {
  const [selectedDate, setSelectedDate] = useState<string | null>(null);
  const selectedDay = daily.find((day) => day.date === selectedDate) || null;
  const hourly = useMemo(
    () => selectedDay ? buildHourlyForecasts(forecast, selectedDay.date) : [],
    [forecast, selectedDay],
  );

  return (
    <section>
      <div className="mb-3 flex items-center gap-2">
        <Clock3 className="h-4 w-4 text-primary" />
        <div>
          <h3 className="text-sm font-bold">Sintesi giornaliera</h3>
          <p className="text-[11px] text-muted-foreground">Seleziona una giornata per aprire la previsione oraria</p>
        </div>
      </div>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 xl:grid-cols-7">
        {daily.map((day) => {
          const expanded = selectedDate === day.date;
          return (
            <Card key={day.date} className={expanded ? 'border-primary ring-1 ring-primary' : 'transition-colors hover:border-primary/50'}>
              <button
                type="button"
                className="w-full rounded-lg text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                aria-expanded={expanded}
                aria-controls={`hourly-${day.date}`}
                onClick={() => setSelectedDate(expanded ? null : day.date)}
              >
                <CardContent className="p-3">
                  <div className="flex items-center justify-between gap-1">
                    <p className="text-xs font-bold">{formatDay(day.date)}</p>
                    <ChevronDown className={`h-3.5 w-3.5 shrink-0 text-muted-foreground transition-transform ${expanded ? 'rotate-180' : ''}`} />
                  </div>
                  <div className="mt-3 flex flex-col items-center gap-1 text-center">
                    <ForecastConditionIcon condition={day.condition} className="h-8 w-8" />
                    <p className="min-h-8 text-[11px] font-medium leading-tight">{forecastConditionLabels[day.condition]}</p>
                  </div>
                  <p className="mt-2 text-center font-mono text-lg font-bold">{day.tempMin}° <span className="text-muted-foreground">/</span> {day.tempMax}°</p>
                  <div className="mt-2 flex items-center justify-center gap-1.5 text-[11px] text-info">
                    <CloudRain className="h-3.5 w-3.5" />
                    {forecast.model.kind === 'ensemble' ? `${day.precipitationProbability}%` : `${day.meanPrecipitationTotal} mm`}
                  </div>
                  {forecast.model.kind === 'ensemble' && day.snowProbability >= 10 && (
                    <div className="mt-1 flex items-center justify-center gap-1.5 text-[11px] text-muted-foreground">
                      <Snowflake className="h-3 w-3" /> Neve {day.snowProbability}%
                    </div>
                  )}
                  <p className="mt-2 text-center text-[10px] text-muted-foreground">Media {day.meanPrecipitationTotal} mm</p>
                </CardContent>
              </button>
            </Card>
          );
        })}
      </div>

      {selectedDay && (
        <Card id={`hourly-${selectedDay.date}`} className="mt-4 scroll-mt-4 border-primary/40">
          <CardHeader className="flex-row items-center justify-between space-y-0 p-4 pb-3">
            <div className="flex items-center gap-3">
              <ForecastConditionIcon condition={selectedDay.condition} className="h-7 w-7" />
              <div>
                <CardTitle className="text-sm">Previsione oraria · {formatDay(selectedDay.date)}</CardTitle>
                <p className="mt-0.5 text-[11px] text-muted-foreground">
                  {forecast.model.kind === 'ensemble' ? 'Valori medi e quota di scenari' : 'Singola traiettoria AROME'}
                </p>
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={() => setSelectedDate(null)} aria-label="Chiudi previsione oraria">
              <X className="h-4 w-4" />
            </Button>
          </CardHeader>
          <CardContent className="px-2 pb-3 sm:px-4">
            <div className="hidden grid-cols-[5rem_minmax(0,1fr)_6rem_8rem_8rem] gap-2 border-b px-2 pb-2 text-[10px] font-bold uppercase tracking-wider text-muted-foreground sm:grid">
              <span>Ora</span><span>Condizione</span><span>Temperatura</span><span>Precipitazioni</span><span>Scenari</span>
            </div>
            <div className="divide-y">
              {hourly.map((hour) => (
                <div key={hour.time} className="grid grid-cols-[3.5rem_minmax(0,1fr)_4.5rem] items-center gap-2 px-2 py-2.5 sm:grid-cols-[5rem_minmax(0,1fr)_6rem_8rem_8rem]">
                  <span className="font-mono text-xs font-semibold">{hour.time.slice(11, 16)}</span>
                  <div className="flex min-w-0 items-center gap-2">
                    <ForecastConditionIcon condition={hour.condition} className="h-5 w-5 shrink-0" />
                    <div className="min-w-0">
                      <p className="truncate text-xs font-medium">{forecastConditionLabels[hour.condition]}</p>
                      <p className="mt-0.5 text-[10px] text-muted-foreground sm:hidden">
                        {hour.precipitation} mm{forecast.model.kind === 'ensemble' ? ` · ${hour.precipitationProbability}% scenari` : ''}
                      </p>
                    </div>
                  </div>
                  <span className="text-right font-mono text-xs font-bold sm:text-left">{hour.temperature}°C</span>
                  <div className="hidden text-xs sm:block">
                    <p className="font-mono">{hour.precipitation} mm</p>
                    {hour.snowAvailable && hour.snowfall > 0 && <p className="text-[10px] text-muted-foreground">{hour.snowfall} cm neve</p>}
                  </div>
                  <div className="hidden text-xs text-muted-foreground sm:block">
                    {forecast.model.kind === 'ensemble' ? (
                      <>
                        <p>Precipitazioni {hour.precipitationProbability}%</p>
                        {hour.snowAvailable && hour.snowProbability > 0 && <p>Neve {hour.snowProbability}%</p>}
                      </>
                    ) : <span>Traiettoria singola</span>}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </section>
  );
}
