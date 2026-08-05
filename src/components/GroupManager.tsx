import { useState, type FormEvent, type ChangeEvent } from "react";
import type { Group } from "../types";

interface Props {
  groups: Group[];
  selectedGroupId: string | null;
  onSelect: (id: string | null) => void;
  onAdd: (name: string) => void;
  onEdit: (id: string, name: string) => void;
  onDelete: (id: string) => void;
}

const ALL = "__all__";
const NONE = "__none__";

export function GroupManager({ groups, selectedGroupId, onSelect, onAdd, onEdit, onDelete }: Props) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const selectValue =
    selectedGroupId === null ? ALL : selectedGroupId === "" ? NONE : selectedGroupId;

  function handleSelectChange(e: ChangeEvent<HTMLSelectElement>) {
    const value = e.target.value;
    if (value === ALL) onSelect(null);
    else if (value === NONE) onSelect("");
    else onSelect(value);
  }

  function handleAdd(e: FormEvent) {
    e.preventDefault();
    const trimmed = newName.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewName("");
  }

  function startEdit(group: Group) {
    setEditingId(group.id);
    setEditName(group.name);
  }

  function submitEdit(id: string) {
    const trimmed = editName.trim();
    if (trimmed) onEdit(id, trimmed);
    setEditingId(null);
    setEditName("");
  }

  return (
    <section className="card group-manager">
      <div className="card-title">Поездки / проекты</div>

      <div className="field">
        <label htmlFor="group-filter">Показать</label>
        <select id="group-filter" className="select" value={selectValue} onChange={handleSelectChange}>
          <option value={ALL}>Все группы</option>
          <option value={NONE}>Без группы</option>
          {groups.map((g) => (
            <option key={g.id} value={g.id}>
              {g.name}
            </option>
          ))}
        </select>
      </div>

      <form className="group-add-form" onSubmit={handleAdd}>
        <input
          className="input"
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="Новая поездка"
          aria-label="Название новой группы"
        />
        <button type="submit" className="btn btn-sm btn-primary" disabled={!newName.trim()}>
          Добавить
        </button>
      </form>

      {groups.length > 0 && (
        <ul className="group-list">
          {groups.map((g) => (
            <li key={g.id} className="group-item">
              {editingId === g.id ? (
                <form
                  className="group-edit-form"
                  onSubmit={(e) => {
                    e.preventDefault();
                    submitEdit(g.id);
                  }}
                >
                  <input
                    className="input input-sm"
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    autoFocus
                  />
                  <button type="submit" className="btn btn-sm btn-primary">
                    Ок
                  </button>
                </form>
              ) : (
                <>
                  <span className="group-name">{g.name}</span>
                  <div className="group-actions">
                    <button
                      type="button"
                      className="icon-btn-sm"
                      onClick={() => startEdit(g)}
                      aria-label="Переименовать"
                    >
                      ✎
                    </button>
                    <button
                      type="button"
                      className="icon-btn-sm"
                      onClick={() => {
                        if (confirm(`Удалить группу «${g.name}»? Траты останутся без группы.`)) {
                          onDelete(g.id);
                        }
                      }}
                      aria-label="Удалить"
                    >
                      🗑
                    </button>
                  </div>
                </>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
