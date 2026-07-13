import { useEffect, useRef, useState } from "react";
import type { Category } from "../types";
import { CURRENCIES } from "../config/currencies";

const NEW_CATEGORY = "__new__";

interface Props {
  categories: Category[];
  displayCurrency: string;
  onAddCategory: (name: string) => Category;
  onAddEntry: (entry: { categoryId: string; name: string; amount: number; currency: string }) => void;
}

export function QuickAddForm({ categories, displayCurrency, onAddCategory, onAddEntry }: Props) {
  const [categoryId, setCategoryId] = useState<string>(categories[0]?.id ?? NEW_CATEGORY);
  const [newCategoryName, setNewCategoryName] = useState("");
  const [itemName, setItemName] = useState("");
  const [amount, setAmount] = useState("");
  const [currency, setCurrency] = useState(displayCurrency);
  const [error, setError] = useState<string | null>(null);
  const nameInputRef = useRef<HTMLInputElement>(null);

  // keep a valid selection if the category list changes under us
  useEffect(() => {
    if (categoryId !== NEW_CATEGORY && !categories.some((c) => c.id === categoryId)) {
      setCategoryId(categories[0]?.id ?? NEW_CATEGORY);
    }
  }, [categories, categoryId]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    let targetCategoryId = categoryId;
    if (categoryId === NEW_CATEGORY) {
      const trimmed = newCategoryName.trim();
      if (!trimmed) {
        setError("Введите название категории");
        return;
      }
      const existing = categories.find((c) => c.name.toLowerCase() === trimmed.toLowerCase());
      targetCategoryId = existing ? existing.id : onAddCategory(trimmed).id;
    }

    const trimmedName = itemName.trim();
    const parsedAmount = Number(amount.replace(",", "."));
    if (!trimmedName) {
      setError("Введите название траты");
      return;
    }
    if (!Number.isFinite(parsedAmount) || parsedAmount <= 0) {
      setError("Сумма должна быть больше нуля");
      return;
    }

    onAddEntry({ categoryId: targetCategoryId, name: trimmedName, amount: parsedAmount, currency });

    // Stay on the same category/currency so several expenses in a row are fast to enter.
    setCategoryId(targetCategoryId);
    setNewCategoryName("");
    setItemName("");
    setAmount("");
    nameInputRef.current?.focus();
  }

  return (
    <form className="card stack" onSubmit={submit}>
      <div className="card-title">Добавить трату</div>

      <div className="field">
        <label htmlFor="category">Категория</label>
        <select
          id="category"
          className="select"
          value={categoryId}
          onChange={(e) => setCategoryId(e.target.value)}
        >
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
          <option value={NEW_CATEGORY}>+ Новая категория</option>
        </select>
      </div>

      {categoryId === NEW_CATEGORY && (
        <div className="field">
          <label htmlFor="new-category">Название категории</label>
          <input
            id="new-category"
            className="input"
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Например, Alipay"
          />
        </div>
      )}

      <div className="row">
        <div className="field">
          <label htmlFor="item-name">Что купили</label>
          <input
            id="item-name"
            ref={nameInputRef}
            className="input"
            value={itemName}
            onChange={(e) => setItemName(e.target.value)}
            placeholder="Такси"
          />
        </div>
      </div>

      <div className="row">
        <div className="field">
          <label htmlFor="amount">Сумма</label>
          <input
            id="amount"
            className="input"
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            placeholder="0"
          />
        </div>
        <div className="field" style={{ flex: "0 0 110px" }}>
          <label htmlFor="entry-currency">Валюта</label>
          <select
            id="entry-currency"
            className="select"
            value={currency}
            onChange={(e) => setCurrency(e.target.value)}
          >
            {CURRENCIES.map((c) => (
              <option key={c.code} value={c.code}>
                {c.code}
              </option>
            ))}
          </select>
        </div>
      </div>

      {error && <p className="error-text">{error}</p>}

      <button type="submit" className="btn btn-primary btn-block">
        Добавить
      </button>
    </form>
  );
}
