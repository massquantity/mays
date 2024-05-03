import * as React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import '@/app/globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';

const inter = Inter({ subsets: ['latin'] });

export const metadata: Metadata = {
  title: 'Chat with Files',
  description: 'Chat with Files',
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex flex-1 flex-col bg-muted/50">{children}</main>
          </div>
        </Providers>
      </body>
    </html>
  );
}
