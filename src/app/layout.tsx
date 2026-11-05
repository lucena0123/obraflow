import type { Metadata } from "next";
import { DataProvider } from "@/data/store";
import { Shell } from "@/components/shell";
import "./globals.css";
export const metadata: Metadata = {
  title: "ObraFlow · Gestão de Obras Industriais",
  description:
    "Planejamento, campo e resultados em um só lugar. Demonstração local com dados fictícios.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className="dark">
      <body>
        <DataProvider>
          <Shell>{children}</Shell>
        </DataProvider>
      </body>
    </html>
  );
}
