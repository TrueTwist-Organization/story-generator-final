import { Router, type IRouter, Request, Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { generateStoryWithGemini, generateGeminiImage, translateWithGemini } from "../lib/gemini";
import { generateStoryWithGrok, generateGrokImage, generateGrokVideo } from "../lib/xai";
import { generateDeepAIImage } from "../lib/deepai";
import {
  generateImageBuffer,
  openai,
} from "@workspace/integrations-openai-ai-server";
import { generateElevenLabsAudio } from "../lib/elevenlabs";
import { generateReplicateImage, generateInstantIDImage } from "../lib/replicate";

const router: IRouter = Router();

interface StoryScene {
  sceneNumber: number;
  title: string;
  text: string;
  imagePrompt?: string;
  imageUrl?: string;
  choices?: any[];
}

interface Story {
  id: string;
  title: string;
  category: string;
  language: string;
  mode: string;
  thumbnail?: string;
  description: string;
  scenes: StoryScene[];
}

function getVoiceForLanguage(language: string, requestedVoice?: string): "alloy" | "echo" | "fable" | "onyx" | "nova" | "shimmer" {
  if (requestedVoice && ["alloy", "echo", "fable", "onyx", "nova", "shimmer"].includes(requestedVoice)) {
    return requestedVoice as any;
  }
  // Default voices per language
  if (language === "hindi") return "shimmer";
  if (language === "gujarati") return "shimmer";
  return "nova";
}

const DEMO_STORIES: Story[] = [
  {
    id: "demo-1",
    title: "The Just King and the Hidden Truth",
    category: "princess",
    language: "english",
    mode: "image",
    thumbnail: "/images/demo-king.png",
    description: "A wise king named Aryan solves a difficult dispute between two women.",
    scenes: [
      {
        sceneNumber: 1,
        title: "The Wise King Aryan",
        text: "Once upon a time, in a beautiful kingdom, there lived a wise king named Aryan. He was loved by everyone because he always gave fair decisions.",
        imagePrompt: "Wise King Aryan sitting on a golden throne in a grand medieval court, surrounded by advisors, cinematic lighting, Pixar style",
        choices: []
      },
      {
        sceneNumber: 2,
        title: "The Dispute",
        text: "One day, two women came to his court fighting over a baby. Both claimed to be the real mother. The court fell silent as the king listened to their pleas.",
        imagePrompt: "Two women arguing in front of a king in a royal court, holding onto a small baby, emotional expressions, bright royal colors",
        choices: []
      },
      {
        sceneNumber: 3,
        title: "The King's Decision",
        text: "The king thought deeply and said, 'Cut the baby into two parts and give each woman one half.' One woman stayed silent, but the other cried out in pain.",
        imagePrompt: "King Aryan making a decree with hands raised, one woman looking horrified and crying, the other woman staying cold and silent",
        choices: []
      },
      {
        sceneNumber: 4,
        title: "The Real Mother",
        text: "'No! Please give the baby to her, but don’t harm the child!' the second woman cried. The king smiled, 'She is the real mother.' For true love is selfless.",
        imagePrompt: "King Aryan handing the baby to the crying woman, a warm glow around them, people cheering in the background, happy ending",
        choices: []
      }
    ]
  },
  {
    id: "demo-2",
    title: "The Magical Forest and the Brave Girl",
    category: "nature",
    language: "english",
    mode: "image",
    thumbnail: "/images/demo-forest-girl.png",
    description: "Lily discovers a magical forest and makes a selfless wish for her village.",
    scenes: [
      {
        sceneNumber: 1,
        title: "The Singing Forest",
        text: "A girl named Lily entered a magical forest where trees could talk and rivers sang songs. The air was filled with glowing butterflies and the scent of honey.",
        imagePrompt: "Young girl Lily entering a vibrant magical forest, sentient trees with faces, singing blue river, magical particles, Disney style",
        choices: []
      },
      {
        sceneNumber: 2,
        title: "The Glowing Stone",
        text: "One day, she found a glowing stone. A fairy appeared from the light and said, 'This stone grants one single wish to the one who finds it.'",
        imagePrompt: "Lily holding a glowing pulse-stone in her hands, a small beautiful fairy with crystalline wings floating in front of her",
        choices: []
      },
      {
        sceneNumber: 3,
        title: "A Selfless Wish",
        text: "Lily could wish for anything — riches, power, or fame. But instead, she said, 'I wish for my village to always have food and happiness.'",
        imagePrompt: "Lily closing her eyes and making a wish, the glowing stone emitting a wave of golden light that spreads through the air",
        choices: []
      },
      {
        sceneNumber: 4,
        title: "A Village Blessed",
        text: "The fairy smiled and granted her wish. From that day, her village never faced hunger again. Lily realized that kindness is the greatest magic of all.",
        imagePrompt: "Prosperous village with fields full of crops, happy people feasting, Lily looking on with a smile, warm sunset glow",
        choices: []
      }
    ]
  },
  {
    id: "demo-3",
    title: "The Two Friends and the Storm",
    category: "custom",
    language: "english",
    mode: "image",
    thumbnail: "/images/demo-friends-storm.png",
    description: "Rohan and Aman learn the true meaning of friendship during a dangerous storm.",
    scenes: [
      {
        sceneNumber: 1,
        title: "A Journey Begins",
        text: "Two best friends, Rohan and Aman, were traveling through a deep forest. They were excited about their adventure together.",
        imagePrompt: "Two young boys walking through a lush green forest, carrying backpacks, laughing and talking, sunny day",
        choices: []
      },
      {
        sceneNumber: 2,
        title: "The Storm Hits",
        text: "Suddenly, a dark storm started. The trees swayed and they got scared. Aman slipped in the mud and fell deep into a hidden pit.",
        imagePrompt: "Dark stormy forest, heavy rain, one boy falling into a deep hole, the other boy looking down in shock, dramatic lighting",
        choices: []
      },
      {
        sceneNumber: 3,
        title: "The Rescue",
        text: "Rohan didn’t run away. He found a sturdy rope and pulled Aman out with all his strength. 'Hold on, I've got you!' he shouted.",
        imagePrompt: "Boy pulling his friend out of a pit using a rope, determined expression, rain splashing everywhere, heroic pose",
        choices: []
      },
      {
        sceneNumber: 4,
        title: "True Friends",
        text: "Later, Aman said, 'You could have left me.' Rohan smiled, 'That’s not what friends do.' True friends stay in tough times.",
        imagePrompt: "Two friends sitting under a tree after the storm, sharing a blanket, sun peeking through clouds, comforting atmosphere",
        choices: []
      }
    ]
  },
  {
    id: "demo-4",
    title: "The Sleepy Moon and the Little Star",
    category: "custom",
    language: "english",
    mode: "image",
    thumbnail: "/images/demo-moon-star.png",
    description: "A gentle bedtime story about the Moon caring for a tired little star.",
    scenes: [
      {
        sceneNumber: 1,
        title: "Night Sky",
        text: "Every night, a little star stayed awake while the moon watched over the sky. They were best friends in the vast dark ocean of space.",
        imagePrompt: "Night sky full of stars, one large smiling moon, one bright little star nearby, magical stardust, soft colors",
        choices: []
      },
      {
        sceneNumber: 2,
        title: "Tired Star",
        text: "One day, the star said, 'I’m tired. I have twinkled for so long, and my light is getting dim.' It began to yawn slowly.",
        imagePrompt: "A cute little star with a sleepy face, eyes half-closed, floating in the dark blue sky with space nebulae background",
        choices: []
      },
      {
        sceneNumber: 3,
        title: "Moon's Care",
        text: "The moon smiled and said, 'Even the smallest star deserves rest.' The moon began to shine with a soothing, soft light.",
        imagePrompt: "The large Moon glowing softly, wrapping its light around the little star like a warm blanket, tranquil atmosphere",
        choices: []
      },
      {
        sceneNumber: 4,
        title: "Sweet Dreams",
        text: "That night, the moon shined brighter so the star could sleep peacefully without worry. Everyone needs rest and care.",
        imagePrompt: "Little star sleeping peacefully, the moon watching over it, beautiful night sky with soft glowing clouds",
        choices: []
      }
    ]
  },
  {
    id: "demo-5",
    title: "The Honest Woodcutter",
    category: "custom",
    language: "english",
    mode: "image",
    thumbnail: "/images/demo-woodcutter.png",
    description: "A poor woodcutter is rewarded for his honesty by a river fairy.",
    scenes: [
      {
        sceneNumber: 1,
        title: "The Lost Axe",
        text: "A poor woodcutter was working near a river when he accidentally dropped his old iron axe into the deep water.",
        imagePrompt: "Woodcutter standing by a flowing river, looking sad, old iron axe sinking into the water",
        choices: []
      },
      {
        sceneNumber: 2,
        title: "Fairy's Test",
        text: "A fairy appeared and showed him a golden axe. 'Is this yours?' she asked. He said, 'No.' Then she showed a silver axe. Again, he said, 'Not mine.'",
        imagePrompt: "Beautiful river fairy rising from the water, holding a gleaming golden axe, woodcutter shaking his head 'no'",
        choices: []
      },
      {
        sceneNumber: 3,
        title: "The Honest Answer",
        text: "Finally, she showed his old, rusted iron axe. He shouted happily, 'Yes, that’s mine!' He didn't want the gold or silver.",
        imagePrompt: "The fairy holding an old iron axe, the woodcutter pointing at it with a joyful face, honest expression",
        choices: []
      },
      {
        sceneNumber: 4,
        title: "Honesty Rewarded",
        text: "The fairy was impressed by his honesty and gave him all three axes. The woodcutter went home happy, for honesty is always rewarded.",
        imagePrompt: "Woodcutter holding three axes (gold, silver, iron), fairy smiling and disappearing into the river, sun shining brightly",
        choices: []
      }
    ]
  },
  {
    id: "demo-6",
    title: "The Clever Rabbit and the Lion",
    category: "nature",
    language: "english",
    mode: "image",
    thumbnail: "/images/demo-rabbit-lion.png",
    description: "Intelligence overcomes strength when a clever rabbit outsmarts a fierce lion.",
    scenes: [
      {
        sceneNumber: 1,
        title: "The Fierce Lion",
        text: "A fierce lion was eating animals every day. The animals made a plan — one animal would go daily to the lion to save the others.",
        imagePrompt: "Large angry lion standing on a rock, smaller animals gathered in a circle far away, forest setting",
        choices: []
      },
      {
        sceneNumber: 2,
        title: "Rabbit's Plan",
        text: "One day, a clever rabbit went very late. The lion was furious. The rabbit said, 'Another lion stopped me on the way!'",
        imagePrompt: "Small rabbit standing in front of a giant angry lion, pointing away, lion looking curious and mad",
        choices: []
      },
      {
        sceneNumber: 3,
        title: "The Well",
        text: "The lion followed the rabbit to a deep well. 'He is hiding in there!' said the rabbit. The lion looked down into the water.",
        imagePrompt: "Lion leaning over an old stone well, rabbit standing next to it, seeing his own reflection in the water below",
        choices: []
      },
      {
        sceneNumber: 4,
        title: "Victory",
        text: "Seeing his reflection, the lion thought it was another lion and jumped in. He drowned, and the forest was safe. Intelligence is stronger than strength.",
        imagePrompt: "Animals cheering in the forest, the rabbit looking proud, well in the background, happy bright forest colors",
        choices: []
      }
    ]
  },
  {
    id: "demo-7",
    title: "The Kind Princess and the Secret Garden",
    category: "princess",
    language: "english",
    mode: "image",
    thumbnail: "/images/demo-princess.png",
    description: "Princess Elina discovers that true beauty and magic come from a kind heart.",
    scenes: [
      {
        sceneNumber: 1,
        title: "The Hidden Garden",
        text: "Princess Elina was kind but lonely. One day, she found a hidden garden where flowers glowed in the dark of the night.",
        imagePrompt: "Princess Elina in a beautiful dress, walking into a secret garden with glowing blue and purple flowers, moonlit night",
        choices: []
      },
      {
        sceneNumber: 2,
        title: "The Secret",
        text: "A voice in the wind said, 'This garden blooms only for kind hearts.' Elina realized the garden's magic was tied to her own deeds.",
        imagePrompt: "Princess Elina listening to the wind, glowing flowers reacting to her presence, magical aura in the garden",
        choices: []
      },
      {
        sceneNumber: 3,
        title: "Acts of Kindness",
        text: "Elina started helping people even more — feeding the poor and caring for sick animals. The garden became brighter every single day.",
        imagePrompt: "Princess Elina feeding birds and helping a poor villager, garden visible in the background glowing intensely",
        choices: []
      },
      {
        sceneNumber: 4,
        title: "True Beauty",
        text: "She realized that true beauty comes from within. The garden was a reflection of her soul. Kindness makes you truly beautiful.",
        imagePrompt: "Princess Elina standing in the center of the fully bloomed glowing garden, radiantly beautiful, morning sun rising",
        choices: []
      }
    ]
  },
  {
    id: "demo-8",
    title: "The Little Robot's First Rain",
    category: "custom",
    language: "english",
    mode: "image",
    thumbnail: "/images/demo-nature.png",
    description: "A small robot discovers the wonder and beauty of its very first rainstorm.",
    scenes: [
      {
        sceneNumber: 1,
        title: "Gray Clouds",
        text: "The sky turned dark and heavy gray clouds filled the air. Sparky the robot looked up with glowing blue eyes, never having seen the sun hide away.",
        imagePrompt: "Small cute robot on a grassy hill, large dark gray sky, dramatic clouds, curious expression",
        choices: []
      },
      {
        sceneNumber: 2,
        title: "First Drops",
        text: "Suddenly, small water drops began to fall from the sky. 'What is this liquid?' Sparky wondered as a drop splashed onto its metal head.",
        imagePrompt: "Rain beginning to fall on the small robot, raindrops reflecting on its metal surface, soft lighting",
        choices: []
      },
      {
        sceneNumber: 3,
        title: "Playing in Rain",
        text: "Instead of hiding, Sparky began to dance among the puddles. It realized that the rain made the thirsty world around it bloom with life.",
        imagePrompt: "Small robot jumping in an oil-rainbow puddle, splashing water, happy robotic movements, bright flowers starting to open",
        choices: []
      },
      {
        sceneNumber: 4,
        title: "A New Friend",
        text: "As the sun came out, Sparky looked at a rainbow in the sky. It learned that even the grayest clouds can bring a beautiful surprise.",
        imagePrompt: "Robot looking at a bright rainbow in a clear sky, wet grass, sparkling atmosphere, hopeful ending scene",
        choices: []
      }
    ]
  },
  {
    id: "demo-9",
    title: "The Dragon who loved Dahlias",
    category: "nature",
    language: "english",
    mode: "image",
    thumbnail: "/images/demo-princess.png",
    description: "A fierce-looking dragon secretly loves gardening and caring for fragile flowers.",
    scenes: [
      {
        sceneNumber: 1,
        title: "The Secret Garden",
        text: "High atop the Fire Peak mountains lived Grom the dragon. Everyone thought he was scary, but Grom had a secret — he loved tiny, fragile dahlias.",
        imagePrompt: "Large red dragon sitting carefully among small colorful flowers, sunlight hitting dragon scales, mountain cave background",
        choices: []
      },
      {
        sceneNumber: 2,
        title: "The Missing Water",
        text: "One summer, the clouds stopped raining. Grom's flowers began to wilt. He used his large claws to dig a deep hole to find hidden water for them.",
        imagePrompt: "Dragon carefully digging in the earth with one claw, looking worriedly at wilting yellow flowers, dry ground",
        choices: []
      },
      {
        sceneNumber: 3,
        title: "A Helping Breath",
        text: "He realized his heat could help too. He breathed warm steam — not fire — onto the dry ground, creating a gentle mist that saved his garden.",
        imagePrompt: "Dragon breathing blue-ish steam over a garden, mist everywhere, flowers looking refreshed, magical atmosphere",
        choices: []
      },
      {
        sceneNumber: 4,
        title: "Gentle Giant",
        text: "The birds and bees returned to his mountain. Grom learned that true strength is using your power to protect things that are small and beautiful.",
        imagePrompt: "Happy dragon surrounded by birds and blooming flowers, sunset colors, warm and peaceful forest scene",
        choices: []
      }
    ]
  },
  {
    id: "demo-10",
    title: "The Whispering Shell",
    category: "custom",
    language: "english",
    mode: "image",
    thumbnail: "/images/hero-bg.png",
    description: "A magical shell on the beach tells a young girl stories of the deep blue sea.",
    scenes: [
      {
        sceneNumber: 1,
        title: "The Golden Beach",
        text: "Maya was walking along the shore when she found a shell that shined with all the colors of the rainbow. It seemed to pulse with a soft light.",
        imagePrompt: "Young girl on a tropical beach at sunset, sunset reflecting on a glowing colorful shell in her hand, waves crashing",
        choices: []
      },
      {
        sceneNumber: 2,
        title: "The First Story",
        text: "As she held it to her ear, she didn't just hear the wind. The shell began to whisper stories of underwater cities made of coral and pearl.",
        imagePrompt: "Girl listening to a glowing shell, translucent 'ghostly' image of a coral castle in the air above her, magical fantasy art",
        choices: []
      },
      {
        sceneNumber: 3,
        title: "Deep Secrets",
        text: "The shell told her of giant whales that sing to the stars and dolphins that play with moonbeams. Maya closed her eyes and saw it all.",
        imagePrompt: "Translucent vision of whales swimming under moonlight, stardust in the sea, magical dream-like illustration",
        choices: []
      },
      {
        sceneNumber: 4,
        title: "Ocean's Gift",
        text: "She realized the ocean is full of magic that few ever hear. Maya promised to protect the sea so its stories would never end.",
        imagePrompt: "Girl standing at the edge of the ocean, holding the shell close, moonlit night, thousands of stars reflecting in water",
        choices: []
      }
    ]
  },
  {
    id: "demo-11",
    title: "The Brave Toy Soldier",
    category: "custom",
    language: "english",
    mode: "image",
    thumbnail: "/images/hero-card.png",
    description: "A loyal toy soldier protects a child's dreams from the scary shadows of the night.",
    scenes: [
      {
        sceneNumber: 1,
        title: "Night Watchman",
        text: "When the lights went out, Captain Tin didn't sleep. He stood at the edge of the bed, his little wooden sword ready for any night-shadows.",
        imagePrompt: "Toy soldier sitting on a shelf near a sleeping child, moonbeams through window, magical night atmosphere",
        choices: []
      },
      {
        sceneNumber: 2,
        title: "The Shadow Monster",
        text: "A dark shadow crept from under the chair, trying to bring a bad dream. Captain Tin stepped forward, 'Not on my watch!' he whispered.",
        imagePrompt: "Toy soldier standing in front of a wispy dark shadow, wooden sword glowing with a tiny light, playroom setting",
        choices: []
      },
      {
        sceneNumber: 3,
        title: "True Courage",
        text: "With a brave heart, the soldier used the light of a nearby night-lamp to drive the shadows back. His courage was bigger than his size.",
        imagePrompt: "Toy soldier blocking a shadow with a shield of light, child sleeping peacefully in the background, warm night light",
        choices: []
      },
      {
        sceneNumber: 4,
        title: "Morning Sun",
        text: "As the sun rose, the shadows disappeared. Captain Tin returned to his place, knowing his friend had slept well. Loyalty is the greatest shield.",
        imagePrompt: "Morning sun hitting the toys on the shelf, boy waking up with a hug for his favorite soldier, bright bedroom",
        choices: []
      }
    ]
  }
];

const CLEAN_DEMO_STORIES = DEMO_STORIES.map(story => ({
  id: story.id,
  title: story.title,
  category: story.category,
  language: story.language,
  mode: story.mode,
  thumbnail: story.thumbnail,
  description: story.description,
  scenes: story.scenes
}));

async function getDemoStories(): Promise<Story[]> {
  try {
    const dataPath = path.join(process.cwd(), "src", "data", "demo-stories.json");
    const data = await fs.readFile(dataPath, "utf8");
    return JSON.parse(data);
  } catch (error) {
    console.error("Error reading demo-stories.json, using fallback:", (error as Error).message);
    return DEMO_STORIES.map(story => ({
      id: story.id,
      title: story.title,
      category: story.category,
      language: story.language,
      mode: story.mode,
      thumbnail: story.thumbnail,
      description: story.description,
      scenes: story.scenes
    }));
  }
}

function getLanguageInstruction(language: string): string {
  switch (language) {
    case "hindi":
      return "CRITICAL: The story TITLE, story DESCRIPTION, and all scene TEXT must be written ONLY in Hindi using Devanagari script. Do NOT use English for story content. Only provide the imagePrompt in English.";
    case "gujarati":
      return "CRITICAL: The story TITLE, story DESCRIPTION, and all scene TEXT must be written ONLY in Gujarati using Gujarati script. Do NOT use English for story content. Only provide the imagePrompt in English.";
    default:
      return "Write the story in English.";
  }
}

function getCategoryStyle(category: string): string {
  const styles: Record<string, string> = {
    king_queen: "royal kingdoms, medieval courts, kings and queens, grand palaces, justice and leadership",
    fantasy: "mystical creatures, dragons, wizards, epic landscapes, magical elements, high fantasy",
    magic: "sorcery, spells, magical objects, enchantment, wizards and witches, magical glows",
    friendship: "heartwarming interactions, friends helping each other, emotional bonds, emotional warmth",
    kids: "childlike innocence, soft colors, playful characters, toys, simple and bright illustrations",
    bedtime: "cozy night scenes, moon and stars, soft lighting, peaceful sleep, comforting colors",
    moral: "thoughtful fables, character-building moments, traditional lessons, expressive characters",
    animal: "anthropomorphic animals, forest life, creature adventures, expressive wildlife",
    princess: "fairy tale princess, magic, kingdoms, bravery, royal attire, enchantment",
    god: "divine beings, celestial light, spiritual mythological themes, ancient temples, powerful auras",
    bird: "avian life, flight, beautiful plumage, sky and nest settings, freedom, nature",
    custom: "creative, open-ended, based purely on the given prompt"
  };
  return styles[category] || styles.custom;
}

function getFallbackStory(prompt: string, category: string, language: string, mode: string) {
  const title = prompt.length > 30 ? (prompt.split('\n')[0].replace(/[*"-]/g, '').trim().split(/\s+/).slice(0, 8).join(' ') + "...") : (prompt || "My Magic Journey");
  const basePrompt = prompt || category;

  let parts = prompt.split(/\n|\. /).filter(p => p.trim().length > 15);

  if (parts.length >= 1) {
    const scenes = parts.slice(0, 10).map((text, idx) => {
      const cleanText = text.trim().replace(/^[*"-]\s*/, '').replace(/["-.\s]+$/, '');
      return {
        sceneNumber: idx + 1,
        title: cleanText.split(' ').slice(0, 5).join(' ') + "...",
        text: cleanText,
        imagePrompt: `Children's storybook illustration: ${cleanText.slice(0, 100)}. Cinematic digital art, rich colors, detailed background.`,
        choices: []
      };
    });

    return {
      id: `custom-story-${Date.now()}`,
      title: title,
      category,
      language,
      mode,
      scenes,
      isFallback: true,
      quizQuestions: []
    };
  }

  const scenes = [
    {
      sceneNumber: 1,
      title: "The Beginning",
      text: `Once upon a time, your journey into "${basePrompt.slice(0, 100)}" began.`,
      imagePrompt: `Cinematic visualization of ${basePrompt.slice(0, 50)}, starting the journey`,
      choices: mode === 'game' ? [{ id: "a", text: "Go forward", nextScene: 2, isCorrect: true }] : []
    },
    {
      sceneNumber: 2,
      title: "The Vision",
      text: `Deep within the heart of "${basePrompt.slice(0, 100)}", a new truth emerged.`,
      imagePrompt: `Dramatic moment with ${basePrompt.slice(0, 50)}, mystical lights`,
      choices: []
    },
    {
      sceneNumber: 3,
      title: "The Legacy",
      text: `Finally, the story of "${basePrompt.slice(0, 100)}" became a legend for all to see.`,
      imagePrompt: `Epic ending for ${basePrompt.slice(0, 50)}, sunset glow`,
      choices: []
    }
  ];

  return {
    id: `dynamic-fallback-${Date.now()}`,
    title,
    category,
    language,
    mode,
    scenes,
    isFallback: true,
    quizQuestions: []
  };
}

async function getLocalDemoImage(category: string, prompt: string, sceneNumber: number = 0): Promise<string> {
  const imagesDir = path.resolve(process.cwd(), "..", "story-generator", "public", "images");
  const localPath = path.join(process.cwd(), "..", "story-generator", "public", "demos", category, `${sceneNumber}.jpg`);

  try {
    const buffer = await fs.readFile(localPath);
    console.log(`🖼️ Serving local demo image: ${localPath}`);
    return buffer.toString("base64");
  } catch (e) {
    // Continue to AI fallbacks
  }
  try {
    const aiPrompt = encodeURIComponent(`${prompt}, clean storybook illustration, cinematic, detailed digital art, vibrant colors, children story style`);
    const freeAiUrl = `https://image.pollinations.ai/prompt/${aiPrompt}?seed=${Math.floor(Math.random() * 10000)}&width=1024&height=1024&nologo=true`;

    console.log(`Fallback: Requesting free AI image from Pollinations: ${prompt.slice(0, 30)}...`);
    const response = await fetch(freeAiUrl);
    if (response.ok) {
      const buffer = await response.arrayBuffer();
      return Buffer.from(buffer).toString("base64");
    }
  } catch (e) {
    console.warn("Pollinations AI fallback failed:", e);
  }

  let imageName = "hero-bg.png";
  if (category === "nature") imageName = "demo-nature.png";
  if (category === "princess") imageName = "demo-princess.png";
  if (category === "anime") imageName = "demo-anime.png";

  try {
    const imagePath = path.join(imagesDir, imageName);
    const buffer = await fs.readFile(imagePath);
    return buffer.toString("base64");
  } catch (err) {
    try {
      const buffer = await fs.readFile(path.join(imagesDir, "hero-bg.png"));
      return buffer.toString("base64");
    } catch (finalErr) {
      return "";
    }
  }
}

const DEMO_TRANSLATIONS: Record<string, Record<string, any>> = {
  hindi: {
    "demo-1": { 
      title: "न्यायप्रिय राजा और छिपा हुआ सत्य", 
      description: "एक बुद्धिमान राजा आर्यन दो महिलाओं के बीच एक कठिन विवाद को सुलझाता है।",
      scenes: [
        { sceneNumber: 1, title: "बुद्धिमान राजा आर्यन", text: "एक समय की बात है, एक खूबसूरत राज्य में आर्यन नाम का एक बुद्धिमान राजा रहता था। सभी उसे बहुत प्यार करते थे क्योंकि वह हमेशा नेक और निष्पक्ष निर्णय देता था।" },
        { sceneNumber: 2, title: "विवाद", text: "एक दिन, दो महिलाएँ एक बच्चे को लेकर उनके दरबार में लड़ती हुई आईं। दोनों का दावा था कि वे उस बच्चे की असली माँ हैं।" },
        { sceneNumber: 3, title: "न्याय का फैसला", text: "राजा ने कहा, 'बच्चे के दो टुकड़े कर दो और दोनों को आधा-आधा दे दो।' तभी एक महिला चिल्लाई, 'नहीं! इसे उसे दे दो, बस इसे मारो मत!'" },
        { sceneNumber: 4, title: "सच्ची माँ", text: "राजा तुरंत समझ गए कि जो माँ बच्चे की जान बचाने के लिए उसे छोड़ने को तैयार थी, वही असली माँ है। राजा ने उसे न्याय दिया और बच्चा सौंप दिया।" }
      ]
    },
    "demo-2": { 
      title: "जादू का जंगल और बहादुर लड़की", 
      description: "लिली नाम की एक लड़की एक जादुई जंगल की खोज करती है जहाँ पेड़ गाते हैं।",
      scenes: [
        { sceneNumber: 1, title: "सुरीला जंगल", text: "लिली जब जंगल में घुसी, उसने देखा कि पेड़ हिलकर सुरीला संगीत गा रहे थे। उसे लगा जैसे पूरा जंगल उसका स्वागत कर रहा हो।" },
        { sceneNumber: 2, title: "दुखी पेड़", text: "तभी उसने एक पेड़ को सुना जो रो रहा था। उसकी जड़ों में किसी ने कचरा डाल दिया था। लिली ने तुरंत उसे साफ किया।" },
        { sceneNumber: 3, title: "जादुई फल", text: "धन्यवाद के रूप में, पेड़ ने उसे एक जादुई फल दिया जिससे वह पक्षियों की भाषा समझ सकती थी।" },
        { sceneNumber: 4, title: "खुशी का गीत", text: "लिली अब पक्षियों के साथ गाने लगी और पूरा जंगल उसकी दयालुता की मिठास से गूँज उठा।" }
      ]
    },
    "demo-3": { 
      title: "दो दोस्त और तूफान", 
      description: "रोहन और अमन एक खतरनाक तूफान के दौरान दोस्ती का असली मतलब सीखते हैं।",
      scenes: [
        { sceneNumber: 1, title: "यात्रा", text: "दो पक्के दोस्त, रोहन और अमन, पहाड़ों की सैर कर रहे थे। अचानक आसमान काला पड़ गया और भारी बारिश होने लगी।" },
        { sceneNumber: 2, title: "खतरा", text: "अमन का पैर कीचड़ में फिसल गया और वह एक गहरे गड्ढे में गिर गया। रोहन डर गया, लेकिन वह भागा नहीं।" },
        { sceneNumber: 3, title: "मदद", text: "रोहन ने सावधानी से रस्सी डाली और अपनी पूरी ताकत लगाकर अमन को बाहर खींच लिया। वे दोनों अब सुरक्षित थे।" },
        { sceneNumber: 4, title: "सच्ची दोस्ती", text: "अमन ने कहा, 'तुमने अपनी जान जोखिम में डालकर मुझे बचाया।' रोहन ने मुस्कुराकर कहा, 'ये तो दोस्तों का काम है।'" }
      ]
    },
    "demo-4": { 
      title: "सोता हुआ चाँद और छोटा तारा", 
      description: "थके हुए छोटे तारे की देखभाल करने वाले चंद्रमा के बारे में एक प्यारी लोरी जैसी कहानी।",
      scenes: [
        { sceneNumber: 1, title: "नीला आकाश", text: "हर रात, एक छोटा तारा आकाश में चमकता था, जबकि बड़ा मुस्कुराता हुआ चाँद उसकी रखवाली करता था।" },
        { sceneNumber: 2, title: "थकावट", text: "एक दिन तारे ने जम्हाई ली और कहा, 'दोस्त चाँद, मैं आज बहुत थका हूँ। क्या मैं सो सकता हूँ?'" },
        { sceneNumber: 3, title: "चाँद की ममता", text: "चाँद ने उसे अपनी रोशनी की चादर ओढ़ाई और धीरे से हवा में लोरी सुनाई। तारा गहरी नींद में सो गया।" },
        { sceneNumber: 4, title: "शांति की रात", text: "उस रात आकाश और भी शांत हो गया। दुनिया को पता चला कि आराम और प्यार सबको चाहिए।" }
      ]
    },
    "demo-5": { 
      title: "ईमानदार लकड़हारा", 
      description: "एक गरीब लकड़हारा अपनी ईमानदारी की वजह से नदी की परी से इनाम पाता है।",
      scenes: [
        { sceneNumber: 1, title: "खोई हुई कुल्हाड़ी", text: "नदी किनारे लकड़ी काटते समय एक लकड़हारे की लोहे की पुरानी कुल्हाड़ी गहरे पानी में गिर गई। वह बहुत दुखी हुआ।" },
        { sceneNumber: 2, title: "परी का टेस्ट", text: "नदी से एक परी निकली और उसने उसे सोने की कुल्हाड़ी दिखाई। लकड़हारे ने कहा, 'नहीं, यह मेरी नहीं है।'" },
        { sceneNumber: 3, title: "सच का साथ", text: "जब परी ने लोहे की कुल्हाड़ी दिखाई, तो वह खुशी से उछल पड़ा। 'हाँ! यही मेरी वाली है!' उसकी ईमानदारी देख परी बहुत खुश हुई।" },
        { sceneNumber: 4, title: "ईमानदारी का फल", text: "परी ने खुश होकर उसे तीनों कुल्हाड़ियाँ दे दीं। लकड़हारे ने सीखा कि ईमानदारी ही सबसे बड़ी पूंजी है।" }
      ]
    },
    "demo-6": { 
      title: "चतुर खरगोश और शेर", 
      description: "एक बुद्धिमान नन्हा खरगोश जंगल के राजा शेर को अपनी चतुराई से हरा देता है।",
      scenes: [
        { sceneNumber: 1, title: "खतरनाक शेर", text: "जंगल का शेर दिन में कई जानवरों को मार डालता था। जानवरों ने फैसला किया कि एक जानवर हर रोज शेर के पास जाएगा।" },
        { sceneNumber: 2, title: "देरी", text: "खरगोश की बारी आई तो वह जानबूझकर देर से पहुँचा। शेर गुस्से में था, पर खरगोश बोला, 'महाराज, रास्ते में दूसरा शेर खड़ा था!'" },
        { sceneNumber: 3, title: "कुआँ", text: "खरगोश शेर को एक कुएँ पर ले गया और कहा, 'वह शेर इसके अंदर छिपा है।' शेर ने झाँका और अपनी परछाईं देखी।" },
        { sceneNumber: 4, title: "जीत", text: "शेर ने सोचा कि वह सच में कोई दूसरा शेर है और वह गुस्से में पानी में कूद गया। खरगोश ने अपनी अक्ल से सबकी जान बचा ली।" }
      ]
    },
    "demo-7": { 
      title: "दयालु राजकुमारी और गुप्त उद्यान", 
      description: "राजकुमारी एलिना को पता चलता है कि असली सुंदरता और जादू एक दयालु दिल से आता है।",
      scenes: [
        { sceneNumber: 1, title: "खुफिया बगीचा", text: "राजकुमारी एलिना को महल के पीछे एक रहस्यमयी बगीचा मिला जहाँ फूल चाँदनी में चमक रहे थे।" },
        { sceneNumber: 2, title: "बगीचे का रहस्य", text: "वहाँ लिखा था—यह बगीचा केवल उन्हीं के लिए खिलता है जिनका दिल दूसरों के लिए धड़कता है।" },
        { sceneNumber: 3, title: "नेक काम", text: "एलिना ने गरीबों की मदद करनी शुरू की और बीमार पंछियों की सेवा की। बगीचा और भी चमकदार हो गया।" },
        { sceneNumber: 4, title: "सच्ची सुंदरता", text: "एलिना जान गई कि असली चमक चेहरे पर नहीं, नेक कामों में होती है। वह सबके लिए एक मिसाल बन गई।" }
      ]
    },
    "demo-8": { 
      title: "नन्हे रोबोट की पहली बारिश", 
      description: "स्पार्की नाम का एक छोटा रोबोट पहली बार बारिश की सुंदरता और जादू का अनुभव करता है।",
      scenes: [
        { sceneNumber: 1, title: "काले बादल", text: "स्पार्की ने देखा कि आज सूरज छिप गया है और आसमान में बड़े-बड़े काले बादल उमड़ रहे हैं। वह थोड़ा हैरान था।" },
        { sceneNumber: 2, title: "पहली बूंद", text: "तभी हल्की-हल्की बारिश होने लगी। रोबोट के लोहे के सिर पर जब पहली बूंद गिरी, तो वह खुशी से कांप उठा।" },
        { sceneNumber: 3, title: "बारिश में नाच", text: "उसने छिपने के बजाय बारिश में नाचने का फैसला किया। उसने देखा कि बारिश से मिट्टी की खुशबू कितनी भीनी थी।" },
        { sceneNumber: 4, title: "इंद्रधनुष", text: "बारिश रुकी और आसमान में प्यारा इंद्रधनुष बना। स्पार्की समझ गया कि प्रकृति का हर रूप कितना जादुई होता है।" }
      ]
    },
    "demo-9": { 
      title: "डाहलिया से प्यार करने वाला ड्रैगन", 
      description: "एक भयानक दिखने वाला ड्रैगन चुपके से बागवानी और नाजुक फूलों की देखभाल करना पसंद करता है।",
      scenes: [
        { sceneNumber: 1, title: "गुप्त उद्यान", text: "ऊँचे पहाड़ों पर ग्रोम नाम का ड्रैगन रहता था। सब उससे डरते थे, पर ग्रोम का एक राज था—उसे छोटे और नाजुक डाहलिया के फूल बहुत पसंद थे।" },
        { sceneNumber: 2, title: "पानी की कमी", text: "एक गर्मी में बारिश नहीं हुई। ग्रोम के फूल सूखने लगे। उसने अपने बड़े पंजों से गहरे गड्ढे खोदे ताकि उनके लिए पानी मिल सके।" },
        { sceneNumber: 3, title: "मदद की साँस", text: "उसने अपनी गर्मी से भाप बनाई और सूखी धरती को सींचा। उसकी आग नहीं, बल्कि उसकी ममता ने बागीचे को बचा लिया।" },
        { sceneNumber: 4, title: "कोमल विशालकाय", text: "पक्षी और तितलियाँ पहाड़ पर लौट आए। ग्रोम समझ गया कि असली ताकत सुंदर और नाजुक चीजों की रक्षा करने में है।" }
      ]
    },
    "demo-10": { 
      title: "फुसफुसाता हुआ शंख", 
      description: "समुद्र तट पर एक जादुई शंख एक युवा लड़की को गहरे नीले समुद्र की कहानियाँ सुनाता है।",
      scenes: [
        { sceneNumber: 1, title: "सुनहरा तट", text: "माया समुद्र किनारे टहल रही थी जब उसे एक चमकता हुआ शंख मिला। वह इंद्रधनुष के रंगों जैसा चमक रहा था।" },
        { sceneNumber: 2, title: "पहली कहानी", text: "कान के पास रखते ही शंख ने समुद्र के नीचे छिपे जादुई महलों की कहानियाँ सुनानी शुरू कर दीं।" },
        { sceneNumber: 3, title: "गहरे राज", text: "उसने बताया कि कैसे विशाल व्हेल मछलियाँ तारों के लिए गाती हैं। माया ने अपनी आँखें बंद कीं और वह सब देख सकी।" },
        { sceneNumber: 4, title: "समुद्र का उपहार", text: "माया ने वादा किया कि वह समुद्र की रक्षा करेगी। उसने जान लिया कि कुदरत के पास सुनने वालों के लिए हज़ारों कहानियाँ हैं।" }
      ]
    },
    "demo-11": { 
      title: "बहादुर खिलौना सैनिक", 
      description: "एक वफादार खिलौना सैनिक बच्चे के सपनों को रात की डरावनी परछाइयों से बचाता है।",
      scenes: [
        { sceneNumber: 1, title: "रात का पहरेदार", text: "जब बत्तियाँ बुझ जातीं, टिन का सिपाही सोता नहीं था। वह बिस्तर के कोने पर अपनी छोटी तलवार लेकर खड़ा हो जाता था।" },
        { sceneNumber: 2, title: "साया राक्षस", text: "एक काली परछाईं पास आई, पर सिपाही निडर था। उसने अपनी नन्ही तलवार से परछाईं को रोक दिया।" },
        { sceneNumber: 3, title: "सच्ची हिम्मत", text: "सिपाही ने टेबल लैंप की रोशनी का इस्तेमाल किया और अंधेरे को भगा दिया। उसकी हिम्मत उसके कद से कहीं बड़ी थी।" },
        { sceneNumber: 4, title: "सुबह का सूरज", text: "जैसे ही सूरज उगा, सिपाही अपनी जगह पर लौट आया। वह खुश था कि उसका दोस्त चैन से सो सका। वफादारी ही सबसे बड़ी ढाल है।" }
      ]
    },
    "demo-13": { 
      title: "दो दोस्त और तूफान", 
      description: "हिमालय में एक खतरनाक तूफान के दौरान रोहन और अमन दोस्ती का सच्चा अर्थ सीखते हैं।",
      scenes: [
        { sceneNumber: 1, title: "ऊंचा मैदान", text: "रोहन और अमन हिमालय के ऊंचे मैदानों में भेड़ें चरा रहे थे। आसमान एक नीलम की तरह नीला था।" },
        { sceneNumber: 2, title: "काले बादल", text: "अचानक अंधेरा छा गया। कोयले की तरह काले बादलों ने चोटियों को ढक लिया और बर्फीली हवा चलने लगी।" },
        { sceneNumber: 3, title: "गुफा का सहारा", text: "रोहन का पैर गीली चट्टान पर फिसल गया, लेकिन अमन ने उसे पकड़ लिया। वे एक छोटी गुफा में छिप गए।" },
        { sceneNumber: 4, title: "नया सवेरा", text: "सुबह का सूरज सुनहरा और गर्म था। वे एक साथ बच गए थे और उनकी दोस्ती अब पहाड़ों की तरह मजबूत थी।" }
      ]
    },
    "demo-14": { 
      title: "आखिरी सेब बांटना", 
      description: "कठिन समय में, दो प्रतिद्वंद्वी साझा करने की खुशी और दोस्ती की ताकत को पहचानते हैं।",
      scenes: [
        { sceneNumber: 1, title: "सूखी धरती", text: "लंबे सूखे ने नदी को सुखा दिया था। सैम और जैक दोनों खाने के लिए कुछ ढूंढ रहे थे।" },
        { sceneNumber: 2, title: "खोज", text: "दोनों ने एक साथ एक छोटे से सूखे पेड़ के नीचे एक चमकता हुआ लाल सेब देखा।" },
        { sceneNumber: 3, title: "हिस्सेदारी", text: "लड़ने के बजाय, सैम ने चाकू लिया और सेब के बिल्कुल दो हिस्से किए। उसने बड़ा हिस्सा जैक को दे दिया।" },
        { sceneNumber: 4, title: "नया दोस्त", text: "जैसे ही उन्होंने मिलकर खाया, बारिश की पहली बूंद गिरी। सेब बांटना उस दोस्ती की शुरुआत थी जो जीवन भर चली।" }
      ]
    },
    "demo-17": { 
      title: "कुकी जार का रहस्य", 
      description: "युवा जासूस मिलो अपने आवर्धक लेंस का उपयोग करके गायब कुकीज़ के मामले को सुलझाता है।",
      scenes: [
        { sceneNumber: 1, title: "खाली जार", text: "जार खाली था। मिलो को कुकीज़ बहुत पसंद थीं, लेकिन लगता है किसी और ने उन्हें चट कर दिया था।" },
        { sceneNumber: 2, title: "जासूसी", text: "अपने लेंस के साथ, उसे फर्श पर एक लंबी नीली बिल्ली का बाल मिला। मिलो समझ गया कि यह किसका काम है।" },
        { sceneNumber: 3, title: "संदिग्ध", text: "व्हिस्कर्स बिल्ली सोफे के नीचे सो रही थी। उसकी नाक पर थोड़ी सी फ्रॉस्टिंग लगी हुई थी।" },
        { sceneNumber: 4, title: "साझा करना", text: "नाराज होने के बजाय, मिलो ने उसके साथ दूध साझा किया।" }
      ]
    },
    "demo-18": { 
      title: "उड़ने वाला कार्डबोर्ड बॉक्स", 
      description: "एक बच्चे की कल्पना एक साधारण कार्डबोर्ड बॉक्स को अंतरिक्ष यान में बदल देती है।",
      scenes: [
        { sceneNumber: 1, title: "लांच पैड", text: "लियो को एक बड़ा बॉक्स मिला। यह सिर्फ बॉक्स नहीं, बल्कि गैलेक्सी का सबसे तेज रॉकेट था!" },
        { sceneNumber: 2, title: "तारों के बीच", text: "ज़ूम! वह सोफे-पहाड़ों और लैंप-तारों को पार कर किचन-ग्रह की ओर बढ़ने लगा।" },
        { sceneNumber: 3, title: "एलियन मिलन", text: "वहां उसे एक दोस्ताना एलियन (उसकी बिल्ली) मिली, जो अपना अंतरिक्ष-दूध साझा करना चाहती थी।" },
        { sceneNumber: 4, title: "घर वापसी", text: "लियो ने अपना यान सुरक्षित उतारा, अगले रोमांच के लिए तैयार।" }
      ]
    },
    "demo-21": { 
      title: "चाँद की नाइट लाइट", 
      description: "एक छोटी लड़की चाँद से रुकने के लिए कहती है ताकि वह रात में अकेला महसूस न करे।",
      scenes: [
        { sceneNumber: 1, title: "अंधेरे का डर", text: "लिली को दीवार पर परछाइयों से डर लगता था। उसने चाँद से कहा—हटना मत।" },
        { sceneNumber: 2, title: "चाँद का वादा", text: "चाँद ने चांदी जैसी रोशनी भेजी जिससे लिली का खिलौना एक वफादार रक्षक बन गया।" },
        { sceneNumber: 3, title: "सपनों का द्वार", text: "उसी रोशनी के साथ लिली मीठे सपनों की दुनिया में खो गई।" },
        { sceneNumber: 4, title: "सुबह की धूप", text: "वह सोकर उठी और जान गई कि उजाला हमेशा साथ होता है।" }
      ]
    },
    "demo-22": { 
      title: "तारों वाली भेड़ें गिनना", 
      description: "गहरी और शांतिपूर्ण नींद में जाने के लिए जादुई तारों वाली भेड़ों की गिनती करें।",
      scenes: [
        { sceneNumber: 1, title: "पहली भेड़", text: "सपनों की घाटी में, पहली भेड़ ने चाँद के ऊपर से छलांग लगाई। वह रुई की तरह नरम थी।" },
        { sceneNumber: 2, title: "दो और तीन", text: "वे सिर्फ भेड़ें नहीं, बल्कि नींद की रखवाली करने वाली सखियां थीं जो शांति लाती थीं।" },
        { sceneNumber: 3, title: "अंतिम गिनती", text: "दसवीं भेड़ के कूदते ही आँखें भारी होने लगीं।" },
        { sceneNumber: 4, title: "गहरा सपना", text: "गिनती खत्म हुई और सपनों का सफर शुरू हो गया।" }
      ]
    },
    "demo-25": { 
      title: "ईमानदार लकड़हारा", 
      description: "गरीब लकड़हारे को उसकी ईमानदारी के लिए नदी की परी ने पुरस्कृत किया।",
      scenes: [
        { sceneNumber: 1, title: "खोई हुई कुल्हाड़ी", text: "एक गरीब लकड़हारा नदी किनारे लकड़ी काट रहा था। अचानक उसकी कुल्हाड़ी गहरी नदी में गिर गई।" },
        { sceneNumber: 2, title: "परी का आना", text: "नदी में से एक सुनहरी परी निकली। उसने एक सोने की कुल्हाड़ी दिखाई, पर लकड़हारे ने कहा—यह मेरी नहीं है।" },
        { sceneNumber: 3, title: "ईमानदारी की जीत", text: "आखिर में जब परी ने लोहे की कुल्हाड़ी निकाली, तो वह खुश हो गया। परी उसकी ईमानदारी देख बहुत खुश हुई।" },
        { sceneNumber: 4, title: "इनाम", text: "परी ने उसे तीनों कुल्हाड़ियाँ भेंट में दे दीं। ईमानदारी ही सबसे बड़ा धन है।" }
      ]
    },
    "demo-26": { 
      title: "भेड़िया और लड़का", 
      description: "सच बोलने के महत्व और भरोसे को बनाए रखने के बारे में एक महान कहानी।",
      scenes: [
        { sceneNumber: 1, title: "मजाक", text: "एक लड़का भेड़ें चराता था। उसने मजे के लिए चिल्लाया—भेड़िया आया! भेड़िया आया!" },
        { sceneNumber: 2, title: "लोग आए", text: "गांव वाले मदद के लिए दौड़े, पर वहां कोई भेड़िया नहीं था। लड़का उन पर हंसने लगा।" },
        { sceneNumber: 3, title: "असली डर", text: "एक दिन सचमुच भेड़िया आ गया। लड़का चिल्लाया, पर कोई नहीं आया क्योंकि सबको लगा कि वह फिर झूठ बोल रहा है।" },
        { sceneNumber: 4, title: "सीख", text: "झूठ बोलने वाले पर कोई विश्वास नहीं करता, चाहे वह सच ही क्यों न बोल रहा हो।" }
      ]
    },
    "demo-29": { 
      title: "चालाक खरगोश", 
      description: "जब एक चालाक खरगोश ने एक खूंखार शेर को मात दी, तो बुद्धिमत्ता की जीत हुई।",
      scenes: [
        { sceneNumber: 1, title: "डरावना शेर", text: "जंगल में एक घमंडी शेर रहता था जो सबको परेशान करता था। चालाक खरगोश की बारी आई।" },
        { sceneNumber: 2, title: "देरी का बहाना", text: "खरगोश जानबूझकर देर से पहुंचा। उसने कहा—महाराज, रास्ते में मुझे एक और शेर मिला था!" },
        { sceneNumber: 3, title: "कुएं का सच", text: "खरगोश शेर को एक गहरे कुएं के पास ले गया। शेर ने पानी में अपनी ही परछाई देखी और उसे दुश्मन समझा।" },
        { sceneNumber: 4, title: "विजया", text: "शेर कुएं में कूद गया और खरगोश ने अपनी अक्ल से सबकी जान बचा ली।" }
      ]
    },
    "demo-30": { 
      title: "बहादुर शेर का बच्चा", 
      description: "एक छोटा शेर सीखता है कि साहस डर की कमी नहीं, बल्कि अपनों के लिए खड़ा होना है।",
      scenes: [
        { sceneNumber: 1, title: "छोटा पंजे", text: "सिम्बा एक नन्हा शेर था जो दहाड़ना सीख रहा था। उसे ऊंचे पत्थरों से डर लगता था।" },
        { sceneNumber: 2, title: "मुसीबत", text: "एक दिन एक लोमड़ी गड्ढे में गिर गई। सिम्बा को डर लग रहा था, पर उसने मदद करने की सोची।" },
        { sceneNumber: 3, title: "साहस", text: "सिम्बा ने अपनी पूरी ताकत लगाई और लोमड़ी को बाहर निकाला। उसने अपना डर जीत लिया था।" },
        { sceneNumber: 4, title: "जंगल का राजा", text: "सबने उसकी बहादुरी की तारीफ की। सच्चा राजा वही है जो दूसरों की रक्षा करता है।" }
      ]
    },
    "demo-33": { 
      title: "राजकुमारी और बगीचा", 
      description: "राजकुमारी एलिना को पता चलता है कि असली जादू नेक दिल और दूसरों की सेवा में है।",
      scenes: [
        { sceneNumber: 1, title: "मुरझाए फूल", text: "राजकुमारी का बगीचा सूख रहा था। कोई जादू काम नहीं कर रहा था।" },
        { sceneNumber: 2, title: "सेवा", text: "एलिना ने फूलों को पानी दिया और उनकी देखभाल की। उसने देखा कि प्यार ही असली जादू है।" },
        { sceneNumber: 3, title: "खिलखिलाहट", text: "जैसे ही उसने मुस्कुराहट के साथ सेवा की, फूल फिर से खिल उठे।" },
        { sceneNumber: 4, title: "खुशी", text: "महल अब दुनिया का सबसे सुंदर स्थान बन गया था।" }
      ]
    },
    "demo-34": { 
      title: "राजकुमारी और मटर", 
      description: "एक चरित्र का परीक्षण जो बीस गद्दों के नीचे एक मटर के दाने से राजकुमारी की पहचान करता है।",
      scenes: [
        { sceneNumber: 1, title: "तूफान", text: "आधी रात को एक लड़की महल के दरवाजे पर आई। उसने दावा किया कि वह एक राजकुमारी है।" },
        { sceneNumber: 2, title: "बिस्तर", text: "रानी ने उसकी परीक्षा ली। बीस गद्दों के नीचे एक छोटा मटर का दाना रख दिया।" },
        { sceneNumber: 3, title: "बेचैनी", text: "रात भर लड़की को नींद नहीं आई क्योंकि उसे वह दाना चुभ रहा था।" },
        { sceneNumber: 4, title: "पहचान", text: "इतनी कोमल त्वचा सिर्फ एक असली राजकुमारी की ही हो सकती थी। सबकी खुशी का ठिकाना न रहा।" }
      ]
    },
    "demo-37": { 
      title: "गणेश की बुद्धिमत्ता", 
      description: "कैसे गणेश जी ने सिखाया कि माता-पिता की सेवा ही पूरी दुनिया की परिक्रमा है।",
      scenes: [
        { sceneNumber: 1, title: "दौड़", text: "शिव और पार्वती ने एक प्रतियोगिता रखी। जो पूरी दुनिया का चक्कर लगाकर पहले आएगा, उसे इनाम मिलेगा।" },
        { sceneNumber: 2, title: "कार्तिकेय की उड़ान", text: "कार्तिकेय अपने मोर पर सवार होकर तेजी से निकल पड़े।" },
        { sceneNumber: 3, title: "अनोखा रास्ता", text: "गणेश जी ने हाथ जोड़कर अपने माता-पिता के चारों ओर चक्कर लगाया।" },
        { sceneNumber: 4, title: "पुरस्कार", text: "उन्होंने कहा—मेरे अभिभावक ही मेरा संसार हैं। शिव-पार्वती ने उन्हें विजेता घोषित किया।" }
      ]
    },
    "demo-38": { 
      title: "कृष्ण की मुरली", 
      description: "कृष्ण की बांसुरी की धुन पूरे गौरव और प्रकृति को मंत्रमुग्ध कर देती है।",
      scenes: [
        { sceneNumber: 1, title: "यमुना किनारे", text: "मधुबन में कृष्ण ने अपनी बांसुरी बजाना शुरू किया। हवाएँ थम गईं।" },
        { sceneNumber: 2, title: "पेड़ और मोर", text: "उनकी धुन सुनकर पेड़ नाचने लगे और मोर पंख फैलाकर झूम उठे।" },
        { sceneNumber: 3, title: "गौ सेवा", text: "गायें घास चरना भूलकर उनकी ओर खींची चली आईं।" },
        { sceneNumber: 4, title: "शांति", text: "पूरी गोकुल नगरी प्रेम और शांति के संगीत में डूब गई।" }
      ]
    },
    "demo-41": { 
      title: "अभिमानी मोर", 
      description: "एक सुंदर पक्षी सीखता है कि बाहरी चमक से ज्यादा व्यवहार और चरित्र मायने रखता है।",
      scenes: [
        { sceneNumber: 1, title: "सुंदर पंख", text: "एक मोर को अपने रंग-बिरंगे पंखों पर बहुत घमंड था। वह बगुले का मजाक उड़ाता था।" },
        { sceneNumber: 2, title: "नीरस बगुला", text: "बगुले ने कहा—मेरे पंख साधारण हैं, पर मैं आसमान में ऊँचा उड़ सकता हूँ।" },
        { sceneNumber: 3, title: "बारिश", text: "बारिश में मोर के पंख गीले हो गए और वह उड़ नहीं पाया, पर बगुला खुशी से उड़ गया।" },
        { sceneNumber: 4, title: "सीख", text: "किसी की उपयोगिता उसकी सुंदरता से ज्यादा महत्वपूर्ण होती है।" }
      ]
    },
    "demo-42": { 
      title: "बाज की ऊंची उड़ान", 
      description: "आसमान की ऊंचाई से दुनिया को देखने का नज़रिया और घोंसला छोड़ने की हिम्मत।",
      scenes: [
        { sceneNumber: 1, title: "चट्टान", text: "एक नन्हा बाज अपने घोंसले से बाहर झांक रहा था। वह उड़ने से डरता था।" },
        { sceneNumber: 2, title: "धक्का", text: "उसकी माँ ने उसे धीरे से धक्का दिया। गिरने के डर से उसने अपने पंख फैलाए।" },
        { sceneNumber: 3, title: "उड़ान", text: "वह हवा के साथ बातें करने लगा। अब पूरी नीली दुनिया उसके चरणों में थी।" },
        { sceneNumber: 4, title: "आज़ादी", text: "हिम्मत करने पर ही हमें आसमान की ऊँचाइयों का पता चलता है।" }
      ]
    },
    "demo-45": { 
      title: "जादुई जंगल का राज", 
      description: "एक ऐसी जगह जहाँ प्रकृति खुद कहानियाँ सुनाती है और हर पत्ता चमकता है।",
      scenes: [
        { sceneNumber: 1, title: "प्रवेश", text: "आर्यन ने एक गुप्त दरवाजे से जंगल में प्रवेश किया। वहां के पत्ते सोने की तरह चमक रहे थे।" },
        { sceneNumber: 2, title: "बातें करते पेड़", text: "पुराने बरगद के पेड़ ने उससे कहा—सिर्फ साफ दिल वाले ही यहाँ आ सकते हैं।" },
        { sceneNumber: 3, title: "तितलियाँ", text: "रंगीन तितलियों ने उसे एक रास्ता दिखाया जहाँ एक चमकता हुआ झरना था।" },
        { sceneNumber: 4, title: "विदाई", text: "जंगल से निकलते ही उसे लगा कि वह एक बहुत सुंदर सपने से जागा है।" }
      ]
    },
    "demo-46": { 
      title: "गाती हुई नदी", 
      description: "अगर आप ध्यान से सुनें, तो नदी का पानी अतीत और भविष्य की बातें सुनाता है।",
      scenes: [
        { sceneNumber: 1, title: "पहाड़ की चोटी", text: "नदी एक ऊँचे पहाड़ से शुरू हुई। वह कल-कल करती हुई नीचे आ रही थी।" },
        { sceneNumber: 2, title: "संगीत", text: "जब वह पत्थरों से टकराती, तो एक प्यारा सा संगीत पैदा होता था।" },
        { sceneNumber: 3, title: "खेत", text: "उसने प्यासे खेतों को पानी दिया और किसान खुश हो गए।" },
        { sceneNumber: 4, title: "समंदर", text: "अंत में नदी समंदर से जा मिली, यह बताकर कि यात्रा कितनी भी कठिन हो, मंजिल जरूर मिलती है।" }
      ]
    }
  },
  gujarati: {
    "demo-1": { 
      title: "ન્યાયી રાજા અને છુપાયેલું સત્ય", 
      description: "એક બુદ્ધિશાળી રાજા આર્યન બે સ્ત્રીઓ વચ્ચેના મુશ્કેલ વિવાદને ઉકેલે છે.",
      scenes: [
        { sceneNumber: 1, title: "બુદ્ધિશાળી રાજા આર્યન", text: "એક સમયની વાત છે, એક સુંદર રાજ્યમાં આર્યન નામનો એક બુદ્ધિશાળી રાજા રહેતો હતો. તે બધાને ખૂબ જ પ્રિય હતો કારણ કે તે હંમેશા ન્યાયી નિર્ણયો લેતો હતો." },
        { sceneNumber: 2, title: "વિવાદ", text: "એક દિવસ, બે સ્ત્રીઓ એક બાળક માટે લડતી તેના દરબારમાં આવી. બંનેનો દાવો હતો કે તે બાળકની સાચી માતા છે." },
        { sceneNumber: 3, title: "ન્યાયનો ફેંસલો", text: "રાજાએ કહ્યું, 'બાળકના બે ટુકડા કરો અને બંનેને અડધો-અડધો આપી દો.' ત્યારે એક સ્ત્રી બૂમ પાડી ઊઠી, 'ના! તેને તેને આપી દો, બસ તેને મારશો નહીં!'" },
        { sceneNumber: 4, title: "સાચી માતા", text: "રાજા તરત જ સમજી ગયા કે જે માતા બાળકના જીવ માટે તેને છોડવા તૈયાર હતી, તે જ સાચી માતા છે. રાજાએ તેને ન્યાય આપ્યો અને બાળક સોંપ્યું." }
      ]
    },
    "demo-2": { 
      title: "જાદુઈ જંગલ અને બહાદુર છોકરી", 
      description: "લીલી નામની છોકરી એક જાદુઈ જંગલની શોધ કરે છે જ્યાં વૃક્ષો ગાય છે.",
      scenes: [
        { sceneNumber: 1, title: "સંગીતમય જંગલ", text: "લીલી જ્યારે જંગલમાં પ્રવેશી ત્યારે તેણે જોયું કે વૃક્ષો ગાતા હતા. તેને લાગ્યું જાણે જંગલ તેને માન આપી રહ્યું છે." },
        { sceneNumber: 2, title: "દુઃખી ઝાડ", text: "તેણે જોયું કે એક ઝાડ રડી રહ્યું હતું કારણ કે તેને નુકસાન થયું હતું. લીલીએ તેને માટીથી ફરી જીવતું કર્યું." },
        { sceneNumber: 3, title: "વરદાન", text: "તેના ઉપકારના બદલામાં ઝાડે તેને એક જાદુઈ ફળ આપ્યું જેનાથી તે પક્ષીઓની વાતો સમજી શકતી હતી." },
        { sceneNumber: 4, title: "સુખનો સૂર", text: "આખું જંગલ લીલીની દયાથી પ્રજ્વલિત થઈ ગયું અને વાતાવરણ સુંદર બની ગયું." }
      ]
    },
    "demo-3": { 
      title: "બે મિત્રો અને તોફાન", 
      description: "રોહન અને અમન ખતરનાક તોફાન દરમિયાન મિત્રતાનો સાચો અર્થ શીખે છે.",
      scenes: [
        { sceneNumber: 1, title: "સફર", text: "રોહન અને અમન પાતાળના પહાડોમાં સફર કરી રહ્યા હતા. અચાનક ભારે પવન ફૂંકાયો અને વરસાદ શરૂ થયો." },
        { sceneNumber: 2, title: "મુશ્કેલી", text: "અમનનો પગ લપસી ગયો અને તે એક ઊંડી ખીણમાં પડ્યો. રોહન ડરી ગયો પણ તેણે સાથ ન છોડ્યો." },
        { sceneNumber: 3, title: "બચાવ", text: "રોહને રસ્સી નાખીને જીવ જોખમે અમનને બહાર કાઢ્યો. બંને ભીંજાઈ ગયા હતા પણ સુરક્ષિત હતા." },
        { sceneNumber: 4, title: "મિત્રતા", text: "અમન બોલ્યો, 'તું ખરેખર મારો સાચો મિત્ર છે.' રોહને હસીને તેને ગળે લગાડ્યો." }
      ]
    },
    "demo-4": { 
      title: "ઊંઘતો ચંદ્ર અને નાનો તારો", 
      description: "થાકેલા નાના તારાની સંભાળ રાખતા ચંદ્ર વિશેની એક સુંદર વાર્તા.",
      scenes: [
        { sceneNumber: 1, title: "રાત્રિ આકાશ", text: "દર રાત્રે માયાળુ ચંદ્ર આખા આકાશનું ધ્યાન રાખતો હતો, જ્યારે નાનો તારો આખો દિવસ ચમકીને થાકી ગયો હતો." },
        { sceneNumber: 2, title: "આરામ", text: "તારાએ કહ્યું, 'ચંદ્રભાઈ, હું બહુ થાકી ગયો છું.' ચંદ્રએ તેને વહાલ કરીને વાદળોની વચ્ચે સુવડાવી દીધો." },
        { sceneNumber: 3, title: "ચાંદની લોરી", text: "ચંદ્રએ પોતાની ઠંડી ચાંદનીથી તારા પર રજઈ ઓઢાડી અને તારો મીઠી ઊંઘમાં ઊંઘી ગયો." },
        { sceneNumber: 4, title: "શાંતિ", text: "તે રાત આકાશમાં શાંતિ પ્રસરી ગઈ. સૌએ જોયું કે પ્રેમ અને આરામ સૌને પ્રિય છે." }
      ]
    },
    "demo-5": { 
      title: "પ્રામાણિક કઠિયારો", 
      description: "એક ગરીબ કઠિયારાને તેની સાચી પ્રામાણિકતાના કારણે નદીની પરી પાસેથી ઇનામ મળે છે.",
      scenes: [
        { sceneNumber: 1, title: "ખોવાયેલી કુહાડી", text: "નદી કાંઠે લાકડા કાપતા કઠિયારાની લોખંડની કુહાડી અચાનક નદીમાં પડી ગઈ. તે બિચારો રડવા લાગ્યો." },
        { sceneNumber: 2, title: "પરીની કસોટી", text: "નદીમાંથી એક પરી બહાર આવી અને તેને સોનાની કુહાડી બતાવી. કઠિયારાએ કહ્યું, 'ના, આ મારી નથી.'" },
        { sceneNumber: 3, title: "સાચું બોલવું", text: "જ્યારે પરીએ લોખંડની કુહાડી કાઢી, ત્યારે તે ખુશ થઈ ગયો. 'હા! આ જ મારી છે.' તેની સત્યતા જોઈ પરી બહુ રાજી થઈ." },
        { sceneNumber: 4, title: "સત્ય ઇનામ", text: "પરીએ તેને ત્રણેય કુહાડીઓ ભેટમાં આપી. કઠિયારાએ શીખ્યું કે પ્રામાણિકતા જ શ્રેષ્ઠ નીતિ છે." }
      ]
    },
    "demo-6": { 
      title: "ચતુર સસલું અને સિંહ", 
      description: "એક બુદ્ધિશાળી સસલું જંગલના અતિશય ક્રોધી સિંહને પોતાની બુદ્ધિથી હરાવે છે.",
      scenes: [
        { sceneNumber: 1, title: "ભયાનક સિંહ", text: "જંગલમાં એક સિંહ રોજ પશુઓને ખાઈ જતો. બધા પશુઓએ નક્કી કર્યું કે રોજ એક પશુ સિંહ પાસે જશે." },
        { sceneNumber: 2, title: "સલાહ", text: "સસલાનો વારો આવ્યો ત્યારે તે મોડો ગયો. સિંહ ગુસ્સે થયો તો સસલું કહે, 'મહારાજ, બીજો સિંહ રસ્તામાં મને રોકતો હતો!'" },
        { sceneNumber: 3, title: "કૂવો", text: "સસલું સિંહને ઊંડા કૂવા પાસે લઈ ગયું અને કહે, 'તે અંદર છે.' સિંહે અંદર જોયું અને પોતાનું પ્રતિબિંબ જોયું." },
        { sceneNumber: 4, title: "વિજય", text: "સિંહ તો અંદર કૂદી પડ્યો અને ડૂબી ગયો. સસલાએ પોતાની હોશિયારીથી આખા જંગલને બચાવ્યું." }
      ]
    },
    "demo-7": { 
      title: "દયાળુ રાજકુમારી અને ગુપ્ત બગીચો", 
      description: "રાજકુમારી એલિનાને ખબર પડે છે કે સાચી સુંદરતા એ કોઈના દયાળુ હૃદયમાંથી આવે છે.",
      scenes: [
        { sceneNumber: 1, title: "છૂપો બગીચો", text: "રાજકુમારી એલિનાને મહેલ પાછળ એક એવો બગીચો મળ્યો કે જેના ફૂલો રાત્રે ચાંદનીમાં મલકતા હતા." },
        { sceneNumber: 2, title: "રાઝ", text: "બગીચાના બારણે લખ્યું હતું—આ બગીચો એના માટે જ ખીલશે જેનું હૃદય બીજા માટે માયાળુ હોય." },
        { sceneNumber: 3, title: "સેવા", text: "એલિનાએ ગરીબો અને બીમાર પશુઓની સેવા શરૂ કરી. બગીચો દિવસે ને દિવસે વધુ સુંદર થવા લાગ્યો." },
        { sceneNumber: 4, title: "સાચી શોભા", text: "તે સમજી ગઈ કે સાચા સાજશણગાર એ આપણા સારાં કર્મોમાં છે. તેની કીર્તિ આખા રાજ્યમાં પ્રસરી ગઈ." }
      ]
    },
    "demo-8": { 
      title: "નાનકડા રોબોટનો પહેલો વરસાદ", 
      description: "સ્પાર્કી નામનો નાનકડો રોબોટ કુદરતના જાદુઈ વરસાદને પહેલી વાર અનુભવે છે.",
      scenes: [
        { sceneNumber: 1, title: "કાળા વાદળો", text: "સ્પાર્કીએ આકાશમાં જોયું કે સુરજદાદા સંતાઈ ગયા છે અને કાળા વાદળો ગહેકવા લાગ્યા છે." },
        { sceneNumber: 2, title: "ભીંજાવું", text: "હળવે હળવે વરસાદના ટીપાં તેના લોખંડના માથા પર પડ્યા. તેને લાગ્યું કે આ તો કોઈ જાદુઈ સ્પર્શ છે." },
        { sceneNumber: 3, title: "નૃત્ય", text: "તે વાદળો નીચે નાચવા લાગી ગયો. તેને માટીની મીઠી મહેક આવવા લાગી જે તેણે કદી અનુભવી નહોતી." },
        { sceneNumber: 4, title: "મેઘધનુષ", text: "વરસાદ બંધ થયો અને આકાશમાં મેઘધનુષ ખીલ્યું. રોબોટને સમજાયું કે કુદરત કેટલી સુંદર છે." }
      ]
    },
    "demo-9": { 
      title: "ડેહલિયાને પ્રેમ કરતો ડ્રેગન", 
      description: "એક ભયાનક દેખાતો ડ્રેગન ગુપ્ત રીતે બાગકામ અને નાજુક ફૂલોની સંભાળ રાખવાનું પસંદ કરે છે.",
      scenes: [
        { sceneNumber: 1, title: "ગુપ્ત બગીચો", text: "પહાડોની ટોચ પર ગ્રોમ નામનો ડ્રેગન રહેતો હતો. બધા તેને જોઈને ડરી જતા, પણ ગ્રોમ પાસે એક રાઝ હતું—તેને નાનકડા ડેહલિયા ફૂલો બહુ ગમતા." },
        { sceneNumber: 2, title: "પાણીની તંગી", text: "એક ઉનાળે પહાડ પર દુકાળ પડ્યો. ગ્રોમના ફૂલો કરમાઈ ગયા. તેણે પોતાના પંજાથી જમીનમાં ખાડો ખોદ્યો જેથી પાણી મળી રહે." },
        { sceneNumber: 3, title: "મદદની લહેર", text: "તેણે પોતાના શ્વાસમાંથી ઠંડી વરાળ કાઢી અને જમીનને ભીની કરી. ડ્રેગનની માયાએ આખા બગીચાને ફરીથી જીવિત કરી દીધો." },
        { sceneNumber: 4, title: "દયાળુ રાક્ષસ", text: "પક્ષીઓ પહાડ પર પાછા આવ્યા. ગ્રોમ સમજી ગયો કે સાચી શક્તિ ફૂલોની રક્ષા કરવામાં છે." }
      ]
    },
    "demo-10": { 
      title: "ગુંજતું શંખ", 
      description: "દરિયા કિનારે એક જાદુઈ શંખ એક નાની છોકરીને ઊંડા વાદળી સમુદ્રની વાર્તાઓ કહે છે.",
      scenes: [
        { sceneNumber: 1, title: "સોનેરી કાંઠો", text: "માયા દરિયા કિનારે ફરતી હતી ત્યારે તેને એક સપ્તરંગી શંખ મળ્યો. તેમાંથી મધુર અવાજો આવતા હતા." },
        { sceneNumber: 2, title: "પહેલી વાર્તા", text: "જેવું તેણે શંખ કાન પાસે રાખ્યું, તેમાંથી સમુદ્રની અંદરના જાદુઈ મહેલો અને પરિયોની વાતો સંભળાવા લાગી." },
        { sceneNumber: 3, title: "દરિયાના રાઝ", text: "તેણે સાંભળ્યું કે કેવી રીતે મોટી વ્હેલ માછલીઓ તારાઓ માટે ગાય છે. માયાની આંખો સામે આખું સમુદ્ર દેખાવા લાગ્યું." },
        { sceneNumber: 4, title: "દરિયાની ભેટ", text: "માયા સમજી ગઈ કે દરિયાની અંદર હજારો છુપાયેલા જાદુ છે. તેણે દરિયાને સાફ રાખવાનું વચન આપ્યું." }
      ]
    },
    "demo-11": { 
      title: "બહાદુર રમકડા સૈનિક", 
      description: "એક વફાદાર રમકડા સૈનિક બાળકના સપનાને રાત્રિના ડરામણા પડછાયાઓથી બચાવે છે.",
      scenes: [
        { sceneNumber: 1, title: "રાત્રિનો ચોકીદાર", text: "જ્યારે લાઈટો બંધ થઈ જાય, ત્યારે કેપ્ટન ટીન સૂતો નહીં. તે પલંગના છેડે પોતાની તલવાર લઈને તૈયાર રહેતો." },
        { sceneNumber: 2, title: "પડછાયા રાક્ષસ", text: "એક કાળો પડછાયો બાળકના સપનામાં આવવાનો પ્રયત્ન કરતો હતો, ત્યારે ટીને તેને રોકી રાખ્યો." },
        { sceneNumber: 3, title: "સાચી હિંમત", text: "નાનકડા સૈનિકે નાઈટ-લેમ્પના પ્રકાશનો ઉપયોગ કરીને અંધારાને ભગાડી દીધો. હિંમત આકારથી નહીં પણ હૃદયથી મપાય છે." },
        { sceneNumber: 4, title: "સવારનો સૂરજ", text: "સવારનો સૂરજ ઉગતા જ પડછાયા ગાયબ થઈ ગયા. સૈનિક રાજી થયો કે તેનો મિત્ર નિરાંતે સૂઈ શક્યો. વફાદારી જ સૌથી મોટી ઢાલ છે." }
      ]
    },
    "demo-13": { 
      title: "બે મિત્રો અને તોફાન", 
      description: "હિમાલયમાં ભીષણ તોફાન વચ્ચે રોહન અને અમન મિત્રતાનો સાચો અર્થ સમજે છે.",
      scenes: [
        { sceneNumber: 1, title: "ઊંચું મેદાન", text: "રોહન અને અમન હિમાલયના ઊંચા મેદાનમાં ઘેટાં ચરાવી રહ્યા હતા. આકાશ નીલમ જેવું બ્લૂ હતું." },
        { sceneNumber: 2, title: "કાળા વાદળો", text: "અચાનક આકાશમાં કાળા વાદળો છવાઈ ગયા અને જોરદાર પવન ફૂંકાવા લાગ્યો. વાતાવરણ ડરામણું બની ગયું." },
        { sceneNumber: 3, title: "ગુફા", text: "રોહનનો પગ લપસ્યો પણ અમને તેને બચાવી લીધો. બંને એક નાની ગુફામાં ભરાઈ ગયા અને એકાબીજાને હિંમત આપી." },
        { sceneNumber: 4, title: "સૂર્યોદય", text: "સવારનો સૂરજ ઉગ્યો ત્યારે તેઓ સુરક્ષિત હતા. તેમની મિત્રતા પહાડો જેવી મજબૂત બની ગઈ." }
      ]
    },
    "demo-14": { 
      title: "છેલ્લું સફરજન વહેંચવું", 
      description: "દુષ્કાળના સમયમાં, બે હરીફો વહેંચવાની ખુશી અને મિત્રતાની શક્તિ શોધે છે.",
      scenes: [
        { sceneNumber: 1, title: "સૂકી જમીન", text: "લાંબા દુષ્કાળને કારણે નદી સુકાઈ ગઈ હતી અને ખાવાનું મળવું મુશ્કેલ હતું. સેમ અને જેક કંઈક ખાવાનું શોધી રહ્યા હતા." },
        { sceneNumber: 2, title: "શોધ", text: "તેમને એક સૂકા મેદાનમાં એક વૃક્ષ નીચે એક ચમકતું લાલ સફરજન મળ્યું." },
        { sceneNumber: 3, title: "વહેંચણી", text: "લડવાને બદલે સેમે સફરજનના બે સરખા ભાગ કર્યા અને મોટો ભાગ જેકને આપ્યો. જાદુ તો ત્યારે થયો જ્યારે બંનેના પેટ ભરાઈ ગયા." },
        { sceneNumber: 4, title: "નવો મિત્ર", text: "વરસાદ શરૂ થયો અને સફરજન વહેંચવાથી તેમની કાયમી મિત્રતા શરૂ થઈ. વહેંચવામાં જ અસલી સુખ છે." }
      ]
    },
    "demo-17": { 
      title: "બિસ્કિટના જારનું રહસ્ય", 
      description: "નાનો જાસૂસ મિલો તેના મેગ્નિફાઈંગ ગ્લાસની મદદથી ગુમ થયેલા બિસ્કિટનું રહસ્ય ઉકેલે છે.",
      scenes: [
        { sceneNumber: 1, title: "ખાલી જાર", text: "બિસ્કિટનું જાર ખાલી હતું. મિલોને બહુ નવાઈ લાગી કે આ બિસ્કિટ ગયા ક્યાં?" },
        { sceneNumber: 2, title: "તપાસ", text: "ચશ્માથી જોતા તેને જમીન પર બિલાડીના વાદળી વાળ મળ્યા. તે સમજી ગયો કે આ કોનું કામ છે." },
        { sceneNumber: 3, title: "આરોપી", text: "વ્હિસ્કર્સ બિલાડી સોફા નીચે સૂતી હતી, તેની નાક પર બિસ્કિટની કણીઓ ચોંટી હતી." },
        { sceneNumber: 4, title: "મિત્રતા", text: "દરેક વસ્તુ વહેંચવી જોઈએ, મિલોએ તેને માફ કર્યો અને સાથે દૂધ પીધું." }
      ]
    },
    "demo-18": { 
      title: "ઉડતું કાર્ડબોર્ડ બોક્સ", 
      description: "એક બાળકની કલ્પના શક્તિ એક સાદા બોક્સને આકાશમાં ઉડતા વિમાનમાં બદલી નાખે છે.",
      scenes: [
        { sceneNumber: 1, title: "ઉડ્ડયન", text: "લિયોને એક મોટું બોક્સ મળ્યું. તે માત્ર બોક્સ નહોતું, પણ દુનિયાનું સૌથી ઝડપી વિમાન હતું!" },
        { sceneNumber: 2, title: "તારામંડળ", text: "તે ઝૂમ કરીને લિવિંગ રૂમના પહાડો અને તારાઓ વચ્ચેથી ઉડવા લાગ્યો." },
        { sceneNumber: 3, title: "મુલાકાત", text: "ત્યાં તેને તેની બિલાડી મળી જે એક વિદેશી ગ્રહની રહેવાસી લાગતી હતી." },
        { sceneNumber: 4, title: "પરત", text: "સફર પૂરી કરી લિયો તેના ઓરડામાં પધારી ગયો, નવા સાહસની રાહ જોતો." }
      ]
    },
    "demo-21": { 
      title: "ચાંદની નાઈટ લાઈટ", 
      description: "એક નાની છોકરી ચાંદામામાને રોકાવા કહે છે જેથી તેને રાત્રે ડર ન લાગે.",
      scenes: [
        { sceneNumber: 1, title: "અંધારાનો ડર", text: "લીલીને ભૂતિયા પડછાયાઓનો ડર લાગતો હતો. તેણે ચાંદાને વિનંતી કરી—મને છોડીને ના જશો." },
        { sceneNumber: 2, title: "વચન", text: "ચાંદાએ પોતાની ચાંદની મોકલી જે લીલીના રૂમમાં અજવાળું પાથરી દીધું." },
        { sceneNumber: 3, title: "મીઠાં સ્વપ્ન", text: "હવે તેને જરાય ડર નહોતો અને તે ઘસઘસાટ ઊંઘી ગઈ." },
        { sceneNumber: 4, title: "સવાર", text: "જ્યારે તે જાગી, ત્યારે તેને સમજાયું કે અજવાળું તો હંમેશા આપણી સાથે જ છે." }
      ]
    },
    "demo-22": { 
      title: "તારલા જેવી ઘેટાં ગણવી", 
      description: "ઊંડી અને શાંત ઊંઘ મેળવવા માટે જાદુઈ ઘેટાંની ગણતરી કરો.",
      scenes: [
        { sceneNumber: 1, title: "પહેલી ઘેટાં", text: "સપનાની ખીણમાં, પહેલી ઘેટાંએ ચંદ્ર ઉપરથી છલાંગ લગાવી. તે રૂ જેવી નરમ હતી." },
        { sceneNumber: 2, title: "બે અને ત્રણ", text: "તેઓ માત્ર ઘેટાં નહોતી, પણ ઊંઘની રખેવાળી કરતી સખીઓ હતી જે શાંતિ લાવતી હતી." },
        { sceneNumber: 3, title: "છેલ્લી ગણતરી", text: "દસમી ઘેટાંના કૂદતા જ આંખો ભારે થવા લાગી અને ઊંઘ આવવા લાગી." },
        { sceneNumber: 4, title: "ઊંઘ અને સપના", text: "ગણતરી પૂરી થઈ અને સપનાની મુસાફરી શરૂ થઈ ગઈ." }
      ]
    },
    "demo-25": { 
      title: "પ્રામાણિક કઠિયારો", 
      description: "એક ગરીબ કઠિયારાની સચ્ચાઈ જોઈને જળ પરી તેને સોના અને ચાંદીની કુહાડી ઇનામમાં આપે છે.",
      scenes: [
        { sceneNumber: 1, title: "ખોવાયેલી કુહાડી", text: "નદી કાંઠે લાકડા કાપતા કઠિયારાની લોખંડની કુહાડી અચાનક નદીમાં પડી ગઈ. તે બિચારો રડવા લાગ્યો." },
        { sceneNumber: 2, title: "પરીની કસોટી", text: "નદીમાંથી એક પરી બહાર આવી અને તેને સોનાની કુહાડી બતાવી. કઠિયારાએ કહ્યું, 'ના, આ મારી નથી.'" },
        { sceneNumber: 3, title: "સાચું બોલવું", text: "જ્યારે પરીએ લોખંડની કુહાડી કાઢી, ત્યારે તે ખુશ થઈ ગયો. તેની સત્યતા જોઈ પરી બહુ રાજી થઈ." },
        { sceneNumber: 4, title: "સત્યનું ઇનામ", text: "પરીએ તેને ત્રણેય કુહાડીઓ ભેટમાં આપી. પ્રામાણિકતા જ શ્રેષ્ઠ નીતિ છે." }
      ]
    },
    "demo-26": { 
      title: "છોકરો અને વરુ", 
      description: "જૂઠું બોલવાનું પરિણામ શું આવે છે એ વિશેની એક શિખામણ આપે તેવી વાર્તા.",
      scenes: [
        { sceneNumber: 1, title: "મજાક", text: "એક છોકરો રોજ ઘેટાં ચરાવવા જતો. તેણે મજાક કરવા બૂમ પાડી—વરુ આવ્યું! વરુ આવ્યું!" },
        { sceneNumber: 2, title: "ગામવાસીઓ", text: "લોકો દોડીને આવ્યા પણ ત્યાં કોઈ વરુ નહોતું. છોકરો હસવા લાગ્યો અને બધા ગુસ્સે થયા." },
        { sceneNumber: 3, title: "સાચું વરુ", text: "એક દિવસ ખરેખર વરુ આવ્યું. છોકરો બહુ રડ્યો પણ કોઈ ન આવ્યું કારણ કે બધાને લાગ્યું તે મજાક કરે છે." },
        { sceneNumber: 4, title: "બોધ", text: "જૂઠું બોલનાર પર કોઈ વિશ્વાસ નથી કરતું, ભલે તે સાચું બોલતો હોય." }
      ]
    },
    "demo-29": { 
      title: "ચતુર સસલું", 
      description: "મોટા કદના સિંહને હરાવવા માટે સસલાએ કેવી રીતે પોતાની બુદ્ધિ વાપરી એની વાર્તા.",
      scenes: [
        { sceneNumber: 1, title: "ડરામણો સિંહ", text: "જંગલમાં એક સિંહ રોજ પશુઓને ખાઈ જતો. બધા બહુ ડરેલા રહેતા હતા." },
        { sceneNumber: 2, title: "સસલાનો વારો", text: "સસલાએ કહ્યું—મહારાજ, રસ્તામાં બીજો સિંહ મળ્યો હતો, તેણે મને રોક્યો હતો!" },
        { sceneNumber: 3, title: "કૂવો", text: "સસલું સિંહને કૂવા પાસે લઈ ગયું. સિંહે અંદર જોયું અને પોતાનું પ્રતિબિંબ જોયું." },
        { sceneNumber: 4, title: "જીત", text: "સિંહ કૂવામાં કૂદી પડ્યો અને સસલાએ પોતાની હોશિયારીથી બધાની જાન બચાવી." }
      ]
    },
    "demo-30": { 
      title: "બહાદુર સિંહનું બચ્ચું", 
      description: "હિંમત એટલે ડરનું ન હોવું એ નહીં, પણ ડર છતાં સાચું કામ કરવું.",
      scenes: [
        { sceneNumber: 1, title: "નાના પંજા", text: "નાનકડું સિંહનું બચ્ચું ડરપોક હતું. તેને નાની વસ્તુઓથી પણ ડર લાગતો હતો." },
        { sceneNumber: 2, title: "મિત્રની મદદ", text: "એક મિત્ર ખાડામાં ફસાઈ ગયો હતો. સિંહના બચ્ચાએ પોતાનો ડર છોડીને તેને મદદ કરી." },
        { sceneNumber: 3, title: "હિંમત", text: "તેણે બહુ મહેનત કરી અને પથ્થર ખસેડ્યા. તેને પોતાની અંદર નવી હિંમત મળી." },
        { sceneNumber: 4, title: "નવો રાજા", text: "બધાએ તેના વખાણ કર્યા. હિંમત પાઠ શીખવી જાય છે." }
      ]
    },
    "demo-33": { 
      title: "રાજકુમારી અને બગીચો", 
      description: "રાજકુમારી એલિના શીખે છે કે સાચી સુંદરતા દયાળુ હૃદયમાં રહેલી છે.",
      scenes: [
        { sceneNumber: 1, title: "કરમાયેલા ફૂલ", text: "રાજકુમારીનો બગીચો સુકાઈ ગયો હતો. તે બહુ ઉદાસ હતી." },
        { sceneNumber: 2, title: "પ્રેમ અને પાણી", text: "તેણે પોતે ફૂલોની સેવા કરી અને પ્રેમ આપ્યો. તેણે ગાઈને તેમને ખુશ કર્યા." },
        { sceneNumber: 3, title: "જાદુ", text: "પ્રેમ આપતા જ ફૂલો ફરીથી મહેકવા લાગ્યા. આ જ સાચો જાદુ હતો." },
        { sceneNumber: 4, title: "સુંદરતા", text: "બગીચો ફરી સુંદર બની ગયો અને આખું મહેલ ખુશીથી ભરાઈ ગયું." }
      ]
    },
    "demo-34": { 
      title: "રાજકુમારી અને વટાણા", 
      description: "એક નાનકડા વટાણાથી કેવી રીતે સાચી રાજકુમારીની ઓળખ થઈ તેની કલાસિક વાર્તા.",
      scenes: [
        { sceneNumber: 1, title: "તોફાન", text: "એક રાત્રે તોફાનમાં એક છોકરી મહેલ આવી. તે ભીંજાયેલી હતી." },
        { sceneNumber: 2, title: "પથારી", text: "રાણીએ તેની નીચે એક નાનકડો વટાણો મૂક્યો અને ઉપર વીસ ગાદલા નાખ્યા." },
        { sceneNumber: 3, title: "જાગરણ", text: "છોકરી આખી રાત સૂઈ ન શકી કારણ કે તેને કંઈક ખૂંચતું હતું." },
        { sceneNumber: 4, title: "સાચી રાજકુમારી", text: "માત્ર સાચી રાજકુમારી જ આટલી કોમળ હોઈ શકે. રાજા-રાણી ખુશ થઈ ગયા." }
      ]
    },
    "demo-37": { 
      title: "ગણેશની બુદ્ધિ", 
      description: "માતા-પિતાની પ્રદક્ષિણા એટલે આખી પૃથ્વીની ભક્તિ, એવી ગણપતિદાદાની વાત.",
      scenes: [
        { sceneNumber: 1, title: "સ્પર્ધા", text: "શિવ અને પાર્વતીએ તેમના પુત્રો માટે એક સ્પર્ધા રાખી. જે પૃથ્વીની સૌથી પહેલા પ્રદક્ષિણા કરશે, તે આ જાદુઈ ફળ જીતશે!" },
        { sceneNumber: 2, title: "કાર્તિકેયની ઉડાન", text: "કાર્તિકેય તેમના મોર પર બેસીને સમુદ્રો, પર્વતો અને જમીનોની ઝડપથી પ્રદક્ષિણા કરવા નીકળી પડ્યા." },
        { sceneNumber: 3, title: "સાચી દુનિયા", text: "ગણેશજી પાસે મોર નહોતો. તેમની પાસે એક નાનકડો ઉંદર હતો. તેમણે તેમના માતા-પિતાની આસપાસ ત્રણ વાર પ્રદક્ષિણા કરી." },
        { sceneNumber: 4, title: "પ્રેમનું ફળ", text: "'મારા માતા-પિતા જ મારી દુનિયા છે,' તેમણે કહ્યું. શિવજી હસ્યા અને તેમને ફળ આપ્યું. બુદ્ધિ એ ઝડપ કરતાં મોટી છે." }
      ]
    },
    "demo-38": { 
      title: "કૃષ્ણની વાંસળી", 
      description: "કૃષ્ણ ભગવાનની વાંસળીનો સુર આખી દુનિયા અને પશુ-પંખીઓને ઘેલું લગાડે છે.",
      scenes: [
        { sceneNumber: 1, title: "વાંસળીનો સુર", text: "કનૈયાએ યમુના કાંઠે વાંસળી વગાડવાનું શરૂ કર્યું. પક્ષીઓ મૌન થઈ ગયા." },
        { sceneNumber: 2, title: "ગાયો", text: "બધી ગાયો ઘાસ ખાવાનું ભૂલીને દોડી આવી. વાતાવરણમાં શાંતિ છવાઈ ગઈ." },
        { sceneNumber: 3, title: "નૃત્ય", text: "વૃક્ષો પણ ડોલવા લાગ્યા અને ગોપીઓ નૃત્ય કરવા લાગી." },
        { sceneNumber: 4, title: "પ્રેમ", text: "કૃષ્ણની વાંસળીમાં આખી સૃષ્ટિનો પ્રેમ વણાયેલો હતો." }
      ]
    },
    "demo-41": { 
      title: "અભિમાની મોર", 
      description: "સુંદરતા કરતા આપણો સ્વભાવ વધુ મહત્વનો છે એ શીખ આપતી વાર્તા.",
      scenes: [
        { sceneNumber: 1, title: "ઘમંડ", text: "એક મોરને તેના પીંછા પર બહુ ગર્વ હતો. તે બગલાને નફરત કરતો હતો." },
        { sceneNumber: 2, title: "ઉડાન", text: "બગલાએ કહ્યું—મારા પીંછા સાદા છે પણ હું ઊંચે ઉડી શકું છું, તું નહીં." },
        { sceneNumber: 3, title: "વરસાદ", text: "વરસાદમાં મોર નાચી શક્યો પણ ઉડી ન શક્યો. બગલો તો આકાશમાં જતો રહ્યો." },
        { sceneNumber: 4, title: "સમજણ", text: "દેખાવ કરતા ગુણ વધુ જરૂરી છે. મોરનો ઘમંડ તૂટી ગયો." }
      ]
    },
    "demo-42": { 
      title: "બાજની ઊંચી ઉડાન", 
      description: "આકાશની ઊંચાઈએથી દુનિયા જોવાની દ્રષ્ટિ અને હિંમત કેળવવાની વાત.",
      scenes: [
        { sceneNumber: 1, title: "ઘોંસલો", text: "બાજનું બચ્ચું ઉડતા પહેલા બહુ ડરતું હતું. તે પથ્થર પકડી રાખતું હતું." },
        { sceneNumber: 2, title: "પ્રોત્સાહન", text: "તેની માતાએ તેને આકાશમાં ધકેલ્યું. તે પડવા લાગ્યું પણ પછી તેણે પાંખો ફેલાવી." },
        { sceneNumber: 3, title: "ઉડવું", text: "હવે તે આકાશનો રાજા હતો. તેને દુનિયા સુંદર લાગી." },
        { sceneNumber: 4, title: "લક્ષ્ય", text: "જો આપણે પ્રયત્ન કરીએ તો આકાશ જેટલી ઊંચાઈ મેળવી શકીએ છીએ." }
      ]
    },
    "demo-45": { 
      title: "જાદુઈ જંગલ", 
      description: "એવું જંગલ જ્યાં વૃક્ષો વાતો કરે છે અને પવિત્રતાનો જાદુ ચારેબાજુ ફેલાયેલો છે.",
      scenes: [
        { sceneNumber: 1, title: "પ્રવેશ", text: "જ્યારે આર્યન જંગલમાં ગયો, ત્યાંના ઝાડ પ્રકાશ આપતા હતા." },
        { sceneNumber: 2, title: "મધુર અવાજ", text: "પવન ફૂંકાતા પાંદડાઓમાંથી મધુર સંગીત સંભળાતું હતું." },
        { sceneNumber: 3, title: "શાંતિ", text: "ત્યાં કોઈ હિંસક પ્રાણી નહોતું, બધા પ્રેમથી સાથે રહેતા હતા." },
        { sceneNumber: 4, title: "સ્વર્ગ", text: "આર્યનને લાગ્યું કે તે કોઈ સાક્ષાત્ જાદુઈ દુનિયામાં આવી ગયો છે." }
      ]
    },
    "demo-46": { 
      title: "ગાતી નદી", 
      description: "જો તમે ધ્યાનથી સાંભળો તો નદીનું વહેતું પાણી તમને ભવિષ્યની વાતો સંભળાવશે.",
      scenes: [
        { sceneNumber: 1, title: "ઝરણું", text: "પહાડોમાંથી એક નાનકડું ઝરણું ગીતો ગાતું નીચે આવતું હતું." },
        { sceneNumber: 2, title: "પથ્થરો", text: "પથ્થરો પર અફળાતી નદીનો અવાજ મધુર ઘંટડી જેવો લાગતો હતો." },
        { sceneNumber: 3, title: "તરસ છિપાવવી", text: "બધા જંગલના પ્રાણીઓ ત્યાં પાણી પીવા આવતા. નદી મલકાતી હતી." },
        { sceneNumber: 4, title: "સાગર", text: "અંતે નદી દરિયાને મળી ગઈ અને પોતાની મુસાફરી પૂરી કરી." }
      ]
    }
  }
};

router.get("/demo-stories", async (req: Request, res: Response) => {
  const lang = (req.query.lang as string) || "english";
  const stories = await getDemoStories();

  if (lang === "english") {
    return res.json(stories);
  }

  // Use hardcoded translations if available
  const translations = DEMO_TRANSLATIONS[lang];
  if (translations) {
    const translatedStories = stories.map((story: Story) => {
      const trans = translations[story.id];
      if (trans) {
        return {
          ...story,
          title: trans.title,
          description: trans.description,
          language: lang,
          scenes: story.scenes.map((scene: StoryScene) => {
            const transScene = trans.scenes?.find((ts: any) => ts.sceneNumber === scene.sceneNumber);
            return {
              ...scene,
              title: transScene?.title || scene.title,
              text: transScene?.text || scene.text
            };
          })
        };
      }
      return { ...story, language: lang };
    });
    return res.json(translatedStories);
  }

  try {
    const cachePath = path.join(process.cwd(), "src", "data", `demo-stories-${lang}.json`);
    try {
      const cached = await fs.readFile(cachePath, "utf8");
      console.log(`✅ [Translation] Serving cached ${lang} stories`);
      return res.json(JSON.parse(cached));
    } catch {
      // Cache miss — translate now
    }

    console.log(`🌍 Translating ${stories.length} demo stories to ${lang} via Gemini...`);

    const storiesToTranslate = stories.map((s: Story) => ({
      id: s.id,
      title: s.title,
      description: s.description,
      scenes: s.scenes.map((sc: StoryScene) => ({ sceneNumber: sc.sceneNumber, title: sc.title, text: sc.text }))
    }));

    const langLabel = lang === "hindi" ? "Hindi (Devanagari script)" : lang === "gujarati" ? "Gujarati (Gujarati script)" : lang;
    const translationPrompt = `Translate the following children's book stories into ${langLabel}.
Return a JSON object with a "stories" array. Each story must have: "id", "title", "description", "scenes" (array of objects with "sceneNumber", "title", "text").
Do NOT change "id". Keep it authentic and natural for children.

${JSON.stringify({ stories: storiesToTranslate })}`;

    const translated = await translateWithGemini(translationPrompt);
    const translatedStories = translated.stories || [];

    const result = stories.map((originalStory: Story) => {
      const trans = translatedStories.find((t: any) => t.id === originalStory.id) || {};
      return {
        ...originalStory,
        title: trans.title || originalStory.title,
        description: trans.description || originalStory.description,
        language: lang,
        scenes: originalStory.scenes.map((originalScene: StoryScene) => {
          const transScene = trans.scenes?.find((ts: any) => ts.sceneNumber === originalScene.sceneNumber) || {};
          return {
            ...originalScene,
            title: transScene.title || originalScene.title,
            text: transScene.text || originalScene.text
          };
        })
      };
    });

    // Cache to disk for future requests
    await fs.writeFile(cachePath, JSON.stringify(result, null, 2), "utf8").catch(() => {});
    console.log(`✅ [Translation] Translated and cached ${lang} stories`);

    return res.json(result);
  } catch (err) {
    console.warn("Library translation failed, returning English originals:", (err as Error).message);
    return res.json(stories.map((s: Story) => ({ ...s, language: lang })));
  }
});

router.post("/generate-story", async (req: Request, res: Response) => {
  const { prompt, category, language, mode, numScenes = 4 } = req.body;
  try {
    const langInstruction = getLanguageInstruction(language);
    const categoryStyle = getCategoryStyle(category);
    const isGame = mode === "game";
    const sceneCount = Math.min(Math.max(numScenes, 2), 8);

    // 1. Gemini Priority (User requested)
    if (process.env.GEMINI_API_KEY) {
      try {
        console.log("🚀 Using Gemini for story generation (PRIMARY)...");
        const story = await generateStoryWithGemini(prompt, category, language, mode, numScenes);
        return res.json({ ...story, mode: mode || 'image', language });
      } catch (e) {
        console.error("Gemini failed:", (e as Error).message);
      }
    }

    // 2. Grok Fallback
    if (process.env.XAI_API_KEY && process.env.XAI_API_KEY !== "YOUR_XAI_KEY") {
      try {
        console.log("🚀 Using Grok (xAI) for story generation...");
        const story = await generateStoryWithGrok(prompt, category, language, mode);
        return res.json({ ...story, mode: mode || 'image', language });
      } catch (e) {
        console.error("Grok failed:", (e as Error).message);
      }
    }

    // 3. OpenAI Fallback
    const systemPrompt = `You are a master storyteller creating immersive, cinematic stories. ${langInstruction}
Requirements: Exactly ${sceneCount} scenes, Pixar/Disney style image prompts in English. 
${isGame ? "CRITICAL: You MUST provide exactly 5 quiz questions based on the story in a 'quizQuestions' array. Each has 'question' (string), 'options' (string array of 4), 'correctIndex' (number 0-3), and 'explanation' (string)." : ""}`;

    try {
      if (process.env.OPENAI_API_KEY) {
        console.log("🚀 Using OpenAI (fallback)...");
        const completion = await openai.chat.completions.create({
          model: "gpt-4o",
          messages: [
            { role: "system", content: systemPrompt },
            { role: "user", content: `Create a story about: ${prompt}. ${isGame ? "Include game choices in scenes and 5 questions at the end." : ""}\n\nIMPORTANT: Use ${language} for ALL story fields (title, text, description, choices). ONLY imagePrompt must be in English.\n\nFormat: { "title": "...", "scenes": [{ "sceneNumber": 1, "title": "...", "text": "...", "imagePrompt": "...", "choices": [] }], "quizQuestions": [] }` }
          ],
          response_format: { type: "json_object" }
        });

        const story = JSON.parse(completion.choices[0].message.content || "{}");
        return res.json({ ...story, id: `story-${Date.now()}`, category, language, mode });
      }
    } catch (e) {
      console.warn("OpenAI failed:", (e as Error).message);
    }

    // 4. Free AI Fallback (Pollinations)
    try {
      console.log("🚀 Using Pollinations (FREE) fallback...");
      const freePrompt = `${systemPrompt}\n\nUser Input: ${prompt}\n\nReturn EXACTLY a JSON object. No words outside JSON. No code blocks. IMPORTANT: Use ${language} for ALL story fields (title, text, description, choices). ONLY imagePrompt must be in English. Format: { "title": "...", "scenes": [{ "sceneNumber": 1, "title": "...", "text": "...", "imagePrompt": "...", "choices": [] }], "quizQuestions": [] }`;
      
      const response = await fetch("https://text.pollinations.ai/", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [{ role: "user", content: freePrompt }],
          model: "openai", // Pollinations uses this to denote standard LLM
          json: true
        })
      });

      if (response.ok) {
        const text = await response.text();
        const story = JSON.parse(text.replace(/```json/g, "").replace(/```/g, "").trim());
        return res.json({ ...story, id: `free-story-${Date.now()}`, category, language, mode });
      }
    } catch (e) {
        console.warn("Pollinations failed:", (e as Error).message);
    }

    throw new Error("All AI providers failed to generate story");
  } catch (err) {
    console.error("Story generation failed:", err);
    return res.json(getFallbackStory(prompt, category, language, mode));
  }
});

router.post("/generate-story-image", async (req: Request, res: Response) => {
  try {
    const { prompt, category, faceImage, sceneNumber } = req.body;
    const categoryStyle = getCategoryStyle(category || "custom");
    const fullPrompt = `${prompt}, ${categoryStyle}, children's storybook illustration, vibrant colors, magical atmosphere, high quality digital art`;

    console.log(`🎨 [Router] Generating image for: "${prompt.slice(0, 50)}..." (Face: ${faceImage ? "yes" : "no"})`);

    // 1. Replicate InstantID (Premium Face Preservation)
    if (faceImage && process.env.REPLICATE_API_TOKEN) {
      try {
        console.log("🎨 [Router] Using Replicate InstantID for face consistency...");
        const b64 = await generateInstantIDImage(prompt, faceImage);
        return res.json({ b64_json: b64, url: null });
      } catch (err: any) {
        console.warn(`⚠️ Replicate InstantID failed: ${err.message}. Falling back to standard generation.`);
      }
    }

    // 2. Replicate Flux (High Quality Standard)
    if (process.env.REPLICATE_API_TOKEN) {
      try {
        console.log("🎨 [Router] Using Replicate Flux for high quality scene...");
        const b64 = await generateReplicateImage(fullPrompt);
        return res.json({ b64_json: b64, url: null });
      } catch (err: any) {
        console.warn(`⚠️ Replicate Flux failed: ${err.message}. Falling back to OpenAI/Free tiers.`);
      }
    }

    // 3. OpenAI DALL-E 3 Priority
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log(`🎨 [Router] Generating image via OpenAI (DALL-E 3): "${fullPrompt.slice(0, 60)}..."`);
        const buffer = await generateImageBuffer(fullPrompt, "1024x1024");
        const b64 = buffer.toString("base64");
        console.log(`✅ [Router] Image generated via OpenAI: ${buffer.length} bytes`);
        return res.json({ b64_json: b64, url: null });
      } catch (openaiErr: any) {
        console.warn(`⚠️ OpenAI Image Generation failed: ${openaiErr.message}. Falling back to Pollinations.`);
      }
    }

    // 4. Free AI Fallback (Pollinations + Local Files)
    try {
      console.log(`🎨 [Router] Falling back to local/free generator: "${prompt.slice(0, 40)}..."`);
      const b64 = await getLocalDemoImage(category, prompt, sceneNumber);
      if (b64) {
        return res.json({ b64_json: b64, url: null });
      }
    } catch (e: any) {
      console.warn("⚠️ getLocalDemoImage failed:", e.message);
    }

    // 5. Direct Pollinations URL Fallback (Last resort)
    const seed = Math.floor(Math.random() * 999999);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(fullPrompt)}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;
    return res.json({ b64_json: null, url: imageUrl });

  } catch (err) {
    console.error("❌ Image Generation FATAL ERROR:", (err as Error).message);
    return res.status(500).json({ error: (err as Error).message });
  }
});

router.post("/generate-narration", async (req: Request, res: Response) => {
  try {
    const { text, language, voice: requestedVoice } = req.body;
    console.log(`🎙️ Narration Request: lang=${language}, voice=${requestedVoice}, text="${text?.slice(0, 50)}..."`);
    
    if (!text) {
      console.warn("⚠️ No text provided for narration");
      return res.status(400).json({ error: "No text provided" });
    }

    // Attempt 1: ElevenLabs (Primary - per user request)
    if (process.env.ELEVENLABS_API_KEY) {
      try {
        const voiceMap: Record<string, string> = {
          shimmer: "EXAVITQu4vr4xnSDxMaL", // Bella
          alloy: "pNInz6obpg8n9icWJymf",  // Adam
          echo: "pNInz6obpg8n9icWJymf",   // Adam
          nova: "21m00Tcm4TlvDq8ikWAM"    // Rachel
        };
        const voiceId = voiceMap[requestedVoice] || voiceMap.shimmer;
        
        console.log(`🎙️ [ElevenLabs] Attempting generation: voiceId=${voiceId}, lang=${language}`);
        const audioBuffer = await generateElevenLabsAudio(text, voiceId);
        console.log(`✅ [ElevenLabs] Success (${audioBuffer.length} bytes)`);
        
        return res.json({ 
          audioBase64: audioBuffer.toString("base64"), 
          format: "mp3" 
        });
      } catch (e: any) {
        console.warn(`⚠️ [ElevenLabs] Failed: ${e.message}. No more AI narration fallbacks available.`);
      }
    }

    // Attempt 2: OpenAI TTS (Secondary - uses the same key as story/image)
    if (process.env.OPENAI_API_KEY) {
      try {
        console.log(`🎙️ [OpenAI TTS] Attempting generation: voice=${requestedVoice || "shimmer"}, lang=${language}`);
        
        // Map common voice names to OpenAI's supported voices
        const openAIVoices = ["alloy", "echo", "fable", "onyx", "nova", "shimmer"];
        const voice = openAIVoices.includes(requestedVoice) ? requestedVoice : getVoiceForLanguage(language, requestedVoice);

        const mp3 = await (openai as any).audio.speech.create({
          model: "tts-1",
          voice: voice,
          input: text,
        });

        const buffer = Buffer.from(await mp3.arrayBuffer());
        console.log(`✅ [OpenAI TTS] Success (${buffer.length} bytes)`);
        
        return res.json({ 
          audioBase64: buffer.toString("base64"), 
          format: "mp3" 
        });
      } catch (e: any) {
        console.warn(`⚠️ [OpenAI TTS] Failed: ${e.message}`);
      }
    }

    // Fallback: Signal frontend to use browser-side speech synthesis
    console.warn("⚠️ All AI narration providers failed or were unavailable. Falling back to browser synthesis.");
    return res.json({ 
      audioBase64: null, 
      error: "AI narration currently unavailable",
      note: "ElevenLabs/OpenAI failed, falling back to local speech synthesis"
    });
  } catch (err: any) {
    console.error("❌ Narration FATAL ERROR:", err.message);
    return res.status(500).json({ error: err.message });
  }
});


router.post("/generate-video", async (req: Request, res: Response) => {
  try {
    const { prompt } = req.body;
    if (process.env.XAI_API_KEY) {
      const video_url = await generateGrokVideo(prompt);
      return res.json({ video_url, status: 'processing' });
    }
    return res.status(501).json({ error: "Video generation only available with xAI/Grok" });
  } catch (e) {
    return res.status(500).json({ error: (e as Error).message });
  }
});

export default router;
