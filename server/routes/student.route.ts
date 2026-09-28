import { Router } from "express";
import crypto from "crypto";
import { Student } from "../db/models/Student";
import { Client } from "../db/models/Client";
import { getIO } from "../ws/ws-server";

const router = Router();

const publicStudent = (s: any) => ({
  _id: s._id,
  name: s.name,
  email: s.email || "",
  batch: s.batch || "",
  registerNumber: s.registerNumber || "",
  phone: s.phone || "",
  photoUrl: "",
});

function clean(body: any) {
  return {
    name: String(body?.name || "").trim(),
    email: String(body?.email || "").trim(),
    batch: String(body?.batch || "").trim(),
    registerNumber: String(body?.registerNumber || "").trim(),
    phone: String(body?.phone || "").trim(),
  };
}

router.get("/students", async (req, res) => {
  const search = String(req.query.search || "").trim().toLowerCase();
  const limit = req.query.limit ? parseInt(String(req.query.limit), 10) : 50;
  let students = await Student.find({}).sort({ name: 1 });
  if (search) {
    students = students.filter((s) =>
      [s.name, s.email, s.batch, s.registerNumber].some((f) => (f || "").toLowerCase().includes(search))
    );
  }
  res.json({ success: true, total: students.length, students: students.slice(0, limit).map(publicStudent) });
});

router.post("/students", async (req, res) => {
  const data = clean(req.body);
  if (!data.name) return res.status(400).json({ error: "Name is required" });
  const student = new Student({ _id: crypto.randomUUID(), ...data, createdAt: new Date() });
  await student.save();
  res.json({ success: true, student: publicStudent(student) });
});

// Bulk add: { students: [{ name, email?, batch?, registerNumber?, phone? }] }
router.post("/students/bulk", async (req, res) => {
  const rows: any[] = Array.isArray(req.body?.students) ? req.body.students : [];
  let added = 0;
  let skipped = 0;
  for (const row of rows) {
    const data = clean(row);
    if (!data.name) {
      skipped++;
      continue;
    }
    await new Student({ _id: crypto.randomUUID(), ...data, createdAt: new Date() }).save();
    added++;
  }
  res.json({ success: true, added, skipped });
});

router.put("/students/:id", async (req, res) => {
  const student = await Student.findById(req.params.id);
  if (!student) return res.status(404).json({ error: "Student not found" });
  const data = clean(req.body);
  if (!data.name) return res.status(400).json({ error: "Name is required" });
  Object.assign(student, data);
  await student.save();
  res.json({ success: true, student: publicStudent(student) });
});

router.delete("/students/:id", async (req, res) => {
  const removed = await Student.findByIdAndDelete(req.params.id);
  if (!removed) return res.status(404).json({ error: "Student not found" });
  // free any lab machine this student was assigned to
  const io = getIO();
  for (const client of await Client.find({ studentId: req.params.id })) {
    client.studentId = null;
    await client.save();
    if (client.wsId) io?.to(client.wsId).emit("client:assigned", { student: null });
    io?.to("admin").emit("admin:client-updated", client);
  }
  res.json({ success: true });
});

export default router;
