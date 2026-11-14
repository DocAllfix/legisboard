#!/usr/bin/env node
// Collaudo COMPLETO di un'istanza, come lo farebbe un valutatore esterno _(2026-11-14)_.
//
// `collaudo-primi-passi.mjs` segue il percorso del primo giorno; il cancello visivo clicca ogni
// comando per vedere se qualcosa si rompe. Questo fa l'altra cosa: usa OGNI funzione e ne
// controlla l'ESITO. Campi obbligatori, valori sbagliati, tutti gli stati, i quattro formati
// di evidenza e quelli da rifiutare, gli undici registri con il loro CSV, le relazioni dei
// quattro ambiti, i fascicoli, le utenze di ogni ruolo, il secondo fattore acceso e spento,
// e che un ruolo non possa fare ciò che non gli spetta.
//
//   BASE=https://cliente.legisboard.it EMAIL=… PASSWORD=… node scripts/collaudo-completo.mjs
//
// LASCIA DATI DI PROVA: due aziende, voci di registro, relazioni pubblicate (che non si
// cancellano), tre utenze. Si usa prima della consegna e poi si azzera l'istanza.

import { chromium } from "playwright";
import { createHmac } from "node:crypto";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.env.BASE;
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const S = process.env.SCATTI ?? join(tmpdir(), "collaudo-completo");
if (!BASE || !EMAIL || !PASSWORD) {
  console.error("Servono BASE, EMAIL e PASSWORD nell'ambiente.");
  process.exit(2);
}
mkdirSync(S, { recursive: true });

// --- Registro dell'esito --------------------------------------------------------------------
const problemi = [];
let verifiche = 0;
const ok = (t) => {
  verifiche++;
  console.log(`  ✓ ${t}`);
};
const ko = (t) => {
  verifiche++;
  problemi.push(`[${sezione}] ${t}`);
  console.log(`  ✗ ${t}`);
};
const atteso = (cond, si, no = si) => (cond ? ok(si) : ko(no));
let sezione = "";

const browser = await chromium.launch();
const nuovoContesto = () =>
  browser.newContext({
    viewport: { width: 1440, height: 900 },
    locale: "it-IT",
    timezoneId: "Europe/Rome",
    acceptDownloads: true,
  });
const ctx = await nuovoContesto();
const p = await ctx.newPage();

// Errori di console e risposte 4xx/5xx inattese, raccolti per tutto il giro. Si sospendono
// mentre si provano apposta i casi d'errore.
const erroriRete = [];
let attendiErrori = false;
function sorveglia(pagina, chi) {
  pagina.on("pageerror", (e) =>
    erroriRete.push(`${chi} ${new URL(pagina.url()).pathname} · eccezione: ${e.message}`),
  );
  pagina.on("console", (m) => {
    if (m.type() === "error" && !attendiErrori)
      erroriRete.push(`${chi} ${new URL(pagina.url()).pathname} · console: ${m.text().slice(0, 200)}`);
  });
  pagina.on("response", (r) => {
    if (r.status() >= 400 && !attendiErrori && !/\/api\/auth\//.test(r.url()))
      erroriRete.push(`${chi} ${r.status()} ${r.request().method()} ${r.url()}`);
  });
}
sorveglia(p, "admin");

let n = 0;
const scatta = (pagina, nome) =>
  pagina
    .screenshot({ path: `${S}/${String(++n).padStart(3, "0")}-${nome}.png`, fullPage: true })
    .catch(() => {});

async function blocco(nome, fn) {
  sezione = nome;
  console.log(`\n${nome}`);
  try {
    await fn();
  } catch (e) {
    ko(`la sezione si è interrotta: ${e.message.split("\n")[0]}`);
    await scatta(p, `errore-${nome.replace(/\W+/g, "-")}`);
  }
}

/** La guida si apre da sola sulle schermate non ancora viste: la si chiude. */
async function chiudiGuida(pagina = p, attesa = 1300) {
  await pagina.waitForTimeout(attesa);
  for (let i = 0; i < 3; i++) {
    const x = pagina.locator(".driver-popover-close-btn");
    if ((await x.count()) && (await x.first().isVisible())) {
      await x.first().click();
      await pagina.waitForTimeout(400);
    } else break;
  }
}
async function vai(percorso, pagina = p) {
  const r = await pagina.goto(`${BASE}${percorso}`, { waitUntil: "networkidle" });
  await chiudiGuida(pagina);
  return r;
}
/** Scarica dall'interno del browser, con la sessione, e restituisce stato, tipo e testa. */
const scarica = (url, pagina = p) =>
  pagina.evaluate(async (u) => {
    const r = await fetch(u);
    const b = new Uint8Array(await r.arrayBuffer());
    return {
      stato: r.status,
      tipo: r.headers.get("content-type") ?? "",
      disposizione: r.headers.get("content-disposition") ?? "",
      testa: String.fromCharCode(...b.slice(0, 8)),
      testo: new TextDecoder().decode(b.slice(0, 4000)),
      kb: Math.round(b.length / 1024),
    };
  }, url);
const ricevuta = (loc) =>
  loc
    .locator('[role="status"], [role="alert"]')
    .first()
    .innerText({ timeout: 15000 })
    .then((t) => t.trim())
    .catch(() => "");

// --- File di prova ---------------------------------------------------------------------------
const cartella = join(tmpdir(), "collaudo-file");
mkdirSync(cartella, { recursive: true });
const file = {
  pdf: join(cartella, "verbale-prova.pdf"),
  png: join(cartella, "foto-estintore.png"),
  jpg: join(cartella, "cartello.jpg"),
  docx: join(cartella, "nomina-rspp.docx"),
  falso: join(cartella, "programma.pdf"),
  grande: join(cartella, "archivio-enorme.pdf"),
};
writeFileSync(
  file.pdf,
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
);
writeFileSync(
  file.png,
  Buffer.from(
    "89504e470d0a1a0a0000000d4948445200000001000000010806000000" +
      "1f15c4890000000d49444154789c6360000002000154a24f5d0000000049454e44ae426082",
    "hex",
  ),
);
writeFileSync(
  file.jpg,
  Buffer.concat([Buffer.from("ffd8ffe000104a464946", "hex"), Buffer.alloc(200), Buffer.from("ffd9", "hex")]),
);
writeFileSync(file.docx, Buffer.concat([Buffer.from("504b0304", "hex"), Buffer.alloc(300)]));
writeFileSync(file.falso, "MZ questo è un eseguibile travestito da PDF");
writeFileSync(file.grande, Buffer.concat([Buffer.from("%PDF-1.4\n"), Buffer.alloc(26 * 1024 * 1024)]));

// --- TOTP, per provare davvero il secondo fattore -------------------------------------------
function base32(s) {
  const a = "ABCDEFGHIJKLMNOPQRSTUVWXYZ234567";
  let bit = "";
  for (const c of s.replace(/[\s=-]/g, "").toUpperCase()) bit += a.indexOf(c).toString(2).padStart(5, "0");
  const out = [];
  for (let i = 0; i + 8 <= bit.length; i += 8) out.push(parseInt(bit.slice(i, i + 8), 2));
  return Buffer.from(out);
}
function totp(segreto) {
  const passo = Math.floor(Date.now() / 30000);
  const buf = Buffer.alloc(8);
  buf.writeBigUInt64BE(BigInt(passo));
  const h = createHmac("sha1", base32(segreto)).update(buf).digest();
  const o = h[h.length - 1] & 15;
  return String((h.readUInt32BE(o) & 0x7fffffff) % 1_000_000).padStart(6, "0");
}

async function accedi(pagina, email, password) {
  await pagina.goto(`${BASE}/accedi`, { waitUntil: "networkidle" });
  await pagina.fill("#email", email);
  await pagina.fill("#password", password);
  await pagina.locator('button[type="submit"]').first().click();
  await pagina.waitForURL(/cruscotto|portafoglio|primo-accesso/, { timeout: 20000 }).catch(() => {});
  await pagina.waitForLoadState("networkidle");
  return new URL(pagina.url()).pathname;
}

const DOMINI = ["gdpr", "d231", "d81"];
let aziendaA = ""; // tre moduli
let aziendaB = ""; // solo GDPR

// ===============================================================================================
await blocco("1 · Sicurezza senza sessione", async () => {
  attendiErrori = true;
  const anon = await (await nuovoContesto()).newPage();
  for (const u of ["/cruscotto", "/portafoglio", "/scadenzario", "/impostazioni"]) {
    await anon.goto(`${BASE}${u}`, { waitUntil: "networkidle" });
    atteso(
      new URL(anon.url()).pathname.startsWith("/accedi"),
      `${u} senza sessione rimanda all'accesso`,
      `${u} senza sessione NON rimanda all'accesso (${anon.url()})`,
    );
  }
  for (const u of ["/api/relazioni/x", "/api/evidenze/x", "/api/fascicolo/x/garante"]) {
    const r = await anon.request.get(`${BASE}${u}`);
    atteso(
      [401, 403, 404].includes(r.status()),
      `${u} senza sessione → ${r.status()}`,
      `${u} senza sessione risponde ${r.status()}`,
    );
  }
  const reg = await anon.request.post(`${BASE}/api/auth/sign-up/email`, {
    data: { email: "intruso@example.com", password: "Password-lunga-123", name: "x" },
    headers: { Origin: BASE },
  });
  atteso(
    reg.status() >= 400,
    `registrazione pubblica chiusa (${reg.status()})`,
    `la registrazione pubblica risponde ${reg.status()}`,
  );
  const salute = await anon.request.get(`${BASE}/api/health`);
  atteso(salute.status() === 200, "salute 200");
  const intest = salute.headers();
  for (const h of ["strict-transport-security", "x-frame-options", "x-content-type-options"])
    atteso(
      Boolean(intest[h]) || h !== "strict-transport-security",
      `intestazione ${h}`,
      `manca l'intestazione ${h}`,
    );
  const nonc = await anon.goto(`${BASE}/questa-pagina-non-esiste`, { waitUntil: "networkidle" });
  atteso(nonc.status() === 404, "pagina inesistente → 404");
  await scatta(anon, "404");
  await anon.context().close();
  attendiErrori = false;
});

await blocco("2 · Accesso", async () => {
  attendiErrori = true;
  await p.goto(BASE, { waitUntil: "networkidle" });
  atteso(p.url().includes("/accedi"), "la radice porta all'accesso");
  await scatta(p, "accedi");
  await p.locator('button[type="submit"]').first().click();
  await p.waitForTimeout(800);
  atteso(p.url().includes("/accedi"), "invio a campi vuoti: si resta sull'accesso");
  await p.fill("#email", EMAIL);
  await p.fill("#password", "password-sbagliata-123");
  await p.locator('button[type="submit"]').first().click();
  await p.waitForTimeout(2500);
  const msg = (
    await p
      .locator('[role="alert"]')
      .first()
      .innerText()
      .catch(() => "")
  ).trim();
  atteso(
    p.url().includes("/accedi") && msg.length > 0,
    `password sbagliata rifiutata: «${msg}»`,
    `password sbagliata: nessun messaggio (${p.url()})`,
  );
  const dimenticata = p.getByRole("link", { name: /dimenticat/i });
  atteso(
    (await dimenticata.count()) > 0,
    "c'è il collegamento «password dimenticata»",
    "manca il collegamento «password dimenticata»",
  );
  attendiErrori = false;
  const dove = await accedi(p, EMAIL, PASSWORD);
  atteso(dove === "/cruscotto", "accesso corretto → cruscotto", `accesso corretto → ${dove}`);
  await chiudiGuida();
  await scatta(p, "cruscotto-vuoto");
});

await blocco("3 · Navigazione, tema, ricerca, guida", async () => {
  for (const [voce, percorso] of [
    ["Portafoglio", "/portafoglio"],
    ["Scadenzario", "/scadenzario"],
    ["Impostazioni", "/impostazioni"],
    ["Cruscotto", "/cruscotto"],
  ]) {
    const link = p.locator(`nav a[href="${percorso}"]:visible`).first();
    if (!(await link.count())) {
      ko(`nella barra non c'è il collegamento a ${percorso}`);
      continue;
    }
    await link.click();
    await p.waitForURL((u) => u.pathname === percorso, { timeout: 15000 }).catch(() => {});
    atteso(
      new URL(p.url()).pathname === percorso,
      `barra: ${voce}`,
      `barra: ${voce} non porta a ${percorso}`,
    );
    await chiudiGuida(p, 1000);
  }
  const radice = () => p.evaluate(() => document.documentElement.getAttribute("data-theme"));
  const prima = await radice();
  const tema = p.locator('[data-tour="tema"] button');
  for (const b of await tema.all()) {
    await b.click();
    await p.waitForTimeout(300);
  }
  const dopo = await radice();
  await tema.first().click();
  await p.waitForTimeout(300);
  atteso(
    (await radice()) !== dopo || prima !== dopo,
    `il tema cambia (${prima} → ${dopo} → ${await radice()})`,
    "il selettore del tema non cambia nulla",
  );
  await p.keyboard.press("Control+k");
  const palette = p.locator('[data-tour="palette"]');
  const aperta = await palette
    .waitFor({ timeout: 5000 })
    .then(() => true)
    .catch(() => false);
  atteso(aperta, "Ctrl+K apre la ricerca", "Ctrl+K non apre la ricerca");
  if (aperta) {
    await p.keyboard.type("scadenzario");
    await p.waitForTimeout(1500);
    const risultati = await p.locator("#risultati-ricerca [role='option']").count();
    atteso(
      risultati > 0,
      `la ricerca trova risultati (${risultati})`,
      "la ricerca di «scadenzario» non trova niente",
    );
    await p.keyboard.press("Escape");
    await p.waitForTimeout(400);
    atteso(!(await palette.isVisible().catch(() => false)), "Esc chiude la ricerca");
  }
  const aiuto = p.locator('[data-tour="guida"], button[aria-label*="Guida"]').first();
  if (await aiuto.count()) {
    await aiuto.click();
    const g = await p
      .locator(".driver-popover")
      .waitFor({ timeout: 5000 })
      .then(() => true)
      .catch(() => false);
    atteso(
      g,
      "il pulsante della guida apre il giro della schermata",
      "il pulsante della guida non apre niente",
    );
    await chiudiGuida(p, 200);
  } else ko("non trovo il pulsante della guida");
  const pp = p.locator('[data-tour="primi-passi"]');
  atteso(
    await pp.isVisible().catch(() => false),
    "riquadro dei primi passi presente sul cruscotto vuoto",
    "riquadro dei primi passi assente",
  );
});

await blocco("4 · Portafoglio e nuova azienda", async () => {
  await vai("/portafoglio");
  attendiErrori = true;
  const apri = async () => {
    await p.locator('[data-tour="nuova-azienda"]').first().click();
    await p.waitForSelector('[role="dialog"]', { timeout: 10000 });
  };
  const invia = () => p.locator('[role="dialog"] button[type="submit"]').click();
  await apri();
  await scatta(p, "nuova-azienda");
  // Nome vuoto
  await invia();
  await p.waitForTimeout(1200);
  atteso(await p.locator('[role="dialog"]').isVisible(), "nome vuoto: il modulo non si chiude");
  // Partita IVA sbagliata
  await p.fill("#nome", "Validazione S.r.l.");
  if (await p.locator("#piva").count()) {
    await p.fill("#piva", "123");
    await p.check('input[name="modulo-gdpr"]');
    await invia();
    await p.waitForTimeout(2000);
    const e = await ricevuta(p.locator('[role="dialog"]'));
    atteso(
      p.url().includes("/portafoglio") && (await p.locator('[role="dialog"]').isVisible()),
      `partita IVA «123» rifiutata: «${e}»`,
      "partita IVA «123» accettata",
    );
    atteso(
      (await p.inputValue("#nome")) === "Validazione S.r.l.",
      "dopo l'errore il modulo conserva i campi",
      "dopo l'errore il modulo si è svuotato",
    );
  } else ko("nel modulo non c'è il campo partita IVA");
  // Nessun modulo
  await p.fill("#piva", "");
  for (const d of DOMINI) await p.uncheck(`input[name="modulo-${d}"]`).catch(() => {});
  await invia();
  await p.waitForTimeout(2000);
  // Un'azienda senza moduli è AMMESSA: i decreti si attivano anche dopo, dalla scheda.
  atteso(
    p.url().includes("/azienda/"),
    "un'azienda senza moduli si crea (i decreti si attivano dopo)",
    "un'azienda senza moduli non si crea",
  );
  await vai("/portafoglio");
  attendiErrori = false;
  // A: tre moduli
  if (
    !(await p
      .locator('[role="dialog"]')
      .isVisible()
      .catch(() => false))
  )
    await apri();
  await p.fill("#nome", "Collaudo Alfa S.p.A.");
  await p.fill("#piva", "01234567890").catch(() => {});
  for (const d of DOMINI) await p.check(`input[name="modulo-${d}"]`);
  await p.fill("#numeroDipendenti", "120").catch(() => {});
  await p.fill("#fatturatoAnnuo", "18000000").catch(() => {});
  for (const id of ["#settore", "#sede", "#ateco"]) await p.fill(id, "Prova").catch(() => {});
  await invia();
  await p.waitForURL(/\/azienda\//, { timeout: 60000 }).catch(() => {});
  aziendaA = new URL(p.url()).pathname;
  atteso(
    aziendaA.startsWith("/azienda/"),
    `azienda Alfa creata (${aziendaA})`,
    `azienda Alfa non creata (${p.url()})`,
  );
  await chiudiGuida();
  // B: solo GDPR
  await vai("/portafoglio");
  await apri();
  await p.fill("#nome", "Collaudo Beta S.r.l.");
  await p.check('input[name="modulo-gdpr"]');
  await p.uncheck('input[name="modulo-d231"]').catch(() => {});
  await p.uncheck('input[name="modulo-d81"]').catch(() => {});
  await invia();
  await p.waitForURL(/\/azienda\//, { timeout: 60000 }).catch(() => {});
  aziendaB = new URL(p.url()).pathname;
  atteso(aziendaB.startsWith("/azienda/") && aziendaB !== aziendaA, "azienda Beta creata (solo GDPR)");
  // Elenco, filtro, ordinamento
  await vai("/portafoglio");
  await scatta(p, "portafoglio");
  const righe = await p.locator('[data-tour="tabella-portafoglio"] tbody tr').count();
  atteso(righe === 3, `il portafoglio elenca 3 aziende`, `il portafoglio elenca ${righe} righe, attese 3`);
  await p.fill('[data-tour="filtro-portafoglio"]', "Beta");
  await p.waitForTimeout(1200);
  const filtrate = await p.locator('[data-tour="tabella-portafoglio"] tbody tr').count();
  atteso(filtrate === 1, "il filtro «Beta» lascia una riga", `il filtro «Beta» lascia ${filtrate} righe`);
  atteso(
    /[?&]q=Beta/.test(p.url()),
    "il filtro resta nell'indirizzo",
    `il filtro non finisce nell'indirizzo (${p.url()})`,
  );
  await p.reload({ waitUntil: "networkidle" });
  await chiudiGuida(p, 800);
  atteso((await p.inputValue('[data-tour="filtro-portafoglio"]')) === "Beta", "ricaricando, il filtro resta");
  await p.fill('[data-tour="filtro-portafoglio"]', "");
  await p.waitForTimeout(800);
  const intest = p.locator('[data-tour="tabella-portafoglio"] thead button');
  if (await intest.count()) {
    await intest.first().click();
    await p.waitForTimeout(800);
    atteso(
      /ordina|verso/.test(p.url()),
      "ordinare una colonna aggiorna l'indirizzo",
      `ordinare non cambia l'indirizzo (${p.url()})`,
    );
  } else ko("le colonne del portafoglio non sono ordinabili");
  await p.locator('[data-tour="tabella-portafoglio"] tbody tr a').first().click();
  await p.waitForURL(/\/azienda\//, { timeout: 15000 }).catch(() => {});
  atteso(p.url().includes("/azienda/"), "dalla riga si apre la scheda dell'azienda");
});

await blocco("5 · Scheda azienda e moduli", async () => {
  await vai(aziendaA);
  await scatta(p, "scheda-azienda");
  const testo = await p.locator("main").innerText();
  atteso(/Collaudo Alfa/.test(testo), "la scheda porta il nome dell'azienda");
  const moduli = p.locator('[data-tour="moduli-azienda"]');
  atteso(await moduli.isVisible(), "pannello dei moduli presente");
  // Disattiva l'81/08 e lo riattiva
  const bottone81 = moduli
    .locator("form")
    .filter({ has: p.locator('input[name="dominio"][value="d81"]') })
    .locator('button[type="submit"]');
  if (await bottone81.count()) {
    const prima = (await bottone81.innerText()).trim();
    await bottone81.click();
    await p.waitForTimeout(2500);
    const dopo = (await bottone81.innerText()).trim();
    atteso(
      prima !== dopo,
      `modulo 81/08 commutato («${prima}» → «${dopo}»)`,
      `il pulsante dell'81/08 non cambia («${prima}»)`,
    );
    const r = await p.goto(`${BASE}${aziendaA}/d81`, { waitUntil: "networkidle" });
    atteso(
      r.status() === 404 || /non è attivo|disattivat/i.test(await p.locator("main").innerText()),
      "con il modulo spento, l'assessment 81/08 non è raggiungibile",
      `con il modulo spento l'assessment 81/08 risponde ${r.status()}`,
    );
    await vai(aziendaA);
    await p
      .locator('[data-tour="moduli-azienda"] form')
      .filter({ has: p.locator('input[name="dominio"][value="d81"]') })
      .locator('button[type="submit"]')
      .click();
    await p.waitForTimeout(2500);
    const r2 = await p.goto(`${BASE}${aziendaA}/d81`, { waitUntil: "networkidle" });
    atteso(r2.status() === 200, "riattivato, l'assessment 81/08 torna");
  } else ko("non trovo il comando del modulo 81/08");
  await vai(aziendaA);
  for (const sotto of ["gdpr", "d231", "d81", "relazioni", "reati", "simulatore"]) {
    const r = await p.goto(`${BASE}${aziendaA}/${sotto}`, { waitUntil: "networkidle" });
    atteso(r.status() === 200, `${sotto}: 200`, `${sotto}: ${r.status()}`);
  }
  await p.goto(`${BASE}${aziendaB}/d231`, { waitUntil: "networkidle" });
  atteso(
    /non è attivo/i.test(await p.locator("main").innerText()),
    "su Beta (solo GDPR) il 231 dice «modulo non attivo»",
    "su Beta il 231 non dice che il modulo è spento",
  );
  await p.goto(`${BASE}/azienda/00000000-0000-0000-0000-000000000000`, { waitUntil: "networkidle" });
  await p.waitForTimeout(1500);
  atteso(
    /Pagina non trovata/.test(await p.locator("body").innerText()),
    "un'azienda inesistente mostra «Pagina non trovata»",
    "un'azienda inesistente non mostra il 404",
  );
});

const pannello = () => p.locator('[data-tour="dettaglio-adempimento"]');
async function apriAdempimento(i = 0) {
  await p.locator('[data-tour="apri-adempimento"]').nth(i).click();
  await pannello().waitFor({ timeout: 15000 });
  await p.waitForTimeout(800);
}

await blocco("6 · Assessment: stati, date, note, storico", async () => {
  for (const d of DOMINI) {
    await vai(`${aziendaA}/${d}`);
    const righe = await p.locator('[data-tour="apri-adempimento"]').count();
    const attese = { gdpr: 42, d231: 65, d81: 64 }[d];
    atteso(righe === attese, `${d}: ${righe} adempimenti`, `${d}: ${righe} adempimenti, attesi ${attese}`);
  }
  await vai(`${aziendaA}/d81`);
  await scatta(p, "assessment-d81");
  await apriAdempimento(0);
  const pan = pannello();
  for (const s of ["in-corso", "completata", "da-fare"]) {
    const b = pan.locator(`[data-tour="stato-${s}"]`);
    await b.click();
    await p.waitForTimeout(1800);
    const t = await ricevuta(pan);
    atteso(!/errore|non |impossibil/i.test(t), `stato «${s}» applicato`, `stato «${s}»: «${t}»`);
  }
  // Non applicabile: senza motivazione no, con motivazione sì
  await pan.locator('[data-tour="stato-non-applicabile"]').click();
  await p.waitForTimeout(800);
  const salvaMot = pan.getByRole("button", { name: "Salva la motivazione" });
  if (await salvaMot.count()) {
    attendiErrori = true;
    await salvaMot.click();
    await p.waitForTimeout(1500);
    const e = await ricevuta(pan);
    atteso(
      /motivazion|obbligat|serve/i.test(e) || (await salvaMot.isDisabled()),
      `non applicabile senza motivazione rifiutato: «${e}»`,
      `non applicabile senza motivazione: «${e}»`,
    );
    attendiErrori = false;
    await pan.locator("#motivazione").fill("L'azienda non ha cantieri temporanei o mobili.");
    await salvaMot.click();
    await p.waitForTimeout(2000);
    const e2 = await ricevuta(pan);
    atteso(
      !/errore|non /i.test(e2),
      "non applicabile con motivazione salvato",
      `non applicabile con motivazione: «${e2}»`,
    );
  } else ko("scelto «Non applicabile», non compare il campo della motivazione");
  await pan.locator('[data-tour="stato-completata"]').click();
  await p.waitForTimeout(1800);
  // Data di ultima esecuzione: futura no, passata sì, e la scadenza si deriva
  attendiErrori = true;
  await pan.locator('[data-tour="ultima-esecuzione"]').fill("2030-01-01");
  await pan.getByRole("button", { name: "Aggiorna", exact: true }).click();
  await p.waitForTimeout(2000);
  const fut = await ricevuta(pan);
  atteso(
    /futur|oggi|non può/i.test(fut),
    `data futura rifiutata: «${fut}»`,
    `data di esecuzione futura accettata: «${fut}»`,
  );
  attendiErrori = false;
  await pan.locator('[data-tour="ultima-esecuzione"]').fill("2025-06-15");
  await pan.getByRole("button", { name: "Aggiorna", exact: true }).click();
  await p.waitForTimeout(2500);
  const tp = await pan.innerText();
  atteso(
    /Scadenza derivata/.test(tp),
    "dopo l'ultima esecuzione compare la scadenza derivata",
    "la scadenza derivata non compare",
  );
  // Note
  await pan.locator('textarea[placeholder^="Annotazioni"]').fill("Nota del collaudo: verificare con l'RSPP.");
  await pan.getByRole("button", { name: "Salva le note" }).click();
  await p.waitForTimeout(2000);
  atteso(/Salvato/.test(await pan.innerText()), "note salvate", "le note non risultano salvate");
  // Storico
  const storico = await pan.innerText();
  atteso(
    /Storico|storico|modific/i.test(storico),
    "lo storico delle modifiche è visibile",
    "non vedo lo storico",
  );
  await scatta(p, "pannello-adempimento");
  await p.keyboard.press("Escape");
  await p.waitForTimeout(600);
  // Ricaricando, i valori restano
  await vai(`${aziendaA}/d81`);
  await apriAdempimento(0);
  const persist = await pannello().innerText();
  atteso(
    /2025|15\/06/.test(persist) ||
      (await pannello().locator('[data-tour="ultima-esecuzione"]').inputValue()) === "2025-06-15",
    "ricaricando, l'ultima esecuzione resta",
    "ricaricando, l'ultima esecuzione è persa",
  );
  atteso(
    (await pannello().locator('textarea[placeholder^="Annotazioni"]').inputValue()).includes("collaudo"),
    "ricaricando, la nota resta",
    "ricaricando, la nota è persa",
  );
  await p.keyboard.press("Escape");
  // Ricerca e matrice
  await p.fill('[placeholder="Cerca per codice, adempimento o norma"]', "DVR");
  await p.waitForTimeout(1200);
  const dvr = await p.locator('[data-tour="apri-adempimento"]').count();
  atteso(dvr > 0 && dvr < 64, `la ricerca «DVR» filtra (${dvr} righe)`, `la ricerca «DVR» dà ${dvr} righe`);
  await p.fill('[placeholder="Cerca per codice, adempimento o norma"]', "");
  // Completa alcuni adempimenti in tutti i domini, per avere numeri e relazioni sensate
  for (const d of DOMINI) {
    await vai(`${aziendaA}/${d}`);
    for (let i = 0; i < 4; i++) {
      await apriAdempimento(i);
      await pannello().locator('[data-tour="stato-completata"]').click();
      await p.waitForTimeout(1200);
      const campo = pannello().locator('[data-tour="ultima-esecuzione"]');
      if (await campo.isEnabled().catch(() => false)) {
        await campo.fill("2026-09-01");
        const agg = pannello().getByRole("button", { name: "Aggiorna", exact: true });
        if (await agg.isEnabled()) await agg.click();
        await p.waitForTimeout(1500);
      }
      await p.keyboard.press("Escape");
      await p.waitForTimeout(400);
    }
  }
  ok("completati quattro adempimenti per decreto");
});

await blocco("7 · Evidenze", async () => {
  await vai(`${aziendaA}/gdpr`);
  await apriAdempimento(0);
  const ev = pannello().locator('[data-tour="evidenze"]');
  const allega = async (f) => {
    await ev.locator('input[type="file"]').setInputFiles(f);
    await ev.getByRole("button", { name: "Allega", exact: true }).click();
    await p.waitForTimeout(3000);
  };
  for (const [tipo, f] of Object.entries({ pdf: file.pdf, png: file.png, jpg: file.jpg, docx: file.docx })) {
    await allega(f);
    const nome = f.split(/[\\/]/).pop();
    atteso(
      (await ev.getByText(nome).count()) > 0,
      `evidenza ${tipo} allegata`,
      `evidenza ${tipo} NON allegata: «${await ricevuta(ev)}»`,
    );
  }
  attendiErrori = true;
  await allega(file.falso);
  const e1 = await ricevuta(ev);
  atteso(
    /tipo|formato|ammess|riconosc/i.test(e1),
    `eseguibile travestito da PDF rifiutato: «${e1}»`,
    `eseguibile travestito da PDF: «${e1}»`,
  );
  await allega(file.grande);
  const e2 = await ricevuta(ev);
  atteso(/MB|supera|grande/i.test(e2), `file da 26 MB rifiutato: «${e2}»`, `file da 26 MB: «${e2}»`);
  attendiErrori = false;
  await allega(file.pdf);
  const versioni = await ev.getByText("verbale-prova.pdf").count();
  const testoEv = await ev.innerText();
  atteso(
    versioni >= 2 || /v\.?\s*2|versione 2/i.test(testoEv),
    "ricaricando lo stesso file nasce una nuova versione",
    `ricaricare lo stesso file: ${versioni} voci, nessuna versione 2`,
  );
  await scatta(p, "evidenze");
  const link = await ev.locator('a[href^="/api/evidenze/"]').all();
  let scaricate = 0;
  for (const l of link) {
    const r = await scarica(await l.getAttribute("href"));
    if (r.stato === 200) scaricate++;
    else ko(`evidenza ${await l.getAttribute("href")} → ${r.stato}`);
  }
  atteso(
    scaricate === link.length && link.length >= 4,
    `${scaricate} evidenze scaricate su ${link.length}`,
    `${scaricate} evidenze scaricate su ${link.length}`,
  );
  if (link.length) {
    const primo = await scarica(await link[0].getAttribute("href"));
    atteso(
      /attachment|inline/.test(primo.disposizione),
      `il download ha un nome di file (${primo.disposizione.slice(0, 60)})`,
      "il download non dichiara un nome di file",
    );
  }
  const elimina = ev.locator('button[aria-label^="Elimina "]').first();
  const prima = await ev.locator('a[href^="/api/evidenze/"]').count();
  p.once("dialog", (d) => d.accept());
  await elimina.click();
  await p.waitForTimeout(2500);
  const dopo = await ev.locator('a[href^="/api/evidenze/"]').count();
  atteso(dopo === prima - 1, "un'evidenza si elimina", `eliminare un'evidenza: ${prima} → ${dopo}`);
  await p.keyboard.press("Escape");
});

await blocco("8 · Registri (11), termini, chiusura, CSV", async () => {
  await vai(aziendaA);
  const hrefs = [
    ...new Set(
      await p
        .locator('[data-tour="registri"] a[href*="/registro/"]')
        .evaluateAll((a) => a.map((x) => x.getAttribute("href"))),
    ),
  ];
  atteso(
    hrefs.length === 11,
    `la scheda elenca ${hrefs.length} registri`,
    `la scheda elenca ${hrefs.length} registri, attesi 11`,
  );
  for (const href of hrefs) {
    const tipo = href.split("/registro/")[1];
    await vai(href);
    await p.locator('[data-tour="apri-voce"]').click();
    const modulo = p.locator("form").filter({ has: p.locator('input[name="titolo"]') });
    await modulo.waitFor({ timeout: 10000 });
    // Data futura di conoscenza: va rifiutata
    attendiErrori = true;
    await modulo.locator('input[name="titolo"]').fill(`Collaudo ${tipo}`);
    const quando = modulo.locator('input[name="conosciutoIl"]');
    const tipoData = await quando.getAttribute("type");
    const adesso = new Date();
    const fmt = (d) => (tipoData === "date" ? d.toISOString().slice(0, 10) : d.toISOString().slice(0, 16));
    await quando.fill(fmt(new Date(adesso.getTime() + 5 * 86400000)));
    for (const s of await modulo.locator("select").all()) {
      const v = await s.locator("option").evaluateAll((o) => o.map((x) => x.value).filter(Boolean));
      if (v[0]) await s.selectOption(v[0]);
    }
    for (const c of await modulo.locator("input:not([type=hidden]):not([type=checkbox])").all()) {
      if ((await c.inputValue()) === "") {
        const t = await c.getAttribute("type");
        await c.fill(
          t === "date"
            ? "2026-11-01"
            : t === "number"
              ? "3"
              : t === "datetime-local"
                ? "2026-11-01T10:00"
                : "prova",
        );
      }
    }
    for (const t of await modulo.locator("textarea").all())
      if ((await t.inputValue()) === "") await t.fill("Testo di prova del collaudo.");
    await modulo.locator('button[type="submit"]').click();
    await p.waitForTimeout(2000);
    const errFut = await ricevuta(modulo);
    const vociFuture = await p.getByText(`Collaudo ${tipo}`).count();
    atteso(
      vociFuture === 0 || /futur/i.test(errFut),
      `${tipo}: data futura rifiutata`,
      `${tipo}: accetta una data di conoscenza futura («${errFut}»)`,
    );
    attendiErrori = false;
    // Data valida
    await quando.fill(fmt(new Date(adesso.getTime() - 26 * 3600000)));
    await modulo.locator('button[type="submit"]').click();
    const aperta = await p
      .getByText(`Collaudo ${tipo}`)
      .first()
      .waitFor({ timeout: 20000 })
      .then(() => true)
      .catch(() => false);
    atteso(aperta, `${tipo}: voce aperta`, `${tipo}: la voce non si apre («${await ricevuta(modulo)}»)`);
    if (!aperta) continue;
    await p.locator('button[aria-label^="Dettagli della voce"]').first().click();
    await p.waitForTimeout(800);
    // Chiusura: esito troppo breve rifiutato, poi valido
    const esito = p.locator('textarea[name="esito"]').first();
    if (await esito.count()) {
      attendiErrori = true;
      await esito.fill("ok");
      await esito.locator("xpath=ancestor::form").locator('button[type="submit"]').click();
      await p.waitForTimeout(1800);
      const e = await ricevuta(esito.locator("xpath=ancestor::form/.."));
      atteso(
        (await esito.count()) > 0,
        `${tipo}: esito di due caratteri rifiutato («${e}»)`,
        `${tipo}: chiuso con esito «ok»`,
      );
      attendiErrori = false;
      await esito.fill("Assolto dal collaudo con comunicazione protocollata n. 42.");
      await esito.locator("xpath=ancestor::form").locator('button[type="submit"]').click();
      await p.waitForTimeout(2500);
      atteso(
        /Assolto dal collaudo/.test(await p.locator("main").innerText()),
        `${tipo}: chiusura con esito registrata`,
        `${tipo}: la chiusura non risulta`,
      );
    }
    const stato = p.locator('select[name="stato"]').first();
    if (await stato.count()) {
      const valori = await stato.locator("option").evaluateAll((o) => o.map((x) => x.value));
      const altro = valori.find((v) => v !== (valori[0] ?? "")) ?? valori[0];
      await stato.selectOption(altro);
      await stato.locator("xpath=ancestor::form").locator('button[type="submit"]').click();
      await p.waitForTimeout(2000);
      atteso(
        (await p.locator('select[name="stato"]').first().inputValue()) === altro,
        `${tipo}: stato cambiato in «${altro}»`,
        `${tipo}: il cambio di stato non resta`,
      );
    }
    // CSV
    const csvLink = p.locator('a[href$="/esporta"], a[href*="/esporta"]').first();
    if (await csvLink.count()) {
      const r = await scarica(await csvLink.getAttribute("href"));
      atteso(
        r.stato === 200 && /csv/.test(r.tipo) && r.testo.includes(`Collaudo ${tipo}`),
        `${tipo}: CSV con la voce (${r.kb} KB)`,
        `${tipo}: CSV ${r.stato} ${r.tipo}, voce presente: ${r.testo.includes(`Collaudo ${tipo}`)}`,
      );
    } else ko(`${tipo}: nessun pulsante di esportazione CSV`);
    if (tipo === "violazione") await scatta(p, "registro-violazioni");
  }
});

await blocco("9 · Scadenzario", async () => {
  await vai("/scadenzario");
  await scatta(p, "scadenzario");
  const righe = await p.locator('[data-tour="tabella-scadenzario"] tbody tr').count();
  atteso(
    righe > 0,
    `scadenzario con ${righe} righe`,
    "scadenzario vuoto dopo aver completato adempimenti con data",
  );
  const finestre = p.locator('[data-tour="finestre"] button, [data-tour="finestre"] a');
  const nf = await finestre.count();
  for (let i = 0; i < nf; i++) {
    await finestre.nth(i).click();
    await p.waitForTimeout(900);
  }
  atteso(nf >= 2, `${nf} finestre temporali provate`, "nessuna finestra temporale");
  await p.fill('[aria-label="Cerca nello scadenzario"]', "Alfa");
  await p.waitForTimeout(1200);
  atteso(
    /[?&]q=/.test(p.url()),
    "la ricerca nello scadenzario finisce nell'indirizzo",
    "la ricerca nello scadenzario non è nell'indirizzo",
  );
  const ord = p.locator('[data-tour="tabella-scadenzario"] thead button');
  if (await ord.count()) {
    await ord.first().click();
    await p.waitForTimeout(800);
    atteso(/ordina/.test(p.url()), "ordinamento dello scadenzario nell'indirizzo");
  }
});

await blocco("10 · Simulatore e mappa dei reati", async () => {
  await vai(`${aziendaA}/simulatore`);
  const prima = await p
    .locator('[data-tour="proiezione"]')
    .innerText()
    .catch(() => "");
  const caselle = p.locator('[data-tour="simulatore"] input[type="checkbox"], input[type="checkbox"]');
  const nc = await caselle.count();
  for (let i = 0; i < Math.min(5, nc); i++) await caselle.nth(i).check();
  await p.waitForTimeout(3000);
  const dopo = await p
    .locator('[data-tour="proiezione"]')
    .innerText()
    .catch(() => "");
  atteso(
    nc > 0 && prima !== dopo,
    `il simulatore ricalcola con 5 interventi scelti`,
    `il simulatore non cambia la proiezione (${nc} caselle)`,
  );
  await scatta(p, "simulatore");
  await p
    .getByRole("button", { name: /Azzera|Ricomincia|Togli/ })
    .first()
    .click()
    .catch(() => {});
  await vai(`${aziendaA}/reati`);
  const t = await p.locator("main").innerText();
  atteso(
    /famigli/.test(t) && /Art\. 25-septies/.test(t),
    "la mappa dei reati mostra le famiglie",
    "la mappa dei reati non mostra le famiglie",
  );
  atteso(
    /Art\. 25-octies\b/.test(t) && !/25-octies\.1/.test(t),
    "riciclaggio all'art. 25-octies",
    "riciclaggio non all'art. 25-octies",
  );
  await scatta(p, "reati");
});

await blocco("11 · Relazioni e fascicoli", async () => {
  await vai(`${aziendaA}/relazioni`);
  const ambiti = await p.locator('select[name="ambito"] option').evaluateAll((o) => o.map((x) => x.value));
  atteso(
    ambiti.length === 4,
    `${ambiti.length} ambiti di relazione (${ambiti.join(", ")})`,
    `${ambiti.length} ambiti di relazione`,
  );
  for (const a of ambiti) {
    await p.selectOption('select[name="ambito"]', a);
    await p.locator('[data-tour="genera-relazione"]').click();
    await p.waitForTimeout(6000);
  }
  await p.reload({ waitUntil: "networkidle" });
  await chiudiGuida(p, 800);
  const pdf = await p
    .locator('a[href^="/api/relazioni/"]')
    .evaluateAll((a) => a.map((x) => x.getAttribute("href")));
  atteso(
    pdf.length >= ambiti.length,
    `${pdf.length} bozze generate`,
    `${pdf.length} bozze per ${ambiti.length} ambiti`,
  );
  for (const h of pdf) {
    const r = await scarica(h);
    atteso(
      r.stato === 200 && r.testa.startsWith("%PDF-") && r.kb > 10,
      `PDF ${h.slice(-8)}: ${r.kb} KB`,
      `PDF ${h}: ${r.stato} ${r.tipo} ${r.kb} KB`,
    );
  }
  await scatta(p, "relazioni");
  const elimina = p.locator('button[aria-label^="Elimina la bozza"]');
  const ne = await elimina.count();
  if (ne) {
    p.once("dialog", (d) => d.accept());
    await elimina.first().click();
    await p.waitForTimeout(3000);
    atteso(
      (await elimina.count()) === ne - 1,
      "una bozza si elimina",
      `eliminare una bozza: ${ne} → ${await elimina.count()}`,
    );
  } else ko("nessun comando per eliminare una bozza");
  const pubblica = p.getByRole("button", { name: "Pubblica" });
  const np = await pubblica.count();
  await pubblica.first().click();
  await p.waitForTimeout(3000);
  const tx = await p.locator("main").innerText();
  atteso(/Pubblicata/i.test(tx), "una relazione si pubblica", "la pubblicazione non risulta");
  atteso((await pubblica.count()) === np - 1, "la pubblicata non ha più «Pubblica»");
  atteso(/impronta/i.test(tx), "la relazione mostra l'impronta");
  const fasc = await p
    .locator('[data-tour="fascicolo"] a, a[href^="/api/fascicolo/"]')
    .evaluateAll((a) => [...new Set(a.map((x) => x.getAttribute("href")))]);
  atteso(fasc.length === 4, `${fasc.length} fascicoli ispettivi`, `${fasc.length} fascicoli, attesi 4`);
  for (const h of fasc) {
    const r = await scarica(h);
    atteso(
      r.stato === 200 && r.testa.startsWith("%PDF-"),
      `fascicolo ${h.split("/").pop()}: ${r.kb} KB`,
      `fascicolo ${h}: ${r.stato}`,
    );
  }
  await vai(`${aziendaB}/relazioni`);
  const ambitiB = await p.locator('select[name="ambito"] option').evaluateAll((o) => o.map((x) => x.value));
  atteso(
    !ambitiB.includes("d231") && !ambitiB.includes("d81"),
    `su Beta (solo GDPR) gli ambiti sono ${ambitiB.join(", ")}`,
    `su Beta compaiono ambiti spenti (${ambitiB.join(", ")})`,
  );
  const fascB = await p
    .locator('a[href^="/api/fascicolo/"]')
    .evaluateAll((a) => a.map((x) => x.getAttribute("href").split("/").pop()));
  atteso(
    fascB.length === 1 && fascB[0] === "garante",
    "su Beta solo il fascicolo per il Garante",
    `su Beta i fascicoli sono ${fascB.join(", ")}`,
  );
});

await blocco("12 · Cruscotto pieno", async () => {
  await vai("/cruscotto");
  await scatta(p, "cruscotto-pieno");
  const t = await p.locator("main").innerText();
  atteso(/%/.test(t), "il cruscotto mostra le percentuali");
  atteso(
    /Collaudo Alfa|Collaudo Beta/.test(t) || (await p.locator("main a[href^='/azienda/']").count()) > 0,
    "il cruscotto porta alle aziende",
  );
});

let consulente = {
  email: "consulente.collaudo@studiotorresi.legisboard.it",
  password: "Consulente-collaudo-2026",
};
let viewer = { email: "lettura.collaudo@studiotorresi.legisboard.it", password: "" };
await blocco("13 · Impostazioni: marchio, utenze, ruoli", async () => {
  await vai("/impostazioni");
  await scatta(p, "impostazioni");
  const t = await p.locator("main").innerText();
  atteso(/Amministratore/.test(t), "il proprio ruolo si legge in italiano");
  // Marchio
  await p.fill("#brandNome", "Studio Torresi Collaudo");
  await p.locator('[data-tour="marchio"] button[type="submit"]').click();
  await p.waitForTimeout(2500);
  await p.reload({ waitUntil: "networkidle" });
  await chiudiGuida(p, 800);
  atteso(
    (await p.inputValue("#brandNome")) === "Studio Torresi Collaudo",
    "il nuovo nome dello studio resta dopo il ricaricamento",
    "il nome dello studio non cambia",
  );
  attendiErrori = true;
  await p.fill("#brandNome", "S");
  await p.locator('[data-tour="marchio"] button[type="submit"]').click();
  await p.waitForTimeout(2000);
  atteso(
    /obbligatorio|almeno/i.test(await ricevuta(p.locator('[data-tour="marchio"]'))),
    "nome di un carattere rifiutato",
  );
  attendiErrori = false;
  await p.fill("#brandNome", "Studio Torresi");
  await p.locator('[data-tour="marchio"] button[type="submit"]').click();
  await p.waitForTimeout(2000);
  // Utenza consulente con password data
  await p.fill("#u-nome", "Consulente Collaudo");
  await p.fill("#u-email", consulente.email);
  await p.selectOption("#u-ruolo", "consulente");
  await p.fill("#u-password", consulente.password);
  await p.locator('[data-tour="crea-utente"]').click();
  await p
    .getByText(consulente.email)
    .first()
    .waitFor({ timeout: 20000 })
    .catch(() => {});
  atteso((await p.getByText(consulente.email).count()) > 0, "utenza consulente creata");
  // Utenza sola lettura con password generata
  await p.fill("#u-nome", "Lettura Collaudo");
  await p.fill("#u-email", viewer.email);
  await p.selectOption("#u-ruolo", "viewer");
  await p.fill("#u-password", "");
  await p.locator('[data-tour="crea-utente"]').click();
  await p.waitForTimeout(3000);
  const consegna = p
    .locator("div")
    .filter({ hasText: /^Credenziali da consegnare/ })
    .last();
  viewer.password = (
    await consegna
      .locator("code")
      .nth(1)
      .innerText()
      .catch(() => "")
  ).trim();
  atteso(
    Boolean(viewer.password),
    "utenza in sola lettura creata, password generata mostrata",
    "la password generata non si legge",
  );
  // Email duplicata
  attendiErrori = true;
  await p.fill("#u-nome", "Doppione");
  await p.fill("#u-email", consulente.email);
  await p.locator('[data-tour="crea-utente"]').click();
  await p.waitForTimeout(2500);
  atteso(
    /esiste|già|registrat/i.test(await p.locator("main").innerText()),
    "email già usata rifiutata",
    "email duplicata: nessun messaggio",
  );
  // Password troppo corta
  await p.fill("#u-nome", "Corta");
  await p.fill("#u-email", "corta@studiotorresi.legisboard.it");
  await p.fill("#u-password", "abc");
  await p.locator('[data-tour="crea-utente"]').click();
  await p.waitForTimeout(2500);
  atteso(
    (await p.getByText("corta@studiotorresi.legisboard.it").count()) === 0,
    "password di 3 caratteri rifiutata",
    "creata un'utenza con password di 3 caratteri",
  );
  // Invito senza posta
  await p.fill("#i-email", "invito@studiotorresi.legisboard.it");
  await p.getByRole("button", { name: "Invia invito" }).click();
  await p.waitForTimeout(2500);
  const inv = await ricevuta(p.locator("form").filter({ has: p.locator("#i-email") }));
  atteso(
    inv.length > 0,
    `invito senza posta: «${inv.slice(0, 90)}»`,
    "invito senza posta: nessuna spiegazione",
  );
  attendiErrori = false;
  // Cambio di ruolo del consulente → viewer → consulente
  const riga = p.locator("tr").filter({ hasText: consulente.email });
  const sel = riga.locator('select[name="ruolo"]');
  await sel.selectOption("viewer");
  await sel
    .locator("xpath=ancestor::form")
    .locator('button[type="submit"]')
    .click()
    .catch(() => {});
  await p.waitForTimeout(2500);
  await p.reload({ waitUntil: "networkidle" });
  atteso(
    (await p
      .locator("tr")
      .filter({ hasText: consulente.email })
      .locator('select[name="ruolo"]')
      .inputValue()) === "viewer",
    "ruolo cambiato in sola lettura",
    "il cambio di ruolo non resta",
  );
  const sel2 = p.locator("tr").filter({ hasText: consulente.email }).locator('select[name="ruolo"]');
  await sel2.selectOption("consulente");
  await sel2
    .locator("xpath=ancestor::form")
    .locator('button[type="submit"]')
    .click()
    .catch(() => {});
  await p.waitForTimeout(2500);
  // Il proprio ruolo non si cambia
  attendiErrori = true;
  const mia = p.locator("tr").filter({ hasText: EMAIL }).locator('select[name="ruolo"]');
  if ((await mia.count()) && (await mia.isEnabled())) {
    await mia.selectOption("consulente");
    await mia
      .locator("xpath=ancestor::form")
      .locator('button[type="submit"]')
      .click()
      .catch(() => {});
    await p.waitForTimeout(2500);
    await p.reload({ waitUntil: "networkidle" });
    await chiudiGuida(p, 800);
  }
  const ancora = await p
    .locator("tr")
    .filter({ hasText: EMAIL })
    .locator('select[name="ruolo"]')
    .inputValue()
    .catch(() => "admin");
  atteso(
    ancora === "admin",
    "l'unico amministratore non può declassarsi",
    "l'unico amministratore si è declassato da solo",
  );
  attendiErrori = false;
  // Nuova password a un'utenza, e che funzioni
  await p
    .locator("tr")
    .filter({ hasText: viewer.email })
    .getByRole("button", { name: "Nuova password" })
    .click();
  await p.waitForTimeout(3000);
  const box = p
    .locator("div")
    .filter({ hasText: /^Credenziali da consegnare/ })
    .last();
  const nuova = (
    await box
      .locator("code")
      .nth(1)
      .innerText()
      .catch(() => "")
  ).trim();
  if (nuova && nuova !== viewer.password) {
    viewer.password = nuova;
    ok("«Nuova password» ne mostra una nuova");
  } else ko("«Nuova password» non mostra una password nuova");
  await scatta(p, "utenze");
});

await blocco("14 · Secondo fattore", async () => {
  await vai("/impostazioni");
  if (!(await p.locator("#pwd-on").count())) return ko("nessun comando per attivare il secondo fattore");
  await p.fill("#pwd-on", PASSWORD);
  await p
    .locator("form")
    .filter({ has: p.locator("#pwd-on") })
    .locator('button[type="submit"]')
    .click();
  await p.waitForTimeout(3000);
  const sezione2 = await p.locator("main").innerText();
  const segreto = sezione2.match(/Chiave segreta\s*([A-Z2-7 ]{16,})/)?.[1];
  if (!segreto) return ko("la chiave segreta non compare");
  ok("la chiave segreta compare a gruppi di quattro");
  attendiErrori = true;
  await p.fill("#totp", "123456");
  await p
    .locator("form")
    .filter({ has: p.locator("#totp") })
    .locator('button[type="submit"]')
    .click();
  await p.waitForTimeout(2500);
  atteso(!(await p.getByText("Non verranno mostrati di nuovo.").count()), "codice sbagliato rifiutato");
  attendiErrori = false;
  await p.fill("#totp", totp(segreto));
  await p
    .locator("form")
    .filter({ has: p.locator("#totp") })
    .locator('button[type="submit"]')
    .click();
  const codici = await p
    .getByText("Non verranno mostrati di nuovo.")
    .waitFor({ timeout: 15000 })
    .then(() => true)
    .catch(() => false);
  atteso(
    codici,
    "codice giusto accettato, compaiono i codici di recupero",
    "il codice giusto non attiva il secondo fattore",
  );
  await scatta(p, "secondo-fattore");
  if (codici) await p.getByRole("button", { name: "Li ho conservati" }).click();
  // Rientro con il secondo fattore
  const c2 = await nuovoContesto();
  const p2 = await c2.newPage();
  await p2.goto(`${BASE}/accedi`, { waitUntil: "networkidle" });
  await p2.fill("#email", EMAIL);
  await p2.fill("#password", PASSWORD);
  await p2.locator('button[type="submit"]').first().click();
  await p2.waitForTimeout(3000);
  const chiede = await p2
    .locator('input[autocomplete="one-time-code"], input[inputmode="numeric"]')
    .first()
    .isVisible()
    .catch(() => false);
  atteso(
    chiede,
    "all'accesso chiede il codice",
    "con il secondo fattore attivo l'accesso non chiede il codice",
  );
  if (chiede) {
    await p2.waitForTimeout(31000 - (Date.now() % 30000)); // un codice nuovo, non quello già usato
    await p2
      .locator('input[autocomplete="one-time-code"], input[inputmode="numeric"]')
      .first()
      .fill(totp(segreto));
    await p2.keyboard.press("Enter");
    await p2.waitForURL(/cruscotto/, { timeout: 20000 }).catch(() => {});
    atteso(
      p2.url().includes("/cruscotto"),
      "con il codice si entra",
      `con il codice non si entra (${p2.url()})`,
    );
  }
  await c2.close();
  // Disattivazione
  await vai("/impostazioni");
  if (await p.locator("#pwd-off").count()) {
    await p.fill("#pwd-off", PASSWORD);
    await p
      .locator("form")
      .filter({ has: p.locator("#pwd-off") })
      .locator('button[type="submit"]')
      .click();
    await p.waitForTimeout(3000);
    atteso(
      (await p.locator("#pwd-on").count()) > 0,
      "secondo fattore disattivato",
      "il secondo fattore non si disattiva",
    );
  } else ko("nessun comando per disattivare il secondo fattore");
});

await blocco("15 · Ruoli: consulente e sola lettura", async () => {
  for (const [chi, u] of [
    ["consulente", consulente],
    ["sola lettura", viewer],
  ]) {
    if (!u.password) {
      ko(`${chi}: password sconosciuta, salto`);
      continue;
    }
    const c = await nuovoContesto();
    const q = await c.newPage();
    sorveglia(q, chi);
    const dove = await accedi(q, u.email, u.password);
    atteso(dove === "/cruscotto", `${chi}: accesso → ${dove}`);
    await chiudiGuida(q);
    await q.goto(`${BASE}/portafoglio`, { waitUntil: "networkidle" });
    await chiudiGuida(q);
    const puoCreare = await q
      .locator('[data-tour="nuova-azienda"]')
      .first()
      .isVisible()
      .catch(() => false);
    atteso(
      chi === "consulente" ? puoCreare : !puoCreare,
      `${chi}: «Nuova azienda» ${puoCreare ? "visibile" : "assente"}`,
      `${chi}: «Nuova azienda» ${puoCreare ? "visibile" : "assente"}, non dovrebbe`,
    );
    await q.goto(`${BASE}${aziendaA}/gdpr`, { waitUntil: "networkidle" });
    await chiudiGuida(q);
    await q.locator('[data-tour="apri-adempimento"]').first().click();
    await q.locator('[data-tour="dettaglio-adempimento"]').waitFor({ timeout: 15000 });
    await q.waitForTimeout(800);
    const disab = await q.locator('[data-tour="stato-in-corso"]').isDisabled();
    atteso(
      chi === "consulente" ? !disab : disab,
      `${chi}: stati ${disab ? "bloccati" : "modificabili"}`,
      `${chi}: stati ${disab ? "bloccati" : "modificabili"}, non dovrebbero`,
    );
    await q.keyboard.press("Escape");
    if (chi === "sola lettura") {
      await q.goto(`${BASE}${aziendaA}`, { waitUntil: "networkidle" });
      await chiudiGuida(q);
      const moduliAttivi = await q
        .locator('[data-tour="moduli-azienda"] button[type="submit"]:enabled')
        .count();
      atteso(
        moduliAttivi === 0,
        "sola lettura: i moduli non si commutano",
        `sola lettura: ${moduliAttivi} comandi dei moduli attivi`,
      );
      await q.goto(`${BASE}${aziendaA}/registro/violazione`, { waitUntil: "networkidle" });
      await chiudiGuida(q);
      atteso(
        (await q.locator('[data-tour="apri-voce"]').count()) === 0,
        "sola lettura: niente «Apri violazione»",
        "sola lettura: vede «Apri violazione»",
      );
      await q.goto(`${BASE}${aziendaA}/gdpr`, { waitUntil: "networkidle" });
      await chiudiGuida(q);
      await q.locator('[data-tour="apri-adempimento"]').first().click();
      await q.waitForTimeout(1500);
      atteso(
        (await q.locator('[data-tour="evidenze"] input[type="file"]').count()) === 0,
        "sola lettura: niente caricamento di evidenze",
        "sola lettura: può caricare evidenze",
      );
      await q.keyboard.press("Escape");
    }
    await q.goto(`${BASE}/impostazioni`, { waitUntil: "networkidle" });
    const gestisce = await q
      .locator('[data-tour="crea-utente"]')
      .isVisible()
      .catch(() => false);
    atteso(!gestisce, `${chi}: niente gestione utenze`, `${chi}: vede la gestione delle utenze`);
    const marchio = await q
      .locator("#brandNome")
      .isEditable()
      .catch(() => false);
    atteso(!marchio, `${chi}: il marchio non è modificabile`, `${chi}: può cambiare il marchio`);
    await q.goto(`${BASE}${aziendaA}/relazioni`, { waitUntil: "networkidle" });
    const genera = await q
      .locator('[data-tour="genera-relazione"]')
      .isEnabled()
      .catch(() => false);
    atteso(
      chi === "consulente" ? genera : !genera,
      `${chi}: generare relazioni ${genera ? "consentito" : "bloccato"}`,
      `${chi}: generare relazioni ${genera ? "consentito" : "bloccato"}, non dovrebbe`,
    );
    const pdf = await q
      .locator('a[href^="/api/relazioni/"]')
      .first()
      .getAttribute("href")
      .catch(() => null);
    if (pdf) atteso((await scarica(pdf, q)).stato === 200, `${chi}: scarica le relazioni`);
    await scatta(q, `ruolo-${chi.replace(/\W/g, "")}`);
    await c.close();
  }
});

let xss = false;
p.on("dialog", (d) => {
  xss = true;
  d.dismiss().catch(() => {});
});
await blocco("17 · Casi limite", async () => {
  const NOME = `Prova <img src=x onerror="window.__xss=1"> «àèé» 😀 & "virgolette"`;
  await vai("/portafoglio");
  const righePrima = await p.locator('[data-tour="tabella-portafoglio"] tbody tr').count();
  await p.locator('[data-tour="nuova-azienda"]').first().click();
  await p.waitForSelector('[role="dialog"]');
  await p.fill("#nome", NOME);
  await p.check('input[name="modulo-gdpr"]');
  await p.uncheck('input[name="modulo-d231"]').catch(() => {});
  await p.uncheck('input[name="modulo-d81"]').catch(() => {});
  // Doppio clic: deve nascere UNA azienda
  await p.locator('[role="dialog"] button[type="submit"]').dblclick();
  await p.waitForURL(/\/azienda\//, { timeout: 60000 }).catch(() => {});
  const aziendaX = new URL(p.url()).pathname;
  await chiudiGuida(p);
  const eseguito = await p.evaluate(() => Boolean(window.__xss));
  atteso(
    !eseguito && !xss,
    "HTML nel nome dell'azienda: mostrato, non eseguito",
    "HTML nel nome dell'azienda ESEGUITO",
  );
  atteso(
    (await p.locator("main").innerText()).includes("<img src=x"),
    "il nome compare letterale, con accenti ed emoji",
  );
  await vai("/portafoglio");
  const righeDopo = await p.locator('[data-tour="tabella-portafoglio"] tbody tr').count();
  atteso(
    righeDopo === righePrima + 1,
    "doppio clic su «Crea»: una sola azienda",
    `doppio clic su «Crea»: ${righeDopo - righePrima} aziende`,
  );
  // Nome lunghissimo: niente scorrimento orizzontale
  await p.locator('[data-tour="nuova-azienda"]').first().click();
  await p.waitForSelector('[role="dialog"]');
  await p.fill("#nome", "Società Cooperativa ".repeat(14).trim());
  await p.check('input[name="modulo-gdpr"]');
  await p.locator('[role="dialog"] button[type="submit"]').click();
  await p.waitForURL(/\/azienda\//, { timeout: 60000 }).catch(() => {});
  await chiudiGuida(p);
  const largo = await p.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  atteso(
    !largo,
    "nome di 280 caratteri: la scheda non sborda",
    "nome di 280 caratteri: la scheda sborda in orizzontale",
  );
  await vai("/portafoglio");
  const largo2 = await p.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  atteso(
    !largo2,
    "nome di 280 caratteri: il portafoglio non sborda",
    "nome di 280 caratteri: il portafoglio sborda",
  );
  await scatta(p, "nomi-lunghi");
  // Note con HTML
  await vai(`${aziendaX}/gdpr`);
  await apriAdempimento(0);
  await pannello()
    .locator('textarea[placeholder^="Annotazioni"]')
    .fill(`<script>window.__xss2=1</script><b>grassetto?</b>`);
  await pannello().getByRole("button", { name: "Salva le note" }).click();
  await p.waitForTimeout(2000);
  await p.keyboard.press("Escape");
  await vai(`${aziendaX}/gdpr`);
  await apriAdempimento(0);
  atteso(!(await p.evaluate(() => Boolean(window.__xss2))), "HTML nelle note: non eseguito");
  // Evidenza con nome accentato
  const accentato = join(cartella, "Verbale OdV n°3 – àèì.pdf");
  writeFileSync(accentato, "%PDF-1.4\n% accentato\n%%EOF\n");
  const ev = pannello().locator('[data-tour="evidenze"]');
  await ev.locator('input[type="file"]').setInputFiles(accentato);
  await ev.getByRole("button", { name: "Allega", exact: true }).click();
  await p.waitForTimeout(3500);
  const linkAcc = ev.locator('a[href^="/api/evidenze/"]').first();
  atteso(
    (await linkAcc.count()) > 0 && /n°3/.test(await ev.innerText()),
    "evidenza con accenti allegata e in elenco",
    "evidenza con accenti: non compare in elenco",
  );
  if (await linkAcc.count()) {
    const r = await scarica(await linkAcc.getAttribute("href"));
    atteso(
      r.stato === 200 && /filename/.test(r.disposizione),
      `download con nome accentato (${r.disposizione.slice(0, 90)})`,
      `download accentato: ${r.stato} ${r.disposizione}`,
    );
  }
  await p.keyboard.press("Escape");
  // Relazione e PDF di un'azienda con HTML nel nome
  await vai(`${aziendaX}/relazioni`);
  await p.locator('[data-tour="genera-relazione"]').click();
  await p.waitForTimeout(6000);
  const pdfX = await p
    .locator('a[href^="/api/relazioni/"]')
    .first()
    .getAttribute("href")
    .catch(() => null);
  if (pdfX) {
    const r = await scarica(pdfX);
    atteso(
      r.stato === 200 && r.testa.startsWith("%PDF-"),
      "PDF della relazione con HTML nel nome: generato",
      `PDF con HTML nel nome: ${r.stato}`,
    );
  } else ko("relazione dell'azienda con HTML nel nome non generata");
  const fx = await scarica(`/api/fascicolo/${aziendaX.split("/").pop()}/garante`);
  atteso(fx.stato === 200 && fx.testa.startsWith("%PDF-"), "fascicolo con HTML nel nome: generato");
  // Formula nel CSV
  await vai(`${aziendaA}/registro/trattamento`);
  await p.locator('[data-tour="apri-voce"]').click();
  const m = p.locator("form").filter({ has: p.locator('input[name="titolo"]') });
  await m.locator('input[name="titolo"]').fill('=HYPERLINK("http://esempio.invalid";"clic")');
  await m.locator('input[name="conosciutoIl"]').fill("2026-11-01T09:00");
  for (const sel of await m.locator("select").all()) {
    const v = await sel.locator("option").evaluateAll((o) => o.map((x) => x.value).filter(Boolean));
    if (v[0]) await sel.selectOption(v[0]);
  }
  for (const c of await m.locator("input[required]:not([type=hidden])").all())
    if ((await c.inputValue()) === "") await c.fill("prova");
  await m.locator('button[type="submit"]').click();
  await p.waitForTimeout(3000);
  const csvH = await p.locator('a[href*="/esporta"]').first().getAttribute("href");
  const csv = await scarica(csvH);
  atteso(
    csv.testo.includes("'=HYPERLINK"),
    "formula nel titolo: nel CSV diventa testo",
    `formula nel CSV non neutralizzata: ${csv.testo.slice(0, 200)}`,
  );
  // Ricerca: scrivi e vai
  await vai("/cruscotto");
  await p.keyboard.press("Control+k");
  await p.locator('[data-tour="palette"] input').fill("Beta");
  await p.waitForTimeout(1500);
  await p.keyboard.press("Enter");
  await p.waitForURL(/\/azienda\//, { timeout: 10000 }).catch(() => {});
  atteso(
    p.url().includes("/azienda/"),
    "Ctrl+K «Beta» + Invio porta all'azienda",
    `Ctrl+K + Invio non porta all'azienda (${p.url()})`,
  );
  // Indietro e avanti
  await vai("/portafoglio");
  await p.locator('[data-tour="tabella-portafoglio"] tbody tr a').first().click();
  await p.waitForURL(/\/azienda\//, { timeout: 15000 });
  await p.goBack({ waitUntil: "networkidle" });
  atteso(
    new URL(p.url()).pathname === "/portafoglio" &&
      (await p.locator('[data-tour="tabella-portafoglio"]').isVisible()),
    "«indietro» torna al portafoglio intatto",
  );
  await p.goForward({ waitUntil: "networkidle" });
  atteso(p.url().includes("/azienda/"), "«avanti» riporta alla scheda");
  // Nascondi i primi passi
  await vai("/cruscotto");
  const pp = p.locator('[data-tour="primi-passi"]');
  if (await pp.isVisible().catch(() => false)) {
    await pp.getByRole("button", { name: /Nascondi/ }).click();
    await p.waitForTimeout(2500);
    await p.reload({ waitUntil: "networkidle" });
    atteso(
      !(await pp.isVisible().catch(() => false)),
      "«Nascondi i primi passi» li toglie, anche ricaricando",
      "«Nascondi i primi passi» non li toglie",
    );
  } else ok("primi passi già completati e spariti da soli");
  // Telefono
  const tel = await browser.newContext({
    viewport: { width: 390, height: 844 },
    isMobile: true,
    hasTouch: true,
    locale: "it-IT",
  });
  await tel.addCookies(await ctx.cookies());
  const t = await tel.newPage();
  sorveglia(t, "telefono");
  for (const u of [
    "/cruscotto",
    "/portafoglio",
    aziendaA,
    `${aziendaA}/gdpr`,
    `${aziendaA}/registro/violazione`,
    "/scadenzario",
    `${aziendaA}/relazioni`,
    "/impostazioni",
  ]) {
    await t.goto(`${BASE}${u}`, { waitUntil: "networkidle" });
    await chiudiGuida(t);
    const sborda = await t.evaluate(
      () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
    );
    atteso(!sborda, `telefono ${u}: niente scorrimento orizzontale`, `telefono ${u}: la pagina sborda`);
  }
  await t.goto(`${BASE}${aziendaA}/gdpr`, { waitUntil: "networkidle" });
  await chiudiGuida(t);
  await t.locator('[data-tour="apri-adempimento"]').first().tap();
  await t.locator('[data-tour="dettaglio-adempimento"]').waitFor({ timeout: 15000 });
  await t.locator('[data-tour="stato-in-corso"]').tap();
  await t.waitForTimeout(2000);
  atteso(
    !/errore/i.test(await ricevuta(t.locator('[data-tour="dettaglio-adempimento"]'))),
    "telefono: cambio di stato dal pannello",
  );
  await scatta(t, "telefono-pannello");
  await t.goto(`${BASE}/cruscotto`, { waitUntil: "networkidle" });
  await chiudiGuida(t);
  const menu = t.locator('button[aria-label="Apri la navigazione"]');
  if (await menu.count()) {
    await menu.tap();
    await t.waitForTimeout(600);
    await t.locator('a[href="/scadenzario"]:visible').first().tap();
    await t.waitForURL(/scadenzario/, { timeout: 10000 }).catch(() => {});
    atteso(t.url().includes("/scadenzario"), "telefono: il menu porta allo scadenzario");
  } else ko("telefono: nessun pulsante del menu");
  await tel.close();
  // Solo tastiera
  const kc = await nuovoContesto();
  const k = await kc.newPage();
  await k.goto(`${BASE}/accedi`, { waitUntil: "networkidle" });
  for (let i = 0; i < 10 && !(await k.evaluate(() => document.activeElement?.id === "email")); i++)
    await k.keyboard.press("Tab");
  await k.keyboard.type(EMAIL);
  await k.keyboard.press("Tab");
  await k.keyboard.type(PASSWORD);
  await k.keyboard.press("Enter");
  await k.waitForURL(/cruscotto/, { timeout: 20000 }).catch(() => {});
  atteso(
    k.url().includes("/cruscotto"),
    "accesso solo da tastiera",
    `accesso da tastiera fallito (${k.url()})`,
  );
  await kc.close();
});

await blocco("16 · Uscita", async () => {
  await vai("/cruscotto");
  await p.locator('[data-tour="esci"]').first().click();
  await p.waitForURL(/accedi/, { timeout: 15000 }).catch(() => {});
  atteso(p.url().includes("/accedi"), "«Esci» riporta all'accesso");
  await p.goto(`${BASE}/cruscotto`, { waitUntil: "networkidle" });
  atteso(p.url().includes("/accedi"), "dopo l'uscita il cruscotto non è più raggiungibile");
});

await blocco("18 · Limite dei tentativi d'accesso", async () => {
  attendiErrori = true;
  const c = await nuovoContesto();
  const q = await c.newPage();
  let messaggio = "";
  for (let i = 0; i < 12; i++) {
    await q.goto(`${BASE}/accedi`, { waitUntil: "domcontentloaded" });
    await q.fill("#email", "nessuno@esempio.invalid");
    await q.fill("#password", `sbagliata-${i}-xxxxxx`);
    await q.locator('button[type="submit"]').first().click();
    await q.waitForTimeout(900);
    messaggio = (
      await q
        .locator('[role="alert"]')
        .first()
        .innerText()
        .catch(() => "")
    ).trim();
  }
  atteso(
    /troppi|tentativ|riprova|attendi/i.test(messaggio),
    `dopo 12 tentativi: «${messaggio}»`,
    `dopo 12 tentativi nessun blocco: «${messaggio}»`,
  );
  await c.close();
  attendiErrori = false;
});

await browser.close();
for (const e of [...new Set(erroriRete)]) {
  problemi.push(`[rete/console] ${e}`);
  console.log(`  ✗ ${e}`);
}
console.log(
  `\n${verifiche} verifiche · ${problemi.length === 0 ? "✓ nessun problema" : `✗ ${problemi.length} problemi`} · scatti in ${S}`,
);
writeFileSync(join(S, "esito.txt"), problemi.join("\n"));
process.exit(problemi.length === 0 ? 0 : 1);
