import { createModel } from "../file-store";

export interface IExamSession {
  _id: string;
  examId: string; // References Exam._id
  status: "setup" | "lobby" | "in_progress" | "paused" | "completed" | "results_published";
  startedAt?: Date | null;
  endsAt?: Date | null;
  pausedAt?: Date | null;
  remainingMs?: number | null;
  createdAt: Date;
  settings: {
    shuffleQuestions: boolean;
    shuffleChoices: boolean;
    showResultImmediately: boolean;
    allowReview: boolean;
    avoidUsedQuestions: boolean;
  };
}

export const ExamSession = createModel<IExamSession>("exam_sessions", {
  dateFields: ["startedAt", "endsAt", "pausedAt", "createdAt"],
  defaults: () => ({
    status: "setup",
    startedAt: null,
    endsAt: null,
    pausedAt: null,
    remainingMs: null,
    createdAt: new Date(),
    settings: { shuffleQuestions: true, shuffleChoices: true, showResultImmediately: false, allowReview: true, avoidUsedQuestions: false },
  }),
});
