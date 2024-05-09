import * as React from 'react';

import { Sidebar } from '@/components/sidebar';
import { LoadChatProvider } from '@/lib/hooks/use-load-chats';

export default async function ChatLayout({ children }: { children: React.ReactNode }) {
  return (
    <LoadChatProvider>
      <div className="relative flex h-[calc(100vh_-_theme(spacing.16))] overflow-hidden bg-muted/50">
        <Sidebar />
        <div className="group w-full overflow-auto pl-0 peer-[[data-state=open]]:lg:pl-[250px] peer-[[data-state=open]]:xl:pl-[300px]">
          {children}
        </div>
      </div>
    </LoadChatProvider>
  );
}
