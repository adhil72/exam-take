import express from "express";
import os from "os";
import ViteExpress from "vite-express";
import cors from "cors";
import { config } from "./config";
import { questionBank } from "./questions/bank";
import { requireAdmin } from "./auth/admin-auth";
import authRoutes from "./routes/auth.route";
import { initSocketServer } from "./ws/ws-server";
import { SessionManager } from "./session/session-manager";
import apiRoutes from "./routes/index";

const app = express();


// Middleware
app.use(cors());
app.use(express.json());
// Question images from the local gate-questions checkout. Images only: the question JSON holds the answer keys.
const QBANK_IMAGE = /\/images\/[^/]+\.(png|jpe?g|gif|svg|webp)$/i;
app.use(
  "/qbank",
  (req, res, next) => (QBANK_IMAGE.test(req.path) ? next() : res.sendStatus(404)),
  express.static(config.questionsDir, { index: false, dotfiles: "deny" })
);

// Heartbeat route
app.get("/api/status", (_req, res) => {
  // LAN addresses let the admin dashboard show where student machines should connect
  const lanAddresses = Object.values(os.networkInterfaces())
    .flat()
    .filter((i): i is os.NetworkInterfaceInfo => !!i && i.family === "IPv4" && !i.internal)
    .map((i) => i.address);
  res.json({ status: "online", environment: process.env.NODE_ENV, port: config.port, lanAddresses });
});

// Register API Routes
app.use("/api/auth", authRoutes);
app.use("/api/admin", requireAdmin, apiRoutes);

// Start Server
async function startServer() {
  try {
    // 1. Load the local question bank (data is stored in JSON files under DATA_DIR)
    questionBank.load();

    // Recover active session from DB
    await SessionManager.recoverActiveSession();

    // 2. Start Express / Vite
    ViteExpress.config({
      inlineViteConfig: {
        server: {
          host: '0.0.0.0',
        },
      } as any,
    });

    const server = app.listen(config.port, '0.0.0.0', () => {
      console.log(`Server is listening on port ${config.port}...`);
    });

    ViteExpress.bind(app, server);

    // 3. Init Socket.io
    initSocketServer(server);
  } catch (error) {
    console.error("Failed to start server:", error);
    process.exit(1);
  }
}

startServer();
