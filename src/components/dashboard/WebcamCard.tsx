import { useState } from 'react';
import { Camera, ExternalLink, RefreshCw } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Webcam } from '@/data/mockWebcams';

interface WebcamCardProps {
  webcam: Webcam;
  onSelectStation?: (stationId: string) => void;
}

export function WebcamCard({ webcam, onSelectStation }: WebcamCardProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const isIframe = webcam.url.includes('skylinewebcams.com');

  const imgSrc = isIframe
    ? webcam.url
    : `${webcam.url}${webcam.url.includes('?') ? '&' : '?'}t=${refreshKey}`;

  return (
    <Card className="overflow-hidden group">
      <div className="relative aspect-video bg-muted">
        {isIframe ? (
          <iframe
            src={webcam.url}
            className="h-full w-full border-0"
            title={webcam.name}
            allow="fullscreen"
          />
        ) : (
          <img
            src={imgSrc}
            alt={webcam.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
        )}
        {/* Overlay controls */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
        <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity">
          <span className="text-white text-xs font-medium drop-shadow-md">
            {webcam.name}
          </span>
          <div className="flex gap-1">
            {!isIframe && (
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={() => setRefreshKey((k) => k + 1)}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
            )}
            <Button
              variant="ghost"
              size="icon"
              className="h-7 w-7 text-white hover:bg-white/20"
              asChild
            >
              <a href={webcam.url} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="h-3.5 w-3.5" />
              </a>
            </Button>
          </div>
        </div>
      </div>
      <CardContent className="p-3 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Camera className="h-4 w-4 text-muted-foreground" />
          <span className="text-sm font-medium">{webcam.name}</span>
        </div>
        {webcam.stationId && onSelectStation && (
          <Button
            variant="link"
            size="sm"
            className="text-xs h-auto p-0"
            onClick={() => onSelectStation(webcam.stationId!)}
          >
            Vedi stazione →
          </Button>
        )}
      </CardContent>
    </Card>
  );
}
