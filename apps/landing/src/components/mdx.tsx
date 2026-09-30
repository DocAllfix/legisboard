import { ETICHETTE_DOMINIO, descriviPeriodicita, templatePerCodice, type Dominio } from "@legisboard/engine";
import { Codice, PastigliaDominio } from "@legisboard/ui/stato";
import { ArrowRight } from "lucide-react";
import { FRECCIA_CTA, PULSANTE_PIENO_SU_OLIVA } from "./pulsanti";
import { INGRESSO_DEMO } from "@/lib/sito";

// I COMPONENTI CHE UN ARTICOLO PUÒ USARE. Un elenco chiuso: l'MDX non può importare altro.
//
// `<Adempimento>` è il vantaggio del blog su qualunque articolo generico: la scheda viene dal
// catalogo del motore, non dal testo di chi scrive. Un codice che non esiste FA FALLIRE LA
// BUILD: un articolo che cita un adempimento inventato non deve uscire.

export function Adempimento({ dominio, codice }: { dominio: Dominio; codice: string }) {
  const t = templatePerCodice(dominio, codice);
  if (!t) throw new Error(`<Adempimento>: il codice ${dominio}/${codice} non esiste nel catalogo`);
  return (
    <aside className="my-8 rounded-lg border bg-surface p-5 text-sm shadow-sm">
      <div className="flex flex-wrap items-center gap-2">
        <PastigliaDominio dominio={dominio} />
        <Codice codice={t.codice} />
        <span className="font-semibold">{t.titolo}</span>
      </div>
      <dl className="mt-4 grid grid-cols-[auto_1fr] gap-x-5 gap-y-2 text-xs">
        <dt className="text-muted-foreground">Riferimento</dt>
        <dd>{t.riferimento}</dd>
        <dt className="text-muted-foreground">Chi risponde</dt>
        <dd>{t.ruolo}</dd>
        <dt className="text-muted-foreground">Cadenza di controllo</dt>
        <dd>{descriviPeriodicita(t.periodicita)}</dd>
      </dl>
      <p className="mt-4 border-t pt-3 text-xs text-muted-foreground">
        Dal catalogo Legisboard, {ETICHETTE_DOMINIO[dominio].breve}. La cadenza è quella con cui il registro
        lo ripropone, non sempre una scadenza fissata dalla legge.
      </p>
    </aside>
  );
}

export function Norma({ rif, children }: { rif: string; children: React.ReactNode }) {
  return (
    <aside className="my-8 border-l-2 border-primary pl-5">
      <p className="font-mono text-xs font-semibold tracking-wide text-primary">{rif}</p>
      <div className="mt-2 leading-relaxed text-foreground">{children}</div>
    </aside>
  );
}

export function Nota({ children }: { children: React.ReactNode }) {
  return <aside className="my-8 rounded-lg bg-surface-sunken p-5 text-sm leading-relaxed">{children}</aside>;
}

export function InvitoDemo() {
  return (
    <aside className="my-10 rounded-lg bg-sidebar p-6 text-sidebar-foreground sm:p-8">
      <p className="text-xl font-bold tracking-tight">Vedetelo su un&apos;azienda d&apos;esempio.</p>
      <p className="mt-2 text-sidebar-muted">
        La demo è già compilata sui tre decreti. Nessuna registrazione: si entra con un clic.
      </p>
      <a href={INGRESSO_DEMO} className={`${PULSANTE_PIENO_SU_OLIVA} mt-5`}>
        Entra nella demo <ArrowRight className={FRECCIA_CTA} aria-hidden />
      </a>
    </aside>
  );
}

export const COMPONENTI_MDX = { Adempimento, Norma, Nota, InvitoDemo };
