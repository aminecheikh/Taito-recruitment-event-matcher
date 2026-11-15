import type { Metadata } from "next";
import { Bricolage_Grotesque, Hanken_Grotesk } from "next/font/google";
import "./globals.css";
import { cookies } from "next/headers";
import Link from "next/link";
import { RoleBar } from "./components/RoleBar";
import { EventBanner } from "./components/EventBanner";
import { SceneBackdrop } from "./components/SceneBackdrop";
import { parseTheme, THEME_COOKIE } from "@/lib/theme";

const sans = Hanken_Grotesk({ subsets: ["latin", "latin-ext"], variable: "--font-hanken", display: "swap" });
const display = Bricolage_Grotesque({ subsets: ["latin", "latin-ext"], axes: ["opsz", "wdth"], variable: "--font-bricolage", display: "swap" });

export const metadata: Metadata = {
  title: "Taito",
  description: "Applicants show evidence for what a company asks for; recruiters meet them on it.",
};

// Every page reads the JSON store and the session cookie fresh on each request.
export const dynamic = "force-dynamic";

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const theme = parseTheme((await cookies()).get(THEME_COOKIE)?.value);
  return (
    <html lang="en" data-theme={theme} className={`${sans.variable} ${display.variable}`}>
      {/* Browser extensions (e.g. Grammarly) add attributes to <body> before hydration. */}
      <body className="relative flex min-h-screen flex-col" suppressHydrationWarning>
        <SceneBackdrop />
        <RoleBar />
        <EventBanner />
        <div className="flex-1">{children}</div>
        <footer data-app-chrome className="border-t border-line py-6 text-sm text-muted">
          <p className="shell">
            Concept for the City of Espoo challenge, Junction 2026. All people and companies are fictional.
          </p>
          <p className="shell mt-2">
            <Link href="/privacy" className="underline">Privacy and your data</Link>
          </p>
        </footer>
      </body>
    </html>
  );
}
