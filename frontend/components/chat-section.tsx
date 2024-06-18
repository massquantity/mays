'use client';

import { Message } from 'ai';
import { useChat } from 'ai/react';
import { usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';
import React, { useEffect, useReducer, useState } from 'react';

import ChatInput from '@/components/chat-input';
import ChatMessages from '@/components/chat-messages';
import { ChatScrollAnchor } from '@/components/chat-scroll-anchor';
import { loadChat, loadChats, saveChat } from '@/lib/history-persisting';
import { useLoadChat } from '@/lib/hooks/use-load-chats';

interface ChatProps extends React.ComponentProps<'div'> {
  initialMessages?: Message[];
  chatId: string;
}

export default function ChatSection({ chatId }: ChatProps) {
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
      const chat = loadChat(chatId);
      const m = chat?.messages ?? undefined;
      setInitialMessages(m);
    }
  }, [chatId, isNewChat]);

  const { messages, setMessages, input, isLoading, handleSubmit, handleInputChange, reload, stop } =
    useChat({
      api: 'http://localhost:8000/api/rag',
      initialMessages,
      id: chatId,
      onResponse(response) {
        if (response.status !== 200) {
          throw new Error(response.statusText);
        }
      },
      onError(_error) {
        toast.error('Failed to fetch rag result from backend.')
      },
      onFinish(_message) {
        setMessageEnd(true);
        if (!path.includes('chat')) {
          setInitChat(true);
          window.history.pushState({}, '', `/chat/${chatId}`);
        }
      },
    });

  useEffect(() => {
    if (isMessageEnd) {
      saveChat(chatId, messages);
    }
    if (initChats) {
      const chatList = loadChats();
      setChatList(chatList);
    }
    setMessageEnd(false);
    setInitChat(false);
  }, [isMessageEnd, initChats]);

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
