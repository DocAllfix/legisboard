import { describe, expect, it } from "vitest";
import { annoItaliano, daOraItaliana, giornoItaliano } from "./ora-italiana";

// I risultati attesi sono istanti UTC scritti a mano: il test non dipende dal fuso del
// processo che lo esegue, ed è proprio questo il punto.
describe("ora italiana", () => {
  it("d'inverno le 09:30 italiane sono le 08:30 UTC", () => {
    expect(daOraItaliana("2026-11-10T09:30")!.toISOString()).toBe("2026-11-10T08:30:00.000Z");
  });

  it("d'estate le 09:30 italiane sono le 07:30 UTC", () => {
    expect(daOraItaliana("2026-07-10T09:30")!.toISOString()).toBe("2026-07-10T07:30:00.000Z");
  });

  it("attraversa i due cambi d'ora", () => {
    // 29 marzo 2026: alle 02:00 si va alle 03:00. Le 03:30 sono già ora legale.
    expect(daOraItaliana("2026-03-29T03:30")!.toISOString()).toBe("2026-03-29T01:30:00.000Z");
    expect(daOraItaliana("2026-03-29T01:30")!.toISOString()).toBe("2026-03-29T00:30:00.000Z");
    // 25 ottobre 2026: alle 03:00 si torna alle 02:00.
    expect(daOraItaliana("2026-10-25T04:00")!.toISOString()).toBe("2026-10-25T03:00:00.000Z");
  });

  it("una data sola vale la mezzanotte italiana", () => {
    expect(daOraItaliana("2026-11-10")!.toISOString()).toBe("2026-11-09T23:00:00.000Z");
  });

  it("rifiuta ciò che non è una data", () => {
    expect(daOraItaliana("")).toBeNull();
    expect(daOraItaliana("ieri sera")).toBeNull();
  });

  it("il giorno e l'anno sono quelli di Roma, non di Greenwich", () => {
    // 23:30 UTC del 31 dicembre è già il primo gennaio a Roma.
    const d = new Date("2026-12-31T23:30:00Z");
    expect(giornoItaliano(d)).toBe("2027-01-01");
    expect(annoItaliano(d)).toBe(2027);
  });
});
