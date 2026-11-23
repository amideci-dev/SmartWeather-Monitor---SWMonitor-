import { useState } from 'react';
import { AlertTriangle, ExternalLink, FileText, ShieldCheck, ShieldQuestion } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { ALERT_SOURCE_URL, LiveAlert } from '@/data/mockAlert';

const levelColors: Record<string, { bg: string; text: string; border: string; badge: string }> = {
  gialla: {
    bg: 'bg-yellow-500/10',
    text: 'text-yellow-700 dark:text-yellow-400',
    border: 'border-yellow-500',
    badge: 'bg-yellow-500 text-yellow-950',
  },
  arancione: {
    bg: 'bg-orange-500/10',
    text: 'text-orange-700 dark:text-orange-400',
    border: 'border-orange-500',
    badge: 'bg-orange-500 text-white',
  },
  rossa: {
    bg: 'bg-red-500/10',
    text: 'text-red-700 dark:text-red-400',
    border: 'border-red-500',
    badge: 'bg-red-600 text-white',
  },
};

interface AlertBadgeProps {
  alert?: LiveAlert;
  loading?: boolean;
}

/** "2026-10-20" -> "20/10/2026" */
function formatIsoDate(iso: string): string {
  const m = iso.match(/(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export function AlertBadge({ alert, loading = false }: AlertBadgeProps) {
  const [open, setOpen] = useState(false);

  if (!alert) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground" title={loading ? undefined : 'Allerta non disponibile'}>
        <ShieldQuestion className="h-3.5 w-3.5" />
        <span>{loading ? 'Allerta…' : 'Allerta non disponibile'}</span>
      </div>
    );
  }

  if (alert.status === 'unavailable') {
    return (
      <a
        href={alert.sourceUrl ?? ALERT_SOURCE_URL}
        target="_blank"
        rel="noopener noreferrer"
        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground"
        title="Non riesco a leggere l'allerta: controlla il sito di MeteoTrentino"
      >
        <ShieldQuestion className="h-3.5 w-3.5" />
        <span>Allerta non disponibile</span>
      </a>
    );
  }

  if (!alert.active || !alert.level) {
    const last = alert.last;
    return (
      <div
        className="flex items-center gap-1.5 text-xs text-muted-foreground"
        title={last ? `Ultima allerta: ${last.level ?? ''} del ${formatIsoDate(last.date)}`.replace('  ', ' ') : undefined}
      >
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Nessuna allerta</span>
      </div>
    );
  }

  const dateRange = alert.dateFrom ? `${alert.dateFrom}${alert.dateTo ? ` → ${alert.dateTo}` : ''}` : '';

  const colors = levelColors[alert.level];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors hover:opacity-80 ${colors.badge} animate-pulse cursor-pointer sm:gap-1.5 max-sm:px-2 max-sm:py-0.5`}
        >
          <AlertTriangle className="h-3.5 w-3.5 max-sm:h-3 max-sm:w-3" />
          <span className="sm:hidden text-[10px]">Allerta</span>
          <span className="hidden sm:inline">Allerta {alert.level.charAt(0).toUpperCase() + alert.level.slice(1)}</span>
          {dateRange && <span className="hidden sm:inline font-normal opacity-90">{dateRange}</span>}
        </button>
      </DialogTrigger>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className={`flex items-center gap-2 ${colors.text}`}>
            <AlertTriangle className="h-5 w-5" />
            {alert.title}
          </DialogTitle>
        </DialogHeader>
        <div className={`rounded-lg border-l-4 p-4 ${colors.bg} ${colors.border}`}>
          <p className="text-sm leading-relaxed whitespace-pre-line">
            {alert.text || 'Per i dettagli consulta il bollettino ufficiale.'}
          </p>
        </div>
        <div className="flex flex-wrap gap-2 pt-2">
          {alert.pdfUrl && (
            <Button variant="outline" size="sm" asChild>
              <a href={alert.pdfUrl} target="_blank" rel="noopener noreferrer">
                <FileText className="mr-1.5 h-3.5 w-3.5" />
                Scarica PDF
              </a>
            </Button>
          )}
          <Button variant="outline" size="sm" asChild>
            <a href={alert.sourceUrl ?? ALERT_SOURCE_URL} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Fonte: Meteotrentino
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
