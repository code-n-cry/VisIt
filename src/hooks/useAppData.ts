import { useCallback, useEffect, useState } from "react";
import type { AppData, Category, Entry, Settings } from "../types";
import { loadData, makeId, saveData } from "../lib/storage";
import { getSubtreeIds } from "../lib/categoryTree";

export function useAppData() {
  const [data, setData] = useState<AppData>(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const setSettings = useCallback((settings: Settings) => {
    setData((d) => ({ ...d, settings }));
  }, []);

  const addCategory = useCallback((name: string, parentId: string | null = null): Category => {
    const category: Category = { id: makeId(), name: name.trim(), parentId };
    setData((d) => ({ ...d, categories: [...d.categories, category] }));
    return category;
  }, []);

  const editCategory = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setData((d) => ({
      ...d,
      categories: d.categories.map((c) => (c.id === id ? { ...c, name: trimmed } : c)),
    }));
  }, []);

  const addEntry = useCallback(
    (entry: Omit<Entry, "id" | "createdAt">) => {
      const full: Entry = {
        ...entry,
        id: makeId(),
        createdAt: new Date().toISOString(),
      };
      setData((d) => ({ ...d, entries: [...d.entries, full] }));
    },
    [],
  );

  const deleteEntry = useCallback((id: string) => {
    setData((d) => ({ ...d, entries: d.entries.filter((e) => e.id !== id) }));
  }, []);

  const deleteCategory = useCallback((id: string) => {
    setData((d) => {
      const removedIds = new Set(getSubtreeIds(d.categories, id));
      return {
        ...d,
        categories: d.categories.filter((c) => !removedIds.has(c.id)),
        entries: d.entries.filter((e) => !removedIds.has(e.categoryId)),
      };
    });
  }, []);

  const replaceAll = useCallback((next: AppData) => {
    setData(next);
  }, []);

  const resetAll = useCallback(() => {
    setData({ settings: null, categories: [], entries: [] });
  }, []);

  return {
    data,
    setSettings,
    addCategory,
    editCategory,
    addEntry,
    deleteEntry,
    deleteCategory,
    replaceAll,
    resetAll,
  };
}
