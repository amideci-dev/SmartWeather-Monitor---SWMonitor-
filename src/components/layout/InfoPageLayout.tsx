import { ReactNode, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { SiteFooter } from './SiteFooter';

/** Struttura comune delle pagine di testo (Info, About). */
export function InfoPageLayout({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  useEffect(() => {
    const previous = document.title;
    document.title = `${title} - Smart Weather Monitor`;
    return () => {
      document.title = previous;
    };
  }, [title]);

  return (
    <div className="flex h-screen flex-col bg-background">
      <header className="shrink-0 border-b bg-card/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-3 px-4">
          <img src="/logo-mark.svg" alt="SWMonitor" className="h-8 w-8" />
          <Link to="/" className="flex items-center gap-1.5 text-sm font-medium text-primary hover:underline">
            <ArrowLeft className="h-4 w-4" /> Torna alla dashboard
          </Link>
        </div>
      </header>
      <main className="flex-1 overflow-y-auto">
        <article className="mx-auto max-w-3xl space-y-8 px-4 py-8 text-sm leading-relaxed">
          <div>
            <h1 className="text-2xl font-extrabold tracking-tight">{title}</h1>
            <p className="mt-1 text-muted-foreground">{subtitle}</p>
          </div>
          {children}
        </article>
      </main>
      <SiteFooter />
    </div>
  );
}

export function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="space-y-3">
      <h2 className="text-lg font-bold">{title}</h2>
      {children}
    </section>
  );
}

export function ExternalLink({ href, children }: { href: string; children: ReactNode }) {
  return (
    <a href={href} target="_blank" rel="noopener noreferrer" className="font-medium text-primary hover:underline">
      {children}
    </a>
  );
}
