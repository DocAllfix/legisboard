import { PaginaPilastro, metadatiPilastro } from "@/components/pagina-pilastro";

// Pilastro d81: vedi `components/pagina-pilastro.tsx` e `lib/pilastri.ts`.
export const revalidate = 86400;
export const metadata = metadatiPilastro("d81");

export default function Pilastro() {
  return <PaginaPilastro dominio="d81" />;
}
