import { useMemo } from "react";
import type { Entry } from "../types";
import { convert } from "../lib/exchangeRates";
import { formatAmount } from "../lib/format";

interface Props {
  entries: Entry[];
  displayCurrency: string;
  rates: Record<string, number> | null;
}

const WEEKDAYS = ["Пн", "Вт", "Ср", "Чт", "Пт", "Сб", "Вс"];

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

export function SpendingHeatmap({ entries, displayCurrency, rates }: Props) {
  const { year, month, totals, max } = useMemo(() => {
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth();
    const lastDay = new Date(y, m + 1, 0).getDate();

    const map = new Map<string, number>();
    for (const e of entries) {
      const key = toDateKey(e.createdAt);
      const converted = convert(e.amount, e.currency, displayCurrency, rates ?? {});
      map.set(key, (map.get(key) ?? 0) + converted);
    }

    const dayTotals: number[] = [];
    for (let d = 1; d <= lastDay; d += 1) {
      const key = `${y}-${String(m + 1).padStart(2, "0")}-${String(d).padStart(2, "0")}`;
      dayTotals.push(map.get(key) ?? 0);
    }

    return {
      year: y,
      month: m,
      totals: dayTotals,
      max: Math.max(...dayTotals, 1),
    };
  }, [entries, displayCurrency, rates]);

  const firstWeekday = (new Date(year, month, 1).getDay() + 6) % 7; // Monday = 0
  const monthName = new Intl.DateTimeFormat("ru", { month: "long", year: "numeric" }).format(
    new Date(year, month),
  );

  function intensityClass(value: number): string {
    if (value === 0) return "heatmap-cell--empty";
    const share = value / max;
    if (share < 0.25) return "heatmap-cell--low";
    if (share < 0.55) return "heatmap-cell--mid";
    if (share < 0.85) return "heatmap-cell--high";
    return "heatmap-cell--max";
  }

  return (
    <section className="card heatmap-card">
      <div className="card-title">Тепловая карта трат — {monthName}</div>
      <div className="heatmap-grid">
        {WEEKDAYS.map((wd) => (
          <div key={wd} className="heatmap-weekday">
            {wd}
          </div>
        ))}
        {Array.from({ length: firstWeekday }).map((_, i) => (
          <div key={`pad-${i}`} className="heatmap-cell heatmap-cell--pad" />
        ))}
        {totals.map((total, index) => {
          const day = index + 1;
          return (
            <div
              key={day}
              className={`heatmap-cell ${intensityClass(total)}`}
              title={`${day}: ${formatAmount(total, displayCurrency)}`}
            >
              {day}
            </div>
          );
        })}
      </div>
      <div className="heatmap-legend">
        <span className="heatmap-legend-label">Меньше</span>
        <span className="heatmap-legend-sample heatmap-cell--empty" />
        <span className="heatmap-legend-sample heatmap-cell--low" />
        <span className="heatmap-legend-sample heatmap-cell--mid" />
        <span className="heatmap-legend-sample heatmap-cell--high" />
        <span className="heatmap-legend-sample heatmap-cell--max" />
        <span className="heatmap-legend-label">Больше</span>
      </div>
    </section>
  );
}
