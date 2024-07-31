'use client';

import * as React from 'react';

import { useSidebar } from '@/lib/hooks/use-sidebar';
import { cn } from '@/lib/utils';

export interface SidebarProps extends React.ComponentProps<'div'> {}

export function SidebarState({ className, children }: SidebarProps) {
  const { isSidebarOpen, isLoading } = useSidebar();

  return (
    <div
      data-state={isSidebarOpen && !isLoading ? 'open' : 'close'}
      className={cn(className, 'h-full dark:bg-zinc-950')}
    >
      {children}
    </div>
  );
}

export function ParamState({
  className,
  children,
}: {
  className: string;
  children: React.ReactNode;
}) {
  const { isParamOpen } = useSidebar();

  return (
    <div
      data-param={isParamOpen ? 'open' : 'close'}
      className={cn(className, 'h-full dark:bg-zinc-950')}
    >
      {children}
    </div>
  );
}
