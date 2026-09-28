export interface Student {
  _id: string;
  name: string;
  email: string;
  batch: string;
  photoUrl: string;
}

export interface ClientMachine {
  _id: string;
  machineName: string;
  ipAddress: string;
  status: 'pending' | 'approved' | 'rejected' | 'disconnected' | 'locked';
  studentId?: string | null;
  connectedAt: string;
  lastSeen?: string | null;
  student?: Student | null;
}

export interface Question {
  id: string;
  question: string;
  type: 'mcq' | 'm-mcq' | 'numerical' | 'descriptive';
  choices?: string[];
  marks: number;
  negativeMarks: number;
  files?: string[];
}

export interface ClientAttempt {
  _id: string;
  clientId: string;
  studentId: string;
  status: 'in_progress' | 'submitted' | 'force_submitted' | 'timed_out';
  startedAt?: string;
  submittedAt?: string;
  tabSwitchCount: number;
  currentQuestionId?: string | null;
  questions: string[];
  answeredCount: number;
  isLeft?: boolean;
  client: {
    _id: string;
    machineName: string;
    ipAddress: string;
    status: 'pending' | 'approved' | 'rejected' | 'disconnected' | 'locked';
    lastSeen?: string | null;
  } | null;
  student: Student | null;
}

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'info' | 'warning' | 'success' | 'danger';
  message: string;
}

export interface ActiveSession {
  _id: string;
  examId: string;
  examTitle?: string;
  status: 'lobby' | 'in_progress' | 'paused' | 'ended';
  scheduledAt?: string;
  endsAt?: string;
  remainingMs?: number;
  settings?: {
    shuffleQuestions: boolean;
    shuffleChoices: boolean;
    allowReview: boolean;
    showResultImmediately: boolean;
  };
}
