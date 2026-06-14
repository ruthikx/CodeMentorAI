import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "../src/providers";

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
      <body className="bg-ink text-paper antialiased">
        <AppProviders>{children}</AppProviders>
      </body>
    </html>
  );
}
