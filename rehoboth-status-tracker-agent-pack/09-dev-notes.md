# Dev Notes

## MVP guidance

Keep the first version simple.

Do not try to build a giant workflow automation engine before the tracker itself works. First make the tracker reliable, readable, and easy to update.

## Recommended implementation order

1. Create schema for tracker sections.
2. Seed the five required sections for every new deal.
3. Build read-only UI.
4. Add manual edit capability.
5. Add automatic status recalculation rules.
6. Add history/audit log.
7. Add filters and polish.

## Non-MVP items to defer

- weighted scoring by loan program
- multi-stage nested trackers
- AI-generated blocker summaries
- predictive deadline risk scoring
- cross-deal dashboard analytics

## Naming guardrails

Use stable section keys:
- borrower
- lo
- title
- lender
- closing

Do not use free-text section names in the database as the primary identifier.

## Data integrity guardrails

- Every deal should auto-create exactly five tracker sections.
- Manual overrides should be logged.
- A section should never disappear from the UI.
- Avoid null status values.

## Product mindset

This feature is not just decoration. It is an operations control surface.

If built well, a manager should be able to open a deal and immediately answer:
- Where is the file stuck?
- Who owns the next move?
- What is late?
- How close are we to completion?
