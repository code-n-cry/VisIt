# VisIt — Visualise It

Простой трекер трат: вводишь категорию и сумму — сразу видишь график по
категориям. Работает полностью в браузере (localStorage), без бэкенда.

- Быстрый ввод: категория остаётся выбранной после добавления траты, чтобы
  ввести подряд несколько трат одной категории (например, "Alipay" →
  "такси", "доставка", ...).
- Диаграмма по категориям, конвертация в валюту отображения по живому курсу
  (exchangerate-api.com, без ключа), встроенный конвертер валют.
- Экспорт/импорт данных в JSON.
- Устанавливается на главный экран iOS (Add to Home Screen) как standalone-приложение.

## Разработка

```bash
npm install
npm run dev
```

## Код-first конфигурация

- `src/config/categories.ts` — категории, с которых начинается чистая установка.
- `src/config/currencies.ts` — список валют в выпадающих списках.

Данные каждого пользователя хранятся в `localStorage` этого браузера в виде
обычного JSON (см. `src/lib/storage.ts`); экспорт/импорт из меню (⋯) в шапке
даёт читаемый JSON-файл трат.

## Деплой

Пуш в `main` собирает и публикует сайт на GitHub Pages через
`.github/workflows/deploy.yml`.

## Cloud account sync

GitHub Pages remains the frontend host. Account login and cross-device data sync use Supabase Auth + Postgres.

1. Create a Supabase project.
2. In Supabase SQL Editor, run `supabase/schema.sql`.
3. In Supabase Auth URL settings, set the site URL to `https://code-n-cry.github.io/VisIt/`.
4. Add this redirect URL too: `http://localhost:5173/VisIt/`.
5. Add GitHub repository secrets:
   - `VITE_SUPABASE_URL`
   - `VITE_SUPABASE_PUBLISHABLE_KEY`
6. For local development, copy `.env.example` to `.env.local` and fill in the same values.

The app still works without Supabase env variables, but data stays local to the browser.
