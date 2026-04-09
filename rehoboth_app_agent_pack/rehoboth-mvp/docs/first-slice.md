# Rehoboth MVP Slice

## 1. Architecture summary

- Stack: React 19, TypeScript, Vite, React Router.
- Shape: modular monolith with one web app, one in-memory state module, seeded domain data, and route-level screens.
- Tenant model: single tenant only. No auth, org switching, or multi-office complexity in this slice.
- Data model: borrowers, deals, tasks, document requests, and activity timeline.
- API stance: the UI uses an in-memory provider now, but the code and docs already assume a later REST layer with the same domain boundaries.
- Demo principle: every screen must support the investor walkthrough without requiring setup, training, or external services.

## 2. Route map

- `/` dashboard
- `/intake` lead intake
- `/pipeline` pipeline board
- `/deals/:dealId` borrower and deal workspace
- `/tasks` task center
- `/documents?dealId=:dealId` document request and upload view

## 3. First tables

- `borrowers`
  - `id`, `name`, `entity_type`, `experience`, `email`, `phone`
- `deals`
  - `id`, `borrower_id`, `name`, `deal_type`, `stage`, `program`, `property_address`, `market`, `occupancy`, `source`, `loan_amount`, `purchase_price`, `ltv`, `target_close_date`, `summary`, `next_milestone`, `created_at`, `last_activity_at`
- `tasks`
  - `id`, `deal_id`, `title`, `owner`, `due_date`, `priority`, `category`, `status`
- `document_requests`
  - `id`, `deal_id`, `name`, `requested_from`, `status`, `uploaded_file_name`, `uploaded_at`
- `activities`
  - `id`, `deal_id`, `timestamp`, `title`, `detail`

## 4. First endpoints

- `GET /api/dashboard`
- `POST /api/leads`
- `GET /api/pipeline?segment=all|residential|cre`
- `GET /api/deals/:dealId`
- `PATCH /api/deals/:dealId/stage`
- `GET /api/tasks?status=open|done|all`
- `PATCH /api/tasks/:taskId`
- `GET /api/documents?dealId=:dealId`
- `POST /api/document-requests`
- `POST /api/document-requests/:requestId/upload`

## 5. First screens

- Dashboard
  - metrics, guided demo flow, stage health, recent activity, daily priorities
- Lead intake
  - one obvious form with residential and CRE demo presets
- Pipeline board
  - stage columns, segment filter, open workspace, advance stage
- Borrower and deal workspace
  - snapshot, borrower profile, deal tasks, requested docs, recent activity
- Task center
  - daily queue with open or done filters
- Document view
  - deal picker, request list, real file upload input, add new request

## 6. Implementation order

1. Create domain types and realistic seed data.
2. Add a single in-memory app store with pure reducer actions.
3. Build the app shell and route map.
4. Ship dashboard and pipeline board first so the demo has a working spine.
5. Add lead intake with create-lead action that feeds the board.
6. Add deal workspace so every card opens into a concrete workflow.
7. Add task center and documents view to finish the end-to-end demo.
8. Run a local build and keep all deferred features out of scope.

## 7. Code for the first slice

The runnable code lives in `src/` and is intentionally limited to this MVP slice. Start it locally with:

```bash
npm install
npm run dev
```
