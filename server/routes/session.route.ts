import { Router } from "express";
import { SessionManager } from "../session/session-manager";
import { ExamSession } from "../db/models/ExamSession";
import { Exam } from "../db/models/Exam";
import { ExamAttempt } from "../db/models/ExamAttempt";
import { Client } from "../db/models/Client";
import { Student } from "../db/models/Student";
import { Answer } from "../db/models/Answer";
import { getIO } from "../ws/ws-server";
import { evaluateExamAttempt } from "../utils/evaluator";

const router = Router();

// POST Create session
router.post("/session", async (req, res) => {
  const { examId, settings } = req.body;
  if (!examId) return res.status(400).json({ error: "examId is required" });
  try {
    const session = await SessionManager.createSession(examId, settings || {});
    res.json({ success: true, session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Open lobby
router.post("/session/:id/lobby", async (req, res) => {
  try {
    const session = await SessionManager.openLobby(req.params.id);
    res.json({ success: true, session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Start exam
router.post("/session/:id/start", async (req, res) => {
  try {
    const session = await SessionManager.startExam(req.params.id);
    res.json({ success: true, session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Pause exam
router.post("/session/:id/pause", async (req, res) => {
  try {
    const session = await SessionManager.pauseExam(req.params.id);
    res.json({ success: true, session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Resume exam
router.post("/session/:id/resume", async (req, res) => {
  try {
    const session = await SessionManager.resumeExam(req.params.id);
    res.json({ success: true, session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST End exam
router.post("/session/:id/end", async (req, res) => {
  try {
    const session = await SessionManager.endExam(req.params.id);
    res.json({ success: true, session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Extend time
router.post("/session/:id/extend", async (req, res) => {
  const { minutes } = req.body;
  if (!minutes) return res.status(400).json({ error: "minutes is required" });
  try {
    const session = await SessionManager.extendTime(req.params.id, parseInt(minutes, 10));
    res.json({ success: true, session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET Get active session
router.get("/session/active", async (_req, res) => {
  try {
    const session = await SessionManager.getActiveSession();
    if (session) {
      const exam = await Exam.findById(session.examId);
      res.json({ success: true, session: { ...(session as any).toObject(), examTitle: exam?.title || 'Unknown Exam' } });
    } else {
      res.json({ success: true, session: null });
    }
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET all sessions (History)
router.get("/sessions", async (_req, res) => {
  try {
    const sessions = await ExamSession.find().sort({ createdAt: -1 });
    const exams = await Exam.find();
    const examMap = new Map(exams.map(e => [String(e._id), e]));

    const populatedSessions = sessions.map(s => {
      const exam = examMap.get(s.examId);
      return {
        ...s.toObject(),
        examTitle: exam?.title || 'Unknown Exam'
      };
    });

    res.json({ success: true, sessions: populatedSessions });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});



// GET results for all attempts in a specific session
router.get("/session/:id/results", async (req, res) => {
  try {
    const session = await ExamSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const attempts = await ExamAttempt.find({ sessionId: session._id });
    const studentIds = attempts.map(a => a.studentId);
    const students = await Student.find({ _id: { $in: studentIds } });
    const studentMap = new Map(students.map(s => [String(s._id), s]));

    // Evaluate all attempts
    const results = [];
    for (const attempt of attempts) {
      const student = studentMap.get(attempt.studentId);
      if (!student) continue;

      let summary = null;
      if (["submitted", "force_submitted", "timed_out"].includes(attempt.status)) {
        const evalResult = await evaluateExamAttempt(attempt);
        summary = {
          totalScore: evalResult.totalScore,
          maxScore: evalResult.maxScore,
          correctCount: evalResult.correctCount,
          incorrectCount: evalResult.incorrectCount,
          skippedCount: evalResult.skippedCount
        };
      }

      results.push({
        attemptId: attempt._id,
        clientId: attempt.clientId,
        studentId: attempt.studentId,
        studentName: student.name,
        studentEmail: student.email,
        studentBatch: student.batch,
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        timeSpentMs: attempt.timeSpentMs,
        summary
      });
    }

    res.json({ success: true, results, session });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET detailed result for a single attempt
router.get("/attempt/:attemptId/results", async (req, res) => {
  try {
    const attempt = await ExamAttempt.findById(req.params.attemptId);
    if (!attempt) return res.status(404).json({ error: "Attempt not found" });

    const student = await Student.findById(attempt.studentId);
    const evalResult = await evaluateExamAttempt(attempt);

    res.json({
      success: true,
      attempt: {
        _id: attempt._id,
        status: attempt.status,
        submittedAt: attempt.submittedAt,
        timeSpentMs: attempt.timeSpentMs,
        student: student ? { name: student.name, email: student.email, batch: student.batch } : null
      },
      summary: {
        totalScore: evalResult.totalScore,
        maxScore: evalResult.maxScore,
        correctCount: evalResult.correctCount,
        incorrectCount: evalResult.incorrectCount,
        skippedCount: evalResult.skippedCount,
        totalQuestions: attempt.questions.length
      },
      questions: evalResult.questions
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// GET Monitor data for session
router.get("/session/:id/monitor", async (req, res) => {
  try {
    const session = await ExamSession.findById(req.params.id);
    if (!session) return res.status(404).json({ error: "Session not found" });

    const exam = await Exam.findById(session.examId);
    const examTitle = exam ? exam.title : "Unknown Exam";

    const attempts = await ExamAttempt.find({ sessionId: req.params.id });
    
    const monitorAttempts = [];
    for (const attempt of attempts) {
      const client = await Client.findById(attempt.clientId);
      const student = await Student.findById(attempt.studentId);
      
      const answers = await Answer.find({ attemptId: attempt._id });
      const answeredCount = answers.filter((a: any) => {
        if (a.answer === null || a.answer === undefined || a.answer === "") return false;
        if (Array.isArray(a.answer) && a.answer.length === 0) return false;
        return true;
      }).length;

      monitorAttempts.push({
        _id: attempt._id,
        clientId: attempt.clientId,
        studentId: attempt.studentId,
        status: attempt.status,
        startedAt: attempt.startedAt,
        submittedAt: attempt.submittedAt,
        timeSpentMs: attempt.timeSpentMs,
        tabSwitchCount: attempt.tabSwitchCount || 0,
        currentQuestionId: attempt.currentQuestionId || null,
        questions: attempt.questions,
        answeredCount,
        client: client ? {
          _id: client._id,
          machineName: client.machineName,
          ipAddress: client.ipAddress,
          status: client.status,
          lastSeen: client.lastSeen
        } : null,
        student: student ? {
          _id: student._id,
          name: student.name,
          email: student.email,
          photoUrl: "",
          batch: student.batch
        } : null
      });
    }

    res.json({
      success: true,
      session,
      examTitle,
      attempts: monitorAttempts
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Broadcast message to session
router.post("/session/:id/broadcast", async (req, res) => {
  const { message } = req.body;
  if (!message) return res.status(400).json({ error: "Message is required" });
  
  const io = getIO();
  io?.emit("exam:message", { message });
  
  res.json({ success: true });
});

// DELETE Discard session
router.delete("/session/:id", async (req, res) => {
  try {
    await SessionManager.discardSession(req.params.id);
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// DELETE Discard all sessions
router.delete("/sessions", async (_req, res) => {
  try {
    const sessions = await ExamSession.find({});
    for (const session of sessions) {
      await SessionManager.discardSession(session._id.toString());
    }
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
