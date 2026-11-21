const ALLOWED_ORIGIN = Deno.env.get('ALLOWED_ORIGIN') ?? '*';
const CACHE_SECONDS = Number(Deno.env.get('CACHE_SECONDS') ?? '180');
const WU_API_KEY = Deno.env.get('WU_API_KEY') ?? '';
const WU_STATION_ID = Deno.env.get('WU_STATION_ID') ?? 'IPRIMI4';

const corsHeaders = {
  'Access-Control-Allow-Origin': ALLOWED_ORIGIN,
  'Access-Control-Allow-Headers': 'content-type',
  'Vary': 'Origin',
};

// ─── Station configurations ───
const XML_STATIONS = [
  { id: 'pradellnasse', code: 'T0450', hasWind: true, hasRain: true },
  { id: 'passorollemt', code: 'T0103', hasWind: true, hasRain: true },
  { id: 'passovalles', code: 'T0104', hasWind: true, hasRain: true },
  { id: 'calaita', code: 'T0429', hasWind: false, hasRain: false },
  { id: 'fradusta', code: 'T0444', hasWind: false, hasRain: false, hasSolarRadiation: true },
];

const HTML_STATIONS = [
  { id: 'colverde', slug: 'colverde' },
  { id: 'puntaces', slug: 'puntaces' },
  { id: 'colbricon', slug: 'colbricon' },
  { id: 'passorolle', slug: 'passorolle' },
  { id: 'rosetta', slug: 'funivia' },
  { id: 'paradiso', slug: 'paradiso' },
];

const HYDROMETERS = [
  { id: 'sanmartino', sensorId: '28240' },
  { id: 'fieraprimiero', sensorId: '11768' },
];

const SNOW_STATIONS = [
  { id: 'snow-sanmartino', campoNeveCode: '4SMC' },
  { id: 'snow-passorolle', campoNeveCode: '31RO' },
];

// ─── XML Parser helpers ───
function extractAllValues(xml: string, outerTag: string, innerTag: string): { date: string; value: number }[] {
  const results: { date: string; value: number }[] = [];
  const regex = new RegExp(`<${outerTag}[^>]*>\\s*<data>([^<]+)</data>\\s*<${innerTag}>([^<]+)</${innerTag}>`, 'g');
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push({ date: match[1], value: parseFloat(match[2]) });
  }
  return results;
}

function extractWindValues(xml: string): { date: string; speed: number; gust: number; dir: number }[] {
  const results: { date: string; speed: number; gust: number; dir: number }[] = [];
  const regex = /<vento_al_suolo[^>]*>\s*<data>([^<]+)<\/data>\s*<v>([^<]+)<\/v>\s*<vmax>([^<]+)<\/vmax>\s*<d>([^<]+)<\/d>/g;
  let match;
  while ((match = regex.exec(xml)) !== null) {
    results.push({
      date: match[1],
      speed: parseFloat(match[2]) * 3.6, // m/s to km/h
      gust: parseFloat(match[3]) * 3.6,
      dir: parseFloat(match[4]),
    });
  }
  return results;
}

function getLastValue(values: { date: string; value: number }[]): { date: string; value: number } | null {
  return values.length > 0 ? values[values.length - 1] : null;
}

function getTrend(values: { value: number }[], count = 4): { trend: string; rate: number } {
  if (values.length < 2) return { trend: 'stable', rate: 0 };
  const recent = values.slice(-count);
  const first = recent[0].value;
  const last = recent[recent.length - 1].value;
  const diff = last - first;
  const hours = (count * 15) / 60;
  const rate = Math.abs(diff / hours);
  return {
    trend: diff > 0.2 ? 'rising' : diff < -0.2 ? 'falling' : 'stable',
    rate: Math.round(rate * 10) / 10,
  };
}

function degToCompass(deg: number): string {
  const dirs = ['N', 'NNE', 'NE', 'ENE', 'E', 'ESE', 'SE', 'SSE', 'S', 'SSW', 'SW', 'WSW', 'W', 'WNW', 'NW', 'NNW'];
  return dirs[Math.round(deg / 22.5) % 16];
}

function speedToBeaufort(kmh: number): { scale: number; desc: string } {
  const thresholds = [
    { max: 1, scale: 0, desc: 'Calma di vento' },
    { max: 5, scale: 1, desc: 'Bava di vento' },
    { max: 11, scale: 2, desc: 'Brezza leggera' },
    { max: 19, scale: 3, desc: 'Brezza moderata' },
    { max: 28, scale: 4, desc: 'Vento moderato' },
    { max: 38, scale: 5, desc: 'Vento teso' },
    { max: 49, scale: 6, desc: 'Vento forte' },
    { max: 61, scale: 7, desc: 'Vento forte (burrasca moderata)' },
    { max: 74, scale: 8, desc: 'Burrasca' },
    { max: 88, scale: 9, desc: 'Burrasca forte' },
    { max: 102, scale: 10, desc: 'Tempesta' },
    { max: 117, scale: 11, desc: 'Tempesta violenta' },
    { max: Infinity, scale: 12, desc: 'Uragano' },
  ];
  const t = thresholds.find(t => kmh <= t.max)!;
  return { scale: t.scale, desc: t.desc };
}

async function fetchXmlViaProxy(url: string): Promise<string> {
  // Try direct fetch first with short timeout
  try {
    const res = await fetch(url, {
      signal: AbortSignal.timeout(5000),
      headers: { 'User-Agent': 'Mozilla/5.0 (compatible; WeatherDashboard/1.0)' },
    });
    if (res.ok) {
      const text = await res.text();
      if (text.includes('<datiOggi') || text.includes('<temperatura>')) return text;
    } else { await res.text(); }
  } catch { /* blocked, fall through */ }
  
  throw new Error('MeteoTrentino XML blocked from cloud runtime');
}

async function fetchXmlStation(config: typeof XML_STATIONS[0]) {
  try {
    const url = `https://dati.meteotrentino.it/service.asmx/ultimiDatiStazione?codice=${config.code}`;
    const xml = await fetchXmlViaProxy(url);

    // Extract summary
    const tmin = parseFloat(xml.match(/<tmin>([^<]+)/)?.[1] ?? '0');
    const tmax = parseFloat(xml.match(/<tmax>([^<]+)/)?.[1] ?? '0');
    const dailyRain = parseFloat(xml.match(/<rain>([^<]+)/)?.[1] ?? '0');
    const dateStr = xml.match(/<data>([^<]+)/)?.[1] ?? '';

    // Temperature series
    const temps = extractAllValues(xml, 'temperatura_aria', 'temperatura');
    const lastTemp = getLastValue(temps);
    const tempTrend = getTrend(temps);

    // Humidity
    const humidity = extractAllValues(xml, 'umidita_relativa', 'rh');
    const lastHum = getLastValue(humidity);
    const humTrend = getTrend(humidity);

    // Rain
    const rain = extractAllValues(xml, 'precipitazione', 'pioggia');
    const lastRain = getLastValue(rain);
    const maxRainIntensity = rain.length > 1
      ? Math.max(...rain.slice(1).map((r, i) => (r.value - rain[i].value) * 4))
      : 0;

    // Wind
    let windData = null;
    if (config.hasWind) {
      const wind = extractWindValues(xml);
      if (wind.length > 0) {
        const lastWind = wind[wind.length - 1];
        const maxGust = Math.max(...wind.map(w => w.gust));
        const last4Speeds = wind.slice(-4).map(w => w.speed);
        const avgSpeed = last4Speeds.reduce((a, b) => a + b, 0) / last4Speeds.length;

        const beaufort = speedToBeaufort(lastWind.speed);
        windData = {
          direction: degToCompass(lastWind.dir),
          directionDegrees: lastWind.dir,
          speed: Math.round(lastWind.speed * 10) / 10,
          beaufort: beaufort.scale,
          beaufortDescription: beaufort.desc,
          windChill: null,
          feelsLike: null,
          averages: {
            min10: Math.round(avgSpeed * 10) / 10,
            min15: Math.round(avgSpeed * 10) / 10,
            min30: Math.round(avgSpeed * 10) / 10,
            min60: Math.round(avgSpeed * 10) / 10,
          },
          gusts: {
            lastHour: Math.round(Math.max(...wind.slice(-4).map(w => w.gust)) * 10) / 10,
            today: Math.round(maxGust * 10) / 10,
            todayTime: '—',
          },
        };
      }
    }

    // Solar radiation
    let solarRadiation = null;
    if (config.hasSolarRadiation) {
      const radiation = extractAllValues(xml, 'radiazioneglobale', 'rsg');
      const lastRad = getLastValue(radiation);
      if (lastRad) solarRadiation = Math.round(lastRad.value);
    }

    const lastUpdateDate = lastTemp?.date ? new Date(lastTemp.date) : new Date();
    const lastUpdate = `${lastUpdateDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })} ore ${lastUpdateDate.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })}`;

    return {
      id: config.id,
      unreachable: false,
      lastUpdate,
      weather: {
        temperature: lastTemp?.value ?? 0,
        temperatureTrend: tempTrend.trend,
        temperatureTrendValue: tempTrend.rate,
        humidity: lastHum?.value ?? 0,
        humidityTrend: humTrend.trend,
        humidityTrendValue: humTrend.rate,
        rainIntensity: lastRain ? lastRain.value * 4 : 0, // mm/15min → mm/h
        dailyExtremes: {
          tempMin: tmin,
          tempMinTime: '—',
          tempMax: tmax,
          tempMaxTime: '—',
          maxGust: windData ? windData.gusts.today : 0,
          maxGustTime: '—',
          dailyRain,
          maxRainIntensity: Math.round(Math.max(0, maxRainIntensity) * 10) / 10,
        },
        solarRadiation,
      },
      wind: windData,
    };
  } catch (e) {
    console.error(`Error fetching XML station ${config.id}:`, e);
    return { id: config.id, unreachable: true, error: String(e) };
  }
}

// ─── HTML Scraping (PrimieroMeteo) ───
function extractTextBetween(html: string, startId: string, fallbackRegex?: RegExp): string {
  const idPattern = new RegExp(`id="${startId}"[^>]*>([^<]*(?:<[^/][^>]*>[^<]*)*)<`, 'i');
  const match = html.match(idPattern);
  if (match) return match[1].replace(/<[^>]*>/g, '').trim();
  if (fallbackRegex) {
    const fb = html.match(fallbackRegex);
    if (fb) return fb[1].trim();
  }
  return '';
}

function parseNumber(s: string): number {
  const cleaned = s.replace(/[^0-9.\-]/g, '');
  return parseFloat(cleaned) || 0;
}

async function fetchHtmlStation(config: typeof HTML_STATIONS[0]) {
  try {
    const [weatherRes, windRes] = await Promise.all([
      fetch(`https://www.primierometeo.it/${config.slug}/tabella.php`, { signal: AbortSignal.timeout(10000) }),
      fetch(`https://www.primierometeo.it/${config.slug}/9meteo_vento_.php`, { signal: AbortSignal.timeout(10000) }),
    ]);

    if (!weatherRes.ok) throw new Error(`Weather HTTP ${weatherRes.status}`);
    const weatherHtml = await weatherRes.text();
    const windHtml = windRes.ok ? await windRes.text() : '';

    // Parse weather page
    const tempMatch = weatherHtml.match(/id="ajaxtemp"[^>]*>[\s\S]*?(\-?[\d.]+)°C/);
    const temperature = tempMatch ? parseFloat(tempMatch[1]) : 0;

    const tempTrendMatch = weatherHtml.match(/alt="(Colder|Warmer|Steady)\s*([\d.]+)?/i);
    const temperatureTrend = tempTrendMatch
      ? tempTrendMatch[1].toLowerCase() === 'colder' ? 'falling'
        : tempTrendMatch[1].toLowerCase() === 'warmer' ? 'rising' : 'stable'
      : 'stable';
    const temperatureTrendValue = tempTrendMatch ? parseFloat(tempTrendMatch[2] || '0') : 0;

    const humMatch = weatherHtml.match(/id="ajaxhumidity"[^>]*>[\s\S]*?(\d+)%/);
    const humidity = humMatch ? parseInt(humMatch[1]) : 0;

    const humTrendMatch = weatherHtml.match(/alt="(Increased|Decreased|Steady)\s*([\d.]+)?/i);
    const humidityTrend = humTrendMatch
      ? humTrendMatch[1].toLowerCase() === 'increased' ? 'rising'
        : humTrendMatch[1].toLowerCase() === 'decreased' ? 'falling' : 'stable'
      : 'stable';
    const humidityTrendValue = humTrendMatch ? parseFloat(humTrendMatch[2] || '0') : 0;

    const dewMatch = weatherHtml.match(/rugiada[\s\S]*?id="ajaxdew0"[^>]*>([\s\S]*?)<\/span>/i);
    const dewPoint = dewMatch ? parseNumber(dewMatch[1]) : null;

    const percMatch = weatherHtml.match(/percepita[\s\S]*?id="ajaxapparenttemp"[^>]*>([\s\S]*?)<\/span>/i);
    const perceivedTemp = percMatch ? parseNumber(percMatch[1]) : null;

    const wetBulbMatch = weatherHtml.match(/umido[\s\S]*?id="ajaxwetbulb"[^>]*>([\s\S]*?)<\/span>/i);
    const wetBulb = wetBulbMatch ? parseNumber(wetBulbMatch[1]) : null;

    const rainIntMatch = weatherHtml.match(/id="ajaxrainratehr0"[^>]*>([\s\S]*?)mm/i);
    const rainIntensity = rainIntMatch ? parseNumber(rainIntMatch[1]) : 0;

    const baroMatch = weatherHtml.match(/id="ajaxbaro"[^>]*>\s*([\d.]+)\s*hPa/i);
    const pressure = baroMatch ? parseFloat(baroMatch[1]) : null;

    const baroTrendMatch = weatherHtml.match(/id="ajaxbaroarrow"[\s\S]*?alt="(Rising|Falling|Steady)\s*([\d.]+)?/i);
    const pressureTrend = baroTrendMatch
      ? baroTrendMatch[1].toLowerCase() === 'rising' ? 'rising'
        : baroTrendMatch[1].toLowerCase() === 'falling' ? 'falling' : 'stable'
      : 'stable';
    const pressureTrendValue = baroTrendMatch ? parseFloat(baroTrendMatch[2] || '0') : 0;

    // Daily extremes
    const tempMinMatch = weatherHtml.match(/Minima[\s\S]*?(\-?[\d.]+)°C[\s\S]*?ore\s+([\d:]+)/i);
    const tempMaxMatch = weatherHtml.match(/Massima[\s\S]*?(\-?[\d.]+)°C[\s\S]*?ore\s+([\d:]+)/i);
    const gustMatch = weatherHtml.match(/Raffica[\s\S]*?max[\s\S]*?(\d+[\d.]*)\s*km\/h[\s\S]*?ore\s+([\d:]+)/i);
    const dailyRainMatch = weatherHtml.match(/id="ajaxrain0"[^>]*>([\s\S]*?)mm/i);
    const maxIntMatch = weatherHtml.match(/intensità\s+([\d.]+)\s*mm/i);

    const tempMin = tempMinMatch ? parseFloat(tempMinMatch[1]) : temperature;
    const tempMinTime = tempMinMatch ? tempMinMatch[2] : '—';
    const tempMax = tempMaxMatch ? parseFloat(tempMaxMatch[1]) : temperature;
    const tempMaxTime = tempMaxMatch ? tempMaxMatch[2] : '—';
    const maxGust = gustMatch ? parseFloat(gustMatch[1]) : 0;
    const maxGustTime = gustMatch ? gustMatch[2] : '—';
    const dailyRain = dailyRainMatch ? parseNumber(dailyRainMatch[1]) : 0;
    const maxRainIntensity = maxIntMatch ? parseFloat(maxIntMatch[1]) : 0;

    // Condition icon
    const iconMatch = weatherHtml.match(/id="ajaxconditionicon2"[\s\S]*?<img[^>]*src="[^"]*\/([^"/]+)\.png"/i);
    const iconName = iconMatch ? iconMatch[1] : 'sereno';
    const conditionIcon = iconName.includes('sereno') ? (iconName.includes('sera') || iconName.includes('notte') ? '🌙' : '☀️')
      : iconName.includes('coperto') ? '☁️'
      : iconName.includes('pioggia') || iconName.includes('rain') ? '🌧️'
      : iconName.includes('neve') || iconName.includes('snow') ? '🌨️'
      : iconName.includes('nuvoloso') ? '⛅'
      : '⛅';

    // Update time
    const dateMatch = weatherHtml.match(/id="ajaxdate0"[^>]*>([\s\S]*?)<\/span>/i);
    const lastUpdate = dateMatch ? dateMatch[1].replace(/<[^>]*>/g, '').trim() : '';

    // Parse wind page
    let windData = null;
    if (windHtml) {
      const windSpeedMatch = windHtml.match(/id="ajaxwind2"[^>]*>[\s\S]*?(\d+[\d.]*)/);
      const windDirMatch = windHtml.match(/direzione\s+(\w+)/i);
      const beaufortMatch = windHtml.match(/Beaufort:\s*(\d+)/i);
      const beaufortDescMatch = windHtml.match(/<em>(.*?)(?:\s*-\s*Beaufort|\s*&nbsp;)/i);
      const windChillMatch = windHtml.match(/windchill[\s\S]*?<\/td>\s*<td[^>]*>([\s\S]*?)°C/i);

      const windSpeed = windSpeedMatch ? parseFloat(windSpeedMatch[1]) : 0;
      const beaufort = speedToBeaufort(windSpeed);

      // Wind averages from the table
      const avgMatches = windHtml.match(/(\d+[\d.]*)\s*km\/h/g) || [];
      const avgValues = avgMatches.map(m => parseFloat(m));

      windData = {
        direction: windDirMatch ? windDirMatch[1] : 'N',
        directionDegrees: 0,
        speed: windSpeed,
        beaufort: beaufort.scale,
        beaufortDescription: beaufortDescMatch ? beaufortDescMatch[1].trim() : beaufort.desc,
        windChill: windChillMatch ? parseNumber(windChillMatch[1]) : null,
        feelsLike: null,
        averages: {
          min10: avgValues[0] || windSpeed,
          min15: avgValues[1] || windSpeed,
          min30: avgValues[2] || windSpeed,
          min60: avgValues[3] || windSpeed,
        },
        gusts: {
          lastHour: 0,
          today: maxGust,
          todayTime: maxGustTime,
        },
      };
    }

    return {
      id: config.id,
      unreachable: false,
      lastUpdate,
      weather: {
        condition: iconName.replace(/_/g, ' '),
        conditionIcon,
        temperature,
        temperatureTrend,
        temperatureTrendValue,
        humidity,
        humidityTrend,
        humidityTrendValue,
        dewPoint,
        perceivedTemp,
        wetBulb,
        rainIntensity,
        pressure,
        pressureTrend,
        pressureTrendValue,
        dailyExtremes: {
          tempMin,
          tempMinTime,
          tempMax,
          tempMaxTime,
          maxGust,
          maxGustTime,
          dailyRain,
          maxRainIntensity,
        },
      },
      wind: windData,
    };
  } catch (e) {
    console.error(`Error fetching HTML station ${config.id}:`, e);
    return { id: config.id, unreachable: true, error: String(e) };
  }
}

// ─── WeatherUnderground ───
async function fetchWunderground() {
  try {
    if (!WU_API_KEY) throw new Error('WU_API_KEY not set');
    const res = await fetch(
      `https://api.weather.com/v2/pws/observations/current?stationId=${WU_STATION_ID}&format=json&units=m&apiKey=${WU_API_KEY}`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();
    const obs = data.observations?.[0];
    if (!obs) throw new Error('No observations');

    const metric = obs.metric || obs.imperial;
    const lastUpdate = new Date(obs.obsTimeLocal || obs.obsTimeUtc).toLocaleString('it-IT', {
      day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
    });

    return {
      id: 'croderosse',
      unreachable: false,
      lastUpdate,
      weather: {
        condition: 'Sereno',
        conditionIcon: '☀️',
        temperature: metric.temp ?? 0,
        temperatureTrend: 'stable',
        temperatureTrendValue: 0,
        humidity: obs.humidity ?? 0,
        humidityTrend: 'stable',
        humidityTrendValue: 0,
        dewPoint: metric.dewpt ?? null,
        perceivedTemp: metric.heatIndex ?? metric.windChill ?? metric.temp ?? null,
        wetBulb: null,
        rainIntensity: metric.precipRate ?? 0,
        pressure: metric.pressure ?? null,
        pressureTrend: 'stable',
        pressureTrendValue: 0,
        dailyExtremes: {
          tempMin: metric.temp ?? 0,
          tempMinTime: '—',
          tempMax: metric.temp ?? 0,
          tempMaxTime: '—',
          maxGust: metric.windGust ?? 0,
          maxGustTime: '—',
          dailyRain: metric.precipTotal ?? 0,
          maxRainIntensity: metric.precipRate ?? 0,
        },
        visibility: obs.visibility ?? null,
        uvIndex: obs.uv ?? null,
      },
      wind: {
        direction: degToCompass(obs.winddir ?? 0),
        directionDegrees: obs.winddir ?? 0,
        speed: metric.windSpeed ?? 0,
        beaufort: speedToBeaufort(metric.windSpeed ?? 0).scale,
        beaufortDescription: speedToBeaufort(metric.windSpeed ?? 0).desc,
        windChill: metric.windChill ?? null,
        feelsLike: metric.windChill ?? null,
        averages: { min10: 0, min15: 0, min30: 0, min60: 0 },
        gusts: {
          lastHour: metric.windGust ?? 0,
          today: metric.windGust ?? 0,
          todayTime: '—',
        },
      },
    };
  } catch (e) {
    console.error('Error fetching WeatherUnderground:', e);
    return { id: 'croderosse', unreachable: true, error: String(e) };
  }
}

// ─── Hydrometers (floods.it) ───
async function fetchHydrometer(config: typeof HYDROMETERS[0]) {
  try {
    const res = await fetch(
      `https://www.floods.it/api/v1/monitoring/${config.sensorId}.json`,
      { signal: AbortSignal.timeout(10000) }
    );
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const feature = json?.features?.[0];
    const data = feature?.properties?.data;
    if (!data?.timestamp?.length || !data?.value?.length) {
      throw new Error('No data in response');
    }

    const timestamps: number[] = data.timestamp;
    const values: number[] = data.value;
    const tz = (feature?.properties?.metadata?.tz ?? 'UTC') === 'UTC' ? 0 : 3600;
    const tzOffsetSec = feature?.properties?.s?.tz ? feature.properties.s.tz * 60 : 3600; // default CET

    // Get last 24h of readings (96 readings at 15-min intervals)
    const count = Math.min(96, timestamps.length);
    const startIdx = timestamps.length - count;
    const history: { time: string; level: number; flow: number | null }[] = [];

    for (let i = startIdx; i < timestamps.length; i++) {
      const d = new Date((timestamps[i] + tzOffsetSec) * 1000);
      const time = `${d.getUTCHours().toString().padStart(2, '0')}:${d.getUTCMinutes().toString().padStart(2, '0')}`;
      history.push({ time, level: values[i], flow: null });
    }

    const lastTs = timestamps[timestamps.length - 1];
    const lastDate = new Date((lastTs + tzOffsetSec) * 1000);
    const lastUpdate = `${lastDate.getUTCDate().toString().padStart(2, '0')}/${(lastDate.getUTCMonth() + 1).toString().padStart(2, '0')}/${lastDate.getUTCFullYear()} ore ${lastDate.getUTCHours().toString().padStart(2, '0')}:${lastDate.getUTCMinutes().toString().padStart(2, '0')}`;

    const currentLevel = values[values.length - 1];

    // Extract site name from series config
    const siteName = json?.features?.[0]?.properties?.metadata?.api_warnings || '';

    return {
      id: config.id,
      unreachable: false,
      lastUpdate,
      currentLevel,
      currentFlow: null,
      history,
    };
  } catch (e) {
    console.error(`Error fetching hydrometer ${config.id}:`, e);
    return { id: config.id, unreachable: true, error: String(e) };
  }
}

// ─── Snow / Campi Neve (MeteoTrentino JSON) ───
function getCurrentSnowSeason(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = now.getMonth() + 1;
  // Season starts in October: Oct 2025 → season "2025"
  return month >= 10 ? String(year) : String(year - 1);
}

async function fetchSnowStation(config: typeof SNOW_STATIONS[0]) {
  try {
    const season = getCurrentSnowSeason();
    const url = `https://dati.meteotrentino.it/service.asmx/rilieviNeveStagionaliUnaStazioneValangheJson?stagione=${season}&camponeve=${config.campoNeveCode}`;
    const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();

    const obs = json?.osservazioni;
    if (!Array.isArray(obs) || obs.length === 0) {
      return { id: config.id, unreachable: false, history: [], currentDepth: 0, lastUpdate: '' };
    }

    // Get last 30 entries
    const recent = obs.slice(-30);
    const history = recent.map((o: any) => {
      const d = new Date(o.DataRilievo);
      const date = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      const hs = parseFloat(String(o.HSnum ?? o.HS ?? '').trim()) || 0;
      const hnRaw = String(o.HNnum ?? o.HN ?? '').trim();
      const hn = hnRaw === '' || hnRaw === '//' ? null : (parseFloat(hnRaw) || 0);
      return { date, hs, hn };
    });

    const last = obs[obs.length - 1];
    const lastDate = new Date(last.DataRilievo);
    const lastUpdate = `${lastDate.toLocaleDateString('it-IT', { day: '2-digit', month: '2-digit', year: 'numeric' })}`;
    const currentDepth = parseFloat(String(last.HSnum ?? last.HS ?? '').trim()) || 0;

    return {
      id: config.id,
      unreachable: false,
      lastUpdate,
      currentDepth,
      history,
    };
  } catch (e) {
    console.error(`Error fetching snow station ${config.id}:`, e);
    return { id: config.id, unreachable: true, error: String(e) };
  }
}

// ─── Collector con cache ───
async function collect() {
  // XML stations sequentially (come nell'originale) per non stressare MeteoTrentino
  const xmlResults = [];
  for (const station of XML_STATIONS) {
    xmlResults.push(await fetchXmlStation(station));
  }
  const [htmlResults, wuResult, hydroResults, snowResults] = await Promise.all([
    Promise.all(HTML_STATIONS.map(fetchHtmlStation)),
    fetchWunderground(),
    Promise.all(HYDROMETERS.map(fetchHydrometer)),
    Promise.all(SNOW_STATIONS.map(fetchSnowStation)),
  ]);
  return {
    success: true,
    timestamp: new Date().toISOString(),
    stations: [...htmlResults, ...xmlResults, wuResult],
    hydrometers: hydroResults,
    snowStations: snowResults,
  };
}

let cached: { at: number; body: string } | null = null;
let inflight: Promise<string> | null = null;

async function getBody(): Promise<string> {
  const now = Date.now();
  if (cached && now - cached.at < CACHE_SECONDS * 1000) return cached.body;
  // Più visitatori contemporanei condividono la stessa raccolta
  if (!inflight) {
    inflight = collect()
      .then((data) => {
        const body = JSON.stringify(data);
        cached = { at: Date.now(), body };
        return body;
      })
      .finally(() => { inflight = null; });
  }
  try {
    return await inflight;
  } catch (e) {
    // Se la raccolta fallisce ma c'è un dato vecchio, meglio quello che niente
    if (cached) return cached.body;
    throw e;
  }
}

Deno.serve({ port: Number(Deno.env.get('PORT') ?? '8000') }, async (req) => {
  const { pathname } = new URL(req.url);
  if (req.method === 'OPTIONS') return new Response(null, { headers: corsHeaders });
  if (pathname === '/health') return new Response('ok');
  if (pathname !== '/' && pathname !== '/weather') return new Response('Not found', { status: 404 });
  try {
    const body = await getBody();
    return new Response(body, {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
        'Cache-Control': `public, max-age=${Math.min(CACHE_SECONDS, 60)}`,
      },
    });
  } catch (e) {
    console.error('collect failed:', e);
    return new Response(JSON.stringify({ success: false, error: String(e) }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
