import { Router, type IRouter } from "express";
import { openai } from "@workspace/integrations-openai-ai-server";
import { generateImageBuffer } from "@workspace/integrations-openai-ai-server/image";
import { textToSpeech } from "@workspace/integrations-openai-ai-server/audio";

const router: IRouter = Router();

const DEMO_STORIES = [
  {
    id: "demo-1",
    title: "The Enchanted Forest",
    category: "nature",
    language: "english",
    mode: "image",
    thumbnail: null,
    description: "A magical journey through an ancient forest where animals can speak.",
    scenes: [
      {
        sceneNumber: 1,
        title: "The Ancient Forest",
        text: "Deep in the heart of the mountains lay an ancient forest untouched by time. Towering oak trees stretched their gnarled branches toward the sky, their leaves whispering secrets of centuries past. Young Maya stepped through the mossy gate, her heart pounding with excitement and wonder.",
        imagePrompt: "Ancient mystical forest with towering oak trees, golden light filtering through canopy, mossy ground, magical atmosphere, fantasy art style",
        choices: []
      },
      {
        sceneNumber: 2,
        title: "The Talking Deer",
        text: "A silver deer with glowing eyes stepped from behind a waterfall. 'Welcome, traveler,' it spoke in a voice like running water. 'We have been waiting for you. The forest calls its chosen ones.' Maya stood frozen, her breath caught in her throat. Animals could speak here — and they had a message just for her.",
        imagePrompt: "Silver magical deer with glowing eyes near a waterfall in enchanted forest, mystical light, fantasy digital art",
        choices: []
      },
      {
        sceneNumber: 3,
        title: "The Crystal Cave",
        text: "The deer led Maya to a hidden cave filled with crystals of every color, each one pulsing with gentle light. 'These are the memory stones,' explained the deer. 'Each crystal holds a wish made by a child who believed in magic.' Maya reached out and touched the largest one — and suddenly saw a vision of a better world.",
        imagePrompt: "Crystal cave filled with glowing colorful crystals, magical light, child touching a large crystal, wonder and awe, fantasy style",
        choices: []
      },
      {
        sceneNumber: 4,
        title: "The Forest's Gift",
        text: "As Maya emerged from the cave, she held a small crystal in her palm — one that glowed specifically for her. 'Plant this near your home,' the deer instructed. 'Water it with kindness, and the magic of the forest will grow.' Maya smiled, knowing she had received something precious: not just a crystal, but a reason to believe.",
        imagePrompt: "Young girl holding glowing crystal at forest edge during golden sunset, magical particles in air, hopeful scene, fantasy art",
        choices: []
      }
    ]
  },
  {
    id: "demo-2",
    title: "Princess Aria and the Dragon",
    category: "princess",
    language: "english",
    mode: "image",
    thumbnail: null,
    description: "A brave princess discovers that the dragon terrorizing her kingdom is actually her greatest ally.",
    scenes: [
      {
        sceneNumber: 1,
        title: "The Kingdom in Fear",
        text: "The Kingdom of Solara trembled under dark clouds. For weeks, a great dragon had circled the mountains, scorching fields and frightening the people. Everyone begged King Roland to send knights, but Princess Aria had a different idea. She had seen the dragon up close — and its eyes were not cruel. They were sad.",
        imagePrompt: "Fantasy kingdom with dark storm clouds, dragon silhouette over mountains, scared villagers, medieval castle, dramatic lighting",
        choices: []
      },
      {
        sceneNumber: 2,
        title: "Aria's Brave Journey",
        text: "Against her father's wishes, Aria climbed the Mountain of Echoes alone, carrying only a lantern and her grandmother's lute. She had read that dragons were drawn to music — not to destroy it, but to mourn what they had lost. As she played the old melody, the ground shook beneath her feet.",
        imagePrompt: "Brave princess climbing mountain with lantern and lute, dragon in background, moonlit night, heroic fantasy art",
        choices: []
      },
      {
        sceneNumber: 3,
        title: "The Dragon's Sorrow",
        text: "'You play her song,' the dragon rumbled, tears of fire streaming down his face. His name was Ember, and he had once been guardian of a princess who had died long ago. Every night he searched for her melody, scorching anything that silenced the memory. Aria played the full song, and Ember finally found peace.",
        imagePrompt: "Giant dragon with tears of fire listening to princess playing lute, moonlight, emotional fantasy scene, beautiful art",
        choices: []
      },
      {
        sceneNumber: 4,
        title: "Guardian of Solara",
        text: "Ember became the protector of Solara, not its terror. He carried Aria on his back as they surveyed the kingdom together, watching over the fields that were now growing again. The people celebrated, and King Roland wept with pride. Sometimes, Aria knew, the bravest thing is not to fight — but to listen.",
        imagePrompt: "Princess riding dragon over beautiful kingdom at sunrise, happy villagers, celebration, epic fantasy landscape, golden light",
        choices: []
      }
    ]
  },
  {
    id: "demo-3",
    title: "The Last Samurai's Son",
    category: "anime",
    language: "english",
    mode: "image",
    thumbnail: null,
    description: "A young boy discovers he has inherited his father's legendary sword — and the responsibility that comes with it.",
    scenes: [
      {
        sceneNumber: 1,
        title: "The Rusted Sword",
        text: "Kenji found the sword buried beneath the sakura tree on the morning of his fifteenth birthday. It was ancient, the blade rusted, the handle wrapped in faded cloth. His mother said nothing when he brought it inside — just looked away. His father had carried this sword once, before the war took him.",
        imagePrompt: "Anime style young boy finding ancient sword under cherry blossom tree, traditional Japanese village, morning light, emotional scene",
        choices: []
      },
      {
        sceneNumber: 2,
        title: "The Old Master",
        text: "The village elder, Master Riku, recognized the sword immediately. 'Your father swore this blade would never be drawn in anger,' he said. 'He carried it only to protect.' He looked at Kenji carefully. 'But evil is rising in the northern pass. Perhaps fate has a reason for this sword awakening now.'",
        imagePrompt: "Anime style old samurai master and young boy with sword, traditional dojo setting, dramatic anime lighting, serious mood",
        choices: []
      },
      {
        sceneNumber: 3,
        title: "The Spirit Within",
        text: "When Kenji gripped the sword properly for the first time, the rust fell away. The blade gleamed silver and he heard a voice — his father's voice — whispering guidance. 'Strike not with anger, but with purpose. Protect what cannot protect itself.' Tears streamed down Kenji's face as he understood what his father had left him.",
        imagePrompt: "Anime dramatic scene, sword glowing with blue spiritual energy, boy crying tears of determination, father's ghost visible, epic anime art",
        choices: []
      },
      {
        sceneNumber: 4,
        title: "The Pass Protected",
        text: "At dawn, Kenji stood at the northern pass, sword gleaming. The bandits who had terrorized villages for months stopped when they saw him — not because of his size, but because of the light in his eyes. They had seen that look before, in a different samurai. The son carried his father's spirit faithfully.",
        imagePrompt: "Young samurai standing on mountain pass at dawn, sword raised, bandits backing away, epic anime art, sunrise colors, heroic pose",
        choices: []
      }
    ]
  },
  {
    id: "demo-4",
    title: "Journey to the Northern Lights",
    category: "travel",
    language: "english",
    mode: "image",
    thumbnail: null,
    description: "A solo traveler chases the Aurora Borealis across Iceland and discovers something unexpected.",
    scenes: [
      {
        sceneNumber: 1,
        title: "Reykjavik at Midnight",
        text: "Zara arrived in Reykjavik at midnight, her breath clouding in the Arctic air. She had quit her job, sold her apartment, and spent her savings on this single journey — to see the Northern Lights before she turned thirty. Friends called it impulsive. She called it necessary. The sky above was dark. But patient.",
        imagePrompt: "Woman arriving in Reykjavik Iceland at night, colorful houses, cobblestone streets, arctic atmosphere, travel photography style",
        choices: []
      },
      {
        sceneNumber: 2,
        title: "The Frozen Lake",
        text: "On the third night, her guide drove her two hours from the city to a frozen lake surrounded by silence. 'Wait,' he said simply, and left her there alone. Zara sat on the ice, wrapped in layers, wondering if this had all been a mistake. Then, slowly, the sky began to breathe — green and violet ribbons unfurling above her.",
        imagePrompt: "Solo traveler sitting on frozen lake watching spectacular Aurora Borealis, green and purple northern lights, reflection on ice, stunning landscape photography",
        choices: []
      },
      {
        sceneNumber: 3,
        title: "The Old Fisherman",
        text: "An old fisherman appeared from the darkness. He had watched the aurora from this same spot for sixty years. 'Every year different,' he said, 'but every year it reminds me the world is bigger than my worries.' He handed her warm coffee. They sat together, strangers made friends by the sky, speaking of lives well-traveled.",
        imagePrompt: "Old fisherman and young woman sharing coffee under aurora borealis, frozen lake, cozy warm scene against cold magnificent sky, cinematic",
        choices: []
      },
      {
        sceneNumber: 4,
        title: "The Answer in the Sky",
        text: "When Zara returned home — not to her old apartment, but to a new chapter — she carried something heavier than photographs. The lights had shown her that beauty doesn't ask permission. That life is short and the sky is vast. She started painting the aurora from memory, and the world began coming to her gallery.",
        imagePrompt: "Woman painting aurora borealis in bright art studio, finished paintings on walls, sunrise through window, transformation and new beginning scene",
        choices: []
      }
    ]
  },
  {
    id: "demo-5",
    title: "प्रिंसेस सोना की खोज",
    category: "princess",
    language: "hindi",
    mode: "image",
    thumbnail: null,
    description: "एक राजकुमारी जो अपने खोए हुए जादुई बगीचे को वापस लाने की यात्रा पर निकलती है।",
    scenes: [
      {
        sceneNumber: 1,
        title: "जादुई बगीचे का रहस्य",
        text: "राजकुमारी सोना के महल में एक जादुई बगीचा था जो हर मौसम में खिलता था। लेकिन एक दिन, एक दुष्ट जादूगर ने बगीचे की जादुई शक्ति चुरा ली। सभी फूल मुरझा गए, पेड़ सूख गए, और पूरे राज्य में उदासी छा गई। सोना ने प्रण किया कि वह अपना बगीचा वापस लाएगी।",
        imagePrompt: "Wilted magical garden in palace, sad princess in Indian traditional dress, storm clouds, fantasy art with Hindi cultural elements",
        choices: []
      },
      {
        sceneNumber: 2,
        title: "बुद्धिमान परी की सलाह",
        text: "जंगल के बीच में सोना को एक बुद्धिमान परी मिली। 'जादुई बीज केवल प्रेम और मेहनत से ही उगते हैं,' परी ने बताया। उसने सोना को तीन सुनहरे बीज दिए। 'इन्हें अपने दिल की मिट्टी में लगाओ — यानी दूसरों की मदद करो, और बगीचा खुद खिल उठेगा।'",
        imagePrompt: "Wise fairy giving golden seeds to Indian princess in magical forest, warm golden light, traditional Indian fairy tale art style",
        choices: []
      },
      {
        sceneNumber: 3,
        title: "तीन अच्छे काम",
        text: "सोना ने तीन काम किए: एक भूखे पक्षी को दाना खिलाया, एक रोते बच्चे को हँसाया, और एक थके किसान की फसल काटने में मदद की। हर अच्छे काम के बाद, एक सुनहरा बीज धरती में चला गया और एक नया पौधा उग आया। जादू प्रेम में था, शक्ति में नहीं।",
        imagePrompt: "Indian princess helping farmer, feeding birds, comforting child, three golden seeds glowing, warm colorful Indian art style",
        choices: []
      },
      {
        sceneNumber: 4,
        title: "बगीचे का पुनर्जन्म",
        text: "जब सोना महल लौटी, तो उसने देखा कि बगीचा फिर से खिल उठा था — पहले से भी अधिक सुंदर। जादूगर की चुराई हुई शक्ति फीकी पड़ गई थी, क्योंकि असली जादू कभी चुराया नहीं जा सकता। वह प्रेम में रहता है, और प्रेम हमेशा जीतता है। सोना ने मुस्कुराते हुए अपने बगीचे को गले लगाया।",
        imagePrompt: "Beautiful blooming magical palace garden, Indian princess celebrating with flowers and animals, joyful scene, vibrant Indian art style",
        choices: []
      }
    ]
  },
  {
    id: "demo-6",
    title: "The Space Explorer",
    category: "travel",
    language: "english",
    mode: "game",
    thumbnail: null,
    description: "Navigate your spaceship through the cosmos in this choice-based adventure!",
    scenes: [
      {
        sceneNumber: 1,
        title: "Mission Launch",
        text: "You are Commander Nova, pilot of the spacecraft Horizon. Your mission: explore the newly discovered Kepler system, three lightyears away. As you leave Earth's orbit, your scanner detects an unknown signal. Your crew looks to you for a decision.",
        imagePrompt: "Spaceship leaving Earth orbit, stars ahead, cockpit view from inside spacecraft, sci-fi art, commander at the helm",
        choices: [
          { id: "a", text: "Investigate the signal immediately", nextScene: 2, isCorrect: false },
          { id: "b", text: "Continue to Kepler system on schedule", nextScene: 3, isCorrect: true },
          { id: "c", text: "Send a probe to investigate safely", nextScene: 2, isCorrect: true }
        ]
      },
      {
        sceneNumber: 2,
        title: "The Unknown Signal",
        text: "The signal leads you to a small moon orbiting a gas giant. On the surface, you find ancient ruins — clearly made by an intelligent species that came before. Inside, you discover a star map showing locations of inhabited worlds. This changes everything humanity knows about the universe.",
        imagePrompt: "Ancient alien ruins on small moon, astronaut exploring, mysterious symbols, gas giant visible in sky, sci-fi exploration art",
        choices: [
          { id: "a", text: "Take the star map and return to Earth", nextScene: 4, isCorrect: false },
          { id: "b", text: "Record everything and share with all of humanity", nextScene: 4, isCorrect: true }
        ]
      },
      {
        sceneNumber: 3,
        title: "The Kepler System",
        text: "You arrive at the Kepler system as planned. The third planet is breathtaking — blue oceans, green continents, clouds swirling over mountain ranges. Your sensors detect oxygen and liquid water. Life is possible here. Your mission could make history. You begin orbital scans.",
        imagePrompt: "Spacecraft orbiting beautiful blue-green exoplanet in Kepler system, realistic space art, awe-inspiring view from orbit",
        choices: [
          { id: "a", text: "Land immediately to claim the planet", nextScene: 4, isCorrect: false },
          { id: "b", text: "Spend weeks studying before any contact", nextScene: 4, isCorrect: true }
        ]
      },
      {
        sceneNumber: 4,
        title: "The Return",
        text: "Commander Nova's journey changed the course of human history. Whether you found ancient ruins or a new world, you brought humanity hope — proof that we are not alone in the universe, and that the cosmos holds wonders beyond imagination. The Horizon returns home, carrying the greatest gift: knowledge.",
        imagePrompt: "Spaceship returning to Earth, sunrise behind the planet, triumphant return, epic space art, sense of accomplishment",
        choices: []
      }
    ]
  },
  {
    id: "demo-7",
    title: "The Ocean's Secret",
    category: "nature",
    language: "english",
    mode: "video",
    thumbnail: null,
    description: "A marine biologist discovers a bioluminescent creature that may hold the cure to a deadly disease.",
    scenes: [
      {
        sceneNumber: 1,
        title: "The Deep Dive",
        text: "Dr. Elena Cruz descended into darkness, her research submarine's lights cutting through 2,000 meters of black ocean. No one had documented life at this depth successfully. She had one hour of oxygen and one chance. Then, at the edge of visibility, something pulsed with electric blue light — alive, hovering, waiting.",
        imagePrompt: "Submarine diving into deep dark ocean, bioluminescent creatures ahead, dramatic underwater sci-fi atmosphere, blue light in darkness",
        choices: []
      },
      {
        sceneNumber: 2,
        title: "The Glowing Creature",
        text: "It was unlike anything in the scientific record — a translucent creature the size of a whale, its body patterned with shifting lights that formed what looked almost like language. Elena's hands shook as she deployed her sample probe. The creature did not flee. Instead, it turned and seemed to study her in return.",
        imagePrompt: "Massive bioluminescent sea creature with intricate light patterns facing submarine, deep ocean, awe and wonder, blue bioluminescence",
        choices: []
      },
      {
        sceneNumber: 3,
        title: "The Healing Light",
        text: "Back in the lab, analysis of the collected bioluminescent particles revealed something extraordinary. The creature's light-producing compound showed unprecedented antibacterial properties — active against infections that modern medicine had been unable to treat. Elena stared at her screen. This could save millions of lives.",
        imagePrompt: "Marine biologist in lab examining glowing samples from ocean, microscope showing miraculous discovery, science art, breakthrough moment",
        choices: []
      },
      {
        sceneNumber: 4,
        title: "The Responsibility",
        text: "Elena chose to publish her findings openly, refusing to patent what the ocean had given freely. She also advocated for protecting the deep ocean zones where the creature lived. Three years later, a treatment derived from her discovery had reached clinics around the world. The ocean's secret had become humanity's gift.",
        imagePrompt: "Scientist presenting ocean discovery to world leaders, hopeful faces, news headlines, ocean in background, sunset symbolizing new era",
        choices: []
      }
    ]
  },
  {
    id: "demo-8",
    title: "ડ્રેગન ચા વ's સ્ટ્ .rip",
    category: "anime",
    language: "gujarati",
    mode: "image",
    thumbnail: null,
    description: "ગુજરાતી ભાષામાં એક ડ્રેગન અને નાના ગ્રામ  ina ına ina ina ina ina inal inal inald inald inald a inal final inal inal inal inal inal final inal inal inala inalab inalabl inalabl inalable inalable inalabler inalable inalable inalable",
    scenes: [
      {
        sceneNumber: 1,
        title: "ગામ",
        text: "પ્રેમ ગામ ava  avani avani avani avani avani avani avani  avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani avani",
        imagePrompt: "Gujarati village scene with anime style, colorful traditional houses, mountains in background, warm sunset, anime art",
        choices: []
      }
    ]
  }
];

const CLEAN_DEMO_STORIES = [
  {
    id: "demo-1",
    title: "The Enchanted Forest",
    category: "nature",
    language: "english",
    mode: "image",
    thumbnail: null,
    description: "A magical journey through an ancient forest where animals can speak.",
    scenes: DEMO_STORIES[0].scenes
  },
  {
    id: "demo-2",
    title: "Princess Aria and the Dragon",
    category: "princess",
    language: "english",
    mode: "image",
    thumbnail: null,
    description: "A brave princess discovers that the dragon terrorizing her kingdom is actually her greatest ally.",
    scenes: DEMO_STORIES[1].scenes
  },
  {
    id: "demo-3",
    title: "The Last Samurai's Son",
    category: "anime",
    language: "english",
    mode: "image",
    thumbnail: null,
    description: "A young boy discovers he has inherited his father's legendary sword.",
    scenes: DEMO_STORIES[2].scenes
  },
  {
    id: "demo-4",
    title: "Journey to the Northern Lights",
    category: "travel",
    language: "english",
    mode: "image",
    thumbnail: null,
    description: "A solo traveler chases the Aurora Borealis across Iceland.",
    scenes: DEMO_STORIES[3].scenes
  },
  {
    id: "demo-5",
    title: "प्रिंसेस सोना की खोज",
    category: "princess",
    language: "hindi",
    mode: "image",
    thumbnail: null,
    description: "एक राजकुमारी जो अपने खोए हुए जादुई बगीचे को वापस लाने की यात्रा पर निकलती है।",
    scenes: DEMO_STORIES[4].scenes
  },
  {
    id: "demo-6",
    title: "The Space Explorer",
    category: "travel",
    language: "english",
    mode: "game",
    thumbnail: null,
    description: "Navigate your spaceship through the cosmos in this choice-based adventure!",
    scenes: DEMO_STORIES[5].scenes
  },
  {
    id: "demo-7",
    title: "The Ocean's Secret",
    category: "nature",
    language: "english",
    mode: "video",
    thumbnail: null,
    description: "A marine biologist discovers a bioluminescent creature that may hold the cure to a deadly disease.",
    scenes: DEMO_STORIES[6].scenes
  },
  {
    id: "demo-8",
    title: "The Clockwork City",
    category: "anime",
    language: "english",
    mode: "image",
    thumbnail: null,
    description: "In a steampunk city run by machines, one girl discovers the city's dark secret.",
    scenes: [
      {
        sceneNumber: 1,
        title: "The City That Never Sleeps",
        text: "Cog City never went dark. Giant clockwork towers turned day and night, powering everything: the lights, the trains, the food factories. Thirteen-year-old Lyra had lived here all her life and never questioned it. Until the night she found a gear with a heartbeat, warm in her hand, pulsing like it was alive.",
        imagePrompt: "Steampunk anime city at night, clockwork towers with gears, airships, girl holding glowing gear, dramatic neon and steam atmosphere",
        choices: []
      },
      {
        sceneNumber: 2,
        title: "The Living Machine",
        text: "The gear led Lyra underground, through tunnels behind the city's giant furnace, to a chamber that stopped her breath. Hundreds of small mechanical beings sat in rows, their eyes dim, their gears turning slowly. They were children — transformed into machines to power the city. Her city ran on their suffering.",
        imagePrompt: "Underground chamber with rows of mechanical child-like beings, glowing eyes, dark steampunk horror anime aesthetic, girl discovering the truth",
        choices: []
      },
      {
        sceneNumber: 3,
        title: "The Choice",
        text: "The mechanical beings could be restored, but only if the city's power was shut off — plunging everything into darkness for three days. Lyra would be blamed. She might be exiled. But she looked at the mechanical child before her, at the spark of humanity in its eyes, and she reached for the main lever.",
        imagePrompt: "Anime girl reaching for giant lever in steampunk control room, mechanical children watching, dramatic lighting, moment of decision",
        choices: []
      },
      {
        sceneNumber: 4,
        title: "The Light Returns",
        text: "On the third day, as the restored children walked free, the city's citizens learned the truth of what had powered their lives. They chose differently this time — building wind towers and water mills, renewable and free. Cog City was reborn, and Lyra was called not exile, but hero. Some darkness, once lit, never returns.",
        imagePrompt: "Steampunk city at dawn with wind turbines and watermills, freed children running free, anime art, hopeful sunrise, celebration",
        choices: []
      }
    ]
  }
];

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
    nature: "nature and wildlife, forests, mountains, rivers, animals, environmental themes",
    princess: "fairy tale princess, magic, kingdoms, enchantment, bravery, adventure",
    anime: "anime manga style, dramatic, emotional depth, action, friendship, determination, Japanese cultural elements",
    travel: "exploration, adventure, real locations, discovery, cultural exchange, journey",
    custom: "creative, open-ended, based purely on the given prompt"
  };
  return styles[category] || styles.custom;
}

router.get("/demo-stories", (_req, res) => {
  res.json(CLEAN_DEMO_STORIES);
});

router.post("/generate-story", async (req, res) => {
  try {
    const { prompt, category, language, mode, numScenes = 4 } = req.body;
    const langInstruction = getLanguageInstruction(language);
    const categoryStyle = getCategoryStyle(category);

    const isGame = mode === "game";
    const sceneCount = Math.min(Math.max(numScenes, 2), 8);

    let systemPrompt = `You are a master storyteller creating immersive, cinematic stories.
${langInstruction}
Story category/style: ${categoryStyle}
Mode: ${mode}

Requirements:
- Create exactly ${sceneCount} scenes
- Each scene should be vivid, emotional, and leave the reader wanting more
- Write 3-5 sentences per scene (rich, descriptive prose)
- For each scene, create a detailed image generation prompt in English (always English, even if story is in another language)
- The image prompts should be visual, cinematic, painterly descriptions

${isGame ? `GAME MODE: Include 2-3 choices per scene (except the final scene). 
Mark exactly one choice as correct (isCorrect: true). 
Choices should be meaningful moral or strategic decisions.
Also include quizQuestions array with 3 quiz questions about the story.` : ""}

Return a JSON object with this exact structure:
{
  "title": "Story title",
  "scenes": [
    {
      "sceneNumber": 1,
      "title": "Scene title",
      "text": "Scene narrative text",
      "imagePrompt": "Detailed English image generation prompt",
      "choices": [] ${isGame ? '// or [{id, text, nextScene, isCorrect}]' : ''}
    }
  ]${isGame ? ',\n  "quizQuestions": [{"question": "...", "options": ["a", "b", "c", "d"], "correctIndex": 0, "explanation": "..."}]' : ""}
}`;

    const userMessage = `Create a story about: ${prompt}`;

    const completion = await openai.chat.completions.create({
      model: "gpt-5.2",
      max_completion_tokens: 8192,
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userMessage }
      ],
      response_format: { type: "json_object" }
    });

    const rawContent = completion.choices[0]?.message?.content;
    if (!rawContent) {
      throw new Error("No content from AI");
    }

    const storyData = JSON.parse(rawContent);
    const storyId = `story-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;

    res.json({
      id: storyId,
      title: storyData.title || "Untitled Story",
      category,
      language,
      mode,
      scenes: storyData.scenes || [],
      quizQuestions: storyData.quizQuestions || []
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Story generation error:", message);
    res.status(500).json({ error: `Failed to generate story: ${message}` });
  }
});

router.post("/generate-story-image", async (req, res) => {
  try {
    const { prompt, category, style } = req.body;
    const categoryStyle = getCategoryStyle(category || "custom");
    const fullPrompt = `${prompt}. Style: ${categoryStyle}. ${style || "cinematic, high quality, detailed illustration"}. Digital art, atmospheric lighting.`;

    const buffer = await generateImageBuffer(fullPrompt, "1024x1024");
    res.json({ b64_json: buffer.toString("base64") });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Image generation error:", message);
    res.status(500).json({ error: `Failed to generate image: ${message}` });
  }
});

router.post("/generate-narration", async (req, res) => {
  try {
    const { text, language, voice = "nova" } = req.body;

    let ttsText = text;
    if (language === "hindi" || language === "gujarati") {
      ttsText = text;
    }

    const audioBuffer = await textToSpeech(ttsText, voice, "mp3");
    res.json({
      audioBase64: audioBuffer.toString("base64"),
      format: "mp3"
    });
  } catch (err: unknown) {
    const message = err instanceof Error ? err.message : String(err);
    console.error("Narration generation error:", message);
    res.status(500).json({ error: `Failed to generate narration: ${message}` });
  }
});

export default router;
