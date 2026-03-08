# Design Document — Community Guardian

## 1. Project Overview

Community Guardian is a lightweight safety and digital wellness dashboard built to help small communities organize alerts and respond calmly to potential risks. The prototype is designed for neighborhood groups, remote workers, and elderly users who may need a simple way to report suspicious activity, internet issues, scams, or other local concerns.

The system allows users to create alerts, review them in a dashboard, search and filter records, update alert status, and receive AI-assisted categorization, summaries, and recommended actions. If AI is unavailable, the system automatically falls back to deterministic rule-based analysis so that the core workflow remains functional.

This project was intentionally designed as a small, local-first prototype that emphasizes reliability, clarity, and graceful failure handling rather than production-scale complexity.

## Demo Video

Watch the demo here: https://youtu.be/wXnThiO8U9I

---

## 2. Problem Statement

Community members often receive fragmented reports about suspicious emails, scams, outages, and safety concerns. These reports may arrive through text messages, phone calls, or word of mouth and often lack structure or useful follow-up guidance.

The main problems are:
- incident reports are scattered and hard to track
- users may not know how serious a report is
- users may not know what actions to take next
- reliance on external AI services can make a system fragile if APIs fail

Community Guardian addresses these problems by giving users a single dashboard where alerts can be created, reviewed, categorized, and acted upon in a structured way.

---

## 3. Target Users

The prototype is designed with the following users in mind:

### Neighborhood Groups
Residents who want a shared way to track suspicious activity, scams, or service disruptions in their area.

### Remote Workers
Users who depend on internet access and may need to track phishing emails, account security concerns, or local outages.

### Elderly Users
Users who may benefit from simple alert summaries and calm, direct checklists for scams or suspicious communications.

---

## 4. Goals of the Prototype

The main goals of the prototype are:

- provide one complete end-to-end workflow
- allow users to create and manage alerts
- support search and filtering for quick review
- integrate AI in a meaningful but safe way
- include a fallback when AI is unavailable
- validate user input clearly
- demonstrate automated testing of core functionality

This prototype is not intended to be a full production system. It is meant to demonstrate sound software design, responsible AI integration, and reliable user-facing behavior.

---

## 5. Core Features

### Alert Creation
Users can submit a new alert with:
- title
- description
- location
- severity

### Alert Dashboard
Users can view all alerts in a dashboard card layout.

### Status Updates
Each alert can be updated with one of the following statuses:
- `new`
- `investigating`
- `resolved`

### Search and Filtering
Users can:
- search by free-text query
- filter by severity
- filter by status

### AI Analysis
Each alert is analyzed to produce:
- category
- short summary
- recommended action checklist

### Fallback Analysis
If AI is not available, the system uses keyword-based rules to produce a similar result.

---

## 6. System Architecture

The application uses a simple client-server structure.

### Frontend
The frontend is built with:
- HTML
- CSS
- vanilla JavaScript

Responsibilities:
- collect user input
- show inline validation errors
- send requests to the backend
- display alerts, summaries, and actions
- support filtering and status updates

### Backend
The backend is built with:
- Node.js
- Express

Responsibilities:
- serve static frontend files
- expose API endpoints
- validate incoming data
- run AI analysis
- trigger fallback logic if needed
- read and write alert records

### Data Storage
The prototype uses:
- local JSON file storage (`data/alerts.json`)

This choice was made to keep the prototype simple and easy to run locally without adding database setup complexity.

---

## 7. Architecture Flow

A typical flow works like this:

1. User fills out the alert form in the browser
2. Frontend performs quick validation checks
3. Form data is sent to the Express backend
4. Backend performs full validation
5. Backend attempts AI analysis
6. If AI succeeds, the system stores AI-generated category, summary, and checklist
7. If AI fails, fallback logic generates category, summary, and checklist
8. Alert is saved into `alerts.json`
9. Updated alert list is returned and displayed in the UI

---

## 8. Main Components

### `src/server.js`
Starts the Express server and loads environment variables.

### `src/app.js`
Contains the API routes and core application logic, including:
- health route
- get alerts
- create alert
- update alert status

### `src/validation.js`
Handles backend input validation. It checks:
- required fields
- valid severity
- valid status
- number-only location
- gibberish-like text

### `src/ai.js`
Handles AI integration. It:
- calls OpenAI through the Responses API
- expects JSON output
- normalizes AI results
- falls back safely if AI fails

### `src/fallback.js`
Implements deterministic keyword-based analysis used when AI is unavailable.

### `public/app.js`
Handles frontend behavior, including:
- form submission
- inline validation display
- loading alerts
- filtering alerts
- updating status

### `data/alerts.json`
Stores synthetic local alert data for the prototype.

### `tests/alerts.test.js`
Contains automated tests for the API.

---

## 9. API Design

### `GET /api/health`
Returns a health check response to confirm the server is running.

### `GET /api/alerts`
Returns all alerts, optionally filtered by:
- `q`
- `severity`
- `status`

### `POST /api/alerts`
Creates a new alert after validation and analysis.

### `PATCH /api/alerts/:id`
Updates the status of an existing alert.

---

## 10. AI and Fallback Design

### AI Design
The AI feature is intended to make alerts easier to understand. It generates:
- a category
- a calm summary
- a short checklist of actions

This is useful because raw alert descriptions may be messy or unclear. AI adds structure and makes the information easier to act on.

### Why Fallback Is Necessary
AI can fail for several reasons:
- missing API key
- quota or billing limits
- invalid response format
- network failure
- temporary API issues

Because the assignment requires a reliable user experience, the system includes rule-based fallback logic. This means the application still works even if the external AI service is unavailable.

### Fallback Strategy
Fallback analysis scans the alert text for known keywords and maps them to categories such as:
- phishing
- scam
- data breach
- network issue
- physical safety
- general safety

It then generates a matching summary and checklist.

This makes the application robust and demonstrates responsible AI integration.

---

## 11. Validation and Error Handling

Validation exists on both the frontend and backend.

### Frontend Validation
The browser checks user input before sending it to the server. This improves usability by showing immediate feedback.

Examples:
- empty title
- empty description
- empty location
- invalid text patterns

### Backend Validation
The backend performs final validation and rejects bad requests with structured error details. This ensures that data integrity is protected even if frontend validation is bypassed.

### Error Handling
The application handles:
- invalid input
- missing fields
- invalid status updates
- failed AI calls
- unreadable AI response data

When AI fails, fallback is used automatically instead of crashing the workflow.

---

## 12. Data Safety and Privacy

This prototype was designed with simple safety constraints:

- only synthetic data is used
- no live scraping is performed
- no user tracking is included
- AI output is assistive, not authoritative
- original user-entered content remains visible
- the system does not require personal accounts or sensitive real-world data

These decisions reduce privacy risk and keep the prototype appropriate for a classroom/demo environment.

---

## 13. Testing Strategy

The project includes automated tests using:
- Vitest
- Supertest

### Test Coverage
The current test suite verifies:
- successful creation of a valid alert
- rejection of invalid alert input
- filtering by search query and severity

These tests focus on the most important API behaviors and help ensure the prototype is reliable.

---

## 14. Design Tradeoffs

Several design choices were made intentionally:

### JSON Instead of Database
A JSON file was used instead of a database to reduce setup time and keep the prototype easy to run locally.

### Vanilla Frontend Instead of Framework
A simple HTML/CSS/JS frontend was chosen to keep the architecture lightweight and reduce unnecessary complexity.

### AI + Fallback Instead of AI-Only
An AI-only solution would be fragile. The fallback system ensures the prototype continues to work even when the external AI service is unavailable.

### Local-First Scope
The project avoids advanced deployment, authentication, and scaling concerns because the assignment emphasizes functionality, engineering tradeoffs, and responsible design over production polish.

---

## 15. Future Improvements

If this project were extended, future improvements could include:

- user authentication
- role-based access
- persistent database storage
- incident history and audit log
- map-based alert display
- email or SMS notifications
- more advanced moderation and input quality checks
- improved AI prompt controls and confidence display
- analytics dashboard for trends over time

---

## 16. Conclusion

Community Guardian demonstrates a practical and reliable approach to small-scale safety reporting. The system combines structured alert management with AI-assisted analysis while maintaining a graceful fallback path when AI is unavailable.

The design prioritizes:
- simplicity
- reliability
- responsible AI usage
- clear validation
- demonstrable functionality

This makes it a strong prototype for a short technical assignment while still leaving room for future expansion.

