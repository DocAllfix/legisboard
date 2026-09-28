// Indirizzi e interruttori della landing, in un posto solo.
//
// Le pagine sono statiche: questi valori si leggono IN FASE DI BUILD. Cambiare un interruttore
// su Vercel richiede un nuovo deploy, ed è voluto — un modulo che si accende deve passare da
// una build che lo ha visto acceso.

export const SITO = {
  /** L'unico host canonico. `legisboard.it` e i `www` rimandano qui con un 308. */
  url: "https://legisboard.eu",
  nome: "Legisboard",
} as const;

const DEMO = process.env.DEMO_URL ?? "https://demo.legisboard.eu";

/** L'ingresso con un clic nella demo pubblica: vedi docs/07 §5. */
export const INGRESSO_DEMO = `${DEMO}/demo`;

/**
 * Indicizzabile solo in produzione e con `LANDING_INDICIZZABILE=1`. Le anteprime di Vercel non
 * entrano mai negli indici. Sul progetto di produzione la variabile vale 1 dal lancio: il
 * committente ha deciso il 2026-09-24 di non aspettare ragione sociale e partita IVA.
 */
export const INDICIZZABILE =
  process.env.VERCEL_ENV === "production" && process.env.LANDING_INDICIZZABILE === "1";

/**
 * IL TITOLARE DEL TRATTAMENTO: una persona fisica _(decisione del 2026-09-28)_.
 *
 * L'art. 13 GDPR chiede l'identità del titolare e un suo contatto: senza, l'informativa non
 * vale e il modulo non può raccogliere niente. Nome e città bastano; l'indirizzo completo e il
 * codice fiscale non sono richiesti, e su una pagina pubblica sarebbero dati in più.
 */
const nomeTitolare = process.env.TITOLARE_NOME?.trim();
export const TITOLARE = nomeTitolare
  ? { nome: nomeTitolare, citta: process.env.TITOLARE_CITTA?.trim() || null }
  : null;

/** Dove scrivere per esercitare i diritti. Un alias che finisce nella casella dei contatti. */
export const EMAIL_PRIVACY = process.env.EMAIL_PRIVACY ?? "privacy@legisboard.eu";

/** L'ultima revisione delle due informative: si aggiorna a mano quando cambia il testo. */
export const REVISIONE_INFORMATIVE = "28 settembre 2026";

/**
 * IL MODULO ESISTE SOLO CON TITOLARE, INFORMATIVA E RELAY.
 *
 * Raccogliere nome ed email è un trattamento, e l'art. 13 GDPR vuole l'informativa al momento
 * della raccolta, con il titolare nominato. Su un prodotto che vende conformità GDPR, un modulo
 * senza informativa è il primo difetto che un DPO troverebbe. Da spento, la sezione e il
 * pulsante che ci porta non esistono proprio.
 */
export const RICHIESTE_ATTIVE = process.env.RICHIESTE_ATTIVE === "1" && TITOLARE !== null;

/**
 * L'indirizzo di contatto: il canale che funziona SENZA relay SMTP.
 *
 * Con il modulo spento, la sezione `#richiesta` offre email con l'oggetto già scritto. È lo
 * stesso indirizzo che la fascia della demo usa per «Fissa un appuntamento». Assente, i
 * rimandi al contatto non compaiono: resta «Entra nella demo».
 */
export const CONTATTO_EMAIL = process.env.CONTATTO_EMAIL ?? null;

/** Vero se esiste almeno un modo di contattarci: il modulo, o l'indirizzo. */
export const CONTATTO_POSSIBILE = RICHIESTE_ATTIVE || CONTATTO_EMAIL !== null;
