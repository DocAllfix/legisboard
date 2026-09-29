import type { Metadata } from "next";
import Link from "next/link";
import { CATALOGHI, ETICHETTE_DOMINIO, categorieDi, descriviPeriodicita, templatesPerCategoria, type Dominio } from "@legisboard/engine";
import { Codice } from "@legisboard/ui/stato";
import { InvitoDemo } from "./mdx";
import { Intestazione } from "./intestazione";
import { Piede } from "./piede";
import { articoliPubblicati, dataEstesa } from "@/lib/blog";
import { PILASTRI } from "@/lib/pilastri";
import { SITO } from "@/lib/sito";

// LA PAGINA PILASTRO di un decreto: il testo scritto a mano (`lib/pilastri.ts`), poi il catalogo
// intero raggruppato per categoria, le domande frequenti e le guide collegate. È il nodo a cui
// punta ogni articolo del decreto: l'autorità degli articoli si accumula qui.
//
// La tabella viene da `CATALOGHI` e non da un elenco copiato: se il catalogo cresce, il pilastro
// cresce alla build successiva. Il numero di righe è verificato da un test.

export function metadatiPilastro(dominio: Dominio): Metadata {
  const p = PILASTRI[dominio];
  return {
    title: `${p.titolo} · Legisboard`,
    description: p.descrizione,
    alternates: { canonical: p.url },
    openGraph: { type: "website", locale: "it_IT", siteName: SITO.nome, title: p.titolo, description: p.descrizione, url: p.url },
  };
}

export function PaginaPilastro({ dominio }: { dominio: Dominio }) {
  const p = PILASTRI[dominio];
  const categorie = categorieDi(dominio);
  const guide = articoliPubblicati().filter((a) => a.decreto === dominio);
  const url = `${SITO.url}${p.url}`;

  const datiStrutturati = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "WebPage",
        "@id": `${url}#pagina`,
        url,
        name: p.titolo,
        description: p.descrizione,
        inLanguage: "it",
        about: ETICHETTE_DOMINIO[dominio].esteso,
      },
      {
        "@type": "FAQPage",
        mainEntity: p.domande.map((d) => ({
          "@type": "Question",
          name: d.domanda,
          acceptedAnswer: { "@type": "Answer", text: d.risposta },
        })),
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Legisboard", item: `${SITO.url}/` },
          { "@type": "ListItem", position: 2, name: p.titoloBreve, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datiStrutturati) }} />
      <Intestazione />
      <main>
        <section aria-labelledby="pilastro-titolo" className="border-b">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 md:py-20 lg:grid-cols-[minmax(0,42rem)_1fr] lg:gap-16">
            <div className="min-w-0">
              <p className="flex items-center gap-3 text-micro font-semibold tracking-widest text-primary uppercase">
                <span aria-hidden className="h-px w-8 bg-primary" />
                {p.occhiello}
              </p>
              <h1 id="pilastro-titolo" className="mt-5 text-display-sm leading-tight font-extrabold tracking-tight text-balance">
                {p.titolo}
              </h1>
              <div className="mt-8 space-y-5 text-lettura leading-[1.75]">
                {p.introduzione.map((par) => (
                  <p key={par.slice(0, 32)}>{par}</p>
                ))}
              </div>
            </div>
            <aside className="lg:pt-16">
              <dl className="rounded-lg border bg-surface p-6 text-sm shadow-sm">
                <dt className="text-muted-foreground">Adempimenti nel catalogo</dt>
                <dd className="font-mono text-cifra-sm leading-tight tabular-nums">{CATALOGHI[dominio].length}</dd>
                <dt className="mt-4 text-muted-foreground">Categorie</dt>
                <dd className="font-mono text-cifra-sm leading-tight tabular-nums">{categorie.length}</dd>
                <dt className="mt-4 text-muted-foreground">Norma</dt>
                <dd className="font-medium">{ETICHETTE_DOMINIO[dominio].esteso}</dd>
              </dl>
            </aside>
          </div>
        </section>

        <section aria-labelledby="catalogo-titolo" className="bg-surface-sunken">
          <div className="mx-auto w-full max-w-6xl px-5 py-16 md:py-20">
            <h2 id="catalogo-titolo" className="text-2xl font-bold tracking-tight">
              Il catalogo, categoria per categoria
            </h2>
            <p className="mt-3 max-w-2xl text-muted-foreground">
              La cadenza è quella con cui il registro ripropone l&apos;adempimento. Dove la legge fissa un termine, lo
              indica il riferimento.
            </p>
            <div className="mt-10 space-y-12">
              {categorie.map((c) => (
                <div key={c}>
                  <h3 className="text-lg font-bold tracking-tight">{c}</h3>
                  {/* Una tabella vera, non una griglia: si legge per colonne, e un lettore di schermo
                      annuncia intestazione e cella. Sotto `md` scorre in orizzontale dentro il suo
                      riquadro, senza allargare la pagina. */}
                  <div className="mt-4 overflow-x-auto rounded-lg border bg-surface">
                    <table className="w-full min-w-[40rem] text-sm">
                      <thead className="text-left text-xs text-muted-foreground">
                        <tr>
                          <th scope="col" className="px-4 py-3 font-medium">Codice</th>
                          <th scope="col" className="px-4 py-3 font-medium">Adempimento</th>
                          <th scope="col" className="px-4 py-3 font-medium">Riferimento</th>
                          <th scope="col" className="px-4 py-3 font-medium">Chi risponde</th>
                          <th scope="col" className="px-4 py-3 font-medium">Cadenza</th>
                        </tr>
                      </thead>
                      <tbody>
                        {templatesPerCategoria(dominio, c).map((t) => (
                          <tr key={t.codice} className="border-t align-top">
                            <td className="px-4 py-3">
                              <Codice codice={t.codice} />
                            </td>
                            <td className="px-4 py-3 font-medium">{t.titolo}</td>
                            <td className="px-4 py-3 text-muted-foreground">{t.riferimento}</td>
                            <td className="px-4 py-3 text-muted-foreground">{t.ruolo}</td>
                            <td className="px-4 py-3 whitespace-nowrap">{descriviPeriodicita(t.periodicita)}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section aria-labelledby="domande-pilastro" className="border-b">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 md:py-20 lg:grid-cols-[1fr_1.6fr]">
            <h2 id="domande-pilastro" className="text-2xl font-bold tracking-tight">
              Domande frequenti
            </h2>
            <div className="divide-y divide-border-strong border-y border-border-strong">
              {p.domande.map((d) => (
                <details key={d.domanda} className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-semibold">
                    {d.domanda}
                    <span aria-hidden className="text-2xl leading-none text-primary motion-safe:transition-transform group-open:rotate-45">
                      +
                    </span>
                  </summary>
                  <p className="max-w-2xl pb-6 leading-relaxed text-muted-foreground">{d.risposta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        <div className="mx-auto w-full max-w-6xl px-5">
          {guide.length > 0 ? (
            <section aria-labelledby="guide-pilastro" className="py-16">
              <h2 id="guide-pilastro" className="text-2xl font-bold tracking-tight">
                Guide su questo decreto
              </h2>
              <ul className="mt-6 divide-y border-y">
                {guide.map((g) => (
                  <li key={g.slug}>
                    <Link href={`/blog/${g.slug}`} className="group flex flex-wrap items-baseline justify-between gap-2 py-4">
                      <span className="font-semibold group-hover:underline">{g.titolo}</span>
                      <time dateTime={g.pubblicazione} className="text-sm text-muted-foreground">
                        {dataEstesa(g.pubblicazione)}
                      </time>
                    </Link>
                  </li>
                ))}
              </ul>
            </section>
          ) : null}
          <InvitoDemo />
        </div>
      </main>
      <Piede />
    </>
  );
}
