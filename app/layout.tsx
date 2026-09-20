import type { Metadata, Viewport } from 'next';
import './globals.css';
import SessionTimeout from './components/SessionTimeout';

export const metadata: Metadata = {
  title: 'KidProtect | Smart Safety for Every Child',
  description: 'Smart Safety for Every Child',
  manifest: '/manifest.json',
};

export const viewport: Viewport = {
  themeColor: '#0f172a',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <link rel="apple-touch-icon" href="/icons/icon-192x192.png" />
      </head>
      <body className="bg-slate-50 antialiased">
        <SessionTimeout />
        {children}
      </body>
    </html>
  );
}