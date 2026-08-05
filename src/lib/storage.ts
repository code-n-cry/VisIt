import type { AppData, Category, Entry, Goal, Group, Settings } from "../types";
import { DEFAULT_CATEGORIES } from "../config/categories";

const STORAGE_KEY = "visit:data:v1";

function makeId(): string {
  return crypto.randomUUID();
}

function emptyData(): AppData {
  return {
    settings: null,
    groups: [],
    categories: DEFAULT_CATEGORIES.map((name) => ({ id: makeId(), name, parentId: null })),
    entries: [],
    goals: [],
  };
}

/** Older saves predate subcategories and have no parentId — treat those as top-level. */
function migrateCategories(categories: Category[] | undefined): Category[] {
  return (categories ?? []).map((c) => ({ ...c, parentId: c.parentId ?? null, banned: c.banned ?? false }));
}

/** Older saves predate groups. */
function migrateEntries(entries: Entry[] | undefined): Entry[] {
  return (entries ?? []).map((e) => ({ ...e, groupId: e.groupId ?? null }));
}

export function loadData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyData();
  try {
    const parsed = JSON.parse(raw) as AppData;
    return {
      settings: parsed.settings ?? null,
      groups: parsed.groups ?? [],
      categories: migrateCategories(parsed.categories),
      entries: migrateEntries(parsed.entries),
      goals: parsed.goals ?? [],
    };
  } catch {
    return emptyData();
  }
}

export function saveData(data: AppData): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
}

export function exportDataAsJson(data: AppData): string {
  return JSON.stringify(data, null, 2);
}

export function parseImportedJson(text: string): AppData {
  const parsed = JSON.parse(text) as Partial<AppData>;
  if (!Array.isArray(parsed.categories) || !Array.isArray(parsed.entries)) {
    throw new Error("Файл не похож на экспорт VisIt: нет categories/entries");
  }
  return {
    settings: (parsed.settings as Settings) ?? null,
    groups: (parsed.groups as Group[]) ?? [],
    categories: migrateCategories(parsed.categories as Category[]),
    entries: migrateEntries(parsed.entries as Entry[]),
    goals: (parsed.goals as Goal[]) ?? [],
  };
}

export { makeId };
