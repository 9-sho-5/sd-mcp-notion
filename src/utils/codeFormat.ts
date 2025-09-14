// src/utils/codeFormat.ts
let prettier: typeof import("prettier") | null = null;

async function getPrettier() {
  if (prettier) return prettier;
  try {
    // dev 依存でもOK。無ければフォールバックに回る
    prettier = await import("prettier");
  } catch {
    prettier = null;
  }
  return prettier;
}

// ; の後に必ず改行を入れる、末尾改行は落とす等の軽整形
export function lightFormatCss(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/;\s*(?!\n)/g, ";\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n+$/g, "");
}

export function lightFormatHtml(raw: string): string {
  return raw
    .replace(/\r\n?/g, "\n")
    .replace(/[ \t]+$/gm, "")
    .replace(/\n+$/g, "");
}

type CommonOpts = {
  printWidth?: number;
  tabWidth?: number;
};

export async function formatCssForNotion(
  css: string,
  opts: CommonOpts = {}
): Promise<string> {
  const p = await getPrettier();
  if (p) {
    try {
      const formatted = await p.format(css, {
        parser: "css",
        printWidth: opts.printWidth ?? 80,
        tabWidth: opts.tabWidth ?? 2,
      });
      // Prettier は末尾に改行を付けるので落とす
      return formatted.replace(/\n+$/g, "");
    } catch {
      // パース失敗時は軽整形
    }
  }
  return lightFormatCss(css);
}

export async function formatHtmlForNotion(
  html: string,
  opts: CommonOpts = {}
): Promise<string> {
  const p = await getPrettier();
  if (p) {
    try {
      const formatted = await p.format(html, {
        parser: "html",
        printWidth: opts.printWidth ?? 80,
        tabWidth: opts.tabWidth ?? 2,
      });
      return formatted.replace(/\n+$/g, "");
    } catch {
      // パース失敗時は軽整形
    }
  }
  return lightFormatHtml(html);
}
