'use client';

import { Message } from 'ai';
import React from 'react';

import ChatInput from '@/components/chat-input';
import ChatMessages from '@/components/chat-messages';
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor';
import { saveChat } from '@/lib/history-persisting';
import { useChatSession } from '@/lib/hooks/use-chat-session';

interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[];
  chatId: string;
}

export default function ChatSection({ chatId }: ChatProps) {
  const { messages, setMessages, input, isLoading, handleSubmit, handleInputChange, reload, stop } =
    useChatSession(chatId);

  const handleDelete = (messageId: string) => {
    const newMessages = messages.filter((m) => m.id !== messageId);
    setMessages(newMessages);
    saveChat(chatId, newMessages);
  };

  return (
    <>
      <div className="pb-40 pt-4 md:pt-10">
        {messages.length > 0 && (
          <>
            <ChatMessages
              messages={messages}
              isLoading={isLoading}
              stop={stop}
              reload={reload}
              handleDelete={handleDelete}
            />
            <ChatScrollAnchor trackVisibility={isLoading} />
          </>
        )}
      </div>
      <ChatInput
        messages={messages}
        input={input}
        handleSubmit={handleSubmit}
        handleInputChange={handleInputChange}
        isLoading={isLoading}
        stop={stop}
        reload={reload}
      />
    </>
  );
}
