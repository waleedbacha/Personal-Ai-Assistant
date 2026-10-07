"use client";

import { useEffect, useRef, useCallback, useState } from "react";
import { useChat } from "@ai-sdk/react";
import { Hero } from "@/components/Hero";
import { ChatHeader } from "@/components/ChatHeader";
import { ChatMessage } from "@/components/ChatMessage";
import { ChatInput } from "@/components/ChatInput";
import { ModeChips } from "@/components/ModeChips";
import { SideMenu } from "@/components/SideMenu";
import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { useSpeechSynthesis } from "@/hooks/useSpeechSynthesis";
import { useChatHistory } from "@/hooks/useChatHistory";
import { useVisitorId } from "@/hooks/useVisitorId";
import { useReminders } from "@/hooks/useReminders";
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

  const { tap: hapticTap } = useHapticsSafe();

  const speakRef = useRef(speak);
  useEffect(() => {
    speakRef.current = speak;
  }, [speak]);

  const langQueueRef = useRef<string[]>([]);
  const [mode, setMode] = useState<ChatMode>("default");

  // ---------- Visitor + reminders ----------
  const visitorId = useVisitorId();
  const {
    items: reminders,
    dueCount,
    isLoading: remindersLoading,
    error: remindersError,
    refresh: refreshReminders,
    complete: completeReminder,
    remove: deleteReminder,
  } = useReminders(visitorId);

  // ---------- History ----------
  const {
    sessions,
    isLoaded: historyLoaded,
    saveSession,
    deleteSession,
    clearAll: clearAllSessions,
    getSession,
  } = useChatHistory();

  const [menuOpen, setMenuOpen] = useState(false);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);

  // ---------- Chat ----------
  const { messages, sendMessage, status, setMessages, regenerate, stop } =
    useChat({
      onFinish: ({ message }) => {
        hapticTap?.();

        const raw =
          message.parts
            ?.filter((p: any) => p.type === "text")
            .map((p: any) => p.text)
            .join("") ?? "";

        const { text: spoken } = parseCardMarker(raw);
        const lang = langQueueRef.current.shift() ?? "en";
        if (spoken) speakRef.current(spoken, lang);

        // Refresh reminders — the assistant may have created one
        refreshReminders();
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
      hapticTap?.();
      const lang = detectLanguage(text);
      langQueueRef.current.push(lang);
      sendMessage(
        { text },
        {
          body: { mode: modeRef.current, visitorId: visitorId ?? "anonymous" },
        },
      );
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sendMessage, visitorId],
  );

  const handleStop = useCallback(() => {
    stop();
    stopTts();
  }, [stop, stopTts]);

  const handleRegenerate = useCallback(() => {
    stopTts();
    langQueueRef.current.push("en");
    regenerate({
      body: { mode: modeRef.current, visitorId: visitorId ?? "anonymous" },
    });
  }, [regenerate, stopTts, visitorId]);

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

  // ---------- Session save ----------
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
            onOpenMenu={() => setMenuOpen(true)}
            dueRemindersCount={dueCount}
          />
        </div>
      ) : (
        <div key="chat" className="animate-fade-in flex flex-1 flex-col">
          <ChatHeader
            isLoading={isLoading}
            onNewChat={handleNewChat}
            onOpenMenu={() => setMenuOpen(true)}
            dueRemindersCount={dueCount}
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

      <SideMenu
        open={menuOpen}
        onClose={() => setMenuOpen(false)}
        reminders={reminders}
        remindersLoading={remindersLoading}
        remindersError={remindersError}
        dueCount={dueCount}
        onCompleteReminder={completeReminder}
        onDeleteReminder={deleteReminder}
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelectSession={handleSelectSession}
        onDeleteSession={handleDeleteSession}
        onClearAllSessions={handleClearAll}
        onNewChat={handleNewChat}
      />
    </main>
  );
}

// Fallback in case useHaptics isn't installed yet
function useHapticsSafe() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require("@/hooks/useHaptics");
    // eslint-disable-next-line react-hooks/rules-of-hooks
    return mod.useHaptics();
  } catch {
    return { tap: () => {}, double: () => {} };
  }
}
