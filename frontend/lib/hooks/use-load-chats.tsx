'use client';

import React, { useEffect } from 'react';

import { loadChats } from '@/lib/history-persisting';
import { Chat } from '@/lib/types';

interface LoadChatContext {
  chatList?: Chat[];
  chatListNum: number;
  incrementChatNum: () => void;
}

const LoadChatContext = React.createContext<LoadChatContext | undefined>(undefined);

export function useLoadChat() {
  const context = React.useContext(LoadChatContext);
  if (!context) {
    throw new Error('`useLoadChat` must be used within a `LoadChatProvider`.');
  }
  return context;
}

export function LoadChatProvider({ children }: { children: React.ReactNode }) {
  const [chatListNum, setChatListNum] = React.useState(0);
  const [chatList, setChatList] = React.useState<Chat[]>();

  const incrementChatNum = () => setChatListNum((n) => n + 1);

  useEffect(() => {
    const chats = loadChats();
    setChatList(chats);
  }, [chatListNum]);

  return (
    <LoadChatContext.Provider value={{ chatList, chatListNum, incrementChatNum }}>
      {children}
    </LoadChatContext.Provider>
  );
}
