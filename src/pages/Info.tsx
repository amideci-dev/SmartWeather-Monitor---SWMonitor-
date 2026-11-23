import { InfoPageLayout, Section, ExternalLink } from '@/components/layout/InfoPageLayout';
import { AlertSeverity, WIND_THRESHOLDS } from '@/lib/windAlerts';

const SEVERITY_LABEL: Record<AlertSeverity, { name: string; dot: string }> = {
  warning: { name: 'Attenzione (giallo)', dot: 'bg-yellow-500' },
  high: { name: 'Alta (arancione)', dot: 'bg-orange-500' },
  critical: { name: 'Critica (rosso)', dot: 'bg-red-500' },
};

const Info = () => (
  <InfoPageLayout
    title="Info"
    subtitle="Come funzionano gli avvisi, da dove arrivano le allerte meteo e cosa significano."
  >
    <Section title="Due tipi di avviso">
      <p>
        In alto a destra trovi due indicatori diversi, che non vanno confusi:
      </p>
      <ul className="list-disc space-y-2 pl-5">
        <li>
          <strong>Allerta</strong> (il badge colorato): è l'allerta meteo <em>ufficiale</em> diramata per il territorio.
          La decide e la pubblica la Protezione civile, non questo sito.
        </li>
        <li>
          <strong>Campanello</strong>: sono gli avvisi calcolati <em>da questo sito</em> sulle misure delle stazioni e degli
          idrometri, in base alle soglie descritte qui sotto. Sono un supporto informativo e non sostituiscono l'allerta ufficiale.
        </li>
      </ul>
    </Section>

    <Section title="Allerta meteo ufficiale: da dove arriva">
      <p>
        Il sistema di allerta della Provincia autonoma di Trento è gestito dalla Protezione civile provinciale, con il supporto
        di MeteoTrentino. Gli avvisi e i bollettini sono pubblicati su{' '}
        <ExternalLink href="https://www.meteotrentino.it/contatti-e-informazioni/sistema-di-allerta-provinciale/">
          meteotrentino.it
        </ExternalLink>{' '}
        e sul portale degli{' '}
        <ExternalLink href="https://avvisi.protezionecivile.tn.it/">avvisi della Protezione civile</ExternalLink>.
      </p>
      <p>I livelli seguono la scala nazionale, dal più basso al più alto:</p>
      <ul className="space-y-2">
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-green-500" />
          <span><strong>Verde</strong>: nessuna allerta, condizioni ordinarie.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-yellow-500" />
          <span><strong>Gialla - ordinaria</strong>: possibili fenomeni localizzati; serve attenzione, soprattutto in montagna e vicino ai corsi d'acqua.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-orange-500" />
          <span><strong>Arancione - moderata</strong>: fenomeni più diffusi e intensi, con possibili danni e disagi.</span>
        </li>
        <li className="flex items-start gap-2">
          <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full bg-red-500" />
          <span><strong>Rossa - elevata</strong>: fenomeni intensi e diffusi, con rischio elevato per persone e cose.</span>
        </li>
      </ul>
      <p className="rounded-md border border-yellow-500/40 bg-yellow-500/10 p-3 text-xs">
        <strong>Nota:</strong> al momento il badge "Allerta" di questo sito viene aggiornato a mano e non è ancora collegato
        in automatico al bollettino. Per decisioni che riguardano la sicurezza fa fede sempre il sito ufficiale.
      </p>
    </Section>

    <Section title="Soglie del vento">
      <p>
        Il sito confronta la velocità del vento con la scala Beaufort, la stessa della scheda del vento. Un avviso compare
        quando la <strong>velocità attuale</strong> oppure la <strong>raffica massima di oggi</strong> rientra in una di queste fasce:
      </p>
      <div className="overflow-hidden rounded-md border">
        <table className="w-full text-left text-xs">
          <thead className="bg-muted/60 text-muted-foreground">
            <tr>
              <th className="px-3 py-2 font-semibold">Fascia</th>
              <th className="px-3 py-2 font-semibold">Velocità</th>
              <th className="px-3 py-2 font-semibold">Livello</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {WIND_THRESHOLDS.map((t) => (
              <tr key={t.label}>
                <td className="px-3 py-2 font-medium">{t.label}</td>
                <td className="px-3 py-2 font-mono">
                  {Number.isFinite(t.maxSpeed) ? `${t.minSpeed} - ${t.maxSpeed} km/h` : `da ${t.minSpeed} km/h`}
                </td>
                <td className="px-3 py-2">
                  <span className="inline-flex items-center gap-1.5">
                    <span className={`h-2 w-2 rounded-full ${SEVERITY_LABEL[t.severity].dot}`} />
                    {SEVERITY_LABEL[t.severity].name}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p>
        Un avviso è <strong>in corso</strong> se riguarda il vento attuale o una raffica degli ultimi 30 minuti: è quello che
        compare nella barra colorata in cima alla pagina. Le raffiche più vecchie restano nel campanello con l'etichetta
        "passato" e l'orario in cui sono avvenute.
      </p>
    </Section>

    <Section title="Livello dei torrenti">
      <p>
        Per ogni idrometro si confrontano le ultime due misure (circa 30 minuti) con la media delle due ore precedenti. Se il
        livello è salito rispetto a quella media, parte un avviso:
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li><strong>da +30%</strong>: livello in aumento (giallo)</li>
        <li><strong>da +60%</strong>: aumento marcato (arancione)</li>
        <li><strong>da +100%</strong>: il livello è almeno raddoppiato (rosso)</li>
      </ul>
      <p>
        Servono almeno cinque misure, altrimenti l'avviso non viene calcolato. I torrenti di montagna con livelli
        molto bassi possono dare percentuali alte anche per piccole variazioni: guarda sempre anche il valore in metri.
      </p>
    </Section>

    <Section title="Quando una stazione non genera avvisi">
      <p>
        Le stazioni senza dati, ferme o non raggiungibili non producono mai avvisi: il sito non usa valori inventati o
        segnaposto. Se una stazione mostra "Nessun dato disponibile", i suoi numeri non contano nel campanello.
      </p>
    </Section>

    <Section title="Notifiche">
      <p>
        Dal campanello puoi attivare le notifiche del browser: ricevi un avviso quando ne compare uno nuovo (vento o
        torrente), senza ripetizioni per lo stesso evento nelle tre ore successive.
      </p>
      <ul className="list-disc space-y-1 pl-5">
        <li>I dati si aggiornano ogni 5 minuti: le notifiche arrivano solo mentre l'app è aperta, anche in secondo piano.</li>
        <li>Se chiudi del tutto l'app o il browser, non ne arrivano.</li>
        <li>Su iPhone funzionano solo dopo aver aggiunto il sito alla schermata Home e aperto l'app da lì.</li>
        <li>Per disattivarle basta spegnere l'interruttore nel campanello.</li>
      </ul>
    </Section>

    <p className="border-t pt-4 text-xs text-muted-foreground">
      Smart Weather Monitor è un supporto informativo per chi vive e frequenta il territorio. Non sostituisce i bollettini
      ufficiali e non va usato come unica fonte per decisioni di sicurezza.
    </p>
  </InfoPageLayout>
);

export default Info;
