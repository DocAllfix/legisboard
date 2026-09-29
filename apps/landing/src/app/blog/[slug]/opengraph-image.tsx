import { readFileSync } from "node:fs";
import { join } from "node:path";
import { ImageResponse } from "next/og";
import { ETICHETTE_DOMINIO } from "@legisboard/engine";
import { AUTORI } from "@/lib/autori";
import { articoliPubblicati, articolo } from "@/lib/blog";
import { token } from "@/lib/colori";

// L'anteprima di ogni guida: stesso impianto di quella della home (`app/opengraph-image.tsx`),
// con il titolo dell'articolo al posto della promessa. Nessuna grafica da disegnare a mano.

export const alt = "Guida Legisboard";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export function generateStaticParams() {
  return articoliPubblicati().map((a) => ({ slug: a.slug }));
}

const carattere = (file: string) =>
  readFileSync(join(process.cwd(), "node_modules", "geist", "dist", "fonts", file));

export default async function Anteprima({ params }: { params: Promise<{ slug: string }> }) {
  const a = articolo((await params).slug);
  const fondo = token("--background");
  const inchiostro = token("--foreground");
  const tenue = token("--muted-foreground");
  const oliva = token("--primary");
  const titolo = a?.titolo ?? "Guide Legisboard";
  // Oltre i 60 caratteri il titolo va su tre righe: un gradino più piccolo, perché ci stia.
  const corpo = titolo.length > 60 ? 56 : 66;

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "72px 80px",
          background: fondo,
          color: inchiostro,
          fontFamily: "Geist",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 20 }}>
            <svg width="44" height="44" viewBox="0 0 64 64">
              <path fill={oliva} fillRule="evenodd" d="M8 8H22V42H56V56H8ZM42 8H56V22H42Z" />
            </svg>
            <span style={{ fontSize: 30, fontWeight: 600 }}>Legisboard · Guide</span>
          </div>
          {a ? (
            <span style={{ fontFamily: "Geist Mono", fontSize: 24, color: oliva }}>{ETICHETTE_DOMINIO[a.decreto].norma}</span>
          ) : null}
        </div>
        <span style={{ fontSize: corpo, fontWeight: 600, lineHeight: 1.1, letterSpacing: -1.2, maxWidth: 1000 }}>{titolo}</span>
        <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, color: tenue }}>
          <span>{a ? AUTORI[a.autore as keyof typeof AUTORI].nome : ""}</span>
          <span style={{ color: oliva, fontWeight: 600 }}>legisboard.eu</span>
        </div>
      </div>
    ),
    {
      ...size,
      fonts: [
        { name: "Geist", data: carattere("geist-sans/Geist-Regular.ttf"), weight: 400, style: "normal" },
        { name: "Geist", data: carattere("geist-sans/Geist-SemiBold.ttf"), weight: 600, style: "normal" },
        { name: "Geist Mono", data: carattere("geist-mono/GeistMono-Medium.ttf"), weight: 500, style: "normal" },
      ],
    },
  );
}
