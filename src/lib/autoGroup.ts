import type { Entry } from "../types";

/** "Еда 1" -> "Еда", "Такси" -> "Такси" (no trailing number, name is its own base). */
function stripTrailingNumber(name: string): string {
  const trimmed = name.trim();
  const match = trimmed.match(/^(.*?)[\s._-]*\d+$/);
  const base = match?.[1]?.trim();
  return base && base.length > 0 ? base : trimmed;
}

export interface EntryGroup {
  label: string;
  entries: Entry[];
}

/**
 * Groups entries whose names share a base once a trailing number is stripped
 * (e.g. "Еда 1", "Еда 2" -> "Еда"), case-insensitively. Singletons — names with
 * no sibling in the same group — are left out, since a subcategory of one item
 * just adds clutter.
 */
export function groupEntriesForSplit(entries: Entry[]): EntryGroup[] {
  const byKey = new Map<string, EntryGroup>();
  for (const entry of entries) {
    const base = stripTrailingNumber(entry.name);
    const key = base.toLowerCase();
    const existing = byKey.get(key);
    if (existing) {
      existing.entries.push(entry);
    } else {
      byKey.set(key, { label: base.charAt(0).toUpperCase() + base.slice(1), entries: [entry] });
    }
  }
  return [...byKey.values()].filter((g) => g.entries.length >= 2);
}
