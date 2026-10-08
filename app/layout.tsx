import type { Metadata } from "next";
import localFont from "next/font/local";
import "./globals.css";

// Shriftlar loyiha ichida (app/fonts) — dev/build Google'ga ulanishga bog'liq bo'lmasin.
// Ikkalasi ham variable: barcha qalinliklar bitta faylda.
const display = localFont({
  src: "./fonts/unbounded-latin.woff2",
  variable: "--font-unbounded",
  weight: "200 900",
  display: "swap",
});

const sans = localFont({
  src: "./fonts/manrope-latin.woff2",
  variable: "--font-manrope",
  weight: "200 800",
  display: "swap",
});

export const metadata: Metadata = {
  title: "CEO AI — Kompaniya platformasi",
  description: "CEO AI kompaniyasining Moliya, Marketing, HR va Sklad bo‘limlari — interaktiv virtual tur.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="uz" className={`${display.variable} ${sans.variable} h-full antialiased`}>
      <body className="min-h-full">{children}</body>
    </html>
  );
}
