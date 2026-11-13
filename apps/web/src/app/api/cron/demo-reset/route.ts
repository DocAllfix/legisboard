import { assicuraUtenteDemo, istanzaDemo, pulisciTracceDemo, ripristinaDemo } from "@/lib/db/demo";
import { db } from "@/lib/db";
import { invalidaDati } from "@/lib/cache";
import { env } from "@/lib/env";

// IL RIPRISTINO NOTTURNO DELLA DEMO PUBBLICA _(docs/07 §5.3)_.
//
// I visitatori condividono un solo insieme di dati e cambiano gli stati degli adempimenti:
// è ciò per cui entrano. Ogni notte l'azienda d'esempio torna com'era, e l'utente dimostrativo
// viene riparato — password e secondo fattore riportati allo stato dell'ambiente.
//
// Lo chiama Vercel Cron con `Authorization: Bearer <CRON_SECRET>`. Senza il segreto, o su
// un'istanza che non è in modalità demo, non fa niente: un'istanza venduta non deve avere un
// indirizzo che cancella un'azienda, nemmeno protetto.

export async function GET(richiesta: Request) {
  if (!env.CRON_SECRET || richiesta.headers.get("authorization") !== `Bearer ${env.CRON_SECRET}`) {
    return new Response("Non autorizzato", { status: 401 });
  }
  if (!(await istanzaDemo())) return new Response("Non trovato", { status: 404 });

  const esito = await ripristinaDemo();
  const utente = await assicuraUtenteDemo();
  const tracce = await pulisciTracceDemo();
  // La cache dei calcoli si invalida solo dalle azioni che scrivono, e il ripristino scrive
  // fuori da ogni azione: senza questa riga la demo mostrava i dati della sera prima per
  // altri cinque minuti _(2026-11-13)_. Sta qui e non in `ripristinaDemo` perché quella gira
  // anche da riga di comando, dove `revalidateTag` non ha un server da avvisare.
  const studio = await db.query.organization.findFirst({ columns: { id: true } });
  if (studio) invalidaDati(studio.id);
  const riuscito = esito.stato === "ripristinata" || esito.stato === "creata";
  return Response.json({ esito, utente, tracce }, { status: riuscito ? 200 : 500 });
}
