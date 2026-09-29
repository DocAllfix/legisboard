import type { Metadata } from "next";
import Link from "next/link";
import { DOMINI } from "@legisboard/engine";
import { PastigliaDominio } from "@legisboard/ui/stato";
import { Intestazione } from "@/components/intestazione";
import { Piede } from "@/components/piede";
import { articoliPubblicati, dataEstesa } from "@/lib/blog";
import { PILASTRI } from "@/lib/pilastri";
import { SITO } from "@/lib/sito";

// L'INDICE DELLE GUIDE. Statico, rigenerato ogni notte: è così che un articolo programmato
// compare il giorno della sua data. Niente filtro con `?decreto=` — renderebbe la pagina
// dinamica —: i tre pilastri, in testa, sono già l'indice per decreto.

export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Guide su GDPR, 231 e sicurezza sul lavoro · Legisboard",
  description:
    "Guide pratiche per DPO, consulenti, OdV e RSPP: adempimenti, scadenze e riferimenti normativi di GDPR, D.Lgs 231/2001 e D.Lgs 81/2008.",
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: SITO.nome,
    title: "Guide su GDPR, 231 e sicurezza sul lavoro",
    url: "/blog",
  },
};

export default function IndiceGuide() {
  const articoli = articoliPubblicati();
  return (
    <>
      <Intestazione />
      <main className="mx-auto w-full max-w-6xl px-5 py-16 md:py-20">
        <p className="flex items-center gap-3 text-micro font-semibold tracking-widest text-primary uppercase">
          <span aria-hidden className="h-px w-8 bg-primary" />
          Guide
        </p>
        <h1 className="mt-5 max-w-3xl text-display-sm leading-tight font-extrabold tracking-tight text-balance">
          Adempimenti, scadenze e riferimenti, spiegati da chi li tiene in ordine.
        </h1>

        <nav aria-label="Per decreto" className="mt-10 grid gap-3 sm:grid-cols-3">
          {DOMINI.map((d) => (
            <Link
              key={d}
              href={PILASTRI[d].url}
              className="group rounded-lg border bg-surface p-5 transition-colors hover:border-border-strong"
            >
              <PastigliaDominio dominio={d} />
              <p className="mt-3 font-semibold tracking-tight group-hover:underline">{PILASTRI[d].titoloBreve}</p>
              <p className="mt-1 text-sm text-muted-foreground">L&apos;elenco completo, con cadenze e riferimenti</p>
            </Link>
          ))}
        </nav>

        {articoli.length > 0 ? (
          <ol className="mt-16 divide-y border-y">
            {articoli.map((a) => (
              <li key={a.slug}>
                <Link href={`/blog/${a.slug}`} className="group grid gap-2 py-7 md:grid-cols-[10rem_1fr] md:gap-8">
                  <div className="flex items-center gap-3 md:flex-col md:items-start md:gap-2">
                    <PastigliaDominio dominio={a.decreto} />
                    <time dateTime={a.pubblicazione} className="text-sm text-muted-foreground">
                      {dataEstesa(a.pubblicazione)}
                    </time>
                  </div>
                  <div className="min-w-0">
                    <h2 className="text-xl font-bold tracking-tight text-balance group-hover:underline">{a.titolo}</h2>
                    <p className="mt-2 leading-relaxed text-muted-foreground">{a.descrizione}</p>
                  </div>
                </Link>
              </li>
            ))}
          </ol>
        ) : (
          <p className="mt-16 max-w-xl leading-relaxed text-muted-foreground">
            Le prime guide sono in preparazione. Nel frattempo, gli elenchi completi degli adempimenti di ciascun decreto
            sono qui sopra.
          </p>
        )}
      </main>
      <Piede />
    </>
  );
}
