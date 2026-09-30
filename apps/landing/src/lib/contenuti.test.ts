import { CATALOGHI, DOMINI } from "@legisboard/engine";
import { describe, expect, it } from "vitest";
import { pubblicato, type Articolo } from "./blog";
import { verificaArticoli } from "./cancello";
import { PILASTRI } from "./pilastri";

// Pilastri, blog e cancello editoriale _(docs/08)_. Il cancello protegge articoli scritti da una
// routine senza nessuno davanti: se smettesse di fermare qualcosa, lo si deve sapere qui e non
// da un articolo sbagliato uscito a firma del committente.

function articolo(parziale: Partial<Articolo> = {}): Articolo {
  const paragrafo = "Questo paragrafo di prova serve a misurare la lunghezza dell'articolo. ".repeat(40);
  return {
    titolo: "Un articolo di prova sul DVR",
    descrizione: "Una descrizione di prova abbastanza lunga da essere valida per lo schema del blog.",
    pubblicazione: "2026-09-01",
    autore: "alessandro-di-lonardo",
    decreto: "d81",
    parola_chiave: "prova dvr",
    codici_catalogo: ["S01"],
    bozza: false,
    slug: "prova",
    aggiornatoIl: "2026-09-01",
    minuti: 5,
    titoli: [
      { id: "a", testo: "A" },
      { id: "b", testo: "B" },
      { id: "c", testo: "C" },
    ],
    corpo: `Vedi [il pilastro](/adempimenti-sicurezza-sul-lavoro).\n\n## A\n\n${paragrafo}\n\n## B\n\n${paragrafo}\n\n## C\n\n${paragrafo}`,
    ...parziale,
  };
}

describe("pilastri", () => {
  it("ce n'è uno per ogni decreto, con un URL distinto", () => {
    expect(DOMINI.map((d) => PILASTRI[d].dominio)).toEqual([...DOMINI]);
    expect(new Set(DOMINI.map((d) => PILASTRI[d].url)).size).toBe(DOMINI.length);
  });

  it("i cataloghi che le tabelle mostrano sono quelli del motore: 42, 65, 64", () => {
    expect(CATALOGHI.gdpr).toHaveLength(42);
    expect(CATALOGHI.d231).toHaveLength(65);
    expect(CATALOGHI.d81).toHaveLength(64);
  });
});

describe("pubblicazione", () => {
  it("data futura o bozza = invisibile", () => {
    expect(pubblicato(articolo(), "2026-09-30")).toBe(true);
    expect(pubblicato(articolo({ pubblicazione: "2026-10-01" }), "2026-09-30")).toBe(false);
    expect(pubblicato(articolo({ bozza: true }), "2026-09-30")).toBe(false);
  });
});

describe("cancello editoriale", () => {
  it("un articolo in regola passa", () => {
    expect(() => verificaArticoli([articolo()])).not.toThrow();
  });

  it("ferma un codice di catalogo inventato", () => {
    expect(() => verificaArticoli([articolo({ codici_catalogo: ["XX99"] })])).toThrow(/XX99/);
    const corpo = `${articolo().corpo}\n\n<Adempimento dominio="d81" codice="XX99" />`;
    expect(() => verificaArticoli([articolo({ corpo })])).toThrow(/XX99/);
  });

  it("ferma due articoli con la stessa parola chiave", () => {
    expect(() => verificaArticoli([articolo(), articolo({ slug: "altro" })])).toThrow(/parola chiave/);
  });

  it("ferma le promesse legali e la lineetta lunga", () => {
    expect(() => verificaArticoli([articolo({ corpo: `${articolo().corpo} Sarete a norma.` })])).toThrow(
      /vietata/,
    );
    expect(() => verificaArticoli([articolo({ corpo: `${articolo().corpo} Un inciso — qui.` })])).toThrow(
      /vietata/,
    );
  });

  it("pretende il collegamento al pilastro e rifiuta i collegamenti interni rotti", () => {
    const senza = articolo().corpo.replace("(/adempimenti-sicurezza-sul-lavoro)", "(/)");
    expect(() => verificaArticoli([articolo({ corpo: senza })])).toThrow(/pilastro/);
    expect(() =>
      verificaArticoli([articolo({ corpo: `${articolo().corpo} [x](/blog/non-esiste)` })]),
    ).toThrow(/rotto/);
  });

  it("ferma un articolo troppo corto", () => {
    expect(() =>
      verificaArticoli([articolo({ corpo: "Breve. [p](/adempimenti-sicurezza-sul-lavoro)" })]),
    ).toThrow(/parole/);
  });
});
