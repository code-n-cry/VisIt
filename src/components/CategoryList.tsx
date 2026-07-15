import type { Category, Entry } from "../types";
import { CategoryNode } from "./CategoryNode";

interface Props {
  categories: Category[];
  entries: Entry[];
  displayCurrency: string;
  rates: Record<string, number> | null;
  onDeleteEntry: (id: string) => void;
  onDeleteCategory: (id: string) => void;
  onAddCategory: (name: string, parentId: string | null) => Category;
  onEditCategory: (id: string, name: string) => void;
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
  onDeleteCategory,
  onAddCategory,
  onEditCategory,
  onSplitIntoSubcategories,
  onMoveCategory,
  onMoveEntriesToCategory,
}: Props) {
  const orderedIds = categories.map((c) => c.id);
  const topLevel = categories.filter((c) => c.parentId === null);

  if (topLevel.length === 0) return null;

  return (
    <div className="category-list">
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
          onDeleteCategory={onDeleteCategory}
          onAddCategory={onAddCategory}
          onEditCategory={onEditCategory}
          onSplitIntoSubcategories={onSplitIntoSubcategories}
          onMoveCategory={onMoveCategory}
          onMoveEntriesToCategory={onMoveEntriesToCategory}
        />
      ))}
    </div>
  );
}
