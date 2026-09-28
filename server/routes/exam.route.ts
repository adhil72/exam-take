import { Router } from "express";
import crypto from "crypto";
import { Exam, IExam, IExamTopicConfig } from "../db/models/Exam";
import { ExamSession } from "../db/models/ExamSession";
import { ExamAttempt } from "../db/models/ExamAttempt";
import { questionBank } from "../questions/bank";

const router = Router();

/** Compare configured counts against what the question bank can supply. */
export function validateExam(exam: Pick<IExam, "streamId" | "years" | "questionConfig">) {
  const details = (exam.questionConfig || []).map((c) => {
    const available = questionBank.pool(exam.streamId, c.topicId, exam.years || [], c.marks).length;
    return { topicId: c.topicId, topicName: c.topicName, marks: c.marks ?? null, requiredCount: c.count, availableCount: available, isShortage: available < c.count };
  });
  return { hasShortage: details.some((d) => d.isShortage), details };
}

function summarize(exam: IExam) {
  const v = validateExam(exam);
  const totalQuestions = exam.questionConfig.reduce((n, c) => n + c.count, 0);
  // Total marks is only known when every row fixes its mark value
  const totalMarks = exam.questionConfig.every((c) => c.marks) ? exam.questionConfig.reduce((n, c) => n + c.count * (c.marks as number), 0) : null;
  return { ...exam, totalQuestions, totalMarks, hasShortage: v.hasShortage };
}

/** Validates and normalizes the request body; returns an error string or the cleaned fields. */
function parseExamBody(body: any): { error: string } | { data: Omit<IExam, "_id" | "createdAt" | "updatedAt"> } {
  const title = String(body?.title || "").trim();
  if (!title) return { error: "Exam name is required" };

  const stream = questionBank.getStream(String(body?.streamId || ""));
  if (!stream) return { error: "Select a valid stream" };

  const duration = Number(body?.duration);
  if (!Number.isFinite(duration) || duration < 1) return { error: "Duration must be at least 1 minute" };

  const years = Array.isArray(body?.years) ? body.years.map(String).filter((y: string) => stream.years.includes(y)) : [];

  const seen = new Set<string>();
  const questionConfig: IExamTopicConfig[] = [];
  for (const c of Array.isArray(body?.questionConfig) ? body.questionConfig : []) {
    const topic = stream.topics.find((t) => t.topicId === c?.topicId);
    if (!topic) return { error: `Unknown topic "${c?.topicId}" for this stream` };
    const marks = c?.marks == null || c.marks === "" ? null : Number(c.marks);
    if (marks !== null && !(marks > 0)) return { error: `Invalid marks for "${topic.topicName}"` };
    const key = `${topic.topicId}|${marks ?? "any"}`;
    if (seen.has(key)) return { error: `Topic "${topic.topicName}" is added twice${marks ? ` for ${marks}-mark questions` : ""}` };
    const count = Math.floor(Number(c.count));
    if (!Number.isFinite(count) || count < 1) return { error: `Question count for "${topic.topicName}" must be at least 1` };
    seen.add(key);
    questionConfig.push({ topicId: topic.topicId, topicName: topic.topicName, marks, count });
  }
  if (questionConfig.length === 0) return { error: "Add at least one topic" };

  return { data: { title, streamId: stream.streamId, streamName: stream.name, duration, years, questionConfig } };
}

/**
 * Standard GATE paper: 65 questions / 100 marks / 180 min.
 *  - General Aptitude: 5 x 1-mark + 5 x 2-mark            (10 Q, 15 marks)
 *  - Engineering Mathematics: 5 x 1-mark + 4 x 2-mark      (9 Q, 13 marks)
 *  - Core subject topics: 20 x 1-mark + 26 x 2-mark         (46 Q, 72 marks), spread evenly
 * Counts are capped by what the bank has for the chosen years; any gap shows up as a shortage warning.
 */
const GATE_PATTERN = { duration: 180, ga: { 1: 5, 2: 5 }, math: { 1: 5, 2: 4 }, core: { 1: 20, 2: 26 } };

function gatePatternConfig(streamId: string, years: string[]): IExamTopicConfig[] {
  const stream = questionBank.getStream(streamId);
  if (!stream) return [];
  const avail = (topicId: string, marks: number) => questionBank.pool(streamId, topicId, years, marks).length;
  const out: IExamTopicConfig[] = [];
  const push = (topicId: string, topicName: string, marks: number, count: number) => {
    if (count > 0) out.push({ topicId, topicName, marks, count });
  };

  for (const [name, spec] of [["General Aptitude", GATE_PATTERN.ga], ["Engineering Mathematics", GATE_PATTERN.math]] as const) {
    const t = stream.topics.find((x) => x.topicId === name);
    if (t) for (const m of [1, 2] as const) push(t.topicId, t.topicName, m, spec[m]);
  }

  // Core topics: deal questions out round-robin so every topic contributes, respecting availability
  const core = stream.topics.filter((t) => t.topicId !== "General Aptitude" && t.topicId !== "Engineering Mathematics");
  for (const m of [1, 2] as const) {
    const given = new Map<string, number>(core.map((t) => [t.topicId, 0]));
    let left = GATE_PATTERN.core[m];
    let progressed = true;
    while (left > 0 && progressed) {
      progressed = false;
      for (const t of core) {
        if (left === 0) break;
        if ((given.get(t.topicId) || 0) < avail(t.topicId, m)) {
          given.set(t.topicId, (given.get(t.topicId) || 0) + 1);
          left--;
          progressed = true;
        }
      }
    }
    for (const t of core) push(t.topicId, t.topicName, m, given.get(t.topicId) || 0);
  }
  return out;
}

// Standard GATE pattern for a stream (used to pre-fill the exam builder)
router.get("/streams/:streamId/gate-pattern", (req, res) => {
  const stream = questionBank.getStream(req.params.streamId);
  if (!stream) return res.status(404).json({ error: "Stream not found" });
  const years = String(req.query.years || "").split(",").filter((y) => stream.years.includes(y));
  res.json({ success: true, duration: GATE_PATTERN.duration, years, questionConfig: gatePatternConfig(stream.streamId, years) });
});

// Question bank streams + topics (for the exam builder)
router.get("/streams", (_req, res) => {
  res.json({ success: true, streams: questionBank.getStreams() });
});

router.get("/exams", async (_req, res) => {
  const exams = await Exam.find({}).sort({ createdAt: -1 });
  res.json({ success: true, exams: exams.map((e) => summarize(e.toObject())) });
});

router.get("/exams/:id", async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  res.json({ success: true, exam: exam.toObject(), validation: validateExam(exam.toObject()) });
});

router.post("/exams", async (req, res) => {
  const parsed = parseExamBody(req.body);
  if ("error" in parsed) return res.status(400).json({ error: parsed.error });
  const exam = new Exam({ _id: crypto.randomUUID(), ...parsed.data, createdAt: new Date(), updatedAt: new Date() });
  await exam.save();
  res.json({ success: true, exam: exam.toObject(), validation: validateExam(exam.toObject()) });
});

router.put("/exams/:id", async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  const parsed = parseExamBody(req.body);
  if ("error" in parsed) return res.status(400).json({ error: parsed.error });
  Object.assign(exam, parsed.data, { updatedAt: new Date() });
  await exam.save();
  res.json({ success: true, exam: exam.toObject(), validation: validateExam(exam.toObject()) });
});

router.post("/exams/:id/duplicate", async (req, res) => {
  const exam = await Exam.findById(req.params.id);
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  const copy = new Exam({ ...exam.toObject(), _id: crypto.randomUUID(), title: `${exam.title} (copy)`, createdAt: new Date(), updatedAt: new Date() });
  await copy.save();
  res.json({ success: true, exam: copy.toObject() });
});

router.delete("/exams/:id", async (req, res) => {
  const active = await ExamSession.findOne({ examId: req.params.id, status: { $in: ["setup", "lobby", "in_progress", "paused"] } });
  if (active) return res.status(400).json({ error: "This exam has an active session. End or discard it first." });
  const removed = await Exam.findByIdAndDelete(req.params.id);
  if (!removed) return res.status(404).json({ error: "Exam not found" });
  res.json({ success: true });
});

// Preview: the question pool the exam draws from (up to `count` per topic)
router.get("/questions/:examId", async (req, res) => {
  const exam = await Exam.findById(req.params.examId);
  if (!exam) return res.status(404).json({ error: "Exam not found" });
  const questions = exam.questionConfig.flatMap((c) => questionBank.pool(exam.streamId, c.topicId, exam.years, c.marks).slice(0, c.count));
  res.json({ success: true, questions });
});

// Questions already used by past sessions of this exam
router.get("/questions/:examId/previously-used", async (req, res) => {
  const sessions = await ExamSession.find({ examId: req.params.examId });
  const attempts = await ExamAttempt.find({ sessionId: { $in: sessions.map((s) => s._id) } });
  const ids = Array.from(new Set(attempts.flatMap((a) => a.questions)));
  res.json({ success: true, questions: questionBank.findByIds(ids) });
});

export default router;
