import type { Metadata } from 'next';
import { Geist, Geist_Mono } from 'next/font/google';
import './globals.css';

const geistSans = Geist({
  variable: '--font-geist-sans',
  subsets: ['latin'],
});

const geistMono = Geist_Mono({
  variable: '--font-geist-mono',
  subsets: ['latin'],
});

export const metadata: Metadata = {
  title: 'qBit Mobile — qBittorrent web remote',
  description: 'A fast, touch-friendly qBittorrent remote for any mobile browser.',
  icons: {
    icon: '/icon.svg',
    shortcut: '/icon.svg',
    apple: '/apple-touch-icon.png',
  },
  manifest: '/manifest.webmanifest',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'qBit Mobile',
  },
  formatDetection: { telephone: false },
};

export const viewport = {
  themeColor: '#050505',
  viewportFit: 'cover',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{__html: `(function(){try{var mode=localStorage.getItem('qbit_appearance')||'system';var accent=localStorage.getItem('qbit_accent')||'orange';var dark=matchMedia('(prefers-color-scheme: dark)').matches;document.documentElement.dataset.mode=mode;document.documentElement.dataset.theme=mode==='system'?(dark?'dark':'light'):mode;document.documentElement.dataset.accent=accent}catch(e){}})()`}} />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
