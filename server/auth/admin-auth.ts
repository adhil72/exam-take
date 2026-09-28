import crypto from "crypto";
import type { Request, Response, NextFunction } from "express";
import { Admin } from "../db/models/Admin";

const ADMIN_ID = "admin";
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;

const hashPassword = (password: string, salt: string) => crypto.scryptSync(password, salt, 64).toString("hex");
const sign = (payload: string, secret: string) => crypto.createHmac("sha256", secret).update(payload).digest("base64url");

async function getAdmin() {
  return Admin.findById(ADMIN_ID);
}

export async function isConfigured() {
  return !!(await getAdmin());
}

export async function adminName() {
  return (await getAdmin())?.name || null;
}

/** Creates the admin account; only allowed while none exists. */
export async function createAdmin(name: string, password: string) {
  if (await getAdmin()) throw new Error("Admin is already set up");
  const salt = crypto.randomBytes(16).toString("hex");
  await new Admin({
    _id: ADMIN_ID,
    name,
    salt,
    passwordHash: hashPassword(password, salt),
    tokenSecret: crypto.randomBytes(32).toString("hex"),
  }).save();
}

export async function checkCredentials(name: string, password: string): Promise<boolean> {
  const admin = await getAdmin();
  if (!admin) return false;
  const a = Buffer.from(hashPassword(String(password), admin.salt), "hex");
  const b = Buffer.from(admin.passwordHash, "hex");
  const nameOk = admin.name.trim().toLowerCase() === String(name).trim().toLowerCase();
  return crypto.timingSafeEqual(a, b) && nameOk;
}

export async function issueToken(): Promise<string> {
  const admin = await getAdmin();
  if (!admin) throw new Error("Admin not set up");
  const payload = String(Date.now() + TOKEN_TTL_MS);
  return `${payload}.${sign(payload, admin.tokenSecret)}`;
}

export async function verifyToken(token?: string | null): Promise<boolean> {
  if (!token) return false;
  const admin = await getAdmin();
  if (!admin) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expected = sign(payload, admin.tokenSecret);
  if (sig.length !== expected.length || !crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return false;
  return Number(payload) > Date.now();
}

/** Endpoints the student-facing exam page calls without an admin token. */
const PUBLIC_ROUTES: RegExp[] = [/^\/client\/[^/]+\/results$/, /^\/client\/[^/]+\/unassign$/];

export async function requireAdmin(req: Request, res: Response, next: NextFunction) {
  if (PUBLIC_ROUTES.some((r) => r.test(req.path))) return next();
  const header = req.headers.authorization || "";
  if (!(await verifyToken(header.startsWith("Bearer ") ? header.slice(7) : null))) {
    return res.status(401).json({ error: "Unauthorized" });
  }
  next();
}
