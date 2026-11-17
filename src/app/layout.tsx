import type { Metadata } from "next";
import localFont from "next/font/local";
import { DataProvider } from "@/data/store";
import { Shell } from "@/components/shell";
import "./globals.css";
import "./rlm-brand.css";
const publicSans = localFont({
  src: "./fonts/public-sans-latin.woff2",
  variable: "--font-public-sans",
  weight: "400 700",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});
const oswald = localFont({
  src: "./fonts/oswald-latin.woff2",
  variable: "--font-oswald",
  weight: "500 600",
  display: "swap",
  fallback: ["Arial", "sans-serif"],
});
export const metadata: Metadata = {
  title: "ObraFlow · Gestão de Obras Industriais",
  description:
    "Planejamento, campo e resultados em um só lugar. Demonstração local com dados fictícios.",
};
export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="pt-BR" className={`${publicSans.variable} ${oswald.variable}`}>
      <body>
        <DataProvider>
          <Shell>{children}</Shell>
        </DataProvider>
      </body>
    </html>
  );
}
