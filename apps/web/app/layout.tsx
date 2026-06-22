import type { Metadata } from "next";
import "./globals.css";
import { AppProviders } from "../src/providers";
import { Footer } from "../src/components/footer";
import { Navbar } from "../src/components/navbar";

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
          <Navbar />
          <div className="flex-1">{children}</div>
          <Footer />
        </AppProviders>
      </body>
    </html>
  );
}
