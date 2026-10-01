import type { Metadata } from 'next';
import { Inter, Playfair_Display, Noto_Naskh_Arabic } from 'next/font/google';
import './globals.css';

const inter = Inter({
  subsets: ['latin'],
  variable: '--font-sans',
  display: 'swap',
});

const playfair = Playfair_Display({
  subsets: ['latin'],
  variable: '--font-serif',
  display: 'swap',
  weight: ['400', '500', '600', '700', '800'],
});

const notoArabic = Noto_Naskh_Arabic({
  subsets: ['arabic'],
  variable: '--font-arabic',
  display: 'swap',
  weight: ['400', '500', '600', '700'],
});

export const metadata: Metadata = {
  title: 'Waleed Badshah — Personal AI',
  description:
    'Chat with my personal AI assistant. Ask about my work, skills, experience, or just say hello.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${playfair.variable} ${notoArabic.variable}`}
    >
      <body className="antialiased">{children}</body>
    </html>
  );
}