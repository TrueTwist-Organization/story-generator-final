import OpenAI from "openai";

const apiKey = process.env.AI_INTEGRATIONS_OPENAI_API_KEY || process.env.OPENAI_API_KEY || "not-set";
const baseURL = process.env.AI_INTEGRATIONS_OPENAI_BASE_URL || process.env.OPENAI_BASE_URL || "https://api.openai.com/v1";

if (apiKey === "not-set") {
  console.warn("⚠️  AI_INTEGRATIONS_OPENAI_API_KEY is not set. All AI operations will fail unless a mock fallback is used.");
}

export const openai = new OpenAI({
  apiKey,
  baseURL,
});

