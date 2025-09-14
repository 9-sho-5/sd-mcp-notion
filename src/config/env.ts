import "dotenv/config";

const required = (v: string | undefined, name: string) => {
  if (!v) throw new Error(`Missing ${name} in .env`);
  return v;
};

export const ENV = {
  PORT: Number(process.env.PORT ?? 3000),
  NOTION_TOKEN: required(process.env.NOTION_TOKEN, "NOTION_TOKEN"),
  NOTION_DATABASE_ID: required(
    process.env.NOTION_DATABASE_ID,
    "NOTION_DATABASE_ID"
  ),
  NOTION_TITLE_PROP: process.env.NOTION_TITLE_PROP ?? "Title",
} as const;
