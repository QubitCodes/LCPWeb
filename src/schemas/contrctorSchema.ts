import { z } from "zod";

export const contractorSchema = z.object({
  name: z.string().min(3, "Name must be at least 3 characters long"),
  email: z.string().email("Invalid email address").min(1, "Email is required"),
  password: z.string().min(6, "Password must be at least 6 characters long"),
});

export type ContractorFormInput = z.input<typeof contractorSchema>;
export type ContractorFormOutput = z.output<typeof contractorSchema>;
