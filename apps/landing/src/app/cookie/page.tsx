import type { Metadata } from "next";
import { PaginaLegale } from "@/components/pagina-legale";
import { INGRESSO_DEMO, REVISIONE_INFORMATIVE } from "@/lib/sito";

// LA COOKIE POLICY. I nomi e le durate sono letti dalla risposta vera di `/demo` in
// produzione, non scritti a memoria: `__Secure-better-auth.session_token` Max-Age 28800,
// `__Secure-better-auth.session_data` Max-Age 300, entrambi HttpOnly, Secure, SameSite=Lax.
// Se `lib/auth` cambia `session.expiresIn` o `cookieCache.maxAge`, questa tabella va rifatta.
//
// Nessun banner: solo strumenti tecnici, nessuna terza parte, nessuna analisi. Linee guida del
// Garante sui cookie, 10 giugno 2021.

export const metadata: Metadata = {
  title: "Cookie · Legisboard",
  description: "Quali cookie usano legisboard.eu e la demo pubblica: nessuno sul sito, solo cookie tecnici di sessione nella demo.",
  alternates: { canonical: "/cookie" },
  // Senza, l'anteprima condivisa ereditava titolo e indirizzo della home dal layout.
  openGraph: {
    type: "website",
    locale: "it_IT",
    siteName: "Legisboard",
    title: "Cookie · Legisboard",
    description: "Quali cookie usano legisboard.eu e la demo pubblica: nessuno sul sito, solo cookie tecnici di sessione nella demo.",
    url: "/cookie",
  },
};

export default function Cookie() {
  const demo = new URL(INGRESSO_DEMO).host;
  return (
    <PaginaLegale
      titolo="Cookie"
      sotto="Questo sito non usa cookie. La demo ne usa due, tecnici, per tenervi dentro dopo il clic. Nessun cookie di analisi, di profilazione o di terze parti: per questo non vi chiediamo alcun consenso."
      revisione={REVISIONE_INFORMATIVE}
    >
      <h2 id="sito">Su questo sito</h2>
      <p>
        Nessun cookie e nessun dato salvato nel vostro browser. Nessun contatore di visite, nessun pixel, nessun
        contenuto incorporato da altri siti.
      </p>

      <h2 id="demo">Nella demo</h2>
      <p>
        La demo su <a href={INGRESSO_DEMO}>{demo}</a> è un&apos;applicazione con accesso, e senza un cookie di sessione non
        saprebbe che siete appena entrati. Sono cookie tecnici: esenti dal consenso (art. 122 del Codice privacy).
      </p>
      <table>
        <thead>
          <tr>
            <th>Nome</th>
            <th>A cosa serve</th>
            <th>Durata</th>
          </tr>
        </thead>
        <tbody>
          <tr>
            <td>
              <code>__Secure-better-auth.session_token</code>
            </td>
            <td>Vi tiene dentro la demo dopo il clic d&apos;ingresso</td>
            <td>8 ore</td>
          </tr>
          <tr>
            <td>
              <code>__Secure-better-auth.session_data</code>
            </td>
            <td>Copia temporanea della sessione, per non interrogare il database a ogni pagina</td>
            <td>5 minuti</td>
          </tr>
        </tbody>
      </table>
      <p>
        Entrambi sono di prima parte, inaccessibili agli script della pagina (HttpOnly) e viaggiano solo su connessione
        cifrata.
      </p>
      <p>La demo salva anche due cose nel vostro browser, senza mandarle a nessuno:</p>
      <ul>
        <li>
          <code>tema</code>, nella memoria locale: il tema chiaro o scuro, se lo cambiate.
        </li>
        <li>
          <code>invito-contatto</code>, nella memoria della scheda: che avete già chiuso l&apos;invito a contattarci, così
          non riappare. Sparisce quando chiudete la scheda.
        </li>
      </ul>

      <h2 id="gestione">Come toglierli</h2>
      <p>
        Uscendo dalla demo la sessione si chiude. Potete comunque cancellare cookie e dati dei siti dalle impostazioni del
        browser: la demo vi chiederà solo di rientrare con un clic.
      </p>
    </PaginaLegale>
  );
}
