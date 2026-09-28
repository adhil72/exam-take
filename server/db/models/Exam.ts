import { createModel } from "../file-store";

export interface IExamTopicConfig {
  topicId: string;
  topicName: string;
  marks?: number | null; // only draw questions worth this many marks; null/absent = any
  count: number; // number of questions drawn from this topic (at this mark value)
}

export interface IExam {
  _id: string;
  title: string; // e.g. "GATE CSE"
  streamId: string; // question-bank stream (branch code, e.g. "cs")
  streamName: string;
  duration: number; // minutes
  years: string[]; // restrict question pool to these years; empty = all years
  questionConfig: IExamTopicConfig[];
  createdAt: Date;
  updatedAt: Date;
}

export const Exam = createModel<IExam>("exams", {
  dateFields: ["createdAt", "updatedAt"],
  defaults: () => ({ duration: 180, years: [], questionConfig: [], createdAt: new Date(), updatedAt: new Date() }),
});
