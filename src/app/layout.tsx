import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import { Lora } from 'next/font/google';
import './globals.css';
import { ThemeProvider } from '@/components/providers/theme-provider';
import { ReaderSettingsProvider } from '@/contexts/ReaderSettingsContext';
import { Toaster } from '@/components/ui/toaster';
import AppHeader from '@/components/layout/AppHeader';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

const lora = Lora({
  subsets: ['latin'],
  variable: '--font-lora',
  display: 'swap',
  weight: ['400', '700'],
});

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
      <body className={`${geistSans.variable} ${geistMono.variable} ${lora.variable} antialiased flex flex-col min-h-screen`}>
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
            {/* Footer removed */}
            <Toaster />
          </ReaderSettingsProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
