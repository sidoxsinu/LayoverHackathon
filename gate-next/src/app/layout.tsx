import { Barlow_Condensed, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const barlow = Barlow_Condensed({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  variable: '--font-barlow',
  display: 'swap',
});

const plex = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '500', '700'],
  variable: '--font-plex',
  display: 'swap',
});

export const metadata = {
  title: 'GATE - Layover Companion',
  description: 'Track your layover. Get back to your gate on time.',
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
  viewportFit: 'cover',
  themeColor: '#101010',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${barlow.variable} ${plex.variable}`}>
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <meta name="theme-color" content="#101010" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black" />
      </head>
      <body style={{ fontFamily: 'var(--font-barlow), sans-serif', textTransform: 'uppercase' }}>
        {children}
      </body>
    </html>
  );
}
