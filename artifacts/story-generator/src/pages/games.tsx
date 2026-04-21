import React, { useState, useEffect, useCallback } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, RefreshCw, CheckCircle2, XCircle, Trophy, Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

// ── Word list ──────────────────────────────────────────────────────────────────
const GAMES_TRANSLATIONS = {
  english: {
    back: "Back",
    points: "Points",
    bestStreak: "Best Streak",
    accuracy: "Accuracy",
    playAgain: "Play Again",
    home: "Home",
    gameOver: "Game Over!",
    unscrambledCount: "You unscrambled {n} story words",
    unscrambleTitle: "Unscramble the Word",
    placeholder: "Type your answer...",
    correct: "✨ Correct! +{p} points",
    wrong: "❌ Wrong! The answer was",
    hintCost: "💡 Show Hint (−5 pts)",
    checkAnswer: "Check Answer",
    nextWord: "Next Word →",
    seeResults: "See Results",
    streak: "{n} streak!",
    wordProgress: "Word {c} of {t}",
    wordList: [
      { word: "DRAGON",    hint: "A fire-breathing mythical creature",         emoji: "🐉" },
      { word: "WIZARD",    hint: "A master of spells and magic",               emoji: "🧙" },
      { word: "CASTLE",    hint: "Where a king and queen live",                emoji: "🏰" },
      { word: "PRINCESS",  hint: "A royal daughter",                           emoji: "👸" },
      { word: "FOREST",    hint: "A land full of tall, ancient trees",         emoji: "🌲" },
      { word: "POTION",    hint: "A magical liquid you drink",                 emoji: "🧪" },
      { word: "SWORD",     hint: "A hero's sharp weapon",                      emoji: "⚔️" },
      { word: "PHOENIX",   hint: "A magical bird reborn from flames",         emoji: "🔥" },
      { word: "TREASURE",  hint: "Gold and jewels hidden away",               emoji: "💎" },
      { word: "UNICORN",   hint: "A horse with a magical horn",               emoji: "🦄" },
    ]
  },
  hindi: {
    back: "पीछे",
    points: "पॉइंट्स",
    bestStreak: "बेस्ट स्ट्रीक",
    accuracy: "सटीकता",
    playAgain: "फिर से खेलें",
    home: "होम",
    gameOver: "खेल समाप्त!",
    unscrambledCount: "आपने {n} कहानी शब्दों को सुलझाया",
    unscrambleTitle: "शब्द को सुलझाएं",
    placeholder: "अपना उत्तर टाइप करें...",
    correct: "✨ सही! +{p} पॉइंट्स",
    wrong: "❌ गलत! उत्तर था",
    hintCost: "💡 संकेत दिखाएं (−5 पॉइंट)",
    checkAnswer: "उत्तर जांचें",
    nextWord: "अगला शब्द →",
    seeResults: "परिणाम देखें",
    streak: "{n} स्ट्रीक!",
    wordProgress: "शब्द {c} / {t}",
    wordList: [
      { word: "राजा",    hint: "एक राज्य का शासक",         emoji: "👑" },
      { word: "रानी",    hint: "एक राज्य की महिला शासक",   emoji: "👸" },
      { word: "जादू",    hint: "चमत्कारिक शक्तियां",       emoji: "🪄" },
      { word: "जंगल",    hint: "पेड़ों और जानवरों का स्थान",emoji: "🌳" },
      { word: "पक्षी",   hint: "आकाश में उड़ने वाला",      emoji: "🐦" },
      { word: "किताब",   hint: "कहानियों का संग्रह",       emoji: "📖" },
      { word: "शेर",     hint: "जंगल का राजा",             emoji: "🦁" },
      { word: "हाथी",    hint: "सबसे बड़ा भूमि जानवर",     emoji: "🐘" },
      { word: "महल",     hint: "एक बड़ा शाही घर",          emoji: "🏰" },
      { word: "दोस्त",   hint: "जो हमेशा साथ दे",          emoji: "🤝" },
    ]
  },
  gujarati: {
    back: "પાછા",
    points: "પોઈન્ટ્સ",
    bestStreak: "શ્રેષ્ઠ સ્ટ્રીક",
    accuracy: "ચોકસાઈ",
    playAgain: "ફરીથી રમો",
    home: "હોમ",
    gameOver: "રમત સમાપ્ત!",
    unscrambledCount: "તમે {n} વાર્તાના શબ્દો ઉકેલ્યા",
    unscrambleTitle: "શબ્દ ઉકેલો",
    placeholder: "તરો જવાબ ટાઈપ કરો...",
    correct: "✨ સાચું! +{p} પોઈન્ટ્સ",
    wrong: "❌ ખોટું! જવાબ હતો",
    hintCost: "💡 સંકેત જુઓ (−5 પોઈન્ટ)",
    checkAnswer: "જવાબ તપાસો",
    nextWord: "આગળનો શબ્દ →",
    seeResults: "પરિણામો જુઓ",
    streak: "{n} સ્ટ્રીક!",
    wordProgress: "શબ્દ {c} / {t}",
    wordList: [
      { word: "રાજા",    hint: "રાજ્યનો શાસક",         emoji: "👑" },
      { word: "રાણી",    hint: "રાજ્યની સ્ત્રી શાસક",   emoji: "👸" },
      { word: "જાદુ",    hint: "ચમત્કારિક શક્તિઓ",      emoji: "🪄" },
      { word: "જંગલ",    hint: "વૃક્ષો અને પ્રાણીઓનું સ્થાન",emoji: "🌳" },
      { word: "પક્ષી",    hint: "આકાશમાં ઉડતું પ્રાણી",   emoji: "🐦" },
      { word: "પુસ્તક",   hint: "વાર્તાઓનો સંગ્રહ",     emoji: "📖" },
      { word: "સિંહ",    hint: "જંગલનો રાજા",             emoji: "🦁" },
      { word: "હાથી",    hint: "સૌથી મોટું ભૂમિ પ્રાણી",   emoji: "🐘" },
      { word: "મહેલ",     hint: "એક મોટું શાહી ઘર",       emoji: "🏰" },
      { word: "મિત્ર",    hint: "જે હંમેશા સાથે રહે",       emoji: "🤝" },
    ]
  }
};

function scramble(word: string): string {
  const arr = word.split("");
  // Keep scrambling until it differs from original
  let result = arr.slice();
  let tries = 0;
  do {
    for (let i = result.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [result[i], result[j]] = [result[j], result[i]];
    }
    tries++;
  } while (result.join("") === word && tries < 50);
  return result.join("");
}

function pickRandom<T>(arr: T[], count: number): T[] {
  const copy = [...arr].sort(() => Math.random() - 0.5);
  return copy.slice(0, count);
}

// ── Main game component ────────────────────────────────────────────────────────
import { useStoryStore } from "@/lib/store";

export default function GamesPage() {
  const [, setLocation] = useLocation();
  const { language } = useStoryStore();
  const gt = GAMES_TRANSLATIONS[language as keyof typeof GAMES_TRANSLATIONS] || GAMES_TRANSLATIONS.english;
  
  const [questions, setQuestions] = useState<typeof gt.wordList>([]);
  const [currentIdx, setCurrentIdx] = useState(0);
  const [scrambledWord, setScrambledWord] = useState("");
  const [input, setInput] = useState("");
  const [status, setStatus] = useState<"idle" | "correct" | "wrong">("idle");
  const [score, setScore] = useState(0);
  const [lives, setLives] = useState(3);
  const [gameState, setGameState] = useState<"playing" | "finished">("playing");
  const [showHint, setShowHint] = useState(false);
  const [streak, setStreak] = useState(0);
  const [bestStreak, setBestStreak] = useState(0);

  const startGame = useCallback(() => {
    const picked = pickRandom(gt.wordList, gt.wordList.length);
    setQuestions(picked);
    setCurrentIdx(0);
    setScrambledWord(scramble(picked[0].word));
    setInput("");
    setStatus("idle");
    setScore(0);
    setLives(3);
    setGameState("playing");
    setShowHint(false);
    setStreak(0);
    setBestStreak(0);
  }, []);

  useEffect(() => {
    startGame();
  }, [startGame]);

  const current = questions[currentIdx];

  const handleSubmit = () => {
    if (!current || status !== "idle") return;
    if (input.trim().toUpperCase() === current.word) {
      setStatus("correct");
      const points = showHint ? 5 : 10;
      setScore(s => s + points);
      const newStreak = streak + 1;
      setStreak(newStreak);
      setBestStreak(b => Math.max(b, newStreak));
    } else {
      setStatus("wrong");
      setLives(l => l - 1);
      setStreak(0);
    }
  };

  const handleNext = () => {
    if (lives <= 0 && status === "wrong") {
      setGameState("finished");
      return;
    }
    const nextIdx = currentIdx + 1;
    if (nextIdx >= questions.length) {
      setGameState("finished");
      return;
    }
    setCurrentIdx(nextIdx);
    setScrambledWord(scramble(questions[nextIdx].word));
    setInput("");
    setStatus("idle");
    setShowHint(false);
  };

  useEffect(() => {
    if (lives <= 0 && status === "wrong") {
      setTimeout(() => setGameState("finished"), 1200);
    }
  }, [lives, status]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") handleSubmit();
  };

  // ── Finished screen ──────────────────────────────────────────────────────────
  if (gameState === "finished") {
    const total = questions.length * 10;
    const pct = Math.round((score / total) * 100);
    const medal = pct >= 80 ? "🥇" : pct >= 50 ? "🥈" : "🥉";

    return (
      <div className="min-h-screen bg-[#050411] flex items-center justify-center p-6">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#2d1b69,#0c0824,#050411)]" />
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          className="relative z-10 bg-white/5 border border-white/10 rounded-3xl p-10 max-w-md w-full text-center shadow-2xl"
        >
          <div className="text-8xl mb-4">{medal}</div>
          <h2 className="text-4xl font-bold text-white mb-2">{gt.gameOver}</h2>
          <p className="text-white/50 mb-8">{gt.unscrambledCount.replace('{n}', questions.length.toString())}</p>

          <div className="grid grid-cols-3 gap-4 mb-10">
            <div className="bg-white/5 rounded-2xl p-4">
              <div className="text-3xl font-bold text-accent">{score}</div>
              <div className="text-xs text-white/40 mt-1">{gt.points}</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4">
              <div className="text-3xl font-bold text-primary">{bestStreak}</div>
              <div className="text-xs text-white/40 mt-1">{gt.bestStreak}</div>
            </div>
            <div className="bg-white/5 rounded-2xl p-4">
              <div className="text-3xl font-bold text-green-400">{pct}%</div>
              <div className="text-xs text-white/40 mt-1">{gt.accuracy}</div>
            </div>
          </div>

          <div className="flex gap-3">
            <Button variant="glow" className="flex-1 h-14 rounded-2xl text-lg" onClick={startGame}>
              <RefreshCw className="w-5 h-5 mr-2" /> {gt.playAgain}
            </Button>
            <Button variant="outline" className="flex-1 h-14 rounded-2xl text-lg bg-white/5 hover:bg-white/10 text-white border-white/10" onClick={() => setLocation("/")}>
              {gt.home}
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (!current) return null;

  // ── Playing screen ───────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-[#050411] flex flex-col font-display overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,#2d1b69,#0c0824,#050411)] opacity-90 pointer-events-none" />

      {/* Header */}
      <div className="relative z-20 p-5 flex items-center justify-between">
        <Button variant="ghost" onClick={() => setLocation("/")} className="text-white/60 hover:text-white">
          <ChevronLeft className="w-5 h-5 mr-1" /> {gt.back}
        </Button>

        <div className="flex items-center gap-3">
          {/* Lives */}
          <div className="flex gap-1">
            {[...Array(3)].map((_, i) => (
              <span key={i} className={cn("text-xl transition-all", i < lives ? "opacity-100" : "opacity-20 grayscale")}>❤️</span>
            ))}
          </div>
          {/* Score */}
          <div className="bg-accent/20 border border-accent/30 text-accent px-4 py-1.5 rounded-full font-bold text-sm flex items-center gap-2">
            <Trophy className="w-4 h-4" />
            {score}
          </div>
        </div>
      </div>

      {/* Progress Bar */}
      <div className="relative z-20 px-6">
        <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
          <motion.div
            className="h-full bg-gradient-to-r from-primary to-accent rounded-full"
            animate={{ width: `${((currentIdx) / questions.length) * 100}%` }}
            transition={{ duration: 0.5 }}
          />
        </div>
        <div className="flex justify-between text-xs text-white/30 mt-1">
          <span>{gt.wordProgress.replace('{c}', (currentIdx + 1).toString()).replace('{t}', questions.length.toString())}</span>
          {streak >= 2 && (
            <span className="text-orange-400 font-bold flex items-center gap-1">
              <Sparkles className="w-3 h-3" /> {gt.streak.replace('{n}', streak.toString())}
            </span>
          )}
        </div>
      </div>

      {/* Game Card */}
      <div className="relative z-10 flex-1 flex items-center justify-center p-6">
        <AnimatePresence mode="wait">
          <motion.div
            key={currentIdx}
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -40 }}
            transition={{ type: "spring", damping: 20, stiffness: 100 }}
            className="w-full max-w-lg"
          >
            {/* Emoji */}
            <div className="text-center mb-6">
              <span className="text-7xl">{current.emoji}</span>
            </div>

            {/* Title */}
            <h2 className="text-center text-white/50 text-sm font-bold uppercase tracking-[0.3em] mb-3">{gt.unscrambleTitle}</h2>

            {/* Scrambled letters */}
            <div className="flex justify-center gap-2 flex-wrap mb-8">
              {scrambledWord.split("").map((letter, i) => (
                <motion.div
                  key={i}
                  initial={{ opacity: 0, y: -20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.06 }}
                  className="w-11 h-11 rounded-xl bg-white/10 border border-white/20 flex items-center justify-center text-xl font-bold text-white shadow-inner"
                >
                  {letter}
                </motion.div>
              ))}
            </div>

            {/* Input */}
            <div className="relative mb-4">
              <input
                type="text"
                value={input}
                onChange={e => setInput(e.target.value.toUpperCase())}
                onKeyDown={handleKeyDown}
                disabled={status !== "idle"}
                placeholder={gt.placeholder}
                className={cn(
                  "w-full h-16 rounded-2xl bg-white/5 border text-white text-center text-xl font-bold tracking-widest placeholder:text-white/20 outline-none transition-all px-4",
                  status === "idle" && "border-white/20 focus:border-primary/60 focus:bg-white/10",
                  status === "correct" && "border-green-400/60 bg-green-400/10 text-green-300",
                  status === "wrong" && "border-red-400/60 bg-red-400/10 text-red-300 animate-[shake_0.3s_ease]"
                )}
                autoFocus
              />
              {status === "correct" && <CheckCircle2 className="absolute right-4 top-1/2 -translate-y-1/2 text-green-400 w-6 h-6" />}
              {status === "wrong"   && <XCircle      className="absolute right-4 top-1/2 -translate-y-1/2 text-red-400   w-6 h-6" />}
            </div>

            {/* Feedback */}
            <AnimatePresence>
              {status === "correct" && (
                <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-center text-green-400 font-bold mb-4">
                  {gt.correct.replace('{p}', (showHint ? 5 : 10).toString())}
                </motion.p>
              )}
              {status === "wrong" && (
                <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="text-center text-red-400 font-semibold mb-4">
                  {gt.wrong} <span className="font-bold text-white">{current.word}</span>
                </motion.p>
              )}
            </AnimatePresence>

            {/* Hint */}
            {status === "idle" && !showHint && (
              <button onClick={() => setShowHint(true)} className="w-full text-center text-white/30 hover:text-accent text-sm transition-colors mb-4">
                {gt.hintCost}
              </button>
            )}
            {showHint && status === "idle" && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                className="bg-accent/10 border border-accent/20 rounded-xl p-3 mb-4 text-center text-accent/80 text-sm italic">
                💡 {current.hint}
              </motion.div>
            )}

            {/* Buttons */}
            {status === "idle" ? (
              <Button variant="glow" size="lg" className="w-full h-14 rounded-2xl text-lg" onClick={handleSubmit}
                disabled={!input.trim()}>
                {gt.checkAnswer}
              </Button>
            ) : (
              <Button variant="glow" size="lg" className="w-full h-14 rounded-2xl text-lg" onClick={handleNext}>
                {currentIdx + 1 >= questions.length ? gt.seeResults : gt.nextWord}
              </Button>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}
