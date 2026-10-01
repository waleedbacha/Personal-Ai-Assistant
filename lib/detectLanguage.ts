// Detect the language of a piece of text.
// Returns a BCP-47-ish code: 'en', 'ur', 'ar', 'hi', 'fa', 'es', 'fr', 'de', etc.

const URDU_CHARS = /[\u0679\u0688\u0691\u06BA\u06BE\u06C1\u06D2\u06D3\u06C3\u067E\u0686\u0698\u06AF]/;
//                             ٹ      ڈ      ڑ      ں      ھ      ہ      ے      ۓ      ۃ      پ      چ      ژ      گ

const ARABIC_ONLY_CHARS = /[\u0621\u0622\u0623\u0625\u0627\u0629\u062F\u0630\u0631\u0632\u0648\u064A\u0629]/;
// Arabic-specific letters that Urdu does NOT use as standalone forms:
// ء آ أ إ ا ة د ذ ر ز و ي

const ARABIC_RANGE = /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/;
const DEVANAGARI = /[\u0900-\u097F]/;
const CYRILLIC = /[\u0400-\u04FF]/;
const HAN = /[\u4E00-\u9FFF]/;
const HIRAGANA_KATAKANA = /[\u3040-\u30FF]/;
const HANGUL = /[\uAC00-\uD7AF]/;
const GREEK = /[\u0370-\u03FF]/;
const HEBREW = /[\u0590-\u05FF]/;

export function detectLanguage(text: string): string {
  if (!text) return 'en';

  const t = text.trim();

  // Urdu (has Urdu-specific letters)
  if (URDU_CHARS.test(t)) return 'ur';

  // Arabic script (but no Urdu-specific chars)
  if (ARABIC_RANGE.test(t)) {
    // If it has Arabic-specific-only letters → Arabic
    if (ARABIC_ONLY_CHARS.test(t)) return 'ar';
    // Otherwise, could be Persian or generic Arabic script → default to Arabic
    // (Persian shares a lot with Arabic in most common words)
    return 'ar';
  }

  if (DEVANAGARI.test(t)) return 'hi';   // Hindi
  if (HEBREW.test(t)) return 'he';
  if (GREEK.test(t)) return 'el';
  if (CYRILLIC.test(t)) return 'ru';
  if (HIRAGANA_KATAKANA.test(t)) return 'ja';
  if (HANGUL.test(t)) return 'ko';
  if (HAN.test(t)) return 'zh';

  // Latin-script language detection (lightweight)
  const lower = t.toLowerCase();
  if (/\b(el|la|los|las|es|un|una|que|de|por|para|hola|gracias)\b/.test(lower))
    return 'es';
  if (/\b(le|la|les|un|une|des|est|et|bonjour|merci|pour)\b/.test(lower))
    return 'fr';
  if (/\b(der|die|das|und|ist|nicht|hallo|danke|für)\b/.test(lower))
    return 'de';

  return 'en';
}