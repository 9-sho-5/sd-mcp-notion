import { ENV } from "../config/env";
import type {
  CreatePageParameters,
  UpdatePageParameters,
} from "@notionhq/client/build/src/api-endpoints";

type CreateProps = CreatePageParameters["properties"];
type UpdateProps = UpdatePageParameters["properties"];

export function buildTitleProperty(title: string): CreateProps {
  const obj = {
    [ENV.NOTION_TITLE_PROP]: {
      // "as const" で十分に型が絞れるので RichTextItemRequest は不要
      title: [{ type: "text", text: { content: title } as const }],
    },
  } satisfies CreateProps;
  return obj;
}

export function buildSlugProperty(slug?: string): CreateProps {
  if (!slug) return {} as CreateProps;
  const obj = {
    [ENV.NOTION_SLUG_PROP]: {
      rich_text: [{ type: "text", text: { content: slug } as const }],
    },
  } satisfies CreateProps;
  return obj;
}
