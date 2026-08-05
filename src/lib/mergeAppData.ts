import type { AppData, Category, Entry, Group } from "../types";
import { DEFAULT_CATEGORIES } from "../config/categories";

function isDefaultOnlyData(data: AppData): boolean {
  if (data.entries.length > 0 || data.settings) return false;
  const names = new Set(data.categories.map((c) => c.name));
  return names.size === DEFAULT_CATEGORIES.length && DEFAULT_CATEGORIES.every((name) => names.has(name));
}

function hasLocalMigrationData(data: AppData): boolean {
  return !isDefaultOnlyData(data);
}

function mergeGroups(localGroups: Group[], remoteGroups: Group[]): Group[] {
  const merged = new Map<string, Group>();
  for (const group of remoteGroups) merged.set(group.id, group);
  for (const group of localGroups) {
    if (!merged.has(group.id)) merged.set(group.id, group);
  }
  return [...merged.values()];
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
    groups: mergeGroups(localData.groups, remoteData.groups),
    categories: mergeCategories(localData.categories, remoteData.categories),
    entries: mergeEntries(localData.entries, remoteData.entries),
  };
}

export function shouldUploadMergedData(localData: AppData, remoteData: AppData): boolean {
  if (!hasLocalMigrationData(localData)) return false;
  const remoteGroupIds = new Set(remoteData.groups.map((group) => group.id));
  const remoteCategoryIds = new Set(remoteData.categories.map((category) => category.id));
  const remoteEntryIds = new Set(remoteData.entries.map((entry) => entry.id));

  return (
    localData.groups.some((group) => !remoteGroupIds.has(group.id)) ||
    localData.categories.some((category) => !remoteCategoryIds.has(category.id)) ||
    localData.entries.some((entry) => !remoteEntryIds.has(entry.id))
  );
}
