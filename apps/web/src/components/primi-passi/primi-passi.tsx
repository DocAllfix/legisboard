import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import { chiudiPrimiPassi } from "@/features/primi-passi/azioni";
import { primiPassi } from "@/features/primi-passi/dati";
import { cn } from "@/lib/utils";

// IL RIQUADRO DEI PRIMI PASSI, in cima al cruscotto finché l'istanza non è stata usata in ogni
// sua parte. Componente di server: le tappe sono lette dal database a ogni apertura, e la
// chiusura è un modulo con un'azione di server, quindi funziona anche prima che la pagina
// sia interattiva.
//
// UNA SOLA TAPPA È «LA PROSSIMA»: la prima non fatta, in evidenza e con il collegamento
// pieno. Sette inviti uguali sono una lista da leggere; uno solo è un'indicazione.

export async function PrimiPassi() {
  const dati = await primiPassi();
  if (!dati) return null;
  const fatte = dati.tappe.filter((t) => t.fatta).length;
  const prossima = dati.tappe.find((t) => !t.fatta);

  return (
    <section
      aria-labelledby="primi-passi-titolo"
      data-tour="primi-passi"
      className="pannello mb-7 p-5 md:p-6"
    >
      <header className="flex flex-wrap items-baseline justify-between gap-3">
        <div>
          <p className="text-xs font-medium tracking-[0.12em] text-muted-foreground uppercase">
            Primi passi · {dati.studio}
          </p>
          <h2 id="primi-passi-titolo" className="titolo mt-1.5 text-lg">
            Dal primo accesso all&apos;uso completo, in sette tappe
          </h2>
        </div>
        <p className="cifra text-sm text-muted-foreground" aria-live="polite">
          {fatte} di {dati.tappe.length}
        </p>
      </header>

      <div
        className="mt-4 h-1 overflow-hidden rounded-full bg-surface-sunken"
        role="progressbar"
        aria-label="Tappe completate"
        aria-valuemin={0}
        aria-valuemax={dati.tappe.length}
        aria-valuenow={fatte}
      >
        <div className="h-full bg-primary" style={{ width: `${(fatte / dati.tappe.length) * 100}%` }} />
      </div>

      <ol className="mt-5 grid gap-x-8 gap-y-1 md:grid-cols-2">
        {dati.tappe.map((t, i) => {
          const eProssima = t === prossima;
          const voce = (
            <Link
              href={t.href}
              className={cn(
                "group flex gap-3 rounded-md px-2 py-2.5 hover:bg-accent",
                eProssima && "bg-accent",
              )}
            >
              <span
                aria-hidden
                className={cn(
                  "mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full border text-micro",
                  t.fatta ? "border-primary bg-primary text-primary-foreground" : "border-border-strong",
                )}
              >
                {t.fatta ? <Check className="size-3" /> : i + 1}
              </span>
              <span className="min-w-0">
                <span
                  className={cn(
                    "block text-sm font-medium",
                    t.fatta && "text-muted-foreground line-through decoration-1",
                  )}
                >
                  {t.titolo}
                  <span className="sr-only">{t.fatta ? " (fatto)" : eProssima ? " (la prossima)" : ""}</span>
                </span>
                {t.fatta ? null : (
                  <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
                    {t.perche}
                  </span>
                )}
              </span>
              {eProssima ? (
                <ArrowRight className="mt-0.5 ml-auto size-4 shrink-0 text-primary" aria-hidden />
              ) : null}
            </Link>
          );
          // L'ancoraggio scritto per esteso, non calcolato: il test degli ancoraggi legge i
          // sorgenti e riconosce solo le stringhe letterali.
          return (
            <li key={t.chiave}>{eProssima ? <div data-tour="primi-passi-prossima">{voce}</div> : voce}</li>
          );
        })}
      </ol>

      <form action={chiudiPrimiPassi} className="mt-4 flex justify-end">
        <button
          type="submit"
          className="text-xs text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
        >
          Nascondi i primi passi
        </button>
      </form>
    </section>
  );
}
