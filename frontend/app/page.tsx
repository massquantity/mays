import ChatSection from "@/app/components/chat-section";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center gap-10 p-24 background-gradient">
      <h1 className="font-bold text-lg md:text-4xl">Chat with LLM</h1>
      <ChatSection />
    </main>
  );
}
