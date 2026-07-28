import type { AppData, Category, Entry } from "../types";

function hasLocalMigrationData(data: AppData): boolean {
  return data.entries.length > 0;
}

function mergeCategories(localCategories: Category[], remoteCategories: Category[]): Category[] {
  const merged = new Map<string, Category>();
  for (const category of remoteCategories) merged.set(category.id, category);
  for (const category of localCategories) {
    if (!merged.has(category.id)) merged.set(category.id, category);
  }
  return [...merged.values()];
}

function mergeEntries(localEntries: Entry[], remoteEntries: Entry[]): Entry[] {
  const merged = new Map<string, Entry>();
  for (const entry of remoteEntries) merged.set(entry.id, entry);
  for (const entry of localEntries) {
    if (!merged.has(entry.id)) merged.set(entry.id, entry);
  }
  return [...merged.values()].sort((a, b) => a.createdAt.localeCompare(b.createdAt));
}

export function mergeAppData(localData: AppData, remoteData: AppData): AppData {
  if (!hasLocalMigrationData(localData)) return remoteData;

  return {
    settings: remoteData.settings ?? localData.settings,
    categories: mergeCategories(localData.categories, remoteData.categories),
    entries: mergeEntries(localData.entries, remoteData.entries),
  };
}

export function shouldUploadMergedData(localData: AppData, remoteData: AppData): boolean {
  if (!hasLocalMigrationData(localData)) return false;
  const remoteCategoryIds = new Set(remoteData.categories.map((category) => category.id));
  const remoteEntryIds = new Set(remoteData.entries.map((entry) => entry.id));

  return (
    localData.categories.some((category) => !remoteCategoryIds.has(category.id)) ||
    localData.entries.some((entry) => !remoteEntryIds.has(entry.id))
  );
}
