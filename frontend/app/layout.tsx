import * as React from 'react';
import type { Metadata } from 'next';
import { Inter } from 'next/font/google';

import '@/app/globals.css';
import { Providers } from '@/components/providers';
import { Header } from '@/components/header';
import { TailwindIndicator } from '@/components/tailwind-indicator';
import { cn } from '@/lib/utils';

const inter = Inter({ subsets: ['latin'], display: 'swap', variable: '--font-sans' });

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
      <body className={cn('font-sans antialiased', inter.variable)}>
        <Providers attribute="class" defaultTheme="system" enableSystem disableTransitionOnChange>
          <div className="flex min-h-screen flex-col">
            <Header />
            <main>{children}</main>
          </div>
          <TailwindIndicator />
        </Providers>
      </body>
    </html>
  );
}
