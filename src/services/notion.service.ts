// src/services/notion.service.ts
import type { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";
import { notion } from "../clients/notion";
import { ENV } from "../config/env";
import { compact } from "../utils/compact";
import {
  buildSlugProperty,
  buildTitleProperty,
} from "../utils/buildProperties";
import { buildLessonTemplate } from "../utils/templates/lessonV1";

type CreatePageArgs = Parameters<typeof notion.pages.create>[0];
type UpdatePageArgs = Parameters<typeof notion.pages.update>[0];
type QueryArgs = Parameters<typeof notion.databases.query>[0];

type CreateProps = CreatePageArgs["properties"];
type UpdateProps = UpdatePageArgs["properties"];
type CreateValue = NonNullable<CreateProps[string]>;

// Notion形式の値かざっくり判定
function isCreateValue(v: any): v is CreateValue {
  return (
    v &&
    typeof v === "object" &&
    ("title" in v ||
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
      "relation" in v)
  );
}

// Record<string, unknown> でも受けて CreateProps に正規化
function normalizeToCreateProps(
  input?: Record<string, unknown> | CreateProps
): CreateProps {
  const out: CreateProps = {};
  if (!input) return out;
  for (const key of Object.keys(input)) {
    const v = (input as Record<string, unknown>)[key];
    if (v == null) continue;

    if (isCreateValue(v)) {
      out[key] = v;
      continue;
    }

    // 原始値の簡易マッピング（必要に応じて拡張）
    if (typeof v === "boolean") out[key] = { checkbox: v };
    else if (typeof v === "number") out[key] = { number: v };
    else if (v instanceof Date) out[key] = { date: { start: v.toISOString() } };
    else if (typeof v === "string") {
      const k = key.toLowerCase();
      if (k.includes("title"))
        out[key] = { title: [{ type: "text", text: { content: v } }] };
      else if (k.includes("url")) out[key] = { url: v };
      else out[key] = { rich_text: [{ type: "text", text: { content: v } }] };
    }
  }
  return out;
}

export async function findPageBySlug(
  databaseId: string,
  slugProp: string,
  slug: string
) {
  const resp = await notion.databases.query({
    database_id: databaseId,
    filter: { property: slugProp, rich_text: { equals: slug } },
    page_size: 1,
  } as QueryArgs);
  return resp.results[0] ?? null;
}

export async function upsertPage(input: {
  databaseId?: string;
  title: string;
  slug?: string;
  // 👇 コントローラに合わせて緩める（Record でも CreateProps でもOK）
  properties?: Record<string, unknown> | CreateProps;
  children?: BlockObjectRequest[];
  template?: "lesson-v1";
  templateVars?: { sampleTitle?: string };
}) {
  const databaseId = input.databaseId ?? ENV.NOTION_DATABASE_ID;

  const baseProps = buildTitleProperty(input.title);
  const slugProps = buildSlugProperty(input.slug);
  const extraProps = normalizeToCreateProps(input.properties);

  const createProps = compact({
    ...baseProps,
    ...slugProps,
    ...extraProps,
  });

  // children が未指定でテンプレ指定がある場合に生成
  let children: BlockObjectRequest[] | undefined =
    Array.isArray(input.children) && input.children.length > 0
      ? input.children
      : undefined;

  if (!children && input.template === "lesson-v1") {
    const sampleTitle = input.templateVars?.sampleTitle ?? input.title;
    children = buildLessonTemplate(sampleTitle);
  }

  if (input.slug) {
    const existing = await findPageBySlug(
      databaseId,
      ENV.NOTION_SLUG_PROP,
      input.slug
    );
    if (existing) {
      const updated = await notion.pages.update({
        page_id: (existing as any).id,
        properties: createProps as unknown as UpdateProps,
      } as UpdatePageArgs);

      if (children) {
        await notion.blocks.children.append({
          block_id: (existing as any).id,
          children,
        });
      }
      return { mode: "update", page: updated };
    }
  }

  const created = await notion.pages.create({
    parent: { database_id: databaseId },
    properties: createProps,
    ...(children ? { children } : {}),
  } as CreatePageArgs);

  return { mode: "create", page: created };
}
