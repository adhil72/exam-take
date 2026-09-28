# GExam LAN Exam System — Project Overview

> A self-contained Node.js + React application that acts as a **LAN exam server** within a college lab. It fetches exam configurations & questions from the existing GExam cloud server, caches them locally, and serves an exam interface to student machines connected on the same network.

---

## System Overview

### The Problem

Currently, exams are configured and questions are managed in the existing GExam web dashboard + server. But there is no way to **conduct** the exam in a controlled, proctored LAN environment where:

- A powerful admin machine orchestrates the exam
- Student machines in the lab join and take the exam
- The admin can approve/reject clients, assign students, monitor progress, and view results
- Everything works on the local network (no internet dependency during the exam)

### How It Works

```
┌─────────────────────────────────────────────────────────────────────┐
│                        COLLEGE LAN                                  │
│                                                                     │
│  ┌──────────────────────┐          ┌──────────────────────┐        │
│  │   GExam Cloud Server │◄────────►│   LAN Exam Server    │        │
│  │   (Existing API)     │  HTTPS   │   (Admin Machine)    │        │
│  │   - Exams config     │  (Sync)  │   - Node.js backend  │        │
│  │   - Questions DB     │          │   - React admin UI   │        │
│  │   - Students DB      │          │   - MongoDB cache     │        │
│  └──────────────────────┘          └──────────┬───────────┘        │
│                                               │                     │
│                                    WebSocket + HTTP                  │
│                                               │                     │
│                    ┌──────────────┬────────────┼────────────┐       │
│                    │              │            │            │       │
│               ┌────▼───┐   ┌────▼───┐   ┌───▼────┐  ┌───▼────┐  │
│               │ Client │   │ Client │   │ Client │  │ Client │  │
│               │  PC 1  │   │  PC 2  │   │  PC 3  │  │  PC N  │  │
│               │(Browser│   │(Browser│   │(Browser│  │(Browser│  │
│               │  only) │   │  only) │   │  only) │  │  only) │  │
│               └────────┘   └────────┘   └────────┘  └────────┘  │
│                                                                     │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Actors

| Actor            | Description                                                                 |
|------------------|-----------------------------------------------------------------------------|
| **Cloud Server** | The existing GExam API. Source of truth for exams, questions, and students. |
| **LAN Server**   | New Node.js app on the admin machine. Fetches & caches data, serves clients. |
| **Admin**        | The person operating the LAN server. Controls the exam session.            |
| **Client**       | A student's browser on a lab PC. Connects to the LAN server via URL.       |

---

## Architecture

### Single Application Structure

```
gexam-lab/ (or exam-take/)
├── package.json              # Single project root
├── vite.config.ts            # Vite config (handles both frontend and backend)
├── server/                   # Node.js + Express backend
│   ├── index.ts              # Server entry point
│   └── ...                   # DB, Sync, WebSocket logic
├── src/                      # React frontend
│   ├── admin/                # Admin Dashboard UI
│   ├── client/               # Student Exam Interface UI
│   └── shared/               # Shared types, components & constants
└── tsconfig.json             # TypeScript configuration
```

### Communication Flow

```
Phase 1: SETUP     → Admin logs in using Software role (System ID & Password) and syncs data from cloud to LAN server
Phase 2: LOBBY     → Clients connect, admin approves & assigns students
Phase 3: EXAM      → Server delivers questions, collects answers in real-time
Phase 4: RESULTS   → Auto-grade, display results, optionally upload to cloud
```

---

## Tech Stack

| Layer              | Technologies                                                     |
|--------------------|------------------------------------------------------------------|
| **Server**         | Node.js, TypeScript, Express.js, ws/socket.io, MongoDB, Axios, Zod |
| **Admin Dashboard**| React, TypeScript, Vite, TanStack Router, Tailwind CSS, Shadcn UI, Recharts |
| **Client App**     | React, TypeScript, Vite, Tailwind CSS, socket.io-client          |
| **Shared**         | TypeScript interfaces, WebSocket event constants, enums          |

---

## Sprint Roadmap

| Sprint | Focus                          | Duration (Est.) | File                                    |
|--------|--------------------------------|-----------------|------------------------------------------|
| 1      | Foundation & Cloud Sync        | 1–2 weeks       | [sprint1.md](./sprint1.md)              |
| 2      | Client Connection & Lobby      | 1–2 weeks       | [sprint2.md](./sprint2.md)              |
| 3      | Exam Session Engine            | 2–3 weeks       | [sprint3.md](./sprint3.md)              |
| 4      | Student Exam UI                | 1–2 weeks       | [sprint4.md](./sprint4.md)              |
| 5      | Admin Live Monitoring          | 1–2 weeks       | [sprint5.md](./sprint5.md)              |
| 6      | Results & Analytics            | 1–2 weeks       | [sprint6.md](./sprint6.md)              |
| 7      | Polish & Edge Cases            | 1–2 weeks       | [sprint7.md](./sprint7.md)              |

**Total estimated time: 8–15 weeks** (depending on team size and pace)

---

## Data Models Reference

See [data-models.md](./data-models.md) for complete database schema definitions.

## API & WebSocket Reference

See [api-reference.md](./api-reference.md) for all REST endpoints and WebSocket events.

## Deployment & Future

See [deployment.md](./deployment.md) for network setup, installation, and future enhancement ideas.
