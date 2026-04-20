# Japan IA Calendar 🗾

A visual Japan 2026 calendar for **Irving Lee**, highlighting **Golden Week** and tracking PTO for the Japan IA team:
**Tony · Eric · Soichi · Yukino · Yoshi**.

## ✨ Features

- 📅 Full 2026 Japan calendar (April / May shown first — Golden Week)
- 🟧 Golden Week (Apr 29 – May 6) highlighted at a glance
- 🟥 All Japanese public holidays labeled in 日本語
- 🟢 PTO entry per team member with color coding
- 💾 Vacations stored in `vacations.json` for team-wide sharing
- 🌐 Static site — deployed via GitHub Pages

## 🚀 Local Preview

Open `index.html` directly, or:

```bash
python -m http.server 8000
# visit http://localhost:8000
```

## ✏️ Updating Team Vacations

1. Open the deployed site
2. Use the **Set Vacation** form to add entries (auto-saved to your browser)
3. Click **⬇️ Download vacations.json** (or **📋 Copy JSON**)
4. Replace `vacations.json` in the repo and commit / open a PR
5. After merge, everyone sees the latest vacations on next page load

## 📦 Deployment (GitHub Pages)

Pages is configured to serve from `main` branch root via the included GitHub Actions workflow (`.github/workflows/pages.yml`).

After the first push, enable Pages: **Settings → Pages → Source: GitHub Actions**.

Site URL: `https://<owner>.github.io/japan-ia-calendar/`

## 🗓️ Golden Week 2026

| Date | Day | Holiday |
|------|-----|---------|
| Apr 29 (Wed) | 🇯🇵 | 昭和の日 |
| Apr 30 (Thu) | 💼 | working day — typical PTO |
| May 1 (Fri)  | 💼 | working day — typical PTO |
| May 2 (Sat)  | 🟦 | weekend |
| May 3 (Sun)  | 🇯🇵 | 憲法記念日 |
| May 4 (Mon)  | 🇯🇵 | みどりの日 |
| May 5 (Tue)  | 🇯🇵 | こどもの日 |
| May 6 (Wed)  | 🇯🇵 | 振替休日 (May 3 fell on Sun) |

Take **Apr 30 + May 1** off and you have an **8-day** continuous break.
