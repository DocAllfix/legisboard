"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { inviaContattoDemo, type EsitoContatto } from "@/features/contatto-demo/azioni";
import { PRODOTTO } from "@/lib/brand";

// IL CONTATTO DENTRO LA DEMO _(2026-09-28)_: un pulsante nella fascia, sempre, e un invito che
// compare da solo DOPO che il visitatore ha usato il prodotto, non prima.
//
// «Dopo un po'» vuol dire quattro cambi di pagina oppure due minuti, il primo che arriva. Chi
// ha aperto quattro schermate ha visto abbastanza per sapere se gli interessa; chi resta due
// minuti su una pagina sola la sta leggendo. Una volta chiuso, l'invito non torna in quella
// scheda: `sessionStorage`, che sparisce con la scheda e non esce dal browser.
//
// Il componente sta nella fascia, che vive nel layout: non si rimonta cambiando pagina, quindi
// il conteggio sopravvive alla navigazione.

const PAGINE_PRIMA_DELL_INVITO = 4;
const MILLISECONDI_PRIMA_DELL_INVITO = 120_000;
const CHIAVE = "invito-contatto";

const MOTIVI = [
  ["presentazione", "Una presentazione"],
  ["appuntamento", "Un appuntamento"],
  ["acquisto", "Una richiesta d'acquisto"],
] as const;

const RUOLI = ["DPO", "Avvocato", "Organismo di Vigilanza", "RSPP", "Consulente", "Altro"] as const;

const CAMPO =
  "mt-1 block h-9 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none " +
  "focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50";

function letto(): boolean {
  try {
    return sessionStorage.getItem(CHIAVE) === "chiuso";
  } catch {
    return false;
  }
}

export function ContattoDemo() {
  const [aperto, setAperto] = useState(false);
  const [invito, setInvito] = useState(false);
  const pagine = useRef(0);
  const pathname = usePathname();

  useEffect(() => {
    if (letto()) return;
    const t = setTimeout(() => setInvito(true), MILLISECONDI_PRIMA_DELL_INVITO);
    return () => clearTimeout(t);
  }, []);

  useEffect(() => {
    pagine.current += 1;
    // Il primo giro è la pagina d'arrivo, non un cambio.
    if (pagine.current > PAGINE_PRIMA_DELL_INVITO && !letto()) setInvito(true);
  }, [pathname]);

  function chiudiInvito() {
    setInvito(false);
    try {
      sessionStorage.setItem(CHIAVE, "chiuso");
    } catch {
      // Senza memoria della scheda l'invito può tornare: fastidioso, non grave.
    }
  }

  function apri() {
    chiudiInvito();
    setAperto(true);
  }

  return (
    <>
      <Button type="button" size="sm" onClick={apri} data-tour="demo-contatto">
        Contattaci
      </Button>

      {invito && !aperto ? (
        <aside
          aria-label="Invito a contattarci"
          className="fixed right-4 bottom-4 z-40 w-[min(22rem,calc(100vw-2rem))] rounded-lg border bg-popover p-5 text-sm text-popover-foreground shadow-md"
        >
          <button
            type="button"
            onClick={chiudiInvito}
            className="absolute top-2 right-2 flex size-8 items-center justify-center rounded-md text-muted-foreground hover:bg-muted"
          >
            <X className="size-4" aria-hidden />
            <span className="sr-only">Chiudi l&apos;invito</span>
          </button>
          <p className="pr-6 text-base font-semibold tracking-tight">Vi convince? Parliamone.</p>
          <p className="mt-2 leading-relaxed text-muted-foreground">
            Una presentazione sul vostro caso, un appuntamento o un&apos;offerta per la vostra installazione.
          </p>
          <Button type="button" className="mt-4" onClick={apri}>
            Contattaci
          </Button>
        </aside>
      ) : null}

      <Sheet open={aperto} onOpenChange={setAperto}>
        <SheetContent className="w-full overflow-y-auto sm:max-w-md">
          <SheetHeader>
            <SheetTitle className="text-lg font-semibold">Parliamone</SheetTitle>
            <SheetDescription>Vi rispondiamo per email entro due giorni lavorativi.</SheetDescription>
          </SheetHeader>
          {/* Il modulo si rimonta a ogni apertura: il tempo minimo riparte, l'esito si azzera. */}
          {aperto ? <Modulo /> : null}
        </SheetContent>
      </Sheet>
    </>
  );
}

function Modulo() {
  const [esito, azione, inCorso] = useActionState<EsitoContatto | null, FormData>(inviaContattoDemo, null);
  const [apertoIl] = useState(() => Date.now());

  if (esito?.ok) {
    return (
      <p role="status" className="mx-4 rounded-lg border p-4 leading-relaxed">
        Richiesta ricevuta. Vi scriviamo all&apos;indirizzo che avete indicato.
      </p>
    );
  }

  return (
    <form
      action={(dati) => {
        dati.set("trascorsi", String(Date.now() - apertoIl));
        azione(dati);
      }}
      className="space-y-4 px-4 pb-6"
    >
      <fieldset>
        <legend className="text-sm font-semibold">Che cosa vi serve</legend>
        <div className="mt-2 space-y-1.5">
          {MOTIVI.map(([valore, etichetta]) => (
            <label key={valore} className="flex items-center gap-2 text-sm">
              <input type="radio" name="motivo" value={valore} defaultChecked={valore === "presentazione"} />
              {etichetta}
            </label>
          ))}
        </div>
      </fieldset>
      <label className="block text-sm">
        Nome e cognome
        <input name="nome" required autoComplete="name" className={CAMPO} />
      </label>
      <label className="block text-sm">
        Email
        <input name="email" type="email" required autoComplete="email" className={CAMPO} />
      </label>
      <label className="block text-sm">
        Studio od organizzazione
        <input name="studio" required autoComplete="organization" className={CAMPO} />
      </label>
      <label className="block text-sm">
        Ruolo
        <select name="ruolo" required defaultValue="" className={CAMPO}>
          <option value="" disabled>
            Scegliete…
          </option>
          {RUOLI.map((r) => (
            <option key={r}>{r}</option>
          ))}
        </select>
      </label>
      <label className="block text-sm">
        Messaggio <span className="text-muted-foreground">(facoltativo)</span>
        <textarea
          name="messaggio"
          rows={3}
          maxLength={2000}
          className={CAMPO.replace("h-9", "min-h-20") + " py-2"}
        />
      </label>

      {/* La trappola: fuori dallo schermo e fuori dall'ordine di tabulazione. */}
      <div aria-hidden className="absolute -left-[9999px]">
        <label>
          Non compilare
          <input name="sito" tabIndex={-1} autoComplete="off" defaultValue="" />
        </label>
      </div>

      <p className="text-xs leading-relaxed text-muted-foreground">
        Usiamo questi dati solo per rispondervi, come misura precontrattuale (art. 6.1.b GDPR).{" "}
        <a href={`${PRODOTTO.sito}/privacy`} target="_blank" rel="noopener" className="underline underline-offset-2">
          Informativa completa
        </a>
        .
      </p>

      {esito && !esito.ok ? (
        <p role="alert" className="rounded-md border border-scaduta-border bg-scaduta-surface px-3 py-2 text-sm text-scaduta">
          {esito.errore}
        </p>
      ) : null}

      <Button type="submit" disabled={inCorso}>
        {inCorso ? "Invio…" : "Invia la richiesta"}
      </Button>
    </form>
  );
}
