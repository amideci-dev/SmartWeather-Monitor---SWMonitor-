#!/usr/bin/env python3
"""Incrocia le stazioni di SWMonitor con piste e impianti di OpenStreetMap (gli stessi dati di OpenPisteMap).

Uso:   python3 check_piste.py            (scarica da Overpass)
       python3 check_piste.py dati.json  (usa un file Overpass già scaricato)
Solo libreria standard. Per ogni stazione stampa: dentro un'area sci? pista più vicina, impianto più vicino.
"""
import json, math, sys, urllib.parse, urllib.request

STATIONS = [
    ('colverde', 'Colverde', 1500, 46.264223, 11.805125),
    ('puntaces', 'Punta Ces', 2230, 46.267872, 11.759757),
    ('colbricon', 'Arrivo Colbricon Express / Pian delle Cartucce', 1927, 46.273753, 11.767754),
    ('passorolle', 'Passo Rolle', 1984, 46.295908, 11.782634),
    ('rosetta', 'Funivia Rosetta', 2609, 46.264776, 11.833042),
    ('pradellnasse', 'Prà delle Nasse', 1535, 46.262108, 11.796740),
    ('paradiso', 'Arrivo Seggiovia Paradiso', 2180, 46.287545, 11.786587),
    ('passorollemt', 'Passo Rolle MT', 1995, 46.297367, 11.787631),
    ('passovalles', 'Passo Valles', 2032, 46.338614, 11.800752),
    ('calaita', 'Lago di Calaita', 1605, 46.200611, 11.793472),
    ('fradusta', 'Ghiacciaio della Fradusta', 2720, 46.255111, 11.871722),
    ('croderosse', 'Via Crode Rosse', 1483, 46.260598, 11.809189),
    ('snow-sanmartino', 'Campo neve San Martino', 1470, 46.262108, 11.79674),
    ('snow-passorolle', 'Campo neve Passo Rolle', 2012, 46.297367, 11.787631),
]
BBOX = (46.15, 11.65, 46.38, 11.95)  # sud, ovest, nord, est
MIRRORS = ['https://overpass-api.de/api/interpreter', 'https://overpass.kumi.systems/api/interpreter',
           'https://overpass.private.coffee/api/interpreter']
QUERY = """[out:json][timeout:60];
(way["piste:type"~"^(downhill|nordic|snow_park|sled|skitour)$"]({b});
 way["landuse"="winter_sports"]({b});
 way["aerialway"]({b}););
out tags geom;""".format(b=','.join(map(str, BBOX)))


def fetch():
    body = urllib.parse.urlencode({'data': QUERY}).encode()
    last = None
    for url in MIRRORS:
        try:
            req = urllib.request.Request(url, data=body, headers={'User-Agent': 'SWMonitor-check/1.0'})
            with urllib.request.urlopen(req, timeout=90) as r:
                return json.load(r)
        except Exception as e:  # prova il mirror successivo
            last = e
            print(f'  {url}: {e}', file=sys.stderr)
    raise SystemExit(f'Overpass non raggiungibile: {last}')


def proj(lat, lon, lat0):
    return (lon * 111320 * math.cos(math.radians(lat0)), lat * 110540)


def dist_point_seg(p, a, b):
    ax, ay = a; bx, by = b; px, py = p
    dx, dy = bx - ax, by - ay
    t = 0 if dx == dy == 0 else max(0, min(1, ((px - ax) * dx + (py - ay) * dy) / (dx * dx + dy * dy)))
    return math.hypot(px - (ax + t * dx), py - (ay + t * dy))


def inside(p, poly):
    x, y = p; c = False
    for i in range(len(poly)):
        x1, y1 = poly[i]; x2, y2 = poly[(i + 1) % len(poly)]
        if (y1 > y) != (y2 > y) and x < (x2 - x1) * (y - y1) / (y2 - y1) + x1:
            c = not c
    return c


def analyse(data):
    ways = []
    for el in data.get('elements', []):
        if el.get('type') != 'way' or not el.get('geometry'):
            continue
        t = el.get('tags', {})
        pts = [(g['lat'], g['lon']) for g in el['geometry']]
        closed = len(pts) > 3 and pts[0] == pts[-1]
        kind = 'lift' if 'aerialway' in t and t.get('aerialway') not in ('station', 'pylon') else \
               'area' if t.get('landuse') == 'winter_sports' else \
               'piste' if 'piste:type' in t else None
        if kind:
            ways.append(dict(kind=kind, name=t.get('name') or t.get('ref') or '(senza nome)',
                             detail=t.get('piste:difficulty') or t.get('aerialway') or t.get('piste:type', ''),
                             ptype=t.get('piste:type', ''), pts=pts, closed=closed or t.get('area') == 'yes'))
    print(f'Elementi letti: {sum(w["kind"]=="piste" for w in ways)} piste, '
          f'{sum(w["kind"]=="lift" for w in ways)} impianti, {sum(w["kind"]=="area" for w in ways)} aree sci\n')
    for sid, name, alt, lat, lon in STATIONS:
        p = proj(lat, lon, lat)
        best = {}
        in_area = []
        for w in ways:
            xy = [proj(a, b, lat) for a, b in w['pts']]
            d = min(dist_point_seg(p, xy[i], xy[i + 1]) for i in range(len(xy) - 1))
            if w['closed'] and len(xy) > 3 and inside(p, xy):
                d = 0
                if w['kind'] in ('area', 'piste'):
                    in_area.append(w['name'])
            k = w['kind']
            if k not in best or d < best[k][0]:
                best[k] = (d, w)
        print(f'■ {name}  [{sid}, {alt} m]')
        if in_area:
            print('   DENTRO area:', ', '.join(sorted(set(in_area))[:4]))
        for k, label in (('piste', 'pista'), ('lift', 'impianto'), ('area', 'area sci')):
            if k in best:
                d, w = best[k]
                print(f'   {label:9s} più vicin{"a" if k != "lift" else "o"}: {w["name"]} ({w["detail"]}) a {d:.0f} m')
        print()


if __name__ == '__main__':
    analyse(json.load(open(sys.argv[1])) if len(sys.argv) > 1 else fetch())
