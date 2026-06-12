import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Sparkles,
  Play,
  RotateCcw,
  Volume2,
  X,
  CheckCircle,
  AlertCircle,
  Car,
  Mic,
  Trophy,
  BookOpen,
  ArrowRight,
  Sparkle,
  Gamepad2,
  Star
} from 'lucide-react';

import { GameState, WordData, WordCategory, Lane, VoiceStatus, TrackStyle } from './types';
import { BUILTIN_CATEGORIES } from './data';
import { GameCanvas } from './components/GameCanvas';
import { AudioVisualizer } from './components/AudioVisualizer';
import { CustomWordsManager } from './components/CustomWordsManager';
import { BubblePopperGame } from './components/BubblePopperGame';
import { speakWord, speakSound, matchesWord } from './utils';

export default function App() {
  const [currentView, setCurrentView] = useState<'HUB' | 'VOICE_RACER' | 'BUBBLE_POPPER'>('HUB');

  // Game states
  const [gameState, setGameState] = useState<GameState>('START_SCREEN');
  const [trackStyle, setTrackStyle] = useState<TrackStyle>('forest');
  const [activeCategory, setActiveCategory] = useState<WordCategory>(BUILTIN_CATEGORIES[0]);
  const [customWords, setCustomWords] = useState<WordData[]>(() => {
    try {
      const saved = localStorage.getItem('voice_racer_custom_words');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Collapsible drawers for child UI simplicity
  const [isCategorySelectorExpanded, setIsCategorySelectorExpanded] = useState(false);
  const [isWarmupExpanded, setIsWarmupExpanded] = useState(false);
  const [isCustomWordsExpanded, setIsCustomWordsExpanded] = useState(false);

  const [score, setScore] = useState(0);
  const [highScore, setHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('voice_racer_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const [bubbleHighScore, setBubbleHighScore] = useState<number>(() => {
    try {
      const saved = localStorage.getItem('bubble_popper_highscore');
      return saved ? parseInt(saved, 10) : 0;
    } catch {
      return 0;
    }
  });

  const handleUpdateBubbleHighScore = (newScore: number) => {
    setBubbleHighScore(newScore);
    localStorage.setItem('bubble_popper_highscore', newScore.toString());
  };

  const games = [
    {
      id: "voice-racer",
      title: "VOICE LANE RACER",
      description: "Pronounce words right to avoid car crashing! Correct pronunciation swerves your car to dodge roadblocks.",
      icon: "🚗",
      accent: "bg-emerald-400",
      record: highScore,
      unlocked: true,
    },
    {
      id: "bubble-popper",
      title: "VOICE BUBBLE POPPER",
      description: "Pronounce words on translucent floating bubbles to pop them before they cross the red danger zone!",
      icon: "🫧",
      accent: "bg-sky-450",
      record: bubbleHighScore,
      unlocked: true,
    },
    {
      id: "colleague-slot-1",
      title: "VOICE PLACEHOLDER TEMPLATE",
      description: "Icon: 👤 | Description: Put next voice game details here. Gray indicators assist co-workers adding new speech games.",
      icon: "👤",
      accent: "bg-slate-300",
      record: 0,
      unlocked: false,
    }
  ];

  const totalRecordSum = games.reduce((acc, g) => acc + g.record, 0);
  
  const [level, setLevel] = useState(1);
  const [bubbleScore, setBubbleScore] = useState(0);
  const [bubbleLevel, setBubbleLevel] = useState(1);
  const [lives, setLives] = useState(3);
  const [playerLane, setPlayerLane] = useState<Lane>(1); // 1 = Center
  const [vocabIndex, setVocabIndex] = useState(0);
  const [lastHeardTranscript, setLastHeardTranscript] = useState('');
  const [wordMatchFlash, setWordMatchFlash] = useState(false);
  const [struggleCounter, setStruggleCounter] = useState<Record<string, number>>({});
  const [wordStudyStats, setWordStudyStats] = useState<Record<string, { spoken: number; struggled: number }>>({});
  const [voiceStatus, setVoiceStatus] = useState<VoiceStatus>({
    status: 'idle',
    message: 'Click Start to turn on the microphone.',
  });

  // Bullet time states
  const [isBulletTime, setIsBulletTime] = useState(false);
  const [bulletTimeProgress, setBulletTimeProgress] = useState(100);

  // Current level words tracking
  const [currentLaneWords, setCurrentLaneWords] = useState<Record<Lane, string>>({
    0: '',
    1: '',
    2: '',
  });

  // Keep references for voice thread to prevent closure captures stale states
  const gameStateRef = useRef(gameState);
  const currentLaneRef = useRef(playerLane);
  const currentLaneWordsRef = useRef(currentLaneWords);
  const isBulletTimeRef = useRef(isBulletTime);
  const vocabIndexRef = useRef(vocabIndex);

  useEffect(() => {
    gameStateRef.current = gameState;
  }, [gameState]);

  useEffect(() => {
    currentLaneRef.current = playerLane;
  }, [playerLane]);

  useEffect(() => {
    currentLaneWordsRef.current = currentLaneWords;
  }, [currentLaneWords]);

  useEffect(() => {
    isBulletTimeRef.current = isBulletTime;
  }, [isBulletTime]);

  useEffect(() => {
    vocabIndexRef.current = vocabIndex;
  }, [vocabIndex]);

  // Speech Recognition hook
  const recognitionRef = useRef<any>(null);

  // Vocabulary arrays matching selection (either standard categories or user's custom lists)
  const getSelectedVocabularyList = useCallback(() => {
    if (activeCategory.id === 'custom') {
      return customWords.length > 0 ? customWords : BUILTIN_CATEGORIES[0].words;
    }
    return activeCategory.words;
  }, [activeCategory, customWords]);

  // Set up the approach of an obstacle -> Slow-motion bullet-time triggers!
  const handleApproachObstacle = useCallback((currentLane: Lane) => {
    setIsBulletTime(true);
    setBulletTimeProgress(100);
    
    const vocab = getSelectedVocabularyList();
    if (vocab.length === 0) return;

    // Pick 2 consecutive words from current vocabulary array using vocabIndexRef
    const idx = vocabIndexRef.current;
    const firstWord = vocab[idx % vocab.length].word;
    const secondWord = vocab[(idx + 1) % vocab.length].word;
    
    setVocabIndex(prev => prev + 2);

    // Place words strictly on opposite lanes (so player has options to swerve)
    const newWords: Record<Lane, string> = {
      0: currentLane === 0 ? '' : firstWord,
      1: currentLane === 1 ? '' : (currentLane === 0 ? firstWord : secondWord),
      2: currentLane === 2 ? '' : secondWord,
    };

    setCurrentLaneWords(newWords);
  }, [getSelectedVocabularyList]);

  // Perform the lane change dynamically
  const performLaneShift = useCallback((newLane: Lane) => {
    setPlayerLane(newLane);
    setStruggleCounter({}); // Reset struggle help on any shift!
  }, []);

  // Trigger words initialize on playing start
  useEffect(() => {
    if (gameState === 'PLAYING') {
      setCurrentLaneWords({
        0: '',
        1: '',
        2: '',
      });
      setVocabIndex(0);
      setIsBulletTime(false);
    }
  }, [gameState]);

  // Setup Web Speech API Continuous Listener
  const startVoiceEngine = useCallback(() => {
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setVoiceStatus({
        status: 'unsupported',
        message: 'Google Chrome Voice API not detected. Please play inside Google Chrome!',
      });
      return;
    }

    try {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      }

      const rec = new SpeechRecognition();
      rec.continuous = true;
      rec.interimResults = true;
      rec.lang = 'en-US';

      rec.onstart = () => {
        setVoiceStatus({
          status: 'listening',
          message: 'Voice engine live! Speak the English words aloud!',
        });
      };

      rec.onerror = (e: any) => {
        if (e.error === 'not-allowed') {
          setVoiceStatus({
            status: 'error',
            message: 'Microphone access block. Please allow mic in your browser address bar!',
          });
        } else {
          console.warn('Speech engine warning:', e.error);
        }
      };

      rec.onend = () => {
        // Automatically restart speech loop to keep continuous practice active
        if (gameStateRef.current === 'PLAYING') {
          try {
            rec.start();
          } catch {
            // avoid multiple starts collisions
          }
        } else {
          setVoiceStatus({
            status: 'idle',
            message: 'Engine stopped.',
          });
        }
      };

      rec.onresult = (event: any) => {
        let textResult = '';
        for (let i = event.resultIndex; i < event.results.length; ++i) {
          if (typeof event.results[i][0].transcript === 'string') {
            textResult += event.results[i][0].transcript;
          }
        }
        
        if (textResult) {
          setLastHeardTranscript(textResult);
          evaluateVoiceTrigger(textResult);
        }
      };

      recognitionRef.current = rec;
      rec.start();
    } catch (e) {
      console.error('Failed to start Voice engine:', e);
    }
  }, []);

  // Evaluate if spoken transcript matches target adjacent lane words
  const evaluateVoiceTrigger = (spokenText: string) => {
    if (gameStateRef.current !== 'PLAYING') return;
    if (!isBulletTimeRef.current) return;

    const activeWords = currentLaneWordsRef.current;
    const laneKeys = Object.keys(activeWords).map(Number) as Lane[];
    
    for (const lane of laneKeys) {
      const target = activeWords[lane];
      if (!target) continue;

      if (matchesWord(spokenText, target)) {
        const matchedLane = lane;
        
        performLaneShift(matchedLane);
        setIsBulletTime(false);
        setCurrentLaneWords({0: '', 1: '', 2: ''});
        
        setScore(prev => prev + 15);
        setWordMatchFlash(true);
        setTimeout(() => setWordMatchFlash(false), 900);
        
        setWordStudyStats(prev => ({
          ...prev,
          [target]: {
            spoken: (prev[target]?.spoken || 0) + 1,
            struggled: prev[target]?.struggled || 0
          }
        }));

        speakSound.playAccelerate();
        setLastHeardTranscript('');
        break;
      }
    }
  };

  // High score checker & Levels up
  useEffect(() => {
    if (score > highScore) {
      setHighScore(score);
      localStorage.setItem('voice_racer_highscore', score.toString());
    }
    
    // Level Up Progression calculation: Every 12 successful dodges (180 points)
    const calculatedLevel = Math.min(5, Math.floor(score / 185) + 1);
    if (calculatedLevel > level) {
      setLevel(calculatedLevel);
      speakSound.playSuccess();
    }
  }, [score, highScore, level]);

  // Custom Word Management triggers
  const handleAddNewWord = (word: string, translation: string) => {
    const freshWord: WordData = {
      word,
      translation,
      speakCount: 0,
      struggleCount: 0,
    };
    const updated = [...customWords, freshWord];
    setCustomWords(updated);
    localStorage.setItem('voice_racer_custom_words', JSON.stringify(updated));
  };

  const handleDeleteWord = (index: number) => {
    const updated = customWords.filter((_, idx) => idx !== index);
    setCustomWords(updated);
    localStorage.setItem('voice_racer_custom_words', JSON.stringify(updated));
  };

  const handleClearCustomWords = () => {
    setCustomWords([]);
    localStorage.removeItem('voice_racer_custom_words');
  };

  // Start the physical game loop
  const triggerPlayGame = () => {
    setGameState('PLAYING');
    setScore(0);
    setLives(3);
    setLevel(1);
    setPlayerLane(1);
    setVocabIndex(0);
    setLastHeardTranscript('');
    setWordStudyStats({});
    startVoiceEngine();
    speakSound.playCoin();
  };

  // Bullet-time countdown timer loop
  useEffect(() => {
    if (!isBulletTime) {
      setBulletTimeProgress(100);
      return;
    }

    const maxInputTime = Math.max(2200, 5500 - level * 750);
    const startTimeStamp = Date.now();

    const interval = setInterval(() => {
      const elapsed = Date.now() - startTimeStamp;
      const progress = Math.max(0, 100 - (elapsed / maxInputTime) * 100);
      setBulletTimeProgress(progress);

      if (elapsed >= maxInputTime) {
        clearInterval(interval);
        handleCarCollision();
      }
    }, 25);

    return () => clearInterval(interval);
  }, [isBulletTime, level]);

  // Collision damage event triggered by physical canvas detection or timeout
  const handleCarCollision = () => {
    speakSound.playCrash();
    
    setIsBulletTime(false);
    setCurrentLaneWords({
      0: '',
      1: '',
      2: '',
    });
    
    setLives(prev => {
      const remaining = prev - 1;
      if (remaining <= 0) {
        setGameState('GAME_OVER');
        if (recognitionRef.current) {
          recognitionRef.current.onend = null;
          recognitionRef.current.abort();
        }
        return 0;
      } else {
        return remaining;
      }
    });
  };

  // Avoid block successfully
  const handleAvoidObstacle = (id: string) => {
    setScore(prev => prev + 15);
  };

  // Assist child pronunciation with quick vocal synthesis helper
  const triggerTTSHelp = (word: string) => {
    speakWord(word);
    setStruggleCounter(prev => ({
      ...prev,
      [word]: (prev[word] || 0) + 1
    }));
    setWordStudyStats(prev => ({
      ...prev,
      [word]: {
        spoken: prev[word]?.spoken || 0,
        struggled: (prev[word]?.struggled || 0) + 1
      }
    }));
  };

  // Clean elements on exit
  useEffect(() => {
    return () => {
      if (recognitionRef.current) {
        recognitionRef.current.onend = null;
        recognitionRef.current.abort();
      }
    };
  }, []);

  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-sky-200 via-amber-100 to-amber-200 text-slate-900 flex flex-col justify-between font-sans transition-all duration-300 relative overflow-hidden select-none pb-4 ${
        wordMatchFlash ? 'bg-emerald-300/80' : ''
      }`}
    >
      {/* Decorative Floating Fluffy Cartoon Clouds */}
      <div className="absolute top-10 left-[8%] w-24 h-10 bg-white rounded-full opacity-60 blur-[1px] pointer-events-none animate-pulse" />
      <div className="absolute top-28 right-[10%] w-32 h-12 bg-white rounded-full opacity-60 blur-[1px] pointer-events-none animate-pulse" />
      <div className="absolute bottom-20 left-[4%] w-28 h-10 bg-white rounded-full opacity-40 blur-[1px] pointer-events-none" />

      {/* HEADER BAR */}
      <header className="bg-yellow-400 border-b-8 border-slate-900 py-3.5 px-6 md:px-12 sticky top-0 z-50 flex flex-col sm:flex-row items-center justify-between gap-3 shadow-xl">
        {currentView === 'HUB' ? (
          <>
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-purple-500 border-4 border-slate-900 flex items-center justify-center shadow-md animate-bounce">
                <Gamepad2 className="w-6 h-6 text-white" />
              </div>
              <div className="text-center sm:text-left">
                <h1 className="text-xl md:text-2xl font-black tracking-wider text-slate-900 uppercase drop-shadow-[0_2px_0_rgba(255,255,255,1)]">
                  VOICE WORD GAMES
                </h1>
                <p className="text-[10px] text-purple-900 tracking-widest font-black uppercase bg-white/70 border-2 border-slate-900 px-2 py-0.5 rounded-full inline-block mt-0.5">
                  ⭐ KIDS LEARNING HUB
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <div className="bg-pink-100 border-4 border-slate-900 text-slate-900 px-4 py-1.5 rounded-2xl flex items-center gap-2 shadow-md hover:scale-105 transition-transform">
                <Trophy className="w-5 h-5 text-yellow-600 fill-yellow-400 stroke-[2.5]" />
                <span className="text-xs font-black">TOTAL RECORD:</span>
                <span className="font-black text-sm text-yellow-700 font-mono tracking-tight">{totalRecordSum}</span>
              </div>
            </div>
          </>
        ) : (
          <>
            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  speakSound.playCoin();
                  if (recognitionRef.current) {
                    recognitionRef.current.onend = null;
                    recognitionRef.current.abort();
                  }
                  setCurrentView('HUB');
                }}
                className="bg-white hover:bg-slate-50 border-4 border-slate-900 px-3.5 py-1.5 rounded-2xl text-slate-900 font-black text-xs flex items-center gap-1.5 cursor-pointer transition-all active:translate-y-0.5 shadow-md uppercase tracking-wider animate-pulse"
                id="btn-back-to-hub-header"
              >
                ← HUB
              </button>
              <div className="w-10 h-10 rounded-xl bg-pink-500 border-4 border-slate-900 flex items-center justify-center shadow-md animate-bounce">
                <span className="text-xl" role="img" aria-label="game-icon">
                  {currentView === 'VOICE_RACER' ? '🚗' : '🫧'}
                </span>
              </div>
              <div className="text-left">
                <h1 className="text-xs sm:text-sm md:text-base font-black tracking-wider text-slate-900 uppercase drop-shadow-[0_1px_0_rgba(255,255,255,1)] leading-none">
                  {currentView === 'VOICE_RACER' ? 'VOICE LANE RACER' : 'VOICE BUBBLE POPPER'}
                </h1>
                <p className="text-[9px] text-purple-900 tracking-wider font-extrabold uppercase bg-white/70 border-2 border-slate-900 px-1.5 py-0.5 rounded-full inline-block mt-0.5">
                  {currentView === 'VOICE_RACER' ? `Level ${level}` : `Level ${bubbleLevel}`}
                </p>
              </div>
            </div>

            <div className="flex items-center flex-wrap justify-center sm:justify-end gap-2">
              {/* CURRENT GAME SCORE */}
              <div className="bg-pink-100 border-4 border-slate-900 text-slate-900 px-2.5 py-1 rounded-2xl flex items-center gap-1 border-dashed shadow-sm">
                <span className="text-[10px] font-black uppercase text-slate-600">SCORE:</span>
                <span className="font-black text-xs text-pink-600 font-mono tracking-tight">
                  {currentView === 'VOICE_RACER' ? score : bubbleScore}
                </span>
              </div>

              {/* HIGH SCORE FOR THE GAME */}
              <div className="bg-amber-100 border-4 border-slate-900 text-slate-900 px-2.5 py-1 rounded-2xl flex items-center gap-1 shadow-sm">
                <Trophy className="w-3.5 h-3.5 text-yellow-600 fill-yellow-400 stroke-[2.5]" />
                <span className="text-[10px] font-black uppercase text-slate-600">BEST:</span>
                <span className="font-black text-xs text-yellow-700 font-mono tracking-tight">
                  {currentView === 'VOICE_RACER' ? highScore : bubbleHighScore}
                </span>
              </div>
              
              {/* SUM OF ALL HIGH SCORES */}
              <div className="bg-purple-100 border-4 border-slate-900 text-slate-900 px-2.5 py-1 rounded-2xl flex items-center gap-1 shadow-md">
                <span className="text-[10px] font-black uppercase text-slate-600">TOTAL:</span>
                <span className="font-black text-xs text-purple-700 font-mono tracking-tight">
                  {totalRecordSum}
                </span>
              </div>
            </div>
          </>
        )}
      </header>

      {/* CORE DISPLAY WINDOW */}
      <main className="flex-grow p-4 md:p-8 max-w-4xl w-full mx-auto relative z-10">
        {currentView === 'HUB' ? (
          <div className="space-y-6 animate-scale-up animate-fade-in" id="game-selection-portal">
            {/* Playful Welcome Greeting */}
            <div className="text-center space-y-2">
              <div className="inline-flex gap-2 justify-center items-center mb-1">
                <div className="w-10 h-10 rounded-2xl bg-purple-500 border-4 border-slate-900 flex items-center justify-center animate-spin">
                  <span className="text-sm">⭐</span>
                </div>
                <div className="w-12 h-12 rounded-2xl bg-yellow-400 border-4 border-slate-900 flex items-center justify-center animate-bounce">
                  <Mic className="w-6 h-6 text-slate-950 stroke-[3.5]" />
                </div>
                <div className="w-10 h-10 rounded-2xl bg-pink-500 border-4 border-slate-900 flex items-center justify-center animate-spin">
                  <Car className="w-5 h-5 text-white" />
                </div>
              </div>
              <h1 className="text-3xl md:text-4xl font-black tracking-wider text-slate-900 uppercase drop-shadow-[0_3px_0_rgba(255,255,255,1)]">
                VOICE GAMES!
              </h1>
              <p className="text-xs text-slate-700 font-extrabold max-w-md mx-auto leading-relaxed">
                Play English games with your voice! Match words, pop balloons, and win trophies!
              </p>
            </div>

            {/* List of Game Rectangles */}
            <div className="space-y-4 max-w-3xl mx-auto">
              {games.map((g) => {
                const isColleague = g.id.startsWith('colleague');
                return (
                  <div
                    key={g.id}
                    className={`border-4 rounded-3xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4 transition-all ${
                      isColleague
                        ? 'bg-slate-100 border-dashed border-slate-400 opacity-90'
                        : g.unlocked
                        ? 'bg-white border-slate-900 hover:translate-y-[-2px] hover:shadow-md bubble-shadow-pink col-active'
                        : 'bg-white/60 border-slate-300 opacity-80'
                    }`}
                    id={`arcade-card-${g.id}`}
                  >
                    {/* Left: Icon, Title & Description */}
                    <div className="flex flex-col sm:flex-row items-center gap-4 text-center sm:text-left flex-grow w-full">
                      <div
                        className={`w-14 h-14 rounded-2xl border-4 border-slate-900 ${
                          isColleague ? 'bg-slate-200 border-dashed border-slate-400' : g.accent
                        } flex items-center justify-center text-3xl shrink-0 ${
                          g.unlocked ? 'animate-bounce shadow-sm' : 'shadow-none'
                        }`}
                      >
                        {g.icon}
                      </div>
                      <div className="space-y-1">
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-2">
                          <h3 className={`text-base md:text-lg font-black uppercase tracking-wide ${
                            isColleague ? 'text-slate-500' : 'text-slate-950'
                          }`}>
                            {g.title}
                          </h3>
                          {g.unlocked ? (
                            <span className="bg-emerald-400 text-white text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border-2 border-slate-900">
                              PLAY 🟢
                            </span>
                          ) : (
                            <span className="bg-slate-300 text-slate-600 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-md border-2 border-slate-300">
                              TEMPLATE 🔒
                            </span>
                          )}
                        </div>
                        <p className={`text-xs leading-snug font-bold ${
                          isColleague ? 'text-slate-400' : 'text-slate-500'
                        }`}>
                          {g.description}
                        </p>
                      </div>
                    </div>

                    {/* Right: Record Pocket and Action Button */}
                    <div className="flex flex-col sm:flex-row items-center gap-3 shrink-0 w-full sm:w-auto justify-end">
                      {/* Record Display */}
                      <div className={`border-4 px-3 py-1.5 rounded-2xl flex items-center justify-center gap-2 font-black text-xs w-full sm:w-auto ${
                        isColleague
                          ? 'bg-slate-200 border-slate-300 text-slate-500'
                          : 'bg-amber-100 border-slate-900 text-amber-900'
                      }`}>
                        <span>🏆 RECORD:</span>
                        <span className="font-mono text-sm tracking-tight">{g.record}</span>
                      </div>

                      {/* Action button */}
                      {g.unlocked ? (
                        <button
                          onClick={() => {
                            speakSound.playCoin();
                            if (g.id === 'voice-racer') {
                              setCurrentView('VOICE_RACER');
                              setGameState('START_SCREEN');
                            } else if (g.id === 'bubble-popper') {
                              setCurrentView('BUBBLE_POPPER');
                            }
                          }}
                          className="w-full sm:w-32 py-2 bg-pink-500 hover:bg-pink-600 border-4 border-slate-900 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-0.5 uppercase tracking-wider transition-all select-none hover:scale-103 shadow-sm"
                          id={`btn-play-${g.id}`}
                        >
                          <Play className="w-3 h-3 fill-current stroke-[3.5]" /> PLAY 🚀
                        </button>
                      ) : (
                        <button
                          disabled
                          className="w-full sm:w-32 py-2 bg-slate-200 border-4 border-dashed border-slate-300 text-slate-400 font-black text-xs rounded-2xl cursor-not-allowed uppercase tracking-wider"
                        >
                          LOCKED
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : currentView === 'VOICE_RACER' ? (
          <>
            {/* STATE A: GAME LOUNGE (KIDS BUBBLE THEMED INTERFACE) */}
            {gameState === 'START_SCREEN' && (
          <div className="max-w-md mx-auto py-4 px-2 flex flex-col items-center justify-center" id="voice-racer-arcade-lounge">
            
            {/* BIG BOUNCY BOX GREETINGS */}
            <div className="text-center mb-6 flex flex-col items-center animate-pulse">
              <div className="w-18 h-18 rounded-3xl bg-amber-400 border-4 border-slate-900 hover:rotate-12 transition-transform flex items-center justify-center shadow-lg mb-3">
                <Car className="w-10 h-10 text-slate-950 stroke-[3.5]" />
              </div>
              <h1 className="text-4xl font-black tracking-wider text-slate-900 uppercase drop-shadow-[0_3px_0_rgba(255,255,255,1)]">
                VOICE RACER!
              </h1>
            </div>

            {/* MAIN ARCADE MENU CARD */}
            <div className="w-full bg-slate-50 rounded-4xl border-8 border-slate-900 p-6 space-y-5 bubble-shadow-purple">
              
              {/* Giant Play Game Button - Highly Interactive children tap sound trigger */}
              <button
                onClick={triggerPlayGame}
                className="w-full py-5 bg-gradient-to-r from-emerald-400 to-green-500 hover:from-emerald-500 hover:to-green-600 border-4 border-slate-900 text-white font-black text-xl rounded-2xl flex items-center justify-center gap-3 cursor-pointer transition-all hover:scale-102 active:translate-y-1.5 active:shadow-none bubble-shadow-green uppercase tracking-wide"
                id="btn-play-game-start"
              >
                <Play className="w-6 h-6 fill-current stroke-[3.5] animate-bounce" /> START HIGHWAY RACE!
              </button>

              <div className="border-b-4 border-dashed border-slate-300 my-1" />

              {/* Highway Theme Selection Mode */}
              <div className="space-y-2 text-left">
                <label className="block text-xs font-black text-rose-500 uppercase tracking-widest ml-1">
                  CHOOSE ROAD ENVIROMENT:
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {(['forest', 'night', 'desert', 'city'] as TrackStyle[]).map((style) => (
                    <button
                      key={style}
                      type="button"
                      onClick={() => setTrackStyle(style)}
                      className={`px-3 py-2.5 border-4 rounded-2xl text-[11px] font-black uppercase transition-all tracking-wider cursor-pointer text-center ${
                        trackStyle === style
                          ? 'bg-purple-500 border-slate-900 text-white bubble-shadow-purple -translate-y-0.5'
                          : 'bg-white border-slate-300 text-slate-700 hover:border-slate-900'
                      }`}
                    >
                      {style === 'forest' && 'Forest Land'}
                      {style === 'night' && 'Cosmic Night'}
                      {style === 'desert' && 'Golden Desert'}
                      {style === 'city' && 'Neon City'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Accordion List A: Choose Vocabulary Set */}
              <div className="space-y-1 text-left">
                <button
                  onClick={() => {
                    setIsCategorySelectorExpanded(!isCategorySelectorExpanded);
                    setIsWarmupExpanded(false);
                    setIsCustomWordsExpanded(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border-4 border-slate-900 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer font-black text-xs text-slate-800"
                >
                  <span className="flex items-center gap-2">
                    TASK BOOK: <span className="text-purple-600 font-black uppercase text-xs">[{activeCategory.name}]</span>
                  </span>
                  <span className="text-xs text-slate-800 bg-slate-100 border-2 border-slate-900 px-1.5 rounded-md">{isCategorySelectorExpanded ? '▲' : '▼'}</span>
                </button>

                {isCategorySelectorExpanded && (
                  <div className="bg-white border-4 border-slate-900 rounded-2xl p-2.5 flex flex-col gap-1.5 max-h-48 overflow-y-auto">
                    {BUILTIN_CATEGORIES.map(category => (
                      <button
                        key={category.id}
                        onClick={() => {
                          setActiveCategory(category);
                          setIsCategorySelectorExpanded(false);
                        }}
                        className={`w-full text-left px-3 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-between border-2 ${
                          activeCategory.id === category.id
                            ? 'bg-purple-100 border-purple-500 text-purple-900'
                            : 'bg-slate-50 border-transparent hover:border-slate-300 text-slate-600'
                        }`}
                      >
                        <span>{category.name}</span>
                        <span className="text-[10px] bg-white border-2 border-slate-400 text-slate-700 px-1.5 py-0.5 rounded-full font-black">{category.words.length} items</span>
                      </button>
                    ))}

                    <button
                      onClick={() => {
                        setActiveCategory({ id: 'custom', name: 'My Words', description: '', icon: 'edit', words: customWords });
                        setIsCategorySelectorExpanded(false);
                      }}
                      className={`w-full text-left px-3 py-2.5 rounded-xl font-black text-xs transition-all flex items-center justify-between border-2 ${
                        activeCategory.id === 'custom'
                          ? 'bg-pink-100 border-pink-400 text-pink-900'
                          : 'bg-slate-50 border-transparent hover:border-slate-300 text-slate-600'
                      }`}
                    >
                      <span>Custom Words List</span>
                      <span className="text-[10px] bg-white border-2 border-slate-400 text-slate-700 px-1.5 py-0.5 rounded-full font-black">{customWords.length} items</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Accordion List B: Learn & Speak Warmup Card */}
              <div className="space-y-1 text-left">
                <button
                  onClick={() => {
                    setIsWarmupExpanded(!isWarmupExpanded);
                    setIsCategorySelectorExpanded(false);
                    setIsCustomWordsExpanded(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border-4 border-slate-900 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer font-black text-xs text-slate-800"
                >
                  <span className="flex items-center gap-2">
                    LISTEN & LEARN PRACTICE ({getSelectedVocabularyList().length} Words)
                  </span>
                  <span className="text-xs text-slate-800 bg-slate-100 border-2 border-slate-900 px-1.5 rounded-md">{isWarmupExpanded ? '▲' : '▼'}</span>
                </button>

                {isWarmupExpanded && (
                  <div className="bg-white border-4 border-slate-900 rounded-2xl p-3">
                    {activeCategory.id === 'custom' && customWords.length === 0 ? (
                      <div className="text-center py-4 bg-amber-50 rounded-xl border-2 border-dashed border-amber-300">
                        <p className="text-xs text-amber-800 font-black">Your custom dictionary list is currently empty!</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2 max-h-48 overflow-y-auto pr-1">
                        {getSelectedVocabularyList().map((item, index) => (
                          <button
                            key={index}
                            onClick={() => speakWord(item.word)}
                            className="bg-yellow-50 hover:bg-yellow-100 border-2 border-slate-900 text-left p-2 rounded-xl transition-all cursor-pointer flex flex-col justify-between group active:scale-95"
                          >
                            <span className="text-slate-900 font-extrabold text-xs flex items-center justify-between w-full">
                              <span className="truncate">{item.word}</span>
                              <Volume2 className="w-4 h-4 text-slate-600 group-hover:text-purple-600 shrink-0" />
                            </span>
                            <span className="text-[10px] text-purple-700 font-bold truncate mt-0.5">
                              {item.translation}
                            </span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Accordion List C: Add My Own Custom Play Words Card */}
              <div className="space-y-1 text-left">
                <button
                  onClick={() => {
                    setIsCustomWordsExpanded(!isCustomWordsExpanded);
                    setIsCategorySelectorExpanded(false);
                    setIsWarmupExpanded(false);
                  }}
                  className="w-full flex items-center justify-between px-4 py-3 bg-white border-4 border-slate-900 hover:bg-slate-50 rounded-2xl transition-all cursor-pointer font-black text-xs text-slate-800"
                >
                  <span className="flex items-center gap-2">
                    ADD MY OWN WORDS LIST ({customWords.length})
                  </span>
                  <span className="text-xs text-slate-800 bg-slate-100 border-2 border-slate-900 px-1.5 rounded-md">{isCustomWordsExpanded ? '▲' : '▼'}</span>
                </button>

                {isCustomWordsExpanded && (
                  <div className="bg-white border-4 border-slate-900 rounded-2xl p-4">
                    <CustomWordsManager
                      customWords={customWords}
                      onAddWord={handleAddNewWord}
                      onDeleteWord={handleDeleteWord}
                      onClearAll={handleClearCustomWords}
                    />
                  </div>
                )}
              </div>

            </div>

            {/* EXIT TO PORTAL BUTTON */}
            <button
              onClick={() => {
                speakSound.playCoin();
                setCurrentView('HUB');
              }}
              className="w-full mt-4 py-3.5 bg-purple-500 hover:bg-purple-600 border-4 border-slate-900 text-white font-black text-xs rounded-2xl flex items-center justify-center gap-2 cursor-pointer transition-transform active:translate-y-1 active:shadow-none bubble-shadow-purple uppercase tracking-wider hover:scale-101 shadow-md"
              id="btn-quit-to-hub-start-screen"
            >
              🏯 EXIT TO GAMES PORTAL
            </button>

          </div>
        )}

        {/* STATE B: ACTIVE RACING GAME PLAYGROUND */}
        {gameState === 'PLAYING' && (
          <div className="max-w-2xl mx-auto space-y-4 text-center" id="arcade-highway-centerage">
            
            {/* Play Score Header Info Strip */}
            <div className="flex items-center justify-between bg-yellow-300 border-4 border-slate-900 px-5 py-2.5 rounded-2xl shadow-md" id="game-minimal-header">
              <div className="flex items-center gap-2">
                <span className="w-3.5 h-3.5 rounded-full bg-emerald-500 border-2 border-slate-900 animate-ping" />
                <span className="text-xs font-black text-slate-900 uppercase tracking-widest flex items-center gap-1">
                  SAY WORD TO DODGE!
                </span>
              </div>
              
              <div className="text-xs font-black text-purple-900 uppercase tracking-wider bg-white border-2 border-slate-900 px-2.5 py-0.5 rounded-full">
                Topic: {activeCategory.name}
              </div>

              {/* Exit out button */}
              <button
                onClick={() => {
                  setGameState('START_SCREEN');
                  if (recognitionRef.current) {
                    recognitionRef.current.abort();
                  }
                }}
                className="bg-rose-500 hover:bg-rose-600 border-2 border-slate-900 px-3 py-1 rounded-xl text-white font-black text-[10px] flex items-center gap-1 cursor-pointer transition-all active:scale-95 shadow-sm"
                id="btn-quit-playing-state"
              >
                <X className="w-3.5 h-3.5 stroke-[3]" /> QUIT GAME
              </button>
            </div>

            {/* HIGHWAY PHYSICAL CANVAS */}
            <div className="relative border-8 border-slate-900 rounded-3xl overflow-hidden shadow-2xl">
              <GameCanvas
                playerLane={playerLane}
                gameState={gameState}
                gameSpeed={Math.min(5.2, 2.5 + score * 0.0007)}
                onCollide={handleCarCollision}
                onAvoidObstacle={handleAvoidObstacle}
                lives={lives}
                isBulletTime={isBulletTime}
                onApproach={handleApproachObstacle}
                score={score}
                level={level}
                trackStyle={trackStyle}
              />

              {/* Bullet-Time Obstacle Warning Prompt */}
              {isBulletTime && (
                <div className="absolute top-16 left-1/2 -translate-x-1/2 w-[85%] bg-yellow-400 border-4 border-slate-900 px-4 py-3.5 rounded-3xl shadow-lg flex flex-col items-center gap-2 z-45 animate-bounce">
                  <span className="text-xs font-black tracking-widest text-slate-950 uppercase flex items-center gap-1">
                    SPEAK QUICKLY IN ORDER TO SWERVE!
                  </span>
                  <div className="w-full bg-slate-900 h-3 rounded-full overflow-hidden border-2 border-slate-950">
                    <div
                      className="bg-pink-500 h-full rounded-full transition-all duration-75"
                      style={{ width: `${bulletTimeProgress}%` }}
                    />
                  </div>
                </div>
              )}

              {/* GIANT DOCKS LANE WORD BUTTON HOOKS */}
              {isBulletTime && (
                <div className="absolute left-[16px] right-[16px] bottom-4 z-30 pointer-events-auto grid grid-cols-3 gap-3 md:gap-5" id="adjacent-word-triggers-board">
                  {([0, 1, 2] as Lane[]).map(lane => {
                    const targetWord = currentLaneWords[lane];
                    const isCurrent = playerLane === lane;
                    const laneName = lane === 0 ? 'LEFT LANE' : lane === 1 ? 'CENTER' : 'RIGHT LANE';

                    // Lane styled color boxes
                    const borderClass = lane === 0 
                      ? 'border-sky-500 bg-sky-100 bubble-shadow-pink text-sky-950' 
                      : lane === 2 
                      ? 'border-pink-500 bg-pink-100 bubble-shadow-pink text-pink-950' 
                      : 'border-yellow-500 bg-yellow-100 bubble-shadow-amber text-yellow-950';

                    const labelBgClass = lane === 0 ? 'bg-sky-400 text-white' : lane === 2 ? 'bg-pink-400 text-white' : 'bg-yellow-400 text-slate-900';

                    if (isCurrent) {
                      return (
                        <div
                          key={lane}
                          className="opacity-0 pointer-events-none h-28 md:h-32"
                          id={`steering-panel-lane-${lane}`}
                        />
                      );
                    }

                    return (
                      <div
                        key={lane}
                        className={`relative text-center p-2 rounded-2xl border-4 transition-all h-28 md:h-32 flex flex-col justify-between ${
                          targetWord
                            ? `border-slate-900 animate-pulse ${borderClass}`
                            : 'border-transparent opacity-0 pointer-events-none h-28 md:h-32'
                        }`}
                        id={`steering-panel-lane-${lane}`}
                      >
                        <span
                          className={`text-[8.5px] font-black tracking-wider uppercase px-2 py-0.5 rounded-full inline-block mx-auto border-2 border-slate-900 ${labelBgClass}`}
                        >
                          {laneName}
                        </span>

                        {targetWord ? (
                          <div className="flex flex-col items-center my-auto z-10 w-full truncate overflow-hidden justify-center">
                            <span className="text-sm md:text-xl font-black text-slate-950 uppercase tracking-widest drop-shadow-[0_1.5px_0_rgba(255,255,255,1)]">
                              {targetWord}
                            </span>
                            <span className="text-[10px] text-slate-700 font-extrabold mt-0.5 truncate max-w-full">
                              {getSelectedVocabularyList().find(v => v.word === targetWord)?.translation || ''}
                            </span>
                          </div>
                        ) : (
                          <span className="text-[9px] text-slate-400 font-extrabold uppercase my-auto">Clear</span>
                        )}

                        {targetWord && (
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              triggerTTSHelp(targetWord);
                            }}
                            className="text-[9px] text-slate-900 font-black hover:bg-yellow-300 bg-white border-2 border-slate-900 px-3 py-1 rounded-xl cursor-not-allowed mx-auto flex items-center gap-1 shadow-sm active:translate-y-0.5 duration-100"
                            title="Hint"
                          >
                            💡 HELP
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* AUDIO EQUALIZER & MONITORING BALLOON */}
            <div className="space-y-3.5">
              <AudioVisualizer
                isListening={voiceStatus.status === 'listening'}
                isMatched={wordMatchFlash}
                errorMessage={voiceStatus.status === 'error' ? voiceStatus.message : undefined}
              />

              <div className="bg-white border-4 border-slate-900 p-4.5 rounded-3xl shadow-md text-left flex flex-col sm:flex-row items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-pink-500 border-2 border-slate-900 text-white flex items-center justify-center animate-bounce">
                    <Mic className="w-5 h-5 stroke-[2.5]" />
                  </div>
                  <div>
                    <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">
                      Your Words Heard:
                    </p>
                    
                    {/* Speech bubble bubble-gum effect */}
                    <div className="bg-purple-100 border-2 border-slate-900 text-slate-900 font-black text-sm px-3 py-1 rounded-xl relative mt-1 inline-block">
                      {lastHeardTranscript ? (
                        <span className="text-purple-900 italic font-black">"{lastHeardTranscript}"</span>
                      ) : (
                        <span className="text-slate-500 font-bold">Say an English word loudly to jump lanes!</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

        {/* STATE C: CHILD STUDY CARD RECAP (GAME OVER) */}
        {gameState === 'GAME_OVER' && (
          <div className="max-w-md mx-auto py-6 animate-scale-up" id="game-over-console">
            <div className="bg-white border-8 border-slate-900 rounded-4xl p-6 text-center relative overflow-hidden bubble-shadow-rose">
              
              <span className="inline-flex items-center gap-1 bg-yellow-300 border-4 border-slate-900 px-4 py-1.5 rounded-full text-slate-900 text-xs font-black uppercase tracking-widest">
                Driving Finish Line!
              </span>

              <h2 className="text-3xl font-black text-slate-950 mt-6 mb-2 uppercase tracking-wide">
                SUPER COOPER DRIVING!
              </h2>
              <p className="text-xs text-slate-500 leading-normal font-bold">
                You drove amazingly! Click below to practice speaking words and beat your high record!
              </p>

              {/* Driving stats grid boxes */}
              <div className="grid grid-cols-2 gap-3.5 my-6">
                <div className="bg-sky-100 border-4 border-slate-900 p-3.5 rounded-2xl flex flex-col items-center shadow-md">
                  <span className="text-[10px] font-black text-sky-700 uppercase tracking-widest">DRIVING SCORE</span>
                  <span className="text-lg font-black text-sky-900 mt-1 font-mono">{score} points</span>
                </div>
                <div className="bg-amber-100 border-4 border-slate-900 p-3.5 rounded-2xl flex flex-col items-center shadow-md">
                  <span className="text-[10px] font-black text-amber-600 uppercase tracking-widest">RECORD TARGET</span>
                  <span className="text-lg font-black text-amber-800 mt-1 font-mono">{highScore} points</span>
                </div>
              </div>

              {/* SPEECH SUMMARY CARD */}
              <div className="bg-purple-100 border-4 border-slate-900 p-4 rounded-3xl text-left mb-6" id="vocabulary-study-scorecard">
                <div className="flex items-center gap-2 mb-2.5">
                  <BookOpen className="w-5 h-5 text-purple-700 stroke-[2.5]" />
                  <h4 className="text-xs font-black text-purple-900 uppercase tracking-widest">
                    Your English Practice Scorecard:
                  </h4>
                </div>

                <div className="space-y-1.5 max-h-44 overflow-y-auto pr-1">
                  {Object.keys(wordStudyStats).length === 0 ? (
                    <div className="text-center py-4 bg-white border-2 border-dashed border-slate-300 rounded-2xl">
                      <p className="text-xs text-slate-500 font-extrabold leading-normal">
                        Spoken scorecard empty. Try driving again to gather speech stats!
                      </p>
                    </div>
                  ) : (
                    Object.keys(wordStudyStats).map((word, index) => {
                      const spoken = wordStudyStats[word].spoken;
                      const struggled = wordStudyStats[word].struggled;
                      
                      return (
                        <div
                          key={index}
                          className="bg-white border-2 border-slate-900 p-2.5 rounded-xl flex items-center justify-between"
                        >
                          <div className="flex items-center gap-2">
                            <span className="text-slate-950 font-black text-xs bg-slate-100 px-2 py-0.5 rounded-md border border-slate-900">{word}</span>
                            <span className="text-slate-500 text-xs font-bold">
                              ➔ {getSelectedVocabularyList().find(v => v.word === word)?.translation || ''}
                            </span>
                          </div>

                          <div className="flex items-center gap-1.5">
                            <span className="inline-flex items-center text-[9px] text-emerald-800 bg-emerald-100 px-2 py-1.5 rounded-full font-black border border-emerald-300">
                              Heard: {spoken}m
                            </span>
                            {struggled > 0 && (
                              <span className="inline-flex items-center text-[9px] text-amber-800 bg-amber-100 px-2 py-1.5 rounded-full font-black border border-amber-350">
                                Clues: {struggled}m
                              </span>
                            )}
                            <button
                              onClick={() => speakWord(word)}
                              className="p-1 bg-yellow-100 hover:bg-yellow-200 border-2 border-slate-900 rounded-lg cursor-pointer"
                              title="Listen"
                            >
                              <Volume2 className="w-3.5 h-3.5 text-slate-900" />
                            </button>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Navigation CTAs */}
              <div className="flex flex-col gap-2.5 my-2 w-full">
                <div className="flex flex-col sm:flex-row gap-2.5">
                  <button
                    onClick={triggerPlayGame}
                    className="flex-1 bg-pink-500 hover:bg-pink-600 border-4 border-slate-900 text-white font-black text-xs px-6 py-4 rounded-xl flex items-center justify-center gap-1.5 cursor-pointer active:translate-y-1 active:shadow-none bubble-shadow-pink"
                    id="btn-play-again-failed"
                  >
                    <RotateCcw className="w-4 h-4 text-white stroke-[3]" /> PLAY HIGHWAY AGAIN!
                  </button>
                  <button
                    onClick={() => setGameState('START_SCREEN')}
                    className="flex-1 bg-white hover:bg-slate-50 border-4 border-slate-900 text-slate-800 font-black text-xs px-5 py-4 rounded-xl flex items-center justify-center cursor-pointer hover:scale-101 active:translate-y-1 transition-all"
                    id="btn-home-screen-failed"
                  >
                    Race Options
                  </button>
                </div>
                
                <button
                  onClick={() => {
                    speakSound.playCoin();
                    setCurrentView('HUB');
                  }}
                  className="w-full bg-purple-500 hover:bg-purple-600 border-4 border-slate-900 text-white font-black text-xs px-5 py-3.5 rounded-xl flex items-center justify-center gap-2 cursor-pointer transition-all hover:scale-101 active:translate-y-1 shadow-md uppercase tracking-wider mt-1.5"
                  id="btn-quit-to-hub-gameover"
                >
                  🏰 EXIT TO GAMES PORTAL
                </button>
              </div>

            </div>
          </div>
        )}

          </>
        ) : (
          <BubblePopperGame
            onBackToHub={() => setCurrentView('HUB')}
            onUpdateHighScore={handleUpdateBubbleHighScore}
            highScore={bubbleHighScore}
            customWords={customWords}
            onAddCustomWord={handleAddNewWord}
            onDeleteCustomWord={handleDeleteWord}
            onClearCustomWords={handleClearCustomWords}
            onScoreChange={setBubbleScore}
            onLevelChange={setBubbleLevel}
          />
        )}
      </main>
    </div>
  );
}
