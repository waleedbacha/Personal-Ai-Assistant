'use client';

import { useCallback, useEffect, useRef, useState } from 'react';

export function useSpeechSynthesis() {
  const [isSupported, setIsSupported] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const voicesRef = useRef<SpeechSynthesisVoice[]>([]);
  const lastSpokenRef = useRef<string>('');

  useEffect(() => {
    if (typeof window === 'undefined' || !('speechSynthesis' in window)) return;
    setIsSupported(true);

    const loadVoices = () => {
      voicesRef.current = window.speechSynthesis.getVoices();
      // Debug: uncomment to see what your OS has installed
      // console.log('[TTS] Voices:', voicesRef.current.map(v => `${v.lang} — ${v.name}`));
    };

    loadVoices();
    window.speechSynthesis.onvoiceschanged = loadVoices;

    return () => {
      window.speechSynthesis.onvoiceschanged = null;
    };
  }, []);

  /**
   * Speak text using the voice matching the given language.
   * @param text   - the reply to speak
   * @param lang   - 'en' | 'ur' | 'ar' | 'hi' | 'es' | 'fr' | ...
   */
  const speak = useCallback(
    (text: string, lang: string = 'en') => {
      if (!isSupported || isMuted || !text) return;

      const key = `${lang}::${text}`;
      if (lastSpokenRef.current === key) return;
      lastSpokenRef.current = key;

      const voice = pickVoice(voicesRef.current, lang);

      if (!voice) {
        console.warn(
          `[TTS] No voice installed for "${lang}". Install a ${lang.toUpperCase()} language pack in your OS settings.`
        );
        return;
      }

      try {
        window.speechSynthesis.cancel();
      } catch {}

      const utterance = new SpeechSynthesisUtterance(text);
      utterance.voice = voice;
      utterance.lang = voice.lang;
      utterance.rate = 1;
      utterance.pitch = 1;
      utterance.volume = 1;
      window.speechSynthesis.speak(utterance);
    },
    [isSupported, isMuted]
  );

  const stop = useCallback(() => {
    if (typeof window === 'undefined') return;
    if ('speechSynthesis' in window) window.speechSynthesis.cancel();
    lastSpokenRef.current = '';
  }, []);

  return { isSupported, isMuted, setIsMuted, speak, stop };
}

/* ------------------------------------------------------------------ */

/**
 * Pick the best voice for a given language code.
 * Priority: exact locale match → language prefix match → name match.
 */
function pickVoice(
  voices: SpeechSynthesisVoice[],
  lang: string
): SpeechSynthesisVoice | null {
  if (!voices.length) return null;

  // Map our short codes → preferred locales, in order
  const PREFERRED: Record<string, string[]> = {
    ur: ['ur-PK', 'ur-IN', 'ur'],
    ar: ['ar-SA', 'ar-EG', 'ar-AE', 'ar'],
    en: ['en-US', 'en-GB', 'en'],
    hi: ['hi-IN', 'hi'],
    es: ['es-ES', 'es-MX', 'es-US', 'es'],
    fr: ['fr-FR', 'fr-CA', 'fr'],
    de: ['de-DE', 'de'],
    fa: ['fa-IR', 'fa'],
    zh: ['zh-CN', 'zh'],
    ja: ['ja-JP', 'ja'],
    ko: ['ko-KR', 'ko'],
    ru: ['ru-RU', 'ru'],
  };

  const preferred = PREFERRED[lang] ?? [lang];

  // 1. Exact locale match
  for (const loc of preferred) {
    const v = voices.find(v => v.lang.toLowerCase() === loc.toLowerCase());
    if (v) return v;
  }

  // 2. Prefix match (e.g. "ur" matches "ur-PK", "ur-IN")
  const vPrefix = voices.find(v =>
    v.lang.toLowerCase().startsWith(lang.toLowerCase())
  );
  if (vPrefix) return vPrefix;

  // 3. Voice name contains the language (e.g. "Microsoft Asad - Urdu")
  const nameHint: Record<string, RegExp> = {
    ur: /urdu/i,
    ar: /arabic/i,
    hi: /hindi/i,
    fa: /persian|farsi/i,
  };
  if (nameHint[lang]) {
    const vName = voices.find(v => nameHint[lang].test(v.name));
    if (vName) return vName;
  }

  // 4. No match → return null so we skip speaking
  return null;
}