import type { MetadataRoute } from "next";
import { DOMINI } from "@legisboard/engine";
import { AUTORI } from "@/lib/autori";
import { articoliPubblicati } from "@/lib/blog";
import { PILASTRI } from "@/lib/pilastri";
import { SITO } from "@/lib/sito";

// La sitemap. `lastModified` SOLO dove la data è vera: sugli articoli è la data di aggiornamento
// scritta nell'intestazione. La home si rigenera ogni giorno per le date della demo, e dichiarare
// «cambiata oggi» ogni giorno direbbe a Google una cosa falsa; i pilastri cambiano con il catalogo,
// che non ha una data.
//
// Gli articoli con data futura non ci sono: `articoliPubblicati` li esclude, e la sitemap si
// rigenera ogni notte insieme al resto. La pagina autore entra solo quando ha guide firmate.
export const revalidate = 86400;

export default function sitemap(): MetadataRoute.Sitemap {
  const articoli = articoliPubblicati();
  const autori = Object.keys(AUTORI).filter((k) => articoli.some((a) => a.autore === k));
  return [
    { url: `${SITO.url}/` },
    ...DOMINI.map((d) => ({ url: `${SITO.url}${PILASTRI[d].url}` })),
    { url: `${SITO.url}/blog` },
    ...articoli.map((a) => ({ url: `${SITO.url}/blog/${a.slug}`, lastModified: a.aggiornatoIl })),
    ...autori.map((k) => ({ url: `${SITO.url}/autore/${k}` })),
    { url: `${SITO.url}/privacy` },
    { url: `${SITO.url}/cookie` },
  ];
}
