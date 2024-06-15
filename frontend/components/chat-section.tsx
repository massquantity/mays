'use client';

import { Message } from 'ai';
import { useChat } from 'ai/react';
import { usePathname } from 'next/navigation';
import React, { useEffect, useReducer, useState } from 'react';

import ChatInput from '@/components/chat-input';
import ChatMessages from '@/components/chat-messages';
import { loadChat, saveChat } from '@/lib/history-persisting';
import { useLoadChat } from '@/lib/hooks/use-load-chats';

interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[];
  id: string;
}

export default function ChatSection({ id }: ChatProps) {
  const path = usePathname();
  const isNewChat = path === '/';
  const [initialMessages, setInitialMessages] = useState<Message[]>();
  const [isMessageEnd, setMessageEnd] = useReducer((_: boolean, action: boolean) => action, false);
  const [initChats, setInitChat] = useState<boolean>(true);
  const { setChatList } = useLoadChat();

  useEffect(() => {
    if (isNewChat) {
      setInitialMessages(undefined);
    } else {
      const chat = loadChat(id);
      const m = chat?.messages ?? undefined;
      setInitialMessages(m);
    }
  }, [id, isNewChat]);

  const { messages, input, isLoading, handleSubmit, handleInputChange, reload, stop } = useChat({
    api: 'http://localhost:8000/api/rag',
    initialMessages,
    id,
    onResponse(response) {
      if (response.status !== 200) {
        window.alert(response.statusText);
      }
    },
    onFinish(_message) {
      setMessageEnd(true);
      if (!path.includes('chat')) {
        setInitChat(true);
        window.history.pushState({}, '', `/chat/${id}`);
      }
    },
  });

  useEffect(() => {
    if (isMessageEnd) {
      saveChat(id, messages);
    }
    if (initChats) {
      const chatList = loadChats();
      setChatList(chatList);
    }
    setMessageEnd(false);
    setInitChat(false);
  }, [isMessageEnd, initChats]);

  return (
    <>
      <div className="pb-20 pt-4 md:pt-10">
        {messages.length > 0 && (
          <ChatMessages messages={messages} isLoading={isLoading} reload={reload} stop={stop} />
        )}
      </div>
      <ChatInput
        input={input}
        handleSubmit={handleSubmit}
        handleInputChange={handleInputChange}
        isLoading={isLoading}
      />
    </>
  );
}
