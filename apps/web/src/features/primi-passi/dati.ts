import { and, asc, count, eq, isNotNull, ne, or } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  clientCompany,
  companyModule,
  evidence,
  invitation,
  member,
  obligationInstance,
  registro,
  report,
  user,
} from "@/lib/db/schema";
import { requireStudio } from "@/features/auth/guards";

// I PRIMI PASSI DI UN'ISTANZA NUOVA _(2026-11-12)_.
//
// Un'istanza consegnata vuota non ha niente da far vedere ai tour: si aprono sui dati, e senza
// dati tacciono. Questa lista porta il cliente dal primo accesso all'uso completo, una cosa per
// volta, e ogni tappa si spunta DA SOLA quando la cosa è stata fatta davvero: è letta dal
// database, non da un clic su «fatto». Una lista che si spunta a mano dice cosa si è promesso,
// non cosa si è fatto.
//
// Sparisce quando è finita, o quando chi la guarda la chiude. La chiusura sta in `tourVisti`
// sotto la chiave `primi-passi`: lo stesso campo dei tour, nessuna migrazione.

export const CHIAVE_PRIMI_PASSI = "primi-passi";

export type Tappa = {
  readonly chiave: string;
  readonly titolo: string;
  readonly perche: string;
  readonly href: string;
  readonly fatta: boolean;
};

export async function primiPassi(): Promise<{ studio: string; tappe: readonly Tappa[] } | null> {
  const ctx = await requireStudio();
  // In demo i dati ci sono già, e un visitatore in sola lettura non può fare le tappe.
  if (ctx.mode === "demo" || ctx.ruolo === "viewer") return null;

  const org = ctx.organizationId;
  const u = await db.query.user.findFirst({ where: eq(user.id, ctx.userId), columns: { tourVisti: true } });
  if ((u?.tourVisti ?? {})[CHIAVE_PRIMI_PASSI]) return null;

  const [prima] = await db
    .select({ id: clientCompany.id })
    .from(clientCompany)
    .where(
      and(
        eq(clientCompany.organizationId, org),
        eq(clientCompany.stato, "active"),
        eq(clientCompany.isDemo, false),
      ),
    )
    .orderBy(asc(clientCompany.createdAt))
    .limit(1);

  const [modulo] = prima
    ? await db
        .select({ dominio: companyModule.dominio })
        .from(companyModule)
        .where(and(eq(companyModule.clientCompanyId, prima.id), eq(companyModule.attivo, true)))
        .limit(1)
    : [];

  const quanti = async (q: Promise<{ n: number }[]>) => ((await q)[0]?.n ?? 0) > 0;

  const [adempimento, prova, fatto, relazione, collega] = await Promise.all([
    quanti(
      db
        .select({ n: count() })
        .from(obligationInstance)
        .where(
          and(
            eq(obligationInstance.organizationId, org),
            or(isNotNull(obligationInstance.ultimaEsecuzione), ne(obligationInstance.stato, "Da fare")),
          ),
        ),
    ),
    quanti(db.select({ n: count() }).from(evidence).where(eq(evidence.organizationId, org))),
    quanti(db.select({ n: count() }).from(registro).where(eq(registro.organizationId, org))),
    quanti(db.select({ n: count() }).from(report).where(eq(report.organizationId, org))),
    Promise.all([
      db.select({ n: count() }).from(member).where(eq(member.organizationId, org)),
      db.select({ n: count() }).from(invitation).where(eq(invitation.organizationId, org)),
    ]).then(([m, i]) => (m[0]?.n ?? 0) > 1 || (i[0]?.n ?? 0) > 0),
  ]);

  const azienda = prima ? `/azienda/${prima.id}` : "/portafoglio";
  const assessment = prima && modulo ? `${azienda}/${modulo.dominio}` : azienda;
  const visti = u?.tourVisti ?? {};

  const tappe: Tappa[] = [
    {
      chiave: "azienda",
      titolo: "Aggiungi la prima azienda, con i suoi decreti",
      perche: "Scegliendo GDPR, 231 o sicurezza sul lavoro, gli adempimenti del decreto nascono subito.",
      href: "/portafoglio",
      fatta: Boolean(prima && modulo),
    },
    {
      chiave: "adempimento",
      titolo: "Registra il primo adempimento svolto",
      perche: "Con la data dell'ultima esecuzione il sistema calcola da solo quando scade di nuovo.",
      href: assessment,
      fatta: adempimento,
    },
    {
      chiave: "evidenza",
      titolo: "Allega un documento come evidenza",
      perche: "Senza documento un adempimento fatto resta una dichiarazione.",
      href: assessment,
      fatta: prova,
    },
    {
      chiave: "registro",
      titolo: "Annota un fatto in un registro",
      perche: "Violazioni, richieste degli interessati, segnalazioni: hanno un termine, non una periodicità.",
      href: azienda,
      fatta: fatto,
    },
    {
      chiave: "scadenzario",
      titolo: "Guarda cosa scade, sui tre decreti",
      perche: "Lo scadenzario unico è la lista di lavoro della settimana.",
      href: "/scadenzario",
      fatta: (visti.scadenzario ?? 0) > 0,
    },
    {
      chiave: "relazione",
      titolo: "Genera la prima relazione",
      perche: "Il documento da consegnare al cliente, con i numeri congelati e l'impronta.",
      href: prima ? `${azienda}/relazioni` : "/portafoglio",
      fatta: relazione,
    },
    {
      chiave: "collega",
      titolo: "Invita un collega dello studio",
      perche: "Ognuno con il proprio accesso e il proprio ruolo, e ogni modifica firmata.",
      href: "/impostazioni",
      fatta: collega,
    },
  ];

  if (tappe.every((t) => t.fatta)) return null;
  return { studio: ctx.studioNome, tappe };
}
