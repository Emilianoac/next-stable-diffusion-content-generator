import {z} from "zod"

// Schema for the image parameters
const ImageParamsSchema = z.object({
  steps: z
    .number()
    .max(20, "The maximum number of steps is 20"),
  seed: z.number(),
  cfg_scale: z
    .number()
    .max(35, "The maximum value for cfg_scale is 35"),
  prompt: z
    .string()
    .refine((val) => val.trim().length > 0, { message: "Prompt cannot be empty"}),
  negative_prompt: z
    .string()
    .optional(),
  style_preset: z.string()
})

export {ImageParamsSchema}