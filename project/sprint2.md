# Sprint 2 — Client Connection & Lobby System

> **Goal:** Allow client machines to connect, build the approval/rejection system, and implement student assignment.

| Attribute        | Detail                        |
|------------------|-------------------------------|
| **Duration**     | 1–2 weeks                     |
| **Priority**     | 🔴 Critical                   |
| **Dependencies** | Sprint 1 (server + sync)      |

---

## Objectives

1. Set up WebSocket server for real-time communication
2. Build the client join flow (browser → LAN server)
3. Implement admin approval/rejection of clients
4. Create student-to-machine assignment system
5. Handle connection resilience and status tracking

---

## Tasks

### 2.1 WebSocket Server Setup

- [ ] Install and configure `ws` or `socket.io` alongside Express
- [ ] Create WebSocket server in `server/ws/ws-server.ts`
- [ ] Set up event handler architecture in `server/ws/handlers/`
- [ ] Implement connection management (track active connections)
- [ ] Create separate namespaces/channels for admin vs client connections

**Key Files:**
```
server/ws/
├── ws-server.ts              # WebSocket setup & connection management
└── handlers/
    ├── client.handler.ts     # Client event handlers
    └── admin.handler.ts      # Admin event handlers
```

**Acceptance Criteria:**
- WebSocket server starts alongside HTTP server
- Connections are tracked with unique IDs
- Admin and client connections are distinguishable

---

### 2.2 Client Join Flow

- [ ] Server serves the pre-built client React app at `GET /`
- [ ] Client app opens and automatically establishes WebSocket connection
- [ ] Client sends `client:join` event with machine info:
  ```typescript
  { machineName: string; browserInfo: string; }
  ```
- [ ] Server creates a client record in the `clients` table
- [ ] Server responds with `client:registered` event:
  ```typescript
  { clientId: string; status: 'pending'; }
  ```

**Client DB Record — `clients` table:**

| Field        | Type    | Description                                       |
|--------------|---------|---------------------------------------------------|
| _id          | String  | Mongoose-generated unique ID (UUID)               |
| sessionId    | String  | References active `exam_sessions._id`             |
| machineName  | String  | Hostname or user-entered label                    |
| ipAddress    | String  | Client IP address                                 |
| status       | String  | `pending` / `approved` / `rejected` / `disconnected` |
| studentId    | String  | Nullable FK → `synced_students._id`               |
| connectedAt  | Date    | First connection timestamp                        |
| wsId         | String  | Current WebSocket connection ID                   |

**Acceptance Criteria:**
- Student opens `http://<server-ip>:3000` and sees the client app
- Client appears in the server's connected clients list
- Client record is persisted in MongoDB

---

### 2.3 Admin: Client List (Real-time)

- [ ] Create Lobby page at `/lobby` route in admin app
- [ ] Display connection info banner: `Open http://192.168.1.X:3000 on student machines`
- [ ] Real-time client list table with columns:
  - `#` | Machine | IP | Status | Student | Actions
- [ ] Status indicators:
  - ⏳ Pending — awaiting approval
  - ✅ Approved — approved but not yet assigned
  - 🟢 Assigned — student assigned, ready for exam
  - ❌ Rejected — rejected by admin
  - 🔴 Disconnected — lost connection
- [ ] Summary counters: Total, Pending, Approved, Assigned
- [ ] Real-time updates via WebSocket (`admin:client-joined`, `admin:client-disconnected`)

**Screen Layout:**
```
┌──────────────────────────────────────────────────────────────────┐
│  📡 Lobby — Client Management                                    │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │  Students connect at: http://192.168.1.50:3000            │  │
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  Total: 30  |  ⏳ Pending: 5  |  ✅ Approved: 10  |  🟢 Assigned: 15  │
│                                                                  │
│  ┌──────┬──────────┬─────────────────┬──────────┬──────────┬──────────┐  │
│  │  #   │ Machine  │ IP              │ Status   │ Student  │ Actions  │  │
│  ├──────┼──────────┼─────────────────┼──────────┼──────────┼──────────┤  │
│  │  1   │ PC-01    │ 192.168.1.101   │ ✅       │ John Doe │ 🔄 ❌    │  │
│  │  2   │ PC-02    │ 192.168.1.102   │ ⏳       │ —        │ ✅ ❌    │  │
│  │  3   │ PC-03    │ 192.168.1.103   │ 🟢       │ Jane S.  │ 🔄 ❌    │  │
│  └──────┴──────────┴─────────────────┴──────────┴──────────┴──────────┘  │
│                                                                  │
│  [ ✅ Approve All ]  [ Start Exam → ]                            │
└──────────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- Connected clients appear in real-time
- Status indicators update live
- Summary counters reflect current state

---

### 2.4 Approve/Reject Clients

- [ ] "Approve" action per client — changes status from `pending` → `approved`
- [ ] "Reject" action per client — changes status from `pending` → `rejected`
- [ ] Server sends `client:approved` or `client:rejected` event to the affected client
- [ ] Rejected clients see a rejection message and cannot re-join

**REST Endpoints:**

| Method | Endpoint                         | Description            |
|--------|----------------------------------|------------------------|
| POST   | `/api/admin/client/:id/approve`  | Approve a client       |
| POST   | `/api/admin/client/:id/reject`   | Reject a client        |
| POST   | `/api/admin/clients/approve-all` | Bulk approve all pending |

**WebSocket Events:**
```typescript
// Server → Client
'client:approved'  → { studentInfo: null }  // Approved but not yet assigned
'client:rejected'  → { reason: string }     // Rejected with optional reason
```

**Acceptance Criteria:**
- Admin can approve or reject individual clients
- Bulk "Approve All" works for all pending clients
- Client UI updates in real-time upon approval/rejection

---

### 2.5 Student Assignment

- [ ] Student assignment dialog with searchable dropdown of synced students
- [ ] Admin selects a student from the list and assigns to a client machine
- [ ] Server validates: a student can only be assigned to **one** client at a time
- [ ] Server sends `client:assigned` event to the client:
  ```typescript
  { student: { id: string; name: string; email: string; photo: string; } }
  ```
- [ ] "Reassign" action — change the student assigned to a machine
- [ ] "Unassign" action — remove student assignment from a machine

**REST Endpoints:**

| Method | Endpoint                          | Description                |
|--------|-----------------------------------|----------------------------|
| POST   | `/api/admin/client/:id/assign`    | Assign student to client   |
| POST   | `/api/admin/client/:id/unassign`  | Unassign student           |

**Validation Rules:**
- A student can only be assigned to one client
- Only `approved` clients can have students assigned
- Cannot assign a student who is already assigned elsewhere

**Acceptance Criteria:**
- Admin can search and select students from synced list
- Student assignment is reflected on both admin and client UIs
- Duplicate assignments are prevented

---

### 2.6 Client Waiting Screen

- [ ] Create waiting screen UI in the client app
- [ ] Show dynamic status progression:
  ```
  ⏳ Pending approval...
      ↓
  ✅ Approved! Waiting for student assignment...
      ↓
  🟢 Assigned: John Doe (student photo & info)
      ↓
  ⏱️ Waiting for admin to start the exam...
  ```
- [ ] Display assigned student info (name, ID, photo) once assigned
- [ ] Show exam info: title, duration, number of questions
- [ ] Animated waiting indicator

**Acceptance Criteria:**
- Client sees real-time status updates
- Student info is displayed after assignment
- Exam details are shown while waiting

---

### 2.7 Connection Resilience

- [ ] Implement auto-reconnect on client disconnect (exponential backoff)
- [ ] On reconnect, client sends its stored `clientId` to restore state
- [ ] Server updates `wsId` for the reconnected client
- [ ] Server emits `admin:client-reconnected` to admin
- [ ] Preserve client status across reconnections (don't lose approval/assignment)
- [ ] Track disconnected clients with `last_seen` timestamp
- [ ] Admin sees disconnected clients with visual indicator

**Reconnection Flow:**
```
Client disconnects → status = 'disconnected', lastSeen set
      ↓
Client reconnects → sends { clientId }
      ↓
Server matches clientId → restores status, updates ws_id
      ↓
Admin notified via 'admin:client-reconnected'
```

**Acceptance Criteria:**
- Client automatically reconnects after network drop
- State (approval, assignment) is preserved after reconnection
- Admin is notified of disconnects and reconnects

---

### 2.8 Bulk Actions

- [ ] "Approve All" — approve all pending clients in one action
- [ ] "Auto-Assign" — optionally match students to machines by some criteria (e.g., alphabetical)
- [ ] Bulk action confirmation dialogs to prevent accidental actions

**Acceptance Criteria:**
- Bulk approve works for all pending clients
- Auto-assign distributes students efficiently

---

## Deliverables Summary

| # | Deliverable                                                        | Status |
|---|--------------------------------------------------------------------|--------|
| 1 | WebSocket server running alongside Express                         | ⬜     |
| 2 | Client PCs can open URL and appear in admin lobby                  | ⬜     |
| 3 | Admin can approve/reject individual and bulk clients               | ⬜     |
| 4 | Student assignment with searchable dropdown                        | ⬜     |
| 5 | Client shows real-time status progression                          | ⬜     |
| 6 | Auto-reconnect preserves state across disconnections               | ⬜     |
| 7 | Connection status tracking with visual indicators                  | ⬜     |

---

## WebSocket Events (This Sprint)

### Client → Server

| Event          | Payload                            | Description                  |
|----------------|------------------------------------|------------------------------|
| `client:join`  | `{ machineName, browserInfo }`     | Client requests to join      |

### Server → Client

| Event               | Payload                                   | Description              |
|---------------------|-------------------------------------------|--------------------------|
| `client:registered` | `{ clientId, status }`                    | Acknowledge join         |
| `client:approved`   | `{ studentInfo }`                         | Client approved          |
| `client:rejected`   | `{ reason }`                              | Client rejected          |
| `client:assigned`   | `{ student: { id, name, email, photo } }` | Student assigned         |

### Server → Admin

| Event                        | Payload                             | Description            |
|------------------------------|-------------------------------------|------------------------|
| `admin:client-joined`        | `{ client: { id, machineName, ip }}`| New client connected   |
| `admin:client-disconnected`  | `{ clientId, lastSeen }`            | Client disconnected    |
| `admin:client-reconnected`   | `{ clientId }`                      | Client reconnected     |

---

## Technical Notes

- Use `crypto.randomUUID()` for generating unique client IDs instead of Mongo's default ObjectId
- WebSocket `wsId` is the transport-level connection ID (changes on reconnect)
- Client `id` is the logical identity (persists across reconnects)
- Consider using `socket.io` for built-in reconnection and room support
- Rate-limit `client:join` events to prevent spam connections
