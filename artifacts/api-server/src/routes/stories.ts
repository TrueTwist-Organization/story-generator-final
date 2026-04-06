import { Router, type IRouter, Request, Response } from "express";
import fs from "node:fs/promises";
import path from "node:path";
import { generateStoryWithGemini, generateGeminiImage, translateWithGemini } from "../lib/gemini";
import { generateStoryWithGrok, generateGrokImage, generateGrokVideo } from "../lib/xai";
import { generateDeepAIImage } from "../lib/deepai";
import {
  generateImageBuffer,
} from "@workspace/integrations-openai-ai-server/image";
import { generateElevenLabsAudio } from "../lib/elevenlabs";

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
      return "Write the story entirely in Hindi (Devanagari script). Use simple, expressive Hindi storytelling style.";
    case "gujarati":
      return "Write the story entirely in Gujarati (Gujarati script). Use traditional Gujarati storytelling style.";
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
    }
  }
};

router.get("/demo-stories", async (req: Request, res: Response) => {
  const lang = (req.query.lang as string) || "english";
  const stories = await getDemoStories();

  if (lang === "english") {
    return res.json(stories);
  }

  try {
    // Check disk cache first to avoid repeated API calls
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
            { role: "user", content: `Create a story about: ${prompt}. ${isGame ? "Include game choices in scenes and 5 questions at the end." : ""}\n\nFormat: { "title": "...", "scenes": [{ "sceneNumber": 1, "title": "...", "text": "...", "imagePrompt": "...", "choices": [] }], "quizQuestions": [] }` }
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
      const freePrompt = `${systemPrompt}\n\nUser Input: ${prompt}\n\nReturn EXACTLY a JSON object. No words outside JSON. No code blocks. Format: { "title": "...", "scenes": [{ "sceneNumber": 1, "title": "...", "text": "...", "imagePrompt": "...", "choices": [] }], "quizQuestions": [] }`;
      
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
    const { prompt, category, faceImage } = req.body;
    const categoryStyle = getCategoryStyle(category || "custom");
    const fullPrompt = `${prompt}, ${categoryStyle}, children's storybook illustration, vibrant colors, magical atmosphere, high quality digital art`;

    console.log(`🎨 [Router] Generating image for: "${prompt.slice(0, 50)}..." (Face: ${faceImage ? "yes" : "no"})`);

    // 1. OpenAI DALL-E 3 Priority (User requested)
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

    // 2. Pollinations.ai - FAST & FREE Image Generation
    console.log(`🎨 [Router] Generating image via Pollinations.ai: "${fullPrompt.slice(0, 60)}..."`);
    const seed = Math.floor(Math.random() * 999999);
    const encodedPrompt = encodeURIComponent(fullPrompt);
    const imageUrl = `https://image.pollinations.ai/prompt/${encodedPrompt}?width=1024&height=1024&nologo=true&seed=${seed}&model=flux`;

    // Fetch and buffer server-side to resolve client-side CORS and cross-origin issues
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 45000);
    try {
      const imgResponse = await fetch(imageUrl, { signal: controller.signal });
      clearTimeout(timeout);
      
      if (imgResponse.ok) {
        const buffer = Buffer.from(await imgResponse.arrayBuffer());
        const b64 = buffer.toString("base64");
        console.log(`✅ [Router] Image generated via Pollinations: ${buffer.length} bytes`);
        return res.json({ b64_json: b64, url: null });
      } else {
         console.warn(`⚠️ Pollinations returned status ${imgResponse.status}.`);
      }
    } catch (fetchErr: any) {
      clearTimeout(timeout);
      console.warn(`⚠️ Pollinations fetch failed: ${fetchErr.message}. Returning direct URL as fallback.`);
    }

    // Ultimate fallback: Browser loads the URL directly if server-side buffering failed
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
