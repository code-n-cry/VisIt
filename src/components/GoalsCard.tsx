import { useState, type FormEvent } from "react";
import type { Goal } from "../types";
import { CURRENCIES } from "../config/currencies";
import { formatAmount } from "../lib/format";

interface Props {
  goals: Goal[];
  onAdd: (name: string, targetAmount: number, targetCurrency: string) => void;
  onDelete: (id: string) => void;
  onContribute: (id: string, amount: number) => void;
}

export function GoalsCard({ goals, onAdd, onDelete, onContribute }: Props) {
  const [name, setName] = useState("");
  const [target, setTarget] = useState("");
  const [currency, setCurrency] = useState("USD");
  const [contrib, setContrib] = useState<Record<string, string>>({});

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    const amount = Number(target.replace(",", "."));
    if (!trimmed || !Number.isFinite(amount) || amount <= 0) return;
    onAdd(trimmed, amount, currency);
    setName("");
    setTarget("");
  }

  function submitContribute(goal: Goal) {
    const raw = contrib[goal.id] ?? "";
    const amount = Number(raw.replace(",", "."));
    if (!Number.isFinite(amount) || amount === 0) return;
    onContribute(goal.id, amount);
    setContrib((prev) => ({ ...prev, [goal.id]: "" }));
  }

  return (
    <section className="card goals-card">
      <div className="card-title">Цели / накопления</div>

      <form className="goal-add-form" onSubmit={handleAdd}>
        <input
          className="input"
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Например, Новый ноутбук"
          aria-label="Название цели"
        />
        <input
          className="input"
          type="number"
          min={0}
          step={0.01}
          value={target}
          onChange={(e) => setTarget(e.target.value)}
          placeholder="Сумма"
          aria-label="Целевая сумма"
        />
        <select className="select" value={currency} onChange={(e) => setCurrency(e.target.value)}>
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}
            </option>
          ))}
        </select>
        <button type="submit" className="btn btn-primary" disabled={!name.trim() || !target}>
          Добавить
        </button>
      </form>

      {goals.length === 0 && <p className="hint">Пока нет целей — добавьте первую выше.</p>}

      <ul className="goal-list">
        {goals.map((g) => {
          const pct = g.targetAmount > 0 ? Math.min((g.savedAmount / g.targetAmount) * 100, 100) : 0;
          const done = g.savedAmount >= g.targetAmount;
          return (
            <li key={g.id} className={`goal-item${done ? " goal-item--done" : ""}`}>
              <div className="goal-head">
                <span className="goal-name">{g.name}</span>
                <button
                  type="button"
                  className="icon-btn-sm"
                  onClick={() => {
                    if (confirm(`Удалить цель «${g.name}»?`)) onDelete(g.id);
                  }}
                  aria-label="Удалить цель"
                >
                  🗑
                </button>
              </div>

              <div className="goal-progress">
                <div className="goal-progress-track">
                  <div className="goal-progress-fill" style={{ width: `${pct}%` }} />
                </div>
                <div className="goal-numbers">
                  <span>
                    {formatAmount(g.savedAmount, g.targetCurrency)} / {formatAmount(g.targetAmount, g.targetCurrency)}
                  </span>
                  <span>{Math.round(pct)}%</span>
                </div>
              </div>

              {!done && (
                <form
                  className="goal-contribute"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitContribute(g);
                  }}
                >
                  <input
                    className="input input-sm"
                    type="number"
                    step={0.01}
                    value={contrib[g.id] ?? ""}
                    onChange={(e) => setContrib((prev) => ({ ...prev, [g.id]: e.target.value }))}
                    placeholder="Добавить"
                  />
                  <button type="submit" className="btn btn-sm btn-primary">
                    +
                  </button>
                </form>
              )}

              {done && <div className="goal-done-badge">🎉 Цель достигнута!</div>}
            </li>
          );
        })}
      </ul>
    </section>
  );
}
