import { z } from "zod";
import { tool } from "ai";

/**
 * Renders a collapsed contact form under the assistant's reply.
 * The model must write the contact channels as text BEFORE calling
 * this tool. Calling it alone produces a broken experience.
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
});
