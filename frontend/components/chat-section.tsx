'use client';

import { Message } from 'ai';
import React from 'react';
import { toast } from 'react-hot-toast';

import ChatInput from '@/components/chat-input';
import ChatMessages from '@/components/chat-messages';
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor';
import { useChatStore } from '@/lib/chat-store';
import { API_LLM_MODELS } from '@/lib/constant';
import { useChatSession } from '@/lib/hooks/use-chat-session';
import { useParamStore } from '@/lib/param-store';

interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[];
  chatId: string;
}

export default function ChatSection({ chatId }: ChatProps) {
  const saveChat = useChatStore((state) => state.saveChat);
  const { llm, llmApiKey } = useParamStore((state) => state);

  const {
    messages,
    setMessages,
    input,
    isLoading,
    handleSubmit: onSubmit,
    handleInputChange,
    reload,
    stop,
  } = useChatSession(chatId);

  const handleDelete = (messageId: string) => {
    const newMessages = messages.filter((m) => m.id !== messageId);
    setMessages(newMessages);
    saveChat(chatId, newMessages);
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!llm) {
      toast.error(`No LLM model is selected. Please select a model on the right.`);
      throw new Error(`No LLM model is selected.`);
    }
    if (API_LLM_MODELS.includes(llm) && !llmApiKey) {
      toast.error(`No LLM API key is provided. Please provide an API key to use ${llm}.`, {
        duration: 5000,
      });
      throw new Error(`No LLM API key is provided.`);
    }
    onSubmit(e);
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
