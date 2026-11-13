// @legisboard/engine — motore di calcolo della suite di compliance.
//
// Unica fonte di verità di formule, soglie e giudizi per i tre domini (GDPR, D.Lgs 231/01,
// D.Lgs 81/08). Cruscotti, scadenzario, relazioni, simulatore e import leggono da qui:
// nessun calcolo duplicato altrove nel sistema.
//
// Vincoli di questo pacchetto, verificati in CI:
//   - zero dipendenze a runtime
//   - zero I/O: niente rete, niente filesystem, niente database
//   - funzioni pure: stesso input, stesso output, sempre
//   - non legge mai l'orologio: `oggi` è sempre un parametro

// --- Nucleo comune ---------------------------------------------------------------------
export * from "./core/types";
export * from "./core/deadlines";
export * from "./core/recurrence";
export * from "./core/compliance";
export * from "./core/risk";
export * from "./core/exposure";
// `prontezza` e `esposizione` vivono entrambe in core/exposure.
export * from "./core/simulate";
export * from "./suite/agenda";
export * from "./suite/links";
export { costruisciDemo } from "./core/demo";
export * from "./core/voci-demo";
export type { StatoDemo, VoceDemo } from "./core/demo";

// --- Cataloghi per dominio -------------------------------------------------------------
import { TEMPLATES as GDPR_TEMPLATES, DEMO as GDPR_DEMO } from "./gdpr";
import { TEMPLATES as D231_TEMPLATES, DEMO as D231_DEMO } from "./d231";
import { TEMPLATES as D81_TEMPLATES, DEMO as D81_DEMO } from "./d81";
import type { AdempimentoTemplate, Dominio } from "./core/types";
import type { StatoDemo, VoceDemo } from "./core/demo";

export { GDPR_TEMPLATES, D231_TEMPLATES, D81_TEMPLATES, GDPR_DEMO, D231_DEMO, D81_DEMO };

// --- Sanzioni: tre metodologie distinte, mai sommabili fra loro -------------------------
export { stimaSanzioneGdpr } from "./gdpr/sanction";
export type {
  ParametriSanzioneGdpr,
  StimaSanzione,
  CategoriaViolazione,
  Gravita,
  Circostanze,
} from "./gdpr/sanction";
export {
  stimaSanzione231,
  QUOTE_MIN,
  QUOTE_MAX,
  VALORE_QUOTA_MIN,
  VALORE_QUOTA_MAX,
  TETTO_RIDUZIONE,
} from "./d231/sanction";
export type { ParametriSanzione231, StimaSanzione231, GravitaFatto, Riduzione } from "./d231/sanction";
export { esposizioneD81 } from "./d81/sanction";
export { FAMIGLIE_REATO, coperturaReati, famigliePresidiateDa, presidiRotti } from "./d231/reati";
export type { FamigliaReato, CoperturaReato } from "./d231/reati";
export type { EsposizioneD81, FattispecieSanzionatoria, SoggettoResponsabile } from "./d81/sanction";

/**
 * Presidi che un ispettore chiede per primi, per dominio.
 * Alimentano il calcolo della prontezza: sono il «fascicolo» da avere pronto.
 */
export const PRESIDI_CHIAVE: Readonly<Record<Dominio, readonly string[]>> = {
  // Registro art.30 (Titolare e Responsabile), informative, DPIA, breach, nomina DPO,
  // misure di sicurezza, trasferimenti extra UE.
  gdpr: ["T01", "R01", "T05", "T03", "T04", "T12", "T08", "T11"],
  // Nomina OdV, piano di vigilanza, relazione al CdA, mappatura rischi-reato,
  // codice etico, canale whistleblowing.
  d231: ["M01", "M05", "M08", "M11", "M18", "M36"],
  // DVR, DUVRI, piano di emergenza, nomina RSPP e medico competente, riunione periodica.
  d81: ["S01", "S02", "S06"],
};

/** I cataloghi dei tre domini, indicizzati. 42 + 65 + 64 = 171 adempimenti. */
/**
 * L'etichetta di versione del catalogo. Cambia a ogni modifica del contenuto dei cataloghi: il
 * seme del database la usa per creare la versione, la landing la mostra. Una fonte sola.
 */
export const VERSIONE_CATALOGO = "Legisboard 2026.1";

export const CATALOGHI: Readonly<Record<Dominio, readonly AdempimentoTemplate[]>> = {
  gdpr: GDPR_TEMPLATES,
  d231: D231_TEMPLATES,
  d81: D81_TEMPLATES,
};

export const CLIENTI_DIMOSTRATIVI: Readonly<Record<Dominio, StatoDemo>> = {
  gdpr: GDPR_DEMO,
  d231: D231_DEMO,
  d81: D81_DEMO,
};

/**
 * Il 231 della DEMO PUBBLICA: un modello adottato e attuato a metà _(2026-11-13)_.
 *
 * Il prototipo del committente non ha nessun adempimento 231 completato, e i golden ne
 * verificano la fedeltà: quel dato resta com'è in `CLIENTI_DIMOSTRATIVI`. Sulla vetrina però
 * produceva un muro rosso, otto famiglie di reato scoperte su otto, e chi la apriva vedeva un
 * allarme invece del prodotto. Qui trentacinque adempimenti su sessantacinque risultano
 * completati, con la scadenza in giorni da oggi: OdV costituito e operativo, modello e codice
 * etico aggiornati, i flussi che presidiano cinque famiglie di reato, canale whistleblowing,
 * formazione, due audit. Restano scoperti apposta reati informatici e ambientali, e la
 * sicurezza sul lavoro dipende dall'81/08 del prototipo: tre famiglie scoperte su otto, perché
 * una mappa tutta verde non dimostrerebbe di più.
 * Uno scostamento negativo vuol dire «completato e scaduto», il caso dei due assi.
 * La divergenza è annotata in `docs/politica-scoring.md` §9.
 */
const VETRINA_D231: Readonly<Record<string, number>> = {
  M01: 120,
  M02: 16,
  M03: 15,
  M04: 61,
  M05: 35,
  M06: 92,
  M08: 166,
  M10: 25,
  M11: 77,
  M14: 106,
  M16: 30,
  M17: 105,
  M18: 92,
  M19: -16,
  M21: 30,
  M25: 20,
  M26: 46,
  M27: 18,
  M28: 20,
  M29: 40,
  M33: 30,
  M34: 20,
  M35: 35,
  M36: 16,
  M38: 56,
  M40: 16,
  M42: 136,
  M43: 105,
  M45: 30,
  M47: 66,
  M49: 35,
  M55: 46,
  M56: 15,
  M59: 30,
  M62: 25,
};

/** I tre clienti dimostrativi come li vede la demo pubblica: GDPR e 81/08 dal prototipo, 231 a maturità media. */
export const CLIENTI_VETRINA: Readonly<Record<Dominio, StatoDemo>> = {
  ...CLIENTI_DIMOSTRATIVI,
  d231: {
    ...D231_DEMO,
    fonte: `${D231_DEMO.fonte}, vetrina a maturità media`,
    controlli: D231_DEMO.controlli.map((c): VoceDemo => {
      const scostamento = VETRINA_D231[c.codice];
      return scostamento === undefined ? c : { ...c, stato: "Completata", scadenzaOffsetGiorni: scostamento };
    }),
  },
};

/** Tutti gli adempimenti dei tre domini in un elenco solo. */
export const TUTTI_I_TEMPLATES: readonly AdempimentoTemplate[] = [
  ...GDPR_TEMPLATES,
  ...D231_TEMPLATES,
  ...D81_TEMPLATES,
];

const indice = new Map(TUTTI_I_TEMPLATES.map((t) => [`${t.dominio}:${t.codice}`, t]));

export function templatePerCodice(dominio: Dominio, codice: string): AdempimentoTemplate | undefined {
  return indice.get(`${dominio}:${codice}`);
}

export function templatesPerCategoria(dominio: Dominio, categoria: string): readonly AdempimentoTemplate[] {
  return CATALOGHI[dominio].filter((t) => t.categoria === categoria);
}

export function categorieDi(dominio: Dominio): readonly string[] {
  return [...new Set(CATALOGHI[dominio].map((t) => t.categoria))];
}

export function ruoliDi(dominio: Dominio): readonly string[] {
  return [...new Set(CATALOGHI[dominio].map((t) => t.ruolo))];
}
export * from "./registri/tipi";
export * from "./registri/termini";
