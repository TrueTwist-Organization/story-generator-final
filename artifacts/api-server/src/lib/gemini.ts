import type { GenerateStoryBodyLanguage, GenerateStoryBodyMode } from "@workspace/api-zod";

export async function generateStoryWithGemini(prompt: string, category: string, language: string, mode: string, numScenes: number = 4) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not defined");

  const langMap: Record<string, string> = {
    english: "English",
    hindi: "Hindi (Devanagari script)",
    gujarati: "Gujarati (Gujarati script)"
  };

  const systemPrompt = `You are a master children's story teller and illustrator. 
 Write a story in ${langMap[language] || 'English'} with exactly ${numScenes} scenes. 
 Category: ${category}. Mode: ${mode}. 
 IMPORTANT: Meta-information (like "Instructions", "For age X", or child names) provided in the prompt is only for context—DO NOT include this info in the story title or text! Start the story immediately.
 For each scene, provide:
1. A catchy scene title.
2. A vivid story paragraph (3-5 sentences).
3. A detailed image generation prompt in English that describes the scene visually in Pixar/Disney style. IMPORTANT: Ensure visual consistency for the characters (same hair color, clothes, etc.) in every scene prompt.

${mode === 'game' ? `CRITICAL: Since mode is 'game', you MUST also provide exactly 5 quiz questions based on the story content to test the reader's comprehension.
Each question must have:
- A question string.
- An array of 4 options.
- The correct choice's index (0-3).
- A short explanation of why it's correct.` : ''}

Return the response as a JSON object with this structure:
{
  "title": "Story Title",
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Scene 1 Title",
      "text": "Story text...",
      "imagePrompt": "Detailed visual description for illustrator"
    }
  ]${mode === 'game' ? `,
  "quizQuestions": [
    {
      "question": "Question text?",
      "options": ["Option 1", "Option 2", "Option 3", "Option 4"],
      "correctIndex": 0,
      "explanation": "Correct because..."
    }
  ]` : ''}
}

Only return the JSON.`;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\nUser Input: ${prompt}` }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    }
  );

  const data = (await response.json()) as any;
  if (data.error) throw new Error(data.error.message);

  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  // Strip code blocks if AI returns them
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini JSON:", text);
    throw new Error("Invalid JSON response from Gemini");
  }
}

export async function generateGeminiImage(imagePrompt: string) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not defined");

  console.log(`🚀 Gemini Image Generation: ${imagePrompt.slice(0, 50)}...`);
  
  // Using Gemini 2.0 to handle image generation modality
  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              {
                text: `Create a colorful, Pixar-style storybook illustration for this scene: ${imagePrompt}. High quality, detailed, vibrant colors.`
              }
            ]
          }
        ],
        generationConfig: {
          responseModalities: ["IMAGE"]
        }
      })
    }
  );

  const data = (await response.json()) as any;
  if (data.error) throw new Error(data.error.message);

  // Gemini returns images in parts as inlineData (usually)
  const imagePart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.inlineData);
  if (imagePart) {
    return imagePart.inlineData.data; // This is base64 string
  }

  // Fallback check for other formats if applicable
  const fileDataPart = data.candidates?.[0]?.content?.parts?.find((p: any) => p.fileData);
  if (fileDataPart) {
     return fileDataPart.fileData.fileUri;
  }

  throw new Error("No image data returned from Gemini");
}

export async function translateWithGemini(prompt: string) {
  const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
  if (!GEMINI_API_KEY) throw new Error("GEMINI_API_KEY is not defined");

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash-latest:generateContent?key=${GEMINI_API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${prompt}\n\nReturn EXACTLY a JSON object. No extra text.` }] }],
        generationConfig: { responseMimeType: "application/json" }
      })
    }
  );

  const data = (await response.json()) as any;
  if (data.error) throw new Error(data.error.message);

  let text = data.candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  text = text.replace(/```json/g, "").replace(/```/g, "").trim();
  
  try {
    return JSON.parse(text);
  } catch (e) {
    console.error("Failed to parse Gemini translation JSON:", text);
    throw new Error("Invalid translation response from Gemini");
  }
}
