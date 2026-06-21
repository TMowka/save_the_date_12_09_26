# Deploying the site (Cloudflare Pages + GitHub)

The static site is built from source (`npm run build` → `dist/`) and served by
Cloudflare Pages. On every `git push`, Cloudflare rebuilds and publishes the
site. Free address like `https://<project>.pages.dev`.

The form backend (Google Apps Script) is set up separately — see
[`backend/SETUP.md`](./backend/SETUP.md).

## 1. Repository on GitHub

The repo already lives at `TMowka/save_the_date_12_09_26` (branch `main`).
To push from a clean clone:

```bash
cd save_the_date_12_09_26
git remote add origin git@github.com:TMowka/save_the_date_12_09_26.git
git push -u origin main
```

## 2. Connect Cloudflare Pages

1. <https://dash.cloudflare.com> → **Workers & Pages** → **Create** →
   the **Pages** tab → **Connect to Git** → pick the repository.
   ⚠️ Use **Pages**, not Workers — Pages is built for static sites and never
   uploads `node_modules`.
2. Build settings:
   - **Framework preset:** None
   - **Build command:** `npm run build`
   - **Build output directory:** `dist`
3. **Save and Deploy**. In about a minute the site is live at
   `https://<project>.pages.dev`.
4. The subdomain = the project name. To get `nastya-tima.pages.dev`, set that
   name when creating the project (or rename the project in settings).

## 3. Wire up the form and ship

1. Deploy the Apps Script per [`backend/SETUP.md`](./backend/SETUP.md) and copy
   its URL.
2. Set the URL in `scripts/main.js`:
   ```js
   var RSVP_ENDPOINT = "https://script.google.com/macros/s/XXXX/exec";
   ```
3. Commit and push — Cloudflare rebuilds automatically:
   ```bash
   git add scripts/main.js && git commit -m "Connect RSVP endpoint" && git push
   ```

That's it. From here, any `git push` to `main` = an automatic deploy. Cloudflare
runs the build, so `dist/` is not committed to the repo (it's in `.gitignore`).

## Notes

- **Node version:** the build pins Node via `.node-version`. If a Pages build
  fails on an unsupported Node version, lower it to an LTS (e.g. `22`) — the
  build itself has no version-specific requirements.
- **`og:image`** is a relative path; social scrapers need an absolute URL. Once
  the domain is known, set it in `index.html` before sharing the link.
