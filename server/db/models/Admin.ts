import { createModel } from "../file-store";

export interface IAdmin {
  _id: string; // always "admin" — single admin account
  name: string;
  salt: string;
  passwordHash: string;
  tokenSecret: string; // signs login tokens; rotates when the password changes
  createdAt: Date;
}

export const Admin = createModel<IAdmin>("admin", { dateFields: ["createdAt"], defaults: () => ({ createdAt: new Date() }) });
