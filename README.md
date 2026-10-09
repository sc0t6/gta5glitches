# GLITCH//LS

GTA Online money methods, money glitches, fun glitches, cheats and a money planner. It updates itself.

## Put it on GitHub Pages

1. Create a new GitHub repository and push this folder to its `main` branch:

   ```bash
   git init -b main
   git add .
   git commit -m "GLITCH//LS"
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPO.git
   git push -u origin main
   ```

2. In the repo, go to **Settings → Pages** and set **Source** to **GitHub Actions**.
3. Open the **Actions** tab. The "Update data and deploy to GitHub Pages" workflow runs on the first push.
   If it doesn't, click it, then **Run workflow**. When it finishes, your site is at
   `https://YOUR-USERNAME.github.io/YOUR-REPO/`.

After that it runs by itself (`.github/workflows/pages.yml`): every 3 hours, and again right after each Thursday
weekly reset. Each run restores the saved data, re-scrapes the sources, saves the result, and redeploys.

**Where the generated data lives:** `data/live.js`, `data/live.json` and `data/state.json` are kept on a separate
`data` branch that the Action creates and updates. They are never committed to `main` (they're in `.gitignore`), so
your own commits can't conflict with the Action's. Locally, `npm start` and `npm run update` regenerate them for you.

If **Settings → Actions → General → Workflow permissions** is read-only, switch it to read and write so the run can
save the data branch.

Notes:
- The site only needs the files the workflow copies (`index.html`, `styles.css`, `app.js`, `data.js`, `cheats.js`
  and `data/live.*`). `server.mjs` and `updater/` are not published.
- The Live button on the published site reloads the latest published data. It can't force a new scrape (only the
  local server can); trigger **Run workflow** in the Actions tab for that.
- GitHub pauses scheduled workflows after 60 days without repo activity. The data-branch commits keep it active.
- If a source blocks GitHub's servers, that part keeps its previous values and the run logs a warning.

### If you ever see a conflict in `data/live.js` or `data/live.json`

That means those files are being tracked on `main` again. They're generated, so either version is fine. Keep the
incoming one, then stop tracking them:

```bash
git checkout --theirs -- data/live.js data/live.json   # add data/state.json if Git lists it as conflicted
git add data
git commit -m "Merge remote data"
git rm --cached data/live.js data/live.json data/state.json
git commit -m "Stop tracking generated data"
git push
```

## Run it locally

```bash
npm start
```

Then open http://localhost:5173. No dependencies are needed (Node 18+).

`npm start` serves the site **and** runs the auto-updater:

- It refreshes the data when it is older than 3 hours (`UPDATE_EVERY_HOURS`), and again right after each
  weekly reset (the new Thursday event appears by itself).
- The **Live** button in the top bar shows the last check, the sources, and what changed. "Check for updates now"
  forces a re-scrape.

To update without the server, run `npm run update`. It rewrites `data/live.json` and `data/live.js`, which the
page reads.

## What updates automatically

| Source | What it refreshes |
| --- | --- |
| GTABase weekly update | This week's event, bonuses, discounts, podium, rewards, Kortz targets, Salvage Yard robberies. Event multipliers and one-off bonuses are applied to the matching money methods and the planner. |
| GTA Boss money guide | Payouts, first-run-of-the-week values, buy-in prices and passive income rates (checked against the shipped values, with sanity limits). |
| r/GTAGlitches working list | The full community glitch list, marked NEW when added and "likely patched" when removed. Curated money-glitch statuses are checked against it. |

If a source is down or changes its layout, that part keeps its previous values and a warning shows in the Live dialog.

## The planner

- **Reach a goal** or **make the most of my time** (how much can I earn in N hours).
- Inputs: cash you already have, properties you own, players (solo / 2 / 3–4), longest single job, methods to skip,
  whether to count passive income, weekly first-run bonuses, and methods where sources disagree.
- Outputs: the fastest route (with cooldowns filled), an ETA in days at your play time per day, every method on
  its own, and a "best next purchase" ranking.
- **Copy plan link** puts your exact plan in a `?plan=` link. Your settings are also saved in your browser.

## Businesses, Rank & RP, Fun Zone

- **Businesses:** 23 properties (passive, semi-passive, hands-on and utility) with buy-in, hourly rate, a verdict and
  a "pairs well with" note. Rates are computed from the same live figures as the planner, and disputed ones are flagged
  and sorted last.
- **Rank & RP:** an RP calculator (rank 100 and up, using the community formula) plus the best ways to earn RP.
- **Fun Zone:** fun activities with their money and RP. Anything boosted in this week's event is badged automatically.

## What is hand-written

The tutorials, tips and ban-risk ratings in `data.js` are reviewed by hand (last review: Oct 5, 2026). Exploit
steps are deliberately not printed: they break with every patch, so each glitch links to the maintained community
guide instead. Cheat codes are in `cheats.js`.

## Files

- `index.html`, `styles.css`, `app.js`: the site
- `data.js`: curated content and fallbacks; `cheats.js`: cheat codes
- `updater/update.mjs`: scrapes the sources and writes `data/live.json` / `data/live.js`
- `server.mjs`: static server + scheduler + `/api/status` and `POST /api/update`
