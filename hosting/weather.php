<?php
/**
 * SWMonitor – collector in PHP per hosting condiviso (versione di collector/main.ts).
 * Carica questo file in htdocs insieme a config.php (vedi config.sample.php).
 * Il sito lo chiama con VITE_API_URL=/weather.php
 * La raccolta si rinnova da sola quando il file di cache ha più di CACHE_SECONDS secondi.
 */
date_default_timezone_set('Europe/Rome');
if (!defined('SWM_TEST') && is_file(__DIR__ . '/config.php')) require __DIR__ . '/config.php';
if (!defined('WU_API_KEY')) define('WU_API_KEY', '');
if (!defined('WU_STATION_ID')) define('WU_STATION_ID', 'IPRIMI4');
if (!defined('CACHE_SECONDS')) define('CACHE_SECONDS', 180);
if (!defined('ALLOWED_ORIGIN')) define('ALLOWED_ORIGIN', '*');

// ─── Configurazione stazioni ───
const XML_STATIONS = [
  ['id' => 'pradellnasse', 'code' => 'T0450', 'hasWind' => true],
  ['id' => 'passorollemt', 'code' => 'T0103', 'hasWind' => true],
  ['id' => 'passovalles', 'code' => 'T0104', 'hasWind' => true],
  ['id' => 'calaita', 'code' => 'T0429', 'hasWind' => false],
  ['id' => 'fradusta', 'code' => 'T0444', 'hasWind' => false, 'hasSolar' => true],
];
const HTML_STATIONS = [
  ['id' => 'colverde', 'slug' => 'colverde'],
  ['id' => 'puntaces', 'slug' => 'puntaces'],
  ['id' => 'colbricon', 'slug' => 'colbricon'],
  ['id' => 'passorolle', 'slug' => 'passorolle'],
  ['id' => 'rosetta', 'slug' => 'funivia'],
  ['id' => 'paradiso', 'slug' => 'paradiso'],
];
const HYDROMETERS = [
  ['id' => 'sanmartino', 'sensorId' => '28240'],
  ['id' => 'fieraprimiero', 'sensorId' => '11768'],
];
const SNOW_STATIONS = [
  ['id' => 'snow-sanmartino', 'campo' => '4SMC'],
  ['id' => 'snow-passorolle', 'campo' => '31RO'],
];
const ROSETTA_BASE = 'https://www.meteotriveneto.it/funivia';
const COMPASS_DEG = [
  'N' => 0, 'NNE' => 22.5, 'NE' => 45, 'ENE' => 67.5, 'E' => 90, 'ESE' => 112.5, 'SE' => 135, 'SSE' => 157.5,
  'S' => 180, 'SSW' => 202.5, 'SW' => 225, 'WSW' => 247.5, 'W' => 270, 'WNW' => 292.5, 'NW' => 315, 'NNW' => 337.5,
];
const DEG = '(?:°|&deg;|\x{FFFD}|\x{00B0})';

// ─── Utilità ───
function r1(float $x): float { return round($x, 1); }

function to_utf8(string $s): string {
  return mb_check_encoding($s, 'UTF-8') ? $s : mb_convert_encoding($s, 'UTF-8', 'Windows-1252');
}

/** Scarica più URL in parallelo. Ritorna chiave => [body, code, err]. */
function fetch_all(array $urls): array {
  $mh = curl_multi_init();
  $hs = [];
  foreach ($urls as $k => $u) {
    $ch = curl_init($u);
    curl_setopt_array($ch, [
      CURLOPT_RETURNTRANSFER => true, CURLOPT_FOLLOWLOCATION => true, CURLOPT_MAXREDIRS => 4,
      CURLOPT_TIMEOUT => 15, CURLOPT_CONNECTTIMEOUT => 8, CURLOPT_ENCODING => '',
      CURLOPT_USERAGENT => 'Mozilla/5.0 (compatible; WeatherDashboard/1.0)',
    ]);
    curl_multi_add_handle($mh, $ch);
    $hs[$k] = $ch;
  }
  do {
    $st = curl_multi_exec($mh, $running);
    if ($running) curl_multi_select($mh, 1.0);
  } while ($running && $st === CURLM_OK);
  $out = [];
  foreach ($hs as $k => $ch) {
    $out[$k] = [
      'body' => (string)curl_multi_getcontent($ch),
      'code' => (int)curl_getinfo($ch, CURLINFO_HTTP_CODE),
      'err' => curl_error($ch),
    ];
    curl_multi_remove_handle($mh, $ch);
    curl_close($ch);
  }
  curl_multi_close($mh);
  return $out;
}

function body_of(array $r): string {
  if ($r['code'] !== 200 || $r['body'] === '') throw new RuntimeException("HTTP {$r['code']} {$r['err']}");
  return $r['body'];
}

function err_station(string $id, Throwable $e): array {
  return ['id' => $id, 'unreachable' => true, 'error' => $e->getMessage()];
}

function degToCompass(float $deg): string {
  $d = ['N','NNE','NE','ENE','E','ESE','SE','SSE','S','SSW','SW','WSW','W','WNW','NW','NNW'];
  return $d[((int)round($deg / 22.5)) % 16];
}

function speedToBeaufort(float $kmh): array {
  $t = [[1,0,'Calma di vento'],[5,1,'Bava di vento'],[11,2,'Brezza leggera'],[19,3,'Brezza moderata'],
        [28,4,'Vento moderato'],[38,5,'Vento teso'],[49,6,'Vento forte'],[61,7,'Vento forte (burrasca moderata)'],
        [74,8,'Burrasca'],[88,9,'Burrasca forte'],[102,10,'Tempesta'],[117,11,'Tempesta violenta'],[INF,12,'Uragano']];
  foreach ($t as [$max, $scale, $desc]) if ($kmh <= $max) return ['scale' => $scale, 'desc' => $desc];
  return ['scale' => 12, 'desc' => 'Uragano'];
}

function numIn(?string $s): ?float {
  if ($s === null || $s === '') return null;
  $s = str_replace(['&deg;', '&nbsp;'], ' ', $s);
  return preg_match('~-?\d+(?:\.\d+)?~', $s, $m) ? (float)$m[0] : null;
}

function spanText(string $html, string $id): ?string {
  return preg_match('~id="' . $id . '"[^>]*>([\s\S]*?)</span>~iu', $html, $m) ? trim(strip_tags($m[1])) : null;
}

function trendFromGif(string $html, string $id): string {
  if (!preg_match('~id="' . $id . '"[\s\S]{0,300}?(rising|falling|steady)\.gif~iu', $html, $m)) return 'stable';
  $t = strtolower($m[1]);
  return $t === 'rising' ? 'rising' : ($t === 'falling' ? 'falling' : 'stable');
}

function clampExtremes(float $temp, ?array $tMin, ?array $tMax, string $lastUpdate): array {
  $now = preg_match('~(\d{1,2}:\d{2})\s*$~', $lastUpdate, $m) ? $m[1] : '—';
  $min = $tMin ? (float)$tMin[1] : $temp; $minT = $tMin ? $tMin[2] : '—';
  $max = $tMax ? (float)$tMax[1] : $temp; $maxT = $tMax ? $tMax[2] : '—';
  if ($min > $temp) { $min = $temp; $minT = $now; }
  if ($max < $temp) { $max = $temp; $maxT = $now; }
  return ['tempMin' => $min, 'tempMinTime' => $minT, 'tempMax' => $max, 'tempMaxTime' => $maxT];
}

function firstMatch(string $re, string $s): ?array { return preg_match($re, $s, $m) ? $m : null; }

// ─── MeteoTrentino XML ───
function xml_values(string $xml, string $outer, string $inner): array {
  preg_match_all('~<' . $outer . '[^>]*>\s*<data>([^<]+)</data>\s*<' . $inner . '>([^<]+)</' . $inner . '>~', $xml, $m, PREG_SET_ORDER);
  return array_map(fn($x) => ['date' => $x[1], 'value' => (float)$x[2]], $m);
}

function xml_trend(array $v, int $count = 4): array {
  if (count($v) < 2) return ['stable', 0.0];
  $recent = array_slice($v, -$count);
  $diff = end($recent)['value'] - $recent[0]['value'];
  $rate = abs($diff / (($count * 15) / 60));
  return [$diff > 0.2 ? 'rising' : ($diff < -0.2 ? 'falling' : 'stable'), round($rate, 1)];
}

function fmt_it(string $date): string {
  try { return (new DateTime($date))->format('d/m/Y \o\r\e H:i'); } catch (Throwable $e) { return date('d/m/Y \o\r\e H:i'); }
}

function parse_xml_station(string $xml, array $c): array {
  if (!str_contains($xml, '<datiOggi') && !str_contains($xml, '<temperatura>')) {
    throw new RuntimeException('MeteoTrentino: risposta XML non valida');
  }
  $tmin = (float)(firstMatch('~<tmin>([^<]+)~', $xml)[1] ?? 0);
  $tmax = (float)(firstMatch('~<tmax>([^<]+)~', $xml)[1] ?? 0);
  $dailyRain = (float)(firstMatch('~<rain>([^<]+)~', $xml)[1] ?? 0);

  $temps = xml_values($xml, 'temperatura_aria', 'temperatura');
  if (!$temps) return ['id' => $c['id'], 'unreachable' => false, 'noData' => true];
  $lastTemp = end($temps);
  [$tTrend, $tRate] = xml_trend($temps);
  $hum = xml_values($xml, 'umidita_relativa', 'rh');
  [$hTrend, $hRate] = xml_trend($hum);
  $lastHum = $hum ? end($hum) : null;
  $rain = xml_values($xml, 'precipitazione', 'pioggia');
  $lastRain = $rain ? end($rain) : null;
  $maxRain = 0.0;
  if (count($rain) > 1) {
    $d = [];
    for ($i = 1; $i < count($rain); $i++) $d[] = ($rain[$i]['value'] - $rain[$i - 1]['value']) * 4;
    $maxRain = max($d);
  }

  $wind = null;
  if (!empty($c['hasWind'])) {
    preg_match_all('~<vento_al_suolo[^>]*>\s*<data>([^<]+)</data>\s*<v>([^<]+)</v>\s*<vmax>([^<]+)</vmax>\s*<d>([^<]+)</d>~', $xml, $m, PREG_SET_ORDER);
    $w = array_map(fn($x) => ['speed' => (float)$x[2] * 3.6, 'gust' => (float)$x[3] * 3.6, 'dir' => (float)$x[4]], $m);
    if ($w) {
      $last = end($w);
      $last4 = array_slice($w, -4);
      $avg = array_sum(array_column($last4, 'speed')) / count($last4);
      $bf = speedToBeaufort($last['speed']);
      $wind = [
        'direction' => degToCompass($last['dir']), 'directionDegrees' => $last['dir'],
        'speed' => r1($last['speed']), 'beaufort' => $bf['scale'], 'beaufortDescription' => $bf['desc'],
        'windChill' => null, 'feelsLike' => null,
        'averages' => ['min10' => r1($avg), 'min15' => r1($avg), 'min30' => r1($avg), 'min60' => r1($avg)],
        'gusts' => ['lastHour' => r1(max(array_column($last4, 'gust'))), 'today' => r1(max(array_column($w, 'gust'))), 'todayTime' => '—'],
      ];
    }
  }
  $solar = null;
  if (!empty($c['hasSolar'])) {
    $rad = xml_values($xml, 'radiazioneglobale', 'rsg');
    if ($rad) $solar = (int)round(end($rad)['value']);
  }

  return [
    'id' => $c['id'], 'unreachable' => false, 'lastUpdate' => fmt_it($lastTemp['date']),
    'weather' => [
      'temperature' => $lastTemp['value'], 'temperatureTrend' => $tTrend, 'temperatureTrendValue' => $tRate,
      'humidity' => $lastHum['value'] ?? 0, 'humidityTrend' => $hTrend, 'humidityTrendValue' => $hRate,
      'rainIntensity' => $lastRain ? $lastRain['value'] * 4 : 0,
      'dailyExtremes' => [
        'tempMin' => $tmin, 'tempMinTime' => '—', 'tempMax' => $tmax, 'tempMaxTime' => '—',
        'maxGust' => $wind ? $wind['gusts']['today'] : 0, 'maxGustTime' => '—',
        'dailyRain' => $dailyRain, 'maxRainIntensity' => r1(max(0, $maxRain)),
      ],
      'solarRadiation' => $solar,
    ],
    'wind' => $wind,
  ];
}

// ─── PrimieroMeteo (HTML) ───
function parse_primiero(string $html, string $id): array {
  $lastUpdate = spanText($html, 'ajaxdate0') ?? '';
  $temperature = numIn(spanText($html, 'ajaxtemp'));
  $humidity = numIn(spanText($html, 'ajaxhumidity'));
  if ($temperature === null || preg_match('~ore\s*:?\s*$~', $lastUpdate) || $lastUpdate === '') {
    return ['id' => $id, 'unreachable' => false, 'noData' => true];
  }
  if ($humidity !== null && $humidity <= 0 && $temperature == 0) {
    return ['id' => $id, 'unreachable' => false, 'noData' => true];
  }

  $speed = numIn(spanText($html, 'ajaxwind0')) ?? 0.0;
  $compass = firstMatch('~direzione\s+([A-Z]{1,3})~u', $html)[1] ?? 'N';
  $bfNum = firstMatch('~Beaufort:\s*(\d+)~iu', $html)[1] ?? null;
  $bfCalc = speedToBeaufort($speed);
  $bfDesc = firstMatch('~<em>\s*(.*?)\s*-\s*Beaufort~iu', $html)[1] ?? '';

  $avg = function (int $n) use ($html, $speed) {
    $m = firstMatch('~' . $n . ' min(?:</font>)?\s*</td>\s*<td[^>]*>\s*([\d.]+)\s*km/h~iu', $html);
    return $m ? (float)$m[1] : $speed;
  };

  $pBaro = firstMatch('~id="ajaxbaro"[^>]*>\s*([\d.]+)\s*hpa~iu', $html);
  $pArrow = firstMatch('~id="ajaxbaroarrow"[\s\S]*?alt="(Rising|Falling|Steady)\s*([\d.]+)?~iu', $html);
  $pTrend = $pArrow ? (strtolower($pArrow[1]) === 'rising' ? 'rising' : (strtolower($pArrow[1]) === 'falling' ? 'falling' : 'stable')) : 'stable';

  $tMin = firstMatch('~T\.min[\s\S]*?(-?\d+(?:\.\d+)?)\s*' . DEG . '\s*C[\s\S]*?(\d{1,2}:\d{2})~u', $html);
  $tMax = firstMatch('~T\.max[\s\S]*?(-?\d+(?:\.\d+)?)\s*' . DEG . '\s*C[\s\S]*?(\d{1,2}:\d{2})~u', $html);
  $gustDay = firstMatch('~Vento</span>[\s\S]*?(\d+(?:\.\d+)?)\s*km/h[\s\S]*?(\d{1,2}:\d{2})~u', $html);
  $rainDay = firstMatch('~Pioggia</span>[\s\S]*?(\d+(?:\.\d+)?)\s*mm~u', $html);
  $rainMax = firstMatch('~\((\d+(?:\.\d+)?)\s*mm/hr\)~u', $html);
  $gustLast = firstMatch('~ultim.{1,8}ora[\s\S]*?([\d.]+)\s*km/h~iu', $html);
  $gustToday = firstMatch('~oggi</td>[\s\S]*?([\d.]+)\s*km/h[\s\S]*?\((\d{1,2}:\d{2})\)~u', $html);
  $windChill = firstMatch('~windchill[\s\S]*?</td>\s*<td[^>]*>\s*(-?[\d.]+)\s*' . DEG . '~iu', $html);

  $iconName = firstMatch('~id="ajaxconditionicon2"[\s\S]*?<img[^>]*src="[^"]*/([^"/]+)\.png"~iu', $html)[1] ?? 'sereno';
  if (str_contains($iconName, 'sereno')) $icon = (str_contains($iconName, 'sera') || str_contains($iconName, 'notte')) ? '🌙' : '☀️';
  elseif (str_contains($iconName, 'coperto')) $icon = '☁️';
  elseif (str_contains($iconName, 'pioggia') || str_contains($iconName, 'rain')) $icon = '🌧️';
  elseif (str_contains($iconName, 'neve') || str_contains($iconName, 'snow')) $icon = '🌨️';
  else $icon = '⛅';

  $maxGust = $gustDay ? (float)$gustDay[1] : 0.0;

  return [
    'id' => $id, 'unreachable' => false, 'lastUpdate' => $lastUpdate,
    'weather' => [
      'condition' => str_replace('_', ' ', $iconName), 'conditionIcon' => $icon,
      'temperature' => $temperature, 'temperatureTrend' => trendFromGif($html, 'ajaxtemparrow'), 'temperatureTrendValue' => 0,
      'humidity' => $humidity ?? 0, 'humidityTrend' => 'stable', 'humidityTrendValue' => 0,
      'dewPoint' => numIn(spanText($html, 'ajaxdew0')),
      'perceivedTemp' => numIn(spanText($html, 'ajaxapparenttemp')),
      'wetBulb' => numIn(spanText($html, 'ajaxwetbulb')),
      'rainIntensity' => numIn(spanText($html, 'ajaxrainratehr0')) ?? 0,
      'pressure' => $pBaro ? (float)$pBaro[1] : null,
      'pressureTrend' => $pTrend, 'pressureTrendValue' => isset($pArrow[2]) && $pArrow[2] !== '' ? (float)$pArrow[2] : 0,
      'dailyExtremes' => clampExtremes($temperature, $tMin, $tMax, $lastUpdate) + [
        'maxGust' => $maxGust, 'maxGustTime' => $gustDay ? $gustDay[2] : '—',
        'dailyRain' => $rainDay ? (float)$rainDay[1] : 0, 'maxRainIntensity' => $rainMax ? (float)$rainMax[1] : 0,
      ],
    ],
    'wind' => [
      'direction' => $compass, 'directionDegrees' => COMPASS_DEG[$compass] ?? 0, 'speed' => $speed,
      'beaufort' => $bfNum !== null ? (int)$bfNum : $bfCalc['scale'],
      'beaufortDescription' => $bfDesc !== '' ? $bfDesc : $bfCalc['desc'],
      'windChill' => $windChill ? (float)$windChill[1] : null, 'feelsLike' => null,
      'averages' => ['min10' => $avg(10), 'min15' => $avg(15), 'min30' => $avg(30), 'min60' => $avg(60)],
      'gusts' => [
        'lastHour' => $gustLast ? (float)$gustLast[1] : 0,
        'today' => $gustToday ? (float)$gustToday[1] : $maxGust,
        'todayTime' => $gustToday ? $gustToday[2] : '—',
      ],
    ],
  ];
}

// ─── Funivia Rosetta (due riquadri su meteotriveneto.it) ───
function parse_rosetta(string $wx, string $wx4, string $id): array {
  $date = spanText($wx, 'ajaxdate') ?? '';
  $time = spanText($wx, 'ajaxtime') ?? '';
  $lastUpdate = trim("$date $time");
  $temperature = numIn(spanText($wx, 'ajaxtemp'));
  if ($temperature === null || $date === '' || $time === '') return ['id' => $id, 'unreachable' => false, 'noData' => true];
  $humidity = numIn(spanText($wx, 'ajaxhumidity'));
  $dew = spanText($wx, 'ajaxdew');
  $dewPoint = ($dew !== null && $dew !== '' && !str_contains($dew, '%')) ? numIn($dew) : null;
  $baro = numIn(spanText($wx, 'ajaxbaro'));
  $pressure = ($baro !== null && $baro >= 500 && $baro <= 800) ? $baro : null; // 2640 m: 870 hPa non è realistico

  $speed = numIn(spanText($wx, 'ajaxwind')) ?? 0.0;
  $compass = trim(spanText($wx, 'ajaxwinddir') ?? (firstMatch('~direzione\s+([A-Z]{1,3})~u', $wx4)[1] ?? 'N'));
  $calc = speedToBeaufort($speed);
  $bfNum = firstMatch('~Beaufort:\s*(\d+)~iu', $wx4)[1] ?? null;
  $bfDesc = firstMatch('~<em>\s*(.*?)\s*-\s*Beaufort~iu', $wx4)[1] ?? '';
  $avg = function (int $n) use ($wx4, $speed) {
    $m = firstMatch('~' . $n . ' min(?:</font>)?\s*</td>\s*<td[^>]*>\s*([\d.]+)\s*km/h~iu', $wx4);
    return $m ? (float)$m[1] : $speed;
  };

  $tMin = firstMatch('~Minima\s*<span[^>]*>\s*(-?[\d.]+)[^<\d]{0,6}</span>\s*ore\s*(\d{1,2}:\d{2})~iu', $wx);
  $tMax = firstMatch('~Massima\s*<span[^>]*>\s*(-?[\d.]+)[^<\d]{0,6}</span>\s*ore\s*(\d{1,2}:\d{2})~iu', $wx);
  $gustDay = firstMatch('~Raffica\s+vento\s+max\s*<span[^>]*>\s*([\d.]+)\s*km/h[\s\S]*?</span>\s*ore\s*(\d{1,2}:\d{2})~iu', $wx);
  $gustLast = firstMatch('~ultim.{1,8}ora[\s\S]*?([\d.]+)\s*km/?h~iu', $wx4);
  $gustToday = firstMatch('~oggi</td>[\s\S]*?([\d.]+)\s*km/?h[\s\S]*?\((\d{1,2}:\d{2})\)~iu', $wx4);
  $maxGust = $gustDay ? (float)$gustDay[1] : ($gustToday ? (float)$gustToday[1] : 0.0);

  return [
    'id' => $id, 'unreachable' => false, 'lastUpdate' => $lastUpdate,
    'weather' => [
      'condition' => 'rilevazione in quota', 'conditionIcon' => '🏔️',
      'temperature' => $temperature, 'temperatureTrend' => 'stable', 'temperatureTrendValue' => 0,
      'humidity' => $humidity ?? 0, 'humidityTrend' => 'stable', 'humidityTrendValue' => 0,
      'dewPoint' => $dewPoint, 'perceivedTemp' => numIn(spanText($wx, 'ajaxapparenttemp')),
      'wetBulb' => numIn(spanText($wx, 'ajaxwetbulb')), 'rainIntensity' => 0,
      'pressure' => $pressure, 'pressureTrend' => 'stable', 'pressureTrendValue' => 0,
      'dailyExtremes' => clampExtremes($temperature, $tMin, $tMax, $lastUpdate) + [
        'maxGust' => $maxGust, 'maxGustTime' => $gustDay ? $gustDay[2] : ($gustToday ? $gustToday[2] : '—'),
        'dailyRain' => 0, 'maxRainIntensity' => 0,
      ],
    ],
    'wind' => [
      'direction' => $compass, 'directionDegrees' => COMPASS_DEG[$compass] ?? 0, 'speed' => $speed,
      'beaufort' => $bfNum !== null ? (int)$bfNum : $calc['scale'],
      'beaufortDescription' => $bfDesc !== '' ? $bfDesc : $calc['desc'],
      'windChill' => numIn(spanText($wx, 'ajaxwindchill')), 'feelsLike' => null,
      'averages' => ['min10' => $avg(10), 'min15' => $avg(15), 'min30' => $avg(30), 'min60' => $avg(60)],
      'gusts' => ['lastHour' => $gustLast ? (float)$gustLast[1] : 0, 'today' => $maxGust, 'todayTime' => $gustToday ? $gustToday[2] : ($gustDay ? $gustDay[2] : '—')],
    ],
  ];
}

// ─── Weather Underground (Crode Rosse) ───
function parse_wu(string $json): array {
  $data = json_decode($json, true);
  $obs = $data['observations'][0] ?? null;
  if (!$obs) throw new RuntimeException('No observations');
  $m = $obs['metric'] ?? $obs['imperial'] ?? [];
  $when = $obs['obsTimeLocal'] ?? $obs['obsTimeUtc'] ?? 'now';
  try { $lastUpdate = (new DateTime($when))->format('d/m/Y, H:i'); } catch (Throwable $e) { $lastUpdate = date('d/m/Y, H:i'); }
  $temp = $m['temp'] ?? 0;
  $wspd = $m['windSpeed'] ?? 0;
  $bf = speedToBeaufort((float)$wspd);
  return [
    'id' => 'croderosse', 'unreachable' => false, 'lastUpdate' => $lastUpdate,
    'weather' => [
      'condition' => 'Sereno', 'conditionIcon' => '☀️', 'temperature' => $temp,
      'temperatureTrend' => 'stable', 'temperatureTrendValue' => 0,
      'humidity' => $obs['humidity'] ?? 0, 'humidityTrend' => 'stable', 'humidityTrendValue' => 0,
      'dewPoint' => $m['dewpt'] ?? null, 'perceivedTemp' => $m['heatIndex'] ?? $m['windChill'] ?? $temp,
      'wetBulb' => null, 'rainIntensity' => $m['precipRate'] ?? 0,
      'pressure' => $m['pressure'] ?? null, 'pressureTrend' => 'stable', 'pressureTrendValue' => 0,
      'dailyExtremes' => [
        'tempMin' => $temp, 'tempMinTime' => '—', 'tempMax' => $temp, 'tempMaxTime' => '—',
        'maxGust' => $m['windGust'] ?? 0, 'maxGustTime' => '—',
        'dailyRain' => $m['precipTotal'] ?? 0, 'maxRainIntensity' => $m['precipRate'] ?? 0,
      ],
      'visibility' => $obs['visibility'] ?? null, 'uvIndex' => $obs['uv'] ?? null,
    ],
    'wind' => [
      'direction' => degToCompass((float)($obs['winddir'] ?? 0)), 'directionDegrees' => $obs['winddir'] ?? 0,
      'speed' => $wspd, 'beaufort' => $bf['scale'], 'beaufortDescription' => $bf['desc'],
      'windChill' => $m['windChill'] ?? null, 'feelsLike' => $m['windChill'] ?? null,
      'averages' => ['min10' => 0, 'min15' => 0, 'min30' => 0, 'min60' => 0],
      'gusts' => ['lastHour' => $m['windGust'] ?? 0, 'today' => $m['windGust'] ?? 0, 'todayTime' => '—'],
    ],
  ];
}

// ─── Idrometri (floods.it) ───
function parse_hydro(string $json, array $c): array {
  $j = json_decode($json, true);
  $f = $j['features'][0] ?? null;
  $d = $f['properties']['data'] ?? null;
  if (empty($d['timestamp']) || empty($d['value'])) throw new RuntimeException('No data in response');
  $ts = $d['timestamp']; $vals = $d['value'];
  $tzTag = $f['properties']['s']['tz'] ?? null;
  $off = $tzTag ? $tzTag * 60 : 3600;
  $n = count($ts);
  $start = $n - min(96, $n);
  $hist = [];
  for ($i = $start; $i < $n; $i++) $hist[] = ['time' => gmdate('H:i', $ts[$i] + $off), 'level' => $vals[$i], 'flow' => null];
  return [
    'id' => $c['id'], 'unreachable' => false,
    'lastUpdate' => gmdate('d/m/Y \o\r\e H:i', $ts[$n - 1] + $off),
    'currentLevel' => $vals[count($vals) - 1], 'currentFlow' => null, 'history' => $hist,
  ];
}

// ─── Campi neve (MeteoTrentino JSON) ───
function snow_season(): string {
  $y = (int)date('Y'); $m = (int)date('n');
  return (string)($m >= 10 ? $y : $y - 1);
}

function parse_snow(string $json, array $c): array {
  $j = json_decode($json, true);
  if (!is_array($j)) throw new RuntimeException('JSON non valido');
  $obs = $j['osservazioni'] ?? null;
  if (!is_array($obs) || !$obs) return ['id' => $c['id'], 'unreachable' => false, 'history' => [], 'currentDepth' => 0, 'lastUpdate' => ''];
  $hist = [];
  foreach (array_slice($obs, -30) as $o) {
    $date = (new DateTime($o['DataRilievo']))->format('Y-m-d');
    $hs = (float)trim((string)($o['HSnum'] ?? $o['HS'] ?? ''));
    $hnRaw = trim((string)($o['HNnum'] ?? $o['HN'] ?? ''));
    $hist[] = ['date' => $date, 'hs' => $hs, 'hn' => ($hnRaw === '' || $hnRaw === '//') ? null : (float)$hnRaw];
  }
  $last = end($obs);
  return [
    'id' => $c['id'], 'unreachable' => false,
    'lastUpdate' => (new DateTime($last['DataRilievo']))->format('d/m/Y'),
    'currentDepth' => (float)trim((string)($last['HSnum'] ?? $last['HS'] ?? '')),
    'history' => $hist,
  ];
}

// ─── Raccolta ───
function collect(): array {
  $urls = [];
  foreach (XML_STATIONS as $c) $urls['xml:' . $c['id']] = "https://dati.meteotrentino.it/service.asmx/ultimiDatiStazione?codice={$c['code']}";
  foreach (HTML_STATIONS as $c) {
    if ($c['id'] === 'rosetta') { $urls['wx'] = ROSETTA_BASE . '/wx.html'; $urls['wx4'] = ROSETTA_BASE . '/wx4.html'; }
    else $urls['html:' . $c['id']] = "https://www.primierometeo.it/{$c['slug']}/";
  }
  foreach (HYDROMETERS as $c) $urls['hy:' . $c['id']] = "https://www.floods.it/api/v1/monitoring/{$c['sensorId']}.json";
  $season = snow_season();
  foreach (SNOW_STATIONS as $c) $urls['sn:' . $c['id']] = "https://dati.meteotrentino.it/service.asmx/rilieviNeveStagionaliUnaStazioneValangheJson?stagione=$season&camponeve={$c['campo']}";
  if (WU_API_KEY !== '') $urls['wu'] = 'https://api.weather.com/v2/pws/observations/current?stationId=' . urlencode(WU_STATION_ID) . '&format=json&units=m&apiKey=' . urlencode(WU_API_KEY);

  $r = fetch_all($urls);
  $safe = function (string $id, callable $fn) {
    try { return $fn(); } catch (Throwable $e) { return err_station($id, $e); }
  };

  $html = [];
  foreach (HTML_STATIONS as $c) {
    $html[] = $safe($c['id'], function () use ($c, $r) {
      if ($c['id'] === 'rosetta') return parse_rosetta(to_utf8(body_of($r['wx'])), to_utf8(body_of($r['wx4'])), 'rosetta');
      return parse_primiero(to_utf8(body_of($r['html:' . $c['id']])), $c['id']);
    });
  }
  $xml = [];
  foreach (XML_STATIONS as $c) $xml[] = $safe($c['id'], fn() => parse_xml_station(to_utf8(body_of($r['xml:' . $c['id']])), $c));
  $wu = isset($r['wu'])
    ? $safe('croderosse', fn() => parse_wu(body_of($r['wu'])))
    : ['id' => 'croderosse', 'unreachable' => true, 'error' => 'WU_API_KEY non impostata'];
  $hy = []; foreach (HYDROMETERS as $c) $hy[] = $safe($c['id'], fn() => parse_hydro(body_of($r['hy:' . $c['id']]), $c));
  $sn = []; foreach (SNOW_STATIONS as $c) $sn[] = $safe($c['id'], fn() => parse_snow(body_of($r['sn:' . $c['id']]), $c));

  return [
    'success' => true, 'timestamp' => gmdate('c'),
    'stations' => array_merge($html, $xml, [$wu]),
    'hydrometers' => $hy, 'snowStations' => $sn,
  ];
}

function encode(array $d): string {
  return json_encode($d, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES | JSON_INVALID_UTF8_SUBSTITUTE | JSON_PARTIAL_OUTPUT_ON_ERROR);
}

function refresh_cache(string $file): ?string {
  $lock = fopen($file . '.lock', 'c');
  if (!$lock || !flock($lock, LOCK_EX | LOCK_NB)) { // un altro visitatore sta già raccogliendo
    if ($lock) fclose($lock);
    return null;
  }
  try {
    $data = collect();
    $ok = array_filter($data['stations'], fn($s) => empty($s['unreachable']));
    if (!$ok && is_file($file)) { // nessuna fonte raggiungibile: meglio il dato vecchio che uno vuoto
      touch($file);
      return file_get_contents($file);
    }
    $body = encode($data);
    file_put_contents($file . '.tmp', $body);
    rename($file . '.tmp', $file);
    return $body;
  } finally {
    flock($lock, LOCK_UN);
    fclose($lock);
  }
}

function main(): void {
  $file = __DIR__ . '/weather-cache.json';
  header('Content-Type: application/json; charset=utf-8');
  header('Access-Control-Allow-Origin: ' . ALLOWED_ORIGIN);
  header('Cache-Control: no-cache');
  $age = is_file($file) ? time() - filemtime($file) : PHP_INT_MAX;

  if ($age < CACHE_SECONDS) { readfile($file); return; }

  // Dato un po' vecchio: lo servo subito e aggiorno dopo aver chiuso la risposta
  if ($age < 900 && function_exists('fastcgi_finish_request')) {
    readfile($file);
    fastcgi_finish_request();
    refresh_cache($file);
    return;
  }

  $body = refresh_cache($file);
  if ($body === null) { // raccolta in corso da un altro visitatore: aspetta fino a 20 s
    for ($i = 0; $i < 40 && !($body = (is_file($file) && time() - filemtime($file) < CACHE_SECONDS) ? file_get_contents($file) : null); $i++) usleep(500000);
    if ($body === null && is_file($file)) $body = file_get_contents($file);
  }
  if ($body === null) {
    http_response_code(500);
    echo json_encode(['success' => false, 'error' => 'raccolta dati non riuscita']);
    return;
  }
  echo $body;
}

if (!defined('SWM_TEST')) main();
