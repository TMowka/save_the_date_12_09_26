# Деплой сайта (Cloudflare Pages + GitHub)

Статика собирается из исходников (`npm run build` → `dist/`) и раздаётся
Cloudflare Pages. На каждый `git push` Cloudflare сам пересобирает и
выкладывает сайт. Бесплатный адрес вида `https://<project>.pages.dev`.

Бэкенд формы (Google Apps Script) настраивается отдельно — см.
[`backend/SETUP.md`](./backend/SETUP.md).

## 1. Залить репозиторий на GitHub

Локальный git-репозиторий уже создан (ветка `main`, первый коммит сделан).
Осталось создать пустой репозиторий на GitHub и запушить.

1. Создай **пустой** репозиторий: <https://github.com/new>
   (рекомендую **Private** — сайт личный и помечен `noindex`).
   ⚠️ Без «Add a README» — у нас уже есть коммиты.
2. Подключи и запушь (подставь свой логин/имя репо):
   ```bash
   cd save_the_date_12_09_26
   git remote add origin git@github.com:USERNAME/REPO.git
   git push -u origin main
   ```

## 2. Подключить Cloudflare Pages

1. <https://dash.cloudflare.com> → **Workers & Pages** → **Create** →
   вкладка **Pages** → **Connect to Git** → выбери репозиторий.
2. Build settings:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. **Save and Deploy**. Через ~минуту сайт будет на `https://<project>.pages.dev`.
4. Поддомен = имя проекта. Чтобы получить `nastya-tima.pages.dev` — задай это
   имя при создании проекта (или переименуй проект в настройках).

## 3. Подключить форму и выкатить

1. Задеплой Apps Script по [`backend/SETUP.md`](./backend/SETUP.md) и скопируй URL.
2. Впиши URL в `scripts/main.js`:
   ```js
   var RSVP_ENDPOINT = "https://script.google.com/macros/s/XXXX/exec";
   ```
3. Коммить и пушь — Cloudflare пересоберёт автоматически:
   ```bash
   git add scripts/main.js && git commit -m "Connect RSVP endpoint" && git push
   ```

Готово. Дальше любой `git push` в `main` = авто-деплой. Сборку запускает
Cloudflare, поэтому `dist/` в репозиторий не коммитится (он в `.gitignore`).
