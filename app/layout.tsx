import type { Metadata, Viewport } from 'next';
import { Archivo, DM_Mono } from 'next/font/google';
import './globals.css';

const archivo = Archivo({
  subsets: ['latin'],
  weight: ['500', '600', '800', '900'],
  variable: '--font-archivo',
  display: 'swap',
});

const dmMono = DM_Mono({
  subsets: ['latin'],
  weight: ['400', '500'],
  variable: '--font-dm-mono',
  display: 'swap',
});

/* Canonical origin for metadataBase and OG tags.
   Set NEXT_PUBLIC_SITE_URL once you have a custom domain; otherwise Vercel's own
   production URL is used, and local dev falls back to localhost. */
const site =
  process.env.NEXT_PUBLIC_SITE_URL ||
  (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : 'http://localhost:3000');

export const metadata: Metadata = {
  metadataBase: new URL(site),
  title: 'Sash — Be there without being there.',
  description:
    'Hire credible people at events you cannot attend. They wear your brand, take the meetings, and bring back proof.',
  openGraph: {
    title: 'Sash — Be there without being there.',
    description: 'Every person at a conference is unsold advertising space.',
    url: site,
    siteName: 'Sash',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Sash — Be there without being there.',
    description: 'Every person at a conference is unsold advertising space.',
  },
};

export const viewport: Viewport = {
  themeColor: '#ffffff',
  width: 'device-width',
  initialScale: 1,
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${archivo.variable} ${dmMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
