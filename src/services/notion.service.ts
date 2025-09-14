// ✅ ここは消す：import type { PropertyValueCreate } from "@notionhq/client/build/src/api-endpoints";
import type { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";
import { notion } from "../clients/notion";
import { ENV } from "../config/env";
import {
  buildSlugProperty,
  buildTitleProperty,
} from "../utils/buildProperties";

// 関数から型を抽出（SDK差異に強い）
type CreatePageArgs = Parameters<typeof notion.pages.create>[0];
type UpdatePageArgs = Parameters<typeof notion.pages.update>[0];
type QueryArgs = Parameters<typeof notion.databases.query>[0];

type CreateProps = CreatePageArgs["properties"];
type UpdateProps = UpdatePageArgs["properties"];
type CreateValue = NonNullable<CreateProps[string]>; // ← Value型はここから取得

// Duck-typing で「Notion形式の値か」を判定
function isCreateValue(v: any): v is CreateValue {
  if (!v || typeof v !== "object") return false;
  // Notionのプロパティ値の代表的なキー群（必要なら増やしてください）
  return !!(
    "title" in v ||
    "rich_text" in v ||
    "number" in v ||
    "checkbox" in v ||
    "url" in v ||
    "date" in v ||
    "select" in v ||
    "multi_select" in v ||
    "email" in v ||
    "phone_number" in v ||
    "people" in v ||
    "files" in v ||
    "status" in v ||
    "relation" in v
  );
}

// 原始値 or 既にNotion形式を CreateProps に正規化
function normalizeToCreateProps(
  input?: Record<string, unknown> | CreateProps
): CreateProps {
  const out: CreateProps = {};
  if (!input) return out;

  for (const key of Object.keys(input)) {
    const v = (input as Record<string, unknown>)[key];

    if (v == null) continue;

    if (isCreateValue(v)) {
      // 既にNotion形式
      out[key] = v;
      continue;
    }

    // 原始値を簡易マッピング（用途に合わせて調整可能）
    if (typeof v === "boolean") out[key] = { checkbox: v };
    else if (typeof v === "number") out[key] = { number: v };
    else if (v instanceof Date) out[key] = { date: { start: v.toISOString() } };
    else if (typeof v === "string") {
      if (key.toLowerCase().includes("title"))
        out[key] = { title: [{ type: "text", text: { content: v } }] };
      else if (key.toLowerCase().includes("url")) out[key] = { url: v };
      else out[key] = { rich_text: [{ type: "text", text: { content: v } }] };
    }
  }
  return out;
}

// 以降の upsert はそのまま（必要箇所だけ差し替え）
export async function upsertPage(input: {
  databaseId?: string;
  title: string;
  slug?: string;
  properties?: Record<string, unknown> | CreateProps; // ← コントローラの型に合わせて受ける
  children?: BlockObjectRequest[];
}) {
  const databaseId = input.databaseId ?? ENV.NOTION_DATABASE_ID;

  const baseProps = buildTitleProperty(input.title); // CreateProps
  const slugProps = buildSlugProperty(input.slug); // CreateProps
  const extraProps = normalizeToCreateProps(input.properties);

  const createProps = {
    ...baseProps,
    ...slugProps,
    ...extraProps,
  } as CreateProps;

  const children =
    Array.isArray(input.children) && input.children.length > 0
      ? (input.children as BlockObjectRequest[])
      : undefined;

  if (input.slug) {
    const existing = await notion.databases
      .query({
        database_id: databaseId,
        filter: {
          property: ENV.NOTION_SLUG_PROP,
          rich_text: { equals: input.slug },
        },
        page_size: 1,
      } as QueryArgs)
      .then((r) => r.results[0] ?? null);

    if (existing) {
      await notion.pages.update({
        page_id: (existing as any).id,
        properties: createProps as UpdateProps,
      } as UpdatePageArgs);

      if (children) {
        await notion.blocks.children.append({
          block_id: (existing as any).id,
          children,
        });
      }
      return { mode: "update", page: existing };
    }
  }

  const created = await notion.pages.create({
    parent: { database_id: databaseId },
    properties: createProps,
    ...(children ? { children } : {}),
  } as CreatePageArgs);

  return { mode: "create", page: created };
}
