import { useState } from 'react';
import { Camera, ExternalLink, Maximize2, RefreshCw, X } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogTitle } from '@/components/ui/dialog';
import { Webcam } from '@/data/mockWebcams';

interface WebcamCardProps {
  webcam: Webcam;
  onSelectStation?: (stationId: string) => void;
}

export function WebcamCard({ webcam, onSelectStation }: WebcamCardProps) {
  const [refreshKey, setRefreshKey] = useState(0);
  const [fullscreen, setFullscreen] = useState(false);

  const imgSrc = `${webcam.url}${webcam.url.includes('?') ? '&' : '?'}t=${refreshKey}`;
  const externalHref = webcam.externalUrl || webcam.url;

  return (
    <>
      <Card className="overflow-hidden group">
        <div
          className="relative aspect-video bg-muted cursor-pointer"
          onClick={() => setFullscreen(true)}
        >
          <img
            src={imgSrc}
            alt={webcam.name}
            className="h-full w-full object-cover"
            loading="lazy"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
            }}
          />
          {/* Overlay controls */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          <div className="absolute bottom-2 left-2 right-2 flex items-end justify-between opacity-0 group-hover:opacity-100 transition-opacity">
            <span className="text-white text-xs font-medium drop-shadow-md">
              {webcam.name}
            </span>
            <div className="flex gap-1">
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setRefreshKey((k) => k + 1);
                }}
              >
                <RefreshCw className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                onClick={(e) => {
                  e.stopPropagation();
                  setFullscreen(true);
                }}
              >
                <Maximize2 className="h-3.5 w-3.5" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-white hover:bg-white/20"
                asChild
                onClick={(e) => e.stopPropagation()}
              >
                <a href={externalHref} target="_blank" rel="noopener noreferrer">
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

      {/* Fullscreen dialog */}
      <Dialog open={fullscreen} onOpenChange={setFullscreen}>
        <DialogContent className="max-w-5xl w-[95vw] p-0 bg-black border-none overflow-hidden">
          <DialogTitle className="sr-only">{webcam.name}</DialogTitle>
          <div className="relative">
            <img
              src={`${webcam.url}${webcam.url.includes('?') ? '&' : '?'}t=${refreshKey}`}
              alt={webcam.name}
              className="w-full h-auto max-h-[85vh] object-contain"
            />
            {/* Top bar */}
            <div className="absolute top-0 left-0 right-0 flex items-center justify-between p-3 bg-gradient-to-b from-black/70 to-transparent">
              <span className="text-white font-semibold text-sm drop-shadow-md">
                📷 {webcam.name}
              </span>
              <div className="flex gap-1">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setRefreshKey((k) => k + 1)}
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  asChild
                >
                  <a href={externalHref} target="_blank" rel="noopener noreferrer">
                    <ExternalLink className="h-4 w-4" />
                  </a>
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 text-white hover:bg-white/20"
                  onClick={() => setFullscreen(false)}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
