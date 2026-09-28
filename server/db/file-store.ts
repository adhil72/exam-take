import fs from "fs";
import path from "path";
import { config } from "../config";

/**
 * Tiny JSON-file document store exposing the subset of the mongoose model API
 * this app uses (find / findOne / findById / findByIdAndUpdate / save / ...).
 * One file per collection under DATA_DIR, fully cached in memory, written
 * atomically (tmp file + rename) after a short debounce.
 */

type Doc = Record<string, any>;

function clone<T>(value: T): T {
  if (value instanceof Date) return new Date(value.getTime()) as any;
  if (Array.isArray(value)) return value.map(clone) as any;
  if (value && typeof value === "object") {
    const out: Doc = {};
    for (const [k, v] of Object.entries(value)) out[k] = clone(v);
    return out as any;
  }
  return value;
}

function valuesEqual(actual: any, expected: any): boolean {
  if (expected === null) return actual === null || actual === undefined;
  if (Array.isArray(actual) && !Array.isArray(expected)) {
    return actual.some((a) => valuesEqual(a, expected));
  }
  if (actual instanceof Date && expected instanceof Date) return actual.getTime() === expected.getTime();
  return actual === expected;
}

function matches(doc: Doc, query: Doc): boolean {
  for (const [key, cond] of Object.entries(query || {})) {
    if (key === "$or") {
      if (!(cond as Doc[]).some((q) => matches(doc, q))) return false;
      continue;
    }
    if (key === "$and") {
      if (!(cond as Doc[]).every((q) => matches(doc, q))) return false;
      continue;
    }
    const actual = doc[key];
    const isOperator =
      cond && typeof cond === "object" && !(cond instanceof Date) && !(cond instanceof RegExp) && !Array.isArray(cond) &&
      Object.keys(cond).some((k) => k.startsWith("$"));
    if (cond instanceof RegExp) {
      if (typeof actual !== "string" || !cond.test(actual)) return false;
    } else if (isOperator) {
      for (const [op, val] of Object.entries(cond as Doc)) {
        if (op === "$in") {
          if (!(val as any[]).some((v) => valuesEqual(actual, v))) return false;
        } else if (op === "$nin") {
          if ((val as any[]).some((v) => valuesEqual(actual, v))) return false;
        } else if (op === "$ne") {
          if (valuesEqual(actual, val)) return false;
        } else if (op === "$exists") {
          if ((actual !== undefined) !== !!val) return false;
        } else {
          throw new Error(`Unsupported query operator ${op}`);
        }
      }
    } else if (!valuesEqual(actual, cond)) {
      return false;
    }
  }
  return true;
}

class Collection {
  private docs = new Map<string, Doc>();
  private timer: NodeJS.Timeout | null = null;
  private file: string;

  constructor(name: string, private dateFields: string[]) {
    this.file = path.join(config.dataDir, `${name}.json`);
    this.load();
  }

  private load() {
    fs.mkdirSync(config.dataDir, { recursive: true });
    if (!fs.existsSync(this.file)) return;
    try {
      const raw = JSON.parse(fs.readFileSync(this.file, "utf8")) as Doc[];
      for (const d of raw) {
        for (const f of this.dateFields) if (d[f]) d[f] = new Date(d[f]);
        this.docs.set(d._id, d);
      }
    } catch (err) {
      console.error(`Failed to read ${this.file}; starting empty.`, err);
      fs.copyFileSync(this.file, `${this.file}.corrupt-${Date.now()}`);
    }
  }

  private schedule() {
    if (this.timer) return;
    this.timer = setTimeout(() => {
      this.timer = null;
      this.flush();
    }, 150);
  }

  flush() {
    if (this.timer) {
      clearTimeout(this.timer);
      this.timer = null;
    }
    const tmp = `${this.file}.tmp`;
    fs.writeFileSync(tmp, JSON.stringify(Array.from(this.docs.values())));
    fs.renameSync(tmp, this.file);
  }

  all(): Doc[] {
    return Array.from(this.docs.values());
  }
  get(id: string) {
    return this.docs.get(id);
  }
  put(doc: Doc) {
    this.docs.set(doc._id, clone(doc));
    this.schedule();
  }
  remove(id: string) {
    const had = this.docs.delete(id);
    if (had) this.schedule();
    return had;
  }
}

const allCollections: Collection[] = [];
const flushAll = () => allCollections.forEach((c) => c.flush());
process.on("exit", flushAll);
for (const sig of ["SIGINT", "SIGTERM"] as const) {
  process.on(sig, () => {
    flushAll();
    process.exit(0);
  });
}

class Query<T> implements PromiseLike<T> {
  private sortSpec: Record<string, 1 | -1> | null = null;
  private limitN: number | null = null;
  constructor(private run: (sort: Query<T>["sortSpec"], limit: number | null) => T) {}
  sort(spec: Record<string, 1 | -1>) {
    this.sortSpec = spec;
    return this;
  }
  limit(n: number) {
    this.limitN = n;
    return this;
  }
  then<R1 = T, R2 = never>(
    onfulfilled?: ((value: T) => R1 | PromiseLike<R1>) | null,
    onrejected?: ((reason: any) => R2 | PromiseLike<R2>) | null
  ): Promise<R1 | R2> {
    return Promise.resolve()
      .then(() => this.run(this.sortSpec, this.limitN))
      .then(onfulfilled, onrejected);
  }
}

export interface ModelOptions<T> {
  dateFields?: string[];
  defaults?: () => Partial<T>;
}

export type Instance<T> = T & { save(): Promise<Instance<T>>; toObject(): T };

export interface ModelStatic<T> {
  new (data: Partial<T>): Instance<T>;
  find(query?: Doc): Query<Instance<T>[]>;
  findOne(query?: Doc): Query<Instance<T> | null>;
  findById(id: string): Query<Instance<T> | null>;
  countDocuments(query?: Doc): Promise<number>;
  findByIdAndUpdate(id: string, update: Doc, options?: { upsert?: boolean; new?: boolean }): Promise<Instance<T> | null>;
  findOneAndUpdate(query: Doc, update: Doc, options?: { upsert?: boolean; new?: boolean }): Promise<Instance<T> | null>;
  updateOne(query: Doc, update: Doc): Promise<{ matchedCount: number }>;
  deleteMany(query?: Doc): Promise<{ deletedCount: number }>;
  findByIdAndDelete(id: string): Promise<Instance<T> | null>;
}

export function createModel<T extends { _id: string }>(name: string, opts: ModelOptions<T> = {}) {
  const collection = new Collection(name, opts.dateFields || []);
  allCollections.push(collection);

  const applyDefaults = (data: Doc): Doc => {
    const defaults: Doc = (opts.defaults ? opts.defaults() : {}) as Doc;
    const out: Doc = { ...defaults, ...data };
    for (const [k, v] of Object.entries(defaults)) {
      if (v && typeof v === "object" && !Array.isArray(v) && !(v instanceof Date) && data[k] && typeof data[k] === "object") {
        out[k] = { ...v, ...data[k] };
      }
    }
    return out;
  };

  class Model {
    constructor(data: Partial<T>) {
      Object.assign(this, applyDefaults(clone(data as Doc)));
    }

    async save() {
      collection.put(this.toObject());
      return this;
    }

    toObject(): T {
      return clone({ ...(this as any) }) as T;
    }

    toJSON() {
      return this.toObject();
    }

    static hydrate(doc: Doc): any {
      const inst = new Model({});
      for (const k of Object.keys(inst)) delete (inst as any)[k];
      Object.assign(inst, clone(doc));
      return inst as Model & T;
    }

    private static select(query: Doc, sort: Record<string, 1 | -1> | null, limit: number | null) {
      let rows = collection.all().filter((d) => matches(d, query));
      if (sort) {
        const entries = Object.entries(sort);
        rows = [...rows].sort((a, b) => {
          for (const [k, dir] of entries) {
            const av = a[k] instanceof Date ? a[k].getTime() : a[k];
            const bv = b[k] instanceof Date ? b[k].getTime() : b[k];
            if (av === bv) continue;
            if (av == null) return 1 * dir;
            if (bv == null) return -1 * dir;
            return (av < bv ? -1 : 1) * dir;
          }
          return 0;
        });
      }
      if (limit != null) rows = rows.slice(0, limit);
      return rows;
    }

    static find(query: Doc = {}) {
      return new Query<Array<Model & T>>((sort, limit) => this.select(query, sort, limit).map((d) => this.hydrate(d)));
    }

    static findOne(query: Doc = {}) {
      return new Query<(Model & T) | null>((sort) => {
        const row = this.select(query, sort, 1)[0];
        return row ? this.hydrate(row) : null;
      });
    }

    static findById(id: string) {
      return new Query<(Model & T) | null>(() => {
        const row = collection.get(id);
        return row ? this.hydrate(row) : null;
      });
    }

    static async countDocuments(query: Doc = {}) {
      return collection.all().filter((d) => matches(d, query)).length;
    }

    private static applyUpdate(existing: Doc | undefined, id: string, update: Doc, upsert?: boolean): Doc | null {
      if (!existing && !upsert) return null;
      const set = update.$set ? update.$set : Object.fromEntries(Object.entries(update).filter(([k]) => !k.startsWith("$")));
      const base = existing ? clone(existing) : applyDefaults({ _id: id });
      const next = { ...base, ...clone(set), _id: id };
      collection.put(next);
      return next;
    }

    static async findByIdAndUpdate(id: string, update: Doc, options: { upsert?: boolean; new?: boolean } = {}) {
      const next = this.applyUpdate(collection.get(id), id, update, options.upsert);
      return next ? this.hydrate(next) : null;
    }

    static async findOneAndUpdate(query: Doc, update: Doc, options: { upsert?: boolean; new?: boolean } = {}) {
      const existing = this.select(query, null, 1)[0];
      const id = existing?._id ?? query._id;
      if (!id) throw new Error("findOneAndUpdate upsert requires an _id in the query");
      const next = this.applyUpdate(existing, id, update, options.upsert);
      return next ? this.hydrate(next) : null;
    }

    static async updateOne(query: Doc, update: Doc) {
      const existing = this.select(query, null, 1)[0];
      if (!existing) return { matchedCount: 0 };
      this.applyUpdate(existing, existing._id, update);
      return { matchedCount: 1 };
    }

    static async deleteMany(query: Doc = {}) {
      let n = 0;
      for (const d of this.select(query, null, null)) if (collection.remove(d._id)) n++;
      return { deletedCount: n };
    }

    static async findByIdAndDelete(id: string) {
      const row = collection.get(id);
      if (!row) return null;
      collection.remove(id);
      return this.hydrate(row);
    }
  }

  return Model as unknown as ModelStatic<T>;
}
