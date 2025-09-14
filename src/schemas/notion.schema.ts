import { z } from "zod";

export const createOrUpdateSchema = z.object({
  databaseId: z.string().optional(),
  title: z.string().min(1, "title is required"),
  slug: z.string().trim().optional(),
  properties: z.record(z.string(), z.unknown()).optional(),

  children: z.array(z.unknown()).optional(),

  // ★ 追加
  template: z.enum(["lesson-v1"]).optional(),
  templateVars: z
    .object({
      sampleTitle: z.string().optional(), // [ここに作例タイトル] の差し替え用
    })
    .optional(),
});

export type CreateOrUpdateInput = z.infer<typeof createOrUpdateSchema>;
