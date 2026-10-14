# 08 · Contenuti e SEO: pilastri, guide e redazione automatica

_2026-09-29. Piano approvato dall'utente lo stesso giorno._

## Perché

legisboard.eu era tecnicamente pronta per Google ma aveva una pagina sola: si trovava cercando
«Legisboard», non per le domande che fa chi non ci conosce («dvr quando va aggiornato», «relazione
annuale odv»). Il traffico organico lo portano pagine che rispondono a quelle domande.

## Architettura: pilastri e satelliti

| Pagina         | URL                                 | Cosa è                                                |
| -------------- | ----------------------------------- | ----------------------------------------------------- |
| Pilastro GDPR  | `/adempimenti-gdpr`                 | testo scritto a mano + catalogo intero (42) + domande |
| Pilastro 231   | `/adempimenti-231`                  | idem (65)                                             |
| Pilastro 81/08 | `/adempimenti-sicurezza-sul-lavoro` | idem (64)                                             |
| Indice guide   | `/blog`                             | tutte le guide, dalla più recente                     |
| Guida          | `/blog/<slug>`                      | un articolo; punta sempre al suo pilastro             |
| Autore         | `/autore/alessandro-di-lonardo`     | chi firma; fuori dagli indici finché è vuota          |
| Feed           | `/blog/feed.xml`                    | RSS                                                   |

Scartato: una pagina per ciascuno dei 171 adempimenti. Pagine quasi uguali generate in massa sono
ciò che Google sanziona come _scaled content abuse_. Pagine per figura professionale e glossario:
solo quando Search Console mostra domanda misurata.

Codice: `apps/landing/src/lib/{blog,cancello,pilastri,autori,mdx}.ts(x)`,
`src/components/{mdx,pagina-pilastro}.tsx`, `src/app/{blog,autore,adempimenti-*}`.

## Scadenza di legge e cadenza di controllo

La periodicità del catalogo è la cadenza con cui il registro ripropone un adempimento, **non sempre
un termine di legge**. Pilastri, schede `<Adempimento>` e skill lo dicono esplicitamente. Due
differenze già note fra catalogo e norma, da portare al committente:

- DVR «ogni 3 anni»: l'art. 29 c.3 D.Lgs 81/08 non fissa una scadenza;
- formazione: il catalogo cita l'Accordo Stato-Regioni del 21/12/2011, superato dall'Accordo del
  17/04/2025.

## Un articolo, dal file alla pagina

- File MDX in `apps/landing/content/blog/<slug>.mdx`, intestazione validata da zod.
- Data futura o `bozza: true` = invisibile ovunque (pagina 404, niente sitemap, feed, indice).
  Le pagine si rigenerano ogni notte: un articolo programmato esce da solo il giorno della data.
- Componenti MDX ammessi: `<Adempimento>`, `<Norma>`, `<Nota>`, `<InvitoDemo>`. Dati dal catalogo.
- **Il cancello editoriale gira dentro la build** (`lib/cancello.ts`): codici inesistenti, parola
  chiave duplicata, lunghezza fuori da 900-2.800 parole, frasi vietate, collegamento al pilastro
  mancante, collegamenti interni rotti, meno di tre sezioni H2 → la build fallisce.

## La redazione automatica

Due routine cloud di Claude Code sul repository `DocAllfix/legisboard`, che seguono la skill di
progetto `.claude/skills/articolo-legisboard/SKILL.md`:

| Routine       | Quando                   | Cosa fa                                                                                                                                                                        |
| ------------- | ------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Scrittura     | lunedì e giovedì mattina | prende la prima voce `da-scrivere` di `content/piano-editoriale.json`, studia le fonti, scrive, esegue la build, apre una PR `claude/articolo-<slug>` con etichetta `articolo` |
| Pubblicazione | ogni mattina             | unisce le PR `articolo` ferme da 48 ore con build verde e senza blocco; applica le modifiche chieste nei commenti                                                              |

### Come si blocca o si corregge un articolo

Dalla PR su GitHub, anche da telefono:

- **fermarlo per sempre**: chiudere la PR;
- **fermarlo per ora**: etichetta `blocca`, o un commento che contiene «blocca»;
- **correggerlo**: scrivere cosa cambiare in un commento. La routine lo applica, e le 48 ore
  ripartono dall'ultima modifica.

L'articolo esce firmato da Alessandro Di Lonardo: le 48 ore sono la sua revisione.

## Search Console

Proprietà _Dominio_ `legisboard.eu`, verificata con un record TXT sulla zona Hostinger (aggiunto
come record singolo, mai `overwrite`). Sitemap: `https://legisboard.eu/sitemap.xml`. Bing
Webmaster Tools importa da Search Console.

Dopo 4-6 settimane di dati: una routine mensile legge query e posizioni tramite un account di
servizio Google, e propone con una PR il piano del mese successivo (Fase 5 del piano).

## Resistenza ai blocchi _(2026-10-11, dall'esperienza di FinBeacon)_

Le regole stanno nella skill; le routine la rileggono a ogni giro.

- **Controlli che contano**: per pubblicare servono verdi solo `verifica` (CI) e
  `Vercel – legisboard-landing`. L'anteprima della demo non blocca una guida.
- **Conflitti**: una PR in conflitto su `piano-editoriale.json` viene riallineata su `main` senza
  far ripartire le 48 ore.
- **Voci sospese**: una voce impossibile diventa `sospesa` con `motivo` e `tentativi`, e si passa
  alla successiva nello stesso giro.
- **Piano che si esaurisce**: sotto le 6 voci da scrivere la routine apre una PR `piano` con 6
  voci nuove, da unire a mano.
- **Sentinella**: se da 8 giorni non nasce una PR `articolo`, o una è aperta da più di 5 giorni,
  la routine apre una issue `redazione-ferma` (email al proprietario) e la chiude quando torna a
  posto. Limite: la sentinella gira dentro la routine, quindi non avvisa se è la routine stessa a
  non partire (account senza quota, ambiente cambiato).

## Keyword research _(2026-10-14)_

Gli export dello strumento di keyword research (CSV con `Termine di ricerca`, `Piattaforma`,
`Tipo di modificatore`, `Keyword`, `Volume`, `CPC (US$)`) vanno in `keywordblog/`, che è in
`.gitignore`: sono dati di uno strumento esterno e il repository è pubblico.

`node apps/landing/scripts/keyword-research.mjs` li normalizza (volumi «1.3K» → 1300, Google
prima di Bing e YouTube, solo Italia), li filtra per pertinenza e li raggruppa nei cluster del
piano, scrivendo `apps/landing/content/keyword-research.json`: l'unica cosa che si committa, e
che la routine di scrittura consulta per le varianti di ogni cluster.

**Il filtro è il punto critico.** Sul primo giro (file «231» e «odv» del 2026-10-13) tre quarti del
volume erano rumore: omonimi del numero 231, le **altre leggi 231** (D.Lgs 231/2002 sugli
interessi moratori, D.Lgs 231/2007 antiriciclaggio) e «odv» come Organizzazione di Volontariato.
Le regole stanno nello script, commentate; un file nuovo con rumore nuovo si gestisce lì.

Dal primo giro: 334 keyword valide su 7.000 righe, 59.820 di volume mensile, 17 cluster. Il piano
è stato riscritto con un calendario a mesi e settimane (campi `id`, `mese`, `settimana`) e un
brief per voce: `tipologia` (pillar o spoke BOFU, MOFU, TOFU), `secondarie`, `domande`,
`collegamenti`. La voce `compiti-odv-231` è confluita nell'hub `organismo-di-vigilanza-231`
(stato `fusa`). GDPR e 81/08 restano con le voci di settembre finché non arrivano i loro export.

Le guide possono avere `domande` nell'intestazione: un blocco «Domande frequenti» in fondo e il
nodo `FAQPage` nei dati strutturati.
