import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";

import { ThemeProvider } from "@/components/ThemeProvider";
import { LanguageProvider } from "@/components/LanguageContext";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL('https://www.schedassist.com'),
  title: {
    default: 'SchedAssist - Plataforma Inteligente de Turnos y Gestión Médica',
    template: '%s | SchedAssist',
  },
  description: 'Automatiza tus citas con IA y WhatsApp. La plataforma SaaS ideal para clínicas y profesionales de la salud.',
  keywords: ['turnos medicos', 'agendamiento', 'saas', 'whatsapp bot', 'clinicas', 'software medico'],
  openGraph: {
    type: 'website',
    locale: 'es_AR',
    url: 'https://www.schedassist.com',
    title: 'SchedAssist - Appointment Automation',
    description: 'Automatiza tus citas con IA y WhatsApp.',
    siteName: 'SchedAssist',
    images: [
      {
        url: '/og-image.png',
        width: 1200,
        height: 630,
        alt: 'SchedAssist - Medical Appointment SaaS',
      },
    ],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'SchedAssist',
    description: 'Automatiza tus citas con IA y WhatsApp.',
  },
  alternates: {
    canonical: '/',
    languages: {
      'es': '/es',
      'en': '/en',
      'it': '/it',
    },
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <ThemeProvider
          attribute="class"
          defaultTheme="light"
          forcedTheme="light"
          enableSystem={false}
          disableTransitionOnChange
        >
          <LanguageProvider>
            {children}
          </LanguageProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
