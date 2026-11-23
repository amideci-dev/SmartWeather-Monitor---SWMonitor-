export interface Webcam {
  id: string;
  name: string;
  url: string;
  embedUrl?: string; // static image URL for embed (e.g. skylinewebcams)
  externalUrl?: string; // link to open externally if different from url
  stationId: string | null;
  lat?: number; // senza coordinate la webcam compare nell'elenco ma non sulla mappa
  lng?: number;
  refreshMinutes?: number; // ogni quanto cambia l'immagine (default 5)
}

const vrealcam = (area: string, cam: string) => `https://vrealcam.com/c/${area}/h/${cam}/latest.jpg`;

/** Webcams linked to weather stations */
export const stationWebcams: Webcam[] = [
  {
    id: 'cam-colverde',
    name: 'Colverde',
    url: vrealcam('san-martino', 'col-verde'),
    refreshMinutes: 60,
    stationId: 'colverde',
    lat: 46.264223,
    lng: 11.805125,
  },
  {
    id: 'cam-puntaces',
    name: 'Punta Ces',
    url: vrealcam('san-martino', 'punta-ces'),
    refreshMinutes: 60,
    stationId: 'puntaces',
    lat: 46.268,
    lng: 11.798,
  },
  {
    id: 'cam-colbricon',
    name: 'Arrivo Colbricon Express',
    url: 'https://wtvpict.feratel.com/picture/35/6381/ab568211-7f1b-4a3e-bb81-f6eb44ae272d.jpeg?xx=v5&dcsdesign=feratel4&design=noxdesign&dcsdesign=feratel4',
    stationId: 'colbricon',
    lat: 46.277,
    lng: 11.797,
  },
  {
    id: 'cam-passorolle',
    name: 'Passo Rolle - Cimon della Pala',
    url: vrealcam('passo-rolle', 'cimon-della-pala'),
    refreshMinutes: 60,
    stationId: 'passorolle',
    lat: 46.2964,
    lng: 11.7868,
  },
  {
    id: 'cam-pradellnasse',
    name: 'Prà delle Nasse',
    url: 'https://contenuti.meteotrentino.it/dati-meteo/webcam/T450_last.jpg',
    stationId: 'pradellnasse',
    lat: 46.2615,
    lng: 11.7937,
  },
  {
    id: 'cam-passovalles',
    name: 'Passo Valles',
    url: 'https://vit.trilogis.it/cam/cam112.jpg',
    stationId: 'passovalles',
    lat: 46.3372,
    lng: 11.7978,
  },
  {
    id: 'cam-calaita',
    name: 'Lago di Calaita',
    url: 'https://contenuti.meteotrentino.it/dati-meteo/webcam/T429_last.jpg',
    stationId: 'calaita',
    lat: 46.2222,
    lng: 11.7936,
  },
];

/** Standalone webcams (not linked to any station) */
export const standaloneWebcams: Webcam[] = [
  {
    id: 'cam-tognola-baby',
    name: 'Tognola - Baby Tognola',
    url: vrealcam('tognola-rododendro', 'baby-tognola'),
    refreshMinutes: 60,
    stationId: null,
  },
  {
    id: 'cam-tognola-scandola',
    name: 'Tognola - Seggiovia Scandola',
    url: vrealcam('tognola-rododendro', 'seggiovia-scandola'),
    refreshMinutes: 60,
    stationId: null,
  },
  {
    id: 'cam-tognola-malghetta',
    name: 'Tognola - Malghetta Tognola',
    url: vrealcam('tognola-rododendro', 'malghetta-tognola'),
    refreshMinutes: 60,
    stationId: null,
  },
  {
    id: 'cam-tognola-cigolera',
    name: 'Tognola - Seggiovia Cigolera / Cima Tognola',
    url: vrealcam('tognola-rododendro', 'seggiovia-cigolera-cima-tognola'),
    refreshMinutes: 60,
    stationId: null,
  },
  {
    id: 'cam-malga-valcigolera',
    name: 'Malga Valcigolera',
    url: vrealcam('san-martino', 'malga-valcigolera'),
    refreshMinutes: 60,
    stationId: null,
  },
  {
    id: 'cam-malga-fosse',
    name: 'Malga Fosse',
    url: vrealcam('san-martino', 'malga-fosse'),
    refreshMinutes: 60,
    stationId: null,
  },
  {
    id: 'cam-san-martino',
    name: 'San Martino di Castrozza',
    url: vrealcam('san-martino', 'san-martino'),
    refreshMinutes: 60,
    stationId: null,
  },
  {
    id: 'cam-passorolle-puntaces',
    name: 'Passo Rolle - Punta Ces',
    url: vrealcam('passo-rolle', 'punta-ces'),
    refreshMinutes: 60,
    stationId: null,
  },
  {
    id: 'cam-malgacolverde-tognola',
    name: 'Malga Col Verde - Tognola Ski Area',
    url: vrealcam('malga-col-verde', 'tognola-ski-area'),
    refreshMinutes: 60,
    stationId: null,
  },
  {
    id: 'cam-malgacolverde-puntaces',
    name: 'Malga Col Verde - Punta Ces',
    url: vrealcam('malga-col-verde', 'punta-ces'),
    refreshMinutes: 60,
    stationId: null,
  },
  {
    id: 'cam-sciovia-nasse',
    name: 'Sciovia Prà delle Nasse',
    url: 'https://www.sanmartinorolle.it/webcam/1/image1.jpg',
    stationId: null,
    lat: 46.263503,
    lng: 11.79697,
  },
  {
    id: 'cam-hotel-rosetta',
    name: 'San Martino Centro / Hotel Rosetta',
    embedUrl: 'https://embed.skylinewebcams.com/img/1203.jpg',
    externalUrl: 'https://www.skylinewebcams.com/it/webcam/italia/trentino-alto-adige/trento/san-martino-di-castrozza.html',
    url: 'https://embed.skylinewebcams.com/img/1203.jpg',
    stationId: null,
    lat: 46.262074,
    lng: 11.801482,
  },
  {
    id: 'cam-hotel-sayonara',
    name: 'Hotel Sayonara / SS50',
    url: 'https://vit.trilogis.it/cam/cam87.jpg',
    stationId: null,
    lat: 46.25746,
    lng: 11.80259,
  },
];

export const allWebcams: Webcam[] = [...stationWebcams, ...standaloneWebcams];
