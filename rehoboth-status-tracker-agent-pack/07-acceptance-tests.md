# Acceptance Tests

## Functional

- A `Status Tracker` tab exists inside each deal.
- The tab renders these sections in order: Borrower, LO, Title, Lender, Closing.
- Each section shows name, status, notes, due date, and last updated time.
- Overall deal progress is visible at the top.
- Overdue sections are visually distinct.
- Status badges use both text and color.

## Logic

- If a due date passes and a section is not complete, status becomes `overdue`.
- If all required items for a section are done, status becomes `complete`.
- If work has started but is not finished and no blocker exists, status becomes `in_progress`.
- If waiting on another party, status becomes `pending`.
- If nothing has started, status becomes `not_started`.

## Auditability

- Manual status changes require a stored reason.
- Last updated timestamp changes after edits or rule recalculation.
- Updated by user is saved.

## UX

- Leadership can identify overdue sections in under 5 seconds.
- Mobile card view is readable without horizontal scrolling.
- Empty states do not look broken.
- Long notes truncate cleanly and can expand.

## QA sample scenarios

1. Borrower uploads final required docs -> Borrower changes to complete.
2. Title due date passes with work unfinished -> Title changes to overdue.
3. LO is waiting on borrower letter -> LO shows pending with blocker.
4. No activity exists for Closing yet -> Closing shows not started.
5. One section becomes overdue -> top summary shows overdue alert.
