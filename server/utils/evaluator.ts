import { questionBank } from "../questions/bank";
import { Answer } from "../db/models/Answer";

export interface EvaluationResult {
  totalScore: number;
  maxScore: number;
  correctCount: number;
  incorrectCount: number;
  skippedCount: number;
  questions: any[];
}

// Numerical keys are either a single value ("2400") or an accepted range ("4.80 to 5.00")
function numericalMatches(studentAns: any, answers: string[] = []): boolean {
  const key = String(answers[0] ?? "").trim();
  const value = Number(String(studentAns).trim());
  const range = key.match(/^(-?[\d.]+)\s*to\s*(-?[\d.]+)$/i);
  if (range && Number.isFinite(value)) {
    const lo = Number(range[1]);
    const hi = Number(range[2]);
    return value >= Math.min(lo, hi) && value <= Math.max(lo, hi);
  }
  if (Number.isFinite(value) && key !== "" && Number.isFinite(Number(key))) return value === Number(key);
  return String(studentAns).trim() === key;
}

export const evaluateExamAttempt = async (
  attempt: any, 
  questionsMap?: Map<string, any>, 
  answers?: any[]
): Promise<EvaluationResult> => {
  // Fetch if not provided
  const qDocs = questionsMap 
    ? Array.from(questionsMap.values()) 
    : questionBank.findByIds(attempt.questions);
    
  const qMap = questionsMap || new Map(qDocs.map(q => [String(q._id), q]));
  
  const aDocs = answers || await Answer.find({ attemptId: attempt._id });
  const aMap = new Map();
  for (const a of aDocs) {
    aMap.set(String(a.questionId), a.answer);
  }

  let totalScore = 0;
  let maxScore = 0;
  let correctCount = 0;
  let incorrectCount = 0;
  let skippedCount = 0;

  const questionResults = [];

  for (const qId of attempt.questions) {
    const q = qMap.get(String(qId));
    if (!q) continue;

    const studentAns = aMap.get(String(q._id)) || null;
    let isCorrect = false;
    let scoreForQ = 0;
    let status = "skipped";

    maxScore += q.marks;

    if (studentAns === null || studentAns === undefined || studentAns === "") {
      skippedCount++;
      status = "skipped";
    } else {
      if (q.type === 'numerical') {
        isCorrect = numericalMatches(studentAns, q.answers);
      } else if (q.type === 'mcq') {
        if (q.answers && q.answers.length > 0 && String(studentAns) === String(q.answers[0])) {
          isCorrect = true;
        }
      } else if (q.type === 'm-mcq') {
        const sArr = Array.isArray(studentAns) ? studentAns : [];
        const cArr = Array.isArray(q.answers) ? q.answers : [];
        if (sArr.length > 0 && sArr.length === cArr.length) {
          const isMatch = sArr.every((val: any) => cArr.includes(val));
          isCorrect = isMatch;
        }
      } else if (q.type === 'descriptive') {
        status = "pending";
      }

      if (status !== "pending") {
        if (isCorrect) {
          status = "correct";
          correctCount++;
          scoreForQ = q.marks;
        } else {
          status = "incorrect";
          incorrectCount++;
          scoreForQ = -(q.negativeMarks || 0);
        }
      }
    }

    totalScore += scoreForQ;

    questionResults.push({
      id: q._id,
      question: q.question,
      type: q.type,
      marks: q.marks,
      negativeMarks: q.negativeMarks,
      choices: q.choices,
      correctAnswer: q.answers,
      studentAnswer: studentAns,
      status,
      score: scoreForQ,
      files: q.files
    });
  }

  return {
    totalScore,
    maxScore,
    correctCount,
    incorrectCount,
    skippedCount,
    questions: questionResults
  };
};
