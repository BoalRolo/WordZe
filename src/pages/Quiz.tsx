import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { WordsService } from "@/services/words";
import { TrackingService } from "@/services/tracking";
import { QuizService } from "@/services/quiz";
import { DifficultyService } from "@/services/difficulty";
import { ExamplesService } from "@/services/examples";
import { WordDoc, Difficulty, QuizItem, ExampleSentence } from "@/types/models";
import { GameCompletion } from "@/components/GameCompletion";
import {
  formatWordForDisplay,
  formatTranslationForDisplay,
} from "@/utils/formatting";
import {
  RotateCcw,
  ArrowLeft,
  CheckCircle,
  XCircle,
  ChevronLeft,
  ChevronRight,
  BookOpen,
  Clock,
  Play,
  Settings,
} from "lucide-react";

export function Quiz() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Get settings from URL parameters
  const quizSize = parseInt(searchParams.get("size") || "10");
  const difficultyFilter =
    (searchParams.get("difficulty") as Difficulty | "all") || "all";
  const showFailedOnly = searchParams.get("failedOnly") === "true";
  const timePerQuestion = parseInt(searchParams.get("timePerQuestion") || "30");
  const [words, setWords] = useState<(WordDoc & { id: string })[]>([]);
  const [quizItems, setQuizItems] = useState<QuizItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [loading, setLoading] = useState(true);
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
  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const [timerActive, setTimerActive] = useState(false);
  const [quizTimer, setQuizTimer] = useState<number | null>(null); // Timer for entire quiz
  const [showCompletion, setShowCompletion] = useState(false);
  const [completionStats, setCompletionStats] = useState({
    score: 0,
    total: 0,
    correctAnswers: 0,
    wrongAnswers: 0,
    duration: 0,
    accuracy: 0,
  });

  useEffect(() => {
    if (user) {
      loadWords();
    }
  }, [user]);

  // Initialize quiz when words are loaded and we have URL parameters
  useEffect(() => {
    if (words.length > 0 && searchParams.toString() && quizItems.length === 0) {
      const availableWords = words.length;
      const actualQuizSize = Math.min(quizSize, availableWords);
      const generatedQuizItems = QuizService.generateQuizItems(
        words,
        actualQuizSize
      );

      setQuizItems(generatedQuizItems);
      setCurrentIndex(0);
      setSelectedAnswer(null);
      setShowResult(false);
      setSessionStats({ correct: 0, total: 0 });
      setStartTime(new Date());
      setSessionAnswers([]);
    }
  }, [words, searchParams, quizSize, quizItems.length]);

  // Timer effect - starts automatically for each question
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (quizItems.length > 0 && !showResult && !loading) {
      // Start timer for current question
      setTimeLeft(timePerQuestion);
      setTimerActive(true);

      interval = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev && prev <= 1) {
            setTimerActive(false);
            // Auto-submit when time runs out - mark as failed
            if (quizItems.length > 0 && currentIndex < quizItems.length) {
              handleAnswer(""); // Empty answer means time ran out
            }
            return 0;
          }
          return prev ? prev - 1 : 0;
        });
      }, 1000);
    }
    return () => {
      if (interval) clearInterval(interval);
    };
  }, [currentIndex, quizItems.length, showResult, loading, timePerQuestion]);

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

  const handleAnswer = async (answer: string) => {
    if (showResult || !user) return;

    setSelectedAnswer(answer);
    setShowResult(true);
    setTimerActive(false); // Stop timer when answer is submitted

    // If answer is empty, it means time ran out - mark as incorrect
    const isCorrect = answer
      ? QuizService.validateAnswer(quizItems[currentIndex], answer)
      : false;

    // Find the word ID for tracking
    const currentWord = words.find(
      (w) => w.word === quizItems[currentIndex].word
    );

    // Load examples for the current word when showing results
    if (currentWord) {
      loadExamples(currentWord.id);
      try {
        await TrackingService.recordAnswer(user.uid, currentWord.id, isCorrect);
      } catch (error) {
        console.error("Error recording answer:", error);
      }

      // Track the answer for session history
      setSessionAnswers((prev) => [
        ...prev,
        {
          wordId: currentWord.id,
          word: quizItems[currentIndex].word,
          translation: quizItems[currentIndex].translation,
          isCorrect,
        },
      ]);
    }

    setSessionStats((prev) => ({
      correct: prev.correct + (isCorrect ? 1 : 0),
      total: prev.total + 1,
    }));
  };

  const nextQuestion = () => {
    if (currentIndex + 1 < quizItems.length) {
      setCurrentIndex((prev) => prev + 1);
      setSelectedAnswer(null);
      setShowResult(false);
    } else {
      // Quiz completed
      finishQuiz();
    }
  };

  const finishQuiz = async () => {
    if (!user || !startTime) return;

    try {
      const duration = Math.round((Date.now() - startTime.getTime()) / 1000);
      const failedWords = sessionAnswers
        .filter((a) => !a.isCorrect)
        .map((a) => a.wordId);
      const correctWords = sessionAnswers
        .filter((a) => a.isCorrect)
        .map((a) => a.wordId);

      await TrackingService.saveSession(
        user.uid,
        "quiz",
        sessionStats.correct,
        sessionStats.total,
        duration,
        failedWords,
        correctWords,
        difficultyFilter !== "all" ? difficultyFilter : "mixed"
      );
    } catch (error) {
      console.error("Error saving session:", error);
    }

    // Calculate completion stats
    const percentage = Math.round(
      (sessionStats.correct / sessionStats.total) * 100
    );
    const duration = startTime
      ? Math.floor((Date.now() - startTime.getTime()) / 1000)
      : 0;

    setCompletionStats({
      score: sessionStats.correct,
      total: sessionStats.total,
      correctAnswers: sessionStats.correct,
      wrongAnswers: sessionStats.total - sessionStats.correct,
      duration: duration,
      accuracy: percentage,
    });

    setShowCompletion(true);
  };

  const resetQuiz = () => {
    setQuizItems([]);
    setCurrentIndex(0);
    setSelectedAnswer(null);
    setShowResult(false);
    setSessionStats({ correct: 0, total: 0 });
    setShowCompletion(false);
    setStartTime(null);
    setQuizTimer(null);
    setTimerActive(false);
    setTimeLeft(null);
  };

  const handlePlayAgain = () => {
    setShowCompletion(false);
    resetQuiz();
    // Reload words and start new quiz
    if (user) {
      loadWords();
    }
  };

  const handleGoHome = () => {
    setShowCompletion(false);
    navigate("/dashboard");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (words.length === 0) {
    return (
      <div className="text-center py-12">
        <div className="text-6xl mb-4">📚</div>
        <h3 className="text-lg font-medium text-gray-900">
          No words available
        </h3>
        <p className="text-gray-500 mb-4">
          Add some words to start taking quizzes.
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

  // If no quiz items and no URL parameters, redirect to quiz settings
  if (quizItems.length === 0 && !searchParams.toString() && !loading) {
    navigate("/quiz-settings");
    return null;
  }

  // Show loading while initializing
  if (loading || (quizItems.length === 0 && searchParams.toString())) {
    return (
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        </div>
      </div>
    );
  }

  const currentItem = quizItems[currentIndex];
  const progress = ((currentIndex + 1) / quizItems.length) * 100;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <button
            onClick={() => navigate("/dashboard")}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </button>
          <button
            onClick={resetQuiz}
            className="inline-flex items-center text-gray-600 hover:text-gray-900"
          >
            <RotateCcw className="w-4 h-4 mr-2" />
            Reset
          </button>
        </div>

        <div className="flex items-center justify-between text-sm text-gray-600 mb-2">
          <span>
            Question {currentIndex + 1} of {quizItems.length}
          </span>
          <div className="flex items-center space-x-4">
            <span>
              Score: {sessionStats.correct}/{sessionStats.total}
            </span>
            {timeLeft !== null && (
              <div className="flex items-center space-x-2">
                <Clock className="h-4 w-4" />
                <span
                  className={`font-bold ${
                    timeLeft <= 10 ? "text-red-600" : "text-gray-600"
                  }`}
                >
                  {timeLeft}s
                </span>
              </div>
            )}
          </div>
        </div>

        {/* Timer Display */}
        {timeLeft !== null && !showResult && (
          <div className="flex justify-center mb-4">
            <div
              className={`px-4 py-2 rounded-full font-bold text-lg ${
                timeLeft <= 10
                  ? "bg-red-500 text-white animate-pulse"
                  : timeLeft <= 20
                  ? "bg-orange-500 text-white"
                  : "bg-blue-500 text-white"
              }`}
            >
              <Clock className="h-5 w-5 inline mr-2" />
              {timeLeft}s
            </div>
          </div>
        )}

        <div className="w-full bg-gray-200 rounded-full h-2">
          <div
            className="bg-blue-600 h-2 rounded-full transition-all duration-300"
            style={{ width: `${progress}%` }}
          ></div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-lg p-8">
        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-900 mb-4">
            {formatWordForDisplay(currentItem.word)}
          </h2>
          <p className="text-lg text-gray-600">
            What is the correct translation?
          </p>
        </div>

        <div className="space-y-3">
          {currentItem.options.map((option, index) => {
            const isSelected = selectedAnswer === option;
            const isCorrect = option === currentItem.correctAnswer;
            const isWrong = isSelected && !isCorrect;

            let buttonClass =
              "w-full text-left px-4 py-3 rounded-lg border-2 transition-all duration-200 ";

            if (showResult) {
              if (isCorrect) {
                buttonClass += "border-green-500 bg-green-50 text-green-900";
              } else if (isWrong) {
                buttonClass += "border-red-500 bg-red-50 text-red-900";
              } else {
                buttonClass += "border-gray-200 bg-gray-50 text-gray-500";
              }
            } else {
              buttonClass += isSelected
                ? "border-blue-500 bg-blue-50 text-blue-900"
                : "border-gray-200 bg-white text-gray-900 hover:border-gray-300";
            }

            return (
              <button
                key={index}
                onClick={() => handleAnswer(option)}
                disabled={showResult}
                className={buttonClass}
              >
                <div className="flex items-center justify-between">
                  <span className="text-lg">{formatTranslationForDisplay(option)}</span>
                  {showResult && isCorrect && (
                    <CheckCircle className="w-5 h-5 text-green-600" />
                  )}
                  {showResult && isWrong && (
                    <XCircle className="w-5 h-5 text-red-600" />
                  )}
                </div>
              </button>
            );
          })}
        </div>

        {showResult && (
          <div className="mt-8 space-y-6">
            <div className="text-center">
              {selectedAnswer === currentItem.correctAnswer ? (
                <div className="text-green-600 text-lg font-medium">
                  ✓ Correct! Well done!
                </div>
              ) : (
                <div className="text-red-600 text-lg font-medium">
                  ✗ Incorrect. The correct answer is:{" "}
                  {currentItem.correctAnswer}
                </div>
              )}
            </div>

            {/* Example sentences with pagination */}
            {currentExamples.length > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                    <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
                    Example Sentences
                  </h3>
                  {currentExamples.length > 1 && (
                    <span className="text-sm text-gray-500">
                      {currentExampleIndex + 1} of {currentExamples.length}
                    </span>
                  )}
                </div>

                {loadingExamples ? (
                  <div className="flex items-center justify-center py-4">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    <div className="text-lg text-gray-800 font-medium">
                      "{currentExamples[currentExampleIndex]?.sentence}"
                    </div>
                    {currentExamples[currentExampleIndex]?.translation && (
                      <div className="text-gray-600 italic">
                        "{currentExamples[currentExampleIndex].translation}"
                      </div>
                    )}

                    {currentExamples.length > 1 && (
                      <div className="flex justify-center space-x-2">
                        <button
                          onClick={prevExample}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Previous example"
                        >
                          <ChevronLeft className="h-5 w-5" />
                        </button>
                        <button
                          onClick={nextExample}
                          className="p-2 text-gray-400 hover:text-blue-600 transition-colors"
                          title="Next example"
                        >
                          <ChevronRight className="h-5 w-5" />
                        </button>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            <div className="text-center">
              <button
                onClick={nextQuestion}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transform hover:scale-105 transition-all duration-200"
              >
                {currentIndex + 1 < quizItems.length
                  ? "Next Question"
                  : "Finish Quiz"}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Game Completion Animation */}
      <GameCompletion
        isVisible={showCompletion}
        gameType="quiz"
        stats={completionStats}
        onPlayAgain={handlePlayAgain}
        onGoHome={handleGoHome}
      />
    </div>
  );
}
