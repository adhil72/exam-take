// Shared Constants and Enums

export enum ExamSessionStatus {
  SETUP = "setup",
  LOBBY = "lobby",
  IN_PROGRESS = "in_progress",
  PAUSED = "paused",
  COMPLETED = "completed",
  RESULTS_PUBLISHED = "results_published",
}

export enum ClientStatus {
  PENDING = "pending",
  APPROVED = "approved",
  REJECTED = "rejected",
  DISCONNECTED = "disconnected",
}

export enum AttemptStatus {
  NOT_STARTED = "not_started",
  IN_PROGRESS = "in_progress",
  SUBMITTED = "submitted",
  FORCE_SUBMITTED = "force_submitted",
  TIMED_OUT = "timed_out",
}
