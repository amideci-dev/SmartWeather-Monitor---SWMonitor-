import { Cloud, CloudLightning, CloudRain, CloudSnow, CloudSun, Sun } from 'lucide-react';
import { ForecastCondition } from '@/types/forecast';

export const forecastConditionLabels: Record<ForecastCondition, string> = {
  dry: 'Asciutto',
  'partly-cloudy': 'Parzialmente nuvoloso',
  cloudy: 'Nuvoloso',
  rain: 'Pioggia',
  snow: 'Neve',
  storm: 'Temporali',
};

export function ForecastConditionIcon({ condition, className = 'h-6 w-6' }: { condition: ForecastCondition; className?: string }) {
  if (condition === 'snow') return <CloudSnow className={`${className} text-primary`} aria-label="Neve" />;
  if (condition === 'rain') return <CloudRain className={`${className} text-info`} aria-label="Pioggia" />;
  if (condition === 'storm') return <CloudLightning className={`${className} text-accent`} aria-label="Temporali" />;
  if (condition === 'cloudy') return <Cloud className={`${className} text-muted-foreground`} aria-label="Nuvoloso" />;
  if (condition === 'partly-cloudy') return <CloudSun className={`${className} text-primary`} aria-label="Parzialmente nuvoloso" />;
  return <Sun className={`${className} text-warning`} aria-label="Asciutto" />;
}
