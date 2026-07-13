import { useMemo, useState } from "react";
import type { Category, Entry } from "../types";
import { convert } from "../lib/exchangeRates";
import { categoryColorVar } from "../lib/colors";
import { formatAmount } from "../lib/format";
import { CategoryBreakdown } from "./CategoryBreakdown";

interface Props {
  categories: Category[];
  entries: Entry[];
  displayCurrency: string;
  rates: Record<string, number> | null;
  onDeleteEntry: (id: string) => void;
  onDeleteCategory: (id: string) => void;
}

export function CategoryList({
  categories,
  entries,
  displayCurrency,
  rates,
  onDeleteEntry,
  onDeleteCategory,
}: Props) {
  const [openId, setOpenId] = useState<string | null>(null);
  const orderedIds = useMemo(() => categories.map((c) => c.id), [categories]);

  if (categories.length === 0) return null;

  return (
    <div className="category-list">
      {categories.map((category) => {
        const catEntries = entries
          .filter((e) => e.categoryId === category.id)
          .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
        const total = catEntries.reduce(
          (sum, e) => sum + convert(e.amount, e.currency, displayCurrency, rates ?? {}),
          0,
        );
        const isOpen = openId === category.id;
        const color = categoryColorVar(category.id, orderedIds);

        return (
          <div className="category-card" key={category.id}>
            <button
              type="button"
              className="category-card-head"
              aria-expanded={isOpen}
              onClick={() => setOpenId(isOpen ? null : category.id)}
            >
              <span className="category-dot" style={{ background: color }} />
              <span className="name">{category.name}</span>
              <span className="count">{catEntries.length}</span>
              <span className="total">{formatAmount(total, displayCurrency)}</span>
              <span className="chevron">▶</span>
            </button>

            {isOpen && (
              <div className="entry-list">
                <CategoryBreakdown
                  entries={catEntries}
                  displayCurrency={displayCurrency}
                  rates={rates}
                  color={color}
                />
                {catEntries.length === 0 ? (
                  <div className="entry-row">
                    <span className="entry-name hint">Пока нет трат в этой категории</span>
                  </div>
                ) : (
                  catEntries.map((entry) => {
                    const converted = convert(entry.amount, entry.currency, displayCurrency, rates ?? {});
                    const showConverted = entry.currency !== displayCurrency;
                    return (
                      <div className="entry-row" key={entry.id}>
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
                <div className="entry-row">
                  <button
                    type="button"
                    className="delete-btn"
                    style={{ marginLeft: "auto" }}
                    onClick={() => {
                      if (confirm(`Удалить категорию «${category.name}» вместе со всеми тратами?`)) {
                        onDeleteCategory(category.id);
                        setOpenId(null);
                      }
                    }}
                  >
                    Удалить категорию
                  </button>
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
