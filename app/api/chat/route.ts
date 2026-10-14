import { streamText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { CHAT_MODEL } from "@/lib/ai";
import { buildSystemPrompt, type ChatMode } from "@/lib/buildSystemPrompt";
import { showContactForm } from "@/lib/contactTool";
import { buildReminderTools } from "@/lib/reminderTool";
import { getRecentCommitsTool } from "@/lib/commitTool";
import { getCalendarEventsTool } from "@/lib/calendar-tool";
import { retrieve, type RetrieveFilter } from "@/lib/rag";
import { logConversation } from "@/lib/conversations";
import {
  classifyRequest,
  shouldRetrieve,
  historyDepth,
} from "@/lib/classifyRequest";

export const maxDuration = 60;

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
  // 1. Latest user message
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
  // 2. Classify → decide what to run
  // ------------------------------------------------------------
  const category = classifyRequest(lastUserText);
  const needsRetrieval = shouldRetrieve(category);
  const depth = historyDepth(category);

  console.log(
    `[chat] category=${category} retrieve=${needsRetrieval} depth=${depth}`,
  );

  // ------------------------------------------------------------
  // 3. Conditional retrieval
  // ------------------------------------------------------------
  let retrievedContext = "";

  if (needsRetrieval && lastUserText) {
    try {
      const filter: RetrieveFilter | undefined = undefined;
      const chunks = await retrieve(lastUserText, 3, filter);

      if (chunks.length > 0) {
        retrievedContext = chunks
          .map((c, i) => `[${i + 1}] (${c.source})\n${c.text}`)
          .join("\n\n---\n\n");
        console.log(`[chat] Retrieved ${chunks.length} chunks`);
      }
    } catch (err) {
      console.error("[chat] RAG retrieval failed:", err);
    }
  }

  // ------------------------------------------------------------
  // 4. Build prompt + tools
  // ------------------------------------------------------------
  const systemPrompt = buildSystemPrompt(mode, retrievedContext);
  const reminderTools = buildReminderTools(visitorId);

  // ------------------------------------------------------------
  // 5. Trim history — this fixes the answer-bleed problem
  // ------------------------------------------------------------
  const recentMessages = messages.slice(-depth);

  // ------------------------------------------------------------
  // 6. Stream
  // ------------------------------------------------------------
  const result = streamText({
    model: CHAT_MODEL,
    system: systemPrompt,
    messages: await convertToModelMessages(recentMessages),
    tools: {
      showContactForm,
      getRecentCommits: getRecentCommitsTool,
      getCalendarEvents: getCalendarEventsTool,
      ...reminderTools,
    },
    temperature: 0.7,
    stopWhen: stepCountIs(2),
    providerOptions: {
      groq: {
        reasoning_effort: "low",
        reasoning_format: "hidden",
      },
    },
  });

  // ------------------------------------------------------------
  // 7. Log the conversation after the stream finishes
  //    Fire-and-forget — don't block the response.
  // ------------------------------------------------------------
  // 7. Log the conversation after the stream finishes
  //    Fire-and-forget — don't block the response.
  // ------------------------------------------------------------
  if (lastUserText && category !== "smallTalk") {
    const currentMessages = [...recentMessages];

    Promise.resolve(result.text)
      .then((finalText) => {
        if (!finalText || typeof finalText !== "string") return;
        if (finalText.length < 5) return;
        return logConversation({
          visitorId,
          question: lastUserText.slice(0, 500),
          answerSummary: finalText.slice(0, 300),
          category,
          createdAt: new Date().toISOString(),
        });
      })
      .catch(() => {
        // Silent — logging failures must never affect the response
      });
  }

  return result.toUIMessageStreamResponse();
}
