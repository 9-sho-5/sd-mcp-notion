import express from "express";
import { notionRouter } from "./routes/notion.routes";
import { errorHandler } from "./middlewares/error";

export const createApp = () => {
  const app = express();
  app.use(express.json());
  app.use("/notion", notionRouter);
  app.get("/healthz", (_req, res) => res.json({ ok: true }));
  app.use(errorHandler);
  return app;
};
