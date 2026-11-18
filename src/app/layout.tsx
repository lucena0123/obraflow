import type { Metadata } from "next";
import localFont from "next/font/local";
import { DataProvider } from "@/data/store";
import { Shell } from "@/components/shell";
import { IS_ELECTRICAL } from "@/domain/demo";
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
export const metadata: Metadata = IS_ELECTRICAL
  ? {
      metadataBase: new URL("https://lucena0123.github.io"),
      title: "ObraFlow Elétrica · Acompanhamento de Obras Elétricas",
      description:
        "Explore uma demonstração de planejamento, diário, avanço físico, pendências e custos para obras elétricas. Dados fictícios salvos no navegador.",
      alternates: { canonical: "/obraflow/eletrica/" },
      openGraph: {
        title: "ObraFlow Elétrica · Do planejamento ao campo",
        description:
          "Etapas, diário, avanço e pendências em uma demonstração interativa para o setor elétrico. Conheça e experimente com dados fictícios.",
        type: "website",
        locale: "pt_BR",
        url: "/obraflow/eletrica/",
        images: [
          {
            url: "/obraflow/eletrica/obraflow-eletrica-social.png",
            width: 1200,
            height: 630,
            alt: "ObraFlow Elétrica: planejamento, diário e acompanhamento de obras elétricas. Demonstração com dados fictícios.",
          },
        ],
      },
    }
  : {
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
