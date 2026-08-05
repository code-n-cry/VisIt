import { useMemo } from "react";
import type { ChangeEvent } from "react";
import type { Entry, Settings } from "../types";
import { CURRENCIES } from "../config/currencies";
import { convert } from "../lib/exchangeRates";
import { formatAmount } from "../lib/format";

interface Props {
  settings: Settings;
  entries: Entry[];
  rates: Record<string, number> | null;
  onUpdateSettings: (settings: Settings) => void;
}

function toDateKey(iso: string): string {
  return iso.slice(0, 10);
}

function todayKey(): string {
  return toDateKey(new Date().toISOString());
}

export function BudgetCard({ settings, entries, rates, onUpdateSettings }: Props) {
  const limitCurrency = settings.dailyLimitCurrency ?? settings.displayCurrency;
  const limit = settings.dailyLimit ?? 0;

  const dailyTotals = useMemo(() => {
    const map = new Map<string, number>();
    for (const e of entries) {
      const key = toDateKey(e.createdAt);
      const converted = convert(e.amount, e.currency, limitCurrency, rates ?? {});
      map.set(key, (map.get(key) ?? 0) + converted);
    }
    return map;
  }, [entries, limitCurrency, rates]);

  const todayTotal = dailyTotals.get(todayKey()) ?? 0;

  const streak = useMemo(() => {
    if (limit <= 0) return 0;
    if (dailyTotals.size === 0) return 0;

    const keys = [...dailyTotals.keys()].sort();
    const firstDate = keys[0];
    const start = new Date(firstDate);
    const end = new Date(todayKey());

    let count = 0;
    const cursor = new Date(end);
    while (cursor >= start) {
      const key = toDateKey(cursor.toISOString());
      const total = dailyTotals.get(key) ?? 0;
      if (total <= limit) {
        count += 1;
        cursor.setDate(cursor.getDate() - 1);
      } else {
        break;
      }
    }
    return count;
  }, [dailyTotals, limit]);

  const pct = limit > 0 ? Math.min((todayTotal / limit) * 100, 100) : 0;
  const overLimit = limit > 0 && todayTotal > limit;

  let statusClass = "progress-ring--safe";
  if (overLimit) statusClass = "progress-ring--over";
  else if (limit > 0 && todayTotal / limit >= 0.8) statusClass = "progress-ring--warning";

  function handleLimitChange(e: ChangeEvent<HTMLInputElement>) {
    const value = e.target.value === "" ? undefined : Number(e.target.value);
    onUpdateSettings({ ...settings, dailyLimit: value });
  }

  function handleCurrencyChange(e: ChangeEvent<HTMLSelectElement>) {
    onUpdateSettings({ ...settings, dailyLimitCurrency: e.target.value });
  }

  return (
    <section className="card budget-card">
      <div>
        <div className="card-title">Лимит трат на день</div>
        <p className="budget-hint">Задайте сумму, которую хотите не превышать за день.</p>
      </div>

      <div className="budget-row">
        <div className="budget-inputs" aria-label="Настройка дневного лимита">
          <div className="field">
            <label htmlFor="daily-limit">Сумма в день</label>
            <input
              id="daily-limit"
              className="input"
              type="number"
              min={0}
              step={0.01}
              value={settings.dailyLimit ?? ""}
              onChange={handleLimitChange}
              placeholder="Например, 1 500"
            />
          </div>
          <div className="field" style={{ flex: "0 0 110px" }}>
            <label htmlFor="limit-currency">Валюта лимита</label>
            <select id="limit-currency" className="select" value={limitCurrency} onChange={handleCurrencyChange}>
              {CURRENCIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.code}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className={`progress-ring ${statusClass}`}>
          <svg viewBox="0 0 80 80" className="progress-ring__svg">
            <circle className="progress-ring__track" cx="40" cy="40" r="34" />
            <circle
              className="progress-ring__fill"
              cx="40"
              cy="40"
              r="34"
              style={{ strokeDashoffset: 213.6 - (213.6 * pct) / 100 }}
            />
          </svg>
          <div className="progress-ring__text">
            <strong>{Math.round(pct)}%</strong>
          </div>
        </div>
      </div>

      <div className="budget-summary">
        <span>
          Сегодня: <strong>{formatAmount(todayTotal, limitCurrency)}</strong>
        </span>
        {limit > 0 && (
          <span className="budget-limit">из {formatAmount(limit, limitCurrency)}</span>
        )}
      </div>

      {limit <= 0 && <p className="budget-empty">Введите сумму выше, чтобы начать отслеживать дневной лимит.</p>}

      {limit > 0 && (
        <div className="streak-line">
          <span className="streak-badge">🔥 {streak}</span>
          <span>дней без превышения лимита</span>
          {streak >= 3 && <span className="achievement">🏅 3 дня</span>}
          {streak >= 7 && <span className="achievement">🥈 7 дней</span>}
          {streak >= 30 && <span className="achievement">🥇 30 дней</span>}
        </div>
      )}

      {overLimit && (
        <p className="error-text">Сегодняшние траты превышают лимит.</p>
      )}
    </section>
  );
}
