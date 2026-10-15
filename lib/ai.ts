import { createOpenAI } from "@ai-sdk/openai";
import { createOpenAICompatible } from "@ai-sdk/openai-compatible";

// ------------------------------------------------------------
// Groq — primary chat + report provider
// ------------------------------------------------------------
export const groq = createOpenAI({
  baseURL: "https://api.groq.com/openai/v1",
  apiKey: process.env.GROQ_API_KEY,
});

// Fast, smart, free — great for a personal chatbot
export const CHAT_MODEL = groq("openai/gpt-oss-20b");

// ------------------------------------------------------------
// OpenRouter — free-tier fallback
// Uses the :free model variants so we never get charged.
// ------------------------------------------------------------
export const openrouter = createOpenAICompatible({
  name: "openrouter",
  baseURL: "https://openrouter.ai/api/v1",
  apiKey: process.env.OPENROUTER_API_KEY,
  headers: {
    "HTTP-Referer": "https://personal-ai-assistant-theta-self.vercel.app",
    "X-Title": "Waleed AI Assistant",
  },
});

export const OPENROUTER_MODEL = openrouter.chatModel(
  "nvidia/nemotron-3-super-120b-a12b:free",
);
// export const OPENROUTER_MODEL = openrouter.chatModel("openrouter/free");
