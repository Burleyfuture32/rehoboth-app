# Rehoboth Status Tracker Agent Pack

This folder is a ready-to-drop package for AI agents building the **Status Tracker** feature inside the Rehoboth lending app.

## Purpose

This package defines a deal-level status tracker that shows progress across the main parties involved in a file:

- Borrower
- LO
- Title
- Lender
- Closing

It is designed to give leadership and operations a fast visual read on who is done, who is waiting, who is actively moving, and what is overdue.

## What is included

- `00-source-design.txt` — original design notes
- `01-feature-overview.md` — plain-English feature description
- `02-builder-master-prompt.txt` — prompt to hand directly to an AI builder agent
- `03-ui-spec.md` — UI/UX requirements
- `04-status-engine-rules.md` — logic for automatic status updates
- `05-data-model.json` — suggested database structure
- `06-api-contract.json` — suggested backend/API shape
- `07-acceptance-tests.md` — build and QA checks
- `08-sample-records.json` — example deal and tracker records
- `09-dev-notes.md` — implementation guidance and guardrails
- `reference-sketch.jpeg` — hand-drawn concept sketch

## Core status values

- `not_started`
- `pending`
- `in_progress`
- `complete`
- `overdue`

## Status colors

- Green = Complete
- Yellow = Pending
- Blue = In Progress
- Gray = Not Started
- Red = Overdue

## High-level intent

At the top of each deal, show a simple overall progress bar. Under that, show one tracker row per section with:

- section name
- assigned person or company
- current status
- short notes
- due date
- last updated timestamp
- blocker reason when applicable

## Usage

Give the builder agent this package and start with `02-builder-master-prompt.txt`.
