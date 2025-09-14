import { createApp } from "./app";
import { ENV } from "./config/env";

const app = createApp();
app.listen(ENV.PORT, () => {
  console.log(`MCP server running on http://localhost:${ENV.PORT}`);
});
