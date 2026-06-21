# RSVP backend on Google Apps Script

The RSVP form on the wedding site posts to a Google Apps Script web app that
**appends a row to a Google Sheet** and **emails you** the submission. No server
to run — it works regardless of where the static site is hosted.

## What you need

- A Google account (the one that should receive the submissions).

## Steps

### 1. Create a spreadsheet

1. Open [sheets.new](https://sheets.new) — this creates an empty Google Sheet.
2. Name it, e.g. "RSVP — Nastya & Tima". The `RSVP` tab and its header row are
   created automatically on the first submission.

### 2. Add the script

1. In the spreadsheet: **Extensions → Apps Script**.
2. Delete the contents of `Code.gs` and paste the code from
   [`backend/Code.gs`](./Code.gs).
3. At the top of the file, set your address in `NOTIFY_EMAIL`.
4. Save (Ctrl/Cmd+S).

### 3. Deploy as a web app

1. **Deploy → New deployment** (the ⚙️ icon → "Web app").
2. Settings:
   - **Description** — anything.
   - **Execute as** — *Me*.
   - **Who has access** — **Anyone**. ⚠️ Required, otherwise the site gets an
     access error.
3. Click **Deploy**. Google will ask for permissions (send email + access the
   spreadsheet) — approve them for your account.
4. Copy the **Web app URL** — it looks like
   `https://script.google.com/macros/s/XXXX/exec`.

### 4. Connect it to the site

In [`scripts/main.js`](../scripts/main.js), put the copied URL near the top of
the file:

```js
var RSVP_ENDPOINT = "https://script.google.com/macros/s/XXXX/exec";
```

An empty string = demo mode (the form "submits" but goes nowhere).

> Commit and push — Cloudflare Pages rebuilds the site automatically. (If you
> build locally with `npm run build`, the `dist/` copy is regenerated from
> source, so there is nothing to edit there by hand.)

### 5. Verify

Open the site, fill in the form, submit. You should get:
- a new row in the spreadsheet (timestamp + all fields);
- an email to `NOTIFY_EMAIL` with the subject `RSVP: <name>`.

## How it works (for debugging)

- The site sends a `POST` with a `text/plain` body (a JSON string) and
  `mode: "no-cors"`. This avoids the CORS preflight that Apps Script can't
  handle. Trade-off: the front end can't read the response body — success means
  the request was delivered. That's why field validation runs on the client
  before sending.
- The "menu" and "drinks" checkboxes arrive as arrays (they are fields that
  share a `name`); in the sheet/email they are joined with commas.
- The honeypot field `company` is not sent to the backend (bots are filtered
  on the client).

## Updating the script

After editing `Code.gs`: **Deploy → Manage deployments → ✏️ → New version →
Deploy**. The URL stays the same — no need to touch the site.
