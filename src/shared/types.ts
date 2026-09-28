// Shared Types between Server and Client

export type QuestionType = 'mcq' | 'm-mcq' | 'numerical' | 'descriptive';

export interface QuestionConfig {
  subjectId: string;
  count: number;
}

export interface Exam {
  id: string; // UUID
  title: string;
  duration: number; // in minutes
  questionConfig: QuestionConfig[];
  isActive: boolean;
  syncedAt: string;
}

export interface Question {
  id: string; // UUID
  question: string;
  type: QuestionType;
  choices?: string[];
  answers?: string[]; // Server only, stripped before sending to client
  explanation?: string;
  marks: number;
  negativeMarks: number;
  subjectId: string;
  topicId: string;
  files?: string[];
}

export interface Student {
  id: string; // UUID
  name: string;
  email: string;
  batch: string;
  photoUrl: string;
}
