import { z } from "zod";

export const countrySchema = z.object({
  id: z.number().optional(),
  name: z.string().min(1, { message: "Name is required" }),
  code: z.string().min(1, { message: "Code is required" }),
  currency: z.string().min(1, { message: "Currency is required" }),
  timezone: z.string().min(1, { message: "Timezone is required" }),
  divisionId: z.coerce
    .number()
    .int()
    .positive({ message: "Division is required" })
    .min(1, { message: "Division is required" }),
  isDelete: z.boolean().default(false).optional(),
});

export type CountryFormInput = z.input<typeof countrySchema>;
export type CountryFormOutput = z.output<typeof countrySchema>;
