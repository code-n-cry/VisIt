import { useState } from "react";
import type { CSSProperties } from "react";
import type { Category, Entry } from "../types";
import { convert } from "../lib/exchangeRates";
import { categoryColorVar } from "../lib/colors";
import { formatAmount } from "../lib/format";
import { flattenTree, getChildren, getSubtreeIds } from "../lib/categoryTree";
import { groupEntriesForSplit } from "../lib/autoGroup";
import { CategoryBreakdown } from "./CategoryBreakdown";

interface Props {
  category: Category;
  categories: Category[];
  entries: Entry[];
  displayCurrency: string;
  rates: Record<string, number> | null;
  orderedIds: string[];
  depth: number;
  onDeleteEntry: (id: string) => void;
  onDeleteCategory: (id: string) => void;
  onAddCategory: (name: string, parentId: string | null) => Category;
  onEditCategory: (id: string, name: string) => void;
  onSplitIntoSubcategories: (categoryId: string) => void;
  onMoveCategory: (categoryId: string, newParentId: string | null) => void;
  onMoveEntriesToCategory: (entryIds: string[], targetCategoryId: string) => void;
}

export function CategoryNode({
  category,
  categories,
  entries,
  displayCurrency,
  rates,
  orderedIds,
  depth,
  onDeleteEntry,
  onDeleteCategory,
  onAddCategory,
  onEditCategory,
  onSplitIntoSubcategories,
  onMoveCategory,
  onMoveEntriesToCategory,
}: Props) {
  const [isOpen, setIsOpen] = useState(false);
  const [isEditingName, setIsEditingName] = useState(false);
  const [nameDraft, setNameDraft] = useState(category.name);
  const [isAddingChild, setIsAddingChild] = useState(false);
  const [childName, setChildName] = useState("");
  const [selectedEntryIds, setSelectedEntryIds] = useState<Set<string>>(new Set());
  const [newGroupName, setNewGroupName] = useState("");
  const [moveTargetId, setMoveTargetId] = useState("");

  const children = getChildren(categories, category.id);
  const subtreeIds = new Set(getSubtreeIds(categories, category.id));

  const ownEntries = entries
    .filter((e) => e.categoryId === category.id)
    .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  const subtreeEntries = entries.filter((e) => subtreeIds.has(e.categoryId));
  const total = subtreeEntries.reduce(
    (sum, e) => sum + convert(e.amount, e.currency, displayCurrency, rates ?? {}),
    0,
  );
  const color = categoryColorVar(category.id, orderedIds);
  const splitGroups = groupEntriesForSplit(ownEntries);

  /** Everywhere this category could move to without creating a cycle: the whole tree minus its own subtree. */
  const reparentTargets = flattenTree(categories).filter((t) => !subtreeIds.has(t.category.id));
  /** Existing subcategories the currently selected entries could be grouped into. */
  const groupTargets = flattenTree(categories).filter((t) => t.category.id !== category.id);

  function commitRename() {
    const trimmed = nameDraft.trim();
    if (trimmed && trimmed !== category.name) onEditCategory(category.id, trimmed);
    setIsEditingName(false);
    setNameDraft(trimmed || category.name);
  }

  function cancelRename() {
    setNameDraft(category.name);
    setIsEditingName(false);
  }

  function submitChild(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = childName.trim();
    if (!trimmed) return;
    onAddCategory(trimmed, category.id);
    setChildName("");
    setIsAddingChild(false);
    setIsOpen(true);
  }

  function handleDelete() {
    const descendantCount = subtreeIds.size - 1;
    const message =
      descendantCount > 0
        ? `Удалить категорию «${category.name}» вместе с ${descendantCount} подкатегориями и всеми тратами?`
        : `Удалить категорию «${category.name}» вместе со всеми тратами?`;
    if (confirm(message)) onDeleteCategory(category.id);
  }

  function handleSplit() {
    const lines = splitGroups.map((g) => `• ${g.label} (${g.entries.length})`).join("\n");
    const groupedCount = splitGroups.reduce((sum, g) => sum + g.entries.length, 0);
    const rest = ownEntries.length - groupedCount;
    const restNote = rest > 0 ? `\n\nОстальные ${rest} трат(ы) останутся в «${category.name}» без изменений.` : "";
    const message = `Будут созданы подкатегории:\n${lines}${restNote}\n\nПродолжить?`;
    if (confirm(message)) onSplitIntoSubcategories(category.id);
  }

  function toggleEntrySelected(id: string) {
    setSelectedEntryIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  function clearSelection() {
    setSelectedEntryIds(new Set());
    setNewGroupName("");
    setMoveTargetId("");
  }

  function handleCreateGroup(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = newGroupName.trim();
    if (!trimmed || selectedEntryIds.size === 0) return;
    const newCategory = onAddCategory(trimmed, category.id);
    onMoveEntriesToCategory([...selectedEntryIds], newCategory.id);
    clearSelection();
    setIsOpen(true);
  }

  function handleMoveToExisting() {
    if (!moveTargetId || selectedEntryIds.size === 0) return;
    onMoveEntriesToCategory([...selectedEntryIds], moveTargetId);
    clearSelection();
  }

  return (
    <div className="category-card">
      <div className="category-card-head">
        {isEditingName ? (
          <>
            <span className="category-dot" style={{ "--accent": color } as CSSProperties} />
            <input
              className="input category-name-input"
              autoFocus
              value={nameDraft}
              onChange={(e) => setNameDraft(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  e.preventDefault();
                  commitRename();
                }
                if (e.key === "Escape") cancelRename();
              }}
            />
            <button type="button" className="icon-btn-sm" aria-label="Сохранить название" onClick={commitRename}>
              ✓
            </button>
            <button type="button" className="icon-btn-sm" aria-label="Отменить" onClick={cancelRename}>
              ✕
            </button>
          </>
        ) : (
          <>
            <button
              type="button"
              className="category-toggle"
              aria-expanded={isOpen}
              onClick={() => setIsOpen((v) => !v)}
            >
              <span className="chevron">▶</span>
              <span className="category-dot" style={{ "--accent": color } as CSSProperties} />
              <span className="name">{category.name}</span>
              <span className="count">{subtreeEntries.length}</span>
              <span className="total">{formatAmount(total, displayCurrency)}</span>
            </button>
            <button
              type="button"
              className="icon-btn-sm"
              aria-label={`Переименовать «${category.name}»`}
              onClick={() => {
                setNameDraft(category.name);
                setIsEditingName(true);
              }}
            >
              ✎
            </button>
          </>
        )}
      </div>

      <div className={`entry-list${isOpen ? " is-open" : ""}`}>
        <div className="entry-list-inner">
          <CategoryBreakdown entries={ownEntries} displayCurrency={displayCurrency} rates={rates} color={color} />

          {ownEntries.length === 0 && children.length === 0 ? (
            <div className="entry-row">
              <span className="entry-name hint">Пока нет трат в этой категории</span>
            </div>
          ) : (
            ownEntries.map((entry) => {
              const converted = convert(entry.amount, entry.currency, displayCurrency, rates ?? {});
              const showConverted = entry.currency !== displayCurrency;
              const checked = selectedEntryIds.has(entry.id);
              return (
                <div className={`entry-row${checked ? " is-selected" : ""}`} key={entry.id}>
                  <input
                    type="checkbox"
                    className="entry-checkbox"
                    aria-label={`Выбрать «${entry.name}»`}
                    checked={checked}
                    onChange={() => toggleEntrySelected(entry.id)}
                  />
                  <span className="entry-name">{entry.name}</span>
                  <span>
                    <span className="entry-amount">{formatAmount(entry.amount, entry.currency)}</span>
                    {showConverted && (
                      <div className="entry-converted">≈ {formatAmount(converted, displayCurrency)}</div>
                    )}
                  </span>
                  <button
                    type="button"
                    className="delete-btn"
                    aria-label={`Удалить «${entry.name}»`}
                    onClick={() => onDeleteEntry(entry.id)}
                  >
                    ✕
                  </button>
                </div>
              );
            })
          )}

          {selectedEntryIds.size > 0 && (
            <div className="selection-toolbar">
              <span className="selection-count">Выбрано: {selectedEntryIds.size}</span>
              <form className="selection-action" onSubmit={handleCreateGroup}>
                <input
                  className="input"
                  placeholder="Новая подкатегория (например «Транспорт»)"
                  value={newGroupName}
                  onChange={(e) => setNewGroupName(e.target.value)}
                />
                <button type="submit" className="btn btn-sm btn-primary" disabled={!newGroupName.trim()}>
                  Сгруппировать
                </button>
              </form>
              <div className="selection-action">
                <select
                  className="select"
                  value={moveTargetId}
                  onChange={(e) => setMoveTargetId(e.target.value)}
                >
                  <option value="">— выбрать подкатегорию —</option>
                  {groupTargets.map((t) => (
                    <option key={t.category.id} value={t.category.id}>
                      {"—".repeat(t.depth)} {t.category.name}
                    </option>
                  ))}
                </select>
                <button type="button" className="btn btn-sm" disabled={!moveTargetId} onClick={handleMoveToExisting}>
                  Перенести
                </button>
              </div>
              <button type="button" className="link-btn" onClick={clearSelection}>
                Отменить выбор
              </button>
            </div>
          )}

          {children.length > 0 && (
            <div className="subcategories">
              {children.map((child) => (
                <CategoryNode
                  key={child.id}
                  category={child}
                  categories={categories}
                  entries={entries}
                  displayCurrency={displayCurrency}
                  rates={rates}
                  orderedIds={orderedIds}
                  depth={depth + 1}
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
          )}

          {splitGroups.length > 0 && (
            <div className="entry-row">
              <button type="button" className="link-btn" onClick={handleSplit}>
                Разложить по подкатегориям
              </button>
            </div>
          )}

          <div className="entry-row">
            {isAddingChild ? (
              <form className="add-subcategory-form" onSubmit={submitChild}>
                <input
                  className="input"
                  autoFocus
                  placeholder="Название подкатегории"
                  value={childName}
                  onChange={(e) => setChildName(e.target.value)}
                />
                <button type="submit" className="btn btn-sm">
                  Добавить
                </button>
                <button
                  type="button"
                  className="btn btn-sm"
                  onClick={() => {
                    setIsAddingChild(false);
                    setChildName("");
                  }}
                >
                  Отмена
                </button>
              </form>
            ) : (
              <button type="button" className="link-btn" onClick={() => setIsAddingChild(true)}>
                + Подкатегория
              </button>
            )}
          </div>

          <div className="entry-row move-category-row">
            <label className="hint" htmlFor={`move-cat-${category.id}`}>
              Переместить категорию в:
            </label>
            <select
              id={`move-cat-${category.id}`}
              className="select"
              value={category.parentId ?? ""}
              onChange={(e) => onMoveCategory(category.id, e.target.value || null)}
            >
              <option value="">— Корень —</option>
              {reparentTargets.map((t) => (
                <option key={t.category.id} value={t.category.id}>
                  {"—".repeat(t.depth)} {t.category.name}
                </option>
              ))}
            </select>
          </div>

          <div className="entry-row">
            <button type="button" className="delete-btn" style={{ marginLeft: "auto" }} onClick={handleDelete}>
              Удалить категорию
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
