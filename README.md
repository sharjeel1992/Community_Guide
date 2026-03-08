# Community Guardian

Community Guardian is a lightweight, local-first safety dashboard built for neighborhood groups, remote workers, and elderly users. It helps people report alerts, organize incidents, and receive calm, practical guidance through AI-assisted analysis with a reliable fallback system.

## Core Flow

The application supports a simple end-to-end workflow:

1. Create an alert using the form with:
   - title
   - description
   - location
   - severity

2. View alerts in the dashboard list

3. Update alert status directly from each card:
   - `new`
   - `investigating`
   - `resolved`

4. Search and filter alerts by:
   - free-text query (`q`)
   - severity
   - status

## AI Integration and Fallback

Community Guardian includes an AI-assisted analysis feature that helps users understand alerts more quickly.

### AI capabilities
Implemented in `src/ai.js`

- categorizes alerts
- generates a short summary
- provides a calm, practical action checklist

### Fallback capabilities
Implemented in `src/fallback.js`

- uses deterministic keyword-based rules
- automatically takes over if AI is unavailable

The fallback is used when:
- the API key is missing
- quota or billing limits are reached
- the AI response cannot be parsed
- the API request fails

This ensures the system remains usable even when external AI services are not available.

## Basic Quality

The project includes validation, clear feedback, and automated tests.

### Validation
Implemented in:
- `src/validation.js`
- `public/app.js`

Features:
- input validation with clear per-field errors
- invalid fields highlighted in the UI
- API returns validation details for bad requests

### Tests
The project includes automated tests for core functionality:

- valid alert creation and analysis storage
- invalid alert rejection
- search and severity filtering

Run tests with:

```bash
npm test
