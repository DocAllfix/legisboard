import { PaginaPilastro, metadatiPilastro } from "@/components/pagina-pilastro";

// Pilastro gdpr: vedi `components/pagina-pilastro.tsx` e `lib/pilastri.ts`.
export const revalidate = 86400;
export const metadata = metadatiPilastro("gdpr");

export default function Pilastro() {
  return <PaginaPilastro dominio="gdpr" />;
}
