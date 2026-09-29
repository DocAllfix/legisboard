import { AUTORI } from "@/lib/autori";
import { articoliPubblicati } from "@/lib/blog";
import { SITO } from "@/lib/sito";

// Il feed RSS delle guide. Statico e rigenerato ogni notte, come l'indice.
export const revalidate = 86400;

const x = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export function GET() {
  const voci = articoliPubblicati()
    .map((a) => {
      const url = `${SITO.url}/blog/${a.slug}`;
      return `    <item>
      <title>${x(a.titolo)}</title>
      <link>${url}</link>
      <guid isPermaLink="true">${url}</guid>
      <description>${x(a.descrizione)}</description>
      <pubDate>${new Date(`${a.pubblicazione}T08:00:00Z`).toUTCString()}</pubDate>
      <dc:creator>${x(AUTORI[a.autore as keyof typeof AUTORI].nome)}</dc:creator>
    </item>`;
    })
    .join("\n");
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<rss version="2.0" xmlns:dc="http://purl.org/dc/elements/1.1/" xmlns:atom="http://www.w3.org/2005/Atom">
  <channel>
    <title>Legisboard · Guide</title>
    <link>${SITO.url}/blog</link>
    <atom:link href="${SITO.url}/blog/feed.xml" rel="self" type="application/rss+xml" />
    <description>Guide su adempimenti GDPR, D.Lgs 231/2001 e D.Lgs 81/2008.</description>
    <language>it</language>
${voci}
  </channel>
</rss>
`;
  return new Response(xml, { headers: { "content-type": "application/rss+xml; charset=utf-8" } });
}
