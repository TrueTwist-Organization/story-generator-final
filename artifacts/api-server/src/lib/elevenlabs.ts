const ELEVENLABS_API_KEY = process.env.ELEVENLABS_API_KEY;

export async function generateElevenLabsAudio(text: string, voiceId: string = "EXAVITQu4vr4xnSDxMaL") {
  if (!ELEVENLABS_API_KEY) throw new Error("ELEVENLABS_API_KEY is not defined");

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s timeout

  try {
    const response = await fetch(`https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`, {
      method: "POST",
      headers: {
        "xi-api-key": ELEVENLABS_API_KEY,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        text,
        model_id: "eleven_multilingual_v2",
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.5,
        },
      }),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!response.ok) {
      const errorText = await response.text();
      let errorMsg = "ElevenLabs TTS failed";
      try {
        const json = JSON.parse(errorText);
        errorMsg = json.detail?.message || json.error?.message || errorMsg;
      } catch (e) {
        errorMsg = errorText || errorMsg;
      }
      throw new Error(errorMsg);
    }

    const buffer = await response.arrayBuffer();
    return Buffer.from(buffer);
  } catch (err: any) {
    clearTimeout(timeoutId);
    if (err.name === 'AbortError') {
      throw new Error("ElevenLabs request timed out");
    }
    throw err;
  }
}
