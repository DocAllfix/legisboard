import { Logotipo } from "@legisboard/ui/marchio";
import { DOMINI } from "@legisboard/engine";
import Link from "next/link";
import { PILASTRI } from "@/lib/pilastri";
import { CONTATTO_EMAIL, INGRESSO_DEMO, TITOLARE } from "@/lib/sito";
import { ANCORE } from "./intestazione";

// I DATI DEL PRESTATORE, su ogni pagina _(2026-09-28; dal 2026-10-11 «Titolare:», senza la frase
// «Legisboard è un servizio di…», per scelta del committente)_: nome, sede, email, telefono, partita
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
      Titolare: {voci.join(" · ")}
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

// «POWERED BY AXIALOOP» _(2026-10-11, richiesta di Axialoop, approvata dall'utente)_.
//
// Il credito a chi ha sviluppato il prodotto, su ogni pagina pubblica. Il collegamento è
// DOFOLLOW per scelta: niente nofollow, sponsored o ugc. Il marchio è in linea (nessuna richiesta
// in più) e nel colore attenuato del piede: i tre colori originali sono resi come tre intensità
// di `currentColor`, perché un colore scritto a mano non commuterebbe col tema e la guardia dei
// token lo vieta. Area cliccabile alta 24 px.
function PoweredBy() {
  return (
    <a
      href="https://www.axialoop.com/it"
      target="_blank"
      rel="noopener"
      aria-label="powered by Axialoop: sito di Axialoop, che ha sviluppato Legisboard (si apre in una nuova scheda)"
      className="inline-flex min-h-6 items-center gap-2 rounded-sm text-sm hover:text-foreground focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none"
    >
      <svg aria-hidden viewBox="0 0 497 494" className="size-4 shrink-0">
        <path
          fill="currentColor"
          fillRule="evenodd"
          d="M247 4 L139 67 L137 161 L5 238 L4 348 L210 470 L251 490 L492 350 L493 238 L358 158 L358 67 Z M245 231 L248 243 L347 301 L250 358 L197 328 L197 260 Z"
        />
        <path
          fill="currentColor"
          fillOpacity="0.55"
          d="M428 317 L377 290 L256 362 L307 389 L428 320 Z M142 293 L190 323 L193 322 L192 265 Z M10 245 L10 347 L201 459 L246 482 L246 428 L62 321 L60 274 Z M361 231 L355 240 L308 269 L308 272 L349 296 L376 283 L376 241 Z M360 167 L360 224 L434 267 L484 240 Z M246 75 L199 101 L199 188 L246 161 Z M148 67 L193 95 L204 92 L248 66 L301 96 L350 69 L250 9 Z"
        />
        <path
          fill="currentColor"
          fillOpacity="0.3"
          d="M70 317 L248 422 L297 395 L290 388 L120 289 Z M382 246 L383 284 L432 311 L432 273 Z M188 193 L138 166 L17 236 L15 240 L66 267 L183 199 Z M252 76 L253 240 L300 265 L300 103 Z M144 75 L144 159 L193 187 L193 103 Z"
        />
      </svg>
      powered by Axialoop
    </a>
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
          <p className="flex flex-wrap items-center gap-x-3">
            <span>© {new Date().getFullYear()} Legisboard</span>
            <PoweredBy />
          </p>
          <p>La demo gira a Francoforte, con il database nell&apos;Unione europea.</p>
        </div>
      </div>
    </footer>
  );
}
