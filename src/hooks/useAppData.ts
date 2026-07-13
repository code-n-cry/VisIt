import { useCallback, useEffect, useState } from "react";
import type { AppData, Category, Entry, Settings } from "../types";
import { loadData, makeId, saveData } from "../lib/storage";

export function useAppData() {
  const [data, setData] = useState<AppData>(() => loadData());

  useEffect(() => {
    saveData(data);
  }, [data]);

  const setSettings = useCallback((settings: Settings) => {
    setData((d) => ({ ...d, settings }));
  }, []);

  const addCategory = useCallback((name: string): Category => {
    const category: Category = { id: makeId(), name: name.trim() };
    setData((d) => ({ ...d, categories: [...d.categories, category] }));
    return category;
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
    setData((d) => ({
      ...d,
      categories: d.categories.filter((c) => c.id !== id),
      entries: d.entries.filter((e) => e.categoryId !== id),
    }));
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
    addEntry,
    deleteEntry,
    deleteCategory,
    replaceAll,
    resetAll,
  };
}
