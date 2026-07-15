import type { Category } from "../types";

export function getChildren(categories: Category[], parentId: string | null): Category[] {
  return categories.filter((c) => c.parentId === parentId);
}

/** All descendant ids of a category, not including the category itself. */
export function getDescendantIds(categories: Category[], id: string): string[] {
  const direct = getChildren(categories, id);
  return direct.flatMap((child) => [child.id, ...getDescendantIds(categories, child.id)]);
}

/** A category id plus every id below it in the tree — the set an entry or delete rolls up over. */
export function getSubtreeIds(categories: Category[], id: string): string[] {
  return [id, ...getDescendantIds(categories, id)];
}

export interface FlatCategoryNode {
  category: Category;
  depth: number;
}

/** Flattens the tree in parent-then-children order, for select lists that need to show hierarchy. */
export function flattenTree(
  categories: Category[],
  parentId: string | null = null,
  depth = 0,
): FlatCategoryNode[] {
  return getChildren(categories, parentId).flatMap((category) => [
    { category, depth },
    ...flattenTree(categories, category.id, depth + 1),
  ]);
}
