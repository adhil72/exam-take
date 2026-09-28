# Sprint 1 — Foundation & Cloud Sync

> **Goal:** Set up the project, establish communication with the cloud server, and sync exam data.

| Attribute        | Detail                |
|------------------|-----------------------|
| **Duration**     | 1–2 weeks             |
| **Priority**     | 🔴 Critical (Blocker) |
| **Dependencies** | None (first sprint)   |

---

## Objectives

1. Scaffold the project using a single folder Vite app structure
2. Set up the server foundation (Express + TypeScript + MongoDB)
3. Build the cloud sync service to fetch and cache exam data
4. Create the admin setup UI for configuration and exam selection

---

## Tasks

### 1.1 Project Scaffolding

- [x] Initialize project with a single `package.json`
- [x] Set up Vite for a React + TypeScript project
- [x] Configure Vite to handle both the React frontend and Express backend (e.g., using a custom server middleware or `vite-express`)
- [x] Set up TanStack Router and Tailwind CSS
- [x] Create directory structure: `server/` (Node.js) and `src/` (React: `admin`, `client`, `shared`)
- [x] Set up path aliases (`@/`) via `tsconfig` and `vite.config`

**Acceptance Criteria:**
- `npm install` works from root
- `npm run dev` starts both the Vite dev server for React and the Express API server
- Shared types in `src/shared` are importable from both frontend and backend

---

### 1.2 Server Foundation

- [x] Set up Express.js with TypeScript
- [x] Configure `mongoose` for MongoDB connection (`server/db/mongoose.ts`)
- [x] Create Mongoose schemas and models for all synced tables:
  - `synced_exams`
  - `synced_questions`
  - `synced_students`
- [x] Set up environment config (`server/config.ts`) loading from `.env` (including MONGO_URI)
- [ ] Create logger utility (`server/lib/logger.ts`)
- [ ] Create utility functions (`server/lib/utils.ts`)

**Key Files:**
```
server/
├── index.ts              # Entry point
├── config.ts             # Environment & config
├── db/
│   ├── mongoose.ts       # MongoDB connection (Mongoose)
│   └── models/           # Mongoose schemas
└── lib/
    ├── utils.ts
    └── logger.ts
```

**Schema — `synced_exams`:**

| Field             | Type    | Description                   |
|-------------------|---------|-------------------------------|
| _id               | String  | Exam ID from cloud            |
| title             | String  | Exam title                    |
| duration          | Number  | Duration in minutes           |
| questionConfig    | Array   | JSON string of QuestionConfig |
| isActive          | Boolean | Boolean (true/false)          |
| syncedAt          | Date    | Timestamp of last sync        |

**Schema — `synced_questions`:**

| Field          | Type    | Description                              |
|----------------|---------|------------------------------------------|
| _id            | String  | Question ID from cloud                   |
| question       | String  | Question text (markdown/HTML)            |
| type           | String  | `mcq` / `m-mcq` / `numerical` / `descriptive` |
| choices        | Array   | JSON array of strings                    |
| answers        | Array   | JSON array of correct answers            |
| explanation    | String  | Explanation text                         |
| marks          | Number  | Positive marks                           |
| negativeMarks  | Number  | Negative marks                           |
| subjectId      | String  | Subject/stream ID                        |
| topicId        | String  | Topic ID                                 |
| files          | Array   | JSON array of local file paths           |

**Schema — `synced_students`:**

| Field     | Type    | Description              |
|-----------|---------|--------------------------|
| _id       | String  | Student ID from cloud    |
| name      | String  | Student name             |
| email     | String  | Student email            |
| batch     | String  | Batch/class info         |
| photoUrl  | String  | Profile photo URL/path   |

**Acceptance Criteria:**
- Server starts on configured port
- Connects successfully to local MongoDB instance
- Collections are created automatically by Mongoose

---

### 1.3 Shared Types Package

- [x] Define TypeScript interfaces for all data models
- [ ] Define WebSocket event name constants (`events.ts`)
- [x] Define exam status enums and other constants (`constants.ts`)
- [x] Export everything from shared folder

**Key Interfaces:**
```typescript
// src/shared/types.ts
interface Exam { id: string; title: string; duration: number; questionConfig: QuestionConfig[]; }
interface Question { id: string; question: string; type: QuestionType; choices: string[]; ... }
interface Student { id: string; name: string; email: string; batch: string; photoUrl: string; }
interface QuestionConfig { subjectId: string; count: number; }
```

**Key Constants:**
```typescript
// src/shared/constants.ts
enum ExamSessionStatus { SETUP, LOBBY, IN_PROGRESS, PAUSED, COMPLETED, RESULTS_PUBLISHED }
enum ClientStatus { PENDING, APPROVED, REJECTED, DISCONNECTED }
enum AttemptStatus { NOT_STARTED, IN_PROGRESS, SUBMITTED, FORCE_SUBMITTED, TIMED_OUT }
```

**Acceptance Criteria:**
- Types are importable in server, admin, and client code
- No runtime dependencies — types only

---

### 1.4 Cloud Sync Service

- [x] Create `server/sync/sync-service.ts` — main sync orchestrator
- [/] Implement cloud server authentication (login with Software credentials: System ID & Password)
- [ ] Fetch exams list from cloud API
- [ ] Fetch specific exam details (config, question pool)
- [ ] Fetch questions based on exam's `questionConfig` (subject + count)
- [ ] Store fetched data in MongoDB (upsert logic — insert or update)
- [x] Create `server/sync/file-downloader.ts` — download question files/images
- [ ] Store downloaded files in `server/data/files/`
- [ ] Implement sync status tracking (last sync time, progress)

**Sync Flow:**
```
1. Admin enters credentials (System ID & Password) on the setup page
2. Client app authenticates directly with Cloud API at `https://uadmin.udsfgecw.tech/user/auth/login` → gets auth token
3. Auth token is saved to localStorage (`gexam_cloud_token`) and passed to backend for sync API requests
4. Server fetches exam list → stores in synced_exams
5. Admin selects an exam
6. Server fetches exam's questions (by subject/count config) → stores in synced_questions
7. Server downloads any file attachments → stores in data/files/
8. Server fetches student list → stores in synced_students
```

**API Routes for Sync:**

| Method | Endpoint                   | Description                           |
|--------|----------------------------|---------------------------------------|
| POST   | `/api/admin/config`        | Save cloud authentication token       |
| GET    | `/api/admin/config`        | Get current config                    |
| POST   | `/api/admin/sync/exams`    | Trigger sync of exams list            |
| POST   | `/api/admin/sync/exam/:id` | Sync specific exam (questions + files)|
| GET    | `/api/admin/sync/status`   | Get sync status and last sync time    |
| POST   | `/api/admin/sync/students` | Sync student list from cloud          |

**Acceptance Criteria:**
- Server/Client can authenticate with the GExam cloud API
- Exams list is fetched and stored in MongoDB
- Selecting an exam syncs its questions and files
- Student list is synced and stored
- Sync status is trackable

---

### 1.5 Admin UI: Setup Page

- [x] Create Setup screen at `/admin/setup` route
- [x] Hide cloud server URL (hardcoded to `https://uadmin.udsfgecw.tech`)
- [x] Credentials input (System ID & Password for 'Software' role)
- [x] "Connect & Sync" button with loading state
- [ ] Sync progress indicator (exams being fetched)
- [x] Error handling with user-friendly messages
- [x] Success state showing connection status

**Screen Layout:**
```
┌──────────────────────────────────────┐
│          GExam LAN Server            │
│            Initial Setup             │
│                                      │
│  System ID:        [____________]    │
│  Password:         [____________]    │
│                                      │
│         [ Connect & Sync ]           │
│                                      │
│  Status: ✅ Connected                │
│  Last Sync: 2 minutes ago            │
└──────────────────────────────────────┘
```

**Acceptance Criteria:**
- Admin can enter cloud software credentials and connect
- Connection status is clearly displayed
- Errors (bad credentials, server errors) are shown gracefully

---

### 1.6 Admin UI: Exam Selector

- [ ] Create Exam selection screen (part of setup flow or separate route)
- [ ] Display list of synced exams in a table/card layout
- [ ] Show exam metadata: title, duration, number of subjects, active status
- [ ] "Select & Prepare" button per exam
- [ ] Selecting triggers full sync of that exam's questions and files
- [ ] Show sync progress (downloading questions, downloading files)

**Screen Layout:**
```
┌──────────────────────────────────────────────────────────────┐
│  Available Exams                            [🔄 Re-Sync]     │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📝 Physics Midterm Exam                              │    │
│  │ Duration: 60 min | Subjects: 3 | Questions: 30      │    │
│  │ Last Synced: Today 2:30 PM                           │    │
│  │                              [ Select & Prepare ]    │    │
│  └─────────────────────────────────────────────────────┘    │
│                                                              │
│  ┌─────────────────────────────────────────────────────┐    │
│  │ 📝 Chemistry Final Exam                              │    │
│  │ Duration: 90 min | Subjects: 5 | Questions: 50      │    │
│  │ Last Synced: Today 2:30 PM                           │    │
│  │                              [ Select & Prepare ]    │    │
│  └─────────────────────────────────────────────────────┘    │
└──────────────────────────────────────────────────────────────┘
```

**Acceptance Criteria:**
- Synced exams are listed with relevant metadata
- Selecting an exam triggers question + file download
- Progress is visible during sync

---

## Deliverables Summary

| # | Deliverable                                                                | Status |
|---|----------------------------------------------------------------------------|--------|
| 1 | Single Vite + Node.js project scaffolded with shared folders               | [x]    |
| 2 | Server running with Express + MongoDB (Mongoose)                           | [x]    |
| 3 | Cloud sync service authenticates and fetches exam data                     | [/]    |
| 4 | Questions and files downloaded and stored locally                          | ⬜     |
| 5 | Admin can enter cloud credentials and see available exams                  | [x]    |
| 6 | Selecting an exam triggers full sync                                       | ⬜     |
| 7 | All synced data persisted in MongoDB                                       | ⬜     |
| 8 | Shared types folder usable across frontend and backend                     | [x]    |

---

## Technical Notes

- Use Mongoose for defining schemas and models for MongoDB
- Use `upsert: true` in Mongoose `findOneAndUpdate` or `updateOne` operations for sync data
- File downloads should be idempotent — skip already downloaded files
- Cloud API authentication token should be stored in memory (not persisted)
- Use Zod for runtime validation of cloud API responses
