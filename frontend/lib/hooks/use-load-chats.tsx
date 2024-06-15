'use client';

import React from 'react';

import { Chat } from '@/lib/types';

interface LoadChatContext {
  chatList?: Chat[];
  setChatList: (chats: Chat[]) => void;
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
  const [chatList, setChatList] = React.useState<Chat[]>();

  return (
    <LoadChatContext.Provider value={{ chatList, setChatList }}>
      {children}
    </LoadChatContext.Provider>
  );
}
