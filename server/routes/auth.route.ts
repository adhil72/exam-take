import { Router } from "express";
import { adminName, checkCredentials, createAdmin, isConfigured, issueToken } from "../auth/admin-auth";

const router = Router();

// Tells the login page whether to show first-run setup or the sign-in form
router.get("/status", async (_req, res) => {
  res.json({ configured: await isConfigured() });
});

// First-run only: create the admin account
router.post("/setup", async (req, res) => {
  const name = String(req.body?.name || "").trim();
  const password = String(req.body?.password || "");
  if (!name) return res.status(400).json({ error: "Name is required" });
  if (password.length < 6) return res.status(400).json({ error: "Password must be at least 6 characters" });
  try {
    await createAdmin(name, password);
  } catch (err: any) {
    return res.status(409).json({ error: err.message });
  }
  res.json({ success: true, name, token: await issueToken() });
});

router.post("/login", async (req, res) => {
  const { name, password } = req.body || {};
  if (!(await checkCredentials(String(name || ""), String(password || "")))) {
    return res.status(401).json({ error: "Incorrect name or password" });
  }
  res.json({ success: true, name: await adminName(), token: await issueToken() });
});

export default router;
