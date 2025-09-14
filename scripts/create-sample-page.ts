#!/usr/bin/env -S tsx
/**
 * サンプルページ作成スクリプト（タイトルは各 JSON から取得、複数ファイル対応）
 *
 * 例:
 *   pnpm run sample:create-page -- --json config/templates/hover-sweep.json
 *   pnpm run sample:create-page -- --json config/templates/hover-glow.json --json config/templates/uline.json
 *   pnpm run sample:create-page -- --json a.json --json b.json --level 中級 --tags "CSS,ホバー"
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
  pnpm run sample:create-page -- --json <path> [--json <path> ...]
                               [--slug <value>] [--level <名前>] [--tags "a,b,c"] [--thumb <URL>]

Examples:
  pnpm run sample:create-page -- --json config/templates/hover-sweep.json
  pnpm run sample:create-page -- --json config/templates/hover-glow.json --json config/templates/uline.json
  pnpm run sample:create-page -- --json a.json --json b.json --level 中級 --tags "CSS,ホバー"`
  );
  process.exit(code);
}

async function loadJsonTemplate(p: string): Promise<TemplateCfg> {
  const abs = resolve(process.cwd(), p);
  const raw = await readFile(abs, "utf8");
  return JSON.parse(raw);
}

// 先頭の "--" を吸収してから parse（どちらの呼び方でも動く）
const raw = process.argv.slice(2);
const args = raw[0] === "--" ? raw.slice(1) : raw;

const { values } = parseArgs({
  args,
  allowPositionals: false, // タイトル等は位置引数で受けない
  options: {
    json: { type: "string", multiple: true }, // ★ 複数 OK
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
const jsonPaths = (values.json ?? []) as string[];
if (jsonPaths.length === 0) {
  console.error(
    "Error: --json <path> を1つ以上指定してください。タイトルは各JSONから取得します。"
  );
  usageAndExit(1);
}

// CLI の一括オプション（各JSONに対して “なければ使う” で適用）
const cliLevel = values.level;
const cliTags = values.tags
  ? values.tags
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean)
  : undefined;
const cliThumb = values.thumb;
const overrideHtml = values.html;
const overrideCss = values.css;
const slugForAll = values.slug; // ※複数ページに同じ slug を付けると衝突するので注意

// 順次作成（Notion API の負荷を避けるため直列）
const results: Array<{
  path: string;
  ok: boolean;
  id?: string;
  error?: unknown;
}> = [];

for (const jsonPath of jsonPaths) {
  try {
    const cfg = await loadJsonTemplate(jsonPath);

    const title = (cfg.title ?? "").trim();
    if (!title) {
      throw new Error(`JSON(${jsonPath}) に "title" がありません。`);
    }

    const htmlCode =
      typeof overrideHtml === "string"
        ? overrideHtml
        : (cfg.htmlCode ??
          "<body>\n  <!-- ここから -->\n\n  <!-- ここまで -->");

    const cssCode =
      typeof overrideCss === "string"
        ? overrideCss
        : (cfg.cssCode ?? "/* ここにコードを追加する */");

    // Notion プロパティ
    const props: Record<string, unknown> = {};
    const levelName = (cliLevel ?? cfg.level)?.trim();
    if (levelName) props["レベル"] = { select: { name: levelName } };

    const tagNames = (cliTags ?? cfg.tags ?? []).filter(Boolean);
    if (tagNames.length) {
      props["タグ"] = { multi_select: tagNames.map((name) => ({ name })) };
    }
    if (cliThumb) {
      props["サムネイル"] = {
        files: [
          { type: "external", name: "thumb", external: { url: cliThumb } },
        ],
      };
    }

    const payload: Payload = {
      title,
      htmlCode,
      cssCode,
      ...(slugForAll ? { slug: slugForAll } : {}), // 複数の場合は注意
      ...(Object.keys(props).length ? { properties: props } : {}),
      template: "lesson-v1",
      templateVars: {
        sampleTitle: title,
        htmlCode,
        cssCode,
      },
    };

    // 送信
    const res = await fetch(ENDPOINT, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    const text = await res.text();
    try {
      const json = JSON.parse(text);
      if (!res.ok) {
        console.error(`[FAIL] ${jsonPath}`);
        console.error(JSON.stringify(json, null, 2));
        results.push({ path: jsonPath, ok: false, error: json });
      } else {
        console.log(
          `[OK] ${jsonPath} → pageId: ${json?.page?.id ?? json?.id ?? "unknown"}`
        );
        results.push({
          path: jsonPath,
          ok: true,
          id: json?.page?.id ?? json?.id,
        });
      }
    } catch {
      // 非JSONレスポンス
      if (!res.ok) {
        console.error(`[FAIL] ${jsonPath}`);
        console.error(text);
        results.push({ path: jsonPath, ok: false, error: text });
      } else {
        console.log(`[OK] ${jsonPath}`);
        results.push({ path: jsonPath, ok: true });
      }
    }
  } catch (e) {
    console.error(`[ERROR] ${jsonPath}`);
    console.error(e);
    results.push({ path: jsonPath, ok: false, error: e });
  }
}

// 最後にサマリ
const ok = results.filter((r) => r.ok).length;
const ng = results.length - ok;
console.log(`\nDone. success=${ok}, failed=${ng}`);
