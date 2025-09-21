import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { WordsService } from "@/services/words";
import { TrackingService } from "@/services/tracking";
import { DifficultyService } from "@/services/difficulty";
import { ExamplesService } from "@/services/examples";
import { WordDoc, Difficulty, ExampleSentence } from "@/types/models";
import {
  RotateCcw,
  Check,
  X,
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Eye,
  RotateCw,
  Sparkles,
  Target,
  TrendingUp,
  Heart,
  XCircle,
} from "lucide-react";

export function Flashcards() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get settings from URL parameters
  const cardCount = parseInt(searchParams.get("count") || "10");
  const difficultyFilter =
    (searchParams.get("difficulty") as Difficulty | "all") || "all";
  const showFailedOnly = searchParams.get("failedOnly") === "true";

  const [words, setWords] = useState<(WordDoc & { id: string })[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showTranslation, setShowTranslation] = useState(false);
  const [isFlipping, setIsFlipping] = useState(false);
  const [loading, setLoading] = useState(true);

  // Swipe gesture states
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [dragCurrent, setDragCurrent] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragOffset, setDragOffset] = useState(0);
  const [sessionStats, setSessionStats] = useState({ correct: 0, total: 0 });
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [sessionAnswers, setSessionAnswers] = useState<
    Array<{
      wordId: string;
      word: string;
      translation: string;
      isCorrect: boolean;
    }>
  >([]);
  const [currentExamples, setCurrentExamples] = useState<
    (ExampleSentence & { id: string })[]
  >([]);
  const [currentExampleIndex, setCurrentExampleIndex] = useState(0);
  const [loadingExamples, setLoadingExamples] = useState(false);

  useEffect(() => {
    if (user) {
      loadWords();
    }
  }, [user]);

  // Initialize flashcards when words are loaded and we have URL parameters
  useEffect(() => {
    if (words.length > 0 && searchParams.toString() && !startTime) {
      // Initialize session start time
      setStartTime(new Date());
    }
  }, [words, searchParams, startTime]);

  const loadWords = async () => {
    if (!user) return;

    try {
      let wordsData = await WordsService.getWords(user.uid);

      // Apply filters
      if (difficultyFilter !== "all") {
        wordsData = DifficultyService.filterWordsByDifficulty(
          wordsData,
          difficultyFilter
        );
      }

      if (showFailedOnly) {
        wordsData = wordsData.filter((word) => word.lastResult === "fail");
      }

      // Limit words to the specified card count if we have URL parameters
      if (searchParams.toString()) {
        wordsData = wordsData.slice(0, cardCount);
      }

      setWords(wordsData);
    } catch (error) {
      console.error("Error loading words:", error);
    } finally {
      setLoading(false);
    }
  };

  const loadExamples = async (wordId: string) => {
    if (!user) return;

    setLoadingExamples(true);
    try {
      const examples = await ExamplesService.getExamples(user.uid, wordId);
      setCurrentExamples(examples);
      // Start with a random example instead of always the first one
      setCurrentExampleIndex(
        examples.length > 0 ? Math.floor(Math.random() * examples.length) : 0
      );
    } catch (error) {
      console.error("Error loading examples:", error);
      setCurrentExamples([]);
    } finally {
      setLoadingExamples(false);
    }
  };

  const nextExample = () => {
    if (currentExamples.length > 0) {
      setCurrentExampleIndex((prev) => (prev + 1) % currentExamples.length);
    }
  };

  const prevExample = () => {
    if (currentExamples.length > 0) {
      setCurrentExampleIndex(
        (prev) => (prev - 1 + currentExamples.length) % currentExamples.length
      );
    }
  };

  const handleFlipCard = () => {
    if (isFlipping) return;

    setIsFlipping(true);
    setShowTranslation(true);

    // Load examples after the flip animation is complete
    setTimeout(() => {
      loadExamples(words[currentIndex].id);
      setIsFlipping(false);
    }, 600); // Full flip animation duration
  };

  // Swipe gesture handlers
  const handleDragStart = (e: React.MouseEvent | React.TouchEvent) => {
    if (!showTranslation) return; // Only allow swipe when translation is shown

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    setDragStart({ x: clientX, y: clientY });
    setDragCurrent({ x: clientX, y: clientY });
    setIsDragging(true);
    setDragOffset(0);
  };

  const handleDragMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDragging || !showTranslation) return;

    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const clientY = "touches" in e ? e.touches[0].clientY : e.clientY;

    setDragCurrent({ x: clientX, y: clientY });
    const offset = clientX - dragStart.x;
    setDragOffset(offset);
  };

  const handleDragEnd = () => {
    if (!isDragging || !showTranslation) return;

    setIsDragging(false);

    const threshold = 150; // Minimum distance to trigger swipe
    const offset = dragCurrent.x - dragStart.x;

    if (Math.abs(offset) > threshold) {
      if (offset > 0) {
        // Swipe right - Yes (correct)
        handleAnswer(true);
      } else {
        // Swipe left - No (incorrect)
        handleAnswer(false);
      }
    } else {
      // Reset position if not enough distance
      setDragOffset(0);
    }
  };

  // Mouse event handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragMove(e);
  };

  const handleMouseUp = () => {
    handleDragEnd();
  };

  const handleAnswer = async (isCorrect: boolean) => {
    console.log("handleAnswer called with:", isCorrect);
    if (!user || currentIndex >= words.length) return;

    const currentWord = words[currentIndex];

    try {
      await TrackingService.recordAnswer(user.uid, currentWord.id, isCorrect);

      // Track the answer for session history
      setSessionAnswers((prev) => [
        ...prev,
        {
          wordId: currentWord.id,
          word: currentWord.word,
          translation: currentWord.translation,
          isCorrect,
        },
      ]);

      setSessionStats((prev) => ({
        correct: prev.correct + (isCorrect ? 1 : 0),
        total: prev.total + 1,
      }));
    } catch (error) {
      console.error("Error recording answer:", error);
    }

    // Move to next word
    if (currentIndex + 1 < words.length) {
      setCurrentIndex((prev) => prev + 1);
      setShowTranslation(false);
      setIsFlipping(false);
      // Reset drag states
      setIsDragging(false);
      setDragOffset(0);
    } else {
      // Session completed
      finishSession(isCorrect);
    }
  };

  const finishSession = async (lastAnswerCorrect: boolean) => {
    if (!user || !startTime) return;

    try {
      const finalStats = {
        correct: sessionStats.correct + (lastAnswerCorrect ? 1 : 0),
        total: sessionStats.total + 1,
      };

      const duration = Math.round((Date.now() - startTime.getTime()) / 1000);
      const failedWords = [
        ...sessionAnswers,
        {
          wordId: words[currentIndex].id,
          word: words[currentIndex].word,
          translation: words[currentIndex].translation,
          isCorrect: lastAnswerCorrect,
        },
      ]
        .filter((a) => !a.isCorrect)
        .map((a) => a.wordId);

      const correctWords = [
        ...sessionAnswers,
        {
          wordId: words[currentIndex].id,
          word: words[currentIndex].word,
          translation: words[currentIndex].translation,
          isCorrect: lastAnswerCorrect,
        },
      ]
        .filter((a) => a.isCorrect)
        .map((a) => a.wordId);

      await TrackingService.saveSession(
        user.uid,
        "flashcards",
        finalStats.correct,
        finalStats.total,
        duration,
        failedWords,
        correctWords,
        difficultyFilter !== "all" ? difficultyFilter : "mixed"
      );
    } catch (error) {
      console.error("Error saving session:", error);
    }

    // Show completion message
    const finalStats = {
      correct: sessionStats.correct + (lastAnswerCorrect ? 1 : 0),
      total: sessionStats.total + 1,
    };
    const percentage = Math.round(
      (finalStats.correct / finalStats.total) * 100
    );
    alert(
      `Session completed! You got ${finalStats.correct} out of ${finalStats.total} correct (${percentage}%).`
    );
    navigate("/dashboard");
  };

  const resetSession = () => {
    setCurrentIndex(0);
    setShowTranslation(false);
    setIsFlipping(false);
    setSessionStats({ correct: 0, total: 0 });
    setStartTime(new Date());
    setSessionAnswers([]);
    // Reset drag states
    setIsDragging(false);
    setDragOffset(0);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  // If no words and no URL parameters, redirect to flashcard settings
  if (words.length === 0 && !searchParams.toString() && !loading) {
    navigate("/flashcard-settings");
    return null;
  }

  if (words.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-lg font-medium text-gray-900">
          No words available
        </h3>
        <p className="text-gray-500 mb-4">
          Add some words to start practicing with flashcards.
        </p>
        <button
          onClick={() => navigate("/words/add")}
          className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
        >
          Add Words
        </button>
      </div>
    );
  }

  const currentWord = words[currentIndex];
  const progress = ((currentIndex + 1) / words.length) * 100;

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Flashcards
        </h1>
        <p className="text-lg text-gray-600">
          Study with interactive flashcards and improve your vocabulary!
        </p>
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <button
          onClick={() => navigate("/dashboard")}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Dashboard
        </button>
        <button
          onClick={resetSession}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <RotateCcw className="h-4 w-4 mr-2" />
          Reset Session
        </button>
      </div>

      {/* Swipe indicators */}
      {showTranslation && (
        <div className="flex justify-center mb-4">
          <div className="flex items-center space-x-8 text-sm text-gray-500">
            <div
              className={`flex items-center transition-all duration-200 ${
                isDragging && dragOffset < -50
                  ? "text-red-600 font-bold scale-110"
                  : ""
              }`}
            >
              <XCircle className="h-4 w-4 mr-2 text-red-500" />
              <span>Swipe left for No</span>
            </div>
            <div
              className={`flex items-center transition-all duration-200 ${
                isDragging && dragOffset > 50
                  ? "text-green-600 font-bold scale-110"
                  : ""
              }`}
            >
              <Heart className="h-4 w-4 mr-2 text-green-500" />
              <span>Swipe right for Yes</span>
            </div>
          </div>
        </div>
      )}

      {/* Flashcard */}
      <div className="flex justify-center">
        <div className="relative w-full max-w-2xl h-[500px] perspective-1000">
          {/* Drag feedback overlay */}
          {isDragging && showTranslation && (
            <div className="absolute inset-0 pointer-events-none z-50 flex items-center justify-center">
              {dragOffset > 50 && (
                <div className="bg-green-500/20 backdrop-blur-sm rounded-2xl p-8 border-2 border-green-500">
                  <Heart className="h-16 w-16 text-green-500 mx-auto mb-2" />
                  <p className="text-green-600 font-bold text-xl">YES!</p>
                </div>
              )}
              {dragOffset < -50 && (
                <div className="bg-red-500/20 backdrop-blur-sm rounded-2xl p-8 border-2 border-red-500">
                  <XCircle className="h-16 w-16 text-red-500 mx-auto mb-2" />
                  <p className="text-red-600 font-bold text-xl">NO!</p>
                </div>
              )}
            </div>
          )}
          <div
            className={`relative w-full h-full transition-transform duration-600 transform-style-preserve-3d ${
              showTranslation ? "rotate-y-180" : ""
            } ${isFlipping ? "animate-pulse" : ""} ${
              isDragging ? "cursor-grabbing" : "cursor-grab"
            }`}
            style={{
              transformStyle: "preserve-3d",
              transition: isDragging ? "none" : "transform 0.6s ease-in-out",
              transform: showTranslation
                ? `rotateY(180deg) translateX(${dragOffset}px) rotateZ(${
                    dragOffset * 0.1
                  }deg)`
                : `rotateY(0deg) translateX(${dragOffset}px) rotateZ(${
                    dragOffset * 0.1
                  }deg)`,
              opacity: isDragging ? 0.9 : 1,
              filter: isDragging
                ? dragOffset > 50
                  ? "hue-rotate(120deg) saturate(1.2)" // Green tint for right swipe
                  : dragOffset < -50
                  ? "hue-rotate(-60deg) saturate(1.2)" // Red tint for left swipe
                  : "none"
                : "none",
            }}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            onMouseLeave={handleMouseUp}
            onTouchStart={handleDragStart}
            onTouchMove={handleDragMove}
            onTouchEnd={handleDragEnd}
          >
            {/* Front of card (word) */}
            <div
              className="absolute inset-0 w-full h-full backface-hidden"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
              }}
            >
              <div className="bg-gradient-to-br from-blue-50 to-purple-50 rounded-3xl shadow-2xl border border-gray-200 p-8 h-full flex flex-col">
                {/* Progress info at top */}
                <div className="flex items-center justify-between mb-6">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Target className="h-4 w-4 text-blue-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {currentIndex + 1} of {words.length}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {sessionStats.correct}/{sessionStats.total}
                      </span>
                    </div>
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Main content */}
                <div className="flex-1 flex flex-col justify-center items-center text-center space-y-6">
                  <div className="mb-6">
                    <h2 className="text-5xl font-bold text-gray-900 mb-4">
                      {currentWord.word}
                    </h2>
                    {currentWord.type && (
                      <span className="inline-flex items-center px-4 py-2 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-purple-100 text-blue-800 border border-blue-200">
                        {currentWord.type}
                      </span>
                    )}
                  </div>

                  <button
                    onClick={handleFlipCard}
                    disabled={isFlipping}
                    className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold rounded-2xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
                  >
                    <Eye className="h-6 w-6 mr-3" />
                    Show Translation
                    <RotateCw className="h-5 w-5 ml-3" />
                  </button>
                </div>
              </div>
            </div>

            {/* Back of card (translation) */}
            <div
              className="absolute inset-0 w-full h-full backface-hidden rotate-y-180"
              style={{
                backfaceVisibility: "hidden",
                WebkitBackfaceVisibility: "hidden",
                transform: "rotateY(180deg)",
              }}
            >
              <div className="bg-gradient-to-br from-green-50 to-blue-50 rounded-3xl shadow-2xl border border-gray-200 p-8 h-full flex flex-col overflow-hidden">
                {/* Progress info at top */}
                <div className="flex items-center justify-between mb-6 flex-shrink-0">
                  <div className="flex items-center space-x-4">
                    <div className="flex items-center">
                      <Target className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {currentIndex + 1} of {words.length}
                      </span>
                    </div>
                    <div className="flex items-center">
                      <TrendingUp className="h-4 w-4 text-green-600 mr-2" />
                      <span className="text-sm font-medium text-gray-700">
                        {sessionStats.correct}/{sessionStats.total}
                      </span>
                    </div>
                  </div>
                  <div className="w-24 bg-gray-200 rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-green-500 to-blue-600 h-2 rounded-full transition-all duration-500 ease-out"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </div>

                {/* Main content with scroll */}
                <div className="flex-1 flex flex-col text-center space-y-4 overflow-y-auto">
                  <div className="flex-shrink-0">
                    <h2 className="text-4xl font-bold text-gray-900 mb-4">
                      {currentWord.translation}
                    </h2>
                    <div className="text-lg text-gray-600 italic">
                      Translation of "{currentWord.word}"
                    </div>
                  </div>

                  {/* Example sentences */}
                  {currentExamples.length > 0 && (
                    <div className="bg-white/80 backdrop-blur-sm border border-gray-200 rounded-2xl p-4 flex-shrink-0">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className="text-base font-semibold text-gray-900 flex items-center">
                          <BookOpen className="h-4 w-4 mr-2 text-blue-500" />
                          Example Sentences
                        </h3>
                        {currentExamples.length > 1 && (
                          <span className="text-xs text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
                            {currentExampleIndex + 1} of{" "}
                            {currentExamples.length}
                          </span>
                        )}
                      </div>

                      {loadingExamples ? (
                        <div className="flex items-center justify-center py-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                        </div>
                      ) : (
                        <div className="space-y-3">
                          <div className="text-base text-gray-800 font-medium bg-blue-50 p-3 rounded-lg">
                            "{currentExamples[currentExampleIndex]?.sentence}"
                          </div>
                          {currentExamples[currentExampleIndex]
                            ?.translation && (
                            <div className="text-gray-600 italic bg-gray-50 p-3 rounded-lg">
                              "
                              {currentExamples[currentExampleIndex].translation}
                              "
                            </div>
                          )}

                          {currentExamples.length > 1 && (
                            <div className="flex justify-center space-x-2">
                              <button
                                onClick={prevExample}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors bg-white rounded-full shadow-sm"
                                title="Previous example"
                              >
                                <ChevronLeft className="h-4 w-4" />
                              </button>
                              <button
                                onClick={nextExample}
                                className="p-1 text-gray-400 hover:text-blue-600 transition-colors bg-white rounded-full shadow-sm"
                                title="Next example"
                              >
                                <ChevronRight className="h-4 w-4" />
                              </button>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="flex justify-center space-x-4 pt-2 flex-shrink-0">
                    <button
                      onClick={() => {
                        console.log("No button clicked");
                        handleAnswer(false);
                      }}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 relative z-20"
                    >
                      <XCircle className="w-5 h-5 mr-2" />
                      No
                    </button>
                    <button
                      onClick={() => {
                        console.log("Yes button clicked");
                        handleAnswer(true);
                      }}
                      className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-green-600 hover:from-green-600 hover:to-green-700 text-white font-bold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 relative z-20"
                    >
                      <Heart className="w-5 h-5 mr-2" />
                      Yes
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
