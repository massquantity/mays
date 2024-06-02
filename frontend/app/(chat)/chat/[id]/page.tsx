import { type Metadata } from 'next';

import ChatSection from '@/components/chat-section';

interface ChatPageProps {
  params: {
    id: string;
  };
}

export function generateMetadata({ params }: ChatPageProps): Metadata {
  // const chat = loadChat(params.id);
  return {
    title: `Chat app - ${params.id}`
  }
 }

export default function ChatPage({ params }: ChatPageProps) {
  // console.log(`chat page id: ${params.id}`)
  return <ChatSection id={params.id} />;
}
