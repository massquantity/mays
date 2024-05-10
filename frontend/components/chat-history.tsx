import * as React from 'react';
import { Plus } from 'lucide-react';
import Link from 'next/link';

import { cn } from '@/lib/utils';
import { buttonVariants } from '@/components/ui/button';
import { SidebarList } from '@/components/sidebar-list';

export function ChatHistory() {
  return (
    <div className="flex h-full flex-col">
      <div className="my-4 px-2">
        <Link
          href="/"
          className={cn(
            buttonVariants({ variant: 'outline' }),
            'h-10 w-full justify-start bg-zinc-50 px-4 shadow-none transition-colors hover:bg-zinc-200/40 dark:bg-zinc-900 dark:hover:bg-zinc-300/10'
          )}
        >
          <Plus className="-translate-x-2 stroke-2" />
          New Chat
        </Link>
      </div>
      <SidebarList />
    </div>
  );
}
