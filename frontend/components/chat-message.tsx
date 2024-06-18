import { Message } from 'ai';
import { Check, Copy, X } from 'lucide-react';

import { Button } from '@/components/ui/button';
import ChatAvatar from '@/components/chat-avatar';
import Markdown from '@/components/markdown';
import { useCopyToClipboard } from '@/lib/hooks/use-copy-to-clipboard';

interface ChatMessageProps {
  chatMessage: Message;
  isLoading: boolean;
  isLastMessage: boolean;
  handleDelete: (messageId: string) => void;
}

export default function ChatMessage({
  chatMessage,
  isLoading,
  isLastMessage,
  handleDelete,
}: ChatMessageProps) {
  const { isCopied, copyToClipboard } = useCopyToClipboard({ timeout: 2000 });
  const showActions = !(isLastMessage && isLoading);

  return (
    <div className="flex items-start space-x-4 pr-5 pt-5">
      <ChatAvatar role={chatMessage.role} />
      <div className="group/message flex flex-1 flex-col justify-between space-y-2">
        <div className="flex-1">
          <Markdown content={chatMessage.content} />
        </div>
        {showActions && (
          <div className="flex justify-start gap-2">
            <Button
              onClick={() => copyToClipboard(chatMessage.content)}
              size="icon"
              variant="ghost"
              className="size-4 opacity-40 group-hover/message:opacity-100"
            >
              {isCopied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
            </Button>
            <Button
              onClick={() => handleDelete(chatMessage.id)}
              size="icon"
              variant="ghost"
              className="size-4 opacity-40 group-hover/message:opacity-100"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
