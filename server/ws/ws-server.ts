import { Server as SocketIOServer, Socket } from "socket.io";
import { Server as HTTPServer } from "http";
import crypto from "crypto";
import { Client } from "../db/models/Client";
import { Student } from "../db/models/Student";
import { ExamAttempt } from "../db/models/ExamAttempt";
import { Answer } from "../db/models/Answer";
import { verifyToken } from "../auth/admin-auth";
import { SessionManager } from "../session/session-manager";

let io: SocketIOServer | null = null;

export function initSocketServer(server: HTTPServer) {
  io = new SocketIOServer(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"]
    }
  });

  io.on("connection", async (socket: Socket) => {
    const role = socket.handshake.query.role as string;
    const queryClientId = socket.handshake.query.clientId as string;

    console.log(`New socket connection: ${socket.id}, role: ${role}, clientId: ${queryClientId}`);

    if (role === "admin") {
      if (!(await verifyToken(socket.handshake.auth?.token))) {
        socket.disconnect(true);
        return;
      }
      socket.join("admin");
      console.log(`Admin joined admin room: ${socket.id}`);
    } else if (role === "client" && queryClientId) {
      // Reconnection flow for client
      try {
        const client = await Client.findById(queryClientId);
        if (client) {
          client.wsId = socket.id;
          if (client.status === "disconnected") {
            client.status = "approved"; 
          }
          await client.save();
          socket.join("clients");
          
          // Notify admin of reconnection
          io?.to("admin").emit("admin:client-reconnected", { clientId: queryClientId });
          
          // Let client know they are registered/approved/assigned
          socket.emit("client:registered", { clientId: queryClientId, status: client.status });
          
          if ((client.status === "approved" || client.status === "locked") && client.studentId) {
            const student = await Student.findById(client.studentId);
            if (student) {
              socket.emit("client:assigned", {
                student: {
                  id: student._id,
                  name: student.name,
                  email: student.email,
                  photoUrl: ""
                }
              });
            }

            // Restore active exam attempt if exam is in progress
            const activeSession = await SessionManager.getActiveSession();
            if (activeSession && (activeSession.status === "in_progress" || activeSession.status === "paused")) {
              const attempt = await ExamAttempt.findOne({ 
                sessionId: activeSession._id, 
                clientId: queryClientId, 
                status: "in_progress" 
              });
              
              if (attempt) {
                const sanitizedQuestions = await SessionManager.getSanitizedQuestions(
                  attempt.questions, 
                  activeSession.settings.shuffleChoices
                );
                
                // Fetch saved answers
                const answers = await Answer.find({ attemptId: attempt._id });
                const answersMap = answers.reduce((acc, curr) => {
                  acc[curr.questionId] = {
                    answer: curr.answer,
                    timeSpentMs: curr.timeSpentMs
                  };
                  return acc;
                }, {} as any);

                socket.emit("exam:start", {
                  attemptId: attempt._id,
                  questions: sanitizedQuestions,
                  duration: Math.ceil((activeSession.endsAt!.getTime() - Date.now()) / 60000),
                  startTime: activeSession.startedAt?.toISOString(),
                  endTime: activeSession.endsAt?.toISOString(),
                  settings: activeSession.settings,
                  answers: answersMap,
                  sessionStatus: activeSession.status,
                  isLocked: client.status === "locked"
                });
              }
            }
          }
        }
      } catch (err) {
        console.error("Error restoring client connection:", err);
      }
    }

    // Client requests to join
    socket.on("client:join", async (data: { clientId?: string; machineName: string; browserInfo: string }) => {
      try {
        const ip = socket.handshake.address || socket.conn.remoteAddress || "127.0.0.1";
        const cid = data.clientId || crypto.randomUUID();
        
        let client = await Client.findById(cid);
        if (!client) {
          client = new Client({
            _id: cid,
            machineName: data.machineName,
            ipAddress: ip,
            status: "approved",
            wsId: socket.id,
            connectedAt: new Date()
          });
        } else {
          client.wsId = socket.id;
          client.machineName = data.machineName;
          client.ipAddress = ip;
          client.status = "approved";
          client.lastSeen = null;
        }
        await client.save();
        
        socket.join("clients");
        
        // Respond to client
        socket.emit("client:registered", { clientId: cid, status: "approved" });
        
        io?.to("admin").emit("admin:client-joined", {
          client: {
            _id: cid,
            machineName: client.machineName,
            ipAddress: client.ipAddress,
            status: client.status,
            studentId: client.studentId,
            connectedAt: client.connectedAt
          }
        });
        
        console.log(`Client registered and admin notified: ${cid} (${data.machineName})`);
      } catch (err) {
        console.error("Error handling client:join:", err);
      }
    });

    // Real-time exam listeners from client
    socket.on("client:answer", async (data: { attemptId: string; questionId: string; answer: any; timeSpentMs: number }) => {
      try {
        const { attemptId, questionId, answer, timeSpentMs } = data;
        const answerId = `${attemptId}_${questionId}`;
        
        await Answer.findOneAndUpdate(
          { _id: answerId },
          {
            attemptId,
            questionId,
            answer,
            timeSpentMs,
            answeredAt: new Date()
          },
          { upsert: true, new: true }
        );
        
        const attempt = await ExamAttempt.findById(attemptId);
        // Notify admin
        io?.to("admin").emit("admin:answer-updated", {
          attemptId,
          clientId: attempt?.clientId,
          questionId,
          answered: true
        });
      } catch (err) {
        console.error("Error saving client answer:", err);
      }
    });

    socket.on("client:submit", async (data: { attemptId: string }) => {
      try {
        const { attemptId } = data;
        const attempt = await ExamAttempt.findById(attemptId);
        if (attempt) {
          if (attempt.status === "in_progress") {
            attempt.status = "submitted";
            attempt.submittedAt = new Date();
            await attempt.save();
            
            socket.emit("exam:submitted", { success: true });
            io?.to("admin").emit("admin:attempt-submitted", { attemptId, clientId: attempt.clientId });
            console.log(`Exam attempt submitted successfully: ${attemptId}`);
          } else if (["submitted", "force_submitted", "timed_out"].includes(attempt.status)) {
            // Already submitted/ended, tell the client to navigate to submitted page
            socket.emit("exam:submitted", { success: true });
            console.log(`Exam attempt ${attemptId} already has status ${attempt.status}, notifying client`);
          }
        }
      } catch (err) {
        console.error("Error submitting client attempt:", err);
      }
    });

    socket.on("client:navigate", async (data: { clientId: string; questionId: string }) => {
      try {
        await ExamAttempt.updateOne(
          { clientId: data.clientId, status: "in_progress" },
          { currentQuestionId: data.questionId }
        );
      } catch (err) {
        console.error("Error updating navigate position:", err);
      }
      io?.to("admin").emit("admin:client-navigated", data);
    });

    socket.on("client:flag", (data: { clientId: string; questionId: string; isFlagged: boolean }) => {
      io?.to("admin").emit("admin:client-flagged", data);
    });

    socket.on("client:tab-switch", async (data: { clientId: string; isLeft: boolean }) => {
      let count = 0;
      try {
        if (data.isLeft) {
          const attempt = await ExamAttempt.findOne({ clientId: data.clientId, status: "in_progress" });
          if (attempt) {
            attempt.tabSwitchCount = (attempt.tabSwitchCount || 0) + 1;
            await attempt.save();
            count = attempt.tabSwitchCount;
          }
        } else {
          const attempt = await ExamAttempt.findOne({ clientId: data.clientId, status: "in_progress" });
          if (attempt) {
            count = attempt.tabSwitchCount || 0;
          }
        }
      } catch (err) {
        console.error("Error updating tab switch count:", err);
      }

      io?.to("admin").emit("admin:client-tab-switched", {
        clientId: data.clientId,
        isLeft: data.isLeft,
        tabSwitchCount: count,
        timestamp: new Date()
      });
      console.log(`Client tab switch notification received: ${data.clientId}, left: ${data.isLeft}, count: ${count}`);
    });

    socket.on("client:cheat-detected", async (data: { clientId: string; reason: string }) => {
      try {
        const client = await Client.findById(data.clientId);
        if (client) {
          client.status = "locked";
          await client.save();

          // Increment warning count (tabSwitchCount) for this student attempt
          const activeSession = await SessionManager.getActiveSession();
          let warnings = 0;
          if (activeSession) {
            const attempt = await ExamAttempt.findOne({ 
              sessionId: activeSession._id, 
              clientId: data.clientId, 
              status: "in_progress" 
            });
            if (attempt) {
              attempt.tabSwitchCount = (attempt.tabSwitchCount || 0) + 1;
              await attempt.save();
              warnings = attempt.tabSwitchCount;
            }
          }

          // Notify admin monitor
          io?.to("admin").emit("admin:client-updated", client);
          io?.to("admin").emit("admin:client-tab-switched", {
            clientId: data.clientId,
            isLeft: true, // Mark visual attention
            tabSwitchCount: warnings,
            timestamp: new Date()
          });

          console.log(`Cheat detected: Client ${data.clientId} locked. Reason: ${data.reason}`);
        }
      } catch (err) {
        console.error("Error handling cheat-detected:", err);
      }
    });

    socket.on("disconnect", async () => {
      try {
        if (role === "admin") {
          console.log(`Admin socket disconnected: ${socket.id}`);
        } else {
          // Find if this was a client connection
          const client = await Client.findOne({ wsId: socket.id });
          if (client) {
            client.wsId = null;
            if (client.status !== "locked") {
              client.status = "disconnected";
            }
            client.lastSeen = new Date();
            await client.save();
            
            // Notify admin
            io?.to("admin").emit("admin:client-disconnected", {
              clientId: client._id,
              machineName: client.machineName,
              lastSeen: client.lastSeen
            });
            console.log(`Client socket disconnected: ${client._id}`);
          }
        }
      } catch (err) {
        console.error("Error on disconnect handler:", err);
      }
    });
  });

  return io;
}

export function getIO() {
  return io;
}
