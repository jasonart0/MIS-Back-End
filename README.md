# MIS Backend

Express/TypeScript and PostgreSQL API for the leads-first Growth Hub.

## Setup

Requirements: Node.js 20+ and PostgreSQL 14+.

```powershell
npm install
Copy-Item .env.example .env
npm run db:validate
npm run db:generate
npm run db:migrate
npm run db:seed
npm run build
npm run dev
```

Set `DATABASE_URL` in `.env`. Development writes require
`ALLOW_UNAUTHENTICATED_WRITES=true`; this bypass is rejected in production.

`db:seed` adds sample leads and tasks. Every task belongs to exactly one lead.

## Data model

- A lead stores its profile, company and industry, source, status, score, win
  probability, estimated value, next action, last-contact time, tags, notes,
  activities, and tasks.
- A task has one required `leadId`. The task collection can be filtered with
  `GET /tasks?leadId=<uuid>`.
- Retired Contacts and lead-conversion data is not exposed by Prisma or the API.
  The leads-first migration moves any historical tables to the PostgreSQL
  `archive` schema so removal from the product does not destroy old data.

## API

Base route: `/api/growth-hub/sales`.

Leads:

- `GET /leads`, `GET /leads/:id`
- `POST /leads`, `PATCH /leads/:id`, `DELETE /leads/:id`
- `GET|POST /leads/:id/activities`

`GET /leads/:id` includes that lead's tasks and activities for the details page.

Tasks:

- `GET /tasks`, `GET /tasks/:id`
- `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id`
- `GET|POST /tasks/:id/subtasks`
- `GET|POST /tasks/:id/checklist`, `PATCH|DELETE /tasks/:id/checklist/:itemId`
- `GET|POST /tasks/:id/comments`, `PATCH|DELETE /tasks/:id/comments/:itemId`
- `GET|POST /tasks/:id/attachments`, `PATCH|DELETE /tasks/:id/attachments/:itemId`
- `GET|POST /tasks/:id/time-entries`, `PATCH|DELETE /tasks/:id/time-entries/:itemId`
- `GET|PUT /tasks/:id/tags`
- `GET /tasks/:id/activities`

Example task payload:

```json
{
  "leadId": "00000000-0000-4000-8000-000000000001",
  "title": "Schedule discovery call",
  "status": "NEW",
  "priority": "MEDIUM",
  "progress": 0,
  "tags": ["follow-up"]
}
```
