#!/usr/bin/env node
// Collaudo di un'istanza APPENA CONSEGNATA, vuota, dal primo accesso all'ultima tappa dei
// primi passi _(2026-11-12)_.
//
// `percorso.mjs` e il cancello visivo partono da un'istanza con i dati della vetrina. Questo
// parte da dove parte il cliente: nessuna azienda, password iniziale da cambiare, nessun giro
// visto. Fa ciò che farà lui, tappa per tappa, e a ogni schermata controlla che si apra il giro
// GIUSTO, che il riquadro dei primi passi spunti la tappa da solo, e che non ci siano errori
// in console né risposte 4xx/5xx.
//
//   BASE=https://cliente.legisboard.it EMAIL=… PASSWORD=… NUOVA=… node scripts/collaudo-primi-passi.mjs
//
// Le credenziali solo dall'ambiente: mai su riga di comando, che finisce nella cronologia.
// SI ESEGUE UNA VOLTA PER ISTANZA, prima della consegna: lascia un'azienda di prova
// («Collaudo primi passi S.r.l.») che va archiviata, e un'utenza di prova da disattivare.

import { chromium } from "playwright";
import { mkdirSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import { tmpdir } from "node:os";

const BASE = process.env.BASE ?? "http://127.0.0.1:3100";
const EMAIL = process.env.EMAIL;
const PASSWORD = process.env.PASSWORD;
const NUOVA = process.env.NUOVA ?? PASSWORD;
const S = process.env.SCATTI ?? join(process.cwd(), "collaudo-primi-passi");
if (!EMAIL || !PASSWORD) {
  console.error("Servono EMAIL e PASSWORD nell'ambiente.");
  process.exit(2);
}
mkdirSync(S, { recursive: true });

const problemi = [];
const nota = (t) => console.log(`  · ${t}`);
const problema = (t) => {
  problemi.push(t);
  console.log(`  ✗ ${t}`);
};

const browser = await chromium.launch();
const ctx = await browser.newContext({
  viewport: { width: 1440, height: 900 },
  locale: "it-IT",
  timezoneId: "Europe/Rome",
  // Il collaudo locale gira dietro Caddy con `tls internal`: certificato di una CA privata.
  ignoreHTTPSErrors: true,
  acceptDownloads: true,
});
const p = await ctx.newPage();
const errori = [];
p.on("console", (m) => {
  if (m.type() === "error") errori.push(`${new URL(p.url()).pathname} · console: ${m.text()}`);
});
p.on("pageerror", (e) => errori.push(`${new URL(p.url()).pathname} · eccezione: ${e.message}`));
p.on("response", (r) => {
  if (r.status() >= 400) errori.push(`${r.status()} ${r.request().method()} ${r.url()}`);
});

let n = 0;
const scatta = (nome) =>
  p.screenshot({ path: `${S}/${String(++n).padStart(2, "0")}-${nome}.png`, fullPage: true });

/**
 * Il giro che si apre da solo: si attende, si leggono i titoli passo per passo e si chiude
 * con l'ultimo pulsante. Restituisce i titoli, o `[]` se nessun giro si è aperto.
 */
async function giro(atteso, attesa = 5000) {
  const pop = p.locator(".driver-popover");
  const aperto = await pop
    .waitFor({ state: "visible", timeout: attesa })
    .then(() => true)
    .catch(() => false);
  if (!aperto) {
    if (atteso) problema(`nessun giro si è aperto (atteso il primo passo «${atteso}»)`);
    return [];
  }
  const titoli = [];
  for (let i = 0; i < 12; i++) {
    titoli.push((await p.locator(".driver-popover-title").innerText()).trim());
    const avanti = p.locator(".driver-popover-next-btn");
    const testo = (await avanti.innerText().catch(() => "")).trim();
    await avanti.click();
    await p.waitForTimeout(350);
    if (testo === "Ho capito" || !(await pop.isVisible())) break;
  }
  if (atteso && titoli[0] !== atteso)
    problema(`giro sbagliato: primo passo «${titoli[0]}», atteso «${atteso}»`);
  else nota(`giro: ${titoli.length} passi · ${titoli.join(" / ")}`);
  // Il giro si registra come visto con un'azione di server: si lascia il tempo di arrivare.
  await p.waitForTimeout(800);
  return titoli;
}

/** Quante tappe il riquadro dichiara fatte, letto dal cruscotto com'è adesso. */
async function tappe() {
  await p.goto(`${BASE}/cruscotto`, { waitUntil: "networkidle" });
  // Con i primi dati il cruscotto apre il proprio giro, una volta: si legge e si chiude.
  await giro(null, 2500);
  const r = p.locator('[data-tour="primi-passi"]');
  if (!(await r.isVisible().catch(() => false))) return null;
  const t = await r.locator("header p.cifra").innerText();
  return Number(t.split(" di ")[0]);
}
async function attendiTappe(minimo, cosa) {
  const fatte = await tappe();
  if (fatte === null) {
    if (minimo < 7) problema(`${cosa}: il riquadro dei primi passi è sparito prima della fine`);
    return;
  }
  if (fatte < minimo) problema(`${cosa}: il riquadro segna ${fatte} tappe fatte, attese almeno ${minimo}`);
  else nota(`primi passi: ${fatte} di 7`);
}

// --- 1 · Accesso con la password iniziale, cambio forzato ----------------------------------
console.log("\n1 · Primo accesso");
await p.goto(BASE, { waitUntil: "networkidle" });
if (!p.url().includes("/accedi")) problema(`la radice non porta all'accesso: ${p.url()}`);
await p.fill("#email", EMAIL);
await p.fill("#password", PASSWORD);
await p.click('button[type="submit"]');
await p.waitForURL(/primo-accesso|cruscotto|portafoglio/, { timeout: 20000 }).catch(() => {});
await p.waitForLoadState("networkidle");
await p.waitForTimeout(800);
if (p.url().includes("/primo-accesso")) {
  nota("cambio password richiesto, come deve essere su un'istanza venduta");
  await scatta("primo-accesso");
  await p.fill("#attuale", PASSWORD);
  await p.fill("#nuova", NUOVA);
  await p.fill("#conferma", NUOVA);
  await p.locator('form button[type="submit"]').click();
  await p.waitForURL((u) => !u.pathname.startsWith("/primo-accesso"), { timeout: 20000 }).catch(() => {});
  if (p.url().includes("/primo-accesso")) problema("il cambio password non va a buon fine");
  else nota(`password cambiata → ${new URL(p.url()).pathname}`);
  // Il difetto del 2026-11-12: a cambio fatto la sessione in cache rimandava qui per 5 minuti.
  await p.goto(`${BASE}/cruscotto`, { waitUntil: "networkidle" });
  if (p.url().includes("/primo-accesso"))
    problema("a password cambiata, il cruscotto rimanda ancora al cambio");
  else nota("a password cambiata si resta dentro");
} else {
  problema(`nessun cambio password al primo accesso (siamo su ${new URL(p.url()).pathname})`);
}

// --- 2 · Cruscotto vuoto: benvenuto e primi passi -----------------------------------------
console.log("\n2 · Cruscotto vuoto");
await p.goto(`${BASE}/cruscotto`, { waitUntil: "networkidle" });
const riquadro = p.locator('[data-tour="primi-passi"]');
if (!(await riquadro.isVisible())) problema("il riquadro dei primi passi non c'è sul cruscotto vuoto");
else {
  const intestazione = await riquadro.locator("header").innerText();
  nota(`riquadro: ${intestazione.replace(/\s+/g, " ")}`);
  if (!/0 di 7/.test(intestazione)) problema("un'istanza vuota non parte da 0 di 7");
}
await giro("Benvenuto nel registro di conformità dello studio");
await scatta("cruscotto-vuoto");

// --- 3 · Portafoglio vuoto e prima azienda -------------------------------------------------
console.log("\n3 · Tappa 1: la prima azienda");
await riquadro.locator('[data-tour="primi-passi-prossima"] a').click();
await p.waitForURL(/\/portafoglio/, { timeout: 15000 });
await p.waitForLoadState("networkidle");
await giro("Il portafoglio sono le aziende che segui");
await scatta("portafoglio-vuoto");
await p.locator('[data-tour="nuova-azienda"]').first().click();
await p.waitForSelector('[role="dialog"]');
await p.fill("#nome", "Collaudo primi passi S.r.l.");
await p.fill("#piva", "12345678901");
for (const d of ["gdpr", "d231", "d81"]) await p.check(`input[name="modulo-${d}"]`);
await p.fill("#numeroDipendenti", "35").catch(() => nota("campo dipendenti non trovato"));
await p.fill("#fatturatoAnnuo", "4200000").catch(() => nota("campo fatturato non trovato"));
await p.locator('[role="dialog"] button[type="submit"]').click();
await p.waitForURL(/\/azienda\//, { timeout: 60000 }).catch(() => {});
if (!p.url().includes("/azienda/")) problema(`la creazione non apre la scheda: ${p.url()}`);
const azienda = new URL(p.url()).pathname;
nota(`creata: ${azienda}`);
await giro("I moduli si attivano per azienda");
await scatta("azienda");
await attendiTappe(1, "dopo la prima azienda");

// --- 4 · Primo adempimento e prima evidenza ------------------------------------------------
console.log("\n4 · Tappe 2 e 3: adempimento ed evidenza");
await riquadro.locator('[data-tour="primi-passi-prossima"] a').click();
await p.waitForURL(/\/azienda\/[^/]+\/[a-z0-9]+$/, { timeout: 15000 });
await p.waitForLoadState("networkidle");
nota(`la tappa porta a ${new URL(p.url()).pathname}`);
await giro("Due stati, non uno");
await p.locator('[data-tour="apri-adempimento"]').first().click();
const dettaglio = p.locator('[data-tour="dettaglio-adempimento"]');
await dettaglio.waitFor({ timeout: 15000 });
await p.locator('[data-tour="stato-completata"]').click();
await p.waitForTimeout(1500);
await p.fill('[data-tour="ultima-esecuzione"]', "2026-10-01");
await dettaglio.getByRole("button", { name: "Aggiorna", exact: true }).click();
const salvato = await dettaglio
  .locator('[role="status"]')
  .waitFor({ timeout: 30000 })
  .then(() => true)
  .catch(() => false);
if (!salvato) problema("l'ultima esecuzione non si salva");
else nota("adempimento completato con ultima esecuzione 01/10/2026");

// Un PDF vero, minimo: il tipo si verifica dal contenuto, quindi un file finto verrebbe rifiutato.
const pdf = join(tmpdir(), "evidenza-collaudo.pdf");
writeFileSync(
  pdf,
  "%PDF-1.4\n1 0 obj<</Type/Catalog/Pages 2 0 R>>endobj\n2 0 obj<</Type/Pages/Kids[3 0 R]/Count 1>>endobj\n3 0 obj<</Type/Page/Parent 2 0 R/MediaBox[0 0 200 200]>>endobj\ntrailer<</Root 1 0 R>>\n%%EOF\n",
);
await dettaglio.locator('input[type="file"]').setInputFiles(pdf);
await dettaglio.getByRole("button", { name: "Allega", exact: true }).click();
const allegata = await dettaglio
  .getByText("evidenza-collaudo.pdf")
  .first()
  .waitFor({ timeout: 30000 })
  .then(() => true)
  .catch(() => false);
if (!allegata) {
  const e = await dettaglio
    .locator('[role="alert"]')
    .first()
    .innerText()
    .catch(() => "");
  problema(`l'evidenza non si allega${e ? `: «${e}»` : ""}`);
} else nota("evidenza PDF allegata");
await scatta("assessment");
await attendiTappe(3, "dopo adempimento ed evidenza");

// --- 5 · Un fatto in un registro -----------------------------------------------------------
console.log("\n5 · Tappa 4: il registro");
await riquadro.locator('[data-tour="primi-passi-prossima"] a').click();
await p.waitForURL(/\/azienda\/[^/]+$/, { timeout: 15000 });
const primoRegistro = await p
  .locator('[data-tour="registri"] a[href*="/registro/"]')
  .first()
  .getAttribute("href");
if (!primoRegistro) problema("dalla scheda azienda non si raggiunge nessun registro");
else {
  await p.goto(`${BASE}${primoRegistro}`, { waitUntil: "networkidle" });
  nota(`registro: ${primoRegistro.split("/registro/")[1]}`);
  await giro("Gli adempimenti hanno una periodicità, i fatti no");
  await p.locator('[data-tour="apri-voce"]').click();
  const modulo = p.locator("form").filter({ has: p.locator('input[name="titolo"]') });
  await modulo.locator('input[name="titolo"]').fill("Collaudo: voce di prova");
  await modulo.locator('input[name="conosciutoIl"]').fill("2026-11-10T09:30");
  // I campi propri di ciascun registro: si riempiono gli obbligatori, qualunque siano.
  for (const s of await modulo.locator("select[required]").all()) {
    const valori = await s.locator("option").evaluateAll((o) => o.map((x) => x.value).filter(Boolean));
    if (valori[0]) await s.selectOption(valori[0]);
  }
  for (const c of await modulo.locator("input[required]:not([type=hidden])").all()) {
    if ((await c.inputValue()) === "") {
      const tipo = await c.getAttribute("type");
      await c.fill(tipo === "date" ? "2026-11-10" : tipo === "number" ? "1" : "prova");
    }
  }
  const descr = modulo.locator('textarea[name="descrizione"]');
  if (await descr.count()) await descr.fill("Voce aperta dal collaudo dell'istanza.");
  await modulo.locator('button[type="submit"]').click();
  const aperta = await p
    .getByText("Collaudo: voce di prova")
    .first()
    .waitFor({ timeout: 30000 })
    .then(() => true)
    .catch(() => false);
  if (!aperta) problema("la voce di registro non si apre");
  else nota("voce di registro aperta");
  await scatta("registro");
}
await attendiTappe(4, "dopo il registro");

// --- 6 · Scadenzario ------------------------------------------------------------------------
console.log("\n6 · Tappa 5: lo scadenzario");
await riquadro.locator('[data-tour="primi-passi-prossima"] a').click();
await p.waitForURL(/\/scadenzario/, { timeout: 15000 });
await p.waitForLoadState("networkidle");
// Su un'azienda appena creata nessun adempimento ha una data: la fascia «cosa scade» non c'è,
// e il giro parte giustamente dal passo successivo.
await giro("La finestra è la domanda");
await scatta("scadenzario");
await attendiTappe(5, "dopo lo scadenzario");

// --- 7 · Relazione: genera, scarica, pubblica ---------------------------------------------
console.log("\n7 · Tappa 6: la relazione");
await riquadro.locator('[data-tour="primi-passi-prossima"] a').click();
await p.waitForURL(/\/relazioni/, { timeout: 15000 });
await p.waitForLoadState("networkidle");
await giro("Prima una bozza, poi un atto");
await p.locator('[data-tour="genera-relazione"]').click();
const bozza = await p
  .getByText("Bozza", { exact: true })
  .first()
  .waitFor({ timeout: 60000 })
  .then(() => true)
  .catch(() => false);
if (!bozza) problema("la relazione non si genera");
else {
  nota("bozza generata");
  const href = await p.locator('a[href^="/api/relazioni/"]').first().getAttribute("href");
  // Dal browser e non da Node: `*.localhost` lo risolve Chrome, il resolver di sistema no.
  const pdfEsito = await p.evaluate(async (u) => {
    const r = await fetch(u);
    const b = new Uint8Array(await r.arrayBuffer());
    return {
      stato: r.status,
      tipo: r.headers.get("content-type"),
      testa: String.fromCharCode(...b.slice(0, 5)),
      kb: Math.round(b.length / 1024),
    };
  }, href);
  if (pdfEsito.stato !== 200 || pdfEsito.testa !== "%PDF-")
    problema(`il PDF della relazione non esce: ${pdfEsito.stato} ${pdfEsito.tipo}`);
  else nota(`PDF della relazione: ${pdfEsito.kb} KB`);
  await p.getByRole("button", { name: "Pubblica" }).first().click();
  const pubblicata = await p
    .getByText(/Pubblicata/)
    .first()
    .waitFor({ timeout: 30000 })
    .then(() => true)
    .catch(() => false);
  if (!pubblicata) problema("la relazione non si pubblica");
  else nota("relazione pubblicata");
}
await scatta("relazioni");
await attendiTappe(6, "dopo la relazione");

// --- 8 · Un collega ---------------------------------------------------------------------------
console.log("\n8 · Tappa 7: un collega");
await riquadro.locator('[data-tour="primi-passi-prossima"] a').click();
await p.waitForURL(/\/impostazioni/, { timeout: 15000 });
await p.waitForLoadState("networkidle");
// Senza relay di posta l'invito deve rifiutare con una spiegazione, non accodare in silenzio.
await p.fill("#i-email", "collega.invito@torresitest.prova");
await p.getByRole("button", { name: "Invia invito" }).click();
await p.waitForTimeout(2000);
const esitoInvito = await p
  .locator("form")
  .filter({ has: p.locator("#i-email") })
  .locator('[role="alert"], [role="status"]')
  .first()
  .innerText()
  .catch(() => "");
nota(`invito → «${esitoInvito.trim().slice(0, 140)}»`);
await p.fill("#u-nome", "Collega di prova");
await p.fill("#u-email", "collega@torresitest.prova");
await p.getByRole("button", { name: "Crea l'utenza" }).click();
const creato = await p
  .getByText("collega@torresitest.prova")
  .first()
  .waitFor({ timeout: 30000 })
  .then(() => true)
  .catch(() => false);
if (!creato) problema("l'utenza del collega non si crea");
else nota("utenza del collega creata");
await scatta("impostazioni");

// --- 9 · Fine: il riquadro sparisce, il cruscotto è pieno ---------------------------------
console.log("\n9 · Fine dei primi passi");
const finali = await tappe();
if (finali !== null) problema(`a sette tappe fatte il riquadro è ancora lì (${finali} di 7)`);
else nota("riquadro sparito: tutte e sette le tappe fatte");
await scatta("cruscotto-pieno");

// Il portafoglio pieno ha un giro suo, diverso da quello del portafoglio vuoto visto alla
// tappa 1: si verifica qui, e così il cancello visivo che segue non trova un velo aperto.
await p.goto(`${BASE}/portafoglio`, { waitUntil: "networkidle" });
await giro("Una riga per azienda, una colonna per decreto");
await scatta("portafoglio-pieno");

// --- Esito -------------------------------------------------------------------------------------
await browser.close();
// Il 401/403 dell'accesso iniziale non è un difetto. Il resto sì.
const veri = errori.filter((e) => !/\/api\/auth\//.test(e));
for (const e of veri) problema(e);
console.log(
  `\n${problemi.length === 0 ? "✓ nessun problema" : `✗ ${problemi.length} problemi`} · scatti in ${S}`,
);
process.exit(problemi.length === 0 ? 0 : 1);
