# Sprint 3 — Exam Session Engine

> **Goal:** Build the core exam execution engine — server-authoritative timer, question delivery, and answer collection.

| Attribute        | Detail                               |
|------------------|--------------------------------------|
| **Duration**     | 2–3 weeks                            |
| **Priority**     | 🔴 Critical                          |
| **Dependencies** | Sprint 2 (WebSocket + lobby system)  |

---

## Objectives

1. Implement the session state machine with full lifecycle management
2. Build question pool generation with randomization and per-client assignment
3. Create server-authoritative timer (no client-side cheating)
4. Implement answer collection and persistence
5. Build admin controls: start, pause, resume, force-submit, end

---

## Tasks

### 3.1 Session State Machine

- [ ] Implement session lifecycle in `server/session/session-manager.ts`:
  ```
  setup → lobby → in_progress → paused → completed → results_published
  ```
- [ ] Create `exam_sessions` Mongoose model
- [ ] Enforce valid state transitions:
  - `setup` → `lobby` (when admin opens lobby)
  - `lobby` → `in_progress` (when admin starts exam)
  - `in_progress` ↔ `paused` (admin pause/resume)
  - `in_progress` → `completed` (timer expires or admin ends)
  - `paused` → `completed` (admin ends while paused)
  - `completed` → `results_published` (admin publishes results)
- [ ] Persist session state changes to MongoDB immediately
- [ ] Only one active session at a time

**Schema — `exam_sessions`:**

| Field         | Type    | Description                                       |
|---------------|---------|---------------------------------------------------|
| _id           | String  | Mongoose-generated unique ID (UUID)               |
| examId        | String  | References `synced_exams._id`                     |
| status        | String  | Current session status                            |
| startedAt     | Date    | Nullable — when exam actually started             |
| endsAt        | Date    | Nullable — computed: startedAt + duration         |
| pausedAt      | Date    | Nullable — when exam was paused                   |
| remainingMs   | Number  | Time remaining when paused (ms)                   |
| createdAt     | Date    | Session creation time                             |
| settings      | Object  | JSON: session configuration                       |

**State Transition Diagram:**
```
              ┌──────────┐
              │  SETUP   │
              └────┬─────┘
                   │ (open lobby)
              ┌────▼─────┐
              │  LOBBY   │
              └────┬─────┘
                   │ (start exam)
              ┌────▼─────────┐
         ┌───►│ IN_PROGRESS  │◄───┐
         │    └────┬─────────┘    │
         │         │ (pause)      │ (resume)
         │    ┌────▼─────┐       │
         │    │  PAUSED   │──────┘
         │    └────┬──────┘
         │         │ (end)
         │    ┌────▼─────────┐
         └───►│  COMPLETED   │
              └────┬─────────┘
                   │ (publish results)
              ┌────▼──────────────┐
              │ RESULTS_PUBLISHED │
              └───────────────────┘
```

**Acceptance Criteria:**
- All state transitions are validated and enforced
- Invalid transitions throw descriptive errors
- Session state is always persisted to MongoDB

---

### 3.2 Exam Settings Configuration

- [ ] Create exam configuration screen at `/configure` route
- [ ] Configurable settings before exam start:

| Setting                | Type    | Default | Description                            |
|------------------------|---------|---------|----------------------------------------|
| `shuffleQuestions`     | boolean | true    | Randomize question order per client    |
| `shuffleChoices`       | boolean | true    | Randomize MCQ choice order per client  |
| `showResultImmediately`| boolean | false   | Show result right after submission     |
| `allowReview`          | boolean | true    | Allow navigating between questions     |

- [ ] Display LAN server IP & port for students to connect
- [ ] "Open Lobby" button to transition session to `lobby` status

**Acceptance Criteria:**
- Admin can configure exam settings before starting
- Settings are stored in the session record as JSON
- LAN IP is prominently displayed for students

---

### 3.3 Question Pool Generation

- [ ] Implement in `server/exam/question-pool.ts`
- [ ] Read exam's `questionConfig`: array of `{ subjectId, count }`
- [ ] For each subject, select `count` random questions from `synced_questions`
- [ ] Apply shuffling based on session settings:
  - Shuffle question order (if `shuffleQuestions` is true)
  - Shuffle MCQ choices within each question (if `shuffleChoices` is true)
- [ ] Generate a **unique question set per client** (different random selection + order)
- [ ] Store each client's question assignment in `exam_attempts.questions` as Array

**Question Selection Algorithm:**
```
For each client:
  1. For each { subjectId, count } in questionConfig:
     - Query synced_questions WHERE subjectId = subjectId
     - Randomly select `count` questions
  2. Combine all selected questions
  3. Shuffle the combined list (if shuffleQuestions)
  4. For each MCQ question, shuffle choices (if shuffleChoices)
  5. Store the ordered question ID list in exam_attempts
```

**Schema — `exam_attempts`:**

| Field         | Type    | Description                                         |
|---------------|---------|-----------------------------------------------------|
| _id           | String  | Mongoose-generated unique ID (UUID)                 |
| sessionId     | String  | References `exam_sessions._id`                      |
| clientId      | String  | References `clients._id`                            |
| studentId     | String  | FK → `synced_students._id`                          |
| questions     | Array   | Ordered array of question IDs                       |
| status        | String  | `not_started` / `in_progress` / `submitted` / `force_submitted` / `timed_out` |
| startedAt     | Date    | When student started                                |
| submittedAt   | Date    | When answers were submitted                         |
| timeSpentMs   | Number  | Total time spent                                    |

**Acceptance Criteria:**
- Each client gets a randomized selection of questions per config
- Shuffling produces different orders for different clients
- Question IDs are stored per attempt for grading later

---

### 3.4 Server-Authoritative Timer

- [ ] Implement timer in `server/session/timer.ts`
- [ ] Server tracks the authoritative countdown — clients **only display** it
- [ ] On exam start:
  - Set `startedAt` = now
  - Set `endsAt` = now + duration (in ms)
  - Broadcast `exam:start` with `{ startTime, endTime, duration }`
- [ ] Periodic timer sync: broadcast `exam:timer` every 30 seconds:
  ```typescript
  { remainingMs: number }
  ```
- [ ] On timer expiry: auto-submit all pending clients
- [ ] Pause support:
  - Save `remainingMs` at pause time
  - On resume, compute new `endsAt` from now + remainingMs
- [ ] Time extension:
  - Add N minutes to `endsAt`
  - Broadcast `exam:time-extended`

**Timer Flow:**
```
Start: endsAt = Date.now() + (duration * 60000)
  ↓
Every 30s: broadcast { remainingMs: endsAt - Date.now() }
  ↓
Pause: remainingMs = endsAt - Date.now(); clear timer
  ↓
Resume: endsAt = Date.now() + remainingMs; restart timer
  ↓
Extend: endsAt += (addedMinutes * 60000)
  ↓
Expire: remainingMs <= 0 → auto-submit all
```

**Acceptance Criteria:**
- Timer is managed entirely server-side
- Client timer display syncs with server every 30s
- Pause/resume correctly freezes and restores the timer
- Time extension works mid-exam
- Auto-submit triggers on timer expiry

---

### 3.5 Question Delivery

- [ ] On exam start, send questions to each approved+assigned client via WebSocket
- [ ] **Security:** NEVER send correct answers to the client
- [ ] Send questions in the client's assigned order
- [ ] Each question payload includes:
  ```typescript
  {
    id: string;
    question: string;       // Question text (markdown/HTML)
    type: 'mcq' | 'm-mcq' | 'numerical' | 'descriptive';
    choices?: string[];     // Shuffled choices (MCQ only)
    marks: number;
    negativeMarks: number;
    files?: string[];       // Local file URLs
  }
  ```
- [ ] Emit `exam:start` event with full question list and timing info

**WebSocket Event — `exam:start`:**
```typescript
{
  questions: Question[];    // All questions (without answers!)
  duration: number;         // Duration in minutes
  startTime: string;        // ISO timestamp
  endTime: string;          // ISO timestamp
}
```

**Acceptance Criteria:**
- All assigned clients receive their questions simultaneously
- Correct answers are never included in the payload
- Questions are in the client-specific shuffled order

---

### 3.6 Answer Submission & Persistence

- [ ] Client sends `client:answer` event per question:
  ```typescript
  { clientId: string; questionId: string; answer: string; timeSpent: number; }
  ```
- [ ] Server stores answers immediately in the `answers` collection
- [ ] Upsert logic: if student re-answers a question, update the existing record
- [ ] Final submission via `client:submit` event
- [ ] On final submit: update `exam_attempts.status` to `submitted`, set `submittedAt`

**Schema — `answers`:**

| Field         | Type    | Description                              |
|---------------|---------|------------------------------------------|
| _id           | String  | Mongoose-generated unique ID (UUID)      |
| attemptId     | String  | References `exam_attempts._id`           |
| questionId    | String  | References `synced_questions._id`        |
| answer        | Mixed   | Selected choice(s) or value              |
| isCorrect     | Boolean | Nullable — set after grading             |
| marksAwarded  | Number  | Nullable — set after grading             |
| answeredAt    | Date    | Timestamp                                |
| timeSpentMs   | Number  | Time spent on this question              |

**Acceptance Criteria:**
- Every answer is immediately persisted to MongoDB
- Re-answering a question updates (not duplicates) the record
- Final submission marks the attempt as complete

---

### 3.7 Question Navigation

- [ ] Client can navigate between questions (if `allowReview` setting is true)
- [ ] "Previous" and "Next" buttons
- [ ] "Mark for Review" toggle per question
- [ ] Client sends `client:navigate` event for monitoring:
  ```typescript
  { clientId: string; questionIndex: number; }
  ```
- [ ] Client sends `client:flag` event when marking for review:
  ```typescript
  { clientId: string; questionId: string; }
  ```

**Acceptance Criteria:**
- Students can freely navigate between questions (if allowed)
- Mark for review state is tracked
- Navigation events are sent to server for admin monitoring

---

### 3.8 Auto-Submit on Timeout

- [ ] When server timer expires (`remainingMs <= 0`):
  1. Set all `in_progress` attempts to `timed_out`
  2. Broadcast `exam:ended` to all clients
  3. Update session status to `completed`
- [ ] All saved answers are preserved — only unsaved progress is lost
- [ ] Client UI shows "Time's up" message and disables interaction

**Acceptance Criteria:**
- Exam auto-ends when timer expires
- All saved answers are retained
- Clients are notified and locked out

---

### 3.9 Admin Controls During Exam

- [ ] **Pause** — Freezes timer for all, clients see "Exam Paused" overlay
- [ ] **Resume** — Timer resumes from where it was paused
- [ ] **Force-submit individual** — Admin force-submits a specific client's exam
- [ ] **End exam** — Force-ends exam for all, triggers auto-submit

**REST Endpoints:**

| Method | Endpoint                              | Description              |
|--------|---------------------------------------|--------------------------|
| POST   | `/api/admin/session/:id/start`        | Start the exam           |
| POST   | `/api/admin/session/:id/pause`        | Pause the exam           |
| POST   | `/api/admin/session/:id/resume`       | Resume the exam          |
| POST   | `/api/admin/session/:id/end`          | Force-end the exam       |
| POST   | `/api/admin/session/:id/extend`       | Extend time by N minutes |
| POST   | `/api/admin/client/:id/force-submit`  | Force-submit a client    |

**WebSocket Events:**
```typescript
'exam:paused'       → { remainingMs }
'exam:resumed'      → { endTime, remainingMs }
'exam:time-extended' → { newEndTime, addedMinutes }
'exam:force-submit' → {}  // To specific client
'exam:ended'        → {}  // To all clients
```

**Acceptance Criteria:**
- Pause freezes the exam for everyone simultaneously
- Resume correctly restores the timer
- Force-submit works for individual clients
- End exam collects all answers and closes the session

---

## Deliverables Summary

| # | Deliverable                                                        | Status |
|---|--------------------------------------------------------------------|--------|
| 1 | Session state machine with full lifecycle                          | ⬜     |
| 2 | Exam settings configuration UI                                    | ⬜     |
| 3 | Question pool generation with per-client randomization             | ⬜     |
| 4 | Server-authoritative timer with sync, pause, resume, extend        | ⬜     |
| 5 | Secure question delivery (no answers leaked)                       | ⬜     |
| 6 | Real-time answer submission and persistence                        | ⬜     |
| 7 | Question navigation and mark-for-review                            | ⬜     |
| 8 | Auto-submit on timeout                                             | ⬜     |
| 9 | Admin controls: pause, resume, force-submit, end                   | ⬜     |

---

## Technical Notes

- **Timer precision:** Use `setInterval` with 1-second granularity on server; sync to clients every 30s. Client interpolates between syncs for smooth display.
- **Answer persistence:** Use MongoDB upserts (e.g., `findOneAndUpdate` with `upsert: true`) to ensure atomicity and avoid duplicates.
- **Question delivery:** Consider sending all questions at once vs. one-at-a-time. Sending all at once is simpler and reduces WS traffic; just ensure answers are stripped.
- **Pause handling:** When paused, clients should have an overlay that blocks all interaction. On resume, the overlay is removed and the timer continues.
- **Force-submit:** Should collect whatever answers are saved, not whatever is on the client's screen. This prevents data inconsistency.
