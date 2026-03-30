import { useState, useEffect } from 'react';
import { Camera, ChevronDown, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { WebcamCard } from './WebcamCard';
import { allWebcams } from '@/data/mockWebcams';

interface WebcamsSectionProps {
  onSelectStation: (stationId: string) => void;
}

export function WebcamsSection({ onSelectStation }: WebcamsSectionProps) {
  const [isMobile, setIsMobile] = useState(window.innerWidth < 640);
  const [expanded, setExpanded] = useState(!isMobile);

  useEffect(() => {
    const handler = () => {
      const mobile = window.innerWidth < 640;
      setIsMobile(mobile);
    };
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);
  return (
    <section>
      <button
        onClick={() => setExpanded((v) => !v)}
        className="flex items-center gap-2 mb-4 group w-full text-left"
      >
        {expanded ? (
          <ChevronDown className="h-4 w-4 text-muted-foreground transition-transform" />
        ) : (
          <ChevronRight className="h-4 w-4 text-muted-foreground transition-transform" />
        )}
        <Camera className="h-5 w-5 text-primary" />
        <h2 className="text-lg font-bold">Webcams</h2>
        <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
          {allWebcams.length}
        </span>
      </button>

      {!expanded && (
        <Button
          variant="outline"
          size="sm"
          className="w-full text-xs"
          onClick={() => setExpanded(true)}
        >
          Espandi webcam
        </Button>
      )}

      {expanded && (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {allWebcams.map((cam) => (
            <WebcamCard
              key={cam.id}
              webcam={cam}
              onSelectStation={onSelectStation}
            />
          ))}
        </div>
      )}
    </section>
  );
}
