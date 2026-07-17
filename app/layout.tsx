import type { Metadata } from 'next';
import { Inter, Outfit, JetBrains_Mono, Anonymous_Pro, Fira_Code } from 'next/font/google';
import './globals.css';

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' });
const outfit = Outfit({ subsets: ['latin'], variable: '--font-display' });
const jetbrainsMono = JetBrains_Mono({ subsets: ['latin'], variable: '--font-mono' });
const anonymousPro = Anonymous_Pro({ weight: ['400', '700'], subsets: ['latin'], variable: '--font-anonymous' });
const firaCode = Fira_Code({ subsets: ['latin'], variable: '--font-fira' });

export const metadata: Metadata = {
  title: 'DSA Forge | S.H.I.E.L.D. Training Facility',
  description: 'A Marvel-themed AI DSA training facility. Master algorithms through guided problem solving — no solutions, only growth.',
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={`${inter.variable} ${outfit.variable} ${jetbrainsMono.variable} ${anonymousPro.variable} ${firaCode.variable}`}
    >
      <body suppressHydrationWarning className="font-sans">
        {children}
      </body>
    </html>
  );
}
