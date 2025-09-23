import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { WordsService } from "@/services/words";
import { DifficultyService } from "@/services/difficulty";
import { TrackingService } from "@/services/tracking";
import { WordDoc } from "@/types/models";
import { addSampleWords } from "@/utils/sampleData";
import { BookOpen, Gamepad2, Plus, TrendingUp, Sparkles } from "lucide-react";

export function Dashboard() {
  const { user } = useAuth();
  const [words, setWords] = useState<(WordDoc & { id: string })[]>([]);
  const [loading, setLoading] = useState(true);
  const [addingSamples, setAddingSamples] = useState(false);
  const [stats, setStats] = useState({
    totalWords: 0,
    successRate: 0,
    easyWords: 0,
    mediumWords: 0,
    hardWords: 0,
  });

  useEffect(() => {
    if (user) {
      loadWords();
    }
  }, [user]);

  const loadWords = async () => {
    if (!user) return;

    try {
      const wordsData = await WordsService.getWords(user.uid);
      setWords(wordsData);

      // Calculate stats
      const totalAttempts = wordsData.reduce(
        (sum, word) => sum + word.attempts,
        0
      );
      const totalSuccesses = wordsData.reduce(
        (sum, word) => sum + word.successes,
        0
      );
      const successRate = TrackingService.calculateSuccessRate(
        totalAttempts,
        totalSuccesses
      );

      const difficultyStats = DifficultyService.getDifficultyStats(wordsData);

      setStats({
        totalWords: wordsData.length,
        successRate,
        easyWords: difficultyStats.easy,
        mediumWords: difficultyStats.medium,
        hardWords: difficultyStats.hard,
      });
    } catch (error) {
      console.error("Error loading words:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddSampleWords = async () => {
    if (!user) return;

    setAddingSamples(true);
    try {
      await addSampleWords(user.uid);
      // Reload words to show the new ones
      await loadWords();
    } catch (error) {
      console.error("Error adding sample words:", error);
    } finally {
      setAddingSamples(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      {/* Enhanced Header */}
      <div className="text-center">
        <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Dashboard
        </h1>
        <p className="text-base sm:text-lg text-gray-600 px-2">
          Welcome back,{" "}
          <span className="font-semibold text-gray-800">
            {user?.displayName || user?.email}
          </span>
          ! Ready to learn some new words?
        </p>
      </div>

      {words.length === 0 ? (
        <div className="text-center py-12 sm:py-16">
          <div className="mx-auto w-20 h-20 sm:w-24 sm:h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-4 sm:mb-6">
            <BookOpen className="h-10 w-10 sm:h-12 sm:w-12 text-blue-500" />
          </div>
          <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-2">
            No words yet
          </h3>
          <p className="text-base sm:text-lg text-gray-600 mb-6 sm:mb-8 max-w-md mx-auto px-4">
            Start your vocabulary journey by adding your first word. Every
            expert was once a beginner!
          </p>
          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center px-4">
            <Link
              to="/words/add"
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm sm:text-base"
            >
              <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
              Add your first word
            </Link>

            <button
              onClick={handleAddSampleWords}
              disabled={addingSamples}
              className="inline-flex items-center justify-center px-6 sm:px-8 py-3 sm:py-4 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none text-sm sm:text-base"
            >
              {addingSamples ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              ) : (
                <Sparkles className="w-5 h-5 mr-2" />
              )}
              {addingSamples ? "Adding samples..." : "Add sample words"}
            </button>
          </div>
        </div>
      ) : (
        <>
          {/* Sample Words Button - Always visible when user has words */}
          <div className="text-center mb-8">
            <button
              onClick={handleAddSampleWords}
              disabled={addingSamples}
              className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
            >
              {addingSamples ? (
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2" />
              ) : (
                <Sparkles className="w-5 h-5 mr-2" />
              )}
              {addingSamples
                ? "Adding samples..."
                : "Add sample words for testing"}
            </button>
            <p className="text-sm text-gray-500 mt-2">
              Add 15 advanced English words with examples to test the games
            </p>
          </div>

          {/* Enhanced Stats Cards */}
          <div className="grid grid-cols-2 gap-3 sm:gap-6 lg:grid-cols-4">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-4 sm:p-6 border border-blue-200 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-blue-600 mb-1">
                    Total Words
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-blue-900">
                    {stats.totalWords}
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-blue-500 rounded-xl flex items-center justify-center">
                  <BookOpen className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-4 sm:p-6 border border-green-200 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-green-600 mb-1">
                    Success Rate
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-green-900">
                    {stats.successRate}%
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-green-500 rounded-xl flex items-center justify-center">
                  <TrendingUp className="h-4 w-4 sm:h-6 sm:w-6 text-white" />
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-emerald-50 to-emerald-100 rounded-2xl p-4 sm:p-6 border border-emerald-200 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-emerald-600 mb-1">
                    Easy Words
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-emerald-900">
                    {stats.easyWords}
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-emerald-500 rounded-xl flex items-center justify-center">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-emerald-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>

            <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-4 sm:p-6 border border-red-200 hover:shadow-lg transition-all duration-200">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs sm:text-sm font-medium text-red-600 mb-1">
                    Hard Words
                  </p>
                  <p className="text-xl sm:text-2xl lg:text-3xl font-bold text-red-900">
                    {stats.hardWords}
                  </p>
                </div>
                <div className="w-8 h-8 sm:w-12 sm:h-12 bg-red-500 rounded-xl flex items-center justify-center">
                  <div className="w-4 h-4 sm:w-6 sm:h-6 bg-white rounded-full flex items-center justify-center">
                    <div className="w-2 h-2 sm:w-3 sm:h-3 bg-red-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Enhanced Quick Actions */}
          <div className="bg-gradient-to-r from-white to-gray-50 rounded-2xl shadow-xl border border-gray-200 p-4 sm:p-6 lg:p-8">
            <h3 className="text-xl sm:text-2xl font-bold text-gray-900 mb-6 sm:mb-8 text-center">
              Quick Actions
            </h3>
            <div className="grid grid-cols-1 gap-4 sm:gap-6 sm:grid-cols-2">
              <Link
                to="/games"
                className="group relative bg-gradient-to-br from-blue-50 to-purple-100 p-6 sm:p-8 rounded-2xl border border-blue-200 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-200">
                    <Gamepad2 className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    Games
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Choose between flashcards and quiz modes to practice and
                    test your vocabulary
                  </p>
                </div>
              </Link>

              <Link
                to="/words/add"
                className="group relative bg-gradient-to-br from-purple-50 to-purple-100 p-6 sm:p-8 rounded-2xl border border-purple-200 hover:shadow-xl hover:scale-105 transition-all duration-300"
              >
                <div className="text-center">
                  <div className="w-12 h-12 sm:w-16 sm:h-16 bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl flex items-center justify-center mx-auto mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-200">
                    <Plus className="h-6 w-6 sm:h-8 sm:w-8 text-white" />
                  </div>
                  <h3 className="text-lg sm:text-xl font-bold text-gray-900 mb-2">
                    Add Word
                  </h3>
                  <p className="text-sm sm:text-base text-gray-600">
                    Expand your vocabulary by adding new words with translations
                    and examples
                  </p>
                </div>
              </Link>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
