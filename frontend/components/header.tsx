import { SidebarToggle } from '@/components/sidebar-toggle';

export function Header() {
  return (
    <header className="sticky top-0 z-50 flex h-16 w-full shrink-0 items-center border-b bg-gradient-to-b from-background/10 via-background/50 to-background/80 px-4 backdrop-blur-xl">
      <div className="flex-1 items-center">
        <SidebarToggle />
      </div>
      <div className="flex-auto items-center">
        <h1 className="text-lg font-bold md:text-3xl">Chat with Files</h1>
      </div>
    </header>
  );
}
