import { evaluate } from "@mdx-js/mdx";
import * as runtime from "react/jsx-runtime";
import rehypeSlug from "rehype-slug";
import remarkGfm from "remark-gfm";
import { COMPONENTI_MDX } from "@/components/mdx";

// La compilazione dell'MDX, sul server. `evaluate` esegue il codice compilato qui, in Node, e
// restituisce un componente React che Next rende in HTML statico: al browser non arriva né il
// compilatore né il sorgente.
//
// Sicuro perché i sorgenti sono nostri, nel repository, e passano dalla revisione di una PR:
// non è contenuto di utenti. Per questo non si usa un sanificatore.

export async function compila(corpo: string) {
  const { default: Contenuto } = await evaluate(corpo, {
    ...runtime,
    remarkPlugins: [remarkGfm],
    rehypePlugins: [rehypeSlug],
    development: false,
  });
  return function Articolo() {
    return <Contenuto components={COMPONENTI_MDX} />;
  };
}
