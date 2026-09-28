import fs from "fs";
import path from "path";
import { config } from "../config";

const RAW_IMAGE_PREFIX = "https://raw.githubusercontent.com/gecwyd/gate-questions/main/";
export const QBANK_URL_PREFIX = "/qbank/";

export interface BankQuestion {
  _id: string;
  question: string;
  type: "mcq" | "m-mcq" | "numerical" | "descriptive";
  choices: string[];
  answers: string[];
  explanation: string;
  marks: number;
  negativeMarks: number;
  streamId: string;
  topicId: string;
  year: string;
  paper: string;
  files: string[];
}

export interface StreamInfo {
  streamId: string;
  name: string;
  years: string[];
  topics: { topicId: string; topicName: string; count: number; byYear: Record<string, number>; byYearMark: Record<string, Record<string, number>> }[];
}

const localizeImages = (s: string | undefined) => (s ? s.split(RAW_IMAGE_PREFIX).join(QBANK_URL_PREFIX) : "");

class QuestionBank {
  private byId = new Map<string, BankQuestion>();
  private all: BankQuestion[] = [];
  private streams = new Map<string, StreamInfo>();
  loadedFrom = "";
  skipped = 0;

  load() {
    this.byId.clear();
    this.all = [];
    this.streams.clear();
    this.skipped = 0;
    const root = config.questionsDir;
    this.loadedFrom = root;
    if (!fs.existsSync(root)) {
      console.warn(`Question bank not found at ${root}. Set QUESTIONS_DIR to your gate-questions checkout.`);
      return;
    }

    for (const year of fs.readdirSync(root).filter((d) => /^\d{4}$/.test(d)).sort()) {
      for (const branch of safeDirs(path.join(root, year))) {
        for (const paper of safeDirs(path.join(root, year, branch))) {
          const file = path.join(root, year, branch, paper, "final_questions.json");
          if (!fs.existsSync(file)) continue;
          let raw: any[];
          try {
            raw = JSON.parse(fs.readFileSync(file, "utf8"));
          } catch (err) {
            console.error(`Failed to parse ${file}`, err);
            continue;
          }
          raw.forEach((r, i) => this.ingest(r, year, branch, paper, i));
        }
      }
    }

    for (const s of this.streams.values()) {
      s.years.sort();
      s.topics.sort((a, b) => a.topicName.localeCompare(b.topicName));
    }
    console.log(`Question bank: ${this.all.length} questions across ${this.streams.size} streams (${this.skipped} skipped: missing marks/answer key)`);
  }

  private ingest(r: any, year: string, branch: string, paper: string, index: number) {
    const topicName = String(r.topic_name || "").trim();
    const usable =
      topicName &&
      typeof r.marks === "number" &&
      Array.isArray(r.answers) &&
      r.answers.length > 0 &&
      r.question;
    if (!usable) {
      this.skipped++;
      return;
    }

    const q: BankQuestion = {
      _id: `${year}-${branch}-${paper}-${index}`,
      question: localizeImages(r.question),
      type: r.type,
      choices: (r.choices || []).map(localizeImages),
      answers: r.answers.map(localizeImages),
      explanation: localizeImages(r.explanation),
      marks: r.marks,
      negativeMarks: r.negativeMarks || 0,
      streamId: branch,
      topicId: topicName,
      year,
      paper,
      files: [],
    };
    this.byId.set(q._id, q);
    this.all.push(q);

    let stream = this.streams.get(branch);
    if (!stream) {
      stream = { streamId: branch, name: r.subject_name || branch.toUpperCase(), years: [], topics: [] };
      this.streams.set(branch, stream);
    }
    if (!stream.years.includes(year)) stream.years.push(year);
    let topic = stream.topics.find((t) => t.topicId === topicName);
    if (!topic) {
      topic = { topicId: topicName, topicName, count: 0, byYear: {}, byYearMark: {} };
      stream.topics.push(topic);
    }
    topic.count++;
    topic.byYear[year] = (topic.byYear[year] || 0) + 1;
    const yearMarks = (topic.byYearMark[year] ||= {});
    yearMarks[q.marks] = (yearMarks[q.marks] || 0) + 1;
  }

  getStreams(): StreamInfo[] {
    return Array.from(this.streams.values()).sort((a, b) => a.name.localeCompare(b.name));
  }

  getStream(streamId: string) {
    return this.streams.get(streamId);
  }

  findById(id: string) {
    return this.byId.get(id) || null;
  }

  findByIds(ids: string[]) {
    return ids.map((id) => this.byId.get(id)).filter((q): q is BankQuestion => !!q);
  }

  /** Questions of a stream/topic, optionally restricted to certain years and a mark value. */
  pool(streamId: string, topicId?: string, years: string[] = [], marks?: number | null): BankQuestion[] {
    return this.all.filter(
      (q) =>
        q.streamId === streamId &&
        (!topicId || q.topicId === topicId) &&
        (years.length === 0 || years.includes(q.year)) &&
        (marks == null || q.marks === marks)
    );
  }
}

function safeDirs(dir: string): string[] {
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && !d.name.startsWith("."))
    .map((d) => d.name);
}

export const questionBank = new QuestionBank();
