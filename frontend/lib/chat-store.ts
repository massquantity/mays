import { Message } from 'ai';
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

import { Chat } from '@/lib/types';
import { cleanCache } from '@/lib/clean-cache';

interface ChatState {
  chats: Record<string, Chat>;
}

interface ChatAction {
  saveChat: (chatId: string, messages: Message[]) => void;
  loadChat: (chatId: string) => Chat | null;
  loadAllChats: () => Chat[];
  removeChat: (chatId: string, path: string) => void;
  clearAllChats: () => void;
}

export const useChatStore = create<ChatState & ChatAction>()(
  persist(
    (set, get) => ({
      chats: {},
      saveChat: (chatId: string, messages: Message[]) => {
        if (messages.length > 0) {
          const title = messages[0].content.substring(0, 100);
          const createdAt = Date.now();
          const path = `/chat/${chatId}`;
          const chat = {
            chatId,
            title,
            createdAt,
            path,
            messages,
          };
          const key = `chat:${chatId}`;
          const chats = get().chats;
          chats[key] = chat;
          set(() => ({ chats }));
        }
      },
      loadChat: (chatId: string) => {
        const key = `chat:${chatId}`;
        return get().chats[key] ?? undefined;
      },
      loadAllChats: () => {
        const chats = Object.values(get().chats);
        return chats.sort((a, b) => b.createdAt - a.createdAt);
      },
      removeChat: (chatId: string, path: string) => {
        let key = `chat:${chatId}`;
        const chats = get().chats;
        delete chats[key];
        cleanCache(path);
        set(() => ({ chats }));
      },
      clearAllChats: () => {
        const chats = Object.values(get().chats);
        chats.forEach((chat) => cleanCache(chat.path));
        set(() => ({ chats: {} }));
      },
    }),
    {
      name: 'chat-store',
    }
  )
);
