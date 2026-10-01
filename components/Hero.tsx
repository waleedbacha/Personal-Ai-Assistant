'use client';

import { useState } from 'react';
import { persona } from '@/data/persona';
import { ChatInput } from './ChatInput';
import { SuggestionChips } from './SuggestionChips';

type Props = {
  onSend: (text: string) => void;
  isLoading: boolean;
  isListening: boolean;
  isMicSupported: boolean;
  onMicToggle: () => void;
  isSpeechSupported: boolean;
  isMuted: boolean;
  onMuteToggle: () => void;
};

export function Hero({
  onSend,
  isLoading,
  isListening,
  isMicSupported,
  onMicToggle,
  isSpeechSupported,
  isMuted,
  onMuteToggle,
}: Props) {
  const [logoFailed, setLogoFailed] = useState(false);

  const initials = persona.name
    .split(' ')
    .map(n => n[0])
    .join('')
    .slice(0, 2)
    .toUpperCase();

  const hasLogo = Boolean(persona.logo) && !logoFailed;
  const eyebrowColor = persona.eyebrowColor || '#3b82f6';
  const eyebrowText = persona.eyebrow || '';

  return (
    <div className="bg-glow flex flex-1 flex-col items-center justify-center px-4 py-12 sm:px-6">
      <div className="w-full max-w-3xl text-center">
{/* ============ ANIMATED EYEBROW ============ */}
<div className="mb-6 flex flex-col items-center" aria-label={eyebrowText}>
  <h2
    className="text-xs font-semibold uppercase tracking-[0.35em] sm:text-sm"
    style={{ color: eyebrowColor }}
  >
    {eyebrowText.split('').map((char, i) => (
      <span
        key={`${char}-${i}`}
        className="eyebrow-letter"
        style={{
          // Negative delay = starts mid-cycle, so it looks like
          // a wave already rolling, not a synchronized start.
          animationDelay: `${-(i * 0.08)}s`,
        }}
      >
        {char === ' ' ? '\u00A0' : char}
      </span>
    ))}
  </h2>

  <span
    className="eyebrow-underline mt-3 block h-[2px] w-16 rounded-full sm:w-24"
    style={{ backgroundColor: eyebrowColor }}
  />
</div>
{/* ============ END EYEBROW ============ */}

        {/* Logo */}
        <div className="animate-fade-in-scale stagger-1 flex justify-center">
          {hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={persona.logo}
              alt={persona.name}
              onError={() => setLogoFailed(true)}
              className="h-32 w-auto max-w-[90vw] object-contain sm:h-44 lg:h-56"
            />
          ) : (
            <h1 className="font-serif text-4xl font-bold leading-tight text-fg sm:text-6xl lg:text-7xl">
              {persona.name}
            </h1>
          )}
        </div>

        {/* Tagline */}
        <p className="animate-fade-in-up stagger-3 mx-auto mt-8 max-w-xl text-base leading-relaxed text-muted sm:text-lg">
          {persona.tagline}
        </p>

        {/* Input pill */}
        <div className="animate-fade-in-up stagger-4 mt-10">
          <ChatInput
            variant="hero"
            onSend={onSend}
            isLoading={isLoading}
            isListening={isListening}
            isMicSupported={isMicSupported}
            onMicToggle={onMicToggle}
            isSpeechSupported={isSpeechSupported}
            isMuted={isMuted}
            onMuteToggle={onMuteToggle}
          />
        </div>

        {/* Suggestion chips */}
        <div className="animate-fade-in-up stagger-5 mt-6">
          <SuggestionChips
            suggestions={persona.suggestions}
            onSelect={onSend}
            disabled={isLoading}
          />
        </div>

        {/* Footer hint */}
        <p className="animate-fade-in stagger-6 mt-12 text-xs text-muted/60">
          Powered by AI · {persona.role}
        </p>
      </div>

      {/* Floating top-left mini-brand */}
      <div className="animate-fade-in-down stagger-2 pointer-events-none fixed top-6 left-6 hidden sm:block">
        <div className="flex items-center gap-3">
          {hasLogo ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={persona.logo}
              alt={persona.name}
              onError={() => setLogoFailed(true)}
              className="h-9 w-auto max-w-[160px] object-contain"
            />
          ) : (
            <>
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-accent/10 text-sm font-semibold text-accent ring-1 ring-accent/30">
                {initials}
              </div>
              <div className="text-sm">
                <p className="font-medium text-fg">{persona.name}</p>
                <p className="text-xs text-muted">{persona.role}</p>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}