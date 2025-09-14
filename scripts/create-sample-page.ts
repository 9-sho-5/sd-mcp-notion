#!/usr/bin/env -S tsx
/**
 * サンプルページ作成スクリプト（parseArgs 版）
 *
 * 使い方:
 *   pnpm run sample:create-page -- "サンプル教材A"
 *   pnpm run sample:create-page -- "サンプル教材B" lesson-b
 *   pnpm run sample:create-page -- "サンプル教材C" --slug lesson-c
 *   pnpm run sample:create-page -- "サンプル教材D" --level 初級 --tags "JavaScript,入門" --thumb "https://picsum.photos/seed/1/600/400"
 *
 * 位置引数:
 *   <title> [slug]       # slug は任意。--slug で上書き可
 *
 * オプション:
 *   --slug <value>       : slug を明示指定（DB に Slug 列がある場合のみ）
 *   --level <名前>       : 「レベル」(select)
 *   --tags "<a,b,c>"     : 「タグ」(multi_select)
 *   --thumb <URL>        : 「サムネイル」(files, external)
 *   -h, --help           : ヘルプ表示
 *
 * 環境変数:
 *   BASE_URL             : 例) http://localhost:3000（既定 http://localhost:3000）
 */

import { parseArgs } from "node:util";

type Payload = {
  title: string;
  slug?: string;
  properties?: Record<string, unknown>;
  template?: "lesson-v1";
  templateVars?: { sampleTitle?: string };
};

const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const ENDPOINT = `${BASE_URL.replace(/\/$/, "")}/notion/pages`;

function usageAndExit(code = 0): never {
  console.error(
    `Usage:
  pnpm run sample:create-page -- "<title>" [slug] [--slug <value>] [--level <名前>] [--tags "a,b,c"] [--thumb <URL>]

Examples:
  pnpm run sample:create-page -- "サンプル教材A"
  pnpm run sample:create-page -- "サンプル教材B" lesson-b
  pnpm run sample:create-page -- "サンプル教材C" --slug lesson-c
  pnpm run sample:create-page -- "サンプル教材D" --level 初級 --tags "JavaScript,入門" --thumb "https://picsum.photos/seed/1/600/400"`
  );
  process.exit(code);
}

// ---- 引数パース（-- は自動で処理される）----
const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: true,
  options: {
    slug: { type: "string" },
    level: { type: "string" },
    tags: { type: "string" },
    thumb: { type: "string" },
    help: { type: "boolean", short: "h" },
  },
});

if (values.help) usageAndExit(0);

const [posTitle, posSlug] = positionals;
if (!posTitle) usageAndExit(1);

const title: string = posTitle;
const slug: string | undefined = values.slug ?? posSlug;
const level = values.level;
const tagsCsv = values.tags;
const thumbUrl = values.thumb;

// ---- DBに存在するプロパティだけを組み立てる ----
const props: Record<string, unknown> = {};

if (level) {
  props["レベル"] = { select: { name: level } };
}
if (tagsCsv) {
  const items = tagsCsv
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (items.length)
    props["タグ"] = { multi_select: items.map((name) => ({ name })) };
}
if (thumbUrl) {
  props["サムネイル"] = {
    files: [{ type: "external", name: "thumb", external: { url: thumbUrl } }],
  };
}

// ---- リクエストペイロード（Slug 列が無ければ slug は送らない）----
const payload: Payload = {
  title,
  ...(slug ? { slug } : {}),
  ...(Object.keys(props).length ? { properties: props } : {}),
  template: "lesson-v1",
  templateVars: { sampleTitle: title },
};

async function main() {
  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  try {
    const json = JSON.parse(text);
    if (!res.ok) {
      console.error("Request failed:", JSON.stringify(json, null, 2));
      process.exit(1);
    }
    console.log(JSON.stringify(json, null, 2));
  } catch {
    console.log(text);
    if (!res.ok) process.exit(1);
  }
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
