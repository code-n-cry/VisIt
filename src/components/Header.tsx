import { useRef, useState } from "react";
import logo from "../assets/logo.svg";
import { CURRENCIES } from "../config/currencies";

interface Props {
  userName: string;
  displayCurrency: string;
  onChangeCurrency: (code: string) => void;
  onExport: () => void;
  onImport: (file: File) => void;
  onReset: () => void;
}

export function Header({ userName, displayCurrency, onChangeCurrency, onExport, onImport, onReset }: Props) {
  const [open, setOpen] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  return (
    <header className="header">
      <div className="brand">
        <img src={logo} alt="VisIt" />
        <div className="brand-text">
          <span className="brand-title">VisIt</span>
          <span className="brand-user">{userName}</span>
        </div>
      </div>

      <div className="header-actions">
        <select
          className="select"
          style={{ width: "auto" }}
          value={displayCurrency}
          onChange={(e) => onChangeCurrency(e.target.value)}
          aria-label="Основная валюта"
        >
          {CURRENCIES.map((c) => (
            <option key={c.code} value={c.code}>
              {c.code}
            </option>
          ))}
        </select>

        <button
          type="button"
          className="icon-btn"
          aria-haspopup="menu"
          aria-expanded={open}
          onClick={() => setOpen((v) => !v)}
        >
          ⋯
        </button>

        {open && (
          <div className="menu" role="menu">
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                onExport();
                setOpen(false);
              }}
            >
              Экспорт JSON
            </button>
            <button
              type="button"
              role="menuitem"
              onClick={() => {
                fileRef.current?.click();
              }}
            >
              Импорт JSON
            </button>
            <input
              ref={fileRef}
              type="file"
              accept="application/json"
              style={{ display: "none" }}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file) onImport(file);
                e.target.value = "";
                setOpen(false);
              }}
            />
            <hr />
            <button
              type="button"
              role="menuitem"
              className="danger"
              onClick={() => {
                if (confirm("Удалить все данные VisIt из этого браузера?")) {
                  onReset();
                }
                setOpen(false);
              }}
            >
              Сбросить всё
            </button>
          </div>
        )}
      </div>
    </header>
  );
}
