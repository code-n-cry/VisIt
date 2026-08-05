import { useCallback, useEffect, useRef, useState } from "react";
import type { AppData, Category, Entry, Goal, Group, Settings } from "../types";
import { loadData, makeId, saveData } from "../lib/storage";
import { loadCloudData, saveCloudData } from "../lib/cloudStorage";
import { mergeAppData, shouldUploadMergedData } from "../lib/mergeAppData";
import { getSubtreeIds } from "../lib/categoryTree";
import { groupEntriesForSplit } from "../lib/autoGroup";

export type SyncStatus = "local" | "loading" | "saving" | "synced" | "error";

export function useAppData(userId: string | null) {
  const [data, setData] = useState<AppData>(() => loadData());
  const [syncStatus, setSyncStatus] = useState<SyncStatus>(userId ? "loading" : "local");
  const [syncError, setSyncError] = useState<string | null>(null);
  const [cloudUpdatedAt, setCloudUpdatedAt] = useState<string | null>(null);
  const hydratedUserRef = useRef<string | null>(null);
  const latestDataRef = useRef(data);

  useEffect(() => {
    latestDataRef.current = data;
    saveData(data);
  }, [data]);

  useEffect(() => {
    if (!userId) {
      hydratedUserRef.current = null;
      setSyncStatus("local");
      setSyncError(null);
      setCloudUpdatedAt(null);
      return;
    }

    let cancelled = false;
    setSyncStatus("loading");
    setSyncError(null);

    loadCloudData(userId)
      .then((remote) => {
        if (cancelled) return;

        hydratedUserRef.current = userId;
        if (remote) {
          const localData = latestDataRef.current;
          const mergedData = mergeAppData(localData, remote.data);
          setData(mergedData);
          saveData(mergedData);

          if (shouldUploadMergedData(localData, remote.data)) {
            return saveCloudData(userId, mergedData).then((updatedAt) => {
              if (cancelled) return;
              setCloudUpdatedAt(updatedAt);
              setSyncStatus("synced");
            });
          }

          setCloudUpdatedAt(remote.updatedAt);
          setSyncStatus("synced");
          return;
        }

        return saveCloudData(userId, latestDataRef.current).then((updatedAt) => {
          if (cancelled) return;
          setCloudUpdatedAt(updatedAt);
          setSyncStatus("synced");
        });
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setSyncStatus("error");
        setSyncError(err instanceof Error ? err.message : "Не удалось загрузить данные аккаунта");
      });

    return () => {
      cancelled = true;
    };
  }, [userId]);

  useEffect(() => {
    if (!userId || hydratedUserRef.current !== userId) return;

    let cancelled = false;
    setSyncStatus("saving");
    const timeoutId = window.setTimeout(() => {
      saveCloudData(userId, data)
        .then((updatedAt) => {
          if (cancelled) return;
          setCloudUpdatedAt(updatedAt);
          setSyncStatus("synced");
          setSyncError(null);
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setSyncStatus("error");
          setSyncError(err instanceof Error ? err.message : "Не удалось сохранить данные аккаунта");
        });
    }, 600);

    return () => {
      cancelled = true;
      window.clearTimeout(timeoutId);
    };
  }, [data, userId]);

  const setSettings = useCallback((settings: Settings) => {
    setData((d) => ({ ...d, settings }));
  }, []);

  const addGroup = useCallback((name: string): Group => {
    const group: Group = { id: makeId(), name: name.trim() };
    setData((d) => ({ ...d, groups: [...d.groups, group] }));
    return group;
  }, []);

  const editGroup = useCallback((id: string, name: string) => {
    const trimmed = name.trim();
    if (!trimmed) return;
    setData((d) => ({
      ...d,
      groups: d.groups.map((g) => (g.id === id ? { ...g, name: trimmed } : g)),
    }));
  }, []);

  const deleteGroup = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      groups: d.groups.filter((g) => g.id !== id),
      entries: d.entries.map((e) => (e.groupId === id ? { ...e, groupId: null } : e)),
    }));
  }, []);

  const addCategory = useCallback((name: string, parentId: string | null = null): Category => {
    const category: Category = { id: makeId(), name: name.trim(), parentId, banned: false };
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

  const toggleCategoryBanned = useCallback((id: string) => {
    setData((d) => ({
      ...d,
      categories: d.categories.map((c) => (c.id === id ? { ...c, banned: !c.banned } : c)),
    }));
  }, []);

  const addEntry = useCallback(
    (entry: Omit<Entry, "id" | "createdAt"> & { createdAt?: string }) => {
      const full: Entry = {
        ...entry,
        id: makeId(),
        createdAt: entry.createdAt ?? new Date().toISOString(),
      };
      setData((d) => ({ ...d, entries: [...d.entries, full] }));
    },
    [],
  );

  const addEntries = useCallback((items: Omit<Entry, "id" | "createdAt">[]) => {
    const createdAt = new Date().toISOString();
    const newEntries: Entry[] = items.map((item) => ({
      ...item,
      id: makeId(),
      createdAt,
    }));
    setData((d) => ({ ...d, entries: [...d.entries, ...newEntries] }));
  }, []);

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
        banned: false,
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

  const addGoal = useCallback((name: string, targetAmount: number, targetCurrency: string): Goal => {
    const goal: Goal = {
      id: makeId(),
      name: name.trim(),
      targetAmount,
      targetCurrency,
      savedAmount: 0,
    };
    setData((d) => ({ ...d, goals: [...d.goals, goal] }));
    return goal;
  }, []);

  const editGoal = useCallback((id: string, updates: Partial<Omit<Goal, "id">>) => {
    setData((d) => ({
      ...d,
      goals: d.goals.map((g) => (g.id === id ? { ...g, ...updates } : g)),
    }));
  }, []);

  const deleteGoal = useCallback((id: string) => {
    setData((d) => ({ ...d, goals: d.goals.filter((g) => g.id !== id) }));
  }, []);

  const contributeToGoal = useCallback((id: string, amount: number) => {
    setData((d) => ({
      ...d,
      goals: d.goals.map((g) => (g.id === id ? { ...g, savedAmount: Math.max(0, g.savedAmount + amount) } : g)),
    }));
  }, []);

  const replaceAll = useCallback((next: AppData) => {
    setData(next);
  }, []);

  const resetAll = useCallback(() => {
    setData({ settings: null, groups: [], categories: [], entries: [], goals: [] });
  }, []);

  const syncNow = useCallback(async () => {
    if (!userId) return;
    setSyncStatus("saving");
    setSyncError(null);
    try {
      const updatedAt = await saveCloudData(userId, latestDataRef.current);
      setCloudUpdatedAt(updatedAt);
      setSyncStatus("synced");
    } catch (err) {
      setSyncStatus("error");
      setSyncError(err instanceof Error ? err.message : "Не удалось сохранить данные аккаунта");
    }
  }, [userId]);

  return {
    data,
    syncStatus,
    syncError,
    cloudUpdatedAt,
    setSettings,
    addGroup,
    editGroup,
    deleteGroup,
    addCategory,
    editCategory,
    toggleCategoryBanned,
    addEntry,
    addEntries,
    deleteEntry,
    deleteCategory,
    moveCategory,
    moveEntriesToCategory,
    splitIntoSubcategories,
    addGoal,
    editGoal,
    deleteGoal,
    contributeToGoal,
    replaceAll,
    resetAll,
    syncNow,
  };
}
