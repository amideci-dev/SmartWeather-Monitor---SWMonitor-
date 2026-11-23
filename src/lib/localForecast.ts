import { Cloud, CloudDrizzle, CloudFog, CloudLightning, CloudRain, CloudSnow, CloudSun, CloudSunRain, LucideIcon, Sun } from 'lucide-react';

/** Legenda "sky_condition" di meteo.report (a–x). */
const SKY: Record<string, { label: string; icon: LucideIcon }> = {
  a: { label: 'Cielo sereno', icon: Sun },
  b: { label: 'Soleggiato', icon: Sun },
  c: { label: 'Parzialmente nuvoloso', icon: CloudSun },
  d: { label: 'Nuvoloso', icon: Cloud },
  e: { label: 'Molto nuvoloso', icon: Cloud },
  f: { label: 'Rovesci', icon: CloudRain },
  g: { label: 'Rovesci forti', icon: CloudRain },
  h: { label: 'Pioggia moderata', icon: CloudRain },
  i: { label: 'Pioggia forte', icon: CloudRain },
  j: { label: 'Pioggia debole', icon: CloudDrizzle },
  k: { label: 'Rovesci deboli', icon: CloudDrizzle },
  l: { label: 'Neve debole e sole', icon: CloudSnow },
  m: { label: 'Neve e sole', icon: CloudSnow },
  n: { label: 'Neve debole', icon: CloudSnow },
  o: { label: 'Neve moderata', icon: CloudSnow },
  p: { label: 'Neve forte', icon: CloudSnow },
  q: { label: 'Neve bagnata e sole', icon: CloudSnow },
  r: { label: 'Neve bagnata', icon: CloudSnow },
  s: { label: 'Foschia', icon: CloudFog },
  t: { label: 'Foschia in quota', icon: CloudFog },
  u: { label: 'Instabile', icon: CloudSunRain },
  v: { label: 'Temporali', icon: CloudLightning },
  w: { label: 'Instabile con neve bagnata', icon: CloudSnow },
  x: { label: 'Temporali di neve bagnata', icon: CloudLightning },
};

export function skyInfo(code: string | null | undefined): { label: string; icon: LucideIcon } {
  return (code && SKY[code.toLowerCase()]) || { label: 'Variabile', icon: Cloud };
}

/** Ora locale italiana come stringa "naive" confrontabile con gli orari della previsione. */
export function nowRomeNaive(date = new Date()): string {
  return new Intl.DateTimeFormat('sv-SE', {
    timeZone: 'Europe/Rome', year: 'numeric', month: '2-digit', day: '2-digit',
    hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false,
  }).format(date).replace(' ', 'T');
}

export function dayLabel(date: string): { weekday: string; day: string } {
  const d = new Date(`${date}T12:00:00Z`);
  return {
    weekday: new Intl.DateTimeFormat('it-IT', { weekday: 'short', timeZone: 'UTC' }).format(d),
    day: new Intl.DateTimeFormat('it-IT', { day: '2-digit', month: '2-digit', timeZone: 'UTC' }).format(d),
  };
}

const fmt = (v: number | null | undefined, digits = 0) =>
  v === null || v === undefined ? '—' : v.toFixed(digits).replace('.', ',');
export { fmt as fmtNum };
