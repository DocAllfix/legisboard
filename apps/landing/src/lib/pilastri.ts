import type { Dominio } from "@legisboard/engine";

// LE TRE PAGINE PILASTRO, una per decreto _(2026-09-29, docs/08)_.
//
// La tabella la genera il catalogo del motore; il testo qui sotto è scritto a mano, e dice una
// cosa che nessun elenco generico dice: la differenza fra una SCADENZA DI LEGGE e una CADENZA
// DI CONTROLLO. Il catalogo propone cadenze operative (il DVR «ogni 3 anni», per esempio), ma
// l'art. 29 del D.Lgs 81/08 non fissa una scadenza: chiede di rielaborarlo quando cambia
// qualcosa. Scrivere il contrario in una pagina pubblica sarebbe un errore che un RSPP nota
// alla seconda riga.
//
// Ogni affermazione normativa porta il suo articolo. Da far rileggere al committente.

export type Pilastro = {
  readonly dominio: Dominio;
  readonly url: string;
  readonly titolo: string;
  readonly titoloBreve: string;
  readonly descrizione: string;
  readonly occhiello: string;
  readonly introduzione: readonly string[];
  readonly domande: readonly { readonly domanda: string; readonly risposta: string }[];
};

export const PILASTRI: Readonly<Record<Dominio, Pilastro>> = {
  gdpr: {
    dominio: "gdpr",
    url: "/adempimenti-gdpr",
    titolo: "Adempimenti GDPR: l'elenco completo, con cadenze e riferimenti",
    titoloBreve: "Adempimenti GDPR",
    descrizione:
      "Gli adempimenti del Regolamento UE 2016/679 per titolare, responsabile e DPO: articolo per articolo, con la cadenza di controllo di ciascuno.",
    occhiello: "Reg. UE 2016/679",
    introduzione: [
      "Il GDPR non contiene uno scadenzario. Chiede al titolare di essere in grado di dimostrare, in ogni momento, di trattare i dati in modo conforme: è il principio di responsabilizzazione degli artt. 5.2 e 24. Nella pratica questo diventa un insieme di documenti e di attività che vanno tenuti vivi, perché un registro dei trattamenti scritto due anni fa e mai riletto non dimostra niente.",
      "Gli adempimenti si dividono in tre famiglie. Alcuni sono continui, come il registro dei trattamenti dell'art. 30 o il registro delle violazioni dell'art. 33.5: vanno aggiornati ogni volta che cambia qualcosa. Altri scattano al verificarsi di un evento: una valutazione d'impatto (art. 35) prima di un trattamento ad alto rischio, la notifica di una violazione al Garante entro 72 ore (art. 33), la nomina di un responsabile esterno con un contratto conforme all'art. 28. Altri ancora non hanno una scadenza scritta nel Regolamento, ma una verifica periodica è l'unico modo ragionevole di tenerli in ordine: le informative, le misure di sicurezza dell'art. 32, la formazione di chi tratta i dati.",
      "Il DPO, dove è nominato (art. 37), ha compiti propri che l'art. 39 descrive: sorvegliare l'osservanza, fornire pareri sulle valutazioni d'impatto, cooperare con il Garante. Anche questi sono attività da pianificare e documentare, e il catalogo li tiene separati da quelli del titolare, perché a rispondere è un'altra persona.",
      "L'elenco qui sotto è il catalogo che Legisboard usa per ogni azienda cliente. Per ogni adempimento indica il riferimento normativo, chi ne risponde e la cadenza con cui il registro lo ripropone. Quella cadenza è una scelta operativa, non sempre un termine di legge: dove il Regolamento fissa un termine, come le 72 ore per la notifica di una violazione, lo dice l'articolo citato.",
    ],
    domande: [
      {
        domanda: "Il registro dei trattamenti è obbligatorio per tutti?",
        risposta:
          "L'art. 30.5 esonera le organizzazioni con meno di 250 dipendenti, ma solo se il trattamento è occasionale, non presenta rischi per le persone e non riguarda categorie particolari di dati o dati relativi a condanne penali. Poiché quasi ogni azienda tratta con continuità i dati dei dipendenti, l'esonero in pratica si applica di rado.",
      },
      {
        domanda: "Quanto tempo c'è per notificare una violazione dei dati?",
        risposta:
          "72 ore da quando il titolare ne è venuto a conoscenza, salvo che la violazione sia improbabile che presenti un rischio per le persone (art. 33.1). Se la notifica arriva dopo, va motivato il ritardo. Il responsabile deve informare il titolare senza ingiustificato ritardo (art. 33.2).",
      },
      {
        domanda: "Chi è sanzionato se gli adempimenti non sono in ordine?",
        risposta:
          "Il titolare, e nei casi previsti il responsabile. L'art. 83 prevede sanzioni fino a 10 o 20 milioni di euro, o fino al 2% o al 4% del fatturato mondiale annuo, secondo la violazione.",
      },
    ],
  },
  d231: {
    dominio: "d231",
    url: "/adempimenti-231",
    titolo: "Adempimenti del modello 231: OdV, flussi, formazione e verifiche",
    titoloBreve: "Adempimenti 231",
    descrizione:
      "Cosa va fatto, e con che cadenza, per tenere efficace un modello organizzativo ai sensi del D.Lgs 231/2001: OdV, flussi informativi, whistleblowing, audit.",
    occhiello: "D.Lgs 231/2001",
    introduzione: [
      "Il D.Lgs 231/2001 rende l'ente responsabile per alcuni reati commessi nel suo interesse o a suo vantaggio da chi lo amministra o ci lavora. L'ente può evitare la responsabilità se dimostra di aver adottato ed efficacemente attuato, prima del fatto, un modello di organizzazione e gestione idoneo a prevenire quei reati, e di aver affidato la vigilanza a un organismo dotato di autonomi poteri (art. 6).",
      "La parola che decide è «efficacemente». Un modello approvato dal consiglio e poi lasciato in un cassetto non esonera nessuno: il giudice guarda se l'organismo di vigilanza si è riunito, se ha ricevuto i flussi informativi, se ha verificato i protocolli, se il modello è stato aggiornato quando sono cambiati l'organizzazione o l'elenco dei reati presupposto. Sono tutte attività con una data, e la loro traccia è la prova.",
      "Il modello non è obbligatorio per legge in generale. Lo diventa di fatto in alcuni casi: diverse regioni lo richiedono per l'accreditamento, alcuni bandi e alcuni mercati lo chiedono, e dove esiste, dal D.Lgs 24/2023 deve prevedere anche i canali di segnalazione interna (whistleblowing).",
      "L'elenco qui sotto è il catalogo 231 di Legisboard: le attività dell'OdV, i flussi informativi verso l'organismo, la formazione, gli audit e i punti in cui il modello incontra la sicurezza sul lavoro e la privacy. La cadenza indicata è quella con cui il registro ripropone ogni attività: il decreto non fissa quasi mai termini, li fissano il modello e il regolamento dell'OdV.",
    ],
    domande: [
      {
        domanda: "Il modello 231 è obbligatorio?",
        risposta:
          "Il D.Lgs 231/2001 non impone di adottarlo: lo rende la condizione per non rispondere dei reati presupposto (artt. 6 e 7). Alcune normative regionali, bandi e requisiti di mercato lo richiedono esplicitamente.",
      },
      {
        domanda: "Ogni quanto si riunisce l'OdV?",
        risposta:
          "Il decreto non lo stabilisce: lo fissano il modello e il regolamento dell'organismo. Una cadenza almeno trimestrale è la prassi più diffusa, perché permette di esaminare i flussi informativi e documentare la vigilanza durante l'anno.",
      },
      {
        domanda: "Cosa rischia l'ente senza un modello efficace?",
        risposta:
          "Sanzioni pecuniarie calcolate per quote, e nei casi più gravi sanzioni interdittive come il divieto di contrattare con la pubblica amministrazione o la sospensione di autorizzazioni (art. 9).",
      },
    ],
  },
  d81: {
    dominio: "d81",
    url: "/adempimenti-sicurezza-sul-lavoro",
    titolo: "Adempimenti sicurezza sul lavoro: lo scadenziario del D.Lgs 81/2008",
    titoloBreve: "Adempimenti sicurezza sul lavoro",
    descrizione:
      "DVR, nomine, formazione, sorveglianza sanitaria ed emergenze: gli adempimenti del D.Lgs 81/2008 con riferimento normativo e cadenza di controllo.",
    occhiello: "D.Lgs 81/2008",
    introduzione: [
      "Il D.Lgs 81/2008 mette in capo al datore di lavoro una serie di obblighi, alcuni dei quali non può delegare: la valutazione di tutti i rischi con la redazione del documento che la contiene, e la designazione del responsabile del servizio di prevenzione e protezione (art. 17). Intorno a questi due obblighi si costruisce tutto il resto: le nomine, la formazione, la sorveglianza sanitaria, la gestione delle emergenze.",
      "Qui la distinzione fra scadenza di legge e cadenza di controllo conta più che altrove. Il documento di valutazione dei rischi non ha una data di scadenza: l'art. 29, comma 3, chiede di rielaborarlo in occasione di modifiche significative del processo produttivo o dell'organizzazione, di infortuni significativi, o quando la sorveglianza sanitaria lo rende necessario, entro trenta giorni. Rileggerlo periodicamente è una buona pratica, non un termine. Altri adempimenti hanno invece periodicità scritte: gli aggiornamenti della formazione sono fissati dagli accordi Stato-Regioni, la periodicità delle visite mediche la stabilisce il medico competente nel protocollo sanitario (art. 41), la riunione periodica è almeno annuale nelle aziende con più di 15 lavoratori (art. 35).",
      "La formazione è l'area in cui le regole cambiano più spesso: l'Accordo Stato-Regioni del 17 aprile 2025 ha riordinato durata, contenuti e aggiornamenti dei corsi. Prima di fissare una scadenza di formazione conviene verificare quale accordo si applica al corso in questione.",
      "L'elenco qui sotto è il catalogo 81/08 di Legisboard. Per ogni adempimento riporta il riferimento, chi ne risponde e la cadenza con cui il registro lo ripropone: dove quella cadenza è una convenzione operativa e non un termine di legge, vale quanto scritto sopra.",
    ],
    domande: [
      {
        domanda: "Ogni quanto va aggiornato il DVR?",
        risposta:
          "La legge non fissa una periodicità. L'art. 29, comma 3, del D.Lgs 81/2008 impone di rielaborarlo, entro trenta giorni, quando cambiano in modo significativo processo produttivo od organizzazione, dopo infortuni significativi, o quando lo richiedono i risultati della sorveglianza sanitaria.",
      },
      {
        domanda: "Chi decide ogni quanto fare le visite mediche?",
        risposta:
          "Il medico competente, nel protocollo sanitario. L'art. 41 indica di norma una periodicità annuale, che il medico può modificare in funzione della valutazione dei rischi; norme specifiche possono prevedere periodicità diverse.",
      },
      {
        domanda: "La riunione periodica è obbligatoria per tutte le aziende?",
        risposta:
          "Nelle aziende e unità produttive con più di 15 lavoratori il datore di lavoro indice la riunione almeno una volta all'anno (art. 35). Nelle aziende più piccole può essere chiesta dal rappresentante dei lavoratori per la sicurezza.",
      },
    ],
  },
};
