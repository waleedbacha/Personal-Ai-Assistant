import { z } from "zod";
import { tool } from "ai";
import {
  createReminder,
  listReminders,
  completeReminder,
  deleteReminder,
} from "./reminders";

/**
 * Reminder tools. The visitorId is injected by the route handler
 * before the tools are passed to the model, so the model only
 * needs to provide the reminder content — never the visitor ID.
 */
export function buildReminderTools(visitorId: string) {
  return {
    createReminder: tool({
      description:
        "Create a reminder for the visitor. Use this when they ask to be reminded " +
        "about something at a specific time. You MUST convert relative times " +
        '("in 2 hours", "tomorrow at 9am") to an absolute ISO 8601 timestamp using ' +
        "the CURRENT DATETIME provided in the system prompt. If the time is vague " +
        '(e.g. "tomorrow" with no time, or "soon"), ask the visitor to clarify — ' +
        "do NOT call this tool with a guessed time.",
      inputSchema: z.object({
        text: z
          .string()
          .min(1)
          .max(500)
          .describe("What the reminder is about — short, first person."),
        dueAt: z
          .string()
          .describe(
            'Absolute ISO 8601 timestamp, e.g. "2026-10-15T09:00:00.000Z". ' +
              "Convert relative times to absolute using the current datetime.",
          ),
      }),
      execute: async ({ text, dueAt }) => {
        try {
          const due = new Date(dueAt);

          if (isNaN(due.getTime())) {
            return { ok: false, error: "Invalid date format." };
          }

          // Reject dates more than 1 minute in the past — the model got the
          // time wrong, and we don't want a permanently-overdue reminder.
          if (due.getTime() < Date.now() - 60_000) {
            return {
              ok: false,
              error:
                "That time is in the past. Ask the visitor to confirm a future time.",
            };
          }

          const reminder = await createReminder({ visitorId, text, dueAt });
          return {
            ok: true,
            id: reminder._id,
            text: reminder.text,
            dueAt: reminder.dueAt,
          };
        } catch (err) {
          console.error("[reminder] create failed:", err);
          return { ok: false, error: "Could not save the reminder." };
        }
      },
    }),

    listReminders: tool({
      description:
        "List the visitor's pending reminders. Use when they ask what reminders " +
        "they have, or when they want to see their to-do list.",
      inputSchema: z.object({}),
      execute: async () => {
        try {
          const items = await listReminders(visitorId);
          return {
            ok: true,
            count: items.length,
            reminders: items.map((r) => ({
              id: r._id,
              text: r.text,
              dueAt: r.dueAt,
            })),
          };
        } catch (err) {
          console.error("[reminder] list failed:", err);
          return { ok: false, error: "Could not load reminders." };
        }
      },
    }),

    completeReminder: tool({
      description:
        "Mark a reminder as done. Use when the visitor says a reminder is " +
        "finished, done, completed, or they want to check it off.",
      inputSchema: z.object({
        id: z.string().describe("The reminder ID."),
      }),
      execute: async ({ id }) => {
        try {
          const ok = await completeReminder(visitorId, id);
          return { ok, id };
        } catch (err) {
          console.error("[reminder] complete failed:", err);
          return { ok: false, error: "Could not update the reminder." };
        }
      },
    }),

    deleteReminder: tool({
      description:
        "Permanently delete a reminder. Use only when the visitor explicitly " +
        "asks to delete or remove it.",
      inputSchema: z.object({
        id: z.string().describe("The reminder ID."),
      }),
      execute: async ({ id }) => {
        try {
          const ok = await deleteReminder(visitorId, id);
          return { ok, id };
        } catch (err) {
          console.error("[reminder] delete failed:", err);
          return { ok: false, error: "Could not delete the reminder." };
        }
      },
    }),
  };
}
