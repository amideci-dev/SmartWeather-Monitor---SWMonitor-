import { useState, useCallback, useMemo } from 'react';
import { Flame, Radio, Waves, Mountain, LayoutGrid, Snowflake, Camera, RefreshCw, Menu, X } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';


// Show WindCard if station has a wind URL, is WunderGround, or has hasWindSensor flag
const hasWind = (station: { urls: { wind?: string }; source: string; hasWindSensor?: boolean }): boolean =>
  !!station.urls.wind || station.source === 'wunderground' || !!station.hasWindSensor;

// Show RainCard if station has a rain URL, is WunderGround, or has hasRainSensor flag
const hasRain = (station: { urls: { rain?: string }; source: string; hasRainSensor?: boolean }): boolean =>
  !!station.urls.rain || station.source === 'wunderground' || !!station.hasRainSensor;
import { Button } from '@/components/ui/button';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
import { RainCard } from '@/components/dashboard/RainCard';
import { WindCard } from '@/components/dashboard/WindCard';
import { SnowCard } from '@/components/dashboard/SnowCard';
import { StationHeader } from '@/components/dashboard/StationHeader';
import { HydrometerCard } from '@/components/dashboard/HydrometerCard';
import { MapSidebar } from '@/components/dashboard/MapSidebar';
import { AlertBadge } from '@/components/dashboard/AlertBadge';
import { AlertsBell } from '@/components/dashboard/WindAlertsBell';
import { AlertBanner } from '@/components/dashboard/WindAlertBanner';
import { StationsSummary } from '@/components/dashboard/StationsSummary';
import { WebcamsSection } from '@/components/dashboard/WebcamsSection';
import { WebcamCard } from '@/components/dashboard/WebcamCard';
import { mockStations, mockHydrometers } from '@/data/mockStations';
import { mockSnowStations } from '@/data/mockSnow';
import { mockAlert } from '@/data/mockAlert';
import { stationWebcams } from '@/data/mockWebcams';
import { generateWindAlerts, generateHydroAlerts, StationAlert } from '@/lib/windAlerts';

const Index = () => {
  const [activeStation, setActiveStation] = useState<string | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const [mobileMapOpen, setMobileMapOpen] = useState(false);
  const [mobileMapTab, setMobileMapTab] = useState<'mappa' | 'radar'>('mappa');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const windAlerts = useMemo(() => generateWindAlerts(mockStations), []);
  const hydroAlerts = useMemo(() => generateHydroAlerts(mockHydrometers), []);
  const allAlerts: StationAlert[] = useMemo(() => [...windAlerts, ...hydroAlerts], [windAlerts, hydroAlerts]);

  const station = activeStation
    ? mockStations.find((s) => s.id === activeStation) ?? null
    : null;

  const handleSelectStation = useCallback((id: string) => {
    setActiveStation(id);
  }, []);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Wind alert banner */}
      <AlertBanner alerts={allAlerts} />

      {/* Top bar */}
      <header className="sticky top-0 z-[120] border-b bg-card/80 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-4">
          <Flame className="h-6 w-6 text-accent" />
          <h1 className="text-lg font-extrabold tracking-tight">
            MeteoWatch <span className="text-accent">VVF</span>
          </h1>

          {/* Desktop nav */}
          <nav className="hidden sm:flex items-center gap-1 ml-6">
            {[
              { id: 'riepilogo', label: 'Stazioni', icon: '📊' },
              { id: 'webcams', label: 'Webcams', icon: '📷' },
              { id: 'idrometri', label: 'Idrometri', icon: '🌊' },
              { id: 'neve', label: 'Dati Neve', icon: '❄️' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  const el = document.getElementById(item.id);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-2.5 py-1.5 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>

          <div className="ml-auto flex items-center gap-2 sm:gap-3">
            <AlertBadge alert={mockAlert} />
            <AlertsBell alerts={allAlerts} onSelectStation={handleSelectStation} />
            <button
              onClick={() => window.location.reload()}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
              title="Aggiorna dati"
            >
              <RefreshCw className="h-4 w-4 text-muted-foreground" />
            </button>
            {/* Mobile hamburger */}
            <button
              onClick={() => setMobileMenuOpen((v) => !v)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors sm:hidden"
            >
              {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
            <div className="hidden sm:flex items-center gap-1.5 text-xs text-success">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span className="font-medium">Live</span>
            </div>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {mobileMenuOpen && (
          <nav className="sm:hidden border-t bg-card px-4 py-2 flex flex-col gap-1">
            {[
              { id: 'riepilogo', label: 'Stazioni', icon: '📊' },
              { id: 'webcams', label: 'Webcams', icon: '📷' },
              { id: 'idrometri', label: 'Idrometri', icon: '🌊' },
              { id: 'neve', label: 'Dati Neve', icon: '❄️' },
            ].map((item) => (
              <button
                key={item.id}
                onClick={() => {
                  setMobileMenuOpen(false);
                  const el = document.getElementById(item.id);
                  el?.scrollIntoView({ behavior: 'smooth', block: 'start' });
                }}
                className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted transition-colors text-left"
              >
                {item.icon} {item.label}
              </button>
            ))}
          </nav>
        )}
      </header>

      {/* Main layout: data (left) + map (right) */}
      <div className="relative isolate flex flex-1 min-h-0">
        {/* Data panel */}
        <main
          className="flex-1 overflow-y-auto transition-all duration-300"
          style={{ flexBasis: mapExpanded ? '40%' : '75%' }}
        >
          <div className="px-4 py-6 space-y-8 max-w-5xl mx-auto">
            {/* ─── Summary Overview ─── */}
            <section id="riepilogo">
              <div className="flex items-center gap-2 mb-4">
                <LayoutGrid className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-bold">Riepilogo Stazioni</h2>
                <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  {mockStations.length}
                </span>
                {activeStation && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveStation(null)}
                    className="ml-auto"
                  >
                    ← Torna al riepilogo
                  </Button>
                )}
              </div>

              {!activeStation && (
                <StationsSummary onSelectStation={handleSelectStation} />
              )}
            </section>

            {/* ─── Webcams (collapsible, only on summary) ─── */}
            {!activeStation && (
              <div id="webcams">
                <WebcamsSection onSelectStation={handleSelectStation} />
              </div>
            )}

            {station && (
              <section>
                <div className="flex items-center gap-2 mb-4">
                  <Mountain className="h-5 w-5 text-primary" />
                  <h2 className="text-lg font-bold">Dettaglio Stazione</h2>
                </div>

                {/* Station selector */}
                <Tabs value={activeStation!} onValueChange={setActiveStation}>
                  <TabsList className="w-full flex-wrap justify-start gap-1 bg-transparent p-0 h-auto">
                    {mockStations.map((s) => (
                      <TabsTrigger
                        key={s.id}
                        value={s.id}
                        className="rounded-full border border-transparent px-3 py-1.5 text-xs data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
                      >
                        {s.name} — {s.altitude} m
                        {s.source === 'xml' && (
                          <span className="ml-1 rounded bg-warning/20 px-1 text-[10px] text-warning">
                            XML
                          </span>
                        )}
                        {s.source === 'wunderground' && (
                          <span className="ml-1 rounded bg-info/20 px-1 text-[10px] text-info">
                            WU
                          </span>
                        )}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {/* Station header */}
                <div className="mt-4">
                  <StationHeader station={station} />
                </div>

                {/* Cards grid */}
                <div className={`mt-4 grid gap-6 ${hasWind(station) ? 'lg:grid-cols-2' : 'lg:grid-cols-1 max-w-2xl'}`}>
                  <WeatherCard data={station.weather} />
                  {hasWind(station) && <WindCard data={station.wind} />}
                  {hasRain(station) && (
                    <RainCard
                      data={station.weather}
                      rainUrl={station.urls.rain}
                      hasWinterDisclaimer={station.hasWinterRainDisclaimer}
                    />
                  )}
                </div>

                {/* Station webcams */}
                {stationWebcams.filter((c) => c.stationId === station.id).length > 0 && (
                  <div className="mt-6">
                    <div className="flex items-center gap-2 mb-3">
                      <Camera className="h-4 w-4 text-muted-foreground" />
                      <h3 className="text-sm font-semibold">Webcam</h3>
                    </div>
                    <div className="grid gap-4 sm:grid-cols-2">
                      {stationWebcams
                        .filter((c) => c.stationId === station.id)
                        .map((cam) => (
                          <WebcamCard key={cam.id} webcam={cam} />
                        ))}
                    </div>
                  </div>
                )}
              </section>
            )}

            {/* ─── Hydrometers ─── */}
            <section id="idrometri">
              <div className="flex items-center gap-2 mb-4">
                <Waves className="h-5 w-5 text-info" />
                <h2 className="text-lg font-bold">Idrometri</h2>
                <span className="ml-1 rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                  {mockHydrometers.length}
                </span>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {mockHydrometers.map((h) => (
                  <HydrometerCard key={h.id} data={h} />
                ))}
              </div>
            </section>

            {/* ─── Snow / Nivometers ─── */}
            <section id="neve">
              <div className="flex items-center gap-2 mb-4">
                <Snowflake className="h-5 w-5 text-info" />
                <h2 className="text-lg font-bold">Nivometri e Campi Neve</h2>
                <span className="ml-1 rounded-full bg-info/10 px-2 py-0.5 text-xs font-medium text-info">
                  {mockSnowStations.length}
                </span>
              </div>

              <div className="grid gap-6 lg:grid-cols-2">
                {mockSnowStations.map((s) => (
                  <SnowCard key={s.id} data={s} />
                ))}
              </div>
            </section>
          </div>
        </main>

        {/* Map sidebar — desktop */}
        <aside
          className="relative z-0 hidden md:block transition-all duration-300"
          style={{ width: mapExpanded ? '60%' : '25%', minWidth: mapExpanded ? '400px' : '280px', flexShrink: 0 }}
        >
          <MapSidebar
            expanded={mapExpanded}
            onToggleExpand={() => setMapExpanded((v) => !v)}
            onSelectStation={handleSelectStation}
          />
        </aside>

        {/* Map — mobile fullscreen overlay ABOVE header */}
        <div
          className={`fixed inset-0 z-[300] md:hidden flex flex-col transition-opacity duration-300 ${mobileMapOpen ? 'opacity-100 pointer-events-auto' : 'opacity-0 pointer-events-none'}`}
        >
          <div className="flex items-center justify-between bg-card border-b px-3 py-2 shrink-0">
            <button
              onClick={() => setMobileMapOpen(false)}
              className="p-1.5 rounded-lg hover:bg-muted transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
            <div className="flex items-center gap-1 bg-muted/50 rounded-lg p-0.5">
              <button
                onClick={() => setMobileMapTab('mappa')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${mobileMapTab === 'mappa' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
              >
                🗺️ Mappa
              </button>
              <button
                onClick={() => setMobileMapTab('radar')}
                className={`px-3 py-1 rounded-md text-xs font-medium transition-colors ${mobileMapTab === 'radar' ? 'bg-background shadow-sm text-foreground' : 'text-muted-foreground'}`}
              >
                📡 Radar
              </button>
            </div>
            <div className="w-16" />
          </div>
          <div className="flex-1 min-h-0">
            {mobileMapTab === 'mappa' ? (
              <MapSidebar
                expanded={true}
                onToggleExpand={() => setMobileMapOpen(false)}
                onSelectStation={(id) => {
                  handleSelectStation(id);
                  setMobileMapOpen(false);
                }}
              />
            ) : (
              <iframe
                className="h-full w-full border-0"
                src="https://embed.windy.com/embed.html?type=map&location=coordinates&metricRain=mm&metricTemp=°C&metricWind=km/h&zoom=11&overlay=radar&product=radar&level=surface&lat=46.265&lon=11.800"
                title="Windy Radar"
                allow="fullscreen"
              />
            )}
          </div>
        </div>

        {/* Mobile map open label */}
        {!mobileMapOpen && (
          <button
            onClick={() => setMobileMapOpen(true)}
            className="fixed right-0 top-1/2 -translate-y-1/2 z-[150] md:hidden bg-primary text-primary-foreground px-1.5 py-3 rounded-l-lg shadow-lg text-[10px] font-bold flex flex-col items-center gap-2"
            style={{ writingMode: 'vertical-rl' }}
          >
            <span>🗺️ Mappa</span>
            <span className="border-t border-primary-foreground/30 pt-1">📡 Radar</span>
          </button>
        )}
      </div>
    </div>
  );
};

export default Index;
