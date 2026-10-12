export type RequestCategory =
  | "smallTalk"
  | "personaQuestion"
  | "projectQuestion"
  | "calendarQuery"
  | "commitQuery"
  | "contactQuery"
  | "reminderAction";

export function classifyRequest(text: string): RequestCategory {
  const q = text.toLowerCase().trim();

  // Small talk — greetings, casual
  if (
    /^(hi|hello|hey|yo|hola|salam|assalam|good (morning|evening|afternoon)|how are you|what's up|whats up|sup)[\s!.?]*$/i.test(
      q,
    ) ||
    q.length < 4
  ) {
    return "smallTalk";
  }

  // Reminder actions
  if (/\b(remind|reminder|reminders)\b/.test(q)) {
    return "reminderAction";
  }

  // Contact
  if (/\b(contact|reach|email|hire|linkedin|touch)\b/.test(q)) {
    return "contactQuery";
  }

  // Calendar
  if (
    /\b(event|events|calendar|schedule|meeting|meetings|zoom|appointment|appointments|booked|availability|available|upcoming|this week|next week|today|tomorrow)\b/.test(
      q,
    )
  ) {
    return "calendarQuery";
  }

  // Commits / GitHub
  if (
    /\b(commit|commits|push|pushed|repo|repos|repository|repositories|github|code|latest|recent)\b/.test(
      q,
    )
  ) {
    return "commitQuery";
  }

  // Project-specific
  if (
    /\b(project|projects|built|drone|shopit|familyhub|medlabs|hamama|elegance|omniforce)\b/.test(
      q,
    )
  ) {
    return "projectQuestion";
  }

  return "personaQuestion";
}

export function shouldRetrieve(category: RequestCategory): boolean {
  return category === "personaQuestion" || category === "projectQuestion";
}

export function shouldUseTools(category: RequestCategory): boolean {
  return (
    category === "calendarQuery" ||
    category === "commitQuery" ||
    category === "contactQuery" ||
    category === "reminderAction"
  );
}

export function historyDepth(category: RequestCategory): number {
  // Number of previous messages to include
  switch (category) {
    case "smallTalk":
      return 2;
    case "calendarQuery":
    case "commitQuery":
      return 2;
    default:
      return 4;
  }
}
