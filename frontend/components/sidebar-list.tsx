'use client';

import { SidebarItem } from '@/components/sidebar-item';
import { useLoadChat } from '@/lib/hooks/use-load-chats';

export function SidebarList() {
  const { chatList } = useLoadChat();

  return (
    <div className="flex flex-1 flex-col overflow-hidden">
      <div className="flex-1 overflow-auto">
        {chatList?.length ? (
          <div className="space-y-2 px-2">
            {chatList.map((chat, index) => (
              <SidebarItem key={chat.id} index={index} chat={chat} />
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <p className="text-sm text-muted-foreground">No Chat History</p>
          </div>
        )}
      </div>
    </div>
  );
}
