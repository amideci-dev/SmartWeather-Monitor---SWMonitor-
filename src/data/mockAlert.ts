export type AlertLevel = 'gialla' | 'arancione' | 'rossa' | null;

export interface Alert {
  level: AlertLevel;
  title: string;
  text: string;
  pdfUrl: string | null;
  sourceUrl: string;
}

// Mock current alert matching the real one on meteotrentino.it
export const mockAlert: Alert = {
  level: 'gialla',
  title: 'ALLERTA ORDINARIA (gialla)',
  text: `Nella serata odierna è atteso il passaggio di un fronte freddo con nevicate anche a quote medio basse e forti raffiche in prossimità dei rovesci.
Nella notte tra oggi e giovedì i venti tenderanno a ruotare ed intensificare da Nord con raffiche molto forti soprattutto nelle zone esposte in montagna dove le raffiche potranno localmente superare i 120 km/h. Nelle valli, specie in quelle orientate Nord - Sud, sono previste raffiche forti o molto forti di foehn; localmente, anche nelle valli, potranno essere misurate raffiche superiori a 80 - 90 km/h soprattutto al pomeriggio sera di giovedì. Venerdì i venti da nord persisteranno forti o molto forti.
A seguito delle previsioni e in base alle valutazioni effettuate, si ritengono possibili, dal tardo pomeriggio odierno (mercoledì 25 marzo 2026), criticità dovute principalmente a forti raffiche di vento.`,
  pdfUrl: 'https://avvisi.protezionecivile.tn.it/PUB/PDF/4347/20260325_allerta_ordinaria_gialla.pdf',
  sourceUrl: 'https://www.meteotrentino.it/contatti-e-informazioni/sistema-di-allerta-provinciale/',
};
