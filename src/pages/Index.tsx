import { useState } from 'react';
import { Flame, Radio } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { WeatherCard } from '@/components/dashboard/WeatherCard';
import { WindCard } from '@/components/dashboard/WindCard';
import { StationHeader } from '@/components/dashboard/StationHeader';
import { mockStations } from '@/data/mockStations';

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

      <main className="container py-6 space-y-6">
        {/* Station selector tabs */}
        <Tabs value={activeStation} onValueChange={setActiveStation}>
          <TabsList className="w-full justify-start gap-1 bg-transparent p-0">
            {mockStations.map((s) => (
              <TabsTrigger
                key={s.id}
                value={s.id}
                className="rounded-full border border-transparent px-4 py-1.5 text-sm data-[state=active]:border-primary data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {s.name} — {s.altitude} m
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Station header */}
        <StationHeader station={station} />

        {/* Cards grid */}
        <div className="grid gap-6 lg:grid-cols-2">
          <WeatherCard data={station.weather} />
          <WindCard data={station.wind} />
        </div>
      </main>
    </div>
  );
};

export default Index;
