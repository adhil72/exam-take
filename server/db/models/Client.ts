import { createModel } from "../file-store";

export interface IClient {
  _id: string; // Logical client UUID, stored in localStorage on the client
  sessionId?: string | null;
  machineName: string; // PC identifier (e.g., PC-01)
  ipAddress: string;
  status: "pending" | "approved" | "rejected" | "disconnected" | "locked";
  studentId?: string | null; // References Student._id
  connectedAt: Date;
  wsId?: string | null; // Current Socket.io connection id
  lastSeen?: Date | null;
}

export const Client = createModel<IClient>("clients", {
  dateFields: ["connectedAt", "lastSeen"],
  defaults: () => ({ sessionId: null, status: "approved", studentId: null, connectedAt: new Date(), wsId: null, lastSeen: null }),
});
