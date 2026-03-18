import React, { useState } from "react";
import { useLocation } from "wouter";
import { motion } from "framer-motion";
import { Sparkles, Wand2, Image as ImageIcon, Video, Gamepad2, Play } from "lucide-react";
import { useStoryStore } from "@/lib/store";
import { useGenerateStory, useGetDemoStories } from "@workspace/api-client-react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import type { GenerateStoryBodyCategory, GenerateStoryBodyMode, GenerateStoryBodyLanguage } from "@workspace/api-client-react/src/generated/api.schemas";

const CATEGORIES: { id: GenerateStoryBodyCategory; label: string; icon: string }[] = [
  { id: "nature", label: "Nature", icon: "🌿" },
  { id: "princess", label: "Princess", icon: "👑" },
  { id: "anime", label: "Anime", icon: "🌸" },
  { id: "travel", label: "Travel", icon: "✈️" },
  { id: "custom", label: "Custom", icon: "✨" },
];

const MODES: { id: GenerateStoryBodyMode; label: string; icon: React.ReactNode; desc: string }[] = [
  { id: "image", label: "Story Book", icon: <ImageIcon className="w-6 h-6" />, desc: "Beautiful illustrated pages" },
  { id: "video", label: "Cinematic", icon: <Video className="w-6 h-6" />, desc: "Immersive auto-playing scenes" },
  { id: "game", label: "Adventure", icon: <Gamepad2 className="w-6 h-6" />, desc: "Make choices to survive" },
];

const LANGUAGES: { id: GenerateStoryBodyLanguage; label: string }[] = [
  { id: "english", label: "English" },
  { id: "hindi", label: "हिंदी" },
  { id: "gujarati", label: "ગુજરાતી" },
];

export default function HomePage() {
  const [_, setLocation] = useLocation();
  const { setActiveStory } = useStoryStore();
  
  const [prompt, setPrompt] = useState("");
  const [category, setCategory] = useState<GenerateStoryBodyCategory>("custom");
  const [mode, setMode] = useState<GenerateStoryBodyMode>("image");
  const [language, setLanguage] = useState<GenerateStoryBodyLanguage>("english");

  const generateStoryMutation = useGenerateStory();
  const { data: demoStories, isLoading: isDemosLoading } = useGetDemoStories();

  const handleGenerate = () => {
    if (!prompt.trim() && category === 'custom') return;
    
    // If category is not custom and prompt is empty, use category name as fallback prompt
    const finalPrompt = prompt.trim() || `A magical tale about ${category}`;

    generateStoryMutation.mutate(
      {
        data: {
          prompt: finalPrompt,
          category,
          language,
          mode,
          numScenes: 4 // Defaulting to 4 scenes for good UX
        }
      },
      {
        onSuccess: (data) => {
          setActiveStory(data);
          setLocation("/story");
        }
      }
    );
  };

  const handleDemoClick = (story: any) => {
    setActiveStory(story);
    setLocation("/story");
  };

  return (
    <div className="min-h-screen bg-background overflow-x-hidden pb-24">
      {/* Hero Background using the generated AI image */}
      <div className="absolute top-0 left-0 w-full h-[60vh] z-0 overflow-hidden pointer-events-none">
        <img 
          src={`${import.meta.env.BASE_URL}images/hero-bg.png`}
          alt="Magical background"
          className="w-full h-full object-cover opacity-40 mix-blend-screen"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-transparent via-background/80 to-background" />
      </div>

      <div className="relative z-10 max-w-5xl mx-auto px-4 sm:px-6 pt-20">
        
        {/* Header */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card text-sm font-medium text-accent mb-6 border-accent/20">
            <Sparkles className="w-4 h-4" />
            <span>AI Powered Generation</span>
          </div>
          <h1 className="text-5xl md:text-7xl font-display font-bold text-white mb-6 leading-tight">
            Craft Your <br/>
            <span className="text-gradient-gold">Epic Tale</span>
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Immerse yourself in infinite worlds. Generate beautiful, voice-narrated stories and interactive adventures in seconds.
          </p>
        </motion.div>

        {/* Main Generator Form */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-panel rounded-3xl p-6 md:p-8 mb-20"
        >
          
          {/* Category Selector */}
          <div className="mb-8">
            <label className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4 block">World Theme</label>
            <div className="flex gap-3 overflow-x-auto pb-4 scrollbar-hide snap-x">
              {CATEGORIES.map(cat => (
                <button
                  key={cat.id}
                  onClick={() => setCategory(cat.id)}
                  className={cn(
                    "snap-start flex-shrink-0 flex items-center gap-2 px-6 py-3 rounded-2xl border transition-all duration-300",
                    category === cat.id 
                      ? "bg-primary/20 border-primary shadow-[0_0_15px_rgba(168,85,247,0.3)] text-white" 
                      : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10"
                  )}
                >
                  <span className="text-xl">{cat.icon}</span>
                  <span className="font-medium">{cat.label}</span>
                </button>
              ))}
            </div>
          </div>

          {/* Mode Selector */}
          <div className="mb-8">
            <label className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4 block">Experience Mode</label>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {MODES.map(m => (
                <button
                  key={m.id}
                  onClick={() => setMode(m.id)}
                  className={cn(
                    "flex flex-col items-start p-5 rounded-2xl border transition-all duration-300 text-left",
                    mode === m.id
                      ? "bg-gradient-to-br from-primary/20 to-transparent border-primary/50 shadow-[0_0_20px_rgba(168,85,247,0.2)]"
                      : "bg-black/40 border-white/5 hover:bg-white/5"
                  )}
                >
                  <div className={cn("p-3 rounded-xl mb-4", mode === m.id ? "bg-primary text-white" : "bg-white/10 text-white/60")}>
                    {m.icon}
                  </div>
                  <h3 className="text-white font-bold text-lg mb-1">{m.label}</h3>
                  <p className="text-sm text-white/50">{m.desc}</p>
                </button>
              ))}
            </div>
          </div>

          {/* Language & Prompt */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
             <div className="md:col-span-1">
                <label className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4 block">Language</label>
                <div className="flex flex-col gap-2">
                  {LANGUAGES.map(lang => (
                    <button
                      key={lang.id}
                      onClick={() => setLanguage(lang.id)}
                      className={cn(
                        "px-4 py-3 rounded-xl text-left font-medium transition-all",
                        language === lang.id ? "bg-white/20 text-white border border-white/30" : "bg-transparent text-white/50 hover:bg-white/5"
                      )}
                    >
                      {lang.label}
                    </button>
                  ))}
                </div>
             </div>
             
             <div className="md:col-span-3">
                <label className="text-sm font-semibold text-white/80 uppercase tracking-wider mb-4 block">The Protagonist's Goal</label>
                <Textarea 
                  placeholder="e.g. A young wizard trying to find a lost star fragment..."
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  className="min-h-[140px]"
                />
             </div>
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
            Conjure Story
          </Button>

        </motion.div>


        {/* Demo Stories Section */}
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          className="mt-20"
        >
          <div className="flex items-center justify-between mb-8">
             <h2 className="text-3xl font-display font-bold text-white">Discover Realms</h2>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {isDemosLoading ? (
               [...Array(4)].map((_, i) => (
                 <div key={i} className="aspect-[3/4] rounded-2xl bg-white/5 animate-pulse" />
               ))
            ) : demoStories && demoStories.length > 0 ? (
              demoStories.slice(0, 4).map((story, i) => {
                // Using the generated demo images based on category mapping
                let imgPath = `${import.meta.env.BASE_URL}images/demo-nature.png`;
                if(story.category === 'princess') imgPath = `${import.meta.env.BASE_URL}images/demo-princess.png`;
                if(story.category === 'anime') imgPath = `${import.meta.env.BASE_URL}images/demo-anime.png`;

                return (
                <div 
                  key={story.id}
                  onClick={() => handleDemoClick(story)}
                  className="group relative aspect-[3/4] rounded-2xl overflow-hidden cursor-pointer shadow-lg hover:shadow-primary/20 transition-all duration-500 hover:-translate-y-2"
                >
                  <img 
                    src={story.thumbnail || imgPath} 
                    alt={story.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />
                  
                  <div className="absolute inset-0 p-5 flex flex-col justify-end">
                    <div className="bg-primary/80 backdrop-blur text-xs font-bold px-2 py-1 rounded w-fit mb-3 uppercase tracking-wider">
                      {story.category}
                    </div>
                    <h3 className="text-xl font-bold text-white mb-2 leading-tight">{story.title}</h3>
                    
                    {/* Hover Play Button */}
                    <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-14 h-14 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                      <Play className="w-6 h-6 text-white ml-1" />
                    </div>
                  </div>
                </div>
              )})
            ) : (
              <div className="col-span-full py-12 text-center text-white/50">
                No demo stories available yet. Create your own above!
              </div>
            )}
          </div>
        </motion.div>

      </div>
    </div>
  );
}
