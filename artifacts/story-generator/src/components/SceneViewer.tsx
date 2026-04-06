import React, { useEffect, useState, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Volume2, VolumeX, Play, CheckCircle2, XCircle } from "lucide-react";
import { useStoryStore } from "@/lib/store";
import { 
  useGenerateStoryImage, 
  useGenerateNarration 
} from "@workspace/api-client-react";
import type { StoryScene, StoryResponse } from "@workspace/api-client-react";
import { getBase64ImageUrl, getBase64AudioUrl, cn } from "@/lib/utils";
import { Button } from "./ui/button";

interface SceneViewerProps {
  scene: StoryScene;
  story: StoryResponse;
  isActive: boolean;
  onChoiceMade?: (scoreDelta: number) => void;
}

export function SceneViewer({ scene, story, isActive, onChoiceMade }: SceneViewerProps) {
  const { voice, faceImage } = useStoryStore();
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [choiceResult, setChoiceResult] = useState<'success' | 'fail' | null>(null);
  const [isUsingSynthesis, setIsUsingSynthesis] = useState(false);
  
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthRef = useRef<SpeechSynthesisUtterance | null>(null);
  
  const generateImage = useGenerateStoryImage();
  const generateAudio = useGenerateNarration();

  // Lazy load image when scene becomes active (or pre-load if it's the first scene)
  useEffect(() => {
    if (isActive && !imageUrl && !generateImage.isPending && !generateImage.isSuccess) {
      generateImage.mutate(
        { data: { prompt: scene.imagePrompt, category: story.category, faceImage: faceImage || undefined } },
        {
          onSuccess: (res) => {
            setImageUrl(getBase64ImageUrl(res.b64_json));
          }
        }
      );
    }
  }, [isActive, imageUrl, generateImage, scene.imagePrompt, story.category]);

  // Lazy load audio
  useEffect(() => {
    // Only try if active and we don't have audio yet and are not currently loading
    if (isActive && !audioUrl && !generateAudio.isPending) {
      console.log(`🔊 Requesting audio for: "${scene.text.slice(0, 30)}..." in ${story.language}`);
      
      generateAudio.mutate(
        { data: { text: scene.text, language: story.language as any, voice } },
        {
          onSuccess: (res) => {
            console.log("✅ Audio received from server:", !!res?.audioBase64);
            if (res.audioBase64) {
              setAudioUrl(getBase64AudioUrl(res.audioBase64, res.format));
            } else {
              console.warn("⚠️ No audio data in response, falling back to synthesis");
            }
          },
          onError: (err) => {
            console.error("❌ Audio generation error:", err);
          }
        }
      );
    }
  }, [isActive, audioUrl, generateAudio, scene.text, story.language, voice]);

  const stopAllAudio = () => {
    if (audioRef.current) audioRef.current.pause();
    if (window.speechSynthesis) window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  const speakText = (text: string, lang: string) => {
    if (!window.speechSynthesis) return;
    window.speechSynthesis.cancel();
    
    const utterance = new SpeechSynthesisUtterance(text);
    // Map language to BCP47 tags
    if (lang === 'hindi') utterance.lang = 'hi-IN';
    else if (lang === 'gujarati') utterance.lang = 'gu-IN';
    else utterance.lang = 'en-US';
    
    utterance.rate = 0.9; // Slightly slower for clarity
    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => setIsPlaying(false);
    
    synthRef.current = utterance;
    window.speechSynthesis.speak(utterance);
    setIsPlaying(true);
    setIsUsingSynthesis(true);
  };

  // Handle auto-play when active
  useEffect(() => {
    if (isActive) {
      if (audioUrl && audioRef.current) {
        audioRef.current.play().catch(e => console.log("Autoplay prevented:", e));
        setIsPlaying(true);
      } else if (generateAudio.isError || (generateAudio.isSuccess && !audioUrl)) {
        // AI failed, use browser synthesis
        speakText(scene.text, story.language);
      }
    } else {
      stopAllAudio();
    }
    
    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  }, [isActive, audioUrl, generateAudio.isError, generateAudio.isSuccess]);

  const toggleAudio = () => {
    if (isPlaying) {
      stopAllAudio();
    } else {
      if (audioUrl && audioRef.current) {
        audioRef.current.play();
        setIsPlaying(true);
        setIsUsingSynthesis(false);
      } else {
        speakText(scene.text, story.language);
      }
    }
  };

  const handleChoice = (isCorrect?: boolean) => {
    if (isCorrect) {
      setChoiceResult('success');
      onChoiceMade?.(100);
    } else {
      setChoiceResult('fail');
      onChoiceMade?.(0);
    }
  };

  return (
    <div className="scroll-snap-section flex flex-col justify-end bg-black">
      {/* Background Image Layer */}
      <AnimatePresence>
        {imageUrl ? (
          <motion.div
            initial={{ opacity: 0, scale: 1.05 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            className="absolute inset-0 bg-cover bg-center z-0"
            style={{ backgroundImage: `url(${imageUrl})` }}
          />
        ) : (
          <motion.div 
            className="absolute inset-0 z-0 flex items-center justify-center bg-zinc-900"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="flex flex-col items-center gap-4">
              <div className="w-12 h-12 border-4 border-primary/30 border-t-primary rounded-full animate-spin" />
              <p className="text-muted-foreground font-medium animate-pulse">Visualizing scene...</p>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Dark Gradient Overlay for text readability */}
      <div className="absolute inset-0 bg-gradient-to-t from-black/95 via-black/50 to-black/10 z-10" />

      {/* Content Layer */}
      <div className="relative z-20 w-full max-w-3xl mx-auto p-6 md:p-10 pb-24 md:pb-12 flex flex-col gap-6">
        
        {/* Audio Player hidden element */}
        <audio 
          ref={audioRef} 
          src={audioUrl || ""} 
          onEnded={() => setIsPlaying(false)} 
          className="hidden" 
        />

        {/* Game Mode Choices */}
        {story.mode === 'game' && scene.choices && scene.choices.length > 0 && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 20 }}
            transition={{ delay: 0.5 }}
            className="flex flex-col gap-3 mb-4"
          >
            <h3 className="text-accent font-display text-xl mb-2 drop-shadow-md">What happens next?</h3>
            {scene.choices.map((choice, idx) => (
              <Button 
                key={choice.id}
                variant={choiceResult ? (choice.isCorrect ? "glow" : "outline") : "glass"}
                className={cn(
                  "justify-start h-auto py-4 px-6 text-left whitespace-normal",
                  choiceResult && !choice.isCorrect && "opacity-50 grayscale"
                )}
                onClick={() => !choiceResult && handleChoice(choice.isCorrect)}
                disabled={choiceResult !== null}
              >
                <div className="flex items-center gap-3 w-full">
                  <span className="flex-shrink-0 w-8 h-8 rounded-full bg-black/30 flex items-center justify-center font-bold">
                    {String.fromCharCode(65 + idx)}
                  </span>
                  <span className="flex-grow">{choice.text}</span>
                  {choiceResult && choice.isCorrect && <CheckCircle2 className="text-green-400" />}
                  {choiceResult === 'fail' && !choice.isCorrect && <XCircle className="text-red-400" />}
                </div>
              </Button>
            ))}
          </motion.div>
        )}

        {/* Text Content */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: isActive ? 1 : 0, y: isActive ? 0 : 30 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="glass-panel rounded-3xl p-6 md:p-8"
        >
          <div className="flex justify-between items-start gap-4 mb-4">
            <h2 className="text-2xl md:text-4xl font-display font-bold text-white drop-shadow-lg">
              {scene.title}
            </h2>
            
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={toggleAudio}
              className="rounded-full bg-white/10 hover:bg-white/20 backdrop-blur-md shrink-0"
            >
              {generateAudio.isPending ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : isPlaying ? (
                <Volume2 className="w-5 h-5 text-accent" />
              ) : (
                <VolumeX className="w-5 h-5 text-white/70" />
              )}
            </Button>
          </div>
          
          <p className="text-lg md:text-xl leading-relaxed text-white/90 font-light drop-shadow-sm">
            {scene.text}
          </p>
        </motion.div>
      </div>
    </div>
  );
}
