import { useState, useCallback, useMemo } from 'react';
import { Flame, Radio, Waves, Mountain, LayoutGrid } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
import { WindCard } from '@/components/dashboard/WindCard';
import { StationHeader } from '@/components/dashboard/StationHeader';
import { HydrometerCard } from '@/components/dashboard/HydrometerCard';
import { MapSidebar } from '@/components/dashboard/MapSidebar';
import { AlertBadge } from '@/components/dashboard/AlertBadge';
import { WindAlertsBell } from '@/components/dashboard/WindAlertsBell';
import { WindAlertBanner } from '@/components/dashboard/WindAlertBanner';
import { StationsSummary } from '@/components/dashboard/StationsSummary';
import { mockStations, mockHydrometers } from '@/data/mockStations';
import { mockAlert } from '@/data/mockAlert';
import { generateWindAlerts } from '@/lib/windAlerts';

const Index = () => {
  const [activeStation, setActiveStation] = useState<string | null>(null);
  const [mapExpanded, setMapExpanded] = useState(false);
  const windAlerts = useMemo(() => generateWindAlerts(mockStations), []);

  const station = activeStation
    ? mockStations.find((s) => s.id === activeStation) ?? null
    : null;

  const handleSelectStation = useCallback((id: string) => {
    setActiveStation(id);
  }, []);

  return (
    <div className="h-screen bg-background flex flex-col overflow-hidden">
      {/* Wind alert banner */}
      <WindAlertBanner alerts={windAlerts} />

      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="flex h-14 items-center gap-3 px-4">
          <Flame className="h-6 w-6 text-accent" />
          <h1 className="text-lg font-extrabold tracking-tight">
            MeteoWatch <span className="text-accent">VVF</span>
          </h1>

          <div className="ml-auto flex items-center gap-3">
            <AlertBadge alert={mockAlert} />
            <WindAlertsBell alerts={windAlerts} onSelectStation={handleSelectStation} />
            <div className="flex items-center gap-1.5 text-xs text-success">
              <Radio className="h-3.5 w-3.5 animate-pulse" />
              <span className="font-medium">Live</span>
            </div>
          </div>
        </div>
      </header>

      {/* Main layout: data (left) + map (right) */}
      <div className="flex flex-1 min-h-0">
        {/* Data panel */}
        <main
          className="flex-1 overflow-y-auto transition-all duration-300"
          style={{ flexBasis: mapExpanded ? '40%' : '75%' }}
        >
          <div className="px-4 py-6 space-y-8 max-w-5xl mx-auto">
            {/* ─── Summary Overview ─── */}
            <section>
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

            {/* ─── Station Detail ─── */}
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
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>

                {/* Station header */}
                <div className="mt-4">
                  <StationHeader station={station} />
                </div>

                {/* Cards grid */}
                <div className="mt-4 grid gap-6 lg:grid-cols-2">
                  <WeatherCard data={station.weather} />
                  <WindCard data={station.wind} />
                </div>
              </section>
            )}

            {/* ─── Hydrometers ─── */}
            <section>
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
          </div>
        </main>

        {/* Map sidebar */}
        <aside
          className="hidden md:block transition-all duration-300"
          style={{ width: mapExpanded ? '60%' : '25%', minWidth: mapExpanded ? '400px' : '280px', flexShrink: 0 }}
        >
          <MapSidebar
            expanded={mapExpanded}
            onToggleExpand={() => setMapExpanded((v) => !v)}
            onSelectStation={handleSelectStation}
          />
        </aside>
      </div>
    </div>
  );
};

export default Index;
