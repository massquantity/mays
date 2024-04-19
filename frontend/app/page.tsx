import ChatSection from '@/app/components/chat-section';

export default function Home() {
  return (
    <main className="background-gradient flex min-h-screen flex-col items-center gap-10 p-24">
      <h1 className="text-lg font-bold md:text-4xl">Chat with LLM</h1>
      <ChatSection />
    </main>
  );
}
