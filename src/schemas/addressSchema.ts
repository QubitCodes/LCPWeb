import { z } from "zod";

export const addresSchema = z.object({
  id: z.number().optional(),
  address_line_1: z.string().min(1, { message: "Addressn line is required" }),
  city: z.string().min(1, { message: "City is required" }),
  district_id: z.number().min(1, { message: "District is required" }),
  state_id: z.number().min(1, { message: "State is required" }),
  pincode: z.string().min(1, { message: "Pincode is required" }),
  phone: z.string().min(1, { message: "Phone Number is required" }),
});

export type AddressFormInput = z.input<typeof addresSchema>;
export type AddressFormOutput = z.output<typeof addresSchema>;
