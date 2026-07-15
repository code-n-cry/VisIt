import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { Entry } from "../types";
import { convert } from "../lib/exchangeRates";
import { formatAmount } from "../lib/format";

interface Props {
  entries: Entry[];
  displayCurrency: string;
  rates: Record<string, number> | null;
  color: string;
}

interface Group {
  name: string;
  total: number;
  count: number;
}

/** Aggregates a category's entries by item name — the %-breakdown within one category. */
export function CategoryBreakdown({ entries, displayCurrency, rates, color }: Props) {
  const groups: Group[] = useMemo(() => {
    const byName = new Map<string, Group>();
    for (const e of entries) {
      const key = e.name.trim().toLowerCase();
      const converted = convert(e.amount, e.currency, displayCurrency, rates ?? {});
      const existing = byName.get(key);
      if (existing) {
        existing.total += converted;
        existing.count += 1;
      } else {
        byName.set(key, { name: e.name.trim(), total: converted, count: 1 });
      }
    }
    return [...byName.values()].sort((a, b) => b.total - a.total);
  }, [entries, displayCurrency, rates]);

  if (groups.length < 2) return null;

  const total = groups.reduce((sum, g) => sum + g.total, 0) || 1;

  return (
    <div className="breakdown">
      {groups.map((g) => {
        const pct = (g.total / total) * 100;
        return (
          <div className="bar-row bar-row--sub" key={g.name}>
            <div className="bar-row-label">{g.name}</div>
            <div className="bar-track bar-track--sub">
              <div
                className="bar-fill bar-fill--sub"
                style={{ width: `${Math.max(pct, 2)}%`, "--bar-color": color } as CSSProperties}
              />
            </div>
            <div className="bar-value">
              {Math.round(pct)}%
              <span className="bar-value-sub"> · {formatAmount(g.total, displayCurrency)}</span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
