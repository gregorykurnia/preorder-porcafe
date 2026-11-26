import type { Metadata, Viewport } from "next";
import { Fredoka, Plus_Jakarta_Sans } from "next/font/google";
import "./globals.css";

const jakarta = Plus_Jakarta_Sans({ variable: "--font-jakarta", subsets: ["latin"] });
const fredoka = Fredoka({ variable: "--font-fredoka", subsets: ["latin"], weight: ["600", "700"] });

export const metadata: Metadata = {
  title: "Porcafe · Christmas Bazaar preorder",
  description: "Preorder Porcafe sate, rice bowls, cookies and coffee, and pick up at the Christmas bazaar on 3–4 December.",
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#fdf6ee" },
    { media: "(prefers-color-scheme: dark)", color: "#241a15" },
  ],
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="en" className={`${jakarta.variable} ${fredoka.variable} antialiased`}>
      <body>
        <div className="blobs" aria-hidden="true" />
        {children}
      </body>
    </html>
  );
}
