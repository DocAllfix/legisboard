// LA DISTRIBUZIONE COME FOGLIO _(2026-09-29)_.
//
// Le stesse sei voci di prima, ma su un foglio con intestazione e spazio per la firma: è la forma
// di un accordo, e «l'accordo si fa di persona» lo dice la forma prima della frase. Riprende i
// fogli dell'eroe, carta bianca su un fondo che non lo è. Nessun prezzo: decisione del
// committente del 2026-09-24.

const SCHEDA = [
  [
    "Installazione",
    "Dedicata allo studio, con il suo database. Non un servizio condiviso a cui ci si iscrive.",
  ],
  ["Accessi", "Le utenze le crea lo studio, per invito, con ruoli distinti. Nessuna registrazione pubblica."],
  ["Autenticazione", "Secondo fattore con un'app di autenticazione, più codici di recupero."],
  [
    "Intestazione",
    "Il nome dello studio nella barra laterale, in copertina e a piè di pagina di ogni fascicolo.",
  ],
  ["Dove gira", "Su un nostro server o su una macchina vostra: si decide insieme, prima di cominciare."],
  ["Acquisto", "Nessun listino online e nessun pagamento dal sito: ogni installazione si concorda."],
] as const;

export function SchedaInstallazione() {
  // Un secondo foglio, ruotato, sotto quello da leggere: la pila di fogli senza ruotare il testo,
  // che ruotato si legge storto e sfocato.
  return (
    <div className="affiora relative">
      <div
        aria-hidden
        className="absolute inset-0 hidden rounded-lg border bg-surface shadow-sm lg:block lg:rotate-[1.6deg]"
      />
      <div className="relative rounded-lg border bg-surface p-6 shadow-md sm:p-8">
        <div className="flex flex-wrap items-baseline justify-between gap-x-6 gap-y-2 border-b-2 border-foreground pb-3">
          <p className="text-micro font-semibold tracking-widest uppercase">Scheda d&apos;installazione</p>
          <p className="flex items-baseline gap-2 text-xs text-muted-foreground">
            Studio
            <span aria-hidden className="inline-block w-36 border-b border-dashed border-border-strong" />
          </p>
        </div>
        <dl>
          {SCHEDA.map(([voce, valore], i) => (
            <div
              key={voce}
              className="grid gap-1 border-b py-4 last:border-b-0 sm:grid-cols-[11rem_1fr] sm:gap-4"
            >
              {/* Il numero dentro il <dt>: in un <dl> un <div> può contenere solo <dt> e <dd>. */}
              <dt className="flex items-baseline gap-4 font-semibold">
                <span
                  aria-hidden
                  className="hidden w-4 font-mono text-micro font-normal text-muted-foreground tabular-nums sm:inline"
                >
                  {String(i + 1).padStart(2, "0")}
                </span>
                {voce}
              </dt>
              <dd className="leading-relaxed text-muted-foreground">{valore}</dd>
            </div>
          ))}
        </dl>
        <div aria-hidden className="mt-6 grid grid-cols-2 gap-8 text-micro text-muted-foreground">
          <p className="border-t border-border-strong pt-2">Per lo studio</p>
          <p className="border-t border-border-strong pt-2">Per Legisboard</p>
        </div>
      </div>
    </div>
  );
}
