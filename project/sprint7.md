# Sprint 7 — Polish, Edge Cases & Hardening

> **Goal:** Handle all edge cases, improve reliability, and polish the UX.

| Attribute        | Detail                               |
|------------------|--------------------------------------|
| **Duration**     | 1–2 weeks                            |
| **Priority**     | 🟢 Normal                            |
| **Dependencies** | All previous sprints                 |

---

## Objectives

1. Implement robust error handling and crash recovery
2. Ensure data consistency and prevent data loss during network issues
3. Polish UI/UX across Admin and Client apps
4. Conduct performance and load testing
5. Write documentation

---

## Tasks

### 7.1 Reconnection & State Recovery

- [ ] **Client Reconnection:** Ensure that if a client drops offline and reconnects, they are placed exactly where they left off (current question, timer, marked answers).
- [ ] **Session Recovery:** If the Node.js server crashes or restarts, it must read from MongoDB on startup and resume the `in_progress` session accurately.
- [ ] **Offline Buffering:** If the client loses network connection, temporarily buffer `client:answer` events locally and flush them when reconnected.

**Acceptance Criteria:**
- Simulating a network drop and reconnect results in zero data loss and a seamless resume.
- Simulating a server restart allows the exam to continue.

---

### 7.2 Data Integrity & Validation

- [ ] Add Zod validation schemas to all server inputs (REST endpoints and WebSocket payloads).
- [ ] Ensure MongoDB queries handle race conditions (e.g., using atomic operators for updates like `$set`).
- [ ] Prevent multiple active sessions (enforce via DB constraints or application logic).
- [ ] Ensure students cannot be assigned to multiple machines simultaneously.

**Acceptance Criteria:**
- API and WebSocket layers reject malformed data with clear error messages.
- No duplicate assignments or parallel active sessions can occur.

---

### 7.3 UI/UX Polish

- [ ] Implement Skeleton loaders for data fetching states (Exams list, Results table).
- [ ] Add consistent Toast notifications for success/error events.
- [ ] Ensure the Client Exam UI is responsive (handles different screen sizes gracefully).
- [ ] Add Keyboard Navigation for the exam:
  - Arrow keys / Enter for Next/Previous
  - Number keys (1-4) for MCQ selection
- [ ] Improve accessibility (ARIA labels, focus management).

**Acceptance Criteria:**
- The application feels premium, responsive, and intuitive.
- Loading states prevent "jumps" and provide good feedback.
- Keyboard navigation works seamlessly for students.

---

### 7.4 Performance Testing

- [ ] Create a mock script to simulate 50+ concurrent WebSocket clients connecting, joining, and submitting answers every few seconds.
- [ ] Monitor Server CPU and Memory usage.
- [ ] Optimize MongoDB indexes for frequent queries (e.g., `sessionId`, `clientId`).
- [ ] Ensure Admin Dashboard `admin:progress-update` events do not cause React render thrashing.

**Acceptance Criteria:**
- System handles 50+ concurrent active clients without noticeable latency.
- Admin dashboard remains responsive under load.

---

### 7.5 Documentation

- [ ] Write `README.md` with setup instructions and environment variable configuration.
- [ ] Create a deployment guide for setting up the server on a lab machine.
- [ ] Create a brief "Admin User Guide" explaining the workflow (Sync -> Lobby -> Monitor -> Results).

**Acceptance Criteria:**
- A new developer can set up the project locally.
- A lab administrator can deploy and run an exam using the guides.

---

## Deliverables Summary

| # | Deliverable                                                        | Status |
|---|--------------------------------------------------------------------|--------|
| 1 | Seamless reconnection and crash recovery handling                    | ⬜     |
| 2 | Comprehensive input validation (Zod)                               | ⬜     |
| 3 | UI Polish (Loaders, Toasts, Keyboard Navigation)                   | ⬜     |
| 4 | Load testing script and performance optimizations                  | ⬜     |
| 5 | Complete Setup and Deployment Documentation                        | ⬜     |

---

## Technical Notes

- Moving to MongoDB requires ensuring that operations that were previously synchronous (with `better-sqlite3`) are now properly awaited `async/await` operations. This is a critical area to review during hardening.
