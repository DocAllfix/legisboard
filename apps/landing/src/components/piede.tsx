import { Logotipo } from "@legisboard/ui/marchio";
import { DOMINI } from "@legisboard/engine";
import Link from "next/link";
import { PILASTRI } from "@/lib/pilastri";
import { CONTATTO_EMAIL, INGRESSO_DEMO, TITOLARE } from "@/lib/sito";
import { ANCORE } from "./intestazione";

// I DATI DEL PRESTATORE, su ogni pagina _(2026-09-28)_: nome, sede, email, telefono, partita
// IVA ed eventuale REA, come chiedono il D.Lgs 70/2003 (art. 7) e il DPR 633/1972 (art. 35). Si
// leggono da `TITOLARE` in `lib/sito.ts`: una voce senza valore semplicemente non compare, così
// il piede non mostra mai un «da completare».
function DatiPrestatore() {
  if (!TITOLARE) return null;
  const voci = [
    TITOLARE.nome,
    TITOLARE.indirizzo ?? TITOLARE.citta,
    TITOLARE.partitaIva ? `P.IVA ${TITOLARE.partitaIva}` : null,
    TITOLARE.codiceFiscale ? `C.F. ${TITOLARE.codiceFiscale}` : null,
    TITOLARE.rea ? `REA ${TITOLARE.rea}` : null,
  ].filter(Boolean);
  return (
    <p className="basis-full leading-relaxed">
      Legisboard è un servizio di {voci.join(" · ")}
      {CONTATTO_EMAIL ? (
        <>
          {" · "}
          <a href={`mailto:${CONTATTO_EMAIL}`} className="underline underline-offset-2">
            {CONTATTO_EMAIL}
          </a>
        </>
      ) : null}
      {TITOLARE.telefono ? (
        <>
          {" · "}
          <a href={`tel:${TITOLARE.telefono.replace(/s/g, "")}`} className="underline underline-offset-2">
            {TITOLARE.telefono}
          </a>
        </>
      ) : null}
    </p>
  );
}

export function Piede() {
  return (
    <footer className="border-t bg-surface">
      <div className="mx-auto grid w-full max-w-6xl gap-10 px-5 py-16 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1fr]">
        <div>
          <Logotipo className="h-6 w-auto" />
          <p className="mt-4 max-w-sm text-sm leading-relaxed text-muted-foreground">
            Il registro unico degli adempimenti GDPR, D.Lgs 231/2001 e D.Lgs 81/2008, con lo stato del lavoro
            separato dalla scadenza.
          </p>
        </div>
        <nav aria-label="Pagina">
          <p className="text-micro font-semibold tracking-widest text-muted-foreground uppercase">Pagina</p>
          <ul className="mt-4 space-y-2 text-sm">
            {ANCORE.map(([href, testo]) => (
              <li key={href}>
                <a href={href} className="hover:underline">
                  {testo}
                </a>
              </li>
            ))}
          </ul>
        </nav>
        <nav aria-label="Adempimenti">
          <p className="text-micro font-semibold tracking-widest text-muted-foreground uppercase">
            Adempimenti
          </p>
          <ul className="mt-4 space-y-2 text-sm">
            {DOMINI.map((d) => (
              <li key={d}>
                <Link href={PILASTRI[d].url} className="hover:underline">
                  {PILASTRI[d].titoloBreve}
                </Link>
              </li>
            ))}
            <li>
              <Link href="/blog" className="hover:underline">
                Tutte le guide
              </Link>
            </li>
          </ul>
        </nav>
        <div>
          <p className="text-micro font-semibold tracking-widest text-muted-foreground uppercase">Prodotto</p>
          <ul className="mt-4 space-y-2 text-sm">
            <li>
              <a href={INGRESSO_DEMO} className="hover:underline">
                Entra nella demo
              </a>
            </li>
            <li>
              <a href="/privacy" className="hover:underline">
                Informativa privacy
              </a>
            </li>
            <li>
              <a href="/cookie" className="hover:underline">
                Cookie
              </a>
            </li>
          </ul>
        </div>
      </div>
      <div className="border-t">
        <div className="mx-auto flex w-full max-w-6xl flex-wrap justify-between gap-4 px-5 py-6 text-xs text-muted-foreground">
          <DatiPrestatore />
          <p>© {new Date().getFullYear()} Legisboard</p>
          <p>La demo gira a Francoforte, con il database nell&apos;Unione europea.</p>
        </div>
      </div>
    </footer>
  );
}
