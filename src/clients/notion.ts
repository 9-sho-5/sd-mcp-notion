import { Client } from "@notionhq/client";
import { ENV } from "../config/env";

export const notion = new Client({ auth: ENV.NOTION_TOKEN });
