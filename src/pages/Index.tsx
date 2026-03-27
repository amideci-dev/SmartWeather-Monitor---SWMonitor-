import { useState } from 'react';
import { Flame, Radio, Waves, Mountain } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
import { WindCard } from '@/components/dashboard/WindCard';
import { StationHeader } from '@/components/dashboard/StationHeader';
import { HydrometerCard } from '@/components/dashboard/HydrometerCard';
import { mockStations, mockHydrometers } from '@/data/mockStations';

const Index = () => {
  const [activeStation, setActiveStation] = useState(mockStations[0].id);
  const station = mockStations.find((s) => s.id === activeStation) ?? mockStations[0];

  return (
    <div className="min-h-screen bg-background">
      {/* Top bar */}
      <header className="sticky top-0 z-50 border-b bg-card/80 backdrop-blur-md">
        <div className="container flex h-14 items-center gap-3">
          <Flame className="h-6 w-6 text-accent" />
          <h1 className="text-lg font-extrabold tracking-tight">
            MeteoWatch <span className="text-accent">VVF</span>
          </h1>
          <div className="ml-auto flex items-center gap-1.5 text-xs text-success">
            <Radio className="h-3.5 w-3.5 animate-pulse" />
            <span className="font-medium">Live</span>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-8">
        {/* ─── Weather Stations ─── */}
        <section>
          <div className="flex items-center gap-2 mb-4">
            <Mountain className="h-5 w-5 text-primary" />
            <h2 className="text-lg font-bold">Stazioni Meteo</h2>
            <span className="ml-1 rounded-full bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
              {mockStations.length}
            </span>
          </div>

          {/* Station selector */}
          <Tabs value={activeStation} onValueChange={setActiveStation}>
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
      </main>
    </div>
  );
};

export default Index;
