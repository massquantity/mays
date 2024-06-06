import * as React from 'react';
import { MessageCircle } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

import { SidebarActions } from '@/components/sidebar-actions';
import { buttonVariants } from '@/components/ui/button';
import { type Chat } from '@/lib/types';
import { cn } from '@/lib/utils';

interface SidebarItemProps {
  index: number;
  chat: Chat;
}

export function SidebarItem({ index, chat }: SidebarItemProps) {
  const pathname = usePathname();
  const isActive = pathname === chat.path;

  return (
    <div className="relative h-8">
      <div className="absolute left-2 top-2 flex size-6 items-center justify-center">
        <MessageCircle className="mr-2" />
      </div>
      <Link
        href={chat.path}
        className={cn(
          buttonVariants({ variant: 'ghost' }),
          'w-full px-8 transition-colors hover:bg-zinc-200/40 dark:hover:bg-zinc-300/10',
          isActive && 'bg-zinc-200 pr-16 font-semibold dark:bg-zinc-800'
        )}
      >
        <div
          className="relative max-h-5 flex-1 select-none overflow-hidden text-ellipsis break-all"
          title={chat.title}
        >
          <span className="whitespace-nowrap">
            <span>{chat.title}</span>
          </span>
        </div>
      </Link>
      <div className="absolute right-2 top-2">
        <SidebarActions chat={chat} />
      </div>
    </div>
  );
}
