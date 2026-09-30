"use server";

import { z } from "zod";
import { requireStudio } from "@/features/auth/guards";
import { env } from "@/lib/env";
import { inviaSubito, postaConfigurata } from "@/lib/posta";

// IL MODULO DI CONTATTO DENTRO LA DEMO PUBBLICA _(2026-09-28)_.
//
// Chi ha appena provato il prodotto e vuole parlarne non deve tornare sulla landing a cercare
// il modulo. È l'unica scrittura che la demo PERMETTE, e non tocca il database: diventa una
// mail alla casella dei contatti, con «Rispondi» che va al visitatore.
//
// Stesse regole della rotta `apps/landing/src/app/api/richieste`: una copia di venti righe, non
// un pacchetto condiviso per uno schema solo. Se una delle due cambia, cambia anche l'altra.
//
// Esiste solo in modalità demo: su un'istanza venduta chi scrive è già un cliente.

const Richiesta = z.object({
  motivo: z.enum(["presentazione", "appuntamento", "acquisto"]),
  nome: z.string().trim().min(2, "Scrivete nome e cognome.").max(120),
  email: z.email("L'email non sembra valida.").max(200),
  studio: z.string().trim().min(2, "Indicate lo studio o l'organizzazione.").max(200),
  ruolo: z.string().trim().min(2, "Scegliete un ruolo.").max(60),
  messaggio: z
    .string()
    .trim()
    .max(2000)
    .optional()
    .refine((m) => !m || !/https?:\/\/|www\./i.test(m), "Il messaggio non può contenere collegamenti."),
  sito: z.string().max(0), // la trappola: deve restare vuota
  trascorsi: z.coerce.number().min(3000), // sotto tre secondi non scrive una persona
});

export type EsitoContatto = { readonly ok: true } | { readonly ok: false; readonly errore: string };

/** Vero se il modulo può davvero consegnare: demo, destinatario e relay configurati. */
export async function contattoDisponibile(): Promise<boolean> {
  return Boolean(env.RICHIESTE_DESTINATARIO) && postaConfigurata();
}

export async function inviaContattoDemo(
  _precedente: EsitoContatto | null,
  dati: FormData,
): Promise<EsitoContatto> {
  const ctx = await requireStudio();
  if (ctx.mode !== "demo") return { ok: false, errore: "Il modulo esiste solo nella demo." };
  if (!(await contattoDisponibile())) {
    return { ok: false, errore: "La posta non è configurata: la richiesta non può partire." };
  }

  const esito = Richiesta.safeParse({
    motivo: dati.get("motivo"),
    nome: dati.get("nome"),
    email: dati.get("email"),
    studio: dati.get("studio"),
    ruolo: dati.get("ruolo"),
    messaggio: dati.get("messaggio") || undefined,
    sito: dati.get("sito") ?? "",
    trascorsi: dati.get("trascorsi"),
  });
  if (!esito.success) {
    // A una trappola scattata si risponde come a un successo: dirlo a un programma gli insegna
    // a non farla scattare.
    const trappola = esito.error.issues.some((i) => i.path[0] === "sito" || i.path[0] === "trascorsi");
    if (trappola) return { ok: true };
    return { ok: false, errore: esito.error.issues[0]?.message ?? "Controllate i campi." };
  }
  const d = esito.data;

  try {
    await inviaSubito({
      a: env.RICHIESTE_DESTINATARIO!,
      rispondiA: d.email,
      oggetto: `Legisboard · dalla demo · ${d.motivo} · ${d.studio}`,
      testo: [
        "Richiesta inviata dall'interno della demo pubblica.",
        "",
        `Motivo: ${d.motivo}`,
        `Nome: ${d.nome}`,
        `Email: ${d.email}`,
        `Studio: ${d.studio}`,
        `Ruolo: ${d.ruolo}`,
        "",
        d.messaggio || "(nessun messaggio)",
      ].join("\n"),
    });
  } catch {
    // Il messaggio del relay può contenere indirizzi e nomi di host: non si restituisce.
    return {
      ok: false,
      errore: "Il servizio di posta non ha accettato la richiesta. Riprovate fra qualche minuto.",
    };
  }
  return { ok: true };
}
