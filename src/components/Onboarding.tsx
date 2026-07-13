import { useState } from "react";
import logo from "../assets/logo.svg";
import { CURRENCIES, DEFAULT_CURRENCY } from "../config/currencies";
import type { Settings } from "../types";

export function Onboarding({ onDone }: { onDone: (settings: Settings) => void }) {
  const [name, setName] = useState("");
  const [currency, setCurrency] = useState(DEFAULT_CURRENCY);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    onDone({ userName: trimmed, displayCurrency: currency });
  }

  return (
    <div className="onboarding">
      <img src={logo} alt="" />
      <div>
        <h1>VisIt</h1>
        <p>Visualise It — считай траты по категориям, видь картину сразу</p>
      </div>
      <form className="card onboarding-card" onSubmit={submit}>
        <div className="field">
          <label htmlFor="name">Как вас зовут?</label>
          <input
            id="name"
            className="input"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Например, Егор"
            autoFocus
            required
          />
        </div>
        <div className="field">
          <label htmlFor="currency">Основная валюта</label>
          <select
            id="currency"
            className="select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code} — {c.name}
              </option>
            ))}
          </select>
          <p className="hint">
            В ней будут показаны итоги по категориям. Можно поменять позже.
          </p>
        </div>
        <button type="submit" className="btn btn-primary btn-block">
          Начать
        </button>
      </form>
      <p className="hint">Данные хранятся только в этом браузере, на этом устройстве.</p>
    </div>
  );
}
