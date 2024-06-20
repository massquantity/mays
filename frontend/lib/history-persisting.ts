'use client';

import { Message } from 'ai';

import { cleanCache } from '@/lib/clean-cache';
import { Chat } from '@/lib/types';

export function saveChat(chatId: string, messages: Message[]) {
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
    localStorage.setItem(`chat:${chatId}`, JSON.stringify(chat));
  }
}

export function loadChat(chatId: string): Chat | null {
  const key = `chat:${chatId}`;
  const value = localStorage.getItem(key);
  return value ? (JSON.parse(value) as Chat) : null;
}

export function loadAllChats(): Chat[] {
  let chats = [];
  for (let i = 0; i < localStorage.length; i++) {
    let key = localStorage.key(i)!;
    if (key.startsWith('chat')) {
      let value = localStorage.getItem(key)!;
      let chat = JSON.parse(value) as Chat;
      chats.push(chat);
    }
  }
  return chats.sort((a, b) => b.createdAt - a.createdAt);
}

export function removeChat(chatId: string, path: string) {
  let key = `chat:${chatId}`;
  localStorage.removeItem(key);
  cleanCache(path);
}

export function clearAllChats() {
  let keys = [];
  for (let i = 0; i < localStorage.length; i++) {
    let key = localStorage.key(i);
    if (key && key.startsWith('chat')) {
      keys.push(key);
    }
  }
  for (const key of keys) {
    const value = localStorage.getItem(key);
    const chat = JSON.parse(value!) as Chat;
    cleanCache(chat.path);
    localStorage.removeItem(key);
  }
}
