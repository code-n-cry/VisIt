import { useMemo } from "react";
import type { CSSProperties } from "react";
import type { Category, Entry, Group } from "../types";
import { convert } from "../lib/exchangeRates";
import { formatAmount } from "../lib/format";

interface Props {
  entries: Entry[];
  categories: Category[];
  groups: Group[];
  selectedGroupId: string | null;
  displayCurrency: string;
  rates: Record<string, number> | null;
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function monthKey(iso: string): string {
  return iso.slice(0, 7);
}

export function StatsCard({ entries, categories, groups, selectedGroupId, displayCurrency, rates }: Props) {
  const filteredEntries = useMemo(() => {
    if (selectedGroupId === null) return entries;
    return entries.filter((e) => e.groupId === selectedGroupId);
  }, [entries, selectedGroupId]);

  const converted = useMemo(
    () => filteredEntries.map((e) => convert(e.amount, e.currency, displayCurrency, rates ?? {})),
    [filteredEntries, displayCurrency, rates],
  );

  const total = converted.reduce((sum, v) => sum + v, 0);

  const currentMonth = useMemo(() => monthKey(new Date().toISOString()), []);
  const monthTotal = useMemo(
    () =>
      filteredEntries
        .filter((e) => monthKey(e.createdAt) === currentMonth)
        .reduce((sum, e) => sum + convert(e.amount, e.currency, displayCurrency, rates ?? {}), 0),
    [filteredEntries, currentMonth, displayCurrency, rates],
  );

  const daysWithEntries = useMemo(() => {
    const days = new Set(filteredEntries.map((e) => toDateKey(e.createdAt)));
    return days.size || 1;
  }, [filteredEntries]);

  const averagePerDay = total / daysWithEntries;

  const topCategory = useMemo(() => {
    const byCategory = new Map<string, number>();
    for (const e of filteredEntries) {
      const amount = convert(e.amount, e.currency, displayCurrency, rates ?? {});
      byCategory.set(e.categoryId, (byCategory.get(e.categoryId) ?? 0) + amount);
    }
    let bestId: string | null = null;
    let bestAmount = -Infinity;
    for (const [id, amount] of byCategory) {
      if (amount > bestAmount) {
        bestAmount = amount;
        bestId = id;
      }
    }
    return bestId ? categories.find((c) => c.id === bestId)?.name ?? null : null;
  }, [filteredEntries, categories, displayCurrency, rates]);

  const last7Days = useMemo(() => {
    const result: { key: string; total: number }[] = [];
    const today = new Date();
    for (let i = 6; i >= 0; i -= 1) {
      const d = new Date(today);
      d.setDate(d.getDate() - i);
      const key = toDateKey(d.toISOString());
      const totalForDay = filteredEntries
        .filter((e) => toDateKey(e.createdAt) === key)
        .reduce((sum, e) => sum + convert(e.amount, e.currency, displayCurrency, rates ?? {}), 0);
      result.push({ key, total: totalForDay });
    }
    return result;
  }, [filteredEntries, displayCurrency, rates]);

  const maxDay = Math.max(...last7Days.map((d) => d.total), 1);

  const selectedGroupName =
    selectedGroupId === null
      ? "Все группы"
      : selectedGroupId === ""
        ? "Без группы"
        : groups.find((g) => g.id === selectedGroupId)?.name ?? "Группа";

  return (
    <section className="card stats-card">
      <div className="stats-header">
        <div className="card-title">Статистика</div>
        <span className="stats-group">{selectedGroupName}</span>
      </div>

      <div className="stats-grid">
        <div className="stat-tile">
          <span className="stat-label">Всего</span>
          <span className="stat-value">{formatAmount(total, displayCurrency)}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">В этом месяце</span>
          <span className="stat-value">{formatAmount(monthTotal, displayCurrency)}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">В среднем / день</span>
          <span className="stat-value">{formatAmount(averagePerDay, displayCurrency)}</span>
        </div>
        <div className="stat-tile">
          <span className="stat-label">Топ-категория</span>
          <span className="stat-value">{topCategory ?? "—"}</span>
        </div>
      </div>

      <div className="mini-chart">
        <div className="mini-chart-title">Последние 7 дней</div>
        <div className="mini-bars">
          {last7Days.map((d) => {
            const pct = (d.total / maxDay) * 100;
            const dayLabel = d.key.slice(8, 10);
            return (
              <div key={d.key} className="mini-bar-wrap">
                <div className="mini-bar-track">
                  <div
                    className="mini-bar-fill"
                    style={{ height: `${Math.max(pct, 4)}%` } as CSSProperties}
                  />
                </div>
                <span className="mini-bar-label">{dayLabel}</span>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
