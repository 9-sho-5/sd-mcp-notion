import type { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";
import type { Request, Response } from "express";
// ESM(NodeNext)なら .js を付ける。CJSなら拡張子なしでOK
import { createOrUpdateSchema } from "../schemas/notion.schema.js";
import { upsertPage } from "../services/notion.service.js";

// もう少し厳しめの型ガード：type が文字列で、同名キーが存在する（NotionのBlockは必ず一致するキーを持つ）
function isBlockObjectRequest(x: unknown): x is BlockObjectRequest {
  if (!x || typeof x !== "object") return false;
  const t = (x as any).type;
  return typeof t === "string" && t in (x as any);
}

export async function createOrUpdatePage(req: Request, res: Response) {
  const parsed = createOrUpdateSchema.safeParse(req.body);
  if (!parsed.success) {
    // 何がダメか返すとデバッグしやすい
    return res
      .status(400)
      .json({ error: "invalid body", issues: parsed.error.flatten() });
  }

  try {
    const { children, ...rest } = parsed.data;

    const filtered = Array.isArray(children)
      ? children.filter(isBlockObjectRequest)
      : undefined;

    // 空配列は Notion に渡さない（undefined にする）
    const safeChildren =
      filtered && filtered.length
        ? (filtered as BlockObjectRequest[])
        : undefined;

    const result = await upsertPage({
      ...rest, // ← template / templateVars もそのまま通る
      children: safeChildren,
    });

    // ついでに無効 child を落とした数を軽く知らせる（任意）
    const dropped = Array.isArray(children)
      ? children.length - (filtered?.length ?? 0)
      : 0;
    return res.json(
      dropped > 0
        ? { ...result, warnings: [`ignored ${dropped} invalid children`] }
        : result
    );
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
