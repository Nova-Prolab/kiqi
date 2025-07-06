
import type { Metadata } from 'next';
import { GeistSans } from 'geist/font/sans';
import { GeistMono } from 'geist/font/mono';
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
  Source_Sans_3,
  Inter,
  Bitter,
  Arimo,
  Tinos,
  Cousine
} from 'next/font/google'; // Google Fonts
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ReaderSettingsProvider } from '@/contexts/ReaderSettingsContext';
import { CustomThemeProvider } from '@/contexts/CustomThemeContext';
import { Toaster } from '@/components/ui/toaster';
import AppHeader from '@/components/layout/AppHeader';
import { ContentFilterProvider } from '@/contexts/ContentFilterContext';
import { LikedCommentsProvider } from '@/contexts/LikedCommentsContext';

// Reader Font Options (from Google Fonts)
const lora = Lora({ subsets: ['latin'], variable: '--font-lora', display: 'swap', weight: ['400', '700'] });
const merriweather = Merriweather({ subsets: ['latin'], variable: '--font-merriweather', display: 'swap', weight: ['400', '700'] });
const notoSerif = Noto_Serif({ subsets: ['latin'], variable: '--font-noto-serif', display: 'swap', weight: ['400', '700'] });
const ptSerif = PT_Serif({ subsets: ['latin'], variable: '--font-pt-serif', display: 'swap', weight: ['400', '700'] });
const ebGaramond = EB_Garamond({ subsets: ['latin'], variable: '--font-eb-garamond', display: 'swap', weight: ['400', '500', '700'] });
const vollkorn = Vollkorn({ subsets: ['latin'], variable: '--font-vollkorn', display: 'swap', weight: ['400', '700'] });
const bitter = Bitter({ subsets: ['latin'], variable: '--font-bitter', display: 'swap', weight: ['400', '700'] });
const arimo = Arimo({ subsets: ['latin'], variable: '--font-arimo', display: 'swap', weight: ['400', '700'] });
const tinos = Tinos({ subsets: ['latin'], variable: '--font-tinos', display: 'swap', weight: ['400', '700'] });
const cousine = Cousine({ subsets: ['latin'], variable: '--font-cousine', display: 'swap', weight: ['400', '700'] });

const openSans = Open_Sans({ subsets: ['latin'], variable: '--font-open-sans', display: 'swap', weight: ['400', '700'] });
const lato = Lato({ subsets: ['latin'], variable: '--font-lato', display: 'swap', weight: ['400', '700'] });
const roboto = Roboto({ subsets: ['latin'], variable: '--font-roboto', display: 'swap', weight: ['400', '500', '700'] });
const sourceSans3 = Source_Sans_3({ subsets: ['latin'], variable: '--font-source-sans-3', display: 'swap', weight: ['400', '700'] });
const inter = Inter({ subsets: ['latin'], variable: '--font-inter', display: 'swap', weight: ['400', '500', '700'] });


export const metadata: Metadata = {
  title: 'Kiqi!',
  description: 'Your portal to a universe of stories at Kiqi!.',
  icons: {
    icon: '/favicon.ico', // Assumes favicon.ico is in app/favicon.ico
    apple: '/apple-touch-icon.png', // Assumes apple-touch-icon.png is in app/apple-touch-icon.png
    shortcut: '/favicon.ico', // Assumes favicon.ico is in app/favicon.ico
  },
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
          ${GeistSans.variable} 
          ${GeistMono.variable} 
          ${lora.variable}
          ${merriweather.variable}
          ${notoSerif.variable}
          ${ptSerif.variable}
          ${ebGaramond.variable}
          ${vollkorn.variable}
          ${bitter.variable}
          ${arimo.variable}
          ${tinos.variable}
          ${cousine.variable}
          ${openSans.variable}
          ${lato.variable}
          ${roboto.variable}
          ${sourceSans3.variable} 
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
          <CustomThemeProvider>
            <ContentFilterProvider>
                <LikedCommentsProvider>
                  <ReaderSettingsProvider>
                    <AppHeader />
                    <main className="flex-grow container mx-auto px-4 py-8">
                      {children}
                    </main>
                    <Toaster />
                  </ReaderSettingsProvider>
                </LikedCommentsProvider>
            </ContentFilterProvider>
          </CustomThemeProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
    
