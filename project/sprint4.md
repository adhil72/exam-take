# Sprint 4 — Student Exam Interface (Client UI)

> **Goal:** Build the complete student-facing exam UI — polished, functional, and cheat-resistant.

| Attribute        | Detail                               |
|------------------|--------------------------------------|
| **Duration**     | 1–2 weeks                            |
| **Priority**     | 🔴 Critical                          |
| **Dependencies** | Sprint 3 (Exam Session Engine)       |

---

## Objectives

1. Build the exam joining and waiting room experience
2. Create the main exam interface with question rendering and navigation
3. Implement answer input types (MCQ, Multi-MCQ, Numerical, Descriptive)
4. Add the question palette and server-synced timer
5. Build the submission flow and results view
6. Implement basic anti-cheat mechanisms

---

## Tasks

### 4.1 Join & Waiting Screens

- [ ] Create Join screen at `/` (or `/join` with redirect)
- [ ] Show basic exam information (title, duration)
- [ ] Implement "Join Exam" button
- [ ] Create Waiting screen at `/waiting`
- [ ] Display dynamic connection and assignment status:
  - Pending approval
  - Approved, waiting for assignment
  - Assigned (show student profile photo, name, ID)
  - Waiting for admin to start
- [ ] Handle `exam:start` event to navigate to the exam interface

**Acceptance Criteria:**
- Students can join and see their current status in the lobby
- Assigned student information is clearly displayed
- UI automatically transitions to the exam when started

---

### 4.2 Main Exam Interface & Question Display

- [ ] Create Exam screen at `/exam`
- [ ] Build the layout: Header (Timer + Info), Sidebar (Palette), Main (Question)
- [ ] Implement question text rendering with support for markdown/HTML
- [ ] Handle image/file display for questions with attachments (using downloaded paths)
- [ ] Display marks (positive and negative) for the current question

**Acceptance Criteria:**
- Clean, distraction-free layout
- Questions render correctly with formatting and images
- Marks scheme is clearly visible per question

---

### 4.3 Answer Input Components

- [ ] Build `SingleMCQ` component (Radio buttons)
- [ ] Build `MultiMCQ` component (Checkboxes)
- [ ] Build `NumericalInput` component (Text input with number validation)
- [ ] Build `DescriptiveInput` component (Textarea for long answers)
- [ ] Implement local state to store the current answer before submission
- [ ] Auto-save answers to the server on change or blur (via `client:answer` event)

**Acceptance Criteria:**
- All question types have appropriate, accessible input controls
- Answers are captured accurately
- Answers are debounced/auto-saved to the server to prevent data loss

---

### 4.4 Question Palette & Navigation

- [ ] Build Question Palette grid (e.g., 5x5 or 10x10 layout)
- [ ] Implement color-coding logic:
  - 🟢 Answered (Answer exists)
  - 🔴 Not answered (Visited but no answer)
  - 🟡 Marked for review (Flagged by student)
  - ⚪ Not visited (Default state)
- [ ] "Previous" and "Next" navigation buttons
- [ ] "Mark for Review" toggle button
- [ ] Send `client:navigate` and `client:flag` events on interaction

**Acceptance Criteria:**
- Palette accurately reflects the status of every question
- Clicking a palette number navigates to that question
- Navigation events are sent to the server for admin monitoring

---

### 4.5 Timer & Warning System

- [ ] Display the countdown timer prominently in the header
- [ ] Sync local timer with `exam:timer` events from the server
- [ ] Implement smooth interpolation between server syncs (every 1s update)
- [ ] Add visual warnings:
  - Yellow text at 5 minutes remaining
  - Red text + pulsing animation at 1 minute remaining
- [ ] Handle `exam:paused` event (show overlay, freeze timer)
- [ ] Handle `exam:resumed` event (remove overlay, update timer)

**Acceptance Criteria:**
- Timer is accurate and stays synced with the server
- Visual warnings draw attention when time is running out
- Pause overlay prevents interaction

---

### 4.6 Submission Flow

- [ ] "Submit Exam" button (always visible or on the last question)
- [ ] Double confirmation modal: "Are you sure? You have X unanswered questions."
- [ ] Send `client:submit` event on confirmation
- [ ] Create Submitted screen at `/submitted`
- [ ] Handle `exam:ended` and `exam:force-submit` from server (trigger auto-submit, navigate to `/submitted`)

**Acceptance Criteria:**
- Students must confirm before submitting
- Submitting successfully transitions to the completion screen
- Server-initiated forced submissions work seamlessly

---

### 4.7 Result Screen

- [ ] Create Result screen at `/result`
- [ ] Handle `result:published` event from server
- [ ] Display score card: Marks obtained / Total marks
- [ ] Show percentage with visual indicator (e.g., circular progress)
- [ ] Display breakdown: Correct, Wrong, Skipped
- [ ] Build detailed question review view (if enabled by admin) showing student answer vs. correct answer

**Acceptance Criteria:**
- Results are displayed clearly once published by the admin
- The review view accurately highlights correct and incorrect answers

---

### 4.8 Basic Anti-Cheat Mechanisms

- [ ] Implement `visibilitychange` listener to detect tab switching
- [ ] Show full-screen warning modal when returning to the tab
- [ ] Send `client:tab-switch` event to the server
- [ ] Add `beforeunload` listener to warn before closing the tab
- [ ] (Optional) Provide a button to request Fullscreen API mode

**Acceptance Criteria:**
- Admin is notified if a student leaves the exam tab
- Accidental tab closures are mitigated with warnings

---

## Deliverables Summary

| # | Deliverable                                                        | Status |
|---|--------------------------------------------------------------------|--------|
| 1 | Join and Waiting room screens                                      | ⬜     |
| 2 | Main exam interface with question rendering                        | ⬜     |
| 3 | Input components for all question types                            | ⬜     |
| 4 | Question palette with color-coded status tracking                  | ⬜     |
| 5 | Synced timer with visual warnings                                  | ⬜     |
| 6 | Submission flow with confirmation                                  | ⬜     |
| 7 | Result screen with score breakdown                                 | ⬜     |
| 8 | Anti-cheat tab-switch detection                                    | ⬜     |

---

## Technical Notes

- Keep the client app lightweight (minimal dependencies) to ensure fast loading on slower lab PCs.
- State management can be simple React state or Context; complex global state (like Redux) is likely overkill.
- Ensure the UI is responsive, but optimize primarily for desktop/laptop displays as this is a lab environment.
