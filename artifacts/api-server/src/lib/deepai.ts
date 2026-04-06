// Use global fetch (Node.js 18+)

export async function generateDeepAIImage(prompt: string): Promise<string> {
  const apiKey = process.env.DEEPAI_API_KEY;
  if (!apiKey || apiKey === "YOUR_DEEPAI_KEY") {
    throw new Error("DeepAI API Key not set");
  }

  const response = await fetch("https://api.deepai.org/api/text2img", {
    method: "POST",
    headers: {
      "api-key": apiKey
    },
    body: new URLSearchParams({
      "text": prompt,
    })
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`DeepAI failed: ${error}`);
  }

  const data: any = await response.json();
  if (data.output_url) {
    // We need to download and convert to base64 if we want consistent base64 responses
    // Or we can just return the URL. But for consistency with the app, base64 is better.
    const imgRes = await fetch(data.output_url);
    const buffer = await imgRes.arrayBuffer();
    return Buffer.from(buffer).toString("base64");
  }

  throw new Error("No output_url found in DeepAI response");
}
