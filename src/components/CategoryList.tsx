import { useState, type FormEvent } from "react";
import type { Category, Entry } from "../types";
import { CategoryNode } from "./CategoryNode";

interface Props {
  categories: Category[];
  entries: Entry[];
  displayCurrency: string;
  rates: Record<string, number> | null;
  onDeleteEntry: (id: string) => void;
  onUpdateEntry: (id: string, updates: Partial<Omit<Entry, "id">>) => void;
  onDeleteCategory: (id: string) => void;
  onAddCategory: (name: string, parentId: string | null) => Category;
  onEditCategory: (id: string, name: string) => void;
  onToggleBanned: (id: string) => void;
  onSplitIntoSubcategories: (categoryId: string) => void;
  onMoveCategory: (categoryId: string, newParentId: string | null) => void;
  onMoveEntriesToCategory: (entryIds: string[], targetCategoryId: string) => void;
}

export function CategoryList({
  categories,
  entries,
  displayCurrency,
  rates,
  onDeleteEntry,
  onUpdateEntry,
  onDeleteCategory,
  onAddCategory,
  onEditCategory,
  onToggleBanned,
  onSplitIntoSubcategories,
  onMoveCategory,
  onMoveEntriesToCategory,
}: Props) {
  const [newCategoryName, setNewCategoryName] = useState("");
  const orderedIds = categories.map((c) => c.id);
  const topLevel = categories.filter((c) => c.parentId === null);

  function submitTopLevelCategory(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmed = newCategoryName.trim();
    if (!trimmed) return;
    onAddCategory(trimmed, null);
    setNewCategoryName("");
  }

  return (
    <div className="category-list">
      <form className="category-create-form" onSubmit={submitTopLevelCategory}>
        <input
          className="input"
          value={newCategoryName}
          onChange={(event) => setNewCategoryName(event.target.value)}
          placeholder="Новая категория"
          aria-label="Название новой категории"
        />
        <button type="submit" className="btn btn-sm btn-primary" disabled={!newCategoryName.trim()}>
          Добавить
        </button>
      </form>

      {topLevel.length === 0 && (
        <div className="category-empty">
          <span className="hint">Создай первую категорию или добавь трату через форму слева.</span>
        </div>
      )}

      {topLevel.map((category) => (
        <CategoryNode
          key={category.id}
          category={category}
          categories={categories}
          entries={entries}
          displayCurrency={displayCurrency}
          rates={rates}
          orderedIds={orderedIds}
          depth={0}
          onDeleteEntry={onDeleteEntry}
          onUpdateEntry={onUpdateEntry}
          onDeleteCategory={onDeleteCategory}
          onAddCategory={onAddCategory}
          onEditCategory={onEditCategory}
          onToggleBanned={onToggleBanned}
          onSplitIntoSubcategories={onSplitIntoSubcategories}
          onMoveCategory={onMoveCategory}
          onMoveEntriesToCategory={onMoveEntriesToCategory}
        />
      ))}
    </div>
  );
}
