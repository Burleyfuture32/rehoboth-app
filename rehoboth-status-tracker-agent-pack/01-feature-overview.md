# Feature Overview

## Goal

Create a **Status Tracker** tab inside each deal that visually shows where the file stands across the main parties responsible for moving the loan forward.

## Main sections

Each deal should always include these five tracker sections in this order:

1. Borrower
2. LO
3. Title
4. Lender
5. Closing

## What the user should see

For each section, show:

- section label
- person or company name
- status badge
- short note
- due date
- last updated time
- blocker reason if there is one

## What leadership should see instantly

- overall deal progress at top
- whether the file is moving or stuck
- who owns the current blockage
- what section is overdue

## Why this matters

Mortgage and lending files get messy fast because status is usually scattered across notes, email, memory, and separate tools. This feature puts operational truth in one place.

## Example row

| Section | Name | Status | Notes | Due Date | Last Updated |
|---|---|---|---|---|---|
| Title | ABC Title Co. | In Progress | Search ordered; waiting on report | 2026-04-09 | 2026-04-07 10:40 AM |

## Overall progress

At the top of the tab, show:

- progress bar
- percent complete
- number of complete sections out of total
- active blocker summary if any sections are overdue

## Suggested formula

Overall progress can start simple:

`percent_complete = completed_sections / total_sections * 100`

Later, this can be replaced with weighted scoring if some sections matter more than others.
