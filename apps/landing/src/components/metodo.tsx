import { VERSIONE_CATALOGO } from "@legisboard/engine";
import { Codice, PastigliaDominio, Scadenza, StatoLavoroEtichetta } from "@legisboard/ui/stato";
import { INCROCIO, TESI, TOTALE } from "@/lib/dati";

// IL METODO: OGNI REGOLA CON LA SUA PROVA ACCANTO _(2026-09-29)_.
//
// Era una griglia 2×2 di titoletti e paragrafi: la griglia delle caratteristiche, che dice e non
// dimostra. Ora ogni regola è una riga larga, la frase a sinistra e a destra l'oggetto del
// prodotto che la rispetta, con i dati della demo. Le quattro regole sono verificate: PRODUCT.md
// §1 e §2, l'etichetta di versione in `@legisboard/engine`, il proprietario in `stato.tsx`.

function Prova({ children }: { children: React.ReactNode }) {
  return (
    <div
      aria-hidden
      className="flex min-h-20 flex-wrap items-center gap-x-4 gap-y-2 rounded-lg border bg-surface px-5 py-4 text-sm"
    >
      {children}
    </div>
  );
}

const SEMAFORO = [
  ["bg-scaduta", "Scaduta"],
  ["bg-imminente", "In scadenza"],
  ["bg-regolare", "Regolare"],
] as const;

export function Metodo() {
  const incrocio = INCROCIO;
  const regole = [
    {
      titolo: "Due assi, sempre distinti",
      testo:
        "Lo stato del lavoro e quello della scadenza non si fondono mai in un campo solo. Un campo solo, su «Completata e scaduta», mente.",
      prova: TESI ? (
        <Prova>
          <Codice codice={TESI.codice} />
          <StatoLavoroEtichetta stato={TESI.stato} />
          <span className="text-muted-foreground">e insieme</span>
          <Scadenza data={TESI.scadenza} giorni={TESI.giorni} statoScadenza={TESI.statoScadenza} />
        </Prova>
      ) : null,
    },
    {
      titolo: "Il colore è un dato",
      testo:
        "Rosso, ambra e verde dicono soltanto lo stato della scadenza. Non decorano niente: quando li vedete, significano qualcosa.",
      prova: (
        <Prova>
          {SEMAFORO.map(([tinta, nome]) => (
            <span key={nome} className="flex items-center gap-2">
              <span className={`size-2.5 rounded-full ${tinta}`} />
              {nome}
            </span>
          ))}
          <span className="text-muted-foreground">e nient&apos;altro</span>
        </Prova>
      ),
    },
    {
      titolo: "Un catalogo con una versione",
      testo:
        "L'elenco degli adempimenti ha un'etichetta di versione, e ogni installazione dichiara su quale sta lavorando.",
      prova: (
        <Prova>
          <span className="rounded-sm border border-border-strong px-2 py-1 font-mono text-xs">
            {VERSIONE_CATALOGO}
          </span>
          <span className="text-muted-foreground">{TOTALE} adempimenti, tre decreti</span>
        </Prova>
      ),
    },
    {
      titolo: "Un proprietario per adempimento",
      testo:
        "Se un adempimento serve a più decreti, lo possiede uno solo. Gli altri lo leggono con il codice e il colore del proprietario, e non possono modificarlo.",
      prova: incrocio ? (
        <Prova>
          <PastigliaDominio dominio={incrocio.dominio} />
          <Codice codice={incrocio.codice} />
          <span className="text-muted-foreground">letto da</span>
          {incrocio.usi.map((u) => (
            <span key={`${u.dominio}:${u.codice}`} className="flex items-center gap-1.5">
              <PastigliaDominio dominio={u.dominio} />
              <Codice codice={u.codice} origine={incrocio.dominio} />
            </span>
          ))}
        </Prova>
      ) : null,
    },
  ];

  return (
    <ol className="mt-14 border-t border-border-strong">
      {regole.map((r, i) => (
        <li
          key={r.titolo}
          className="affiora grid gap-5 border-b border-border-strong py-8 md:grid-cols-[3rem_1fr_1.1fr] md:items-center md:gap-8"
        >
          <span className="font-mono text-sm font-semibold text-primary tabular-nums">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0">
            <h3 className="text-xl font-bold tracking-tight">{r.titolo}</h3>
            <p className="mt-2 leading-relaxed text-muted-foreground">{r.testo}</p>
          </div>
          <div className="min-w-0">{r.prova}</div>
        </li>
      ))}
    </ol>
  );
}
