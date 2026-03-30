import { useState } from 'react';
import { AlertTriangle, ExternalLink, FileText, ShieldCheck } from 'lucide-react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert as AlertType } from '@/data/mockAlert';

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
  alert: AlertType;
}

export function AlertBadge({ alert }: AlertBadgeProps) {
  const [open, setOpen] = useState(false);

  if (!alert.level) {
    return (
      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
        <ShieldCheck className="h-3.5 w-3.5" />
        <span>Nessuna allerta</span>
      </div>
    );
  }

  const colors = levelColors[alert.level];

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <button
          className={`flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-semibold transition-colors hover:opacity-80 ${colors.badge} animate-pulse cursor-pointer max-sm:flex-col max-sm:gap-0.5 max-sm:px-2 max-sm:py-0.5 max-sm:text-[10px]`}
        >
          <span className="flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 max-sm:h-3 max-sm:w-3" />
            <span>Allerta {alert.level.charAt(0).toUpperCase() + alert.level.slice(1)}</span>
          </span>
          <span className="font-normal opacity-90 max-sm:text-[9px]">{alert.dateFrom} → {alert.dateTo}</span>
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
          <p className="text-sm leading-relaxed whitespace-pre-line">{alert.text}</p>
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
            <a href={alert.sourceUrl} target="_blank" rel="noopener noreferrer">
              <ExternalLink className="mr-1.5 h-3.5 w-3.5" />
              Fonte: Meteotrentino
            </a>
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
