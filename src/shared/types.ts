import z from "zod";

export const PaletteSchema = z.object({
  id: z.number(),
  name: z.string().nullable(),
  colors: z.string(),
  style: z.string().nullable(),
  source: z.string().nullable(),
  user_id: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type PaletteType = z.infer<typeof PaletteSchema>;

export const ColorEquivalencySchema = z.object({
  id: z.number(),
  brand: z.string(),
  code: z.string(),
  name: z.string(),
  hex: z.string(),
  set_name: z.string().nullable(),
  created_at: z.string(),
  updated_at: z.string(),
});

export type ColorEquivalencyType = z.infer<typeof ColorEquivalencySchema>;

export const GeneratePaletteRequestSchema = z.object({
  colorCount: z.number().int().min(3).max(12),
  style: z.enum(['pastel', 'warm', 'cold', 'summer', 'autumn', 'vibrant', 'neutral', 'nature']),
  set: z.enum(['honolulu', 'honolulu_plus', 'skin_tones', 'pastel_set', 'brush_set']).optional(),
});

export type GeneratePaletteRequest = z.infer<typeof GeneratePaletteRequestSchema>;

export const ColorFromImageRequestSchema = z.object({
  colorCount: z.number().int().min(3).max(12).default(5),
});

export type ColorFromImageRequest = z.infer<typeof ColorFromImageRequestSchema>;

export const FindEquivalencyRequestSchema = z.object({
  code: z.string(),
  brand: z.string(),
});

export type FindEquivalencyRequest = z.infer<typeof FindEquivalencyRequestSchema>;
