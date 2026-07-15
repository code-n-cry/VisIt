import { useState } from "react";
import { CURRENCIES, DEFAULT_CURRENCY } from "../config/currencies";
import { convert } from "../lib/exchangeRates";
import { formatAmount } from "../lib/format";
import { useExchangeRates } from "../hooks/useExchangeRates";

export function CurrencyConverter({ defaultTo }: { defaultTo: string }) {
  const [amount, setAmount] = useState("100");
  const [from, setFrom] = useState(DEFAULT_CURRENCY);
  const [to, setTo] = useState(defaultTo);
  const [spun, setSpun] = useState(false);
  const { rates, loading, error } = useExchangeRates(to);

  const parsed = Number(amount.replace(",", "."));
  const result = Number.isFinite(parsed) && rates ? convert(parsed, from, to, rates) : null;

  function handleSwap() {
    setFrom(to);
    setTo(from);
    setSpun((v) => !v);
  }

  return (
    <div className="card stack">
      <div className="card-title">Конвертер валют</div>
      <div className="row">
        <div className="field">
          <label htmlFor="conv-amount">Сумма</label>
          <input
            id="conv-amount"
            className="input"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="conv-from">Из</label>
          <select id="conv-from" className="select" value={from} onChange={(e) => setFrom(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          className="icon-btn swap-btn"
          aria-label="Поменять валюты местами"
          style={{ transform: spun ? "rotate(180deg)" : "rotate(0deg)" }}
          onClick={handleSwap}
        >
          ⇄
        </button>
        <div className="field">
          <label htmlFor="conv-to">В</label>
          <select id="conv-to" className="select" value={to} onChange={(e) => setTo(e.target.value)}>
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="converter-result">
        {loading && <span className="hint">Получаем курс…</span>}
        {error && <span className="error-text">{error}</span>}
        {result !== null && !loading && !error && (
          <div>
            <strong>{formatAmount(result, to)}</strong>
          </div>
        )}
      </div>
      <p className="rate-note">Курс: exchangerate-api.com, обновляется раз в сутки.</p>
    </div>
  );
}
