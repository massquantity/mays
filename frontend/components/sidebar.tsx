import { SidebarState } from '@/components/sidebar-state';
import { ChatHistory } from '@/components/chat-history';

export async function Sidebar() {
  return (
    <SidebarState className="peer absolute inset-y-0 z-30 hidden -translate-x-full border-r bg-zinc-100/50 duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex lg:w-[250px] xl:w-[300px]">
      <ChatHistory />
    </SidebarState>
  );
}
