import { Check, Trophy, Target, Clock, TrendingUp, RotateCcw, History } from "lucide-react";

interface GameResultsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlayAgain: () => void;
  onHistory: () => void;
  stats: {
    correct: number;
    total: number;
    percentage: number;
    duration: number;
  };
  gameType: "quiz" | "flashcards";
}

export function GameResultsModal({
  isOpen,
  onClose,
  onPlayAgain,
  onHistory,
  stats,
  gameType,
}: GameResultsModalProps) {
  if (!isOpen) return null;

  const getPerformanceMessage = (percentage: number) => {
    if (percentage >= 90) return { text: "Outstanding!", color: "text-green-600" };
    if (percentage >= 80) return { text: "Excellent!", color: "text-green-600" };
    if (percentage >= 70) return { text: "Good job!", color: "text-blue-600" };
    if (percentage >= 60) return { text: "Not bad!", color: "text-yellow-600" };
    return { text: "Keep practicing!", color: "text-red-600" };
  };

  const performance = getPerformanceMessage(stats.percentage);
  const incorrect = stats.total - stats.correct;
  const durationMinutes = Math.floor(stats.duration / 60);
  const durationSeconds = stats.duration % 60;

  return (
    <div className="fixed inset-0 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full overflow-hidden">
        {/* Header with gradient background */}
        <div className="bg-gradient-to-r from-blue-500 to-purple-600 p-6 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-black/10"></div>
          <div className="relative z-10">
            <div className="mx-auto w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center mb-4">
              <Trophy className="h-8 w-8 text-yellow-400" />
            </div>
            <h2 className="text-2xl font-bold text-white mb-2">Game Complete!</h2>
            <p className="text-white/90 text-sm">
              {gameType === "quiz" ? "Quiz finished" : "Flashcard session finished"}
            </p>
          </div>
        </div>

        {/* Performance message */}
        <div className="p-6 text-center border-b border-gray-100">
          <div className="flex items-center justify-center mb-2">
            <Target className="h-5 w-5 text-green-600 mr-2" />
            <span className={`font-semibold ${performance.color}`}>
              {performance.text}
            </span>
          </div>
          <p className="text-gray-600 text-sm">
            You scored {stats.correct} out of {stats.total} questions
          </p>
        </div>

        {/* Game Statistics */}
        <div className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Game Statistics</h3>
          
          <div className="grid grid-cols-2 gap-4 mb-6">
            {/* Accuracy */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
              <Target className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-green-600 text-sm font-medium mb-1">Accuracy</div>
              <div className="text-2xl font-bold text-gray-900">{stats.percentage}%</div>
            </div>

            {/* Duration */}
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-xl p-4 text-center">
              <Clock className="h-6 w-6 text-blue-600 mx-auto mb-2" />
              <div className="text-blue-600 text-sm font-medium mb-1">Duration</div>
              <div className="text-2xl font-bold text-gray-900">
                {durationMinutes}m {durationSeconds}s
              </div>
            </div>

            {/* Correct */}
            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-4 text-center">
              <Check className="h-6 w-6 text-green-600 mx-auto mb-2" />
              <div className="text-green-600 text-sm font-medium mb-1">Correct</div>
              <div className="text-2xl font-bold text-gray-900">{stats.correct}</div>
            </div>

            {/* Incorrect */}
            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-xl p-4 text-center">
              <TrendingUp className="h-6 w-6 text-red-600 mx-auto mb-2" />
              <div className="text-red-600 text-sm font-medium mb-1">Incorrect</div>
              <div className="text-2xl font-bold text-gray-900">{incorrect}</div>
            </div>
          </div>

          {/* Overall Progress */}
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <span className="text-sm font-medium text-gray-700">Overall Progress</span>
              <span className="text-sm font-bold text-gray-900">{stats.percentage}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className="bg-gradient-to-r from-blue-500 to-purple-600 h-3 rounded-full transition-all duration-500"
                style={{ width: `${stats.percentage}%` }}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex space-x-3">
            <button
              onClick={onPlayAgain}
              className="flex-1 bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center"
            >
              <RotateCcw className="h-4 w-4 mr-2" />
              Play Again
            </button>
            <button
              onClick={onHistory}
              className="flex-1 bg-white border-2 border-gray-300 hover:border-gray-400 text-gray-700 font-semibold py-3 px-4 rounded-xl transition-all duration-200 flex items-center justify-center"
            >
              <History className="h-4 w-4 mr-2" />
              History
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
