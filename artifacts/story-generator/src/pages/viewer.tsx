import React, { useEffect, useState, useRef } from "react";
import { useLocation } from "wouter";
import { useStoryStore } from "@/lib/store";
import { SceneViewer } from "@/components/SceneViewer";
import { BookViewer } from "@/components/BookViewer";
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

  // Handle scroll snap to determine active scene (for video/game modes)
  useEffect(() => {
    const container = containerRef.current;
    if (!container || activeStory?.mode === 'image') return;

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

  // Always use the Flipbook UI for a magical experience
  return (
    <BookViewer 
      story={activeStory} 
      onBack={handleBack} 
    />
  );
}
