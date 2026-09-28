import dotenv from "dotenv";
import path from "path";
dotenv.config();

export const config = {
  port: parseInt(process.env.PORT || "3000", 10),
  // JSON file storage (replaces MongoDB)
  dataDir: path.resolve(process.env.DATA_DIR || "data"),
  // Checkout of the gate-questions repository
  questionsDir: path.resolve(process.env.QUESTIONS_DIR || "../gate-questions"),
};
