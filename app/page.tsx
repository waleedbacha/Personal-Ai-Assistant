"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Hero } from "@/components/Hero";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ModeChips } from "@/components/ModeChips";
import { HistoryDrawer } from "@/components/HistoryDrawer";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useHaptics } from "@/hooks/useHaptics";
import { detectLanguage } from "@/lib/detectLanguage";
import { parseCardMarker } from "@/lib/cardMarkers";
import type { ChatMode } from "@/lib/buildSystemPrompt";

export default function Home() {
  const {
    isSupported: isSpeechSupported,
    isMuted,
    setIsMuted,
    speak,
    stop: stopTts,
  } = useSpeechSynthesis();

  const { tap: hapticTap } = useHaptics();

  const speakRef = useRef(speak);
  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

  const langQueueRef = useRef<string[]>([]);
  const [mode, setMode] = useState<ChatMode>("default");

  // ---------- History ----------
  const {
    sessions,
    isLoaded: historyLoaded,
    saveSession,
    deleteSession,
    clearAll: clearAllSessions,
    getSession,
  } = useChatHistory();

  const [historyOpen, setHistoryOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // ---------- Chat ----------
  const { messages, sendMessage, status, setMessages, regenerate, stop } =
    useChat({
      onFinish: ({ message }) => {
        hapticTap();

        const raw =
          message.parts
            ?.filter((p: any) => p.type === "text")
            .map((p: any) => p.text)
            .join("") ?? "";

        const { text: spoken } = parseCardMarker(raw);
        const lang = langQueueRef.current.shift() ?? "en";
        if (spoken) speakRef.current(spoken, lang);
      },
    });

  const isLoading = status === "submitted" || status === "streaming";
  const bottomRef = useRef<HTMLDivElement>(null);
  const hasStarted = messages.length > 0;

  const modeRef = useRef<ChatMode>(mode);
  useEffect(() => {
    modeRef.current = mode;
  }, [mode]);

  // ---------- Send / regenerate ----------
  const handleSend = useCallback(
    (text: string) => {
      hapticTap();
      const lang = detectLanguage(text);
      langQueueRef.current.push(lang);
      sendMessage({ text }, { body: { mode: modeRef.current } });
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sendMessage],
  );

  const handleStop = useCallback(() => {
    stop();
    stopTts();
  }, [stop, stopTts]);

  const handleRegenerate = useCallback(() => {
    stopTts();
    langQueueRef.current.push("en");
    regenerate({ body: { mode: modeRef.current } });
  }, [regenerate, stopTts]);

  const {
    isListening,
    isSupported: isMicSupported,
    start,
    stop: stopMic,
  } = useSpeechRecognition({ onResult: handleSend });

  const lastMessageId = messages[messages.length - 1]?.id ?? "";
  const lastAssistantId = [...messages]
    .reverse()
    .find((m) => m.role === "assistant")?.id;

  useEffect(() => {
    if (hasStarted) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [lastMessageId, hasStarted]);

  // ---------- Save current session when messages settle ----------
  useEffect(() => {
    if (!historyLoaded) return;
    if (status !== "ready") return;
    if (!hasStarted) return;

    if (activeSessionId) {
      deleteSession(activeSessionId);
    }

    const savedId = saveSession(messages, mode);
    if (savedId) setActiveSessionId(savedId);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status, messages.length, historyLoaded]);

  // ---------- Handlers ----------
  const handleNewChat = useCallback(() => {
    stopTts();
    if (isListening) stopMic();
    setMessages([]);
    setMode("default");
    setActiveSessionId(null);
    langQueueRef.current = [];
  }, [setMessages, stopTts, stopMic, isListening]);

  const handleSelectSession = useCallback(
    (id: string) => {
      const session = getSession(id);
      if (!session) return;

      stopTts();
      if (isListening) stopMic();

      setMessages(session.messages);
      setMode(session.mode);
      setActiveSessionId(session.id);
      setHistoryOpen(false);
      langQueueRef.current = [];
    },
    [getSession, setMessages, stopTts, stopMic, isListening],
  );

  const handleDeleteSession = useCallback(
    (id: string) => {
      deleteSession(id);
      if (id === activeSessionId) {
        setActiveSessionId(null);
      }
    },
    [deleteSession, activeSessionId],
  );

  const handleClearAll = useCallback(() => {
    clearAllSessions();
    setActiveSessionId(null);
  }, [clearAllSessions]);

  return (
    <main className="flex h-dvh flex-col bg-bg text-fg">
      {!hasStarted ? (
        <div key="hero" className="animate-fade-in flex flex-1 flex-col">
          <Hero
            onSend={handleSend}
            isLoading={isLoading}
            isListening={isListening}
            isMicSupported={isMicSupported}
            onMicToggle={() => (isListening ? stopMic() : start())}
            isSpeechSupported={isSpeechSupported}
            isMuted={isMuted}
            onMuteToggle={() => setIsMuted((v) => !v)}
            mode={mode}
            onModeChange={setMode}
            onOpenHistory={() => setHistoryOpen(true)}
            historyCount={sessions.length}
          />
        </div>
      ) : (
        <div key="chat" className="animate-fade-in flex flex-1 flex-col">
          <ChatHeader
            isLoading={isLoading}
            onNewChat={handleNewChat}
            onOpenHistory={() => setHistoryOpen(true)}
            historyCount={sessions.length}
          />

          <div className="flex-1 overflow-y-auto px-3 py-5 sm:px-6 sm:py-6">
            <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
              {messages.map((m) => (
                <ChatMessage
                  key={m.id}
                  message={m}
                  onAsk={handleSend}
                  isLastAssistant={m.id === lastAssistantId}
                  isLoading={isLoading}
                  onRegenerate={handleRegenerate}
                />
              ))}
              <div ref={bottomRef} />
            </div>
          </div>

          <div className="mx-auto w-full max-w-3xl">
            <div className="px-3 pt-2 sm:px-6">
              <ModeChips mode={mode} onChange={setMode} disabled={isLoading} />
            </div>
            <ChatInput
              variant="bottom"
              onSend={handleSend}
              onStop={handleStop}
              isLoading={isLoading}
              isListening={isListening}
              isMicSupported={isMicSupported}
              onMicToggle={() => (isListening ? stopMic() : start())}
              isSpeechSupported={isSpeechSupported}
              isMuted={isMuted}
              onMuteToggle={() => setIsMuted((v) => !v)}
            />
          </div>
        </div>
      )}

      <HistoryDrawer
        open={historyOpen}
        onClose={() => setHistoryOpen(false)}
        sessions={sessions}
        activeId={activeSessionId}
        onSelect={handleSelectSession}
        onDelete={handleDeleteSession}
        onClearAll={handleClearAll}
      />
    </main>
  );
}
