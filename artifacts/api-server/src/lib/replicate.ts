export async function generateReplicateImage(prompt: string) {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) throw new Error("REPLICATE_API_TOKEN is not defined");

  console.log(`🎨 [Replicate] Using token starting with: ${REPLICATE_API_TOKEN.slice(0, 5)}...`);
  console.log(`🎨 [Replicate] Requesting image for: "${prompt.slice(0, 50)}..."`);

  // Using black-forest-labs/flux-schnell
  const response = await fetch("https://api.replicate.com/v1/models/black-forest-labs/flux-schnell/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      "User-Agent": "Story-Weaver-AI/1.0",
      "Prefer": "wait"
    },
    body: JSON.stringify({
      input: {
        prompt: prompt,
        aspect_ratio: "1:1",
        output_format: "webp",
        output_quality: 80,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json() as any;
    const errorMsg = errorData.detail || errorData.title || `Replicate error ${response.status}`;
    console.error(`❌ [Replicate] POST error (${response.status}):`, errorMsg);
    throw new Error(errorMsg);
  }

  let prediction = await response.json() as any;
  if (!prediction.id) {
    throw new Error("Replicate failed to return a prediction ID");
  }

  console.log(`⏳ [Replicate] Prediction created: ${prediction.id}, status: ${prediction.status}`);

  const poll = async (id: string, retries = 30): Promise<string> => {
    if (retries <= 0) throw new Error("Replicate polling timed out");

    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` },
    });
    const result = await res.json() as any;

    if (result.status === "succeeded") {
      console.log(`✅ [Replicate] Prediction succeeded: ${id}`);
      return result.output[0];
    }
    if (result.status === "failed") {
      console.error(`❌ [Replicate] Prediction failed: ${id}`, result.error);
      throw new Error(`Replicate failed: ${result.error}`);
    }

    await new Promise(r => setTimeout(r, 1500));
    return poll(id, retries - 1);
  };

  let imageUrl = prediction.output?.[0];
  if (!imageUrl) {
    imageUrl = await poll(prediction.id);
  }

  console.log(`📥 [Replicate] Downloading image from: ${imageUrl}`);

  const imgRes = await fetch(imageUrl);
  const buffer = await imgRes.arrayBuffer();
  console.log(`🖼️ [Replicate] Image downloaded, size: ${buffer.byteLength}`);
  return Buffer.from(buffer).toString("base64");
}

/**
 * Generate a story scene image with the customer's face naturally preserved.
 * Uses InstantID — the face from the uploaded photo is placed directly into the
 * illustrated storybook scene with high fidelity. No separate character step needed.
 *
 * The output looks like a professional personalized children's book where the real
 * person's face appears in each illustrated scene.
 */
export async function generateInstantIDImage(prompt: string, faceImageBase64: string): Promise<string> {
  const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
  if (!REPLICATE_API_TOKEN) throw new Error("REPLICATE_API_TOKEN is not defined");

  const imageDataUri = faceImageBase64.startsWith("data:")
    ? faceImageBase64
    : `data:image/jpeg;base64,${faceImageBase64}`;

  const storybookPrompt = `${prompt}, children's book illustration, vibrant storybook art, Disney Pixar style, magical atmosphere, high quality, professional illustration`;

  console.log(`🎨 [Replicate/InstantID] Generating face-consistent scene: "${storybookPrompt.slice(0, 80)}..."`);

  const response = await fetch("https://api.replicate.com/v1/models/zsxkib/instant-id/predictions", {
    method: "POST",
    headers: {
      "Authorization": `Token ${REPLICATE_API_TOKEN}`,
      "Content-Type": "application/json",
      "Prefer": "wait",
    },
    body: JSON.stringify({
      input: {
        image: imageDataUri,
        prompt: storybookPrompt,
        negative_prompt: "nsfw, lowres, bad anatomy, bad hands, text, watermark, signature, blurry, ugly, duplicate, deformed, extra limbs",
        style: "Disney Character",
        num_outputs: 1,
        width: 1024,
        height: 1024,
        guidance_scale: 7.5,
        num_inference_steps: 30,
        ip_adapter_scale: 0.8,
        controlnet_conditioning_scale: 0.8,
        enable_lcm: false,
      },
    }),
  });

  if (!response.ok) {
    const errorData = await response.json() as any;
    const errorMsg = errorData.detail || errorData.title || `InstantID error ${response.status}`;
    console.error(`❌ [Replicate/InstantID] Error (${response.status}):`, errorMsg);
    throw new Error(errorMsg);
  }

  let prediction = await response.json() as any;

  const poll = async (id: string, retries = 45): Promise<string> => {
    if (retries <= 0) throw new Error("InstantID polling timed out");
    const res = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { "Authorization": `Token ${REPLICATE_API_TOKEN}` },
    });
    const result = await res.json() as any;
    if (result.status === "succeeded") return result.output?.[0] || result.output;
    if (result.status === "failed") throw new Error(`InstantID failed: ${result.error}`);
    await new Promise(r => setTimeout(r, 2000));
    return poll(id, retries - 1);
  };

  let imageUrl = prediction.output?.[0] || prediction.output;
  if (!imageUrl) imageUrl = await poll(prediction.id);

  console.log(`📥 [Replicate/InstantID] Downloading from: ${imageUrl}`);
  const imgRes = await fetch(imageUrl);
  const buffer = await imgRes.arrayBuffer();
  return Buffer.from(buffer).toString("base64");
}
