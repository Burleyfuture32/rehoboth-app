# UI Spec

## Placement

Inside each deal record, add a tab named:

`Status Tracker`

## Top area

Display:

- deal progress bar
- percent complete
- summary text such as `3 of 5 sections complete`
- red alert banner if one or more sections are overdue

## Section layout

Use a stacked row or card layout.

### Desktop
One row per section with columns:

- Section
- Name
- Status
- Notes
- Due Date
- Last Updated
- Actions

### Mobile
One card per section with:

- section name top left
- status badge top right
- assigned name below
- note preview
- due date
- last updated
- expand for more detail

## Visual requirements

- strong spacing
- minimal noise
- clear contrast
- status badge should be visible without opening the row
- overdue state should be impossible to miss

## Recommended copy

Top banner example:
- `Overall Deal Status: 60% Complete`
- `1 section overdue`

Section examples:
- `Borrower — Kelvin J. Abram II`
- `Status: Pending`
- `Waiting on updated bank statements`

## Empty states

If there is no assigned person or company:
- show `Unassigned`

If there is no due date:
- show `No due date set`

If there is no note:
- show `No notes yet`

## Suggested interactions

- click row/card to expand details
- edit status manually if permissions allow
- hover or tap tooltip to show blocker reason and last action taken
- quick filter: all / overdue / pending / complete

## Accessibility

- do not rely on color alone
- pair colors with labels/icons
- ensure keyboard navigation works
- ensure status badges have text labels
