import { createModel } from "../file-store";

export interface IStudent {
  _id: string;
  name: string;
  email: string;
  batch: string;
  registerNumber: string;
  phone: string;
  createdAt: Date;
}

export const Student = createModel<IStudent>("students", {
  dateFields: ["createdAt"],
  defaults: () => ({ email: "", batch: "", registerNumber: "", phone: "", createdAt: new Date() }),
});
