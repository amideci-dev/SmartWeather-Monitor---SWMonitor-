import { Link } from 'react-router-dom';

/** Piè di pagina sottile e sempre visibile, con i link alle pagine Info e About. */
export function SiteFooter() {
  return (
    <footer className="shrink-0 border-t bg-card/80 px-4 py-1.5 text-[11px] text-muted-foreground">
      <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-center gap-x-4 gap-y-0.5 sm:justify-between">
        <span>2026 - Vibecoded by Amideci</span>
        <nav className="flex items-center gap-4">
          <Link to="/info" className="font-medium hover:text-foreground hover:underline">Info</Link>
          <Link to="/about" className="font-medium hover:text-foreground hover:underline">About</Link>
        </nav>
      </div>
    </footer>
  );
}
