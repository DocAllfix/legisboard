import { Intestazione } from "./intestazione";
import { Piede } from "./piede";

// L'IMPAGINATO DELLE DUE INFORMATIVE. Testo lungo, una colonna sola di misura leggibile, i
// titoli come ancore: chi arriva da un collegamento del modulo cerca una riga, non legge tutto.
//
// Gli stili stanno qui e non in un plugin tipografico: sono quattro elementi, e un plugin per
// quattro elementi è una dipendenza in più da tenere allineata ai token.

export function PaginaLegale({
  titolo,
  sotto,
  revisione,
  children,
}: {
  titolo: string;
  sotto: string;
  revisione: string;
  children: React.ReactNode;
}) {
  return (
    <>
      <Intestazione />
      <main className="border-b">
        <article className="mx-auto w-full max-w-3xl px-5 py-20 md:py-24">
          <h1 className="text-display-sm leading-tight font-semibold tracking-tight text-balance">
            {titolo}
          </h1>
          <p className="mt-5 text-lg leading-relaxed text-muted-foreground">{sotto}</p>
          <p className="mt-3 text-sm text-muted-foreground">Ultima revisione: {revisione}.</p>
          <div
            className={
              "mt-14 space-y-5 leading-relaxed " +
              "[&_h2]:mt-14 [&_h2]:scroll-mt-24 [&_h2]:text-xl [&_h2]:font-semibold [&_h2]:tracking-tight " +
              "[&_a]:font-medium [&_a]:underline [&_a]:underline-offset-2 " +
              "[&_ul]:list-disc [&_ul]:space-y-2 [&_ul]:pl-5 " +
              "[&_table]:w-full [&_table]:text-sm [&_td]:border-t [&_td]:py-3 [&_td]:pr-4 [&_td]:align-top " +
              "[&_th]:pb-2 [&_th]:pr-4 [&_th]:text-left [&_th]:font-semibold [&_code]:font-mono [&_code]:text-sm [&_code]:break-all"
            }
          >
            {children}
          </div>
        </article>
      </main>
      <Piede />
    </>
  );
}
