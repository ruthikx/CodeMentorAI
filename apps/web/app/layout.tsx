import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "../src/providers";
import { AppShell } from "../src/components/app-shell";

export const metadata: Metadata = {
  title: "CodeMentor AI",
  description: "Frontend app for the CodeMentor AI monorepo."
};

export default function RootLayout({
  children
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="flex min-h-screen flex-col bg-ink text-paper antialiased">
        <AppProviders>
          <AppShell>{children}</AppShell>
        </AppProviders>
      </body>
    </html>
  );
}
