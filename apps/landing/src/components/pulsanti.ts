// Le due forme di pulsante della landing. Classi e basta, niente componente: un collegamento
// resta un <a>, che è ciò che un collegamento deve essere per un lettore di schermo e per un
// crawler.

const BASE =
  "inline-flex h-11 items-center justify-center gap-2 rounded-md px-5 text-sm font-medium whitespace-nowrap " +
  "transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring " +
  "focus-visible:ring-offset-2 focus-visible:ring-offset-background";

export const PULSANTE_PIENO = `${BASE} bg-primary text-primary-foreground hover:bg-primary-hover`;
export const PULSANTE_VUOTO = `${BASE} border border-border-strong bg-surface text-foreground hover:bg-surface-sunken`;

// SUL FONDO OLIVA, UNA GERARCHIA E NON UNA COPPIA _(2026-09-29)_.
//
// La prima versione era il modello di ogni landing: un pulsante pieno avorio e uno a contorno,
// della stessa misura, affiancati. Dicevano «due scelte equivalenti», e non lo sono: la demo è
// l'azione della pagina, la presentazione è l'alternativa per chi non vuole provare da solo.
//
// Ora il pulsante è uno solo, nell'oliva chiara del sottotitolo («Legisboard li tiene
// separati»), con la scritta nell'oliva scura del fondo: il colore del marchio acceso, non un
// avorio neutro. La freccia scivola al passaggio, e alla pressione il pulsante cede di un
// soffio. L'alternativa diventa un collegamento: testo e sottolineatura, niente riquadro.
export const PULSANTE_PIENO_SU_OLIVA =
  "group/cta inline-flex h-12 items-center justify-center gap-2.5 rounded-md bg-sidebar-accento px-6 " +
  "text-[0.9375rem] font-semibold whitespace-nowrap text-sidebar " +
  "motion-safe:transition-[filter,scale] motion-safe:duration-150 hover:brightness-105 motion-safe:active:scale-[0.98] " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accento focus-visible:ring-offset-2 " +
  "focus-visible:ring-offset-sidebar";

/** La freccia del pulsante pieno: da mettere dentro, scivola quando il pulsante è sotto il puntatore. */
export const FRECCIA_CTA = "size-4 motion-safe:transition-transform motion-safe:duration-200 group-hover/cta:translate-x-1";

export const COLLEGAMENTO_SU_OLIVA =
  "inline-flex h-12 items-center gap-1.5 rounded-sm px-1 text-[0.9375rem] font-medium text-sidebar-foreground " +
  "underline decoration-sidebar-muted decoration-1 underline-offset-[6px] " +
  "motion-safe:transition-colors hover:decoration-sidebar-accento hover:text-sidebar-accento " +
  "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sidebar-accento";
