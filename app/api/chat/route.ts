import { streamText, convertToModelMessages, UIMessage } from "ai";
import { CHAT_MODEL } from "@/lib/ai";
import { buildSystemPrompt, type ChatMode } from "@/lib/buildSystemPrompt";
import { showContactForm } from "@/lib/contactTool";

export const maxDuration = 30;

export async function POST(req: Request) {
  const {
    messages,
    mode = "default",
  }: { messages: UIMessage[]; mode?: ChatMode } = await req.json();

  const result = streamText({
    model: CHAT_MODEL,
    system: buildSystemPrompt(mode),
    messages: await convertToModelMessages(messages),
    tools: {
      showContactForm,
    },
    temperature: 0.7,
  });

  return result.toUIMessageStreamResponse();
}
