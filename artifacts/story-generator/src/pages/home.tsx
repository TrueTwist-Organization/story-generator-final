import React, { useState, useRef } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Wand2, Camera, Play, X, Gamepad2 } from "lucide-react";
import { useStoryStore } from "@/lib/store";
import { useQuery } from "@tanstack/react-query";
import { useGenerateStory } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { Footer } from "@/components/Footer";
import type { GenerateStoryBodyCategory, GenerateStoryBodyMode, GenerateStoryBodyLanguage } from "@workspace/api-client-react";

const CATEGORIES: { id: GenerateStoryBodyCategory; label: string; icon: string; image: string }[] = [
  { id: "king_queen", label: "King & Queen", icon: "👑", image: "/images/cat-king-queen.webp" },
  { id: "fantasy", label: "Fantasy", icon: "🐉", image: "/images/cat-fantasy.webp" },
  { id: "magic", label: "Magic", icon: "🪄", image: "/images/cat-magic.webp" },
  { id: "friendship", label: "Friendship", icon: "🤝", image: "/images/cat-friendship.webp" },
  { id: "kids", label: "Kids", icon: "🧸", image: "/images/cat-kids.webp" },
  { id: "bedtime", label: "Bedtime", icon: "🌙", image: "/images/cat-bedtime.webp" },
  { id: "moral", label: "Moral", icon: "📜", image: "/images/cat-moral.webp" },
  { id: "animal", label: "Animal", icon: "🐾", image: "/images/cat-animal.webp" },
  { id: "princess", label: "Princess", icon: "👸", image: "/images/cat-princess.webp" },
  { id: "god", label: "God", icon: "🙏", image: "/images/cat-god.webp" },
  { id: "bird", label: "Bird", icon: "🐦", image: "/images/cat-bird.webp" },
  { id: "custom", label: "Custom", icon: "✨", image: "/images/cat-custom.webp" },
];


const LANGUAGES: { id: GenerateStoryBodyLanguage; label: string }[] = [
  { id: "english", label: "English" },
  { id: "hindi", label: "हिंदी" },
  { id: "gujarati", label: "ગુજરાતી" },
];

const VOICES = [
  { id: "shimmer", label: "Female (Soft)", icon: "👩" },
  { id: "alloy", label: "Neutral", icon: "👤" },
  { id: "echo", label: "Male (Deep)", icon: "👨" },
  { id: "nova", label: "Female (Bright)", icon: "✨" },
];

const TRANSLATIONS = {
  english: {
    worldTheme: "World Theme",
    experienceMode: "Experience Mode",
    language: "Language",
    protagonistGoal: "The Protagonist's Goal",
    placeholder: "e.g. A young wizard trying to find a lost star fragment...",
    conjure: "Conjure Story",
    categories: { 
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
      custom: "Custom" 
    },
    modes: { image: "Story Book", video: "Cinematic", game: "Adventure" },
    modeDescs: { image: "Beautiful illustrated pages", video: "Immersive auto-playing scenes", game: "Make choices to survive" },
    narratorVoice: "Narrator Voice",
    voices: { shimmer: "Female (Soft)", alloy: "Neutral", echo: "Male (Deep)", nova: "Female (Bright)" },
    yourFace: "Your Face (Optional)",
    uploadFace: "Upload",
    faceDesc: "Upload your photo and the hero of every scene will look like you! Our AI will place your face into each story illustration."
  },
  hindi: {
    worldTheme: "विश्व की थीम",
    experienceMode: "अनुभव मोड",
    language: "भाषा",
    protagonistGoal: "नायक का लक्ष्य",
    placeholder: "जैसे: एक युवा जादूगर जो खोए हुए तारे के टुकड़े को खोजने की कोशिश कर रहा है...",
    conjure: "कहानी रचें",
    categories: { 
      king_queen: "राजा-रानी", 
      fantasy: "फंतासी", 
      magic: "जादू", 
      friendship: "मित्रता", 
      kids: "बच्चे", 
      bedtime: "बेडटाइम", 
      moral: "नैतिक", 
      animal: "जानवर", 
      princess: "राजकुमारी", 
      god: "भगवान", 
      bird: "पक्षी", 
      custom: "कस्टम" 
    },
    narratorVoice: "सूत्रधार की आवाज़",
    voices: { shimmer: "महिला (कोमल)", alloy: "तटस्थ", echo: "पुरुष (गहरी)", nova: "महिला (चमकदार)" },
    yourFace: "आपका चेहरा (वैकल्पिक)",
    uploadFace: "अपलोड",
    faceDesc: "अपनी फ़ोटो अपलोड करें और हर दृश्य का नायक आप जैसा दिखेगा! AI आपका चेहरा हर चित्र में लगाएगा।"
  },
  gujarati: {
    worldTheme: "વિશ્વની થીમ",
    experienceMode: "અનુભવ મોડ",
    language: "ભાષા",
    protagonistGoal: "નાયકનું લક્ષ્ય",
    placeholder: "દા.ત. એક યુવાન જાદુગર જે ખોવાયેલા તારાના ટુકડાને શોધવાનો પ્રયત્ન કરી રહ્યો છે...",
    conjure: "વાર્તા બનાવો",
    categories: { 
      king_queen: "રાજા-રાણી", 
      fantasy: "કલ્પના", 
      magic: "જાદુ", 
      friendship: "મિત્રતા", 
      kids: "બાળકો", 
      bedtime: "સુવાના સમયની", 
      moral: "બોધકથા", 
      animal: "પ્રાણીઓ", 
      princess: "રાજકુમારી", 
      god: "ભગવાન", 
      bird: "પક્ષી", 
      custom: "કસ્ટમ" 
    },
    narratorVoice: "વક્તાનો અવાજ",
    voices: { shimmer: "સ્ત્રી (કોમળ)", alloy: "તટસ્થ", echo: "પુરુષ (ગંભીર)", nova: "સ્ત્રી (તેજસ્વી)" },
    yourFace: "તમારો ચહેરો (વૈકલ્પિક)",
    uploadFace: "અપલોડ",
    faceDesc: "તમારો ફોટો અપલોડ કરો અને દરેક scene ના નાયક તમારા જેવા દેખાશે! AI તમારો ચહેરો દરેક ચિત્રમાં ઉમેરશે."
  }
};

export default function HomePage() {
  const [_, setLocation] = useLocation();
  const { setActiveStory, setVoice: setGlobalVoice, setFaceImage } = useStoryStore();

  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState<GenerateStoryBodyCategory>("custom");
  const [language, setLanguage] = useState<GenerateStoryBodyLanguage>("english");
  const [voice, setVoice] = useState("shimmer");
  const [facePreview, setFacePreview] = useState<string | null>(null);
  const faceInputRef = useRef<HTMLInputElement>(null);
  const t = TRANSLATIONS[language];

  const generateStoryMutation = useGenerateStory();

  const { data: demoStories, isLoading: isDemosLoading } = useQuery({
    queryKey: ['demo-stories', language],
    queryFn: async () => {
      const res = await fetch(`${import.meta.env.VITE_API_URL || ''}/api/demo-stories?lang=${language}`);
      if (!res.ok) throw new Error('Failed to fetch demo stories');
      return res.json();
    }
  });

  const handleFaceUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const base64 = ev.target?.result as string;
      setFacePreview(base64);
      setFaceImage(base64);
    };
    reader.readAsDataURL(file);
  };

  const removeFace = () => {
    setFacePreview(null);
    setFaceImage(null);
    if (faceInputRef.current) faceInputRef.current.value = "";
  };

  const handleGenerate = () => {
    if (!prompt.trim() && category === 'custom') return;
    const finalPrompt = prompt.trim() || `A magical tale about ${category}`;

    generateStoryMutation.mutate(
      {
        data: {
          prompt: finalPrompt,
          category,
          language,
          mode: "image" as GenerateStoryBodyMode,
          numScenes: 4
        }
      },
      {
        onSuccess: (data) => {
          setActiveStory(data);
          setGlobalVoice(voice);
          setLocation("/story");
        },
        onError: (error: any) => {
          console.error("Story generation failed:", error);
          alert("Failed to conjure story. Please check your API key or try again later.");
        }
      }
    );
  };

  const handleDemoClick = (story: any) => {
    setActiveStory(story);
    setGlobalVoice(voice);
    setLocation("/story");
  };

  return (
    <div className="min-h-screen bg-transparent overflow-x-hidden pb-24 relative">
      <div className="absolute top-0 left-0 w-full h-[60vh] z-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/40 to-background/20" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-8 pt-20 pb-32">
        
        {/* Split Hero Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center mb-24">
          
          {/* Left Side: Content */}
          <motion.div 
            initial={{ opacity: 0, x: -50 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="text-left"
          >
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-xs font-bold text-accent mb-8 border-accent/20 tracking-widest uppercase">
              <Sparkles className="w-4 h-4 shadow-[0_0_10px_gold]" />
              <span>AI Powered Generation</span>
            </div>

            <h1 className="text-6xl md:text-8xl font-display font-medium text-white mb-8 leading-[1.05] tracking-tight">
              Craft Your <br/>
              <span className="text-gradient-gold drop-shadow-[0_0_20px_rgba(234,179,8,0.4)]">Epic Tale</span>
            </h1>

            <p className="text-xl md:text-2xl text-white/60 mb-12 max-w-xl leading-relaxed font-light italic">
              Immerse yourself in infinite worlds. Generate beautiful, voice-narrated stories and interactive adventures in seconds.
            </p>

            <div className="flex flex-wrap gap-4">
               <Button
                variant="glow"
                size="lg"
                className="h-16 px-10 text-lg rounded-2xl shadow-[0_0_30px_rgba(168,85,247,0.3)] bg-primary"
                onClick={() => document.getElementById('generation-panel')?.scrollIntoView({ behavior: 'smooth' })}
               >
                 Start Your Adventure
               </Button>
               <Button
                variant="outline"
                size="lg"
                className="h-16 px-8 text-lg rounded-2xl bg-white/5 border-white/20 hover:bg-white/10 text-white"
                onClick={() => setLocation("/games")}
               >
                 <Gamepad2 className="w-5 h-5 mr-2" />
                 Play Games
               </Button>
            </div>
          </motion.div>

          {/* Right Side: Visual Card */}
          <motion.div 
            initial={{ opacity: 0, scale: 0.8, rotate: 5 }}
            animate={{ opacity: 1, scale: 1, rotate: 0 }}
            transition={{ duration: 1, delay: 0.2, type: "spring" }}
            className="relative"
          >
            {/* Animated Glow Backdrops */}
            <div className="absolute -inset-10 bg-primary/20 rounded-full blur-[100px] animate-pulse" />
            <div className="absolute -inset-10 bg-accent/10 rounded-full blur-[80px] animate-pulse" style={{ animationDelay: '1s' }} />

            {/* The Hero Card */}
            <div className="relative z-10 p-2 rounded-[3rem] bg-gradient-to-br from-white/10 to-transparent border border-white/20 backdrop-blur-md shadow-[0_40px_100px_rgba(0,0,0,0.5)] group overflow-hidden">
               <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-60 pointer-events-none" />
               <img 
                src="/images/hero-card.png"
                alt="Magical Adventure"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = "https://image.pollinations.ai/prompt/cute%20cartoon%20wizard%20kid%20with%20dragon%20and%20floating%20books%20magical%20fantasy%20world?width=800&height=1000&nologo=true";
                }}
                className="w-full aspect-[4/5] object-cover rounded-[2.8rem] transform transition-transform duration-700 group-hover:scale-110"
               />
               
               {/* Floating Icon Badges */}
               <motion.div 
                 animate={{ y: [0, -10, 0] }}
                 transition={{ repeat: Infinity, duration: 3 }}
                 className="absolute top-10 -left-6 glass-panel p-4 rounded-3xl shadow-xl border-white/10"
               >
                 <span className="text-3xl">⭐</span>
               </motion.div>
               <motion.div 
                 animate={{ y: [0, 15, 0] }}
                 transition={{ repeat: Infinity, duration: 4, delay: 0.5 }}
                 className="absolute bottom-1/4 -right-6 glass-panel p-4 rounded-3xl shadow-xl border-white/10"
               >
                 <span className="text-3xl">🐉</span>
               </motion.div>
               <motion.div 
                 animate={{ scale: [1, 1.1, 1] }}
                 transition={{ repeat: Infinity, duration: 2.5 }}
                 className="absolute top-1/2 -right-8 glass-panel p-4 rounded-3xl shadow-xl border-white/10"
               >
                 <span className="text-3xl">🪄</span>
               </motion.div>
            </div>

            {/* Magical Light Rays */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-full bg-[radial-gradient(circle_at_center,rgba(234,179,8,0.1)_0%,transparent_70%)] pointer-events-none" />
          </motion.div>
        </div>

        {/* Generation Panel Anchor */}
        <div id="generation-panel" className="scroll-mt-24" />

        {/* Main Generator Form */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-3xl p-6 md:p-8 mb-20"
        >
          
          {/* Category Selector */}
          <div className="mb-8">
            <label className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4 block">{t.worldTheme}</label>
            <div className="flex gap-4 overflow-x-auto pb-6 scrollbar-hide snap-x px-2">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "snap-start flex-shrink-0 flex flex-col items-center justify-center gap-2 w-28 h-24 rounded-2xl border-2 transition-all duration-300",
                    category === cat.id
                      ? "border-primary bg-primary/20 shadow-[0_0_20px_rgba(168,85,247,0.4)] scale-105 z-10"
                      : "border-white/10 bg-white/5 opacity-70 hover:opacity-100 hover:border-white/30 hover:bg-white/10"
                  )}
                >
                  <span className="text-2xl">{cat.icon}</span>
                  <span className="font-semibold text-white text-xs tracking-wide text-center leading-tight px-1">{t.categories[cat.id]}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Face Upload Section */}
          <div className="mb-8">
            <label className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4 block">
              {t.yourFace}
            </label>
            <div className="flex items-center gap-6">
              {facePreview ? (
                <div className="relative w-24 h-24 flex-shrink-0">
                  <img
                    src={facePreview}
                    alt="Your face"
                    className="w-24 h-24 rounded-2xl object-cover border-2 border-primary shadow-[0_0_20px_rgba(168,85,247,0.4)]"
                  />
                  <button
                    onClick={removeFace}
                    className="absolute -top-2 -right-2 bg-red-500 rounded-full p-0.5 hover:bg-red-400 transition-colors"
                  >
                    <X className="w-4 h-4 text-white" />
                  </button>
                </div>
              ) : (
                <button
                  onClick={() => faceInputRef.current?.click()}
                  className="w-24 h-24 rounded-2xl border-2 border-dashed border-white/20 flex flex-col items-center justify-center gap-2 hover:border-primary/60 hover:bg-primary/10 transition-all duration-300 flex-shrink-0"
                >
                  <Camera className="w-7 h-7 text-white/40" />
                  <span className="text-[10px] text-white/40 font-medium">{t.uploadFace}</span>
                </button>
              )}
              <div className="flex-1">
                <p className="text-white/60 text-sm leading-relaxed">{t.faceDesc}</p>
              </div>
              <input
                ref={faceInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleFaceUpload}
              />
            </div>
          </div>

          {/* Language & Voice Row */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
             {/* Language */}
             <div>
                <label className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4 block">{t.language}</label>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => setLanguage(lang.id)}
                      className={cn(
                        "whitespace-nowrap px-4 py-3 rounded-xl text-sm font-medium transition-all border",
                        language === lang.id ? "bg-white/20 text-white border-white/30" : "bg-transparent text-white/40 border-white/10 hover:bg-white/5"
                      )}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
             </div>

             {/* Narrator Voice */}
             <div>
                <label className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4 block">{t.narratorVoice}</label>
                <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
                  {VOICES.map(v => (
                    <button
                      key={v.id}
                      onClick={() => setVoice(v.id)}
                      className={cn(
                        "p-3 rounded-xl transition-all border",
                        voice === v.id ? "bg-accent/20 text-white border-accent/30" : "bg-transparent text-white/40 border-white/10 hover:bg-white/5"
                      )}
                      title={(t.voices as any)[v.id]}
                    >
                      <span>{v.icon}</span>
                    </button>
                  ))}
                </div>
             </div>
          </div>

          {/* Prompt Section (Full Width) */}
          <div className="mb-8">
             <label className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4 block">{t.protagonistGoal}</label>
             <Textarea 
                placeholder={t.placeholder}
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[140px] text-lg bg-black/40 border-white/10"
             />
          </div>

          <Button 
            variant="glow" 
            size="lg" 
            className="w-full h-16 text-lg tracking-wide rounded-2xl"
            onClick={handleGenerate}
            isLoading={generateStoryMutation.isPending}
            disabled={!prompt.trim() && category === 'custom'}
          >
            {!generateStoryMutation.isPending && <Wand2 className="mr-2 w-6 h-6" />}
            {t.conjure}
          </Button>

        </motion.div>

        <AnimatePresence>
          {generateStoryMutation.isPending && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex flex-col items-center justify-center bg-[#050411]/90 backdrop-blur-xl"
            >
              <div className="relative">
                 <div className="absolute -inset-10 bg-primary/20 rounded-full blur-3xl animate-pulse" />
                 <span className="text-9xl magic-wand-animate relative z-10">🪄</span>
                 <div className="sparkle" style={{ top: '-20px', left: '-20px', animationDelay: '0.1s' }} />
                 <div className="sparkle" style={{ top: '40px', right: '-30px', animationDelay: '0.3s' }} />
                 <div className="sparkle" style={{ bottom: '-10px', left: '50px', animationDelay: '0.5s' }} />
                 <div className="sparkle" style={{ top: '80px', left: '-40px', animationDelay: '0.2s' }} />
              </div>
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="mt-12 text-3xl font-display font-bold text-white tracking-widest uppercase"
              >
                Weaving Magic...
              </motion.h2>
              <p className="mt-4 text-white/40 animate-pulse italic">The ink is flowing from the stars</p>
            </motion.div>
          )}
        </AnimatePresence>


        {/* Demo Stories Grouped by Category */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="flex items-center justify-between mb-12">
             <div className="space-y-2">
                <h2 className="text-4xl md:text-5xl font-display font-bold text-white tracking-tight">Discover Realms</h2>
                <p className="text-white/40 italic">Explore infinite worlds created by imagination</p>
             </div>
          </div>

          {isDemosLoading ? (
             <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {[...Array(4)].map((_, i) => (
                  <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
                ))}
             </div>
          ) : Array.isArray(demoStories) && demoStories.length > 0 ? (
            (() => {
              // Group stories by category
              const groupedDemos = demoStories.reduce((acc: Record<string, any[]>, story: any) => {
                const cat = story.category || 'custom';
                if (!acc[cat]) acc[cat] = [];
                acc[cat].push(story);
                return acc;
              }, {} as Record<string, any[]>);

              return Object.entries(groupedDemos).map(([catId, stories]: [string, any[]]) => (
                <div key={catId} className="mb-20">
                  <div className="flex items-center gap-4 mb-8">
                    <div className="h-px flex-grow bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                    <h3 className="text-2xl font-bold text-gradient-gold uppercase tracking-[0.2em] px-6 py-2 glass-card rounded-full border border-white/5">
                      {CATEGORIES.find(c => c.id === catId)?.icon} {(t.categories as any)[catId] || catId}
                    </h3>
                    <div className="h-px flex-grow bg-gradient-to-r from-transparent via-white/10 to-transparent" />
                  </div>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8">
                    {stories.slice(0, 2).map((story: any, storyIdx: number) => {
                      // Best-matching local image per category (always loads instantly)
                      const categoryImagePools: Record<string, string[]> = {
                        king_queen:  ["/images/king_queen_1.png", "/images/king_queen_2.png", "/images/king_queen_3.png", "/images/king_queen_4.png"],
                        princess:    ["/images/cat-princess.webp",   "/images/demo-princess.png",   "/images/demo-forest-girl.png", "/images/cat-princess.webp"],
                        fantasy:     ["/images/fantasy_1.png",       "/images/demo-moon-star.png",   "/images/cat-fantasy.webp",    "/images/demo-forest-girl.png"],
                        magic:       ["/images/cat-magic.webp",      "/images/demo-moon-star.png",   "/images/demo-forest-girl.png", "/images/cat-magic.webp"],
                        friendship:  ["/images/cat-friendship.webp", "/images/demo-friends-storm.png","/images/cat-friendship.webp", "/images/demo-friends-storm.png"],
                        kids:        ["/images/cat-kids.webp",       "/images/demo-rabbit-lion.png", "/images/cat-kids.webp",       "/images/demo-rabbit-lion.png"],
                        bedtime:     ["/images/cat-bedtime.webp",    "/images/demo-moon-star.png",   "/images/cat-bedtime.webp",    "/images/demo-moon-star.png"],
                        moral:       ["/images/cat-moral.webp",      "/images/demo-woodcutter.png",  "/images/cat-moral.webp",      "/images/demo-woodcutter.png"],
                        animal:      ["/images/cat-animal.webp",     "/images/demo-rabbit-lion.png", "/images/cat-animal.webp",     "/images/demo-rabbit-lion.png"],
                        god:         [
                          "https://image.pollinations.ai/prompt/Lord+Ganesha+Wisdom+divine+palace+storybook+art?width=512&height=768&nologo=true&seed=136",
                          "https://image.pollinations.ai/prompt/Lord+Krishna+playing+a+golden+flute+divine+light+storybook+art?width=512&height=768&nologo=true&seed=137",
                          "https://image.pollinations.ai/prompt/Lord+Hanuman+leaping+across+vast+blue+ocean+divine+pose+storybook+art?width=512&height=768&nologo=true&seed=138",
                          "https://image.pollinations.ai/prompt/A+glowing+divine+figure+shaping+a+beautiful+blue+planet+from+clay+cosmic+background+storybook+art?width=512&height=768&nologo=true&seed=139"
                        ],
                        bird:        [
                          "https://image.pollinations.ai/prompt/A+proud+peacock+with+a+grand+colorful+tail+spread+out+vibrant+forest+garden+bird+storybook+art?width=512&height=768&nologo=true&seed=140",
                          "https://image.pollinations.ai/prompt/A+majestic+eagle+soaring+high+above+a+lush+green+valley+winding+river+bird+storybook+art?width=512&height=768&nologo=true&seed=141",
                          "https://image.pollinations.ai/prompt/A+small+brown+bird+singing+on+a+flowering+branch+under+full+moon+magical+notes+storybook+art?width=512&height=768&nologo=true&seed=142",
                          "https://image.pollinations.ai/prompt/Two+bright+blue+jays+sitting+proudly+on+a+neatly+woven+nest+in+a+flowering+spring+tree+bird+storybook+art?width=512&height=768&nologo=true&seed=143"
                        ],
                        custom:      ["/images/cat-custom.webp",     "/images/demo-nature.png",      "/images/demo-anime.png",      "/images/cat-custom.webp"],
                      };

                      const pool = categoryImagePools[story.category as keyof typeof categoryImagePools] || categoryImagePools.custom;
                      const localImg = pool[storyIdx % pool.length];

                      return (
                      <motion.div
                        key={story.id}
                        whileHover={{ y: -10 }}
                        onClick={() => handleDemoClick(story)}
                        className="group relative aspect-[3/4] rounded-3xl overflow-hidden cursor-pointer shadow-2xl hover:shadow-primary/30 transition-all duration-500 border border-white/5"
                      >
                        {/* Local image shown immediately */}
                        <img
                          src={localImg}
                          alt={story.title}
                          className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                        />
                        {/* AI thumbnail loads on top when ready */}
                        {story.thumbnail && (
                          <img
                            src={story.thumbnail}
                            alt=""
                            aria-hidden
                            className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                            onError={(e) => { (e.target as HTMLImageElement).style.display = 'none'; }}
                          />
                        )}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/20 to-transparent opacity-80" />
                        
                        <div className="absolute inset-0 p-6 flex flex-col justify-end">
                          <h4 className="text-xl font-bold text-white mb-3 leading-tight group-hover:text-amber-200 transition-colors">{story.title}</h4>
                          <p className="text-xs text-white/50 line-clamp-2 mb-4 font-light opacity-0 group-hover:opacity-100 transition-all duration-300 translate-y-2 group-hover:translate-y-0">
                            {story.description}
                          </p>
                          
                          {/* Play Badge */}
                          <div className="flex items-center gap-2 text-[10px] font-bold text-primary uppercase tracking-widest bg-white/10 w-fit px-3 py-1.5 rounded-lg border border-white/10">
                            <Play className="w-3 h-3 fill-current" />
                            Read Story
                          </div>
                        </div>
                      </motion.div>
                    )})}
                  </div>
                </div>
              ));
            })()
          ) : (
            <div className="col-span-full py-12 text-center text-white/50">
              No demo stories available yet. Create your own above!
            </div>
          )}
        </motion.div>

      </div>
      <Footer />
    </div>
  );
}
