// GLI AUTORI DEL BLOG. La chiave è lo slug della pagina autore (`/autore/<chiave>`).
//
// La biografia la dà il committente: finché manca, la pagina autore mostra solo nome e ruolo,
// e i dati strutturati `Person` non inventano titoli o esperienze. Un'esperienza dichiarata
// e non vera, in un blog di conformità, è il danno di reputazione più rapido che esista.

export type Autore = {
  readonly nome: string;
  readonly ruolo: string;
  /** Paragrafi della biografia. Vuota finché il committente non la scrive. */
  readonly biografia: readonly string[];
};

export const AUTORI = {
  "alessandro-di-lonardo": {
    nome: "Alessandro Di Lonardo",
    ruolo: "Fondatore di Legisboard",
    biografia: [] as readonly string[],
  },
} as const satisfies Record<string, Autore>;

export type ChiaveAutore = keyof typeof AUTORI;
