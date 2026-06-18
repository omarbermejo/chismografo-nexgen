import type { Metadata } from "next";
import { Caveat, Patrick_Hand, Archivo, Spline_Sans_Mono } from "next/font/google";
import { Toaster } from "sonner";
import ClientShell from "@/components/ClientShell";
import "./globals.css";

const caveat = Caveat({
  variable: "--font-caveat",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});
const patrick = Patrick_Hand({
  variable: "--font-patrick",
  subsets: ["latin"],
  weight: ["400"],
});
const archivo = Archivo({
  variable: "--font-archivo",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});
const splineMono = Spline_Sans_Mono({
  variable: "--font-spline-mono",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Chismógrafo",
  description: "El cuaderno de los secretos.",
};

// Aplica el tema guardado antes del primer paint (anti-FOUC). Default: noche.
const themeScript = `(function(){try{var t=localStorage.getItem('chismografo_theme');document.documentElement.setAttribute('data-theme',t==='light'?'light':'dark');}catch(e){document.documentElement.setAttribute('data-theme','dark');}})();`;

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="es"
      suppressHydrationWarning
      className={`${caveat.variable} ${patrick.variable} ${archivo.variable} ${splineMono.variable} h-full antialiased`}
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeScript }} />
      </head>
      <body className="h-screen overflow-hidden bg-paper text-ink">
        <ClientShell>{children}</ClientShell>
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: 'var(--paper-raised)',
              border: '1px solid var(--border)',
              color: 'var(--ink)',
              borderRadius: '2px',
              fontSize: '14px',
              fontFamily: 'var(--font-archivo)',
              boxShadow: 'var(--shadow)',
            },
          }}
        />
      </body>
    </html>
  );
}
