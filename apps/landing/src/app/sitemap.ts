import type { MetadataRoute } from "next";
import { SITO } from "@/lib/sito";

// La pagina e le due informative. `lastModified` non si dichiara: la pagina si rigenera ogni giorno per le date della
// demo, e dichiarare «cambiata oggi» ogni giorno direbbe a Google una cosa falsa.
export default function sitemap(): MetadataRoute.Sitemap {
  return [{ url: `${SITO.url}/` }, { url: `${SITO.url}/privacy` }, { url: `${SITO.url}/cookie` }];
}
