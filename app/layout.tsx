import type { Metadata } from "next";
import { Hanken_Grotesk, Newsreader } from "next/font/google";
import "./globals.css";
import { RoleBar } from "./components/RoleBar";

const sans = Hanken_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-hanken", display: "swap" });
const serif = Newsreader({ subsets: ["latin", "latin-ext"], axes: ["opsz"], variable: "--font-newsreader", display: "swap" });

export const metadata: Metadata = {
  title: "Taito",
  description: "Applicants show evidence for what a company asks for; recruiters meet them on it.",
};

// Every page reads the JSON store and the session cookie fresh on each request.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${sans.variable} ${serif.variable}`}>
      <body className="flex min-h-screen flex-col">
        <RoleBar />
        <div className="flex-1">{children}</div>
        <footer data-app-chrome className="border-t border-line py-6 text-sm text-muted">
          <p className="shell">
            Concept for the City of Espoo challenge, Junction 2026. All people and companies are fictional.
          </p>
        </footer>
      </body>
    </html>
  );
}
