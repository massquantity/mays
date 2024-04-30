'use client';

import { useChat } from 'ai/react';

import ChatInput from '@/components/chat-input';
import ChatMessages from '@/components/chat-messages';

export default function ChatSection() {
  const { messages, input, isLoading, handleSubmit, handleInputChange, reload, stop } = useChat({
    api: 'http://localhost:8000/api/rag',
  });

  return (
    <div className="w-full max-w-5xl space-y-4">
      <ChatMessages messages={messages} isLoading={isLoading} reload={reload} stop={stop} />
      <ChatInput
        input={input}
        handleSubmit={handleSubmit}
        handleInputChange={handleInputChange}
        isLoading={isLoading}
      />
    </div>
  );
}
