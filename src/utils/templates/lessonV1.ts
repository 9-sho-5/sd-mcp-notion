import type { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";
import { formatCssForNotion, formatHtmlForNotion } from "../codeFormat";

// プレーンテキスト RichText
const rt = (
  text: string
): {
  type: "text";
  text: { content: string };
  annotations?: Partial<{
    bold: boolean;
    code: boolean;
    italic: boolean;
    underline: boolean;
    strikethrough: boolean;
  }>;
} => ({ type: "text", text: { content: text } });

// 注釈付き RichText
const rta = (
  text: string,
  annotations: NonNullable<ReturnType<typeof rt>["annotations"]>
): ReturnType<typeof rt> => ({ ...rt(text), annotations });

/**
 * レッスン用テンプレート
 * @param sampleTitle 見出しなどに使うサンプルタイトル
 * @param htmlSnippet HTMLコードブロックの中身（省略可）
 * @param cssSnippet  CSSコードブロックの中身（省略可）
 */
export async function buildLessonTemplate(
  sampleTitle: string,
  htmlSnippet?: string,
  cssSnippet?: string
): Promise<BlockObjectRequest[]> {
  const calloutTitle = `${sampleTitle}を作ってみよう！`;

  const htmlRaw =
    htmlSnippet ??
    `<body>
  <!-- ここから -->
  <!-- ここまで -->`;

  const cssRaw = cssSnippet ?? `/* ここにコードを追加する */`;

  // ★ ここで整形（末尾改行は落ちる）
  const [htmlCode, cssCode] = await Promise.all([
    formatHtmlForNotion(htmlRaw),
    formatCssForNotion(cssRaw),
  ]);

  return [
    // ℹ️ Callout
    {
      type: "callout",
      callout: {
        rich_text: [
          rta(`${sampleTitle}`, { bold: true }),
          rta("を作ってみよう！", { bold: true }),
          rt("\n"),
          rt("この教科書では、下図のようなアニメーションを作成していきます！"),
        ],
        icon: { type: "emoji", emoji: "ℹ️" },
        color: "gray_background",
      },
    },

    // 見出し: ステップ1
    {
      type: "heading_2",
      heading_2: {
        rich_text: [rt("ステップ１：HTMLを修正しよう")],
        color: "orange_background",
      },
    },
    {
      type: "paragraph",
      paragraph: {
        rich_text: [
          rta("index.html", { code: true }),
          rt("に下記のコード（ここから〜ここまで）を"),
          rta("body の開始タグ", { code: true }),
          rt("直後に追記してみましょう！"),
        ],
      },
    },
    {
      type: "code",
      code: {
        language: "html",
        rich_text: [rt(htmlCode)],
      },
    },

    // 見出し: ステップ2
    {
      type: "heading_2",
      heading_2: {
        rich_text: [rt("ステップ２：アニメーション用のCSSを追記しよう")],
        color: "orange_background",
      },
    },
    {
      type: "paragraph",
      paragraph: {
        rich_text: [
          rt("次に、すでにある"),
          rta("style.css", { code: true }),
          rt("に下記のコードを追記してみましょう！"),
        ],
      },
    },
    {
      type: "code",
      code: {
        language: "css",
        rich_text: [rt(cssCode)],
      },
    },

    // 見出し: ステップ3
    {
      type: "heading_2",
      heading_2: {
        rich_text: [rt("ステップ3：Go Liveして確認してみよう！")],
        color: "orange_background",
      },
    },
    {
      type: "paragraph",
      paragraph: {
        rich_text: [
          rt(
            "画面右下のGo Liveをクリックして、Google Chromeでプレビューを確認しよう！"
          ),
        ],
      },
    },
    {
      type: "image",
      image: {
        type: "external",
        external: {
          url: "https://file.notion.so/f/f/0eff1b3b-6ee2-4c5f-a682-d9f640543bdd/c55e692f-9af9-4e17-a26e-7807cae108ee/GoLive.png?table=block&id=26e703cc-6557-81dc-a4ff-f6e033fa18b4&spaceId=0eff1b3b-6ee2-4c5f-a682-d9f640543bdd&expirationTimestamp=1757980800000&signature=N2134o1M41WfCq8AeDjQ49YjFitNvToKAXAfZywmHMo&downloadName=GoLive.png",
        },
        caption: [{ type: "text", text: { content: "GoLiveの場所" } }],
      },
    },

    // 見出し: 完成
    {
      type: "heading_2",
      heading_2: {
        rich_text: [rt("完成！")],
        color: "orange_background",
      },
    },
    {
      type: "paragraph",
      paragraph: {
        rich_text: [rt("こんな感じで表示されたら完成だよ！")],
      },
    },
  ];
}
