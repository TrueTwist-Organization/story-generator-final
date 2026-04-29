import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const categories = [
  "king_queen", "fantasy", "magic", "friendship", "kids", "bedtime", "moral", "animal", "princess", "god", "bird", "nature"
];

const categoryNames = {
  king_queen: "King & Queen",
  fantasy: "Fantasy",
  magic: "Magic",
  friendship: "Friendship",
  kids: "Kids",
  bedtime: "Bedtime",
  moral: "Moral",
  animal: "Animal",
  princess: "Princess",
  god: "God",
  bird: "Bird",
  nature: "Nature"
};

const storyTemplates = {
  king_queen: [
    { title: "The Just King's Decree", desc: "A wise king named Aryan solves a difficult dispute between two women." },
    { title: "Queen Elara's Secret Garden", desc: "The Queen discovers a hidden garden that only blooms when the kingdom is at peace." },
    { title: "The Golden Crown of Aether", desc: "A journey to recover the lost crown that brings unity to the realm." },
    { title: "A Banquet for Peace", desc: "Two warring kings decide to settle their differences over a magical feast." }
  ],
  fantasy: [
    { title: "The Last Dragon Rider", desc: "An unlikely hero finds the last dragon egg in a hidden cave." },
    { title: "Shards of the Crystal Mountain", desc: "Quest to find the scattered pieces of the mountain that keeps the world afloat." },
    { title: "Whispers of the Eldritch Woods", desc: "A young explorer must listen to the trees to find her way home." },
    { title: "The Flying Island of Zephyr", desc: "Life aboard an island that drifts through the clouds." }
  ],
  magic: [
    { title: "The Sorcerer's Apprentice", desc: "A young student learns that true magic comes from the heart, not just spells." },
    { title: "The Magic Inkwell", desc: "Everything written with this ink comes to life for exactly one hour." },
    { title: "Quest for the Starlight Wand", desc: "Only the bravest can hold the wand made from a fallen star." },
    { title: "The Invisible Cloak", desc: "Discovering that being unseen is as much a responsibility as it is a power." }
  ],
  friendship: [
    { title: "The Two Friends and the Storm", desc: "Rohan and Aman learn the true meaning of friendship during a dangerous storm." },
    { title: "Sharing the Last Apple", desc: "In a time of scarcity, two rivals find common ground." },
    { title: "The Great River Rescue", desc: "A teamwork-driven adventure to save a stranded kitten." },
    { title: "A Friend in Need", desc: "The story of how a small act of kindness changed a lonely heart." }
  ],
  kids: [
    { title: "The Little Bus that Could", desc: "A small bus proves that size doesn't matter when you have determination." },
    { title: "Sparky the Robot's Adventure", desc: "A small robot discovers the wonder and beauty of its very first rainstorm." },
    { title: "The Toy Chest Mystery", desc: "What happens when the toys come to life when the lights go out?" },
    { title: "Cookie the Cat's Big Day", desc: "A day in the life of a playful kitten with a big imagination." }
  ],
  bedtime: [
    { title: "The Sleepy Moon and the Little Star", desc: "A gentle bedtime story about the Moon caring for a tired little star." },
    { title: "Counting Star Sheep", desc: "A journey through the clouds where dreams are born." },
    { title: "The Dreamland Express", desc: "Hop on the train that takes children to their most beautiful dreams." },
    { title: "Lullaby of the Whispering Sea", desc: "The waves sing a soft song to help the world sleep." }
  ],
  moral: [
    { title: "The Honest Woodcutter", desc: "A poor woodcutter is rewarded for his honesty by a river fairy." },
    { title: "The Boy who Cried Wolf", desc: "The classic tale of why telling the truth is important for trust." },
    { title: "Kindness to Others", desc: "A story about how a simple smile can ripple through a whole town." },
    { title: "The Golden Rule", desc: "A journey to a land where everyone treats others exactly how they want to be treated." }
  ],
  animal: [
    { title: "The Clever Rabbit and the Lion", desc: "Intelligence overcomes strength when a clever rabbit outsmarts a fierce lion." },
    { title: "Brave Little Lion", desc: "A cub learns that courage isn't the absence of fear, but acting despite it." },
    { title: "The Wise Owl's Advice", desc: "The forest animals seek wisdom from the oldest inhabitant of the big oak tree." },
    { title: "Turtle and the Hare: The Rematch", desc: "An updated take on the classic race with a focus on consistency." }
  ],
  princess: [
    { title: "The Kind Princess and the Secret Garden", desc: "Princess Elina discovers that true beauty and magic come from a kind heart." },
    { title: "Princess and the Magic Pea", desc: "A test of character that reveals a true royal spirit." },
    { title: "The Lost Glass Slipper", desc: "A search for a kind girl who left her heart at the ball." },
    { title: "Enchanted Castle Quest", desc: "A brave princess travels to break a hundred-year-old spell." }
  ],
  god: [
    { title: "Gift from the Heavens", desc: "A village is blessed by a celestial being for their hard work." },
    { title: "The Temple of Wisdom", desc: "Seekers travel from afar to answer the three riddles of the stone guardian." },
    { title: "Celestial Balance", desc: "Sun and Moon work together to keep the world in perfect harmony." },
    { title: "Path of Light", desc: "A humble man finds a lantern that only shines when he helps others." }
  ],
  bird: [
    { title: "The Phoenix's Rebirth", desc: "A story of hope and starting over, even when it seems like all is lost." },
    { title: "Eagle's High Flight", desc: "Learning to see the big picture from above the clouds." },
    { title: "The Singing Nightingale", desc: "A bird's song that can heal hearts and change a king's mind." },
    { title: "Blue Jay's Nest Hunt", desc: "Searching for the perfect spot to start a new family in the spring." }
  ],
  nature: [
    { title: "The Magical Forest", desc: "Discover a place where nature itself tells tales of the old world." },
    { title: "Singing River's Secret", desc: "If you listen closely, the water tells where it has been." },
    { title: "Mountain Peak Adventure", desc: "Climbing to the top to see the world from a new perspective." },
    { title: "Desert Rose Discovery", desc: "Finding beauty in the most unexpected and dry places." }
  ]
};

const stories = [];
let idCounter = 1;

for (const cat of categories) {
  const templates = storyTemplates[cat] || [];
  for (let i = 0; i < 4; i++) {
    const template = templates[i] || { title: `${categoryNames[cat]} Story ${i+1}`, desc: `A wonderful adventure in the ${categoryNames[cat]} realm.` };
    stories.push({
      id: `demo-${idCounter++}`,
      title: template.title,
      category: cat,
      language: "english",
      mode: "image",
      thumbnail: (() => {
        const title = template.title;
        const lowerTitle = title.toLowerCase();
        
        // Simple hash function for consistent variety
        const getHash = (str) => {
          let hash = 0;
          for (let k = 0; k < str.length; k++) {
            hash = ((hash << 5) - hash) + str.charCodeAt(k);
            hash |= 0;
          }
          return Math.abs(hash);
        };
        const titleHash = getHash(title);

        const allImages = [
          'king_queen_1', 'king_queen_2', 'king_queen_3', 'king_queen_4', 
          'fantasy_1', 'anime', 'forest-girl', 'friends-storm', 
          'moon-star', 'nature', 'princess', 'rabbit-lion', 'woodcutter'
        ];

        const keywordPools = [
          { keywords: ['king', 'monarch', 'decree'], pool: ['king_queen_1', 'king_queen_4', 'king_queen_3'] },
          { keywords: ['queen', 'garden', 'elara'], pool: ['king_queen_2', 'forest-girl', 'nature'] },
          { keywords: ['crown', 'aether', 'unity'], pool: ['king_queen_3', 'fantasy_1', 'king_queen_1'] },
          { keywords: ['banquet', 'feast', 'peace'], pool: ['king_queen_4', 'nature', 'friends-storm'] },
          { keywords: ['dragon', 'rider', 'cave'], pool: ['fantasy_1', 'anime', 'woodcutter'] },
          { keywords: ['crystal', 'mountain', 'shard'], pool: ['anime', 'fantasy_1', 'nature'] },
          { keywords: ['moon', 'star', 'sleepy', 'night'], pool: ['moon-star', 'nature', 'anime'] },
          { keywords: ['sorcerer', 'magic'], pool: ['anime', 'moon-star', 'forest-girl', 'woodcutter'] },
          { keywords: ['inkwell', 'wand', 'cloak', 'robot', 'space'], pool: ['anime', 'forest-girl', 'moon-star', 'fantasy_1'] },
          { keywords: ['storm', 'rescue', 'friend', 'sharing'], pool: ['friends-storm', 'nature', 'forest-girl'] },
          { keywords: ['rabbit', 'lion', 'kitten', 'puppy', 'animal'], pool: ['rabbit-lion', 'nature', 'forest-girl'] },
          { keywords: ['woodcutter', 'honest', 'axe'], pool: ['woodcutter', 'nature', 'forest-girl'] },
          { keywords: ['princess', 'girl', 'castle'], pool: ['princess', 'forest-girl', 'anime'] },
          { keywords: ['bird', 'phoenix', 'eagle', 'nightingale', 'nest'], pool: ['nature', 'forest-girl', 'anime'] },
          { keywords: ['god', 'ganesha', 'krishna', 'hanuman', 'shiva'], pool: ['nature', 'moon-star', 'forest-girl'] }
        ];

        let imageName = '';
        for (const entry of keywordPools) {
          if (entry.keywords.some(k => lowerTitle.includes(k))) {
            imageName = entry.pool[titleHash % entry.pool.length];
            break;
          }
        }

        if (!imageName) {
          imageName = allImages[titleHash % allImages.length];
        }
        
        const specialImgs = ['king_queen_1', 'king_queen_2', 'king_queen_3', 'king_queen_4', 'fantasy_1'];
        if (specialImgs.includes(imageName)) {
          return `/images/${imageName}.png`;
        }
        return `/images/demo-${imageName}.png`;
      })(),
      description: template.desc,
      scenes: [
        {
          sceneNumber: 1,
          title: "Introduction",
          text: `Once upon a time, our adventure in the realm of ${template.title} began. The world was full of wonder and discovery.`,
          imagePrompt: `Cinematic storybook illustration of ${template.title}, starting scene, detailed digital art, vibrant colors`,
          choices: []
        },
        {
          sceneNumber: 2,
          title: "The Challenge",
          text: `Suddenly, a great challenge arose! Our heroes had to find a way to overcome the obstacle that stood in their path.`,
          imagePrompt: `Dramatic moment in the story of ${template.title}, character facing a challenge, magical atmosphere`,
          choices: []
        },
        {
          sceneNumber: 3,
          title: "The Resolution",
          text: `With courage and wisdom, the solution was found. Everyone worked together to bring balance back to the realm.`,
          imagePrompt: `Heroic resolution of ${template.title}, magical particles, success and teamwork`,
          choices: []
        },
        {
          sceneNumber: 4,
          title: "Happy Ending",
          text: `Peace was restored, and the lesson was learned. The memory of this journey would live on forever in the hearts of many.`,
          imagePrompt: `Celebration and sunset in the story of ${template.title}, happy ending, warm lighting, peaceful forest`,
          choices: []
        }
      ]
    });
  }
}

const targetPath = path.resolve(__dirname, '..', 'artifacts', 'api-server', 'src', 'data', 'demo-stories.json');
fs.writeFileSync(targetPath, JSON.stringify(stories, null, 2));
console.log(`Successfully generated ${stories.length} stories at ${targetPath}`);
