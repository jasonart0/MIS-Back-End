# MIS Backend

Modular Express/TypeScript API and shared PostgreSQL database for MIS Growth Hub Sales. The React project is separate and is not modified here.

## Requirements and setup

- Node.js 20 or newer
- PostgreSQL 14 or newer (not installed or running on the inspected machine)
- A local PostgreSQL role/database configured by the operator

Install packages and configure the connection:

```powershell
npm install
Copy-Item .env.example .env
```

Replace the placeholder `DATABASE_URL` in `.env` with the credentials for an existing local PostgreSQL role and the intended database. Do not commit `.env`.

Before applying the initial migration, inspect the target database and its existing tables. This migration creates the Sales tables and does not drop data, but an existing incompatible schema must be reconciled before deployment. No database, role, credentials, or migration was created/applied by this project setup.

```powershell
npm run db:validate
npm run db:generate
npm run db:migrate
npm run build
npm run dev
```

`db:migrate` runs checked-in migrations without resetting the database. For a reviewed development migration after changing the schema, use `npm run db:migrate:dev`; review the generated SQL before applying it. Never use database reset or force-reset commands on user data.

## Security and identity limitations

There is no existing authentication, authorization, shared User/Employee, or Project model in this backend workspace. User ownership/actor IDs are optional UUID references only; they are not verified against users and are never treated as authenticated identities. No CRM, HR, or Project model is introduced.

Sales data routes are disabled in production until authentication and authorization middleware are integrated. In development, read routes are available; write routes return `403` by default. To enable local-only writes against a disposable/local database, explicitly set `ALLOW_UNAUTHENTICATED_WRITES=true` in `.env`. The application rejects that setting when `NODE_ENV=production`. Do not use the development bypass with a shared or production database.

Task attachments are metadata only; no file upload or storage service is included. Task tags are normalized to lowercase. Satisfaction scores use a documented range of 0–100. Monetary amounts allow at most two fractional digits and a maximum of 9,999,999,999.99. Task and lead statuses are strings with conservative defaults (`NEW`); approval uses `PENDING` → `APPROVED`, followed by conversion to `CONVERTED`.

The initial migration includes database-level checks for score, satisfaction, progress, nonnegative monetary/file/time values, and chronological time entries. All relationship foreign keys use restrictive deletion; application endpoints refuse deletion when history or related records exist.

## API

Base route: `/api/growth-hub/sales`. JSON validation rejects unknown fields. Collection endpoints return `{ "data": [], "pagination": { "page": 1, "pageSize": 25, "total": 0, "totalPages": 0 } }`. Errors use `{ "error": { "code": "...", "message": "...", "details": [] } }`.

Health:

- `GET /api/health`
- `GET /api/health/database` — runs `SELECT 1`, returns `503` with a sanitized error when unavailable.

Leads:

- `GET /leads`, `GET /leads/:id`, `POST /leads`, `PATCH /leads/:id`, `DELETE /leads/:id`
- `GET|POST /leads/:id/activities`
- `POST /leads/:id/approve`, `POST /leads/:id/convert`, `GET /leads/:id/conversions`

Contacts:

- `GET /contacts`, `GET /contacts/:id`, `POST /contacts`, `PATCH /contacts/:id`, `DELETE /contacts/:id`
- `GET|POST /contacts/:id/activities`

Tasks:

- `GET /tasks`, `GET /tasks/:id`, `POST /tasks`, `PATCH /tasks/:id`, `DELETE /tasks/:id`
- `GET|POST /tasks/:id/subtasks`
- `GET|POST /tasks/:id/checklist`, `PATCH|DELETE /tasks/:id/checklist/:itemId`
- `GET|POST /tasks/:id/comments`, `PATCH|DELETE /tasks/:id/comments/:itemId`
- `GET|POST /tasks/:id/attachments`, `PATCH|DELETE /tasks/:id/attachments/:itemId`
- `GET|POST /tasks/:id/time-entries`, `PATCH|DELETE /tasks/:id/time-entries/:itemId`
- `GET|PUT /tasks/:id/tags`
- `PUT /tasks/:id/relationships` with lead and contact ID arrays
- `GET /tasks/:id/activities`

Every listed write endpoint requires the local-development opt-in until authentication is integrated. Lead/contact/task deletion is rejected when relationships or history exist. Checklist updates do not change task progress. Parent reassignment rejects self-parenting and cycles. Lead approval and conversion are transactional; conversion retains the source lead and its task links, links or creates one originating contact, and is idempotent for repeat conversion requests.

## Example payloads

Create lead:

```json
{
  "firstName": "Avery",
  "lastName": "Morgan",
  "email": "avery@example.com",
  "companyName": "Example Co",
  "status": "NEW",
  "score": 25,
  "estimatedDealValue": 12000
}
```

Create contact:

```json
{
  "firstName": "Riley",
  "lastName": "Jordan",
  "email": "riley@example.com",
  "companyName": "Example Co",
  "status": "ACTIVE",
  "satisfactionScore": 80
}
```

Create task:

```json
{
  "title": "Schedule discovery call",
  "status": "NEW",
  "priority": "MEDIUM",
  "progress": 0,
  "leadIds": ["00000000-0000-4000-8000-000000000001"],
  "tags": ["follow-up"]
}
```

The IDs in examples are illustrative only; relationship IDs must exist. Since the separate frontend currently uses numeric record IDs and a different lead URL, it is not yet wired to this UUID-based API; frontend integration is outside this backend-only change.
