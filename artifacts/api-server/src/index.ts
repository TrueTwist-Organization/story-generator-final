import path from "path";
import { fileURLToPath } from "url";
import { config } from "dotenv";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
// Go up from src -> api-server -> artifacts -> root
const rootEnv = path.resolve(__dirname, "..", "..", "..", ".env");
config({ path: rootEnv });
config(); // Load local .env as fallback

import app from "./app";
import { openai } from "@workspace/integrations-openai-ai-server";

// Heartbeat check for diagnostic clarity
if (!process.env.OPENAI_API_KEY && !process.env.AI_INTEGRATIONS_OPENAI_API_KEY) {
  console.warn("⚠️  WARNING: No OpenAI API Key found in environment variables. Stories will use locally-stored demo fallbacks.");
}

const PORT = process.env.PORT || 3000;
const port = Number(PORT) || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
