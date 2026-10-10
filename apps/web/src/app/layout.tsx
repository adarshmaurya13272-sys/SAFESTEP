import { Metadata, Viewport } from 'next';
import { Inter, Space_Grotesk } from 'next/font/google';
import { ThemeProvider } from 'next-themes';
import { Toaster } from 'sonner';
import './globals.css';
import QueryProvider from '@/providers/query-provider';
import ServiceWorkerRegistrar from '@/components/common/service-worker-registrar';

const inter = Inter({ subsets: ['latin'], variable: '--font-inter' });
const spaceGrotesk = Space_Grotesk({ subsets: ['latin'], variable: '--font-space' });

export const metadata: Metadata = {
  title: {
    default: 'SAFESTEP — Safety Navigation',
    template: '%s · SAFESTEP',
  },
  description: 'Safe routes, live location sharing with trusted contacts, and one-tap SOS assistance.',
  manifest: '/manifest.json',
  icons: {
    icon: [{ url: '/icon.svg', type: 'image/svg+xml' }],
    apple: [{ url: '/icon.svg', type: 'image/svg+xml' }],
  },
};

export const viewport: Viewport = {
  themeColor: '#0B1426',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="dark" suppressHydrationWarning>
      <body className={`${inter.variable} ${spaceGrotesk.variable} font-sans min-h-screen bg-background`}>
        <ThemeProvider attribute="class" defaultTheme="dark" forcedTheme="dark" disableTransitionOnChange>
          <QueryProvider>
            {children}
            <Toaster
              position="top-center"
              theme="dark"
              richColors
              toastOptions={{
                style: {
                  background: '#14213D',
                  border: '1px solid rgba(255,255,255,0.1)',
                  color: '#EEF3FA',
                },
              }}
            />
            <ServiceWorkerRegistrar />
          </QueryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
