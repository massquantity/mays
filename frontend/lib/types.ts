import * as React from 'react';
import { Message } from 'ai';

export interface ChatHandler {
  messages: Message[];
  input: string;
  isLoading: boolean;
  handleSubmit: (
    e: React.FormEvent<HTMLFormElement>,
    ops?: {
      data?: any;
    }
  ) => void;
  handleInputChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDelete: (messageId: string) => void;
  reload?: () => void;
  stop?: () => void;
}

export interface Chat extends Record<string, any> {
  chatId: string;
  title: string;
  createdAt: number;
  path: string;
  messages: Message[];
}
