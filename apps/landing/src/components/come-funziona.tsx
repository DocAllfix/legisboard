import { formattaIt } from "@legisboard/engine";
import { Codice, PastigliaDominio, Scadenza, StatoLavoroEtichetta } from "@legisboard/ui/stato";
import { ADEMPIMENTI_GDPR, AGENDA, ESEMPIO_ASSESSMENT, OGGI_ISO } from "@/lib/dati";

// COME FUNZIONA, MOSTRATO E NON RACCONTATO _(2026-09-29)_.
//
// La prima versione era tre numerali enormi con un paragrafo sotto: lo schema più riconoscibile
// delle landing fatte in serie, e l'unico punto della pagina che parlava del prodotto senza
// mostrarlo. Ora ogni passo porta il suo oggetto, fatto con i componenti veri e i dati della
// demo, e i passi stanno su un binario: un filo che li lega, con il numero piccolo sul nodo.
//
//   01  una riga d'assessment: «Da fare» diventa «Completata» mentre la sezione entra nello
//       schermo, e la scadenza compare calcolata. È il gesto dell'utente e la risposta del motore;
//   02  l'agenda: scadenze di decreti diversi in un elenco solo, per data;
//   03  la copertina del fascicolo, la stessa carta dell'eroe: il racconto si chiude dove è
//       cominciato.
//
// Senza animazioni legate allo scorrimento (o con il movimento ridotto) la riga mostra subito lo
// stato finale: la frase resta vera anche ferma.

const CARTA = "rounded-lg border bg-surface p-4 text-sm shadow-sm";

function Riga() {
  const e = ESEMPIO_ASSESSMENT;
  if (!e) return null;
  return (
    <div className={`${CARTA} passo-riga`}>
      <div className="flex items-center gap-2">
        <Codice codice={e.codice} />
        <span className="min-w-0 flex-1 truncate font-medium">{e.titolo}</span>
      </div>
      <dl className="mt-4 grid grid-cols-[auto_1fr] items-center gap-x-4 gap-y-2.5 text-xs">
        <dt className="text-muted-foreground">Lavoro</dt>
        <dd className="relative h-6">
          <span className="passo-prima absolute inset-y-0 left-0 flex items-center">
            <StatoLavoroEtichetta stato="Da fare" />
          </span>
          <span className="passo-dopo absolute inset-y-0 left-0 flex items-center">
            <StatoLavoroEtichetta stato="Completata" />
          </span>
        </dd>
        <dt className="text-muted-foreground">Periodicità</dt>
        <dd>{e.periodicita}</dd>
        <dt className="text-muted-foreground">Scadenza</dt>
        <dd className="passo-dopo">
          <Scadenza data={e.scadenza} giorni={e.giorni} statoScadenza={e.statoScadenza} />
        </dd>
      </dl>
      <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">La data non si scrive: si calcola.</p>
    </div>
  );
}

function Agenda() {
  return (
    <div className={CARTA}>
      <p className="text-micro font-semibold tracking-widest text-muted-foreground uppercase">
        Agenda · tre decreti
      </p>
      <ul className="mt-3 divide-y">
        {AGENDA.map((r) => (
          <li key={`${r.dominio}:${r.codice}`} className="flex items-center gap-2 py-2">
            <PastigliaDominio dominio={r.dominio} />
            <Codice codice={r.codice} />
            <span className="ml-auto">
              <Scadenza data={r.scadenza} giorni={r.giorni} statoScadenza={r.statoScadenza} />
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Copertina() {
  return (
    <div className={`${CARTA} p-5`}>
      <div className="flex items-baseline justify-between gap-3 border-b-2 border-foreground pb-2">
        <span className="text-micro font-semibold tracking-widest uppercase">Il vostro studio</span>
        <span className="text-micro text-muted-foreground">Fascicolo ispettivo</span>
      </div>
      <p className="mt-2 font-mono text-micro text-muted-foreground tabular-nums">
        rilevazione del {formattaIt(OGGI_ISO)}
      </p>
      <p className="mt-6 text-base leading-snug font-semibold tracking-tight">
        Garante per la protezione dei dati personali
      </p>
      <p className="mt-1 text-xs text-muted-foreground">Fondiaria Meccanica Verdi S.p.A.</p>
      <div className="mt-5 flex items-end justify-between border-t pt-3">
        <div>
          <p className="text-micro text-muted-foreground">Adempimenti GDPR</p>
          <p className="font-mono text-cifra-sm leading-none tabular-nums">{ADEMPIMENTI_GDPR}</p>
        </div>
        <span className="rounded-sm border px-1.5 py-0.5 font-mono text-micro text-muted-foreground">
          PDF
        </span>
      </div>
    </div>
  );
}

const PASSI = [
  {
    titolo: "Segnate lo stato del lavoro",
    testo:
      "Adempimento per adempimento. La scadenza non la scrivete: il motore la calcola dalla periodicità e dall'ultima esecuzione.",
    oggetto: <Riga />,
  },
  {
    titolo: "Leggete un'agenda sola",
    testo: "Le scadenze dei tre decreti in un elenco unico, per data. Non tre calendari da tenere allineati.",
    oggetto: <Agenda />,
  },
  {
    titolo: "Consegnate il fascicolo",
    testo:
      "Uno per organo: Garante, Ispettorato, ASL, Organismo di Vigilanza. Con il nome dello studio in copertina e lo stato di ogni adempimento alla data.",
    oggetto: <Copertina />,
  },
] as const;

export function ComeFunziona() {
  return (
    <ol className="relative mt-16 grid gap-14 md:grid-cols-3 md:gap-8">
      {/* Il binario: un filo che attraversa i tre nodi, solo quando i passi stanno in fila. */}
      <span aria-hidden className="absolute top-4 right-[16%] left-4 hidden h-px bg-border-strong md:block" />
      {PASSI.map((p, i) => (
        <li key={p.titolo} className="affiora relative min-w-0">
          <span className="relative z-10 flex size-8 items-center justify-center rounded-full bg-primary font-mono text-xs font-semibold text-primary-foreground tabular-nums">
            {String(i + 1).padStart(2, "0")}
          </span>
          <h3 className="mt-6 text-xl font-bold tracking-tight">{p.titolo}</h3>
          <p className="mt-3 leading-relaxed text-muted-foreground">{p.testo}</p>
          <div className="mt-6" aria-hidden>
            {p.oggetto}
          </div>
        </li>
      ))}
    </ol>
  );
}
