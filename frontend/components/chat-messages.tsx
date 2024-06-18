import * as React from 'react';

import { LoaderCircle } from 'lucide-react';

import ChatMessage from '@/components/chat-message';
import { ChatHandler } from '@/lib/types';

export default function ChatMessages(
  props: Pick<ChatHandler, 'messages' | 'isLoading' | 'reload' | 'stop' | 'handleDelete'>
) {
  const messages = props.messages;
  const messageLength = messages.length;
  const lastMessage = messages[messageLength - 1];

  const isLastMessageFromAssistant = messageLength > 0 && lastMessage?.role !== 'user';
  const isPending = props.isLoading && !isLastMessageFromAssistant;

  return (
    <div
      className="mx-auto flex h-full max-w-4xl flex-col gap-4 divide-y overflow-y-auto pb-4 pl-[4rem]" // h-[80vh]
    >
      {messages.map((m, i) => (
        <ChatMessage
          key={m.id}
          chatMessage={m}
          isLoading={props.isLoading}
          isLastMessage={i === messages.length - 1}
          handleDelete={props.handleDelete}
        />
      ))}
      {isPending && (
        <div className="flex items-center justify-center pt-10">
          <LoaderCircle className="h-4 w-4 animate-spin" />
        </div>
      )}
    </div>
  );
}
