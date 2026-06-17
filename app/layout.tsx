import type { Metadata } from "next";
import { Poppins } from "next/font/google";
import { Toaster } from "sonner";
import "./globals.css";

const poppins = Poppins({
  variable: "--font-poppins",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800", "900"],
});

export const metadata: Metadata = {
  title: "Chismógrafo",
  description: "El chisme, anónimo.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" className={`${poppins.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-black text-[#f0f0f0]">
        {children}
        <Toaster
          position="bottom-center"
          toastOptions={{
            style: {
              background: '#0f0f0f',
              border: '1px solid #1c1c1c',
              color: '#f0f0f0',
              borderRadius: 0,
              fontSize: '13px',
              fontFamily: 'var(--font-poppins)',
            },
          }}
        />
      </body>
    </html>
  );
}
