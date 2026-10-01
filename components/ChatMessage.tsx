'use client';

import { UIMessage } from 'ai';

type Props = { message: UIMessage };

function isRTL(text: string): boolean {
  const rtlRegex =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return rtlRegex.test(text);
}

export function ChatMessage({ message }: Props) {
  const isUser = message.role === 'user';
  const text =
    message.parts
      ?.filter((p: any) => p.type === 'text')
      .map((p: any) => p.text)
      .join('') ?? '';

  const rtl = text.length > 0 && isRTL(text);

  return (
    <div
      className={`animate-fade-in-up flex w-full ${
        isUser ? 'justify-end' : 'justify-start'
      }`}
    >
      <div
        dir={rtl ? 'rtl' : 'ltr'}
        className={`max-w-[88%] whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-shadow hover:shadow-md sm:max-w-[72%] sm:text-[15px] ${
          isUser
            ? 'rounded-br-md bg-accent font-medium text-bg'
            : 'rounded-bl-md border border-border bg-bg-soft text-fg'
        } ${rtl ? 'text-right' : 'text-left'}`}
        style={
          rtl
            ? { fontFamily: 'var(--font-arabic), var(--font-sans), sans-serif' }
            : undefined
        }
      >
        {text || <TypingDots />}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <span className="inline-flex h-5 items-center gap-1">
      <span
        className="h-1.5 w-1.5 rounded-full bg-muted"
        style={{ animation: 'dotPulse 1.2s infinite ease-in-out', animationDelay: '0s' }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-muted"
        style={{ animation: 'dotPulse 1.2s infinite ease-in-out', animationDelay: '0.15s' }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-muted"
        style={{ animation: 'dotPulse 1.2s infinite ease-in-out', animationDelay: '0.3s' }}
      />
    </span>
  );
}