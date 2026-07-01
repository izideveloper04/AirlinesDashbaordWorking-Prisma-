// app/layout.tsx
import type { Metadata } from 'next';
import { headers } from 'next/headers';
import './globals.css';
import Header from '@/components/Header';
import Footer from '@/components/Footer';

export const metadata: Metadata = {
  title: {
    default: 'Airlines Office Map — Global Airline Office Directory',
    template: '%s | Airlines Office Map',
  },
  description: 'Find airline office locations, contact numbers, and working hours worldwide.',
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const h       = await headers();
  const isAdmin = h.get('x-is-admin') === '1';

  return (
    <html lang="en" data-scroll-behavior="smooth">
      <body>
        {!isAdmin && <Header />}
        {children}
        {!isAdmin && <Footer />}
      </body>
    </html>
  );
}