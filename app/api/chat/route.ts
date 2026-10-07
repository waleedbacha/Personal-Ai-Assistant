import { streamText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { CHAT_MODEL } from "@/lib/ai";
import { buildSystemPrompt, type ChatMode } from "@/lib/buildSystemPrompt";
import { showContactForm } from "@/lib/contactTool";
import { buildReminderTools } from "@/lib/reminderTool";
import { retrieve } from "@/lib/rag";

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    mode = "default",
    visitorId = "anonymous",
  }: {
    messages: UIMessage[];
    mode?: ChatMode;
    visitorId?: string;
  } = await req.json();

  // ------------------------------------------------------------
  // 1. Extract the latest user message
  // ------------------------------------------------------------
  const lastUserMessage = [...messages]
    .reverse()
    .find((m) => m.role === "user");

  const lastUserText =
    lastUserMessage?.parts
      ?.filter((p: any) => p.type === "text")
      .map((p: any) => p.text)
      .join("")
      .trim() ?? "";

  // ------------------------------------------------------------
  // 2. RAG retrieval
  // ------------------------------------------------------------
  let retrievedContext = "";

  if (lastUserText) {
    try {
      const chunks = await retrieve(lastUserText, 5);
      if (chunks.length > 0) {
        retrievedContext = chunks
          .map(
            (c, i) =>
              `[${i + 1}] (source: ${c.source}, relevance: ${c.score.toFixed(
                3,
              )})\n${c.text}`,
          )
          .join("\n\n---\n\n");
        console.log(`[chat] Retrieved ${chunks.length} chunks`);
      }
    } catch (err) {
      console.error("[chat] RAG retrieval failed:", err);
    }
  }

  // ------------------------------------------------------------
  // 3. System prompt + tools
  // ------------------------------------------------------------
  const systemPrompt = buildSystemPrompt(mode, retrievedContext);
  const reminderTools = buildReminderTools(visitorId);

  // ------------------------------------------------------------
  // 4. Stream with loop prevention
  //
  // stopWhen: stepCountIs(1) — allow exactly one model step:
  //   either a text reply OR a tool call. The UI renders the
  //   result directly from the tool part, so no follow-up step
  //   is needed. This avoids Groq's multi-step tool loop bug.
  // ------------------------------------------------------------
  const result = streamText({
    model: CHAT_MODEL,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: {
      showContactForm,
      ...reminderTools,
    },
    temperature: 0.7,
    stopWhen: stepCountIs(1),
    providerOptions: {
      groq: {
        reasoning_effort: "low",
        reasoning_format: "hidden",
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
