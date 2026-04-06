// Use global fetch
const XAI_API_KEY = process.env.XAI_API_KEY;
const XAI_BASE_URL = "https://api.x.ai/v1";

export async function generateStoryWithGrok(prompt: string, category: string, language: string = 'english', mode: string = 'image') {
  if (!XAI_API_KEY || XAI_API_KEY === "YOUR_XAI_KEY") throw new Error("XAI_API_KEY is not defined");

  const langMap: Record<string, string> = {
    english: "English",
    hindi: "Hindi (Devanagari script)",
    gujarati: "Gujarati (Gujarati script)"
  };

  const systemPrompt = `You are a professional children's storyteller. 
Create a story with 3 scenes. Each scene needs a title, text, and an imagePrompt.
You MUST write the story title, scene titles, and story text in ${langMap[language] || 'English'}.
The 'imagePrompt' MUST be in English.
${mode === 'game' ? "Since mode is 'game', you MUST provide exactly 5 quiz questions based on the story in a 'quizQuestions' array. Each has 'question' (string), 'options' (string array of 4), 'correctIndex' (number 0-3), and 'explanation' (string)." : ""}
Format as JSON: { "title": "...", "scenes": [{ "sceneNumber": 1, "title": "...", "text": "...", "imagePrompt": "..." }], "quizQuestions": [] }
IMPORTANT: Meta-information provided in the prompt is only for context—DO NOT include this info in the story title or text. Start the story immediately.`;

  const response = await fetch(`${XAI_BASE_URL}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${XAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "grok-beta",
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: `Category: ${category}. Topic: ${prompt}. Mode: ${mode}. Language: ${language}.` }
      ],
      response_format: { type: "json_object" }
    })
  });

  const data = (await response.json()) as any;
  if (data.error) throw new Error(data.error.message);
  
  return JSON.parse(data.choices[0].message.content);
}

export async function generateGrokImage(prompt: string) {
  if (!XAI_API_KEY) throw new Error("XAI_API_KEY is not defined");

  const response = await fetch(`${XAI_BASE_URL}/images/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${XAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "grok-imagine-image",
      prompt: prompt,
      n: 1,
      size: "1024x1024",
      response_format: "b64_json"
    })
  });

  const data = (await response.json()) as any;
  if (data.error) throw new Error(data.error.message);
  
  return data.data[0].b64_json;
}

export async function generateGrokVideo(prompt: string) {
  if (!XAI_API_KEY) throw new Error("XAI_API_KEY is not defined");

  const response = await fetch(`${XAI_BASE_URL}/videos/generations`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${XAI_API_KEY}`
    },
    body: JSON.stringify({
      model: "grok-imagine-video",
      prompt: prompt
    })
  });

  const data = (await response.json()) as any;
  if (data.error) throw new Error(data.error.message);
  
  return data.video_url || data.id; // Many video APIs return a task ID first
}
