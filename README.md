## Community Guardian

Community Guardian is a local-first safety dashboard for:
- neighborhood groups
- remote workers
- elderly users

It helps users create alerts, get AI-assisted categorization/summaries, and act on calm, practical checklists.

## Core Flow (Create + View + Update + Search/Filter)

1. Create alert from the form (title, description, location, severity)
2. View alerts in the dashboard list
3. Update alert status (`new`, `investigating`, `resolved`) directly from each card
4. Search/filter alerts by:
   - free-text query (`q`)
   - severity
   - status

## AI Integration + Fallback

- AI capability: categorization + summary + action checklist (`src/ai.js`)
- Fallback capability: deterministic keyword rules (`src/fallback.js`)
- If AI is unavailable (missing key, quota error, parse failure), fallback analysis is used automatically.

## Basic Quality

- Input validation with clear per-field errors (`src/validation.js`, `public/app.js`)
- API returns validation details for invalid payloads
- Tests included:
  - happy path: classify a realistic alert and generate actionable analysis
  - edge case: reject invalid alert input
  - status update validation behavior

Run tests:

```bash
npm test
```

## Data Safety

- Uses synthetic seed data only: `data/alerts.json`
- No live scraping or external data collection
- Frontend uses local static assets only (including background image)
