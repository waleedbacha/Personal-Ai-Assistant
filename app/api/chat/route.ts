import { streamText, convertToModelMessages, UIMessage } from "ai";
import { CHAT_MODEL } from "@/lib/ai";
import { buildSystemPrompt, type ChatMode } from "@/lib/buildSystemPrompt";
import { showContactForm } from "@/lib/contactTool";
import { retrieve } from "@/lib/rag";

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    mode = "default",
  }: { messages: UIMessage[]; mode?: ChatMode } = await req.json();

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
  // 2. Retrieve relevant chunks from the knowledge base
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

        console.log(
          `[chat] Retrieved ${chunks.length} chunks from knowledge base`,
        );
      }
    } catch (err) {
      // Retrieval failure must not break the chat.
      // Fall back to the standard prompt without context.
      console.error("[chat] RAG retrieval failed:", err);
    }
  }

  // ------------------------------------------------------------
  // 3. Build the system prompt with the retrieved context
  // ------------------------------------------------------------
  const systemPrompt = buildSystemPrompt(mode, retrievedContext);

  // ------------------------------------------------------------
  // 4. Stream the response
  // ------------------------------------------------------------
  const result = streamText({
    model: CHAT_MODEL,
    system: systemPrompt,
    messages: await convertToModelMessages(messages),
    tools: {
      showContactForm,
    },
    temperature: 0.7,
    providerOptions: {
      groq: {
        reasoning_effort: "low",
      },
    },
  });

  return result.toUIMessageStreamResponse();
}
