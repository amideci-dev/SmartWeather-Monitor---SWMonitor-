import { StationAlert } from '@/lib/windAlerts';

/**
 * Notifiche del browser per gli stessi avvisi del campanello.
 * Arrivano mentre l'app è aperta (anche in secondo piano): i dati si aggiornano ogni 5 minuti
 * e a ogni aggiornamento si controlla se c'è un avviso nuovo. Non sono notifiche push a app chiusa.
 */

const KEY_ENABLED = 'swm-notify-enabled';
const KEY_SENT = 'swm-notify-sent';
const COOLDOWN_MS = 3 * 60 * 60 * 1000; // stesso avviso non ripetuto prima di 3 ore
const MAX_PER_RUN = 3;

function readJson<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function writeJson(key: string, value: unknown) {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* archivio pieno o bloccato: si rinuncia al promemoria */
  }
}

export function notificationsSupported(): boolean {
  return typeof window !== 'undefined' && 'Notification' in window;
}

export function notificationPermission(): NotificationPermission | 'unsupported' {
  return notificationsSupported() ? Notification.permission : 'unsupported';
}

export function notificationsEnabled(): boolean {
  if (!notificationsSupported() || Notification.permission !== 'granted') return false;
  try {
    return localStorage.getItem(KEY_ENABLED) === '1';
  } catch {
    return false;
  }
}

export function disableNotifications() {
  try {
    localStorage.removeItem(KEY_ENABLED);
  } catch {
    /* ignora */
  }
}

/** Chiede il permesso al browser e, se concesso, attiva le notifiche. */
export async function enableNotifications(): Promise<NotificationPermission | 'unsupported'> {
  if (!notificationsSupported()) return 'unsupported';
  const result = Notification.permission === 'default' ? await Notification.requestPermission() : Notification.permission;
  if (result === 'granted') {
    try {
      localStorage.setItem(KEY_ENABLED, '1');
    } catch {
      /* ignora */
    }
  }
  return result;
}

/** Identifica un avviso: cambia quando cambia la gravità o (per le raffiche) l'ora dell'evento. */
export function alertKey(alert: StationAlert): string {
  if (alert.kind === 'hydro') return `${alert.id}:${alert.severity}`;
  return alert.type === 'gust'
    ? `${alert.id}:${alert.threshold.label}:${alert.time}`
    : `${alert.id}:${alert.threshold.label}`;
}

export function describeAlert(alert: StationAlert): { title: string; body: string; tag: string } {
  if (alert.kind === 'hydro') {
    return {
      title: `Livello in aumento - ${alert.hydrometerName}`,
      body: `+${alert.increasePercent}% rispetto alla media delle ultime 2 ore (${alert.river}, ${alert.currentLevel} m)`,
      tag: alert.id,
    };
  }
  const what = alert.type === 'gust' ? `Raffica ${alert.speed} km/h (ore ${alert.time})` : `Vento ${alert.speed} km/h`;
  return { title: `${alert.threshold.label} - ${alert.stationName}`, body: what, tag: alert.id };
}

/** Solo gli avvisi "vivi": vento attuale o raffica negli ultimi 30 minuti, e tutti quelli idrometrici. */
function isNotifiable(alert: StationAlert): boolean {
  return alert.kind === 'hydro' || alert.isRecent;
}

async function show(title: string, body: string, tag: string) {
  const options: NotificationOptions = {
    body,
    tag,
    icon: '/icons/icon-192.png',
    badge: '/icons/icon-192.png',
    data: { url: '/' },
  };
  try {
    const reg = 'serviceWorker' in navigator ? await navigator.serviceWorker.getRegistration() : undefined;
    if (reg) {
      await reg.showNotification(title, options);
      return;
    }
  } catch {
    /* si prova il metodo semplice */
  }
  try {
    new Notification(title, options);
  } catch {
    /* alcuni browser mobili accettano solo il service worker */
  }
}

function pruneSent(sent: Record<string, number>, now: number) {
  for (const key of Object.keys(sent)) if (now - sent[key] > COOLDOWN_MS) delete sent[key];
}

/** Segna gli avvisi già presenti come "già visti", per non notificarli appena si attivano le notifiche. */
export function markAlertsAsSeen(alerts: StationAlert[]) {
  const now = Date.now();
  const sent = readJson<Record<string, number>>(KEY_SENT, {});
  pruneSent(sent, now);
  for (const alert of alerts) if (isNotifiable(alert)) sent[alertKey(alert)] = now;
  writeJson(KEY_SENT, sent);
}

/** Notifica gli avvisi comparsi dall'ultimo controllo. */
export async function notifyNewAlerts(alerts: StationAlert[]) {
  if (!notificationsEnabled()) return;
  const now = Date.now();
  const sent = readJson<Record<string, number>>(KEY_SENT, {});
  pruneSent(sent, now);

  const fresh = alerts.filter((alert) => isNotifiable(alert) && !sent[alertKey(alert)]);
  for (const alert of fresh) sent[alertKey(alert)] = now;
  writeJson(KEY_SENT, sent);
  if (fresh.length === 0) return;

  const shown = fresh.slice(0, MAX_PER_RUN);
  for (const alert of shown) {
    const { title, body, tag } = describeAlert(alert);
    await show(title, body, tag);
  }
  if (fresh.length > shown.length) {
    await show('Altri avvisi meteo', `Altri ${fresh.length - shown.length} avvisi attivi: apri SWMonitor per i dettagli.`, 'swm-more');
  }
}

export async function sendTestNotification() {
  await show('Notifiche attive', 'Riceverai qui gli avvisi di vento forte e di livello dei torrenti.', 'swm-test');
}
