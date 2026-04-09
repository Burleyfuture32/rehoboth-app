# Status Engine Rules

## Canonical statuses

- `not_started`
- `pending`
- `in_progress`
- `complete`
- `overdue`

## Status definitions

### not_started
Use when no meaningful work has begun and there are no submitted items or completed tasks.

### pending
Use when the section is waiting on someone else, a requested item, a response, or a dependency.

### in_progress
Use when active work is underway and the section is not blocked.

### complete
Use when the required section deliverables are done.

### overdue
Use when the due date has passed and the section is not complete.

## Priority order

If multiple rules match, apply the highest-priority status:

1. overdue
2. complete
3. pending
4. in_progress
5. not_started

## Auto-update triggers

The system should evaluate status on events such as:

- task completed
- task reopened
- document uploaded
- document rejected
- milestone marked complete
- milestone reopened
- condition cleared
- condition added
- due date changed
- note added
- outbound request sent
- inbound response received

## Example rules by section

### Borrower
Set to:
- `complete` when all required borrower docs and signatures are in
- `pending` when waiting on borrower docs, signatures, or explanations
- `in_progress` when borrower has started submitting items
- `overdue` when required borrower items are past due

### LO
Set to:
- `complete` when LO-side checklist items are done
- `pending` when waiting on borrower, lender, or title
- `in_progress` when structuring or reviewing the file
- `overdue` when LO-owned due items are missed

### Title
Set to:
- `complete` when title work needed for the stage is finished
- `pending` when title is waiting on outside input
- `in_progress` when search/order/review is underway
- `overdue` when title deliverables are late

### Lender
Set to:
- `complete` when lender-side conditions for the stage are cleared
- `pending` when waiting on submissions or responses
- `in_progress` when UW/review/decisioning is underway
- `overdue` when lender deadlines are missed

### Closing
Set to:
- `complete` when closing package and required final actions are done
- `pending` when waiting on final approvals, docs, or scheduling
- `in_progress` when closing is being prepared
- `overdue` when closing milestones slip past due

## Suggested computed fields

- `is_blocked`
- `is_overdue`
- `days_until_due`
- `days_overdue`
- `last_activity_at`
- `percent_complete`

## Overall deal progress

### MVP formula
Use section completion count:

`overall_percent = round((number_of_complete_sections / total_sections) * 100)`

### Optional weighted formula later
Suggested weights:
- Borrower: 20
- LO: 20
- Title: 15
- Lender: 25
- Closing: 20

## Guardrails

- Never mark a section `complete` if required mandatory items are still open.
- Never leave a section as `pending` if the due date has already passed; convert to `overdue`.
- Always store the reason for a manual override.
