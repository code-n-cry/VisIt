import { useCallback, useEffect, useState } from "react";
import type { AppData, Category, Entry, Settings } from "../types";
import { loadData, makeId, saveData } from "../lib/storage";
import { getSubtreeIds } from "../lib/categoryTree";
import { groupEntriesForSplit } from "../lib/autoGroup";

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

  /** Reparents a category under a new parent (or to the root when null), refusing moves that would create a cycle. */
  const moveCategory = useCallback((categoryId: string, newParentId: string | null) => {
    setData((d) => {
      if (categoryId === newParentId) return d;
      const subtreeIds = new Set(getSubtreeIds(d.categories, categoryId));
      if (newParentId !== null && subtreeIds.has(newParentId)) return d;
      return {
        ...d,
        categories: d.categories.map((c) => (c.id === categoryId ? { ...c, parentId: newParentId } : c)),
      };
    });
  }, []);

  /** Moves a set of entries to a different (sub)category, for user-driven manual grouping. */
  const moveEntriesToCategory = useCallback((entryIds: string[], targetCategoryId: string) => {
    const idSet = new Set(entryIds);
    setData((d) => ({
      ...d,
      entries: d.entries.map((e) => (idSet.has(e.id) ? { ...e, categoryId: targetCategoryId } : e)),
    }));
  }, []);

  /** Groups a category's own entries by name (stripping trailing numbers) into new subcategories. */
  const splitIntoSubcategories = useCallback((categoryId: string) => {
    setData((d) => {
      const direct = d.entries.filter((e) => e.categoryId === categoryId);
      const groups = groupEntriesForSplit(direct);
      if (groups.length === 0) return d;

      const newCategories: Category[] = groups.map((g) => ({
        id: makeId(),
        name: g.label,
        parentId: categoryId,
      }));
      const reassign = new Map<string, string>();
      groups.forEach((g, i) => {
        for (const e of g.entries) reassign.set(e.id, newCategories[i].id);
      });

      return {
        ...d,
        categories: [...d.categories, ...newCategories],
        entries: d.entries.map((e) => {
          const newCategoryId = reassign.get(e.id);
          return newCategoryId ? { ...e, categoryId: newCategoryId } : e;
        }),
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
    moveCategory,
    moveEntriesToCategory,
    splitIntoSubcategories,
    replaceAll,
    resetAll,
  };
}
