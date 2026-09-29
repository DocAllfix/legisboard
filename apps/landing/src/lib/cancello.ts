import { DOMINI, templatePerCodice, type Dominio } from "@legisboard/engine";
import type { Articolo } from "./blog";
import { PILASTRI } from "./pilastri";

// IL CANCELLO EDITORIALE _(2026-09-29, docs/08)_.
//
// Gira DENTRO la build (da `generateStaticParams` di `/blog/[slug]`), su tutti gli articoli del
// repository, anche quelli con data futura. Se un controllo fallisce la build fallisce: la PR
// dell'articolo ha l'anteprima rossa, e la routine di pubblicazione non la unisce. Un articolo
// che non passa non esce, senza che nessuno debba ricordarsi di guardare.
//
// Controlla ciò che una macchina può controllare. Non controlla se una frase di legge è vera:
// quello resta alle fonti citate nella PR e alle 48 ore di revisione.

const PAROLE_MIN = 900;
const PAROLE_MAX = 2800;

/** Frasi che tradiscono un testo generato in serie, o che promettono ciò che un articolo non può promettere. */
const VIETATE: readonly RegExp[] = [
  /—/, // le lineette lunghe: regola della casa per il testo
  /\bin conclusione\b/i,
  /\bin un mondo in cui\b/i,
  /\bnel panorama (attuale|odierno)\b/i,
  /\bè fondamentale sottolineare\b/i,
  /\bnon solo\b[^.]{0,80}\bma anche\b/i,
  /\bsarete (pienamente )?(a norma|in regola|conformi)\b/i,
  /\bgarantisce la (piena )?conformità\b/i,
  /\bconformità garantita\b/i,
];

const ROTTE_FISSE = new Set(["/", "/blog", "/privacy", "/cookie", ...DOMINI.map((d) => PILASTRI[d].url)]);

const normalizza = (s: string) => s.toLowerCase().replace(/\s+/g, " ").trim();

function codiceEsiste(codice: string, dominio?: Dominio): boolean {
  const domini = dominio ? [dominio] : DOMINI;
  return domini.some((d) => templatePerCodice(d, codice) !== undefined);
}

export function verificaArticoli(articoli: readonly Articolo[]): void {
  const errori: string[] = [];
  const slug = new Set(articoli.map((a) => a.slug));
  const parole = new Map<string, string>();

  for (const a of articoli) {
    const dove = `content/blog/${a.slug}.mdx`;

    const pk = normalizza(a.parola_chiave);
    const gia = parole.get(pk);
    if (gia) errori.push(`${dove}: la parola chiave «${a.parola_chiave}» è già di ${gia} (una per URL)`);
    parole.set(pk, a.slug);

    for (const c of a.codici_catalogo) {
      if (!codiceEsiste(c)) errori.push(`${dove}: codici_catalogo contiene «${c}», che non esiste nel catalogo`);
    }
    for (const m of a.corpo.matchAll(/<Adempimento\s+dominio="([^"]+)"\s+codice="([^"]+)"/g)) {
      const [, dominio, codice] = m;
      if (!DOMINI.includes(dominio as Dominio) || !codiceEsiste(codice!, dominio as Dominio)) {
        errori.push(`${dove}: <Adempimento dominio="${dominio}" codice="${codice}"> non esiste nel catalogo`);
      }
    }

    const n = a.corpo.split(/\s+/).filter(Boolean).length;
    if (n < PAROLE_MIN || n > PAROLE_MAX) errori.push(`${dove}: ${n} parole, fuori da ${PAROLE_MIN}-${PAROLE_MAX}`);

    for (const r of VIETATE) {
      const trovata = a.corpo.match(r);
      if (trovata) errori.push(`${dove}: espressione vietata «${trovata[0]}»`);
    }

    if (!a.corpo.includes(`](${PILASTRI[a.decreto].url})`)) {
      errori.push(`${dove}: manca il collegamento al pilastro ${PILASTRI[a.decreto].url}`);
    }
    for (const m of a.corpo.matchAll(/\]\((\/[^)#\s]*)(#[^)\s]*)?\)/g)) {
      const percorso = m[1]!.replace(/\/$/, "") || "/";
      const articolo = percorso.match(/^\/blog\/(.+)$/);
      const valido = ROTTE_FISSE.has(percorso) || (articolo !== null && slug.has(articolo[1]!));
      if (!valido) errori.push(`${dove}: collegamento interno rotto «${m[1]}»`);
    }

    if (a.titoli.length < 3) errori.push(`${dove}: servono almeno tre sezioni con titolo H2`);
  }

  if (errori.length > 0) {
    throw new Error(`Il cancello editoriale ha fermato la build:\n- ${errori.join("\n- ")}`);
  }
}
