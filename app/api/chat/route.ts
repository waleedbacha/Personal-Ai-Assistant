import { streamText, convertToModelMessages, UIMessage, stepCountIs } from "ai";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
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

// Change to 999 when you want to remove the demo limit
const DEMO_MESSAGE_LIMIT = 3;

export async function POST(req: Request) {
  // ------------------------------------------------------------
  // 0. DEMO LIMIT CHECK
  // ------------------------------------------------------------
  const cookieStore = await cookies();
  const demoUsage = parseInt(cookieStore.get("demo_usage")?.value || "0", 10);

  if (demoUsage >= DEMO_MESSAGE_LIMIT) {
    return NextResponse.json(
      {
        error:
          "You have reached the 3-message limit for the demo. To unlock full access, unlimited conversations, and weekly reports, please contact myai.assistant30@gmail.com directly.",
      },
      { status: 403 },
    );
  }

  // Increment cookie (valid for 24 hours)
  cookieStore.set("demo_usage", (demoUsage + 1).toString(), {
    maxAge: 60 * 60 * 24,
    httpOnly: true,
    path: "/",
  });

  // ------------------------------------------------------------
  // 1. Parse Request
  // ------------------------------------------------------------
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
  // 2. Latest user message
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
  // 3. Classify → decide what to run
  // ------------------------------------------------------------
  const category = classifyRequest(lastUserText);
  const needsRetrieval = shouldRetrieve(category);
  const depth = historyDepth(category);

  console.log(
    `[chat] category=${category} retrieve=${needsRetrieval} depth=${depth} (demo_msg=${demoUsage + 1}/${DEMO_MESSAGE_LIMIT})`,
  );

  // ------------------------------------------------------------
  // 4. Conditional retrieval
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
  // 5. Build prompt + tools
  // ------------------------------------------------------------
  const systemPrompt = buildSystemPrompt(mode, retrievedContext);
  const reminderTools = buildReminderTools(visitorId);

  // ------------------------------------------------------------
  // 6. Trim history — fixes the answer-bleed problem
  // ------------------------------------------------------------
  const recentMessages = messages.slice(-depth);

  // ------------------------------------------------------------
  // 7. Stream
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
  // 8. Log the conversation after the stream finishes
  // ------------------------------------------------------------
  if (lastUserText && category !== "smallTalk") {
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
