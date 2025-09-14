import type { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";
import { Request, Response } from "express";
import { createOrUpdateSchema } from "../schemas/notion.schema";
import { upsertPage } from "../services/notion.service";

// ゆるい型ガード（最低限：オブジェクトで "type" を持っている）
function isBlockObjectRequest(x: unknown): x is BlockObjectRequest {
  return !!x && typeof x === "object" && "type" in (x as any);
}

export async function createOrUpdatePage(req: Request, res: Response) {
  const parsed = createOrUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    return res.status(400).json({ error: "invalid body" });
  }

  try {
    const { children, ...rest } = parsed.data;

    const safeChildren = Array.isArray(children)
      ? (children.filter(isBlockObjectRequest) as BlockObjectRequest[])
      : undefined;

    const result = await upsertPage({
      ...rest,
      children: safeChildren, // ← ここで BlockObjectRequest[] に揃えて渡す
    });

    return res.json(result);
  } catch (err: any) {
    console.error("[/notion/pages] error:", {
      message: err?.message,
      code: err?.code,
    });
    return res
      .status(500)
      .json({ error: "failed to create or update page", detail: err?.message });
  }
}
