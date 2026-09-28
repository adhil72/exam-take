import { Router } from "express";
import { Client } from "../db/models/Client";
import { Student } from "../db/models/Student";
import { SessionManager } from "../session/session-manager";
import { ExamAttempt } from "../db/models/ExamAttempt";
import { getIO } from "../ws/ws-server";
import { evaluateExamAttempt } from "../utils/evaluator";

const router = Router();

// GET all connected clients
router.get("/clients", async (_req, res) => {
  try {
    const clients = await Client.find({});
    
    const populatedClients = [];
    for (const client of clients) {
      const clientObj = client.toObject();
      if (client.studentId) {
        const student = await Student.findById(client.studentId);
        if (student) {
          (clientObj as any).student = {
            _id: student._id,
            name: student.name,
            email: student.email || '',
            batch: student.batch || '',
            photoUrl: ""
          };
        }
      }
      populatedClients.push(clientObj);
    }
    
    res.json({ success: true, clients: populatedClients });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Approve client
router.post("/client/:id/approve", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: "Client not found" });
    
    client.status = "approved";
    await client.save();
    
    const io = getIO();
    if (io && client.wsId) {
      io.to(client.wsId).emit("client:approved", { studentInfo: null });
    }
    io?.to("admin").emit("admin:client-updated", client);
    
    res.json({ success: true, client });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Reject client
router.post("/client/:id/reject", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: "Client not found" });
    
    client.status = "rejected";
    await client.save();
    
    const io = getIO();
    if (io && client.wsId) {
      io.to(client.wsId).emit("client:rejected", { reason: "Rejected by Admin" });
    }
    io?.to("admin").emit("admin:client-updated", client);
    
    res.json({ success: true, client });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Bulk approve clients
router.post("/clients/approve-all", async (_req, res) => {
  try {
    const pendingClients = await Client.find({ status: "pending" });
    const io = getIO();
    
    for (const client of pendingClients) {
      client.status = "approved";
      await client.save();
      if (io && client.wsId) {
        io.to(client.wsId).emit("client:approved", { studentInfo: null });
      }
    }
    
    io?.to("admin").emit("admin:clients-bulk-approved");
    res.json({ success: true, count: pendingClients.length });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Assign student to client
router.post("/client/:id/assign", async (req, res) => {
  const { studentId } = req.body;
  if (!studentId) return res.status(400).json({ error: "studentId is required" });
  
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: "Client not found" });
    if (client.status === "pending") {
      client.status = "approved";
      await client.save();
    } else if (client.status !== "approved") {
      return res.status(400).json({ error: "Only approved clients can be assigned a student" });
    }
    
    const existingAssignment = await Client.findOne({ studentId, _id: { $ne: req.params.id } });
    if (existingAssignment) {
      existingAssignment.studentId = null;
      await existingAssignment.save();
      
      const io = getIO();
      if (io && existingAssignment.wsId) {
        io.to(existingAssignment.wsId).emit("client:assigned", { student: null });
      }
      io?.to("admin").emit("admin:client-updated", existingAssignment);
    }
    
    client.studentId = studentId;
    await client.save();
    
    const student = await Student.findById(studentId);
    if (!student) return res.status(404).json({ error: "Student not found" });
    
    const io = getIO();
    if (io && client.wsId) {
      io.to(client.wsId).emit("client:assigned", {
        student: {
          id: student._id,
          name: student.name,
          email: student.email,
          photoUrl: ""
        }
      });
    }
    
    io?.to("admin").emit("admin:client-updated", client);
    res.json({ success: true, client });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Unassign student from client
router.post("/client/:id/unassign", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: "Client not found" });
    
    client.studentId = null;
    await client.save();
    
    const io = getIO();
    if (io && client.wsId) {
      io.to(client.wsId).emit("client:assigned", { student: null });
    }
    
    io?.to("admin").emit("admin:client-updated", client);
    res.json({ success: true, client });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Unassign all students from all clients
router.post("/clients/unassign-all", async (_req, res) => {
  try {
    const clients = await Client.find({});
    const io = getIO();
    
    for (const client of clients) {
      if (client.studentId) {
        client.studentId = null;
        await client.save();
        
        if (io && client.wsId) {
          io.to(client.wsId).emit("client:assigned", { student: null });
        }
        io?.to("admin").emit("admin:client-updated", client);
      }
    }
    
    res.json({ success: true });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Kick client
router.post("/client/:id/kick", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: "Client not found" });

    // Find and update active attempt if in progress
    const activeSession = await SessionManager.getActiveSession();
    if (activeSession) {
      const attempt = await ExamAttempt.findOne({ 
        sessionId: activeSession._id, 
        clientId: client._id, 
        status: "in_progress" 
      });
      if (attempt) {
        attempt.status = "force_submitted";
        attempt.submittedAt = new Date();
        await attempt.save();
      }
    }

    client.status = "rejected";
    client.studentId = null;
    await client.save();

    const io = getIO();
    if (io && client.wsId) {
      io.to(client.wsId).emit("client:rejected", { reason: "You have been kicked by the supervisor." });
    }
    io?.to("admin").emit("admin:client-updated", client);

    res.json({ success: true, client });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Force submit attempt
router.post("/client/:id/force-submit", async (req, res) => {
  try {
    const attempt = await SessionManager.forceSubmitAttempt(req.params.id);
    res.json({ success: true, attempt });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

// POST Unlock client
router.post("/client/:id/unlock", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: "Client not found" });
    
    client.status = "approved";
    await client.save();
    
    const io = getIO();
    if (io && client.wsId) {
      io.to(client.wsId).emit("exam:unlock");
    }
    io?.to("admin").emit("admin:client-updated", client);
    
    res.json({ success: true, client });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});



// GET client's exam results
router.get("/client/:id/results", async (req, res) => {
  try {
    const client = await Client.findById(req.params.id);
    if (!client) return res.status(404).json({ error: "Client not found" });

    // Find the latest attempt that is submitted, force_submitted, or timed_out
    const attempt = await ExamAttempt.findOne({
      clientId: client._id,
      status: { $in: ["submitted", "force_submitted", "timed_out"] }
    }).sort({ submittedAt: -1 });

    if (!attempt) return res.status(404).json({ error: "No submitted attempt found" });

    const evalResult = await evaluateExamAttempt(attempt);

    res.json({
      success: true,
      summary: {
        totalScore: evalResult.totalScore,
        maxScore: evalResult.maxScore,
        correctCount: evalResult.correctCount,
        incorrectCount: evalResult.incorrectCount,
        skippedCount: evalResult.skippedCount,
        totalQuestions: attempt.questions.length,
        submittedAt: attempt.submittedAt,
        timeSpentMs: attempt.timeSpentMs
      },
      questions: evalResult.questions
    });
  } catch (error: any) {
    res.status(500).json({ error: error.message });
  }
});

export default router;
