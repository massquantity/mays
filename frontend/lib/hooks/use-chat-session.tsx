'use client';

import { Message } from 'ai';
import { useChat } from 'ai/react';
import { usePathname } from 'next/navigation';
import { toast } from 'react-hot-toast';
import { useCallback, useEffect, useReducer, useState } from 'react';

import { useChatStore } from '@/lib/chat-store';
import { useLoadChat } from '@/lib/hooks/use-load-chats';

export function useChatSession(chatId: string) {
  const path = usePathname();
  const isNewChat = path === '/';
  const [initialMessages, setInitialMessages] = useState<Message[]>();
  const [isMessageEnd, setMessageEnd] = useReducer((_: boolean, action: boolean) => action, false);
  const [initSidebar, setInitSidebar] = useState<boolean>(true);
  const { setChatList } = useLoadChat();
  const { saveChat, loadChat, loadAllChats } = useChatStore((state) => state);

  const loadChatHistory = useCallback(() => {
    if (isNewChat) {
      setInitialMessages(undefined);
    } else {
      const chat = loadChat(chatId);
      const m = chat?.messages ?? undefined;
      setInitialMessages(m);
    }
  }, [chatId, isNewChat, setInitialMessages]);

  useEffect(() => {
    loadChatHistory();
  }, [loadChatHistory]);

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
        toast.error('Failed to fetch rag result from backend.');
      },
      onFinish: () => {
        setMessageEnd(true);
        if (!path.includes('chat')) {
          setInitSidebar(true);
          window.history.pushState({}, '', `/chat/${chatId}`);
        }
      },
    });

  const saveChatHistory = useCallback(() => {
    saveChat(chatId, messages);
  }, [chatId, messages, saveChat]);

  const initSidebarList = useCallback(() => {
    const chatList = loadAllChats();
    setChatList(chatList);
  }, [loadAllChats, setChatList]);

  useEffect(() => {
    if (isMessageEnd) {
      saveChatHistory();
      setMessageEnd(false);
    }
    if (initSidebar) {
      initSidebarList();
      setInitSidebar(false);
    }
  }, [isMessageEnd, saveChatHistory, initSidebar, initSidebarList]);

  return {
    messages,
    setMessages,
    input,
    isLoading,
    handleSubmit,
    handleInputChange,
    reload,
    stop,
  };
}
