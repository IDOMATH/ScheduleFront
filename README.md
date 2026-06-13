# ScheduleFront

Angular frontend for the SeasonSchedule app. It provides the public schedule view, admin login flow, event management screens, weekly digest signup, and expanded team season calendars.

This project is intended to sit next to the backend repository:

```text
vibe/
├── SeasonSchedule/
└── ScheduleFront/
```

The backend repository's `docker-compose.yml` builds this project as the `frontend` service.

## Features

- Organization selector for schedule viewing
- One weekly calendar row per team by default
- Clickable team headers that open a larger season calendar
- Weekly digest signup side rail
- Admin login and event management flows
- nginx production container with same-origin API proxying

## Local Development

To start a local development server, run:

```bash
npm start
```

Then open http://localhost:4200.

By default, the development environment calls the backend at `http://localhost:8080/api`, so run the backend separately if you need live API data.

## Docker / Compose

From the sibling backend repository:

```bash
cd ../SeasonSchedule
docker compose up --build
```

The production Angular build uses `apiUrl: '/api'`, and this project's nginx config proxies `/api/`, `/health`, and `/openapi.yaml` to the Compose backend service at `http://backend:8080`.

## Build

To build the project:

```bash
npm run build
```

Build artifacts are written to `dist/front`.

## Tests

```bash
npm test -- --watch=false
```

## Useful Commands

```bash
npm start
npm run build
npm test -- --watch=false
```

## Project Notes

- Angular version: 21.x
- Test runner: Vitest via Angular CLI
- Production server: nginx
- Backend API source: `../SeasonSchedule`
