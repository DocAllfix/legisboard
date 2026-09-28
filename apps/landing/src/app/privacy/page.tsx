import type { Metadata } from "next";
import { PaginaLegale } from "@/components/pagina-legale";
import { CONTATTO_EMAIL, EMAIL_PRIVACY, INGRESSO_DEMO, REVISIONE_INFORMATIVE, SITO, TITOLARE } from "@/lib/sito";

// L'INFORMATIVA (art. 13 GDPR) della landing E della demo pubblica, scritta da noi.
//
// Niente generatori a pagamento: il sito è una vetrina senza pagamenti, senza registrazione e
// senza categorie particolari di dati, e un testo generico parlerebbe di trattamenti che qui
// non esistono. Ogni riga descrive una cosa che il codice fa davvero; se il codice cambia, la
// riga cambia nello stesso commit.
//
// DA FAR RILEGGERE al titolare prima di considerarla definitiva.

export const metadata: Metadata = {
  title: "Informativa privacy · Legisboard",
  description: "Chi tratta i vostri dati su legisboard.eu e nella demo pubblica, perché, per quanto tempo e con quali fornitori.",
  alternates: { canonical: "/privacy" },
};

export default function Privacy() {
  const demo = new URL(INGRESSO_DEMO).host;
  return (
    <PaginaLegale
      titolo="Informativa privacy"
      sotto={`Cosa succede ai vostri dati quando visitate ${new URL(SITO.url).host}, provate la demo o ci scrivete. In breve: raccogliamo solo ciò che serve a rispondervi, non facciamo marketing e non vi profiliamo.`}
      revisione={REVISIONE_INFORMATIVE}
    >
      <h2 id="titolare">Titolare del trattamento</h2>
      {TITOLARE ? (
        <p>
          {TITOLARE.nome}
          {TITOLARE.indirizzo ? `, ${TITOLARE.indirizzo}` : TITOLARE.citta ? `, ${TITOLARE.citta}` : ""}
          {TITOLARE.partitaIva ? `, P.IVA ${TITOLARE.partitaIva}` : ""}. Per ogni questione sui vostri dati scrivete a{" "}
          <a href={`mailto:${EMAIL_PRIVACY}`}>{EMAIL_PRIVACY}</a>.
        </p>
      ) : (
        <p>
          In corso di indicazione. Finché il titolare non è indicato qui, il modulo di contatto non è attivo e il sito non
          raccoglie dati tramite moduli.
        </p>
      )}

      <h2 id="richieste">Quando ci scrivete</h2>
      <p>
        Con il modulo di questa pagina, con quello dentro la demo o per email
        {CONTATTO_EMAIL ? (
          <>
            {" "}
            a <a href={`mailto:${CONTATTO_EMAIL}`}>{CONTATTO_EMAIL}</a>
          </>
        ) : null}
        , ci date nome e cognome, email, studio od organizzazione, ruolo, il motivo della richiesta e, se volete, un
        messaggio.
      </p>
      <ul>
        <li>
          <strong>Perché:</strong> per rispondervi, organizzare una presentazione o un appuntamento, preparare un&apos;offerta.
        </li>
        <li>
          <strong>Base giuridica:</strong> misure precontrattuali adottate su vostra richiesta (art. 6.1.b GDPR). Non serve
          un consenso, e infatti non ve lo chiediamo.
        </li>
        <li>
          <strong>Per quanto:</strong> 12 mesi dall&apos;ultimo scambio. Se ne nasce un contratto, i dati passano alla
          gestione del contratto e ai tempi che la legge fissa per quella.
        </li>
        <li>
          <strong>Cosa non facciamo:</strong> newsletter, marketing, cessione a terzi, profilazione.
        </li>
      </ul>
      <p>Il messaggio arriva per email alla casella dei contatti: non viene salvato in un database del sito.</p>

      <h2 id="navigazione">Quando visitate il sito</h2>
      <p>
        Come ogni server, quello che ospita il sito registra per ragioni di sicurezza e di funzionamento alcuni dati
        tecnici di ogni richiesta: indirizzo IP, data e ora, pagina chiesta, browser. Base giuridica: il legittimo
        interesse a tenere il servizio sicuro e funzionante (art. 6.1.f GDPR). Sono conservati per il breve periodo
        stabilito dal fornitore di hosting e non li usiamo per identificarvi.
      </p>
      <p>
        Non usiamo strumenti di analisi del traffico, pixel pubblicitari, mappe o video incorporati, né caratteri
        tipografici scaricati da servizi esterni. Sui cookie c&apos;è una <a href="/cookie">pagina dedicata</a>.
      </p>

      <h2 id="demo">Quando provate la demo</h2>
      <p>
        La demo su <a href={INGRESSO_DEMO}>{demo}</a> si apre senza registrazione: non vi chiediamo né nome né email. Per
        tenervi dentro, la demo apre una sessione e ne conserva l&apos;indirizzo IP e il tipo di browser, che usa anche per
        limitare gli abusi, come gli accessi automatici in massa.
      </p>
      <ul>
        <li>
          <strong>Base giuridica:</strong> legittimo interesse a far funzionare la demo e a proteggerla (art. 6.1.f GDPR).
        </li>
        <li>
          <strong>Per quanto:</strong> la sessione dura al massimo 8 ore; il ripristino notturno cancella quelle scadute.
        </li>
        <li>
          <strong>Quello che cambiate:</strong> i dati della demo sono di un&apos;azienda d&apos;esempio inventata e tornano
          com&apos;erano ogni notte. Non inserite dati veri: i campi di testo libero sono comunque bloccati.
        </li>
      </ul>

      <h2 id="fornitori">Fornitori che trattano dati per nostro conto</h2>
      <table>
        <thead>
          <tr>
            <th>Fornitore</th>
            <th>Cosa fa</th>
            <th>Dove</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>Vercel Inc.</td>
            <td>Ospita il sito e la demo</td>
            <td>Funzioni a Francoforte (UE)</td>
          </tr>
          <tr>
            <td>Neon (Databricks Inc.)</td>
            <td>Database della demo</td>
            <td>Francoforte (UE)</td>
          </tr>
          <tr>
            <td>Hostinger</td>
            <td>Posta elettronica: riceve le richieste</td>
            <td>Unione europea</td>
          </tr>
        </tbody>
      </table>
      <p>
        Vercel e Neon sono società statunitensi. Anche se i dati stanno nell&apos;Unione europea, non si può escludere un
        accesso dagli Stati Uniti, per esempio per assistenza. Un eventuale trasferimento si basa sul Data Privacy
        Framework UE-USA e, in aggiunta, sulle clausole contrattuali tipo della Commissione europea.
      </p>

      <h2 id="diritti">I vostri diritti</h2>
      <p>
        Potete chiedere di accedere ai vostri dati, correggerli, cancellarli, limitarne il trattamento, riceverli in un
        formato leggibile, e opporvi ai trattamenti basati sul legittimo interesse (artt. 15-22 GDPR). Scrivete a{" "}
        <a href={`mailto:${EMAIL_PRIVACY}`}>{EMAIL_PRIVACY}</a>: rispondiamo entro un mese. Potete anche proporre
        reclamo al <a href="https://www.garanteprivacy.it">Garante per la protezione dei dati personali</a>.
      </p>
      <p>
        Nessuna decisione che vi riguarda è presa in modo automatizzato. Non siete obbligati a darci dati: senza nome ed
        email, però, non possiamo rispondervi.
      </p>
    </PaginaLegale>
  );
}
