import { useState } from "react";
import type { FormEvent } from "react";
import type { SyncStatus } from "../hooks/useAppData";
import type { AuthState } from "../hooks/useAuth";

interface Props {
  auth: AuthState;
  syncStatus: SyncStatus;
  syncError: string | null;
  cloudUpdatedAt: string | null;
  onSyncNow: () => Promise<void>;
}

const SYNC_LABELS: Record<SyncStatus, string> = {
  local: "Локально",
  loading: "Загрузка",
  saving: "Сохранение",
  synced: "Синхронизировано",
  error: "Ошибка",
};

function formatSyncTime(value: string | null): string | null {
  if (!value) return null;
  return new Intl.DateTimeFormat("ru", {
    day: "2-digit",
    month: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(value));
}

export function AccountPanel({ auth, syncStatus, syncError, cloudUpdatedAt, onSyncNow }: Props) {
  const [mode, setMode] = useState<"sign-in" | "sign-up">("sign-in");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const syncTime = formatSyncTime(cloudUpdatedAt);

  if (!auth.configured) {
    return (
      <section className="card account-panel">
        <div className="card-title">Аккаунт</div>
        <p className="hint">Синхронизация появится после настройки Supabase.</p>
      </section>
    );
  }

  if (auth.user) {
    return (
      <section className="card account-panel">
        <div className="account-head">
          <div>
            <div className="card-title">Аккаунт</div>
            <div className="account-email">{auth.user.email}</div>
          </div>
          <span className={`sync-pill sync-pill--${syncStatus}`}>{SYNC_LABELS[syncStatus]}</span>
        </div>

        {syncTime && <p className="hint">Последнее сохранение: {syncTime}</p>}
        {syncError && <p className="error-text">{syncError}</p>}
        {auth.error && <p className="error-text">{auth.error}</p>}

        <div className="row">
          <button type="button" className="btn" onClick={onSyncNow} disabled={syncStatus === "saving"}>
            Сохранить
          </button>
          <button type="button" className="btn" onClick={auth.signOut} disabled={auth.loading}>
            Выйти
          </button>
        </div>
      </section>
    );
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const trimmedEmail = email.trim();
    if (!trimmedEmail || !password) return;
    if (mode === "sign-in") {
      await auth.signIn(trimmedEmail, password);
    } else {
      await auth.signUp(trimmedEmail, password);
    }
  }

  return (
    <section className="card account-panel">
      <div className="account-head">
        <div className="card-title">Аккаунт</div>
        <div className="segmented-control" aria-label="Режим входа">
          <button
            type="button"
            className={mode === "sign-in" ? "is-active" : ""}
            onClick={() => {
              setMode("sign-in");
              auth.clearAuthMessage();
            }}
          >
            Вход
          </button>
          <button
            type="button"
            className={mode === "sign-up" ? "is-active" : ""}
            onClick={() => {
              setMode("sign-up");
              auth.clearAuthMessage();
            }}
          >
            Новый
          </button>
        </div>
      </div>

      <form className="account-form" onSubmit={handleSubmit}>
        <div className="field">
          <label htmlFor="account-email">Email</label>
          <input
            id="account-email"
            className="input"
            type="email"
            autoComplete="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
        </div>

        <div className="field">
          <label htmlFor="account-password">Пароль</label>
          <input
            id="account-password"
            className="input"
            type="password"
            autoComplete={mode === "sign-in" ? "current-password" : "new-password"}
            minLength={6}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>

        {auth.notice && <p className="hint">{auth.notice}</p>}
        {auth.error && <p className="error-text">{auth.error}</p>}

        <button type="submit" className="btn btn-primary btn-block" disabled={auth.loading}>
          {mode === "sign-in" ? "Войти" : "Создать аккаунт"}
        </button>
      </form>
    </section>
  );
}
