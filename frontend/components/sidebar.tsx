import { ParamState, SidebarState } from '@/components/sidebar-state';
import { ChatHistory } from '@/components/chat-history';
import ModelSelector from '@/components/model-selector';
import ApiKeyInput from '@/components/api-key-input';
import TemperatureSelector from '@/components/temperature-selector';
import { cn } from '@/lib/utils';

export async function Sidebar() {
  return (
    <SidebarState className="peer absolute inset-y-0 z-30 hidden -translate-x-full border-r bg-zinc-100/50 duration-300 ease-in-out data-[state=open]:translate-x-0 lg:flex lg:w-[250px] xl:w-[300px]">
      <ChatHistory />
    </SidebarState>
  );
}

export function ParamSidebar({ className }: { className?: string }) {
  return (
    <ParamState
      className={cn(
        className,
        'peer absolute inset-y-0 right-0 z-30 hidden translate-x-full border-l bg-zinc-100/50 duration-300 ease-in-out data-[param=open]:translate-x-0 lg:flex lg:w-[250px] xl:w-[300px] min-[1800px]:w-[400px]'
      )}
    >
      <div className="my-4 h-full w-full flex-col space-y-8 px-4">
        <ModelSelector />
        <ApiKeyInput />
        <TemperatureSelector />
      </div>
    </ParamState>
  );
}
