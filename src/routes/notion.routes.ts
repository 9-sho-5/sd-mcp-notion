import { Router } from "express";
import { createOrUpdatePage } from "../controllers/notion.controller";

export const notionRouter = Router();
notionRouter.post("/pages", createOrUpdatePage);
