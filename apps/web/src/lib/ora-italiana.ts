// L'ORA ITALIANA, qualunque sia il fuso del server _(2026-11-14)_.
//
// Il campo `datetime-local` manda «2026-11-10T09:30» senza fuso. `new Date()` lo legge nel
// fuso del PROCESSO, e il processo gira in UTC sia nel contenitore delle istanze sia su
// Vercel: le 09:30 italiane diventavano le 09:30 UTC, cioè le 10:30 italiane. Le 72 ore di
// una violazione scadevano un'ora dopo il termine di legge (due con l'ora legale), e un fatto
// conosciuto mezz'ora fa risultava «nel futuro». Trovato dal collaudo completo dell'istanza,
// non leggendo il codice: in sviluppo il portatile è in ora italiana e il difetto non esiste.
//
// Qui il fuso si dichiara, non si eredita.

const FUSO = "Europe/Rome";

const parti = new Intl.DateTimeFormat("en-US", {
  timeZone: FUSO,
  hourCycle: "h23",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  second: "2-digit",
});

/** Di quanti millisecondi l'ora italiana è avanti rispetto a UTC in quell'istante. */
function scarto(istante: number): number {
  const p = Object.fromEntries(parti.formatToParts(new Date(istante)).map((x) => [x.type, x.value]));
  const comeUtc = Date.UTC(+p.year!, +p.month! - 1, +p.day!, +p.hour!, +p.minute!, +p.second!);
  return comeUtc - Math.floor(istante / 1000) * 1000;
}

/**
 * Legge «AAAA-MM-GGTHH:MM» (o «AAAA-MM-GG») come ora italiana. `null` se non è una data.
 *
 * Il secondo passaggio sistema i due cambi d'ora: lo scarto si ricalcola sull'istante già
 * corretto, perché quello della prima stima può stare dall'altra parte del cambio.
 */
export function daOraItaliana(testo: string): Date | null {
  const m = /^(\d{4})-(\d{2})-(\d{2})(?:T(\d{2}):(\d{2})(?::(\d{2}))?)?$/.exec(testo.trim());
  if (!m) return null;
  const comeUtc = Date.UTC(+m[1]!, +m[2]! - 1, +m[3]!, +(m[4] ?? 0), +(m[5] ?? 0), +(m[6] ?? 0));
  if (Number.isNaN(comeUtc)) return null;
  const primo = comeUtc - scarto(comeUtc);
  return new Date(comeUtc - scarto(primo));
}

/** Il giorno di calendario italiano di un istante, «AAAA-MM-GG». */
export function giornoItaliano(d: Date): string {
  const p = Object.fromEntries(parti.formatToParts(d).map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day}`;
}

/** L'anno italiano di un istante: il numero di protocollo «3/2027» si dà alla mezzanotte di Roma. */
export function annoItaliano(d: Date): number {
  return Number(giornoItaliano(d).slice(0, 4));
}
