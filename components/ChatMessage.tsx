"use client";

import { useState } from "react";
import { UIMessage } from "ai";
import { parseCardMarker } from "@/lib/cardMarkers";
import { resolveProjects } from "@/lib/projects";
import { ProjectCards } from "./ProjectCards";
import { Markdown } from "./Markdown";
import { ContactForm } from "./ContactForm";

type Props = {
  message: UIMessage;
  onAsk: (text: string) => void;
  isLastAssistant?: boolean;
  isLoading?: boolean;
  onRegenerate?: () => void;
};

// ============================================================
// Fallback contact text
// Shown only when the model fires showContactForm but does not
// emit a text part. Guarantees the visitor always sees the
// contact channels above the form.
// ============================================================
const FALLBACK_CONTACT_TEXT =
  "You can reach Waleed through:\n\n" +
  "• Portfolio — https://waleed-portfolio-theta.vercel.app/\n" +
  "• LinkedIn — https://www.linkedin.com/in/waleed-badshah-93b260247/\n" +
  "• Email — waleedbadshah2003@gmail.com\n\n" +
  "Or send him a message directly using the form below.";

function isRTL(text: string): boolean {
  const rtlRegex =
    /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
  return rtlRegex.test(text);
}

export function ChatMessage({
  message,
  onAsk,
  isLastAssistant = false,
  isLoading = false,
  onRegenerate,
}: Props) {
  const isUser = message.role === "user";
  const [copied, setCopied] = useState(false);

  // ============================================================
  // Extract text parts
  // ============================================================
  const textParts =
    message.parts
      ?.filter((p: any) => p && p.type === "text" && typeof p.text === "string")
      .map((p: any) => p.text)
      .join("") ?? "";

  // ============================================================
  // Detect contact tool
  // ============================================================
  const contactToolPart = message.parts?.find((p: any) => {
    if (!p || typeof p !== "object") return false;
    if (p.type === "tool-showContactForm") return true;
    if (p.type === "tool-invocation" && p.toolName === "showContactForm")
      return true;
    if (p.type === "tool-call" && p.toolName === "showContactForm") return true;
    if (p.type === "tool-input-start" && p.toolName === "showContactForm")
      return true;
    if (p.type === "tool-input-available" && p.toolName === "showContactForm")
      return true;
    if (p.toolInvocation?.toolName === "showContactForm") return true;
    return false;
  }) as any;

  const contactIntro: string | undefined =
    contactToolPart?.input?.intro ||
    contactToolPart?.args?.intro ||
    contactToolPart?.toolInvocation?.args?.intro ||
    undefined;

  // ============================================================
  // Project card markers
  // ============================================================
  const parsed = isUser
    ? { text: textParts, payload: null as string | null, pending: false }
    : parseCardMarker(textParts);

  const cards = parsed.payload ? resolveProjects(parsed.payload) : [];

  // If the model fired the contact tool but wrote no text, substitute
  // the hardcoded fallback. Otherwise use the model's text.
  const text =
    !isUser && contactToolPart && !parsed.text.trim()
      ? FALLBACK_CONTACT_TEXT
      : parsed.text;

  const rtl = text.length > 0 && isRTL(text);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    } catch {
      // clipboard blocked
    }
  };

  // Show the bubble whenever we have text OR we're not waiting on
  // a pending project marker. Contact tool fires always have text
  // now (fallback), so they always render the bubble.
  const showBubble = Boolean(text) || !parsed.pending;

  return (
    <div
      className={`group flex w-full flex-col ${
        isUser ? "items-end" : "items-start"
      }`}
    >
      {showBubble && (
        <div className="relative max-w-[88%] sm:max-w-[72%]">
          <div
            dir={rtl ? "rtl" : "ltr"}
            className={`animate-fade-in-up whitespace-pre-wrap break-words rounded-2xl px-4 py-3 text-sm leading-relaxed shadow-sm transition-shadow hover:shadow-md sm:text-[15px] ${
              isUser
                ? "rounded-br-md bg-accent font-medium text-bg"
                : "rounded-bl-md border border-border bg-bg-soft text-fg"
            } ${rtl ? "text-right" : "text-left"}`}
            style={
              rtl
                ? {
                    fontFamily:
                      "var(--font-arabic), var(--font-sans), sans-serif",
                  }
                : undefined
            }
          >
            {text ? (
              isUser ? (
                text
              ) : (
                <div className="whitespace-normal">
                  <Markdown>{text}</Markdown>
                </div>
              )
            ) : (
              !parsed.pending && <TypingDots />
            )}
          </div>

          {!isUser && text && (
            <div className="absolute -bottom-3 right-2 flex items-center gap-1 opacity-100 transition-opacity duration-200 pointer-coarse:opacity-100 pointer-fine:pointer-events-none pointer-fine:opacity-0 pointer-fine:group-hover:pointer-events-auto pointer-fine:group-hover:opacity-100">
              {" "}
              <button
                type="button"
                onClick={handleCopy}
                aria-label="Copy reply"
                className="grid h-7 w-7 place-items-center rounded-full border border-border bg-bg/90 text-muted shadow-sm backdrop-blur-sm transition-all hover:border-accent/50 hover:text-fg active:scale-90"
              >
                {copied ? <CheckIcon /> : <CopyIcon />}
              </button>
              {isLastAssistant && onRegenerate && (
                <button
                  type="button"
                  onClick={onRegenerate}
                  disabled={isLoading}
                  aria-label="Regenerate reply"
                  className="grid h-7 w-7 place-items-center rounded-full border border-border bg-bg/90 text-muted shadow-sm backdrop-blur-sm transition-all hover:border-accent/50 hover:text-fg active:scale-90 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  <RegenerateIcon />
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {!isUser && cards.length > 0 && (
        <div className="w-full max-w-[88%] sm:max-w-[72%]">
          <ProjectCards projects={cards} onAsk={onAsk} />
        </div>
      )}

      {!isUser && contactToolPart && <ContactForm intro={contactIntro} />}
    </div>
  );
}

/* ============================================================
   Typing indicator
   ============================================================ */
function TypingDots() {
  return (
    <span className="inline-flex h-5 items-center gap-1">
      <span
        className="h-1.5 w-1.5 rounded-full bg-muted"
        style={{
          animation: "dotPulse 1.2s infinite ease-in-out",
          animationDelay: "0s",
        }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-muted"
        style={{
          animation: "dotPulse 1.2s infinite ease-in-out",
          animationDelay: "0.15s",
        }}
      />
      <span
        className="h-1.5 w-1.5 rounded-full bg-muted"
        style={{
          animation: "dotPulse 1.2s infinite ease-in-out",
          animationDelay: "0.3s",
        }}
      />
    </span>
  );
}

/* ============================================================
   Icons
   ============================================================ */
function CopyIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
      <path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1" />
    </svg>
  );
}

function CheckIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      className="text-accent"
    >
      <polyline points="20 6 9 17 4 12" />
    </svg>
  );
}

function RegenerateIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M21 12a9 9 0 1 1-3-6.7L21 8" />
      <polyline points="21 3 21 8 16 8" />
    </svg>
  );
}
