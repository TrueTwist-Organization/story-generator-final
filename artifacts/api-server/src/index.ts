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
if (!process.env.OPENAI_API_KEY) {
  console.warn("⚠️  WARNING: No OpenAI API Key found. Story/Image/Sound will use free fallbacks (Pollinations/Browser).");
} else {
  console.log("✅ OpenAI API Key detected. It will power Stories, DALL-E 3 Images, and OpenAI TTS Narration.");
}

if (!process.env.ELEVENLABS_API_KEY) {
  console.info("ℹ️  No ElevenLabs Key. Using OpenAI TTS/Browser fallback for sound.");
}
if (!process.env.REPLICATE_API_TOKEN) {
  console.info("ℹ️  No Replicate Token. Using DALL-E 3/Pollinations fallback for images.");
}

const PORT = process.env.PORT || 3000;
const port = Number(PORT) || 3000;

app.listen(port, () => {
  console.log(`Server listening on port ${port}`);
});
