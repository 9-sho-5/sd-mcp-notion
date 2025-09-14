// src/utils/templates/lessonV1.ts
import type { BlockObjectRequest } from "@notionhq/client/build/src/api-endpoints";
import { blob } from "stream/consumers";

// Notionのリッチテキストを手軽に作る小ヘルパ
const rt = (text: string): { type: "text"; text: { content: string } } => ({
  type: "text",
  text: { content: text },
});

export function buildLessonTemplate(sampleTitle: string): BlockObjectRequest[] {
  const titleInCallout = `${sampleTitle}を作ってみよう！`;

  return [
    // ℹ️ Callout
    {
      type: "callout",
      callout: {
        rich_text: [
          {
            type: "text",
            text: { content: `[${sampleTitle}]` },
            annotations: { bold: true },
          },
          {
            type: "text",
            text: { content: "を作ってみよう！" },
            annotations: { bold: true },
          },
          {
            type: "text",
            text: { content: "\n" },
          },
          {
            type: "text",
            text: { content: "この教科書では、" },
          },
          {
            type: "text",
            text: { content: `[${sampleTitle}]` },
          },
          {
            type: "text",
            text: { content: "を作成していきます！" },
          },
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
          {
            type: "text",
            text: { content: "index.html" },
            annotations: { code: true },
          },
          rt("に下記のコード（ここから〜ここまで）を"),
          {
            type: "text",
            text: { content: "body の開始タグ" },
            annotations: { code: true },
          },
          rt("直後に追記してみましょう！"),
        ],
      },
    },
    {
      type: "code",
      code: {
        language: "html",
        rich_text: [rt(`<body>\n  <!-- ここから -->\n  \n  <!-- ここまで -->`)],
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
          {
            type: "text",
            text: { content: "style.css" },
            annotations: { code: true },
          },
          rt("に下記のコードを追記してみましょう！"),
        ],
      },
    },
    {
      type: "code",
      code: {
        language: "css",
        rich_text: [rt(`/* ここにコードを追加する */`)],
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
