import { InfoPageLayout, Section, ExternalLink } from '@/components/layout/InfoPageLayout';

const SOURCES: { name: string; url: string; what: string }[] = [
  {
    name: 'MeteoTrentino',
    url: 'https://www.meteotrentino.it',
    what: 'Stazioni di Prà delle Nasse, Passo Rolle, Passo Valles, Lago di Calaita e Ghiacciaio della Fradusta; rilievi dei campi neve di San Martino di Castrozza e Passo Rolle; alcune webcam.',
  },
  {
    name: 'PrimieroMeteo',
    url: 'https://www.primierometeo.it',
    what: 'Stazioni di Colverde, Punta Ces, Colbricon / Pian delle Cartucce, Passo Rolle e Arrivo Seggiovia Paradiso.',
  },
  {
    name: 'MeteoTriveneto',
    url: 'https://www.meteotriveneto.it',
    what: 'Stazione di Arrivo Funivia Rosetta.',
  },
  {
    name: 'Weather Underground',
    url: 'https://www.wunderground.com',
    what: 'Stazione meteo amatoriale di Via Crode Rosse (rete di stazioni personali).',
  },
  {
    name: 'floods.it',
    url: 'https://www.floods.it',
    what: 'Idrometri di San Martino di Castrozza e Fiera di Primiero.',
  },
  {
    name: 'Open-Meteo',
    url: 'https://open-meteo.com',
    what: 'Previsioni dei modelli ensemble e deterministici, usate per le curve di temperatura, le precipitazioni, la sintesi giornaliera e la stima della neve fresca.',
  },
  {
    name: 'Protezione civile della Provincia autonoma di Trento',
    url: 'https://avvisi.protezionecivile.tn.it/',
    what: 'Allerte meteo ufficiali (vedi la pagina Info).',
  },
  {
    name: 'VRealCam e altri fornitori di webcam',
    url: 'https://vrealcam.com',
    what: 'Immagini delle webcam degli impianti e dei rifugi. Altre immagini arrivano da Feratel, SkylineWebcams, Trilogis, San Martino e Rolle e dalle webcam di MeteoTrentino.',
  },
  {
    name: 'Mapy.com e Windy',
    url: 'https://windy.com',
    what: 'Mappa del territorio e radar delle precipitazioni.',
  },
];

const About = () => (
  <InfoPageLayout
    title="About"
    subtitle="Da dove vengono i dati di Smart Weather Monitor e come vengono raccolti."
  >
    <Section title="Il progetto">
      <p>
        Smart Weather Monitor mette in un unico posto le informazioni meteo del territorio di San Martino di Castrozza,
        Passo Rolle e del Primiero: stazioni, vento, neve, torrenti, webcam e previsioni.
      </p>
    </Section>

    <Section title="Come vengono raccolti i dati">
      <p>
        Il progetto non possiede stazioni e non produce misure: tutti i dati sono <strong>raccolti automaticamente</strong> da
        fonti che li pubblicano online e li rendono liberamente consultabili. Un programma legge periodicamente le pagine e
        i servizi pubblici elencati sotto, mette in ordine i valori e li mostra qui. Per non appesantire i server delle fonti,
        i dati vengono riletti al massimo ogni pochi minuti.
      </p>
      <p>
        Ogni dato appartiene a chi lo pubblica. Qui è riportato per comodità di consultazione, con il rimando alla fonte, e
        non viene venduto né modificato nel significato.
      </p>
    </Section>

    <Section title="Le fonti">
      <ul className="space-y-3">
        {SOURCES.map((s) => (
          <li key={s.name} className="rounded-md border p-3">
            <ExternalLink href={s.url}>{s.name}</ExternalLink>
            <p className="mt-1 text-xs text-muted-foreground">{s.what}</p>
          </li>
        ))}
      </ul>
    </Section>

    <Section title="Cosa tenere presente">
      <ul className="list-disc space-y-1 pl-5">
        <li>I valori sono quelli pubblicati dalle fonti, con il loro ritardo e i loro limiti: non sono verificati da questo sito.</li>
        <li>Se una stazione smette di trasmettere compare "Nessun dato disponibile" invece di numeri inventati.</li>
        <li>Le webcam cambiano immagine ogni ora (o più spesso, a seconda del fornitore).</li>
        <li>Le previsioni sono scenari dei modelli matematici, non un bollettino ufficiale.</li>
      </ul>
    </Section>

    <p className="border-t pt-4 text-xs text-muted-foreground">
      2026 - Vibecoded by Amideci. Per segnalazioni o correzioni sulle fonti, scrivi a chi gestisce il sito.
    </p>
  </InfoPageLayout>
);

export default About;
