#!/usr/bin/env -S tsx
/**
 * サンプルページ作成スクリプト（タイトルは JSON から取得）
 *
 * 例:
 *   pnpm run sample:create-page -- --json config/templates/hover-sweep.json
 *   pnpm run sample:create-page -- --json config/templates/hover-glow.json --slug sweep-1
 *   pnpm run sample:create-page -- --json config/templates/hover-glow.json --level 初級 --tags "CSS,Hover"
 *
 * 環境変数:
 *   BASE_URL: 例) http://localhost:3000（既定 http://localhost:3000）
 */

import { parseArgs } from "node:util";
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

type Payload = {
  title: string;
  slug?: string;
  properties?: Record<string, unknown>;
  htmlCode: string;
  cssCode: string;
  template?: "lesson-v1";
  templateVars?: { sampleTitle?: string; htmlCode?: string; cssCode?: string };
};

type TemplateCfg = {
  title?: string;
  htmlCode?: string;
  cssCode?: string;
  tags?: string[];
  level?: "初級" | "中級" | "上級";
};
const BASE_URL = process.env.BASE_URL ?? "http://localhost:3000";
const ENDPOINT = `${BASE_URL.replace(/\/$/, "")}/notion/pages`;

function usageAndExit(code = 0): never {
  console.error(
    `Usage:
  pnpm run sample:create-page -- --json <path> [--slug <value>] [--level <名前>] [--tags "a,b,c"] [--thumb <URL>]

Examples:
  pnpm run sample:create-page -- --json config/templates/hover-sweep.json
  pnpm run sample:create-page -- --json config/templates/hover-glow.json --slug glow-1`
  );
  process.exit(code);
}

async function loadJsonTemplate(p: string): Promise<TemplateCfg> {
  const abs = resolve(process.cwd(), p);
  const raw = await readFile(abs, "utf8");
  return JSON.parse(raw);
}

const { values, positionals } = parseArgs({
  args: process.argv.slice(2),
  allowPositionals: false, // ← 位置引数は受けない（タイトルも受けない）
  options: {
    json: { type: "string" },
    slug: { type: "string" },
    level: { type: "string" },
    tags: { type: "string" },
    thumb: { type: "string" },
    html: { type: "string" }, // 任意上書き
    css: { type: "string" }, // 任意上書き
    help: { type: "boolean", short: "h" },
  },
});

if (values.help) usageAndExit(0);
if (!values.json) {
  console.error(
    "Error: --json <path> を指定してください。タイトルは JSON から取得します。"
  );
  usageAndExit(1);
}
if (positionals.length > 0) {
  console.error(
    "Error: 位置引数は使用しません。タイトルは JSON の title を使います。"
  );
  usageAndExit(1);
}

const jsonPath = values.json;
const cfg = await loadJsonTemplate(jsonPath).catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});

const title = (cfg.title ?? "").trim();
if (!title) {
  console.error(`Error: JSON(${jsonPath}) に "title" がありません。`);
  process.exit(1);
}

const htmlCode =
  typeof values.html === "string"
    ? values.html
    : (cfg.htmlCode ?? "<body>\n  <!-- ここから -->\n\n  <!-- ここまで -->");

const cssCode =
  typeof values.css === "string"
    ? values.css
    : (cfg.cssCode ?? "/* ここにコードを追加する */");

// DB プロパティ（任意）
const props: Record<string, unknown> = {};

const levelName = values.level ?? cfg.level;
if (levelName) {
  props["レベル"] = { select: { name: levelName } };
}

const tagNamesFromCli = values.tags
  ? values.tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : null;

const tagNames = tagNamesFromCli ?? cfg.tags ?? [];
if (tagNames.length) {
  props["タグ"] = { multi_select: tagNames.map((name) => ({ name })) };
}
if (values.thumb) {
  props["サムネイル"] = {
    files: [
      { type: "external", name: "thumb", external: { url: values.thumb } },
    ],
  };
}

// リクエスト body（ページタイトルは JSON の title）
const payload: Payload = {
  title,
  htmlCode,
  cssCode,
  ...(values.slug ? { slug: values.slug } : {}),
  ...(Object.keys(props).length ? { properties: props } : {}),
  template: "lesson-v1",
  templateVars: {
    sampleTitle: title, // 本文の見出しも JSON の title を使用
    htmlCode,
    cssCode,
  },
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

console.log("PAYLOAD:", JSON.stringify(payload, null, 2));
