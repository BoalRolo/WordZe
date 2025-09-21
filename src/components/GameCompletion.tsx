import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
  Trophy,
  Target,
  Clock,
  TrendingUp,
  RotateCcw,
  Home,
  Star,
  CheckCircle,
  XCircle,
  Award,
} from "lucide-react";

interface GameCompletionProps {
  isVisible: boolean;
  gameType: "quiz" | "flashcards";
  stats: {
    score: number;
    total: number;
    correctAnswers: number;
    wrongAnswers: number;
    duration: number; // in seconds
    accuracy: number; // percentage
  };
  onPlayAgain: () => void;
  onGoHome: () => void;
}

export function GameCompletion({
  isVisible,
  gameType,
  stats,
  onPlayAgain,
  onGoHome,
}: GameCompletionProps) {
  const navigate = useNavigate();
  const [animationPhase, setAnimationPhase] = useState<
    "hidden" | "entering" | "visible" | "exiting"
  >("hidden");
  const [showStats, setShowStats] = useState(false);

  useEffect(() => {
    if (isVisible) {
      setAnimationPhase("entering");
      // Start the entrance animation
      setTimeout(() => {
        setAnimationPhase("visible");
        // Show stats after a short delay
        setTimeout(() => {
          setShowStats(true);
        }, 500);
      }, 100);
    } else {
      setAnimationPhase("exiting");
      setTimeout(() => {
        setAnimationPhase("hidden");
        setShowStats(false);
      }, 300);
    }
  }, [isVisible]);

  if (animationPhase === "hidden") return null;

  const getPerformanceMessage = () => {
    const accuracy = stats.accuracy;
    if (accuracy >= 90)
      return {
        message: "Outstanding!",
        color: "text-yellow-600",
        icon: Trophy,
      };
    if (accuracy >= 80)
      return { message: "Excellent!", color: "text-green-600", icon: Star };
    if (accuracy >= 70)
      return {
        message: "Good job!",
        color: "text-blue-600",
        icon: CheckCircle,
      };
    if (accuracy >= 60)
      return { message: "Not bad!", color: "text-orange-600", icon: Target };
    return {
      message: "Keep practicing!",
      color: "text-red-600",
      icon: TrendingUp,
    };
  };

  const performance = getPerformanceMessage();
  const PerformanceIcon = performance.icon;

  const formatDuration = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return minutes > 0
      ? `${minutes}m ${remainingSeconds}s`
      : `${remainingSeconds}s`;
  };

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center transition-all duration-500 ${
        animationPhase === "entering"
          ? "bg-transparent"
          : animationPhase === "visible"
          ? "bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50"
          : "bg-transparent"
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 backdrop-blur-sm"
        onClick={onGoHome}
      />

      {/* Main Content */}
      <div
        className={`relative bg-white/95 backdrop-blur-md rounded-3xl shadow-2xl border border-white/20 max-w-2xl w-full mx-4 transform transition-all duration-500 ${
          animationPhase === "entering"
            ? "scale-50 opacity-0 translate-y-8"
            : animationPhase === "visible"
            ? "scale-100 opacity-100 translate-y-0"
            : "scale-50 opacity-0 translate-y-8"
        }`}
      >
        {/* Header with Trophy Animation */}
        <div className="relative bg-gradient-to-r from-blue-500 to-purple-600 rounded-t-3xl p-8 text-center overflow-hidden">
          {/* Confetti Animation */}
          <div className="absolute inset-0 overflow-hidden">
            {[...Array(12)].map((_, i) => (
              <div
                key={i}
                className={`absolute w-2 h-2 bg-yellow-400 rounded-full animate-pulse ${
                  showStats ? "opacity-100" : "opacity-0"
                }`}
                style={{
                  left: `${25 + Math.random() * 50}%`,
                  top: `${25 + Math.random() * 50}%`,
                  animationDelay: `${Math.random() * 2}s`,
                  animationDuration: `${1.5 + Math.random() * 1}s`,
                }}
              />
            ))}
          </div>

          <div
            className={`transform transition-all duration-700 ${
              showStats ? "scale-100 rotate-0" : "scale-75 rotate-12"
            }`}
          >
            <Trophy className="h-20 w-20 text-yellow-300 mx-auto mb-4 drop-shadow-lg" />
          </div>

          <h1 className="text-3xl font-bold text-white mb-2">Game Complete!</h1>
          <p className="text-blue-100">
            {gameType === "quiz" ? "Quiz" : "Flashcards"} finished
          </p>
        </div>

        {/* Performance Message */}
        <div className="p-6 text-center border-b border-gray-200">
          <div
            className={`inline-flex items-center space-x-2 text-2xl font-bold ${performance.color} mb-2`}
          >
            <PerformanceIcon className="h-8 w-8" />
            <span>{performance.message}</span>
          </div>
          <p className="text-gray-600">
            You scored {stats.score} out of {stats.total} questions
          </p>
        </div>

        {/* Statistics */}
        <div
          className={`p-6 transition-all duration-700 ${
            showStats ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <h3 className="text-xl font-bold text-gray-900 mb-6 text-center">
            Game Statistics
          </h3>

          <div className="grid grid-cols-2 gap-6 mb-8">
            {/* Accuracy */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 text-center border border-green-200">
              <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Target className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-green-600 mb-1">
                Accuracy
              </p>
              <p className="text-2xl font-bold text-green-900">
                {stats.accuracy}%
              </p>
            </div>

            {/* Duration */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 text-center border border-blue-200">
              <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <Clock className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-blue-600 mb-1">Duration</p>
              <p className="text-2xl font-bold text-blue-900">
                {formatDuration(stats.duration)}
              </p>
            </div>

            {/* Correct Answers */}
            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-6 text-center border border-emerald-200">
              <div className="w-12 h-12 bg-emerald-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <CheckCircle className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-emerald-600 mb-1">
                Correct
              </p>
              <p className="text-2xl font-bold text-emerald-900">
                {stats.correctAnswers}
              </p>
            </div>

            {/* Wrong Answers */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 text-center border border-red-200">
              <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center mx-auto mb-3">
                <XCircle className="h-6 w-6 text-white" />
              </div>
              <p className="text-sm font-medium text-red-600 mb-1">Incorrect</p>
              <p className="text-2xl font-bold text-red-900">
                {stats.wrongAnswers}
              </p>
            </div>
          </div>

          {/* Progress Bar */}
          <div className="mb-8">
            <div className="flex justify-between items-center mb-2">
              <span className="text-sm font-medium text-gray-700">
                Overall Progress
              </span>
              <span className="text-sm font-bold text-gray-900">
                {stats.accuracy}%
              </span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-1000 ease-out"
                style={{ width: `${stats.accuracy}%` }}
              />
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div
          className={`p-6 bg-gray-50 rounded-b-3xl transition-all duration-700 ${
            showStats ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
          }`}
        >
          <div className="flex flex-col sm:flex-row gap-4">
            <button
              onClick={onPlayAgain}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl hover:from-blue-600 hover:to-purple-700 transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <RotateCcw className="h-5 w-5" />
              <span>Play Again</span>
            </button>

            <button
              onClick={onGoHome}
              className="flex-1 bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 px-6 rounded-xl hover:bg-gray-50 hover:border-gray-400 transform hover:scale-105 transition-all duration-200 flex items-center justify-center space-x-2"
            >
              <Home className="h-5 w-5" />
              <span>Go Home</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
