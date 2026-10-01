import { createOpenAI } from '@ai-sdk/openai';

export const groq = createOpenAI({
  baseURL: 'https://api.groq.com/openai/v1',
  apiKey: process.env.GROQ_API_KEY,
});

// Fast, smart, free — great for a personal chatbot
export const CHAT_MODEL = groq('openai/gpt-oss-120b');