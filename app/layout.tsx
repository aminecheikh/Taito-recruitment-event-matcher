import type { Metadata } from "next";
import "./globals.css";
import { RoleBar } from "./components/RoleBar";

export const metadata: Metadata = {
  title: "Recruitment matchmaker",
  description: "Applicants show evidence for what a company asks for; recruiters meet them on it.",
};

// Every page reads the JSON store and the session cookie fresh on each request.
export const dynamic = "force-dynamic";

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col">
        <RoleBar />
        <div className="flex-1">{children}</div>
        <footer className="border-t border-neutral-300 px-4 py-3 text-sm text-neutral-700">
          Concept for the City of Espoo challenge, Junction 2026 — all data fictional
        </footer>
      </body>
    </html>
  );
}
