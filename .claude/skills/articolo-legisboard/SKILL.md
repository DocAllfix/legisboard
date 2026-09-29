---
name: articolo-legisboard
description: Scrive una guida del blog di legisboard.eu (GDPR, D.Lgs 231/2001, D.Lgs 81/2008) dal piano editoriale, la verifica con il cancello della build e apre una PR che si pubblica dopo 48 ore. Usala quando si deve scrivere, aggiornare o pubblicare un articolo del blog di Legisboard, o quando gira la routine della redazione.
---

# Redazione del blog Legisboard

Il blog sta in `apps/landing/content/blog/*.mdx`. Il processo completo, le routine e il modo di
bloccare un articolo sono in `docs/08-contenuti-e-seo.md`. Questa skill è la procedura da seguire,
passo per passo, senza saltarne uno.

## 0. Cosa stai scrivendo, e per chi

Lettori: DPO, consulenti privacy, avvocati, membri di OdV, RSPP. Sono professionisti: sanno già
cos'è il GDPR. Cercano una risposta precisa a una domanda precisa, con l'articolo di legge.

Firma: **Alessandro Di Lonardo**. Ogni articolo esce a suo nome dopo 48 ore di revisione. Scrivi
come un professionista che firma, non come un'agenzia di contenuti.

Voce (da `PRODUCT.md`): **informare, non rassicurare**. Frasi dichiarative, precise, verificabili.
Registro «voi» (come la landing), mai «tu».

## 1. Scegli la voce

1. Leggi `apps/landing/content/piano-editoriale.json`.
2. Prendi la voce con `stato: "da-scrivere"` e `priorita` più bassa.
3. Controlla che non esista già `content/blog/<slug>.mdx` e che nessuna PR aperta con etichetta
   `articolo` abbia lo stesso slug (`gh pr list --label articolo`).
4. Se c'è una PR `articolo` aperta con commenti di modifica non ancora risolti, **quella ha la
   precedenza**: aggiornala invece di scrivere un articolo nuovo.

## 2. Studia prima di scrivere

1. **Fonti primarie, sempre.** Per ogni obbligo che citi, verifica il testo vigente:
   - Normattiva (normattiva.it) per D.Lgs 81/2008, D.Lgs 231/2001, D.Lgs 24/2023, D.Lgs 196/2003;
   - EUR-Lex per il Reg. UE 2016/679;
   - garanteprivacy.it (provvedimenti, linee guida, FAQ), ispettorato.gov.it, gli accordi
     Stato-Regioni per la formazione, EDPB per le linee guida europee.
   Annota ogni fonte usata: vanno nella descrizione della PR.
2. **Leggi i primi risultati di Google** per la parola chiave (strumento di ricerca web): capisci che
   taglio hanno, cosa manca, cosa sbagliano. L'articolo deve essere più preciso e più utile del
   migliore di quelli, non una loro sintesi.
3. **Leggi i codici del catalogo** della voce (`codici_catalogo`) con `templatePerCodice` in
   `packages/engine/src/index.ts`: titolo, riferimento, ruolo, periodicità.

### La trappola da non cadere mai
La **periodicità del catalogo è una cadenza di controllo del prodotto, non sempre una scadenza di
legge.** Esempio: il DVR è in catalogo «ogni 3 anni», ma l'art. 29 c.3 D.Lgs 81/08 non fissa una
scadenza (va rielaborato entro 30 giorni da modifiche significative, infortuni significativi, o
quando la sorveglianza sanitaria lo richiede). Il catalogo cita ancora l'Accordo Stato-Regioni del
21/12/2011 per la formazione, superato dall'Accordo del 17/04/2025. **La legge vince sempre sul
catalogo**: se trovi una differenza, scrivi ciò che dice la legge e segnala la differenza nella PR.

## 3. Scrivi

File `apps/landing/content/blog/<slug>.mdx`:

```mdx
---
titolo: "…"                # 10-90 caratteri, contiene la parola chiave o una sua forma naturale
descrizione: "…"           # 50-155 caratteri: la risposta in una frase, non un invito a leggere
pubblicazione: AAAA-MM-GG  # la data di OGGI: la routine di pubblicazione la riallinea al merge
autore: alessandro-di-lonardo
decreto: gdpr | d231 | d81
parola_chiave: "…"         # quella del piano, identica
codici_catalogo: ["…"]
---
```

Struttura:
- **Primi due paragrafi = la risposta.** Chi legge solo quelli deve avere ciò che cercava, con
  l'articolo di legge. Niente preamboli («In questo articolo vedremo…»).
- **Almeno 3 sezioni `##`**, formulate come le domande che un professionista si fa. Le ancore e
  l'indice laterale si generano da soli.
- **1.200-2.000 parole.** Il cancello accetta 900-2.800, ma sotto i 1.200 raramente si è esaurienti.
- **Almeno un esempio concreto** con dati veri: `<Adempimento dominio="d81" codice="S01" />`.
- Una tabella quando confronta casi (figure, periodicità, soglie): Markdown GFM.
- Chiudi con cosa fare in pratica, non con un riassunto.

Componenti ammessi (nient'altro, nessun `import`):
- `<Adempimento dominio="…" codice="…" />`: scheda dal catalogo. Codice inesistente = build rotta.
- `<Norma rif="Art. 29 c.3 D.Lgs 81/08">testo breve</Norma>`: citazione o parafrasi di un articolo.
- `<Nota>…</Nota>`: un avvertimento pratico.
- `<InvitoDemo />`: **non** usarlo, lo aggiunge già la pagina in fondo.

Collegamenti (obbligatori):
- **al pilastro del decreto**: `/adempimenti-gdpr`, `/adempimenti-231`,
  `/adempimenti-sicurezza-sul-lavoro` (il cancello lo pretende);
- ad almeno un'altra guida già pubblicata, se ne esiste una pertinente;
- alle fonti primarie esterne (Normattiva, Garante, EUR-Lex), con URL precisi.

Divieti (alcuni li controlla il cancello, tutti valgono):
- la lineetta lunga «—»; usa due punti, virgole, parentesi;
- frasi da contenuto in serie: «in conclusione», «nel panorama attuale», «in un mondo in cui»,
  «è fondamentale sottolineare», «non solo… ma anche»;
- promesse: «sarete a norma», «garantisce la conformità». Un articolo informa, non certifica;
- numeri, sanzioni, termini senza l'articolo che li fissa;
- consigli su casi specifici che richiedono un parere professionale: rimanda a un professionista;
- citare prodotti concorrenti per nome.

## 4. Verifica

1. `pnpm install` (se serve) e `pnpm --filter landing build`. Deve passare: il cancello gira nella
   build e ti dice esattamente cosa correggere.
2. Rileggi l'articolo come Alessandro: ogni affermazione normativa ha la sua fonte? C'è una frase
   che firmeresti senza verificarla? Toglila o verificala.
3. Aggiorna la voce in `piano-editoriale.json`: `"stato": "in-revisione"`.

## 5. Apri la PR

- Ramo: `claude/articolo-<slug>`.
- Commit: `Guida: <titolo>`.
- `gh pr create --label articolo --title "Guida: <titolo>" --body-file …` con, nella descrizione:
  1. una riga in cima: **«Esce da sola fra 48 ore. Per fermarla: chiudete la PR, o aggiungete
     l'etichetta `blocca`, o scrivete "blocca" in un commento. Per chiedere modifiche, scrivetele
     in un commento.»**
  2. parola chiave primaria e secondarie;
  3. **fonti consultate**, con URL;
  4. differenze trovate fra catalogo e legge, se ce ne sono;
  5. il testo integrale dell'articolo, per leggerlo dal telefono.
- Se l'etichetta `articolo` o `blocca` non esistono: `gh label create articolo` / `gh label create blocca`.

## 6. La pubblicazione (routine quotidiana)

Per ogni PR aperta con etichetta `articolo`:
- **salta** se ha l'etichetta `blocca`, o un commento che contiene «blocca»;
- **aggiorna** se ha commenti di modifica più recenti dell'ultimo commit: applica le modifiche,
  rilancia la build, spingi sul ramo, rispondi al commento con cosa hai cambiato; il conto delle
  48 ore riparte dall'ultimo commit;
- **unisci** se sono passate almeno 48 ore dall'ultimo commit, la build di Vercel è verde
  (`gh pr checks`) e non c'è niente dei due casi sopra. Prima di unire: fissa `pubblicazione` alla
  data di oggi e la voce del piano a `"pubblicato"`, poi `gh pr merge --squash --delete-branch`.

Mai unire una PR con controlli rossi o in corso. Mai spingere direttamente su `main`.
