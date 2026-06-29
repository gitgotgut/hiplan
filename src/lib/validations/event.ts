import { z } from "zod";

const optionalText = (max: number) =>
  z
    .string()
    .trim()
    .max(max)
    .optional()
    .or(z.literal(""))
    .transform((v) => (v ? v : undefined));

export const eventCreateSchema = z
  .object({
    title: z.string().trim().min(1, "Title is required").max(120),
    description: optionalText(2000),
    location: optionalText(200),
    startsAt: z.coerce.date({ invalid_type_error: "Start date is required" }),
    endsAt: z.coerce.date().optional(),
    capacity: z.coerce.number().int().positive().max(100000).optional(),
    visibility: z.enum(["OPEN", "INVITE_ONLY"]).default("INVITE_ONLY"),
  })
  .refine((d) => !d.endsAt || d.endsAt >= d.startsAt, {
    message: "End time must be after the start time",
    path: ["endsAt"],
  });

export const eventUpdateSchema = z
  .object({
    title: z.string().trim().min(1).max(120).optional(),
    description: optionalText(2000),
    location: optionalText(200),
    startsAt: z.coerce.date().optional(),
    endsAt: z.coerce.date().nullable().optional(),
    capacity: z.coerce.number().int().positive().max(100000).nullable().optional(),
    visibility: z.enum(["OPEN", "INVITE_ONLY"]).optional(),
  })
  .refine(
    (d) => Object.values(d).some((v) => v !== undefined),
    { message: "At least one field is required" }
  );

export const rsvpSchema = z.object({
  status: z.enum(["GOING", "MAYBE", "NOT_GOING"]),
  guests: z.coerce.number().int().min(0).max(20).default(0),
  message: optionalText(500),
});

export type EventCreateInput = z.infer<typeof eventCreateSchema>;
export type RsvpInput = z.infer<typeof rsvpSchema>;
