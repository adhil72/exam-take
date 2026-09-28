import { createModel } from "../file-store";

export interface IExamAttempt {
  _id: string;
  sessionId: string; // References ExamSession._id
  clientId: string; // References Client._id
  studentId: string; // References Student._id
  questions: string[]; // Shuffled array of question ids
  status: "not_started" | "in_progress" | "submitted" | "force_submitted" | "timed_out";
  startedAt?: Date | null;
  submittedAt?: Date | null;
  timeSpentMs?: number | null;
  tabSwitchCount: number;
  currentQuestionId?: string | null;
}

export const ExamAttempt = createModel<IExamAttempt>("exam_attempts", {
  dateFields: ["startedAt", "submittedAt"],
  defaults: () => ({ questions: [], status: "not_started", startedAt: null, submittedAt: null, timeSpentMs: 0, tabSwitchCount: 0, currentQuestionId: null }),
});
