import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { WordsService } from "@/services/words";
import { ArrowLeft, Clock, Target, Filter, Play, Settings } from "lucide-react";

export function QuizSettings() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Quiz settings
  const [quizSize, setQuizSize] = useState(10);
  const [difficultyFilter, setDifficultyFilter] = useState<
    "all" | "easy" | "medium" | "hard"
  >("all");
  const [showFailedOnly, setShowFailedOnly] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState(30); // seconds per question

  const handleStartQuiz = async () => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      // Get user's words to check if they have enough for the quiz
      const words = await WordsService.getWords(user.uid);

      if (words.length === 0) {
        setError("You need to add some words before playing the quiz!");
        setLoading(false);
        return;
      }

      // Navigate to quiz with settings as URL parameters
      const params = new URLSearchParams({
        size: quizSize.toString(),
        difficulty: difficultyFilter,
        failedOnly: showFailedOnly.toString(),
        timePerQuestion: timePerQuestion.toString(),
      });

      navigate(`/quiz?${params.toString()}`);
    } catch (err: any) {
      setError(err.message || "Failed to start quiz");
      setLoading(false);
    }
  };

  const quizSizes = [5, 10, 15, 20, 25, 30];
  const timeOptions = [
    { value: 15, label: "15 seconds" },
    { value: 30, label: "30 seconds" },
    { value: 45, label: "45 seconds" },
    { value: 60, label: "1 minute" },
    { value: 90, label: "1.5 minutes" },
    { value: 120, label: "2 minutes" },
  ];

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
            <Settings className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Quiz Settings
        </h1>
        <p className="text-lg text-gray-600">
          Configure your quiz experience and challenge yourself!
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
          {/* Quiz Size */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Target className="h-4 w-4 inline mr-2" />
              Quiz Size
            </label>
            <select
              value={quizSize}
              onChange={(e) => setQuizSize(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {quizSizes.map((size) => (
                <option key={size} value={size}>
                  {size} questions
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
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              <option value="all">All difficulties</option>
              <option value="easy">Easy only</option>
              <option value="medium">Medium only</option>
              <option value="hard">Hard only</option>
            </select>
          </div>

          {/* Time Per Question */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              <Clock className="h-4 w-4 inline mr-2" />
              Time Per Question
            </label>
            <select
              value={timePerQuestion}
              onChange={(e) => setTimePerQuestion(Number(e.target.value))}
              className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-colors"
            >
              {timeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            <p className="text-sm text-gray-500 mt-2">
              ⚠️ If time runs out, the question will be marked as failed
            </p>
          </div>

          {/* Failed Words Only */}
          <div className="flex items-center space-x-3">
            <input
              type="checkbox"
              id="failedOnly"
              checked={showFailedOnly}
              onChange={(e) => setShowFailedOnly(e.target.checked)}
              className="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <label
              htmlFor="failedOnly"
              className="text-sm font-medium text-gray-700"
            >
              Only include words I've failed before
            </label>
          </div>

          {/* Start Quiz Button */}
          <button
            onClick={handleStartQuiz}
            disabled={loading}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2"
          >
            {loading ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
            ) : (
              <>
                <Play className="h-5 w-5" />
                <span>Start Quiz</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Info Card */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-6 border border-blue-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-3">Quiz Rules</h3>
        <ul className="space-y-2 text-sm text-gray-700">
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Each question has a time limit - answer quickly!
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            If time runs out, the question is marked as failed
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Your progress is tracked and saved automatically
          </li>
          <li className="flex items-start">
            <span className="text-blue-500 mr-2">•</span>
            Focus on failed words to improve your weak areas
          </li>
        </ul>
      </div>
    </div>
  );
}
