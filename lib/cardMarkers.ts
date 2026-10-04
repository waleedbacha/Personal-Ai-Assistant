// ------------------------------------------------------------
// Marker format: [[projects:featured]] or [[projects:id,id,id]]
//
// While a reply is streaming, the marker can arrive in pieces.
// We must not render a half-written marker, so we detect:
//   - a complete marker  → extract payload, strip from text
//   - a trailing partial → strip the partial from the visible
//                          text and return `pending: true`
// ------------------------------------------------------------

export type ParsedReply = {
  /** Visible text with any marker (complete or partial) removed */
  text: string;
  /** Payload of the first complete marker found, or null */
  payload: string | null;
  /** True if a partial marker is sitting at the end of the text */
  pending: boolean;
};

// Complete marker: [[projects:...]]
const COMPLETE = /\[\[projects:([^\]]+)\]\]/i;

// Partial marker at end of string: starts with [[ and hasn't closed yet
// Matches: "[[", "[[p", "[[pro", ..., "[[projects:featur"
// Anchored to the end so we only strip the trailing fragment.
const PARTIAL_AT_END =
  /\[\[(?:p(?:r(?:o(?:j(?:e(?:c(?:t(?:s(?::[^\]]*)?)?)?)?)?)?)?)?)?$/i;

export function parseCardMarker(raw: string): ParsedReply {
  if (!raw) {
    return { text: "", payload: null, pending: false };
  }

  // 1. Look for a complete marker anywhere
  const match = raw.match(COMPLETE);

  if (match) {
    const payload = match[1].trim();
    const text = raw.replace(COMPLETE, "").trimEnd();
    return { text, payload, pending: false };
  }

  // 2. No complete marker — check for a trailing partial
  if (PARTIAL_AT_END.test(raw)) {
    const text = raw.replace(PARTIAL_AT_END, "").trimEnd();
    return { text, payload: null, pending: true };
  }

  // 3. Nothing to strip
  return { text: raw, payload: null, pending: false };
}
