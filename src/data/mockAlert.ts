export type AlertLevel = 'gialla' | 'arancione' | 'rossa' | null;

/** Allerta meteo provinciale, letta dal collector dalla pagina di MeteoTrentino. */
export interface LiveAlert {
  /** "unavailable" = la pagina non è stata raggiungibile o non è stata riconosciuta */
  status: 'ok' | 'unavailable';
  active: boolean;
  level: AlertLevel;
  title?: string;
  text?: string;
  dateFrom?: string;
  dateTo?: string;
  pdfUrl?: string | null;
  sourceUrl?: string;
  /** Voce più recente dell'archivio, utile quando non c'è nessuna allerta in corso */
  last?: { date: string; level: AlertLevel; pdfUrl: string | null } | null;
  error?: string;
}

export const ALERT_SOURCE_URL = 'https://www.meteotrentino.it/contatti-e-informazioni/sistema-di-allerta-provinciale/';
