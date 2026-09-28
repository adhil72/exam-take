# Sprint 5 — Admin Live Monitoring & Dashboard

> **Goal:** Give the admin full visibility and control during the exam.

| Attribute        | Detail                               |
|------------------|--------------------------------------|
| **Duration**     | 1–2 weeks                            |
| **Priority**     | 🔴 Critical                          |
| **Dependencies** | Sprint 3 (Exam Session Engine)       |

---

## Objectives

1. Build the live monitoring dashboard with real-time stats
2. Create per-client monitoring cards to track individual progress
3. Implement the real-time activity feed/log
4. Build admin control actions (Pause, Resume, Extend Time, End)
5. Implement messaging/broadcasting to clients

---

## Tasks

### 5.1 Live Dashboard Layout & Real-time Stats

- [ ] Create Monitor screen at `/monitor`
- [ ] Build the Header Bar:
  - Exam Title
  - Large Session Timer (Synced with server)
  - Global Session Status indicator (In Progress, Paused)
- [ ] Build the Stats Row:
  - Connected Clients (e.g., 28/30)
  - Submission Progress (e.g., 5/30 submitted)
  - Average Completion % (e.g., 45%)
- [ ] Listen to `admin:progress-update` to keep stats fresh

**Acceptance Criteria:**
- Admin has a clear, high-level overview of the exam's status
- Stats update in real-time without page refreshes

---

### 5.2 Per-Client Monitoring Grid

- [ ] Build a responsive grid/table to display all active clients
- [ ] Create the Client Card component:
  - Status indicator (Online 🟢, Offline 🔴)
  - Student Name & ID
  - Machine Name (e.g., LAB-PC-01)
  - Current Question (e.g., Q12 / 30)
  - Progress Bar (Answered vs Total)
- [ ] Implement filtering/sorting for the grid:
  - Sort by progress, name, machine
  - Filter by status (offline, submitted, in-progress)
- [ ] Add visual indicators for warnings (e.g., tab switch detected)

**Client Card Layout:**
```
┌─────────────────────────┐
│ 🟢 John Doe             │
│ LAB-PC-01               │
│ Q12 / 30  (40%)         │
│ ██████████░░░░░ 40%     │
│ [Force Submit] [Kick]   │
└─────────────────────────┘
```

**Acceptance Criteria:**
- Admin can see the real-time progress of every individual student
- Offline clients are clearly flagged
- The grid handles up to ~100 clients efficiently

---

### 5.3 Activity Feed (Log)

- [ ] Build a scrolling sidebar/panel for the Activity Feed
- [ ] Listen to WebSocket events (`admin:client-disconnected`, `admin:answer-submitted`, `admin:exam-submitted`, `admin:tab-switch`)
- [ ] Render chronological log entries:
  - "⚠️ LAB-PC-05 disconnected"
  - "✅ Jane Smith submitted the exam"
  - "🚨 John Doe switched tabs (2nd time)"
- [ ] Implement auto-scroll to latest and clear log functionality
- [ ] Add sound notifications for critical events (disconnects, submissions) - optional/toggleable

**Acceptance Criteria:**
- Admin has a chronological record of exam events
- Critical events are highly visible

---

### 5.4 Global Admin Controls

- [ ] Implement "Pause Exam" button (sends `POST /api/admin/session/:id/pause`)
- [ ] Implement "Resume Exam" button
- [ ] Implement "Extend Time" modal:
  - Input for number of minutes to add
  - Sends `POST /api/admin/session/:id/extend`
- [ ] Implement "End Exam" button:
  - Requires double confirmation (e.g., typing "END")
  - Triggers force-submit for all and closes session

**Acceptance Criteria:**
- Admin can reliably pause and resume the session globally
- Time extensions are propagated immediately to all clients
- Ending the exam forces submission for all and prevents further changes

---

### 5.5 Individual Client Controls

- [ ] Add action menu to each Client Card
- [ ] Implement "Force Submit":
  - Modal confirmation
  - Ends the exam for that specific student and collects saved answers
- [ ] Implement "Kick":
  - Disconnects the client and moves them back to the Lobby/Rejected state
- [ ] Implement "View Details" (Optional - show exact answers submitted so far)

**Acceptance Criteria:**
- Admin can manage problematic or finished clients individually without affecting the whole session

---

### 5.6 Broadcast Messaging

- [ ] Add a "Broadcast Message" input and button
- [ ] Sends custom text message to all active clients (triggers `exam:message` event)
- [ ] (Client side: displays message as a non-intrusive toast or banner)

**Acceptance Criteria:**
- Admin can send announcements (e.g., "5 minutes remaining", "Typo in Q4") to all students instantly

---

## Deliverables Summary

| # | Deliverable                                                        | Status |
|---|--------------------------------------------------------------------|--------|
| 1 | Live Dashboard layout with global stats                            | ⬜     |
| 2 | Real-time per-client monitoring grid                               | ⬜     |
| 3 | Chronological Activity Feed log                                    | ⬜     |
| 4 | Global Session controls (Pause, Resume, Extend, End)               | ⬜     |
| 5 | Individual Client controls (Force Submit, Kick)                    | ⬜     |
| 6 | Broadcast messaging capability                                     | ⬜     |

---

## Technical Notes

- The monitoring UI should be highly optimized. Receiving frequent WebSocket updates (e.g., `admin:progress-update`) requires efficient React rendering to prevent lag. Consider memoizing the Client Card components.
- Throttle high-frequency updates if necessary (e.g., `admin:answer-submitted` for every single click might be too noisy; batch them or only show progress percentages).
