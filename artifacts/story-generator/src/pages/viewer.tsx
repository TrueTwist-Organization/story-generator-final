import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useStoryStore } from "@/lib/store";
import { SceneViewer } from "@/components/SceneViewer";
import { Button } from "@/components/ui/button";
import { ChevronLeft, Trophy } from "lucide-react";
import { motion } from "framer-motion";

export default function ViewerPage() {
  const [_, setLocation] = useLocation();
  const { activeStory, clearActiveStory } = useStoryStore();
  const [activeSceneIndex, setActiveSceneIndex] = useState(0);
  const [score, setScore] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  // Redirect to home if no story is loaded
  useEffect(() => {
    if (!activeStory) {
      setLocation("/");
    }
  }, [activeStory, setLocation]);

  // Handle scroll snap to determine active scene
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const handleScroll = () => {
      // Calculate which scene is currently most visible
      const sceneHeight = window.innerHeight;
      const scrollPosition = container.scrollTop;
      const newIndex = Math.round(scrollPosition / sceneHeight);
      
      if (newIndex !== activeSceneIndex && newIndex >= 0 && newIndex < (activeStory?.scenes.length || 0)) {
        setActiveSceneIndex(newIndex);
      }
    };

    container.addEventListener("scroll", handleScroll, { passive: true });
    return () => container.removeEventListener("scroll", handleScroll);
  }, [activeSceneIndex, activeStory]);

  if (!activeStory) return null;

  const handleBack = () => {
    clearActiveStory();
    setLocation("/");
  };

  const handleScoreUpdate = (delta: number) => {
    setScore(prev => prev + delta);
  };

  return (
    <div className="relative w-full h-dvh bg-black overflow-hidden font-sans">
      {/* Fixed Header Overlay */}
      <div className="absolute top-0 left-0 right-0 z-50 p-4 flex items-center justify-between pointer-events-none">
        <Button 
          variant="glass" 
          size="icon" 
          onClick={handleBack}
          className="rounded-full pointer-events-auto"
        >
          <ChevronLeft className="w-6 h-6" />
        </Button>

        {activeStory.mode === 'game' && (
          <div className="glass-panel px-4 py-2 rounded-full flex items-center gap-2 pointer-events-auto">
            <Trophy className="w-5 h-5 text-accent" />
            <span className="font-bold text-white">{score}</span>
          </div>
        )}
      </div>

      {/* Progress Indicators */}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 z-50 flex gap-2 pointer-events-none">
        {activeStory.scenes.map((_, idx) => (
          <div 
            key={idx}
            className={`h-1.5 rounded-full transition-all duration-300 ${
              idx === activeSceneIndex ? 'w-8 bg-primary shadow-[0_0_10px_rgba(168,85,247,0.8)]' : 'w-2 bg-white/30'
            }`}
          />
        ))}
      </div>

      {/* Scrollable Scenes Container */}
      <div 
        ref={containerRef}
        className="scroll-snap-container"
      >
        {activeStory.scenes.map((scene, idx) => (
          <SceneViewer 
            key={scene.sceneNumber} 
            scene={scene} 
            story={activeStory}
            isActive={idx === activeSceneIndex}
            onChoiceMade={handleScoreUpdate}
          />
        ))}
        
        {/* Final Quiz or End Screen */}
        <div className="scroll-snap-section flex items-center justify-center bg-black relative">
           <div className="absolute inset-0 bg-[url('https://images.unsplash.com/photo-1534447677768-be436bb09401?q=80&w=2094&auto=format&fit=crop')] bg-cover bg-center opacity-30 mix-blend-overlay" />
           <div className="absolute inset-0 bg-gradient-to-b from-transparent to-black" />
           
           <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            className="relative z-10 glass-panel p-10 rounded-3xl max-w-md w-full text-center"
           >
              <h2 className="text-4xl font-display font-bold text-white mb-4">The End</h2>
              <p className="text-white/70 mb-8">
                {activeStory.mode === 'game' 
                  ? `You finished the adventure with a score of ${score}!`
                  : "Hope you enjoyed this immersive tale."}
              </p>
              
              <Button variant="glow" size="lg" className="w-full" onClick={handleBack}>
                Create Another Story
              </Button>
           </motion.div>
        </div>
      </div>
    </div>
  );
}
