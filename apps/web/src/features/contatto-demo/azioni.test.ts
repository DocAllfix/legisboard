import { beforeEach, describe, expect, it, vi } from "vitest";

// Il modulo di contatto della demo: ogni strada finisce in un ESITO, mai in un'eccezione, e
// solo una richiesta vera arriva al relay.

const stato = vi.hoisted(() => ({
  mode: "demo" as "demo" | "full",
  destinatario: "contatti@legisboard.eu" as string | undefined,
  posta: true,
  relayRifiuta: false,
  inviate: [] as Array<{ a: string; rispondiA: string; oggetto: string }>,
}));

vi.mock("@/features/auth/guards", () => ({ requireStudio: async () => ({ mode: stato.mode }) }));
vi.mock("@/lib/env", () => ({
  env: new Proxy({}, { get: (_t, k) => (k === "RICHIESTE_DESTINATARIO" ? stato.destinatario : undefined) }),
}));
vi.mock("@/lib/posta", () => ({
  postaConfigurata: () => stato.posta,
  inviaSubito: async (m: { a: string; rispondiA: string; oggetto: string }) => {
    if (stato.relayRifiuta) throw new Error("550 relay denied for mario@example.it");
    stato.inviate.push(m);
  },
}));

const { inviaContattoDemo } = await import("./azioni");

function modulo(campi: Record<string, string> = {}): FormData {
  const d = new FormData();
  const base = {
    motivo: "appuntamento",
    nome: "Mario Rossi",
    email: "mario@example.it",
    studio: "Studio Rossi",
    ruolo: "DPO",
    messaggio: "Vorrei vederla sul nostro caso.",
    sito: "",
    trascorsi: "8000",
    ...campi,
  };
  for (const [k, v] of Object.entries(base)) d.set(k, v);
  return d;
}

beforeEach(() => {
  stato.mode = "demo";
  stato.destinatario = "contatti@legisboard.eu";
  stato.posta = true;
  stato.relayRifiuta = false;
  stato.inviate = [];
});

describe("modulo di contatto della demo", () => {
  it("una richiesta vera parte, con «Rispondi» al visitatore", async () => {
    expect(await inviaContattoDemo(null, modulo())).toEqual({ ok: true });
    expect(stato.inviate).toHaveLength(1);
    expect(stato.inviate[0]).toMatchObject({ a: "contatti@legisboard.eu", rispondiA: "mario@example.it" });
  });

  it("la trappola compilata finge il successo e non spedisce", async () => {
    expect(await inviaContattoDemo(null, modulo({ sito: "https://spam.example" }))).toEqual({ ok: true });
    expect(stato.inviate).toHaveLength(0);
  });

  it("sotto i tre secondi finge il successo e non spedisce", async () => {
    expect(await inviaContattoDemo(null, modulo({ trascorsi: "900" }))).toEqual({ ok: true });
    expect(stato.inviate).toHaveLength(0);
  });

  it("un collegamento nel messaggio è un errore spiegato", async () => {
    const esito = await inviaContattoDemo(null, modulo({ messaggio: "guardate www.example.it" }));
    expect(esito).toEqual({ ok: false, errore: "Il messaggio non può contenere collegamenti." });
  });

  it("senza posta o senza destinatario risponde con un esito", async () => {
    stato.posta = false;
    expect((await inviaContattoDemo(null, modulo())).ok).toBe(false);
    stato.posta = true;
    stato.destinatario = undefined;
    expect((await inviaContattoDemo(null, modulo())).ok).toBe(false);
    expect(stato.inviate).toHaveLength(0);
  });

  it("il rifiuto del relay non restituisce il suo messaggio, che contiene indirizzi", async () => {
    stato.relayRifiuta = true;
    const esito = await inviaContattoDemo(null, modulo());
    expect(esito.ok).toBe(false);
    expect(JSON.stringify(esito)).not.toContain("mario@example.it");
  });

  it("su un'istanza venduta non esiste", async () => {
    stato.mode = "full";
    expect((await inviaContattoDemo(null, modulo())).ok).toBe(false);
    expect(stato.inviate).toHaveLength(0);
  });
});
