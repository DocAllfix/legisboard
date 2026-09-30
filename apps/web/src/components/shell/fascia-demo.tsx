import { ContattoDemo } from "@/components/shell/contatto-demo";
import { contattoDisponibile } from "@/features/contatto-demo/azioni";
import { PRODOTTO } from "@/lib/brand";
import { env } from "@/lib/env";

// LA FASCIA DELLA DEMO PUBBLICA _(docs/07 §5.1)_.
//
// Dice tre cose che il visitatore deve sapere prima di toccare qualcosa: che è una demo, che
// i dati sono inventati, e che tornano com'erano ogni notte. Poi offre la strada che il
// committente vuole dopo la prova: parlarne.
//
// Il contatto, in ordine di preferenza _(2026-09-28)_:
//   1. il modulo dentro la demo, se posta e destinatario sono configurati;
//   2. un'email con l'oggetto già scritto, se c'è almeno l'indirizzo;
//   3. niente: meglio nessun pulsante che uno che porta dove non si può fare quello che promette.
//
// Colori dell'ACCENTO, non di stato: rosso, ambra e verde qui dentro parlano di scadenze, e
// una fascia informativa colorata come un allarme ruberebbe un canale che porta dati.

function scrivi(oggetto: string): string {
  return `mailto:${env.CONTATTO_EMAIL}?subject=${encodeURIComponent(oggetto)}`;
}

export async function FasciaDemo() {
  const modulo = await contattoDisponibile();
  return (
    <div
      data-tour="demo-fascia"
      className="mb-6 flex flex-wrap items-center gap-x-6 gap-y-3 rounded-md border border-accento-border bg-accento-surface px-4 py-3 text-sm"
    >
      <p className="min-w-0 flex-1">
        <strong className="font-semibold">Demo.</strong> I dati sono di un&apos;azienda d&apos;esempio
        inventata, e ogni notte tornano com&apos;erano: cambiate pure gli stati.{" "}
        {/* Le informative della demo sono quelle della landing: su un'istanza venduta questa
            fascia non esiste, e valgono quelle dello studio. */}
        <span>
          <a href={`${PRODOTTO.sito}/privacy`} className="underline underline-offset-2">
            Privacy
          </a>{" "}
          ·{" "}
          <a href={`${PRODOTTO.sito}/cookie`} className="underline underline-offset-2">
            Cookie
          </a>
        </span>
      </p>
      {modulo ? (
        <ContattoDemo />
      ) : env.CONTATTO_EMAIL ? (
        <div className="flex flex-wrap items-center gap-3">
          <a
            href={scrivi("Legisboard · vorrei fissare un appuntamento")}
            className="inline-flex h-9 items-center rounded-md bg-primary px-3 font-medium text-primary-foreground hover:bg-primary-hover"
          >
            Fissa un appuntamento
          </a>
          <a
            href={scrivi("Legisboard · richiesta d'acquisto")}
            className="font-medium underline underline-offset-2"
          >
            Richiedi l&apos;acquisto
          </a>
        </div>
      ) : null}
    </div>
  );
}
