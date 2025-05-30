
import type { Metadata } from 'next';
import { GeistSans, GeistMono } from 'geist/font';
import { 
  Lora, 
  Merriweather, 
  Noto_Serif, 
  PT_Serif, 
  EB_Garamond,
  Vollkorn,
  Open_Sans,
  Lato,
  Roboto,
  Source_Sans_Pro,
  Inter,
  Bitter
} from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ReaderSettingsProvider } from '@/contexts/ReaderSettingsContext';
import { Toaster } from '@/components/ui/toaster';
import AppHeader from '@/components/layout/AppHeader';

const geistSans = GeistSans({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = GeistMono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

// Reader Font Options
const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap', weight: ['400', '700'] });
const merriweather = Merriweather({ subsets: ['latin'], variable: '--font-merriweather', display: 'swap', weight: ['400', '700'] });
const notoSerif = Noto_Serif({ subsets: ['latin'], variable: '--font-noto-serif', display: 'swap', weight: ['400', '700'] });
const ptSerif = PT_Serif({ subsets: ['latin'], variable: '--font-pt-serif', display: 'swap', weight: ['400', '700'] });
const ebGaramond = EB_Garamond({ subsets: ['latin'], variable: '--font-eb-garamond', display: 'swap', weight: ['400', '500', '700'] });
const vollkorn = Vollkorn({ subsets: ['latin'], variable: '--font-vollkorn', display: 'swap', weight: ['400', '700'] });
const bitter = Bitter({ subsets: ['latin'], variable: '--font-bitter', display: 'swap', weight: ['400', '700'] });

const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans', display: 'swap', weight: ['400', '700'] });
const lato = Lato({ subsets: ['latin'], variable: '--font-lato', display: 'swap', weight: ['400', '700'] });
const roboto = Roboto({ subsets: ['latin'], variable: '--font-roboto', display: 'swap', weight: ['400', '500', '700'] });
const sourceSansPro = Source_Sans_Pro({ subsets: ['latin'], variable: '--font-source-sans-pro', display: 'swap', weight: ['400', '700'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap', weight: ['400', '500', '700'] });


export const metadata: Metadata = {
  title: 'Literary Nexus',
  description: 'Your portal to a universe of stories.',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body 
        className={`
          ${geistSans.variable} 
          ${geistMono.variable} 
          ${lora.variable}
          ${merriweather.variable}
          ${notoSerif.variable}
          ${ptSerif.variable}
          ${ebGaramond.variable}
          ${vollkorn.variable}
          ${bitter.variable}
          ${openSans.variable}
          ${lato.variable}
          ${roboto.variable}
          ${sourceSansPro.variable}
          ${inter.variable}
          antialiased flex flex-col min-h-screen
        `}
      >
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <ReaderSettingsProvider>
            <AppHeader />
            <main className="flex-grow container mx-auto px-4 py-8">
              {children}
            </main>
            <Toaster />
          </ReaderSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
    
