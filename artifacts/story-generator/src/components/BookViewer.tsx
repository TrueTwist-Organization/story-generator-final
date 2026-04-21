import React, { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Play, Pause, RefreshCw, Volume2, VolumeX } from "lucide-react";
import { Button } from "./ui/button";
import { 
  useGenerateStoryImage, 
  useGenerateNarration 
} from "@workspace/api-client-react";
import type { StoryScene, StoryResponse } from "@workspace/api-client-react";
import { getBase64ImageUrl, getBase64AudioUrl, cn } from "@/lib/utils";
import { useStoryStore } from "@/lib/store";

interface BookViewerProps {
  story: StoryResponse;
  onBack: () => void;
}

const BOOK_TRANSLATIONS = {
  english: {
    back: "Back",
    page: "Page",
    epilogue: "Epilogue",
    nextPage: "Next Page",
    readAgain: "Read Again",
    backToLibrary: "Back to Library",
    fin: "Fin.",
    endSub: "The story has come to an end, but your next journey is just a page turn away.",
    loadingImage: "Loading image...",
    weavingVisuals: "Weaving your story visuals...",
    genFailed: "Image generation failed",
    retry: "Retry Generating",
    question: "Question"
  },
  hindi: {
    back: "पीछे",
    page: "पृष्ठ",
    epilogue: "उपसंहार",
    nextPage: "अगला पृष्ठ",
    readAgain: "पुनः पढ़ें",
    backToLibrary: "लाइब्रेरी में वापस",
    fin: "समाप्त",
    endSub: "कहानी खत्म हो गई है, लेकिन आपकी अगली यात्रा बस एक पन्ना दूर है।",
    loadingImage: "छवि लोड हो रही है...",
    weavingVisuals: "कहानी के दृश्य बन रहे हैं...",
    genFailed: "छवि निर्माण विफल",
    retry: "पुनः प्रयास करें",
    question: "प्रश्न"
  },
  gujarati: {
    back: "પાછા",
    page: "પૃષ્ઠ",
    epilogue: "ઉપસંહાર",
    nextPage: "આગળનું પૃષ્ઠ",
    readAgain: "ફરીથી વાંચો",
    backToLibrary: "લાઇબ્રેરીમાં પાછા",
    fin: "સમાપ્ત",
    endSub: "વાર્તા પૂરી થઈ ગઈ છે, પરંતુ તમારી આગામી સફર ફક્ત એક પૃષ્ઠ દૂર છે.",
    loadingImage: "ચિત્ર લોડ થઈ રહ્યું છે...",
    weavingVisuals: "વાર્તાના દ્રશ્યો બની રહ્યા છે...",
    genFailed: "ચિત્ર બનાવવામાં નિષ્ફળ",
    retry: "ફરીથી પ્રયાસ કરો",
    question: "પ્રશ્ન"
  }
};

export function BookViewer({ story, onBack }: BookViewerProps) {
  const { voice: storeVoice } = useStoryStore();
  const [currentPage, setCurrentPage] = useState(0);
  const [isNarrationEnabled, setIsNarrationEnabled] = useState(true);
  const [urlCache, setUrlCache] = useState<Record<number, { image?: string; audio?: string }>>({});
  
  const hasQuiz = story.mode === 'game' && (story as any).quizQuestions && (story as any).quizQuestions.length > 0;
  const totalPages = story.scenes.length + (hasQuiz ? 1 : 0) + 1; // +1 for end screen, +1 for quiz if it exists
  const quizPageIndex = story.scenes.length;
  const endPageIndex = totalPages - 1;

  const bt = BOOK_TRANSLATIONS[story.language as keyof typeof BOOK_TRANSLATIONS] || BOOK_TRANSLATIONS.english;

  const handleNext = () => {
    if (currentPage < totalPages - 1) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentPage > 0) {
      setCurrentPage(prev => prev - 1);
    }
  };

  const updateCache = (index: number, data: { image?: string; audio?: string }) => {
    setUrlCache(prev => ({
      ...prev,
      [index]: { ...prev[index], ...data }
    }));
  };

  return (
    <div className="relative w-full h-dvh bg-[#050411] overflow-hidden flex flex-col items-center justify-center font-display">
      {/* Background Ambience */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#2d1b69,#0c0824,#050411)] opacity-90 z-0" />
      
      {/* Top Controls */}
      <div className="absolute top-0 left-0 right-0 z-50 p-6 flex justify-between items-center bg-gradient-to-b from-black/80 to-transparent">
        <Button variant="ghost" onClick={onBack} className="text-white/70 hover:text-white transition-colors">
          <ChevronLeft className="mr-2 h-5 w-5" /> {bt.back}
        </Button>
        <div className="flex items-center gap-4">
          <div className="text-white/90 text-sm font-medium tracking-[0.2em] uppercase">
            {currentPage < story.scenes.length ? `${bt.page} ${currentPage + 1}` : bt.epilogue}
          </div>
          <Button 
            variant="glass" 
            size="icon" 
            className="rounded-full w-10 h-10 border-white/20"
            onClick={() => setIsNarrationEnabled(!isNarrationEnabled)}
          >
            {isNarrationEnabled ? <Volume2 className="h-4 w-4 text-accent" /> : <VolumeX className="h-4 w-4 text-white/40" />}
          </Button>
        </div>
      </div>

      {/* Book Container */}
      <div className="relative z-10 w-full max-w-6xl aspect-[16/10] md:aspect-[16/9] lg:aspect-[1.8/1] px-4 md:px-12">
        <AnimatePresence mode="wait">
          {currentPage < story.scenes.length ? (
            <BookPage 
              key={currentPage}
              pageIndex={currentPage}
              scene={story.scenes[currentPage]} 
              story={story}
              voice={storeVoice}
              isNarrationEnabled={isNarrationEnabled}
              cachedUrls={urlCache[currentPage] || {}}
              onUrlsGenerated={(data) => updateCache(currentPage, data)}
              onNext={handleNext}
              onPrev={handlePrev}
              canPrev={currentPage > 0}
            />
          ) : hasQuiz && currentPage === quizPageIndex ? (
            <QuizPage 
              key="quiz"
              language={story.language as any}
              questions={(story as any).quizQuestions}
              onComplete={handleNext}
            />
          ) : (
            <EndPage 
              key="end"
              language={story.language as any}
              onRestart={() => setCurrentPage(0)}
              onExit={onBack}
            />
          )}
        </AnimatePresence>
        
        {/* Background Preloader — only next 1 scene to avoid Replicate rate limits */}
        {story.scenes.map((s, idx) => {
          // Only preload the immediately next scene
          if (idx !== currentPage + 1 || urlCache[idx]?.image) return null;

          return (
            <div key={`preload-${idx}`} className="hidden">
              <BookPage
                pageIndex={idx}
                scene={s}
                story={story}
                voice={storeVoice}
                isNarrationEnabled={false}
                cachedUrls={urlCache[idx] || {}}
                onUrlsGenerated={(data) => updateCache(idx, data)}
                onNext={() => {}}
                onPrev={() => {}}
                canPrev={false}
              />
            </div>
          );
        })}
      </div>

      {/* Progress Indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2">
        {Array.from({ length: totalPages }).map((_, i) => (
          <div 
            key={i} 
            className={cn(
              "h-1.5 rounded-full transition-all duration-500",
              i === currentPage ? "w-10 bg-accent shadow-[0_0_15px_rgba(234,179,8,0.5)]" : "w-1.5 bg-white/20"
            )}
          />
        ))}
      </div>

      {/* Navigation Arrows */}
      {currentPage > 0 && (
        <button 
          onClick={handlePrev}
          className="absolute left-4 md:left-12 top-1/2 -translate-y-1/2 z-50 p-2 text-accent hover:text-white transition-all transform hover:scale-125 active:scale-90"
        >
          <div className="w-16 h-16 rounded-full border-2 border-accent/30 flex items-center justify-center bg-accent/10 backdrop-blur-sm shadow-[0_0_20px_rgba(234,179,8,0.3)]">
            <ChevronLeft className="w-10 h-10" />
          </div>
        </button>
      )}
      <button 
        onClick={handleNext}
        className="absolute right-4 md:right-12 top-1/2 -translate-y-1/2 z-50 p-2 text-accent hover:text-white transition-all transform hover:scale-125 active:scale-90"
      >
        <div className="w-16 h-16 rounded-full border-2 border-accent/30 flex items-center justify-center bg-accent/10 backdrop-blur-sm shadow-[0_0_20px_rgba(234,179,8,0.3)]">
          <ChevronRight className="w-10 h-10" />
        </div>
      </button>
    </div>
  );
}

interface BookPageProps {
  pageIndex: number;
  scene: StoryScene;
  story: StoryResponse;
  voice: string;
  isNarrationEnabled: boolean;
  cachedUrls: { image?: string; audio?: string };
  onUrlsGenerated: (data: { image?: string; audio?: string }) => void;
  onNext: () => void;
  onPrev: () => void;
  canPrev: boolean;
}

function BookPage({
  scene,
  story,
  voice,
  isNarrationEnabled,
  cachedUrls,
  onUrlsGenerated,
  onNext
}: BookPageProps) {
  const { faceImage } = useStoryStore();
  const bt = BOOK_TRANSLATIONS[story.language as keyof typeof BOOK_TRANSLATIONS] || BOOK_TRANSLATIONS.english;
  const [imageUrl, setImageUrl] = useState<string | null>(cachedUrls.image || (scene as any).imageUrl || null);
  const [isImageLoaded, setIsImageLoaded] = useState(!!(cachedUrls.image || (scene as any).imageUrl));
  const [imageError, setImageError] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(cachedUrls.audio || null);
  const [isPlaying, setIsPlaying] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null);
  // Ref so auto-play effect never re-fires just because onNext changed identity
  const onNextRef = useRef(onNext);
  useEffect(() => { onNextRef.current = onNext; }, [onNext]);
  // Guard: prevent audio from restarting if already started on this page
  const hasStartedNarration = useRef(false);
  // Guard: prevent re-requesting if already tried for this specific prompt
  const lastAttemptedImagePrompt = useRef<string | null>(null);
  const lastAttemptedAudioText = useRef<string | null>(null);
 
  const generateImage = useGenerateStoryImage();
  const generateAudio = useGenerateNarration();
 
  // Load Image — passes faceImage to InstantID for face-preserved scene generation
  useEffect(() => {
    // 1. If we already have a URL (from cache or manual imageUrl), skip generation
    if (imageUrl || generateImage.isPending || imageError) return;
 
    // 2. STOP automatic generation for demo stories as requested by user
    // This allows the user to add images manually to characters/scenes later
    if (story.id.startsWith("demo-")) {
      console.log(`ℹ️ [BookPage] Automatic generation skipped for demo story scene.`);
      return;
    }
 
    if (!scene.imagePrompt || lastAttemptedImagePrompt.current === scene.imagePrompt) return;
 
    console.log(`🎨 [BookPage] Requesting image for: "${scene.imagePrompt.slice(0, 30)}..."`);
    lastAttemptedImagePrompt.current = scene.imagePrompt;
 
    generateImage.mutate(
      { data: { prompt: scene.imagePrompt, category: story.category, faceImage: faceImage || undefined } },
      {
        onSuccess: (res) => {
          const url = res.url || (res.b64_json ? getBase64ImageUrl(res.b64_json) : null);
          if (url) {
            setImageUrl(url);
            setImageError(false);
            onUrlsGenerated({ image: url });
          } else {
            console.error("❌ [BookPage] No image URL in response");
            setImageError(true);
          }
        },
        onError: (err) => {
          console.error("❌ [BookPage] Image generation failed:", err);
          setImageError(true);
        }
      }
    );
  }, [scene.imagePrompt, story.category, imageUrl, generateImage.isPending, imageError]);

  // Load Audio
  useEffect(() => {
    if (audioUrl || generateAudio.isPending || generateAudio.isError) return;
    if (!scene.text || lastAttemptedAudioText.current === scene.text) return;

    console.log(`🔊 [BookPage] Requesting audio for: "${scene.text.slice(0, 30)}..."`);
    lastAttemptedAudioText.current = scene.text;

    generateAudio.mutate(
      { data: { text: scene.text || "", language: story.language as any, voice } },
      { 
        onSuccess: (res) => {
            if (res && res.audioBase64) {
              const url = getBase64AudioUrl(res.audioBase64, res.format || "mp3");
              setAudioUrl(url);
              onUrlsGenerated({ audio: url });
            } else {
              console.info("⚠️ [BookPage] No audio data from API, will use fallback");
              setAudioUrl(null);
            }
        },
        onError: (err) => {
          console.error("❌ [BookPage] Audio generation error:", err);
        }
      }
    );
  }, [scene.text, story.language, audioUrl, voice, generateAudio.isPending, generateAudio.isError]);

  // Auto-play / Narration Logic
  useEffect(() => {
    if (!isNarrationEnabled) {
      if (audioRef.current) {
        audioRef.current.pause();
        setIsPlaying(false);
      }
      if (window.speechSynthesis) window.speechSynthesis.cancel();
      hasStartedNarration.current = false;
      return;
    }

    // Guard: don't restart audio if already started on this page
    if (hasStartedNarration.current) return;

    const autoNext = () => {
      if (scene.choices && scene.choices.length > 0) return;
      setTimeout(() => onNextRef.current(), 1500);
    };

    if (audioUrl && audioRef.current) {
      hasStartedNarration.current = true;
      audioRef.current.play().catch(e => console.warn("Audio play blocked", e));
      setIsPlaying(true);
      audioRef.current.onended = autoNext;
    } else if (!audioUrl && !generateAudio.isPending) {
      // Browser Speech Synthesis Fallback (only when API audio is unavailable)
      if (window.speechSynthesis) {
        hasStartedNarration.current = true;
        
        const speakText = () => {
          // Cancel any ongoing speech first
          window.speechSynthesis.cancel();
          
          const utterance = new SpeechSynthesisUtterance(scene.text || "");
          const voices = window.speechSynthesis.getVoices();
          let selectedVoice = null;

          console.log(`🔊 [BrowserSpeech] Attempting synthesis for ${story.language}. Available voices: ${voices.length}`);

          if (story.language === 'hindi') {
            utterance.lang = 'hi-IN';
            selectedVoice = voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')) ||
                           voices.find(v => v.lang.startsWith('en')); // Fallback to English if no Hindi
          } else if (story.language === 'gujarati') {
            utterance.lang = 'gu-IN';
            // Gujarati is rare in default browser voices, fallback to Hindi or English
            selectedVoice = voices.find(v => v.lang.startsWith('gu') || v.name.toLowerCase().includes('gujarati')) ||
                           voices.find(v => v.lang.startsWith('hi') || v.name.toLowerCase().includes('hindi')) ||
                           voices.find(v => v.lang.startsWith('en'));
          } else {
            utterance.lang = 'en-US';
            selectedVoice = voices.find(v => v.lang.startsWith('en-US')) || voices[0];
          }

          if (selectedVoice) {
            console.log(`🔊 [BrowserSpeech] Selected voice: ${selectedVoice.name}`);
            utterance.voice = selectedVoice;
          }
          
          utterance.rate = 0.9; // Slightly slower for better clarity
          utterance.pitch = 1.0;

          utterance.onstart = () => {
            console.log("🔊 [BrowserSpeech] Started speaking");
            setIsPlaying(true);
          };
          
          utterance.onerror = (e) => {
            console.error("❌ [BrowserSpeech] Error:", e);
            setIsPlaying(false);
          };
          
          utterance.onend = () => {
            console.log("🔊 [BrowserSpeech] Finished speaking");
            setIsPlaying(false);
            autoNext();
          };

          // Some browsers need a tiny delay for voice loading or gesture clearing
          setTimeout(() => {
            window.speechSynthesis.speak(utterance);
          }, 50);
          
          synthesisRef.current = utterance;
        };

        if (window.speechSynthesis.getVoices().length > 0) {
          speakText();
        } else {
          // Wait for voices to be loaded
          const voicesChangedListener = () => {
            if (window.speechSynthesis.getVoices().length > 0) {
              speakText();
              window.speechSynthesis.removeEventListener('voiceschanged', voicesChangedListener);
            }
          };
          window.speechSynthesis.addEventListener('voiceschanged', voicesChangedListener);
        }
      }
    }

    return () => {
      if (window.speechSynthesis) window.speechSynthesis.cancel();
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [audioUrl, isNarrationEnabled, generateAudio.isPending]);

  const toggleSpeech = () => {
    if (audioUrl && audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    } else if (!audioUrl && window.speechSynthesis) {
       // Toggle browser speech
       if (isPlaying) {
         window.speechSynthesis.pause();
         setIsPlaying(false);
       } else {
         if (window.speechSynthesis.paused) {
           window.speechSynthesis.resume();
           setIsPlaying(true);
         } else {
           // Re-trigger synthesis if needed
           console.log("Retriggering synthesis...");
         }
       }
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: 100, rotateY: 20 }}
      animate={{ opacity: 1, x: 0, rotateY: 0 }}
      exit={{ opacity: 0, x: -100, rotateY: -20 }}
      transition={{ type: "spring", damping: 20, stiffness: 80 }}
      className="w-full h-full flex flex-col md:flex-row bg-[#121212] rounded-[2.5rem] overflow-hidden shadow-[0_40px_100px_rgba(0,0,0,0.8)] border border-white/5 relative group perspective-1000"
    >
      {/* Audio Element - Moved outside conditional */}
      <audio 
        ref={audioRef} 
        src={audioUrl || ""} 
        onEnded={() => setIsPlaying(false)} 
        className="hidden" 
      />

      {/* Left Part: Visuals */}
      <div className="w-full md:w-1/2 h-full relative overflow-hidden bg-zinc-950">
        <AnimatePresence mode="wait">
          {imageUrl && !imageError ? (
            <>
              {!isImageLoaded && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900/40 to-purple-900/40 z-10">
                  <RefreshCw className="w-12 h-12 text-blue-400/50 animate-spin mb-4" />
                  <p className="text-white/60 font-medium tracking-wide">{bt.loadingImage}</p>
                </div>
              )}
              <motion.img
                key={imageUrl}
                initial={{ opacity: 0, scale: 1.1 }}
                animate={{ opacity: isImageLoaded ? 1 : 0, scale: 1 }}
                transition={{ duration: 1.5, ease: "easeOut" }}
                src={imageUrl}
                alt={scene.title}
                className="absolute inset-0 w-full h-full object-cover"
                onLoad={() => setIsImageLoaded(true)}
                onError={() => { setImageError(true); setIsImageLoaded(false); }}
              />
            </>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-indigo-900/40 to-purple-900/40 border-r border-white/10">
               <div className="relative group/wand mb-6">
                 <div className="absolute -inset-4 bg-accent/20 rounded-full blur-xl animate-pulse" />
                 <span className="text-6xl magic-wand-animate transform -rotate-12">🪄</span>
                 <div className="sparkle" style={{ top: '0', left: '0', animationDelay: '0s' }} />
                 <div className="sparkle" style={{ top: '10px', right: '10px', animationDelay: '0.2s' }} />
                 <div className="sparkle" style={{ bottom: '10px', left: '20px', animationDelay: '0.4s' }} />
               </div>
                  <div className="flex flex-col items-center gap-4">
                    {generateImage.isPending ? (
                      <RefreshCw className="w-12 h-12 text-blue-400/50 animate-spin" />
                    ) : (
                      <RefreshCw className="w-12 h-12 text-red-400/50" />
                    )}
                    <p className="text-white/60 font-medium tracking-wide">
                      {generateImage.isPending ? "Weaving your story visuals..." : "Image generation failed"}
                    </p>
                    {(generateImage.isError || imageError) && (
                      <p className="text-red-400/70 text-xs text-center px-4 max-w-[200px]">
                        {imageError ? "Image failed to load" : ((generateImage.error as any)?.message || "Unknown error")}
                      </p>
                    )}
                    {!generateImage.isPending && (
                      <Button
                        variant="outline"
                        size="sm"
                        className="mt-2 border-white/20 text-white/60 hover:text-white"
                        onClick={() => { setImageError(false); setIsImageLoaded(false); generateImage.mutate({ data: { prompt: scene.imagePrompt, category: story.category, faceImage: faceImage || undefined } }); }}
                      >
                        <RefreshCw className="w-4 h-4 mr-2" />
                        Retry Generating
                      </Button>
                    )}
                  </div>
            </div>
          )}
        </AnimatePresence>
        
        {/* Page overlay shadows for book feel */}
        <div className="absolute inset-y-0 right-0 w-32 bg-gradient-to-l from-black/80 to-transparent pointer-events-none z-10" />
        <div className="absolute inset-0 bg-black/10 pointer-events-none z-10" />
      </div>

      {/* Right Part: Narrative */}
      <div className="w-full md:w-1/2 h-full bg-[#fdfaf3] text-[#1a1a1a] p-8 md:p-14 flex flex-col justify-center relative overflow-y-auto custom-scrollbar-paper">
        {/* Paper Texture Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-0 bg-[url('https://www.transparenttextures.com/patterns/old-map.png')]" />
        
        {/* Spine Shadow */}
        <div className="absolute inset-y-0 left-0 w-24 bg-gradient-to-r from-black/20 to-transparent pointer-events-none z-10" />
        
        <div className="relative z-20">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="flex items-center gap-3 mb-6">
              <div className="h-[2px] w-10 bg-primary/40" />
              <h3 className="text-black/40 font-semibold tracking-[0.4em] uppercase text-[0.65rem]">
                {scene.title}
              </h3>
            </div>
            
            <h2 className="text-3xl md:text-5xl font-display font-bold text-[#121212] mb-10 leading-tight">
              {scene.text?.split(' ').slice(0, 3).join(' ') || ""}
              <span className="text-primary"> ...</span>
            </h2>
            
            <div className="relative">
               <p className="text-lg md:text-2xl leading-[1.8] text-[#2a2a2a] font-normal italic serif mb-12">
                "{scene.text}"
               </p>
               {/* Drop cap first letter */}
               <div className="absolute -left-12 -top-4 opacity-[0.03] text-[12rem] font-display select-none pointer-events-none">
                  {scene.text?.[0]}
               </div>
            </div>

            {/* Action Bar */}
            <div className="flex flex-col gap-6 mt-8">
              {scene.choices && scene.choices.length > 0 ? (
                <div className="grid grid-cols-1 gap-3 w-full">
                  {scene.choices.map((choice) => (
                    <Button
                      key={choice.id}
                      variant="outline"
                      className={cn(
                        "justify-start text-left h-auto py-4 px-6 rounded-2xl border-black/10 hover:bg-black/5 hover:border-primary/30 transition-all",
                        choice.isCorrect ? "hover:bg-green-50" : "hover:bg-red-50"
                      )}
                      onClick={() => {
                        if (choice.nextScene) {
                          // Handle next scene navigation (assuming 1-indexed)
                          // In our simple index-based viewer, we might need a jump prop
                          // but for now let's just use onNext if it's correct
                          onNext();
                        } else {
                          onNext();
                        }
                      }}
                    >
                      <span className="w-8 h-8 rounded-full bg-black/5 flex items-center justify-center mr-4 text-xs font-bold">
                        {choice.id.toUpperCase()}
                      </span>
                      {choice.text}
                    </Button>
                  ))}
                </div>
              ) : (
                <div className="flex items-center gap-4">
                  <Button 
                    variant="default" 
                    size="lg" 
                    className="rounded-full px-10 h-14 bg-black text-white hover:bg-black/80 shadow-lg shadow-black/10 group-hover:scale-105 transition-transform"
                    onClick={onNext}
                  >
                    {bt.nextPage}
                  </Button>
                  <Button 
                    variant="outline" 
                    size="icon" 
                    className="w-14 h-14 rounded-full border-black/10 bg-black/5 hover:bg-black/10 transition-colors"
                    onClick={toggleSpeech}
                    disabled={!audioUrl}
                  >
                    {generateAudio.isPending ? (
                      <RefreshCw className="w-6 h-6 animate-spin text-primary" />
                    ) : isPlaying ? (
                      <Volume2 className="w-6 h-6 text-primary" />
                    ) : (
                      <VolumeX className="w-6 h-6 text-black/30" />
                    )}
                  </Button>
                </div>
              )}
            </div>
          </motion.div>
        </div>
      </div>
    </motion.div>
  );
}

function QuizPage({ language, questions, onComplete }: { language: string, questions: any[], onComplete: () => void }) {
  const bt = BOOK_TRANSLATIONS[language as keyof typeof BOOK_TRANSLATIONS] || BOOK_TRANSLATIONS.english;
  const labels = {
    score: language === 'hindi' ? "स्कोर" : language === 'gujarati' ? "સ્કોર" : "Score",
    finalScore: language === 'hindi' ? "अंतिम स्कोर देखें" : language === 'gujarati' ? "અંતિમ સ્કોર જુઓ" : "See Final Score",
    next: language === 'hindi' ? "अगला प्रश्न" : language === 'gujarati' ? "આગળનો પ્રશ્ન" : "Next Question"
  };
  const [currentIdx, setCurrentIdx] = useState(0);
  const [score, setScore] = useState(0);
  const [selectedIdx, setSelectedIdx] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);

  const question = questions[currentIdx];
  const isLast = currentIdx === questions.length - 1;

  const handleSelect = (idx: number) => {
    if (isAnswered) return;
    setSelectedIdx(idx);
    setIsAnswered(true);
    if (idx === question.correctIndex) {
      setScore(s => s + 1);
    }
  };

  const nextQuestion = () => {
    if (isLast) {
      onComplete();
    } else {
      setCurrentIdx(i => i + 1);
      setSelectedIdx(null);
      setIsAnswered(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full h-full flex flex-col items-center justify-center p-6 md:p-12 bg-[#121212] rounded-[2rem] border border-white/5 relative overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-br from-primary/10 via-transparent to-accent/10 opacity-30" />
      
      <div className="relative z-10 w-full max-w-2xl">
        <div className="flex justify-between items-center mb-8">
          <div className="bg-primary/20 backdrop-blur px-4 py-1 rounded-full text-xs font-bold text-primary tracking-widest uppercase">
            {bt.question} {currentIdx + 1} / {questions.length}
          </div>
          <div className="text-white/40 text-sm font-medium">
            {labels.score}: <span className="text-accent">{score}</span>
          </div>
        </div>

        <h2 className="text-2xl md:text-3xl font-display font-bold text-white mb-10 leading-tight">
          {question.question}
        </h2>

        <div className="grid grid-cols-1 gap-4 mb-10">
          {question.options.map((option: string, idx: number) => {
            const isCorrect = idx === question.correctIndex;
            const isSelected = idx === selectedIdx;
            
            let btnClass = "bg-white/5 border-white/10 text-white/80 hover:bg-white/10";
            if (isAnswered) {
              if (isCorrect) btnClass = "bg-green-500/20 border-green-500/50 text-white";
              else if (isSelected) btnClass = "bg-red-500/20 border-red-500/50 text-white";
              else btnClass = "opacity-50 grayscale bg-white/5 border-white/10 text-white/80";
            }

            return (
              <button
                key={idx}
                onClick={() => handleSelect(idx)}
                disabled={isAnswered}
                className={cn(
                  "w-full p-5 rounded-2xl border text-left transition-all duration-300 flex items-center gap-4",
                  btnClass,
                  isSelected && !isAnswered && "border-primary bg-primary/10"
                )}
              >
                <span className="w-8 h-8 rounded-full bg-black/20 flex items-center justify-center text-xs font-bold shrink-0">
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="font-medium">{option}</span>
              </button>
            );
          })}
        </div>

        {isAnswered && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8 p-4 rounded-xl bg-accent/10 border border-accent/20 text-accent/90 text-sm italic"
          >
            {question.explanation}
          </motion.div>
        )}

        {isAnswered && (
          <Button 
            variant="glow" 
            className="w-full h-14 rounded-xl text-lg"
            onClick={nextQuestion}
          >
            {isLast ? labels.finalScore : labels.next}
          </Button>
        )}
      </div>
    </motion.div>
  );
}

function EndPage({ language, onRestart, onExit }: { language: string, onRestart: () => void, onExit: () => void }) {
  const bt = BOOK_TRANSLATIONS[language as keyof typeof BOOK_TRANSLATIONS] || BOOK_TRANSLATIONS.english;
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      className="w-full h-full flex flex-col items-center justify-center p-12 bg-[#121212] rounded-[2rem] border border-white/5 relative overflow-hidden"
    >
      {/* Decorative Ornaments */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] aspect-square rounded-full border border-accent/10 opacity-50 pulse-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[60%] aspect-square rounded-full border border-accent/20 opacity-30" />
      
      <div className="relative z-10 text-center max-w-lg">
        <div className="mb-10 text-accent flex justify-center">
           <svg className="w-24 h-24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round">
              <path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1-0.5-5" />
              <path d="M6.5 2H20v20H6.5" />
              <path d="M4 19.5v-15a2.5 2.5 0 0 1 0.5-2.5C5 2 6 2 6.5 2" />
              <path d="m8 11 3 3 5-5" />
           </svg>
        </div>
        
        <h1 className="text-5xl md:text-7xl font-display font-medium text-white mb-6 tracking-tight">{bt.fin}</h1>
        <p className="text-xl text-white/60 mb-12 font-light">{bt.endSub}</p>
        
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Button variant="glow" size="lg" className="px-10 h-16 text-lg rounded-2xl" onClick={onRestart}>
            {bt.readAgain}
          </Button>
          <Button variant="outline" size="lg" className="px-10 h-16 text-lg rounded-2xl bg-white/5 hover:bg-white/10" onClick={onExit}>
             {bt.backToLibrary}
          </Button>
        </div>
      </div>
    </motion.div>
  );
}
