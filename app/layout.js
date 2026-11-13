import './globals.css';
import { Playfair_Display, Inter } from 'next/font/google';
import { Analytics } from '@vercel/analytics/next';
import { SITE } from '@/lib/site';

const serif = Playfair_Display({ subsets: ['latin'], variable: '--font-serif', weight: ['700', '800'] });
const sans = Inter({ subsets: ['latin'], variable: '--font-sans' });

const title = 'Frial Jurado | Quesos, fiambres, lácteos y pollo';
const description = 'Quesos, fiambres Sofía, lácteos PIL, pollo y menudencias al por mayor y menor. Pedidos por WhatsApp.';

export const metadata = {
  metadataBase: new URL(SITE),
  alternates: { canonical: '/' },
  title,
  description,
  openGraph: { title, description, type: 'website', locale: 'es_BO', siteName: 'Frial Jurado' },
};

export const viewport = { themeColor: '#0033AA' };

export default function RootLayout({ children }) {
  return (
    <html lang="es-BO" className={`${serif.variable} ${sans.variable}`}>
      <body className="bg-crema font-sans text-stone-800 antialiased">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
