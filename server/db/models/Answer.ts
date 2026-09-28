import { createModel } from "../file-store";

export interface IAnswer {
  _id: string;
  attemptId: string; // References ExamAttempt._id
  questionId: string; // References a question id in the question bank
  answer: any; // User's answer payload (choices array, text, or number)
  isCorrect?: boolean | null;
  marksAwarded?: number | null;
  answeredAt: Date;
  timeSpentMs: number;
}

export const Answer = createModel<IAnswer>("answers", {
  dateFields: ["answeredAt"],
  defaults: () => ({ answer: null, isCorrect: null, marksAwarded: null, answeredAt: new Date(), timeSpentMs: 0 }),
});
