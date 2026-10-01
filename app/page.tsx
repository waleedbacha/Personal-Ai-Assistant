'use client';

import { useEffect, useRef, useCallback } from 'react';
import { useChat } from '@ai-sdk/react';
import { Hero } from '@/components/Hero';
import { ChatHeader } from '@/components/ChatHeader';
import { ChatMessage } from '@/components/ChatMessage';
import { ChatInput } from '@/components/ChatInput';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useSpeechSynthesis } from '@/hooks/useSpeechSynthesis';
import { detectLanguage } from '@/lib/detectLanguage';

export default function Home() {
  const {
    isSupported: isSpeechSupported,
    isMuted,
    setIsMuted,
    speak,
    stop: stopTts,
  } = useSpeechSynthesis();

  const speakRef = useRef(speak);
  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

  const langQueueRef = useRef<string[]>([]);

  const { messages, sendMessage, status, setMessages } = useChat({
    onFinish: ({ message }) => {
      const reply = message.parts
        ?.filter((p: any) => p.type === 'text')
        .map((p: any) => p.text)
        .join('');
      const lang = langQueueRef.current.shift() ?? 'en';
      if (reply) speakRef.current(reply, lang);
    },
  });

  const isLoading = status === 'submitted' || status === 'streaming';
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasStarted = messages.length > 0;

  const handleSend = useCallback(
    (text: string) => {
      const lang = detectLanguage(text);
      langQueueRef.current.push(lang);
      sendMessage({ text });
    },
    [sendMessage]
  );

  const { isListening, isSupported: isMicSupported, start, stop } =
    useSpeechRecognition({ onResult: handleSend });

  const lastMessageId = messages[messages.length - 1]?.id ?? '';
  useEffect(() => {
    if (hasStarted) {
      bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [lastMessageId, hasStarted]);

  const handleNewChat = useCallback(() => {
    stopTts();
    if (isListening) stop();
    setMessages([]);
    langQueueRef.current = [];
  }, [setMessages, stopTts, stop, isListening]);

  return (
    <main className="flex h-dvh flex-col bg-bg text-fg">
      {!hasStarted ? (
        <div key="hero" className="animate-fade-in flex flex-1 flex-col">
          <Hero
            onSend={handleSend}
            isLoading={isLoading}
            isListening={isListening}
            isMicSupported={isMicSupported}
            onMicToggle={() => (isListening ? stop() : start())}
            isSpeechSupported={isSpeechSupported}
            isMuted={isMuted}
            onMuteToggle={() => setIsMuted(v => !v)}
          />
        </div>
      ) : (
        <div key="chat" className="animate-fade-in flex flex-1 flex-col">
          <ChatHeader isLoading={isLoading} onNewChat={handleNewChat} />

          <div className="flex-1 overflow-y-auto px-3 py-5 sm:px-6 sm:py-6">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
              {messages.map(m => (
                <ChatMessage key={m.id} message={m} />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="mx-auto w-full max-w-3xl">
            <ChatInput
              variant="bottom"
              onSend={handleSend}
              isLoading={isLoading}
              isListening={isListening}
              isMicSupported={isMicSupported}
              onMicToggle={() => (isListening ? stop() : start())}
              isSpeechSupported={isSpeechSupported}
              isMuted={isMuted}
              onMuteToggle={() => setIsMuted(v => !v)}
            />
          </div>
        </div>
      )}
    </main>
  );
}