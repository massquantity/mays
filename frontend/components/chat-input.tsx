import * as React from 'react';
import { ArrowUp } from 'lucide-react';

import ChatActions from '@/components/chat-actions';
import FileUploader from '@/components/file-uploader';
import { Input } from '@/components/input';
import { Button } from '@/components/ui/button';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { ChatHandler } from '@/lib/types';
import { cn } from '@/lib/utils';

export default function ChatInput(
  props: Pick<
    ChatHandler,
    'messages' | 'input' | 'isLoading' | 'handleSubmit' | 'handleInputChange' | 'stop' | 'reload'
  >
) {
  const messageLength = props.messages.length;
  const lastMessage = props.messages[messageLength - 1];
  const isLastMessageFromAssistant = messageLength > 0 && lastMessage?.role !== 'user';
  const showStop = props.stop && props.isLoading;
  const showReload = props.reload && !props.isLoading && isLastMessageFromAssistant;

  const handleKeyDown = async (event: React.KeyboardEvent<HTMLInputElement>) => {
    if (event.key === 'Enter') {
      event.preventDefault();
      props.handleSubmit(event as unknown as React.FormEvent<HTMLFormElement>);
    }
  };

  return (
    <form
      onSubmit={props.handleSubmit}
      className="fixed inset-x-0 bottom-8 w-full duration-300 ease-in-out animate-in peer-[[data-param=open]]:group-[]:lg:pr-[250px] peer-[[data-state=open]]:group-[]:lg:pl-[250px] peer-[[data-param=open]]:group-[]:xl:pr-[300px] peer-[[data-state=open]]:group-[]:xl:pl-[300px]"
    >
      <div className="flex justify-center py-2">
        <ChatActions
          reload={props.reload}
          stop={props.stop}
          showStop={showStop}
          showReload={showReload}
        />
      </div>
      <div className="mx-auto flex gap-2 rounded-full bg-gray-200 dark:bg-muted sm:max-w-4xl sm:p-4">
        <Input
          autoFocus
          name="message"
          placeholder="Send messages or upload files(txt, pdf, docx)..."
          className="flex-1"
          value={props.input}
          onChange={props.handleInputChange}
          onKeyDown={handleKeyDown}
        />
        <FileUploader />
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              type="submit"
              variant="secondary"
              size="icon"
              className={cn(
                'rounded-full bg-slate-100 dark:text-muted dark:hover:bg-foreground',
                props.input &&
                  !props.isLoading &&
                  'bg-stone-800/80 text-background hover:bg-foreground dark:bg-background dark:text-foreground dark:hover:bg-background'
              )}
              disabled={props.isLoading}
            >
              <ArrowUp />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Send message</TooltipContent>
        </Tooltip>
      </div>
    </form>
  );
}
