import { Codice, PastigliaDominio, Scadenza } from "@legisboard/ui/stato";
import { ArrowRight } from "lucide-react";
import { ComeFunziona } from "@/components/come-funziona";
import { Confronto } from "@/components/confronto";
import { Contatti } from "@/components/contatti";
import { Intestazione } from "@/components/intestazione";
import { Mappa } from "@/components/mappa";
import { Matrice } from "@/components/matrice";
import { Mazzo } from "@/components/mazzo";
import { Metodo } from "@/components/metodo";
import { ModuloRichiesta } from "@/components/modulo-richiesta";
import { Piede } from "@/components/piede";
import { SchedaInstallazione } from "@/components/scheda-installazione";
import {
  COLLEGAMENTO_SU_OLIVA,
  FRECCIA_CTA,
  PULSANTE_PIENO,
  PULSANTE_PIENO_SU_OLIVA,
} from "@/components/pulsanti";
import { INCROCIO, TOTALE } from "@/lib/dati";
import { DATI_STRUTTURATI } from "@/lib/dati-strutturati";
import { DOMANDE } from "@/lib/domande";
import { CONTATTO_POSSIBILE, INGRESSO_DEMO, RICHIESTE_ATTIVE } from "@/lib/sito";

// Statica, rigenerata ogni giorno: i dati della demo sono relativi a oggi (vedi `lib/dati.ts`).
export const revalidate = 86400;

// LA SECONDA VERSIONE _(2026-09-24)_, dopo il giudizio del committente: «troppo basic».
//
// La diagnosi, fatta confrontando la pagina con evalisdeck.it ed evalisacademy.it alla stessa
// larghezza: un titolo in Geist semibold che non aveva carattere, un mazzo di tre carte bianche
// su avorio senza un punto dove l'occhio si fermasse, e lo STESSO riquadro bianco bordato
// ripetuto in ogni sezione. Sembrava un modello perché era costruita come un modello.
//
// Le mosse, tutte dentro il sistema scelto (Geist, oliva 110, «quieto»):
// - l'eroe è oliva scura, il colore della barra del prodotto: i fogli del mazzo diventano carta
//   su un sottomano verde. Nessuno nel settore usa questo colore; il riflesso sarebbe il blu;
// - il titolo in Geist extrabold, grande, stretto: lo stesso carattere, con il peso che mancava;
// - la fascia «numero grande, etichetta piccola» è sparita: al suo posto il catalogo reso
//   visibile, 171 caselle, con in rosso le completate e scadute;
// - un prima e dopo che vende la tesi in due secondi;
// - niente griglie di riquadri gemelli: numerali grandi per i passi, una scheda tecnica per la
//   distribuzione, e una chiusura oliva che fa coppia con l'eroe.
//
// Scartato di proposito, e scritto perché non ritorni: l'impianto «editoriale» con colonne
// separate da filetti ed etichette in mono. È la corsia estetica più satura del momento, e
// il riferimento ci sta già dentro.

function Occhiello({ children, su = "chiaro" }: { children: React.ReactNode; su?: "chiaro" | "oliva" }) {
  const colore = su === "oliva" ? "text-sidebar-accento" : "text-primary";
  const riga = su === "oliva" ? "bg-sidebar-accento" : "bg-primary";
  return (
    <p className={`flex items-center gap-3 text-micro font-semibold tracking-widest uppercase ${colore}`}>
      <span className={`h-px w-8 shrink-0 ${riga}`} aria-hidden />
      {children}
    </p>
  );
}

function TitoloSezione({
  id,
  occhiello,
  titolo,
  sotto,
}: {
  id: string;
  occhiello: string;
  titolo: string;
  sotto?: string;
}) {
  return (
    <div className="affiora max-w-3xl">
      <Occhiello>{occhiello}</Occhiello>
      <h2 id={id} className="mt-5 text-display-sm leading-tight font-extrabold tracking-tight text-balance">
        {titolo}
      </h2>
      {sotto ? <p className="mt-5 max-w-2xl text-lg leading-relaxed text-muted-foreground">{sotto}</p> : null}
    </div>
  );
}

export default function Pagina() {
  // Una costante locale resta ristretta anche dentro `map`; quella del modulo no.
  const incrocio = INCROCIO;
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(DATI_STRUTTURATI) }}
      />
      <Intestazione />
      <main>
        {/* ================================================================== EROE */}
        <section
          aria-labelledby="titolo"
          className="relative overflow-hidden bg-sidebar text-sidebar-foreground"
        >
          <div aria-hidden className="registro pointer-events-none absolute inset-0" />
          <div className="relative mx-auto grid w-full max-w-6xl items-center gap-16 px-5 py-20 md:py-28 lg:grid-cols-[1.1fr_1fr]">
            <div className="min-w-0">
              <Occhiello su="oliva">GDPR · D.Lgs 231/2001 · D.Lgs 81/2008</Occhiello>
              {/* L'LCP della pagina: testo, mai dentro un'animazione. */}
              <h1
                id="titolo"
                className="mt-7 text-display leading-none font-extrabold tracking-tight text-balance"
              >
                Fatto e in regola non sono la stessa cosa.
              </h1>
              <p className="mt-6 text-2xl font-semibold tracking-tight text-sidebar-accento">
                Legisboard li tiene separati.
              </p>
              <p className="mt-6 max-w-xl text-lg leading-relaxed text-sidebar-muted">
                Un solo registro per i tre decreti: {TOTALE} adempimenti, e per ognuno due stati distinti. Il
                lavoro lo decide una persona, la scadenza la decide la data. Un documento redatto a marzo e
                scaduto a settembre smette di sembrare a posto.
              </p>
              <div className="mt-10 flex flex-wrap items-center gap-x-7 gap-y-3">
                <a href={INGRESSO_DEMO} className={PULSANTE_PIENO_SU_OLIVA}>
                  Entra nella demo <ArrowRight className={FRECCIA_CTA} aria-hidden />
                </a>
                <a href={CONTATTO_POSSIBILE ? "#richiesta" : "#problema"} className={COLLEGAMENTO_SU_OLIVA}>
                  {CONTATTO_POSSIBILE ? "Richiedi una presentazione" : "Guarda il problema"}
                </a>
              </div>
              <p className="mt-5 text-sm text-sidebar-muted">
                Un&apos;azienda d&apos;esempio già compilata. Nessuna registrazione: si entra con un clic.
              </p>
            </div>
            <Mazzo />
          </div>
        </section>

        {/* ============================================================ IL PROBLEMA */}
        <section id="problema" aria-labelledby="problema-titolo">
          <div className="mx-auto w-full max-w-6xl px-5 py-24 md:py-32">
            <TitoloSezione
              id="problema-titolo"
              occhiello="Il problema"
              titolo="«Completata» e «Scaduta», nella stessa riga."
              sotto="Ogni adempimento ha due stati. Lo stato del lavoro lo decide una persona; lo stato della scadenza lo decide la data. «Completata e scaduta» è il caso più frequente e il più pericoloso: il documento fu redatto, il ciclo è scaduto."
            />
            <div className="affiora mt-14">
              <Confronto />
            </div>

            <div className="mt-24 grid gap-12 lg:grid-cols-[1fr_1.4fr]">
              <div className="affiora min-w-0">
                <h3 className="text-2xl font-extrabold tracking-tight">Provatelo sui numeri veri.</h3>
                <p className="mt-4 max-w-md leading-relaxed text-muted-foreground">
                  È la matrice dell&apos;azienda d&apos;esempio, lavoro per scadenza. Scegliete una cella:
                  sotto compaiono gli adempimenti che ci stanno dentro.
                </p>
              </div>
              <div className="affiora min-w-0">
                <Matrice />
              </div>
            </div>
          </div>
        </section>

        {/* ============================================================ IL CATALOGO */}
        <section id="decreti" aria-labelledby="decreti-titolo" className="bg-surface-sunken">
          <div className="mx-auto w-full max-w-6xl px-5 py-24 md:py-32">
            <TitoloSezione
              id="decreti-titolo"
              occhiello="Il catalogo"
              titolo={`${TOTALE} adempimenti, un registro.`}
              sotto="I tre decreti stanno nello stesso catalogo e nella stessa agenda. Dove un adempimento serve a più decreti, lo si registra una volta sola."
            />
            <div className="affiora mt-14">
              <Mappa />
            </div>

            {incrocio ? (
              <div className="affiora mt-16 max-w-3xl">
                <h3 className="text-lg font-bold tracking-tight">Un adempimento, più letture.</h3>
                <div className="mt-4 flex flex-wrap items-center gap-x-4 gap-y-2 rounded-lg bg-surface p-5 text-sm">
                  <PastigliaDominio dominio={incrocio.dominio} />
                  <Codice codice={incrocio.codice} />
                  <span className="min-w-0 flex-1 truncate font-medium">{incrocio.titolo}</span>
                  <Scadenza
                    data={incrocio.scadenza}
                    giorni={incrocio.giorni}
                    statoScadenza={incrocio.statoScadenza}
                  />
                  <span className="flex w-full flex-wrap items-center gap-x-3 gap-y-2 text-xs text-muted-foreground">
                    lo leggono
                    {incrocio.usi.map((u) => (
                      <span key={`${u.dominio}:${u.codice}`} className="flex items-center gap-1.5">
                        <PastigliaDominio dominio={u.dominio} />
                        <Codice codice={u.codice} origine={incrocio.dominio} />
                      </span>
                    ))}
                    con il codice e il colore del proprietario
                  </span>
                </div>
              </div>
            ) : null}
          </div>
        </section>

        {/* ========================================================= COME FUNZIONA */}
        <section id="come-funziona" aria-labelledby="come-titolo">
          <div className="mx-auto w-full max-w-6xl px-5 py-24 md:py-32">
            <TitoloSezione
              id="come-titolo"
              occhiello="Come funziona"
              titolo="Tre gesti. Le date le calcola il motore."
            />
            <ComeFunziona />
          </div>
        </section>

        {/* ============================================================ IL METODO */}
        <section id="metodo" aria-labelledby="metodo-titolo" className="bg-surface-sunken">
          <div className="mx-auto w-full max-w-6xl px-5 py-24 md:py-32">
            <TitoloSezione
              id="metodo-titolo"
              occhiello="Il metodo"
              titolo="Quattro regole che il prodotto non piega."
              sotto="Ognuna con la sua prova, presa dall'azienda d'esempio."
            />
            <Metodo />
          </div>
        </section>

        {/* ========================================================= DISTRIBUZIONE */}
        {/* Nessun prezzo: decisione del committente del 2026-09-24. La scheda è un foglio da
            firmare: vedi `components/scheda-installazione.tsx`. */}
        <section id="distribuzione" aria-labelledby="distribuzione-titolo">
          <div className="mx-auto grid w-full max-w-6xl items-start gap-12 px-5 py-24 md:py-32 lg:grid-cols-[1fr_1.5fr]">
            <div>
              <TitoloSezione
                id="distribuzione-titolo"
                occhiello="Distribuzione"
                titolo="Un'installazione per studio."
                sotto="Legisboard non è un servizio a cui ci si iscrive. L'accordo si fa di persona."
              />
              <div className="affiora mt-8">
                <a
                  href={CONTATTO_POSSIBILE ? "/?motivo=appuntamento#richiesta" : INGRESSO_DEMO}
                  className={PULSANTE_PIENO}
                >
                  {CONTATTO_POSSIBILE ? "Fissa un appuntamento" : "Entra nella demo"}
                </a>
              </div>
            </div>
            <SchedaInstallazione />
          </div>
        </section>

        {/* ============================================================== DOMANDE */}
        <section id="domande" aria-labelledby="domande-titolo" className="bg-surface-sunken">
          <div className="mx-auto grid w-full max-w-6xl gap-12 px-5 py-24 md:py-32 lg:grid-cols-[1fr_1.6fr]">
            <TitoloSezione
              id="domande-titolo"
              occhiello="Domande"
              titolo="Le risposte che chiedereste al telefono."
            />
            <div className="affiora divide-y divide-border-strong border-y border-border-strong">
              {DOMANDE.map((d) => (
                <details key={d.domanda} className="group">
                  <summary className="flex min-h-14 cursor-pointer list-none items-center justify-between gap-4 py-5 text-lg font-semibold">
                    {d.domanda}
                    <span
                      aria-hidden
                      className="text-2xl leading-none text-primary motion-safe:transition-transform group-open:rotate-45"
                    >
                      +
                    </span>
                  </summary>
                  <p className="max-w-2xl pb-6 leading-relaxed text-muted-foreground">{d.risposta}</p>
                </details>
              ))}
            </div>
          </div>
        </section>

        {/* ============================================================= RICHIESTA */}
        {RICHIESTE_ATTIVE ? <ModuloRichiesta /> : <Contatti />}

        {/* ============================================================= CHIUSURA */}
        {/* Oliva, come l'eroe: la pagina si apre e si chiude sullo stesso colore. */}
        <section aria-labelledby="chiusura-titolo" className="bg-sidebar text-sidebar-foreground">
          <div className="mx-auto flex w-full max-w-6xl flex-col items-start gap-10 px-5 py-24 md:py-32 lg:flex-row lg:items-end lg:justify-between">
            <h2
              id="chiusura-titolo"
              className="max-w-3xl text-display leading-none font-extrabold tracking-tight text-balance"
            >
              Il modo più rapido per capirlo è entrarci.
            </h2>
            <a href={INGRESSO_DEMO} className={PULSANTE_PIENO_SU_OLIVA}>
              Entra nella demo <ArrowRight className={FRECCIA_CTA} aria-hidden />
            </a>
          </div>
        </section>
      </main>
      <Piede />
    </>
  );
}
