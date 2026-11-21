import { ForecastLocation, ForecastModel } from '@/types/forecast';

export const forecastLocations: ForecastLocation[] = [
  {
    id: 'san-martino',
    name: 'San Martino di Castrozza',
    shortName: 'San Martino',
    altitude: 1450,
    latitude: 46.262074,
    longitude: 11.801482,
  },
  {
    id: 'passo-rolle',
    name: 'Passo Rolle',
    shortName: 'Passo Rolle',
    altitude: 1984,
    latitude: 46.295908,
    longitude: 11.782634,
  },
];

export const forecastModels: ForecastModel[] = [
  {
    id: 'ecmwf_ifs025',
    name: 'ECMWF IFS Ensemble',
    shortName: 'ECMWF',
    provider: 'Centro europeo per le previsioni meteorologiche a medio termine',
    description: '50 membri perturbati e una corsa di controllo per valutare scenari e incertezza.',
    kind: 'ensemble',
  },
  {
    id: 'gfs_seamless',
    name: 'NOAA GFS Ensemble',
    shortName: 'GFS',
    provider: 'National Oceanic and Atmospheric Administration',
    description: '30 membri perturbati e una corsa di controllo del modello globale GFS.',
    kind: 'ensemble',
  },
  {
    id: 'icon_seamless',
    name: 'DWD ICON EPS',
    shortName: 'ICON',
    provider: 'Deutscher Wetterdienst',
    description: '39 membri perturbati e una corsa di controllo, utili per il confronto sulla scala alpina.',
    kind: 'ensemble',
  },
  {
    id: 'meteofrance_arome_france_hd',
    name: 'Météo-France AROME HD',
    shortName: 'AROME',
    provider: 'Météo-France',
    description: 'Traiettoria deterministica ad alta risoluzione, particolarmente utile nel breve termine.',
    kind: 'deterministic',
  },
];
