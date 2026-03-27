import { useEffect, useRef, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Map, Maximize2, Minimize2, Radar } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { mockStations, mockHydrometers } from '@/data/mockStations';

const MAPY_API_KEY = 'SUMTdyzTGlTJNZT1HcqtFViewMoHuB7iNzm1kMCfUsk';
const WINDY_API_KEY = 'ogEMc7vYebttuafxuLL4HtSyh5Ho2pvl';

// Center on San Martino di Castrozza
const MAP_CENTER: [number, number] = [46.265, 11.800];
const MAP_ZOOM = 13;

interface MapSidebarProps {
  expanded: boolean;
  onToggleExpand: () => void;
  onSelectStation: (stationId: string) => void;
}

export function MapSidebar({ expanded, onToggleExpand, onSelectStation }: MapSidebarProps) {
  const mapContainer = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  useEffect(() => {
    if (!mapContainer.current || mapRef.current) return;

    const map = L.map(mapContainer.current, {
      zoomControl: false,
    }).setView(MAP_CENTER, MAP_ZOOM);

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer(
      `https://api.mapy.com/v1/maptiles/outdoor/256/{z}/{x}/{y}?apikey=${MAPY_API_KEY}`,
      {
        minZoom: 0,
        maxZoom: 19,
        attribution:
          '<a href="https://api.mapy.com/copyright" target="_blank">&copy; Seznam.cz a.s.</a>',
      }
    ).addTo(map);

    // Mapy.cz logo (required by TOS)
    const LogoControl = L.Control.extend({
      options: { position: 'bottomleft' as L.ControlPosition },
      onAdd() {
        const container = L.DomUtil.create('div');
        const link = L.DomUtil.create('a', '', container);
        link.setAttribute('href', 'https://mapy.com/');
        link.setAttribute('target', '_blank');
        link.innerHTML =
          '<img src="https://api.mapy.com/img/api/logo.svg" width="80" />';
        L.DomEvent.disableClickPropagation(link);
        return container;
      },
    });
    new LogoControl().addTo(map);

    // Weather station markers
    mockStations.forEach((station) => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div class="station-pin"><span class="text-sm">${station.weather.conditionIcon}</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const trendArrow =
        station.weather.temperatureTrend === 'rising'
          ? '↑'
          : station.weather.temperatureTrend === 'falling'
            ? '↓'
            : '→';

      const popup = L.popup({ className: 'station-popup', maxWidth: 220 }).setContent(`
        <div class="p-2 space-y-1.5">
          <div class="font-bold text-sm">${station.weather.conditionIcon} ${station.name}</div>
          <div class="text-xs text-gray-500">${station.location} · ${station.altitude} m</div>
          <hr class="border-gray-200"/>
          <div class="grid grid-cols-2 gap-1 text-xs">
            <div>🌡 <b>${station.weather.temperature.toFixed(1)}°C</b> ${trendArrow}</div>
            <div>💧 ${station.weather.humidity}%</div>
            <div>💨 ${station.wind.speed} km/h ${station.wind.direction}</div>
            ${station.weather.pressure !== null ? `<div>⏲ ${station.weather.pressure} hPa</div>` : ''}
          </div>
          <button onclick="window.__selectStation('${station.id}')" class="mt-1 w-full rounded bg-blue-600 px-2 py-1 text-xs font-medium text-white hover:bg-blue-700 transition-colors">
            Vai alla scheda →
          </button>
        </div>
      `);

      L.marker([station.lat, station.lng], { icon }).addTo(map).bindPopup(popup);
    });

    // Hydrometer markers
    mockHydrometers.forEach((hydro) => {
      const icon = L.divIcon({
        className: 'custom-marker',
        html: `<div class="hydro-pin"><span class="text-sm">🌊</span></div>`,
        iconSize: [36, 36],
        iconAnchor: [18, 18],
      });

      const popup = L.popup({ className: 'station-popup', maxWidth: 220 }).setContent(`
        <div class="p-2 space-y-1.5">
          <div class="font-bold text-sm">🌊 ${hydro.name}</div>
          <div class="text-xs text-gray-500">${hydro.location} · ${hydro.river}</div>
          <hr class="border-gray-200"/>
          <div class="grid grid-cols-2 gap-1 text-xs">
            <div>📏 Livello: <b>${hydro.currentLevel} ${hydro.levelUnit}</b></div>
            ${hydro.currentFlow !== null ? `<div>🌊 Portata: <b>${hydro.currentFlow} ${hydro.flowUnit}</b></div>` : ''}
          </div>
        </div>
      `);

      L.marker([hydro.lat, hydro.lng], { icon }).addTo(map).bindPopup(popup);
    });

    mapRef.current = map;

    return () => {
      map.remove();
      mapRef.current = null;
    };
  }, []);

  // Expose station selection to popup buttons
  useEffect(() => {
    (window as any).__selectStation = (id: string) => {
      onSelectStation(id);
    };
    return () => {
      delete (window as any).__selectStation;
    };
  }, [onSelectStation]);

  // Invalidate map size when sidebar expands/collapses
  useEffect(() => {
    setTimeout(() => {
      mapRef.current?.invalidateSize();
    }, 350);
  }, [expanded]);

  return (
    <div className="flex h-full w-full flex-col border-l bg-card">
      {/* Header */}
      <div className="flex items-center justify-between border-b px-3 py-2">
        <div className="flex items-center gap-2">
          <Map className="h-4 w-4 text-primary" />
          <span className="text-sm font-bold">Mappa</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="h-7 w-7"
          onClick={onToggleExpand}
        >
          {expanded ? (
            <Minimize2 className="h-4 w-4" />
          ) : (
            <Maximize2 className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Map container */}
      <div ref={mapContainer} className="flex-1 min-h-0" />
    </div>
  );
}
