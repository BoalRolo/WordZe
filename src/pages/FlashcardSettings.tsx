import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { WordsService } from "@/services/words";
import {
  ArrowLeft,
  BookOpen,
  Target,
  Filter,
  Play,
  Settings,
} from "lucide-react";

export function FlashcardSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Flashcard settings
  const [cardCount, setCardCount] = useState(10);
  const [difficultyFilter, setDifficultyFilter] = useState<
    "all" | "easy" | "medium" | "hard"
  >("all");
  const [showFailedOnly, setShowFailedOnly] = useState(false);

  const handleStartFlashcards = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      // Get user's words to check if they have enough for the flashcards
      const words = await WordsService.getWords(user.uid);

      if (words.length === 0) {
        setError("You need to add some words before studying with flashcards!");
        setLoading(false);
        return;
      }

      // Navigate to flashcards with settings as URL parameters
      const params = new URLSearchParams({
        count: cardCount.toString(),
        difficulty: difficultyFilter,
        failedOnly: showFailedOnly.toString(),
      });

      navigate(`/flashcards?${params.toString()}`);
    } catch (err: any) {
      setError(err.message || "Failed to start flashcards");
      setLoading(false);
    }
  };

  const cardCounts = [5, 10, 15, 20, 25, 30, 50];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-purple-500 to-blue-600 rounded-2xl">
            <Settings className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent mb-2">
          Flashcard Settings
        </h1>
        <p className="text-lg text-gray-600">
          Configure your flashcard study session and improve your vocabulary!
        </p>
      </div>

      {/* Back Button */}
      <div className="flex items-center">
        <button
          onClick={() => navigate("/games")}
          className="flex items-center text-gray-600 hover:text-gray-800 transition-colors"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Games
        </button>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600 text-center">{error}</p>
        </div>
      )}

      {/* Settings Card */}
      <div className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8">
        <div className="space-y-6">
          {/* Card Count */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Target className="h-4 w-4 inline mr-2" />
              Number of Cards
            </label>
            <select
              value={cardCount}
              onChange={(e) => setCardCount(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            >
              {cardCounts.map((count) => (
                <option key={count} value={count}>
                  {count} cards
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Filter className="h-4 w-4 inline mr-2" />
              Difficulty Filter
            </label>
            <select
              value={difficultyFilter}
              onChange={(e) => setDifficultyFilter(e.target.value as any)}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-colors"
            >
              <option value="all">All difficulties</option>
              <option value="easy">Easy only</option>
              <option value="medium">Medium only</option>
              <option value="hard">Hard only</option>
            </select>
          </div>

          {/* Failed Words Only */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="failedOnly"
              checked={showFailedOnly}
              onChange={(e) => setShowFailedOnly(e.target.checked)}
              className="w-5 h-5 text-purple-600 border-gray-300 rounded focus:ring-purple-500"
            />
            <label
              htmlFor="failedOnly"
              className="text-sm font-medium text-gray-700"
            >
              Only include words I've failed before
            </label>
          </div>

          {/* Start Flashcards Button */}
          <button
            onClick={handleStartFlashcards}
            disabled={loading}
            className="w-full bg-gradient-to-r from-purple-500 to-blue-600 hover:from-purple-600 hover:to-blue-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Play className="h-5 w-5" />
                <span>Start Flashcards</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-purple-50 to-blue-50 rounded-2xl p-6 border border-purple-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Study Tips</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-purple-500 mr-2">•</span>
            Take your time to think about each word before flipping
          </li>
          <li className="flex items-start">
            <span className="text-purple-500 mr-2">•</span>
            Focus on words you find challenging
          </li>
          <li className="flex items-start">
            <span className="text-purple-500 mr-2">•</span>
            Review example sentences to understand context
          </li>
          <li className="flex items-start">
            <span className="text-purple-500 mr-2">•</span>
            Be honest about your knowledge for better learning
          </li>
        </ul>
      </div>
    </div>
  );
}
