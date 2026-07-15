import { useMemo, useState } from "react";
import type { CSSProperties } from "react";
import type { Category, Entry } from "../types";
import { convert } from "../lib/exchangeRates";
import { categoryColorVar } from "../lib/colors";
import { formatAmount } from "../lib/format";
import { getSubtreeIds } from "../lib/categoryTree";

interface Totals {
  category: Category;
  total: number;
  count: number;
}

interface Props {
  categories: Category[];
  entries: Entry[];
  displayCurrency: string;
  rates: Record<string, number> | null;
}

interface TooltipState {
  x: number;
  y: number;
  category: string;
  total: number;
  count: number;
}

export function CategoryChart({ categories, entries, displayCurrency, rates }: Props) {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null);
  const [showTable, setShowTable] = useState(false);

  const orderedIds = useMemo(() => categories.map((c) => c.id), [categories]);

  const hasMixedCurrencies = entries.some((e) => e.currency !== displayCurrency);
  const conversionUnavailable = hasMixedCurrencies && !rates;

  const totals: Totals[] = useMemo(() => {
    return categories
      .filter((category) => category.parentId === null)
      .map((category) => {
        // Roll up entries from subcategories so a payment method's total reflects its whole tree.
        const subtreeIds = new Set(getSubtreeIds(categories, category.id));
        const catEntries = entries.filter((e) => subtreeIds.has(e.categoryId));
        const total = catEntries.reduce(
          (sum, e) => sum + convert(e.amount, e.currency, displayCurrency, rates ?? {}),
          0,
        );
        return { category, total, count: catEntries.length };
      })
      .filter((t) => t.count > 0)
      .sort((a, b) => b.total - a.total);
  }, [categories, entries, displayCurrency, rates]);

  if (totals.length === 0) {
    return (
      <div className="card">
        <div className="card-title">Траты по категориям</div>
        <p className="chart-empty">Пока нет ни одной траты — добавьте первую выше.</p>
      </div>
    );
  }

  const max = Math.max(...totals.map((t) => t.total), 1);

  return (
    <div className="card">
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <div className="card-title" style={{ marginBottom: 0 }}>
          Траты по категориям
        </div>
        <button type="button" className="table-toggle" onClick={() => setShowTable((v) => !v)}>
          {showTable ? "Показать диаграмму" : "Показать таблицей"}
        </button>
      </div>

      {conversionUnavailable && (
        <p className="rate-note" style={{ marginBottom: 10 }}>
          Курс валют недоступен — суммы в других валютах сложены без конвертации.
        </p>
      )}

      {showTable ? (
        <table className="totals-table">
          <thead>
            <tr>
              <th>Категория</th>
              <th>Записей</th>
              <th>Итого</th>
            </tr>
          </thead>
          <tbody>
            {totals.map((t) => (
              <tr key={t.category.id}>
                <td>{t.category.name}</td>
                <td>{t.count}</td>
                <td>{formatAmount(t.total, displayCurrency)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        <div>
          {totals.map((t) => {
            const widthPct = Math.max((t.total / max) * 100, 2);
            const color = categoryColorVar(t.category.id, orderedIds);
            return (
              <div className="bar-row" key={t.category.id}>
                <div className="bar-row-label">{t.category.name}</div>
                <div className="bar-track">
                  <div
                    className="bar-fill"
                    role="img"
                    aria-label={`${t.category.name}: ${formatAmount(t.total, displayCurrency)}`}
                    tabIndex={0}
                    style={{ width: `${widthPct}%`, "--bar-color": color } as CSSProperties}
                    onPointerEnter={(e) =>
                      setTooltip({
                        x: e.clientX,
                        y: e.clientY,
                        category: t.category.name,
                        total: t.total,
                        count: t.count,
                      })
                    }
                    onPointerMove={(e) =>
                      setTooltip((prev) => (prev ? { ...prev, x: e.clientX, y: e.clientY } : prev))
                    }
                    onPointerLeave={() => setTooltip(null)}
                    onFocus={(e) => {
                      const rect = e.currentTarget.getBoundingClientRect();
                      setTooltip({
                        x: rect.right,
                        y: rect.top,
                        category: t.category.name,
                        total: t.total,
                        count: t.count,
                      });
                    }}
                    onBlur={() => setTooltip(null)}
                  />
                </div>
                <div className="bar-value">{formatAmount(t.total, displayCurrency)}</div>
              </div>
            );
          })}
        </div>
      )}

      {tooltip && (
        <div className="chart-tooltip" style={{ left: tooltip.x + 14, top: tooltip.y + 14 }}>
          <strong>{formatAmount(tooltip.total, displayCurrency)}</strong>
          <div>
            {tooltip.category} · {tooltip.count} {pluralEntries(tooltip.count)}
          </div>
        </div>
      )}
    </div>
  );
}

function pluralEntries(n: number): string {
  const mod10 = n % 10;
  const mod100 = n % 100;
  if (mod10 === 1 && mod100 !== 11) return "запись";
  if ([2, 3, 4].includes(mod10) && ![12, 13, 14].includes(mod100)) return "записи";
  return "записей";
}
