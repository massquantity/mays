import ChatSection from '@/components/chat-section';
import { nanoid } from '@/lib/utils';

export default function Home() {
  const id = nanoid();
  // console.log(`home page id: ${id}`)
  return <ChatSection id={id} />;
}
