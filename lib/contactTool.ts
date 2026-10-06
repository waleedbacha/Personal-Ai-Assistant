import { z } from "zod";
import { tool } from "ai";

/**
 * Renders a collapsed contact form under the assistant's reply.
 * The UI renders the form — the execute function is a no-op that
 * satisfies the AI SDK's requirement that every tool call resolves.
 */
export const showContactForm = tool({
  description:
    "Display a contact form so the visitor can send Waleed a message. " +
    "IMPORTANT: Only call this tool AFTER you have written a visible text " +
    "reply listing Waleed's contact channels (portfolio, LinkedIn, email) " +
    "as a bulleted list. Calling this tool with no text reply before it " +
    "produces a broken experience for the visitor. " +
    'Always pass intro="" — the channels are already in the visible reply.',
  inputSchema: z.object({
    intro: z
      .string()
      .describe(
        'Always pass "" — the contact channels are already in the reply text.',
      ),
  }),
  execute: async ({ intro }) => {
    // No-op. The UI renders the form; this exists only so the
    // SDK receives a tool result and doesn't throw
    // AI_MissingToolResultsError.
    return { shown: true, intro: intro ?? "" };
  },
});
