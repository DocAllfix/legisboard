import { PER_DOMINIO, TOTALE } from "./dati";
import { DOMANDE } from "./domande";
import { CONTATTO_EMAIL, SITO, TITOLARE } from "./sito";

// UN SOLO `@graph`, tre nodi. Due limiti detti prima di scoprirli (docs/07 §3.2):
//
// - `SoftwareApplication` senza `offers`: niente prezzi sulla landing, per decisione del
//   committente. Google non mostra il risultato arricchito di un software senza prezzo né
//   valutazioni. Il markup resta: serve a motori e assistenti per capire che cosa è l'entità.
// - `FAQPage`: Google mostra quei risultati arricchiti solo a siti istituzionali e sanitari. Il
//   markup resta utile alle risposte degli assistenti.
//
// `Organization` _(2026-09-28)_: la ditta individuale che offre il servizio, con gli stessi dati
// del piede. Esiste solo se il titolare è impostato: un nome legale inventato in un dato
// strutturato è peggio di nessun nome.

const ORGANIZZAZIONE = TITOLARE
  ? [
      {
        "@type": "Organization",
        "@id": `${SITO.url}/#titolare`,
        name: SITO.nome,
        legalName: TITOLARE.nome,
        url: SITO.url,
        ...(TITOLARE.partitaIva ? { vatID: TITOLARE.partitaIva } : {}),
        ...(TITOLARE.indirizzo ? { address: TITOLARE.indirizzo } : {}),
        ...(CONTATTO_EMAIL ? { email: CONTATTO_EMAIL } : {}),
        ...(TITOLARE.telefono ? { telephone: TITOLARE.telefono } : {}),
      },
    ]
  : [];

export const DATI_STRUTTURATI = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "WebSite",
      "@id": `${SITO.url}/#sito`,
      name: SITO.nome,
      url: SITO.url,
      inLanguage: "it",
    },
    {
      "@type": "SoftwareApplication",
      "@id": `${SITO.url}/#applicazione`,
      ...(TITOLARE ? { publisher: { "@id": `${SITO.url}/#titolare` } } : {}),
      name: SITO.nome,
      url: SITO.url,
      applicationCategory: "BusinessApplication",
      operatingSystem: "Web",
      inLanguage: "it",
      description:
        `Registro unico degli adempimenti GDPR, D.Lgs 231/2001 e D.Lgs 81/2008: ${TOTALE} adempimenti, ` +
        "con lo stato del lavoro separato dallo stato della scadenza.",
      featureList: [
        ...PER_DOMINIO.map((d) => `${d.quanti} adempimenti ${d.etichetta.norma}`),
        "Stato del lavoro e stato della scadenza distinti",
        "Scadenzario unico per i tre decreti",
        "Relazioni intestate allo studio",
        "Secondo fattore di autenticazione",
      ],
    },
    {
      "@type": "FAQPage",
      "@id": `${SITO.url}/#domande`,
      mainEntity: DOMANDE.map((d) => ({
        "@type": "Question",
        name: d.domanda,
        acceptedAnswer: { "@type": "Answer", text: d.risposta },
      })),
    },
    ...ORGANIZZAZIONE,
  ],
} as const;
