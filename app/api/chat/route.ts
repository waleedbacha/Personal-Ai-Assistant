import { streamText, convertToModelMessages, UIMessage } from 'ai';
import { CHAT_MODEL } from '@/lib/ai';
import { buildSystemPrompt } from '@/lib/buildSystemPrompt';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages }: { messages: UIMessage[] } = await req.json();

  const result = streamText({
    model: CHAT_MODEL,
    system: buildSystemPrompt(),
    messages: await convertToModelMessages(messages), // ← Add await here
    temperature: 0.7,
  });

  return result.toUIMessageStreamResponse();
}