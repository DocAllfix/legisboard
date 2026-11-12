"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { usePathname } from "next/navigation";
import { HelpCircle } from "lucide-react";
import { segnaTourVisto } from "@/features/tour/azioni";
import { tourPerChiave, tourPerPercorso, type Tour } from "@/lib/tour/passi";
import { cn } from "@/lib/utils";

// LA GUIDA.
//
// Si apre da sola la prima volta su una schermata, e poi si richiama dal punto interrogativo
// nella barra. Nessuno riguarda un tour che si è saltato: se non c'è un comando visibile per
// riaprirlo, saltarlo equivale a cancellarlo.
//
// `prefers-reduced-motion` È RISPETTATO, e non per spuntare una casella: un riquadro che
// scorre da un elemento all'altro su chi soffre di disturbi vestibolari provoca nausea vera.
// Con la preferenza attiva il riquadro salta di posizione senza animazione.
//
// driver.js si carica SOLO QUANDO SERVE, con un import dinamico. È una libreria che la
// maggior parte delle sessioni non aprirà mai, e metterla nel bundle di ogni pagina
// significherebbe farla scaricare a tutti per servire i primi cinque minuti di alcuni.

/** I giri della schermata corrente, nell'ordine in cui si provano. */
function tourDelPercorso(percorso: string): readonly Tour[] {
  if (percorso.startsWith("/cruscotto")) return tourPerPercorso("/cruscotto");
  if (percorso.startsWith("/scadenzario")) return tourPerPercorso("/scadenzario");
  if (percorso.startsWith("/portafoglio")) return tourPerPercorso("/portafoglio");
  const uno = (chiave: string) => [tourPerChiave(chiave)].filter((t): t is Tour => Boolean(t));
  if (/^\/azienda\/[^/]+\/relazioni/.test(percorso)) return uno("relazioni");
  // Prima dell'assessment, che altrimenti si prendeva anche `/registro/<tipo>`: lì apriva il
  // suo primo passo, quello senza ancoraggio, e il giro dei registri non partiva mai.
  if (/^\/azienda\/[^/]+\/registro\//.test(percorso)) return uno("registri");
  if (/^\/azienda\/[^/]+\/[^/]+/.test(percorso)) return uno("assessment");
  if (/^\/azienda\/[^/]+$/.test(percorso)) return uno("azienda");
  return [];
}

/**
 * Quale dei giri candidati vale sulla pagina COM'È ADESSO: il primo la cui condizione
 * (`quando`) trova il suo ancoraggio. Si decide nel browser perché la stessa schermata,
 * vuota o piena, ha bisogno di un giro diverso, e solo il DOM sa quale delle due è.
 */
function scegli(candidati: readonly Tour[], escludi?: (t: Tour) => boolean): Tour | undefined {
  return candidati.find(
    (t) => (!t.quando || document.querySelector(`[data-tour="${t.quando}"]`)) && !escludi?.(t),
  );
}

/**
 * LA GUIDA È MONTATA DUE VOLTE: nel binario da `lg` in su e nel cassetto sotto. Entrambe le copie
 * si aprivano da sole, e il giro partiva due volte, con due riquadri sovrapposti e due veli —
 * trovato il 2026-09-29 da una prova sul sito vero, su ogni schermata con un giro. Ora si apre da
 * sola solo la copia che sta nella parte visibile a questa larghezza; il pulsante resta in tutte e due.
 */
const LG = "(min-width: 64rem)";

export function Guida({ visti, dove }: { visti: Record<string, number>; dove: "binario" | "cassetto" }) {
  const percorso = usePathname();
  const [inCorso, setInCorso] = useState(false);
  // Ciò che si è già aperto in QUESTA sessione di pagina: senza, tornando indietro il tour
  // ripartirebbe da capo prima che il server abbia registrato la visita.
  const apertiOra = useRef(new Set<string>());

  const candidati = useMemo(() => tourDelPercorso(percorso ?? ""), [percorso]);
  // Per il pulsante, prima che il DOM sia leggibile: basta sapere se un giro esiste. Con più
  // giri sullo stesso percorso il nome dipende da cosa c'è sulla pagina, e resta generico.
  const tour = candidati.length === 1 ? candidati[0] : undefined;

  const avvia = useCallback(
    async (quale: Tour) => {
      if (inCorso) return;
      setInCorso(true);
      apertiOra.current.add(quale.chiave);

      const { driver } = await import("driver.js");
      // Il foglio di stile della libreria arriva con lei: importarlo in cima farebbe
      // scaricare il CSS a chi il tour non lo apre mai.
      await import("driver.js/dist/driver.css");

      const ridotto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

      const passi = quale.passi
        .filter((p) => !p.ancora || document.querySelector(`[data-tour="${p.ancora}"]`))
        .map((p) => ({
          ...(p.ancora ? { element: `[data-tour="${p.ancora}"]` } : {}),
          popover: { title: p.titolo, description: p.testo },
        }));

      // Se sulla schermata non c'è nemmeno un ancoraggio — capita se la pagina è vuota,
      // per esempio un portafoglio senza aziende — il tour non si apre: illuminare il nulla
      // e raccontare cosa ci sarebbe è peggio che tacere.
      if (passi.length === 0) {
        setInCorso(false);
        return;
      }

      const g = driver({
        // LA CLASSE CHE PORTA IL POPOVER DENTRO IL NOSTRO REGISTRO.
        //
        // Senza, driver.js usa il proprio tema predefinito: fondo bianco puro, angoli
        // stretti, pulsanti azzurri con l'ombreggiatura del testo. Su un prodotto che ha
        // scelto la propria forma attraverso sette giri di confronto, è un pezzo di
        // un'altra applicazione incollato sopra — e si vede subito, perché la guida è
        // proprio il momento in cui si sta guardando con attenzione.
        //
        // Lo stile sta in `globals.css`, non qui: è l'unico modo di scriverlo in token.
        popoverClass: "guida-popover",
        showProgress: passi.length > 1,
        animate: !ridotto,
        overlayOpacity: 0.55,
        nextBtnText: "Avanti",
        prevBtnText: "Indietro",
        doneBtnText: "Ho capito",
        progressText: "{{current}} di {{total}}",
        steps: passi,
        onDestroyed: () => {
          setInCorso(false);
          // Si registra anche se il tour è stato chiuso a metà: chi l'ha interrotto l'ha
          // visto abbastanza da decidere che non gli serviva, e riproporglielo a ogni
          // visita è il modo migliore per fargli odiare il prodotto.
          void segnaTourVisto(quale.chiave);
        },
      });
      g.drive();
    },
    [inCorso],
  );

  // La prima volta si apre da solo. La versione conta: se il testo cambia perché la
  // schermata è cambiata, chi l'aveva già visto lo rivede una volta sola.
  useEffect(() => {
    if (candidati.length === 0) return;
    if (window.matchMedia(LG).matches !== (dove === "binario")) return;
    // Un istante di attesa: la schermata deve aver finito di disegnarsi, altrimenti gli
    // ancoraggi non ci sono ancora e il tour si apre monco (o si sceglie il giro sbagliato).
    const t = setTimeout(() => {
      // Il primo giro valido sulla pagina e non ancora visto. La versione conta: se il testo
      // cambia perché la schermata è cambiata, chi l'aveva già visto lo rivede una volta sola.
      const scelto = scegli(
        candidati,
        (g) => (visti[g.chiave] ?? 0) >= g.versione || apertiOra.current.has(g.chiave),
      );
      if (scelto) void avvia(scelto);
    }, 900);
    return () => clearTimeout(t);
  }, [candidati, visti, avvia, dove]);

  return (
    <button
      type="button"
      onClick={() => {
        const scelto = scegli(candidati);
        if (scelto) void avvia(scelto);
      }}
      disabled={candidati.length === 0 || inCorso}
      data-tour="guida"
      // IL CANCELLO NON CLICCA QUESTO. Aprirebbe il velo di driver.js, che copre la pagina
      // e intercetta ogni clic successivo: la spazzata si fermerebbe lì e riporterebbe
      // decine di comandi «irraggiungibili» che invece funzionano benissimo.
      //
      // Non è un pulsante che nessuno verifica: il tour ha il suo cancello, che legge i
      // sorgenti e fallisce se un passo punta a un ancoraggio inesistente — difetto che
      // driver.js non segnala, perché salta il passo in silenzio.
      data-cancello="salta"
      aria-label={
        tour
          ? `Guida · ${tour.nome}`
          : candidati.length > 0
            ? "Guida di questa schermata"
            : "Guida non disponibile su questa schermata"
      }
      title={
        tour ? `Guida · ${tour.nome}` : candidati.length > 0 ? "Guida" : "Nessuna guida per questa schermata"
      }
      className={cn(
        "rounded-md p-1.5 text-sidebar-muted hover:bg-sidebar-selected hover:text-sidebar-foreground",
        (candidati.length === 0 || inCorso) && "opacity-40",
      )}
    >
      <HelpCircle className="size-4" aria-hidden />
    </button>
  );
}
