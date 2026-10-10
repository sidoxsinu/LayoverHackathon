import { Barlow_Condensed, IBM_Plex_Mono } from 'next/font/google';
import './globals.css';

const barlow = Barlow_Condensed({ 
  subsets: ['latin'], 
  weight: ['400', '700'],
  variable: '--font-sans',
});

const plex = IBM_Plex_Mono({
  subsets: ['latin'],
  weight: ['400', '700'],
  variable: '--font-mono',
});

export const metadata = {
  title: 'GATE',
  description: 'Layover Companion',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body className={`${barlow.variable} ${plex.variable} font-sans uppercase`}>
        {children}
      </body>
    </html>
  );
}
