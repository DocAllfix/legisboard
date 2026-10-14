// LA KEYWORD RESEARCH, RIPRODUCIBILE _(2026-10-14, docs/08)_.
//
//   node apps/landing/scripts/keyword-research.mjs [cartella]   (predefinita: keywordblog/)
//
// Legge gli export CSV dello strumento di keyword research, li normalizza, li filtra per
// pertinenza al D.Lgs 231/2001 e all'Organismo di Vigilanza, li deduplica e li raggruppa nei
// cluster del piano editoriale. Stampa l'audit e scrive `apps/landing/content/keyword-research.json`,
// l'unico prodotto che entra nel repository: i CSV grezzi vengono da uno strumento esterno e
// restano fuori (`keywordblog/` è in `.gitignore`).
//
// IL FILTRO È IL PUNTO CRITICO. Su «231» e «odv» tre quarti del volume sono rumore:
//   - omonimi del numero (lotto, strade, motoseghe, Pokémon, valori del sangue, aerei, unità);
//   - ALTRE LEGGI «231»: il D.Lgs 231/2002 (interessi moratori) e il D.Lgs 231/2007
//     (antiriciclaggio), che hanno intento diverso;
//   - «odv» come Organizzazione di Volontariato: centinaia di associazioni, canili, onlus.
// Le regole stanno qui sotto, scritte: se un file nuovo porta rumore nuovo, si aggiungono qui.
//
// Supporta solo CSV. Gli export .xlsx (fogli per piattaforma, intestazione alla riga 7) si
// aggiungono quando ne arriva uno: oggi richiederebbero una dipendenza per un file che non c'è.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";

const cartella = process.argv[2] ?? "keywordblog";
const USCITA = "apps/landing/content/keyword-research.json";

// --- Lettura -------------------------------------------------------------------------------

function csv(testo) {
  const righe = [];
  let riga = [];
  let campo = "";
  let virgolette = false;
  for (let i = 0; i < testo.length; i++) {
    const c = testo[i];
    if (virgolette) {
      if (c === '"') {
        if (testo[i + 1] === '"') {
          campo += '"';
          i++;
        } else virgolette = false;
      } else campo += c;
    } else if (c === '"') virgolette = true;
    else if (c === ",") {
      riga.push(campo);
      campo = "";
    } else if (c === "\n") {
      riga.push(campo.replace(/\r$/, ""));
      righe.push(riga);
      riga = [];
      campo = "";
    } else campo += c;
  }
  if (campo || riga.length) righe.push([...riga, campo]);
  return righe;
}

/** «1.3K» → 1300, «-» o vuoto → 0. */
function volume(v) {
  const m = (v ?? "").trim().match(/^([\d.,]+)\s*([KkMm]?)$/);
  if (!m) return 0;
  let n = parseFloat(m[1]);
  if (/k/i.test(m[2])) n *= 1_000;
  if (/m/i.test(m[2])) n *= 1_000_000;
  return Math.round(n);
}
const cpc = (v) => parseFloat(v) || 0;

// --- Filtro di pertinenza ------------------------------------------------------------------

const PIATTAFORME = new Set(["Google", "Bing", "YouTube"]); // Instagram, TikTok, Amazon: tag generici

const PERTINENTE_231 =
  /(modell|mog\b|organizzativ|organizzazione|reat|presuppost|organismo|organo di vigilanza|vigilanza|codice etico|compliance|whistleblow|segnalaz|responsabilit|aziend|sanzion|linee guida|confindustria|audit|flussi|verbal|protocoll|parte (speciale|generale)|esimente|corso|formazione|certificaz|consulen|software|obbligat|cos.?[eè]|esempio|fac simile|editabile|requisit|compit|nomina|compens|composizion|regolament|relazion|mappatura|risk|rischi|aggiorna|ambiental|tributar|riforma|normattiva|spiegazione|riassunto|cosa (prevede|dice|disciplina|riguarda)|chi (lo|è|approva|nomina|aggiorna|vigila|certifica)|come (redigere|adottare|farlo|si compone|funziona)|profil|^231$|^d ?lgs 231|^dlgs 231|^legge 231|^decreto( legislativo)? 231|^231 (2001|del 2001|01|\/01|legge|normativa|modello|odv)|231\/0?1|231 ?\/?2001|monocratic|collegial)/;

/** Per «odv» serve un contesto 231: altrimenti è quasi sempre un'associazione di volontariato. */
const CONTESTO_ODV =
  /(231|vigilanza|organismo|compit|requisit|nomina|compens|composiz|monocratic|collegial|aziendal|regolament|relazion|flussi|whistle|adempiment|modello)/;

const RUMORE =
  /(2002|\/02\b| 02$|2007|\/07\b| 07$|2017|2013|moratori|interessi|antiriciclaggio|ocean|earth|data view|oculist|stihl|polizia|allievi|strada|fermata|via |lotto|estrazioni|dorma|officina|flight|tirreno|mini |cooper|canale|delta 231|scp 231|poste italiane|paldea|koraidon|open fiber|trigliceridi|colesterolo|ferritina|glicemia|divisibile|prime|dollari|libbre|giorni|settimane|minuti|ore\b|mph|cv\b|rx8|touareg|dbx|a321|transfer|joint|ring|connor|letra|ingles|là con|primeiro|regan|hino|puntilla|equalizer|titegroup|hp38|animali|associazion|volontar|onlus|ets\b|aps\b|camposampiero|dolci|le camelie|730|vertex)/;

const DOMANDA = new Set(["Domande", "Paragoni", "Preposizioni"]);

function pertinente(k, termine) {
  if (RUMORE.test(k)) return false;
  return termine === "odv" ? CONTESTO_ODV.test(k) : PERTINENTE_231.test(k);
}

// --- Cluster del piano editoriale (in ordine: la prima regola che corrisponde vince) --------

const CLUSTER = [
  [
    "modello-231",
    /(^231 modello|^modello 231$|^mog 231|^modello organizza|^il modello 231|modello 231 cos|cos.?è il modello|cosa è il modello|mog 231 cos|modello 231 del 2001|modello 231\/01|modello 231 01|modello di gestione|modello 231 (cosa serve|a cosa serve|dove|come si compone|chi vigila)|modello organizzativo 231($| cos|\/| ex)|parte (generale|speciale)|destinatari|modelli 231 cosa)/,
  ],
  [
    "redazione-modello",
    /(chi lo redige|come redigere|come farlo|come adottar|adozione modello|chi lo fa|chi lo deve fare|chi approva|come ottener|costruzione|ciclo di vita|procedure|preventivo|prezzo)/,
  ],
  ["obbligo-231", /(obbligat|231 aziende|legge 231 aziende|piccole imprese|per le aziende)/],
  ["reati-presupposto", /(reat|presuppost|catalogo|colpa organizzativa)/],
  ["odv", /(odv|organismo|organo di vigilanza|vigilanza|audit)/],
  ["codice-etico", /codice etico/],
  ["esempio-modello", /(esempio|fac simile|editabile|modello 231 pdf|word)/],
  ["formazione-231", /(corso|formazione)/],
  ["software-231", /(consulen|software|compliance)/],
  ["sanzioni-231", /sanzion/],
  ["linee-guida-confindustria", /(linee guida|confindustria)/],
  ["risk-assessment", /(risk|rischi|profil|mappatura|scheda)/],
  ["aggiornamento-modello", /(aggiorna|riforma|nuov|come cambia|quando cambia)/],
  ["whistleblowing-231", /whistle/],
  ["certificazione-231", /certific/],
  ["231-e-altri-decreti", /(gdpr|sicurezza)/],
  ["decreto-231", /./], // tutto il resto è la legge stessa: «d lgs 231 01», «legge 231», «231 2001»…
];

// --- Esecuzione ----------------------------------------------------------------------------

const file = readdirSync(cartella).filter((f) => f.toLowerCase().endsWith(".csv"));
if (file.length === 0) {
  console.error(`Nessun CSV in ${cartella}/`);
  process.exit(1);
}

const unione = new Map();
const audit = [];
for (const f of file) {
  const righe = csv(readFileSync(join(cartella, f), "utf8").replace(/^﻿/, ""));
  const intestazione = righe.shift();
  const record = righe
    .filter((r) => r.length >= intestazione.length)
    .map((r) => Object.fromEntries(intestazione.map((h, i) => [h, r[i]])));

  // Dedup nel file: per ogni keyword vincono i valori di Google, se ci sono.
  const perKeyword = new Map();
  for (const r of record) {
    if (!PIATTAFORME.has(r.Piattaforma) || r.Paese !== "it") continue;
    const k = r.Keyword.toLowerCase().trim();
    const e = perKeyword.get(k) ?? {
      keyword: k,
      termine: r["Termine di ricerca"],
      volume: 0,
      cpc: 0,
      google: false,
      tipi: new Set(),
    };
    e.tipi.add(r["Tipo di modificatore"]);
    const v = volume(r.Volume);
    const c = cpc(r["CPC (US$)"]);
    if (r.Piattaforma === "Google") {
      if (!e.google) Object.assign(e, { volume: 0, cpc: 0, google: true });
      e.volume = Math.max(e.volume, v);
      e.cpc = Math.max(e.cpc, c);
    } else if (!e.google) {
      e.volume = Math.max(e.volume, v);
      e.cpc = Math.max(e.cpc, c);
    }
    perKeyword.set(k, e);
  }

  const valide = [...perKeyword.values()].filter(
    (e) => pertinente(e.keyword, e.termine) && (e.volume > 0 || [...e.tipi].some((t) => DOMANDA.has(t))),
  );
  const conCpc = valide.map((e) => e.cpc).filter((c) => c > 0);
  audit.push({
    file: f,
    termine: record[0]?.["Termine di ricerca"] ?? "",
    righe: record.length,
    valide: valide.length,
    volume: valide.reduce((s, e) => s + e.volume, 0),
    cpcMedio: conCpc.length ? conCpc.reduce((s, c) => s + c, 0) / conCpc.length : 0,
    cpcMax: conCpc.length ? Math.max(...conCpc) : 0,
  });
  // Dedup fra i file: resta il record con il volume più alto.
  for (const e of valide) {
    const prima = unione.get(e.keyword);
    if (!prima || e.volume > prima.volume) unione.set(e.keyword, e);
  }
}

const cluster = CLUSTER.map(([id]) => ({ id, volume: 0, cpcMax: 0, keyword: [] }));
for (const e of unione.values()) {
  const i = CLUSTER.findIndex(([, re]) => re.test(e.keyword));
  const c = cluster[i];
  c.keyword.push({
    keyword: e.keyword,
    volume: e.volume,
    cpc: Math.round(e.cpc * 100) / 100,
    tipi: [...e.tipi].sort(),
  });
  c.volume += e.volume;
  c.cpcMax = Math.max(c.cpcMax, e.cpc);
}
for (const c of cluster) c.keyword.sort((a, b) => b.volume - a.volume || a.keyword.localeCompare(b.keyword));

const totale = [...unione.values()];
console.log("| File | Termine | Righe | Valide | Volume | CPC medio / max |");
console.log("|---|---|---|---|---|---|");
for (const a of audit)
  console.log(
    `| ${a.file} | ${a.termine} | ${a.righe} | ${a.valide} | ${a.volume} | ${a.cpcMedio.toFixed(2)} / ${a.cpcMax.toFixed(2)} |`,
  );
console.log(
  `\nUnione deduplicata: ${totale.length} keyword, volume ${totale.reduce((s, e) => s + e.volume, 0)}`,
);
for (const c of [...cluster].sort((a, b) => b.volume - a.volume))
  console.log(
    `  ${c.id.padEnd(26)} ${String(c.volume).padStart(6)}  CPC max ${c.cpcMax.toFixed(2)}  (${c.keyword.length})`,
  );

writeFileSync(
  USCITA,
  JSON.stringify(
    {
      nota: "Generato da apps/landing/scripts/keyword-research.mjs: non modificare a mano. Volumi mensili Google Italia; CPC in US$.",
      fonti: audit.map((a) => ({ file: a.file, termine: a.termine, righe: a.righe, valide: a.valide })),
      cluster: cluster
        .filter((c) => c.keyword.length > 0)
        .map((c) => ({ ...c, cpcMax: Math.round(c.cpcMax * 100) / 100 })),
    },
    null,
    2,
  ) + "\n",
);
console.log(`\nScritto ${USCITA}`);
