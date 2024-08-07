'use client';

import * as React from 'react';
import { PanelLeft, PanelRight } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { useSidebar } from '@/lib/hooks/use-sidebar';

export function SidebarToggle() {
  const { toggleSidebar } = useSidebar();

  return (
    <Button variant="ghost" className="hidden size-9 p-0 lg:flex" onClick={() => toggleSidebar()}>
      <PanelLeft className="h-6 w-6" />
    </Button>
  );
}

export function ParamToggle() {
  const { toggleParams } = useSidebar();

  return (
    <Button variant="ghost" className="hidden size-9 p-0 lg:flex" onClick={toggleParams}>
      <PanelRight className="h-6 w-6" />
    </Button>
  );
}
