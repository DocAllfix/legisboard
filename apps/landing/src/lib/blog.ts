import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { DOMINI, oggiA, type Dominio } from "@legisboard/engine";
import GithubSlugger from "github-slugger";
import matter from "gray-matter";
import { z } from "zod";
import { AUTORI } from "./autori";

// IL BLOG: file MDX in `content/blog`, un articolo per file _(2026-09-29, docs/08)_.
//
// Tutto si legge IN FASE DI BUILD (e alla rigenerazione notturna), sul server. Nessun MDX arriva
// al browser: la CSP della landing resta com'è.
//
// L'intestazione è validata qui, e la validazione fa fallire la build: un articolo con un campo
// sbagliato non esce, invece di uscire con un titolo vuoto o una data «Invalid Date».
//
// DATA FUTURA = NON ANCORA PUBBLICATO. Un articolo esiste nel repository ma non compare da
// nessuna parte (indice, sitemap, feed, pagina) finché la sua data non arriva. La pagina si
// rigenera ogni notte (`revalidate`), quindi l'uscita è automatica.

const CARTELLA = join(process.cwd(), "content", "blog");

const DataIso = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "Data nel formato AAAA-MM-GG");

export const Intestazione = z
  .object({
    titolo: z.string().min(10).max(90),
    descrizione: z.string().min(50).max(155),
    pubblicazione: DataIso,
    aggiornato: DataIso.optional(),
    autore: z.enum(Object.keys(AUTORI) as [string, ...string[]]),
    decreto: z.enum(DOMINI as unknown as [Dominio, ...Dominio[]]),
    parola_chiave: z.string().min(3),
    codici_catalogo: z.array(z.string()).default([]),
    bozza: z.boolean().default(false),
  })
  .strict();

export type Articolo = z.infer<typeof Intestazione> & {
  readonly slug: string;
  readonly corpo: string;
  readonly aggiornatoIl: string;
  readonly minuti: number;
  readonly titoli: readonly { readonly id: string; readonly testo: string }[];
};

/** Le ancore degli H2 con lo stesso generatore di `rehype-slug`, così l'indice laterale punta giusto. */

function leggi(file: string): Articolo {
  const slug = file.replace(/\.mdx$/, "");
  const grezzo = readFileSync(join(CARTELLA, file), "utf8");
  const { data, content } = matter(grezzo);
  // gray-matter trasforma le date YAML in oggetti Date: si riportano a testo prima della validazione.
  const normalizzato = Object.fromEntries(
    Object.entries(data).map(([k, v]) => [k, v instanceof Date ? v.toISOString().slice(0, 10) : v]),
  );
  const esito = Intestazione.safeParse(normalizzato);
  if (!esito.success) {
    throw new Error(
      `Intestazione non valida in content/blog/${file}: ${esito.error.issues.map((i) => `${i.path.join(".")} ${i.message}`).join("; ")}`,
    );
  }
  const parole = content.split(/\s+/).filter(Boolean).length;
  // Un generatore per articolo e in ordine di documento: `rehype-slug` numera i doppioni allo stesso modo.
  const slugger = new GithubSlugger();
  const titoli = [...content.matchAll(/^(#{1,6}) (.+)$/gm)]
    .map((m) => ({ livello: m[1]!.length, testo: m[2]!.trim(), id: slugger.slug(m[2]!.trim()) }))
    .filter((t) => t.livello === 2)
    .map(({ id, testo }) => ({ id, testo }));
  return {
    ...esito.data,
    slug,
    corpo: content,
    aggiornatoIl: esito.data.aggiornato ?? esito.data.pubblicazione,
    minuti: Math.max(1, Math.round(parole / 220)),
    titoli,
  };
}

/** Tutti gli articoli nel repository, anche non pubblicati. Per il cancello e per i test. */
export function tuttiGliArticoli(): readonly Articolo[] {
  let file: string[] = [];
  try {
    file = readdirSync(CARTELLA).filter((f) => f.endsWith(".mdx"));
  } catch {
    return [];
  }
  return file.map(leggi);
}

/** Pubblicato = non bozza, con data di pubblicazione arrivata (ora di Roma, come il motore). */
export function pubblicato(a: Articolo, oggi = oggiA()): boolean {
  return !a.bozza && a.pubblicazione <= oggi;
}

/** Gli articoli visibili, dal più recente. */
export function articoliPubblicati(): readonly Articolo[] {
  return tuttiGliArticoli()
    .filter((a) => pubblicato(a))
    .sort((x, y) => y.pubblicazione.localeCompare(x.pubblicazione));
}

export function articolo(slug: string): Articolo | null {
  return articoliPubblicati().find((a) => a.slug === slug) ?? null;
}

/** Fino a tre articoli dello stesso decreto, escluso quello corrente. */
export function correlati(a: Articolo): readonly Articolo[] {
  return articoliPubblicati()
    .filter((x) => x.slug !== a.slug && x.decreto === a.decreto)
    .slice(0, 3);
}

/** «6 ottobre 2026». */
export function dataEstesa(iso: string): string {
  return new Intl.DateTimeFormat("it-IT", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${iso}T00:00:00Z`));
}
