import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ETICHETTE_DOMINIO } from "@legisboard/engine";
import { PastigliaDominio } from "@legisboard/ui/stato";
import { InvitoDemo } from "@/components/mdx";
import { Intestazione } from "@/components/intestazione";
import { Piede } from "@/components/piede";
import { AUTORI } from "@/lib/autori";
import { articoliPubblicati, articolo, correlati, dataEstesa, tuttiGliArticoli } from "@/lib/blog";
import { verificaArticoli } from "@/lib/cancello";
import { compila } from "@/lib/mdx";
import { PILASTRI } from "@/lib/pilastri";
import { SITO, TITOLARE } from "@/lib/sito";

// UN ARTICOLO. Statico: si costruisce alla build e si rigenera ogni notte. Gli articoli con data
// futura esistono nel repository ma rispondono 404 finché la data non arriva (vedi `lib/blog.ts`),
// e `dynamicParams` li fa nascere alla prima richiesta dopo quella data.

export const revalidate = 86400;
export const dynamicParams = true;

export function generateStaticParams() {
  // Il cancello editoriale gira qui, a ogni build, su TUTTI gli articoli, anche quelli con data
  // futura: se uno non passa, la build fallisce (vedi `lib/cancello.ts`).
  verificaArticoli(tuttiGliArticoli());
  return articoliPubblicati().map((a) => ({ slug: a.slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const a = articolo((await params).slug);
  if (!a) return {};
  const url = `/blog/${a.slug}`;
  return {
    title: `${a.titolo} · Legisboard`,
    description: a.descrizione,
    alternates: { canonical: url },
    authors: [{ name: AUTORI[a.autore as keyof typeof AUTORI].nome, url: `/autore/${a.autore}` }],
    openGraph: {
      type: "article",
      locale: "it_IT",
      siteName: SITO.nome,
      title: a.titolo,
      description: a.descrizione,
      url,
      publishedTime: a.pubblicazione,
      modifiedTime: a.aggiornatoIl,
      authors: [AUTORI[a.autore as keyof typeof AUTORI].nome],
    },
  };
}

// Gli stili del testo si applicano ai FIGLI DIRETTI del contenitore: l'MDX produce paragrafi,
// titoli ed elenchi uno accanto all'altro, mentre i componenti (<Adempimento>, <Norma>…) sono
// <aside> con i loro stili, e un selettore discendente li riscriverebbe.
const TESTO =
  "text-lettura leading-[1.75] " +
  "[&>p]:mt-5 " +
  "[&>h2]:mt-14 [&>h2]:scroll-mt-24 [&>h2]:text-2xl [&>h2]:font-bold [&>h2]:tracking-tight [&>h2]:text-balance " +
  "[&>h3]:mt-10 [&>h3]:scroll-mt-24 [&>h3]:text-lg [&>h3]:font-bold " +
  "[&>ul]:mt-5 [&>ul]:list-disc [&>ul]:space-y-2 [&>ul]:pl-5 [&>ol]:mt-5 [&>ol]:list-decimal [&>ol]:space-y-2 [&>ol]:pl-5 " +
  "[&_a]:font-medium [&_a]:text-primary [&_a]:underline [&_a]:underline-offset-2 " +
  "[&>blockquote]:mt-6 [&>blockquote]:border-l-2 [&>blockquote]:pl-5 [&>blockquote]:text-muted-foreground " +
  "[&>table]:mt-6 [&>table]:w-full [&>table]:text-sm [&_th]:border-b [&_th]:py-2 [&_th]:pr-4 [&_th]:text-left [&_td]:border-b [&_td]:py-2 [&_td]:pr-4 [&_td]:align-top " +
  "[&_strong]:font-semibold [&_strong]:text-foreground";

export default async function PaginaArticolo({ params }: Props) {
  const a = articolo((await params).slug);
  if (!a) notFound();
  const autore = AUTORI[a.autore as keyof typeof AUTORI];
  const Contenuto = await compila(a.corpo);
  const altri = correlati(a);
  const pilastro = PILASTRI[a.decreto];
  const url = `${SITO.url}/blog/${a.slug}`;

  const datiStrutturati = {
    "@context": "https://schema.org",
    "@graph": [
      {
        "@type": "BlogPosting",
        "@id": `${url}#articolo`,
        headline: a.titolo,
        description: a.descrizione,
        datePublished: a.pubblicazione,
        dateModified: a.aggiornatoIl,
        inLanguage: "it",
        mainEntityOfPage: url,
        url,
        image: `${url}/opengraph-image`,
        author: { "@type": "Person", name: autore.nome, url: `${SITO.url}/autore/${a.autore}` },
        publisher: TITOLARE
          ? { "@id": `${SITO.url}/#titolare` }
          : { "@type": "Organization", name: SITO.nome },
        keywords: a.parola_chiave,
        about: ETICHETTE_DOMINIO[a.decreto].esteso,
      },
      {
        "@type": "BreadcrumbList",
        itemListElement: [
          { "@type": "ListItem", position: 1, name: "Legisboard", item: `${SITO.url}/` },
          { "@type": "ListItem", position: 2, name: "Guide", item: `${SITO.url}/blog` },
          { "@type": "ListItem", position: 3, name: a.titolo, item: url },
        ],
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(datiStrutturati) }}
      />
      <Intestazione />
      <main>
        <article className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-16 md:py-20 lg:grid-cols-[minmax(0,42rem)_1fr] lg:gap-16">
          <div className="min-w-0">
            <nav aria-label="Percorso" className="text-sm text-muted-foreground">
              <Link href="/blog" className="hover:text-foreground hover:underline">
                Guide
              </Link>
              <span aria-hidden> / </span>
              <Link href={pilastro.url} className="hover:text-foreground hover:underline">
                {ETICHETTE_DOMINIO[a.decreto].breve}
              </Link>
            </nav>
            <h1 className="mt-6 text-display-sm leading-tight font-extrabold tracking-tight text-balance">
              {a.titolo}
            </h1>
            <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{a.descrizione}</p>
            <div className="mt-6 flex flex-wrap items-center gap-x-4 gap-y-2 border-y py-4 text-sm">
              <PastigliaDominio dominio={a.decreto} />
              <Link href={`/autore/${a.autore}`} className="font-medium hover:underline">
                {autore.nome}
              </Link>
              <span className="text-muted-foreground">
                <time dateTime={a.pubblicazione}>{dataEstesa(a.pubblicazione)}</time>
                {a.aggiornatoIl !== a.pubblicazione ? (
                  <>
                    {" · aggiornato il "}
                    <time dateTime={a.aggiornatoIl}>{dataEstesa(a.aggiornatoIl)}</time>
                  </>
                ) : null}
                {` · ${a.minuti} min di lettura`}
              </span>
            </div>

            <div className={`mt-4 ${TESTO}`}>
              <Contenuto />
            </div>

            <InvitoDemo />

            <p className="text-sm text-muted-foreground">
              Tutti gli adempimenti del decreto, con cadenza e riferimento, sono nella pagina{" "}
              <Link href={pilastro.url} className="font-medium text-primary underline underline-offset-2">
                {pilastro.titoloBreve}
              </Link>
              .
            </p>
          </div>

          {a.titoli.length > 2 ? (
            <aside className="hidden lg:block">
              <nav aria-label="In questa guida" className="sticky top-24 border-l pl-5 text-sm">
                <p className="text-micro font-semibold tracking-widest text-muted-foreground uppercase">
                  In questa guida
                </p>
                <ol className="mt-4 space-y-2.5">
                  {a.titoli.map((t) => (
                    <li key={t.id}>
                      <a href={`#${t.id}`} className="text-muted-foreground hover:text-foreground">
                        {t.testo}
                      </a>
                    </li>
                  ))}
                </ol>
              </nav>
            </aside>
          ) : null}
        </article>

        {altri.length > 0 ? (
          <section aria-labelledby="correlati-titolo" className="border-t bg-surface-sunken">
            <div className="mx-auto w-full max-w-6xl px-5 py-16">
              <h2 id="correlati-titolo" className="text-xl font-bold tracking-tight">
                Sullo stesso decreto
              </h2>
              <ul className="mt-6 grid gap-6 md:grid-cols-3">
                {altri.map((x) => (
                  <li key={x.slug}>
                    <Link href={`/blog/${x.slug}`} className="group block">
                      <p className="font-semibold tracking-tight group-hover:underline">{x.titolo}</p>
                      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{x.descrizione}</p>
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          </section>
        ) : null}
      </main>
      <Piede />
    </>
  );
}
