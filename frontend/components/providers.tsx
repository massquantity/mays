'use client';

import * as React from 'react';
import { ThemeProvider as NextThemeProvider } from 'next-themes';
import { ThemeProviderProps } from 'next-themes/dist/types';

import { TooltipProvider } from '@/components/ui/tooltip';
import { SidebarProvider } from '@/lib/hooks/use-sidebar';

export function Providers({ children, ...props }: ThemeProviderProps) {
  return (
    <NextThemeProvider {...props}>
      <SidebarProvider>
        <TooltipProvider>
          {children}
        </TooltipProvider>
      </SidebarProvider>
    </NextThemeProvider>
  );
}
