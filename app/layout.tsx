import type { Metadata } from "next";
import { Public_Sans, Source_Serif_4 } from "next/font/google";
import "./globals.css";
import { RoleBar } from "./components/RoleBar";

const sans = Public_Sans({ subsets: ["latin", "latin-ext"], variable: "--font-public-sans", display: "swap" });
const serif = Source_Serif_4({ subsets: ["latin", "latin-ext"], variable: "--font-source-serif", display: "swap" });

export const metadata: Metadata = {
  title: "No CV, No Job Ad",
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
        <footer data-app-chrome className="border-t border-line py-5 text-sm text-muted">
          <p className="mx-auto max-w-5xl px-4 sm:px-6">
            Concept for the City of Espoo challenge, Junction 2026. All people and companies are fictional.
          </p>
        </footer>
      </body>
    </html>
  );
}
