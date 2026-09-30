import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Intestazione } from "@/components/intestazione";
import { Piede } from "@/components/piede";
import { AUTORI } from "@/lib/autori";
import { articoliPubblicati, dataEstesa } from "@/lib/blog";
import { SITO } from "@/lib/sito";

// LA PAGINA AUTORE: chi firma le guide, e le guide che ha firmato. Serve a Google per dare un
// volto all'esperienza dichiarata; per questo la biografia è solo quella scritta dal committente.

export const revalidate = 86400;
export const dynamicParams = false;

export function generateStaticParams() {
  return Object.keys(AUTORI).map((slug) => ({ slug }));
}

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const slug = (await params).slug as keyof typeof AUTORI;
  const a = AUTORI[slug];
  if (!a) return {};
  // Senza biografia e senza guide la pagina è vuota: esiste per i collegamenti, ma fuori dagli
  // indici finché non ha qualcosa da dire.
  const vuota = a.biografia.length === 0 && !articoliPubblicati().some((x) => x.autore === slug);
  return {
    title: `${a.nome} · Legisboard`,
    ...(vuota ? { robots: { index: false, follow: true } } : {}),
    description: `${a.nome}, ${a.ruolo.toLowerCase()}. Le guide su GDPR, 231 e sicurezza sul lavoro che firma.`,
    alternates: { canonical: `/autore/${slug}` },
  };
}

export default async function PaginaAutore({ params }: Props) {
  const slug = (await params).slug as keyof typeof AUTORI;
  const a = AUTORI[slug];
  if (!a) notFound();
  const firmate = articoliPubblicati().filter((x) => x.autore === slug);
  const persona = {
    "@context": "https://schema.org",
    "@type": "Person",
    "@id": `${SITO.url}/autore/${slug}#persona`,
    name: a.nome,
    jobTitle: a.ruolo,
    url: `${SITO.url}/autore/${slug}`,
    worksFor: { "@id": `${SITO.url}/#titolare` },
  };
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(persona) }} />
      <Intestazione />
      <main className="mx-auto w-full max-w-3xl px-5 py-16 md:py-20">
        <p className="text-micro font-semibold tracking-widest text-primary uppercase">Autore</p>
        <h1 className="mt-4 text-display-sm leading-tight font-extrabold tracking-tight">{a.nome}</h1>
        <p className="mt-2 text-lg text-muted-foreground">{a.ruolo}</p>
        {a.biografia.length > 0 ? (
          <div className="mt-8 space-y-4 leading-relaxed">
            {a.biografia.map((p) => (
              <p key={p.slice(0, 32)}>{p}</p>
            ))}
          </div>
        ) : null}
        {firmate.length > 0 ? (
          <section aria-labelledby="firmate" className="mt-14">
            <h2 id="firmate" className="text-xl font-bold tracking-tight">
              Guide firmate
            </h2>
            <ul className="mt-5 divide-y border-y">
              {firmate.map((x) => (
                <li key={x.slug}>
                  <Link
                    href={`/blog/${x.slug}`}
                    className="group flex flex-wrap items-baseline justify-between gap-2 py-4"
                  >
                    <span className="font-semibold group-hover:underline">{x.titolo}</span>
                    <time dateTime={x.pubblicazione} className="text-sm text-muted-foreground">
                      {dataEstesa(x.pubblicazione)}
                    </time>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ) : null}
      </main>
      <Piede />
    </>
  );
}
