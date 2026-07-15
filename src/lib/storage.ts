import type { AppData, Category, Entry, Settings } from "../types";
import { DEFAULT_CATEGORIES } from "../config/categories";

const STORAGE_KEY = "visit:data:v1";

function makeId(): string {
  return crypto.randomUUID();
}

function emptyData(): AppData {
  return {
    settings: null,
    categories: DEFAULT_CATEGORIES.map((name) => ({ id: makeId(), name, parentId: null })),
    entries: [],
  };
}

/** Older saves predate subcategories and have no parentId — treat those as top-level. */
function migrateCategories(categories: Category[] | undefined): Category[] {
  return (categories ?? []).map((c) => ({ ...c, parentId: c.parentId ?? null }));
}

export function loadData(): AppData {
  const raw = localStorage.getItem(STORAGE_KEY);
  if (!raw) return emptyData();
  try {
    const parsed = JSON.parse(raw) as AppData;
    return {
      settings: parsed.settings ?? null,
      categories: migrateCategories(parsed.categories),
      entries: parsed.entries ?? [],
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
    categories: migrateCategories(parsed.categories as Category[]),
    entries: parsed.entries as Entry[],
  };
}

export { makeId };
