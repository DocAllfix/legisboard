import { PaginaPilastro, metadatiPilastro } from "@/components/pagina-pilastro";

// Pilastro d231: vedi `components/pagina-pilastro.tsx` e `lib/pilastri.ts`.
export const revalidate = 86400;
export const metadata = metadatiPilastro("d231");

export default function Pilastro() {
  return <PaginaPilastro dominio="d231" />;
}
