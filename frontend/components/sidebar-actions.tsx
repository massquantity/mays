import * as React from 'react';
import { LoaderCircle, Trash2 } from 'lucide-react';
import { usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { useChatStore } from '@/lib/chat-store';
import { Chat } from '@/lib/types';
import { cn } from '@/lib/utils';

export function SidebarActions({ chat }: { chat: Chat }) {
  const pathname = usePathname();
  const isActive = pathname === chat.path;
  const [deleteDialogOpen, setDeleteDialogOpen] = React.useState(false);
  const [isRemovePending, startRemoveTransition] = React.useTransition();
  const removeChat = useChatStore((state) => state.removeChat);

  return (
    <>
      <div>
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              className={cn(
                'size-[1.5rem] p-[0.3rem] hover:bg-zinc-200 dark:hover:bg-zinc-700',
                isActive && 'hover:bg-zinc-100 dark:hover:bg-background'
              )}
              disabled={isRemovePending}
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 />
              <span className="sr-only">Delete</span>
            </Button>
          </TooltipTrigger>
          <TooltipContent>Delete chat</TooltipContent>
        </Tooltip>
      </div>
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your chat message and remove your data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isRemovePending}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={isRemovePending}
              onClick={(event) => {
                event.preventDefault();
                startRemoveTransition(() => {
                  removeChat(chat.chatId, chat.path);
                  setDeleteDialogOpen(false);
                  window.location.reload();
                  if (isActive) {
                    window.location.replace('/');
                  }
                  toast.success(`Chat ${chat.chatId} deleted!`);
                });
              }}
            >
              {isRemovePending && <LoaderCircle className="mr-2 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
