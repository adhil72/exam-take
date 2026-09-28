import crypto from "crypto";
import { ExamSession, IExamSession } from "../db/models/ExamSession";
import { ExamAttempt } from "../db/models/ExamAttempt";
import { Client } from "../db/models/Client";
import { Exam } from "../db/models/Exam";
import { questionBank } from "../questions/bank";
import { getIO } from "../ws/ws-server";
import { validateExam } from "../routes/exam.route";

function shuffleArray<T>(array: T[]): T[] {
  const arr = [...array];
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

export class SessionManager {
  private static timerInterval: NodeJS.Timeout | null = null;
  private static activeSessionId: string | null = null;

  // Recover active session on server startup
  static async recoverActiveSession() {
    try {
      const session = await ExamSession.findOne({
        status: { $in: ["lobby", "in_progress", "paused"] },
      });
      if (session) {
        this.activeSessionId = session._id;
        console.log(`Recovered active session: ${session._id} (${session.status})`);
        if (session.status === "in_progress") {
          this.startTimer(session._id);
        }
      }
    } catch (err) {
      console.error("Failed to recover active session:", err);
    }
  }

  static async getActiveSession(): Promise<IExamSession | null> {
    if (!this.activeSessionId) {
      const session = await ExamSession.findOne({
        status: { $in: ["setup", "lobby", "in_progress", "paused"] },
      });
      if (session) {
        this.activeSessionId = session._id;
        return session;
      }
      return null;
    }
    return ExamSession.findById(this.activeSessionId);
  }

  static async createSession(examId: string, settings: any): Promise<IExamSession> {
    // Check if another session is already active
    const active = await ExamSession.findOne({
      status: { $in: ["lobby", "in_progress", "paused"] },
    });
    if (active) {
      throw new Error(`Another session is already active: ${active._id}`);
    }

    const exam = await Exam.findById(examId);
    if (!exam) throw new Error("Exam not found");
    const shortage = validateExam(exam).details.filter(d => d.isShortage);
    if (shortage.length > 0) {
      throw new Error(
        "Not enough questions: " + shortage.map(d => `${d.topicName} (need ${d.requiredCount}, have ${d.availableCount})`).join(", ")
      );
    }

    const sessionId = crypto.randomUUID();
    const session = new ExamSession({
      _id: sessionId,
      examId,
      status: "setup",
      settings,
      createdAt: new Date(),
    });
    await session.save();
    this.activeSessionId = sessionId;

    // Unassign all client systems by default
    try {
      const io = getIO();
      const assignedClients = await Client.find({ studentId: { $ne: null } });
      for (const client of assignedClients) {
        client.studentId = null;
        await client.save();
        
        if (client.wsId && io) {
          io.to(client.wsId).emit("client:assigned", { student: null });
        }
        io?.to("admin").emit("admin:client-updated", client);
      }
    } catch (err) {
      console.error("Failed to unassign clients on new session creation:", err);
    }

    return session;
  }

  static async openLobby(sessionId: string): Promise<IExamSession> {
    const session = await ExamSession.findById(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "setup") throw new Error("Lobby can only be opened from setup state");

    session.status = "lobby";
    await session.save();
    
    // Broadcast lobby open
    const io = getIO();
    io?.to("admin").emit("admin:session-updated", session);
    io?.emit("session:lobby-opened");
    
    return session;
  }

  static async startExam(sessionId: string): Promise<IExamSession> {
    const session = await ExamSession.findById(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "lobby") throw new Error("Exam can only start from lobby state");

    const exam = await Exam.findById(session.examId);
    if (!exam) throw new Error("Exam config not found");

    // 1. Fetch all approved clients with a student assigned
    const clients = await Client.find({ status: "approved", studentId: { $ne: null } });
    if (clients.length === 0) {
      throw new Error("No approved and assigned clients in the lobby");
    }

    // 2. Generate Attempts and randomized question sets
    const io = getIO();
    
    // Load used question IDs if requested
    let usedQuestionIds: string[] = [];
    if (session.settings?.avoidUsedQuestions) {
      const pastSessions = await ExamSession.find({ examId: session.examId, _id: { $ne: sessionId } });
      const pastSessionIds = pastSessions.map(s => s._id);
      const pastAttempts = await ExamAttempt.find({ sessionId: { $in: pastSessionIds } });
      usedQuestionIds = Array.from(new Set(pastAttempts.flatMap(a => a.questions)));
    }
    
    for (const client of clients) {
      const attemptId = crypto.randomUUID();
      
      // Select questions based on config - use Set to avoid duplicate questions
      const attemptQuestionIds = new Set<string>();
      const usedSet = new Set(usedQuestionIds);

      for (const conf of exam.questionConfig || []) {
        let available = questionBank
          .pool(exam.streamId, conf.topicId, exam.years, conf.marks)
          .filter(q => !attemptQuestionIds.has(q._id));

        // Filter out questions previously used by this exam if setting is active
        if (session.settings?.avoidUsedQuestions) {
          available = available.filter(q => !usedSet.has(q._id));
        }

        for (const q of shuffleArray(available).slice(0, conf.count)) {
          attemptQuestionIds.add(q._id);
        }
      }

      const finalQuestionIds = Array.from(attemptQuestionIds);
      // Final shuffle of entire question set if enabled
      const shuffledQuestionIds = session.settings.shuffleQuestions 
        ? shuffleArray(finalQuestionIds) 
        : finalQuestionIds;

      const attempt = new ExamAttempt({
        _id: attemptId,
        sessionId,
        clientId: client._id,
        studentId: client.studentId!,
        questions: shuffledQuestionIds,
        status: "in_progress",
        startedAt: new Date(),
      });
      await attempt.save();

      // Mark client status to keep synchronized (we can keep client status as approved)
      // Send question payload directly to this client's socket
      if (client.wsId && io) {
        const sanitizedQuestions = await this.getSanitizedQuestions(shuffledQuestionIds, session.settings.shuffleChoices);
        
        const durationMs = exam.duration * 60000;
        const now = new Date();
        const endTime = new Date(now.getTime() + durationMs);

        io.to(client.wsId).emit("exam:start", {
          attemptId,
          questions: sanitizedQuestions,
          duration: exam.duration,
          startTime: now.toISOString(),
          endTime: endTime.toISOString(),
          settings: session.settings
        });
      }
    }

    // 3. Start authoritative timer
    const now = new Date();
    const durationMs = exam.duration * 60000;
    
    session.status = "in_progress";
    session.startedAt = now;
    session.endsAt = new Date(now.getTime() + durationMs);
    await session.save();

    this.startTimer(sessionId);

    io?.to("admin").emit("admin:session-updated", session);
    io?.emit("exam:started", { 
      startTime: session.startedAt.toISOString(), 
      endTime: session.endsAt.toISOString() 
    });

    return session;
  }

  static async pauseExam(sessionId: string): Promise<IExamSession> {
    const session = await ExamSession.findById(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "in_progress") throw new Error("Only running exams can be paused");

    this.stopTimer();

    const remainingMs = session.endsAt!.getTime() - Date.now();
    session.status = "paused";
    session.pausedAt = new Date();
    session.remainingMs = remainingMs > 0 ? remainingMs : 0;
    await session.save();

    const io = getIO();
    io?.to("admin").emit("admin:session-updated", session);
    io?.emit("exam:paused", { remainingMs: session.remainingMs });

    return session;
  }

  static async resumeExam(sessionId: string): Promise<IExamSession> {
    const session = await ExamSession.findById(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "paused") throw new Error("Only paused exams can be resumed");

    const now = Date.now();
    const endsAt = new Date(now + session.remainingMs!);

    session.status = "in_progress";
    session.startedAt = new Date();
    session.endsAt = endsAt;
    session.pausedAt = null;
    session.remainingMs = null;
    await session.save();

    this.startTimer(sessionId);

    const io = getIO();
    io?.to("admin").emit("admin:session-updated", session);
    io?.emit("exam:resumed", { 
      endTime: endsAt.toISOString(), 
      remainingMs: session.remainingMs 
    });

    return session;
  }

  static async extendTime(sessionId: string, minutes: number): Promise<IExamSession> {
    const session = await ExamSession.findById(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "in_progress") throw new Error("Time can only be extended during active exams");

    const addedMs = minutes * 60 * 1000;
    session.endsAt = new Date(session.endsAt!.getTime() + addedMs);
    await session.save();

    const io = getIO();
    io?.to("admin").emit("admin:session-updated", session);
    io?.emit("exam:time-extended", { 
      newEndTime: session.endsAt.toISOString(),
      addedMinutes: minutes 
    });

    return session;
  }

  static async endExam(sessionId: string): Promise<IExamSession> {
    const session = await ExamSession.findById(sessionId);
    if (!session) throw new Error("Session not found");
    if (session.status !== "in_progress" && session.status !== "paused") {
      throw new Error("Exam is not in a running or paused state");
    }

    this.stopTimer();

    // 1. Force submit all active attempts
    const attempts = await ExamAttempt.find({ sessionId, status: "in_progress" });
    for (const attempt of attempts) {
      attempt.status = "timed_out";
      attempt.submittedAt = new Date();
      await attempt.save();
    }

    session.status = "completed";
    await session.save();
    this.activeSessionId = null; // Clear active reference

    const io = getIO();
    io?.to("admin").emit("admin:session-updated", session);
    io?.emit("exam:ended");

    return session;
  }

  static async discardSession(sessionId: string): Promise<void> {
    const session = await ExamSession.findById(sessionId);
    if (!session) throw new Error("Session not found");

    this.stopTimer();

    // Delete attempts and session
    await ExamAttempt.deleteMany({ sessionId });
    await ExamSession.findByIdAndDelete(sessionId);

    if (this.activeSessionId === sessionId) {
      this.activeSessionId = null;
    }

    const io = getIO();
    io?.to("admin").emit("admin:session-updated", null);
    io?.emit("exam:ended");
  }

  static async forceSubmitAttempt(clientId: string): Promise<any> {
    const attempt = await ExamAttempt.findOne({ clientId, status: "in_progress" });
    if (!attempt) throw new Error("Active attempt not found for client");

    attempt.status = "force_submitted";
    attempt.submittedAt = new Date();
    await attempt.save();

    // Notify student client directly
    const client = await Client.findById(clientId);
    if (client && client.wsId) {
      const io = getIO();
      io?.to(client.wsId).emit("exam:force-submit");
    }

    const io = getIO();
    io?.to("admin").emit("admin:attempt-updated", attempt);

    return attempt;
  }

  // Timer runner
  private static startTimer(sessionId: string) {
    this.stopTimer();

    this.timerInterval = setInterval(async () => {
      try {
        const session = await ExamSession.findById(sessionId);
        if (!session || session.status !== "in_progress") {
          this.stopTimer();
          return;
        }

        const remainingMs = session.endsAt!.getTime() - Date.now();
        if (remainingMs <= 0) {
          console.log(`Timer expired for session ${sessionId}. Ending exam.`);
          await this.endExam(sessionId);
        } else {
          // Broadcast sync every 10 seconds to keep overhead low
          const seconds = Math.floor(remainingMs / 1000);
          if (seconds % 10 === 0) {
            getIO()?.emit("exam:timer", { remainingMs });
          }
        }
      } catch (err) {
        console.error("Error in timer tick:", err);
      }
    }, 1000);
  }

  private static stopTimer() {
    if (this.timerInterval) {
      clearInterval(this.timerInterval);
      this.timerInterval = null;
    }
  }

  // Retrieve sanitized questions for client consumption (answers & explanations stripped)
  static async getSanitizedQuestions(questionIds: string[], shuffleChoices: boolean): Promise<any[]> {
    const result = [];
    for (const qid of questionIds) {
      const question = questionBank.findById(qid);
      if (question) {
        const choices = shuffleChoices 
          ? shuffleArray(question.choices || []) 
          : (question.choices || []);

        result.push({
          id: question._id,
          question: question.question,
          type: question.type,
          choices,
          marks: question.marks,
          negativeMarks: question.negativeMarks,
          files: question.files,
        });
      }
    }
    return result;
  }
}
