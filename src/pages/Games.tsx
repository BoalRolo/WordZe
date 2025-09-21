import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { WordsService } from "@/services/words";
import {
  Brain,
  BookOpen,
  Play,
  TrendingUp,
  Clock,
  Target,
  ArrowRight,
  Sparkles,
} from "lucide-react";

export function Games() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleGameStart = async (gameType: "quiz" | "flashcards") => {
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      // Get user's words to check if they have enough for the game
      const words = await WordsService.getWords(user.uid);

      if (words.length === 0) {
        setError("You need to add some words before playing games!");
        setLoading(false);
        return;
      }

      // Navigate to the selected game
      if (gameType === "quiz") {
        navigate("/quiz-settings");
      } else if (gameType === "flashcards") {
        navigate("/flashcard-settings");
      } else {
        navigate(`/${gameType}`);
      }
    } catch (err: any) {
      setError(err.message || "Failed to start game");
      setLoading(false);
    }
  };

  const gameOptions = [
    {
      id: "quiz",
      title: "Quiz Mode",
      description: "Test your knowledge with multiple choice questions",
      icon: Brain,
      color: "from-blue-500 to-blue-600",
      hoverColor: "from-blue-600 to-blue-700",
      bgColor: "from-blue-50 to-blue-100",
      iconColor: "text-blue-600",
      features: [
        "Multiple choice questions",
        "Instant feedback",
        "Score tracking",
        "Difficulty assessment",
      ],
    },
    {
      id: "flashcards",
      title: "Flashcards",
      description: "Study with interactive flashcards",
      icon: BookOpen,
      color: "from-purple-500 to-purple-600",
      hoverColor: "from-purple-600 to-purple-700",
      bgColor: "from-purple-50 to-purple-100",
      iconColor: "text-purple-600",
      features: [
        "Flip cards to reveal answers",
        "Self-paced learning",
        "Visual memory training",
        "Progress tracking",
      ],
    },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <div className="flex items-center justify-center mb-4">
          <div className="p-3 bg-gradient-to-r from-blue-500 to-purple-600 rounded-2xl">
            <Sparkles className="h-8 w-8 text-white" />
          </div>
        </div>
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Games
        </h1>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto">
          Choose your learning adventure! Test your knowledge with quizzes or
          study with flashcards.
        </p>
      </div>

      {/* Error Message */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4">
          <p className="text-red-600 text-center">{error}</p>
        </div>
      )}

      {/* Game Options */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 max-w-6xl mx-auto">
        {gameOptions.map((game) => {
          const IconComponent = game.icon;
          return (
            <div
              key={game.id}
              className="group relative bg-white rounded-3xl shadow-xl border border-gray-200 overflow-hidden hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-2"
            >
              {/* Background Gradient */}
              <div
                className={`absolute inset-0 bg-gradient-to-br ${game.bgColor} opacity-50`}
              />

              <div className="relative p-8">
                {/* Icon and Title */}
                <div className="flex items-center mb-6">
                  <div
                    className={`p-4 bg-gradient-to-r ${game.color} rounded-2xl shadow-lg group-hover:shadow-xl transition-shadow duration-300`}
                  >
                    <IconComponent className="h-8 w-8 text-white" />
                  </div>
                  <div className="ml-4">
                    <h2 className="text-2xl font-bold text-gray-900">
                      {game.title}
                    </h2>
                    <p className="text-gray-600 mt-1">{game.description}</p>
                  </div>
                </div>

                {/* Features */}
                <div className="mb-8">
                  <h3 className="text-sm font-semibold text-gray-700 mb-3 uppercase tracking-wide">
                    Features
                  </h3>
                  <ul className="space-y-2">
                    {game.features.map((feature, index) => (
                      <li
                        key={index}
                        className="flex items-center text-gray-600"
                      >
                        <div
                          className={`w-2 h-2 bg-gradient-to-r ${game.color} rounded-full mr-3`}
                        />
                        {feature}
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Action Button */}
                <button
                  onClick={() =>
                    handleGameStart(game.id as "quiz" | "flashcards")
                  }
                  disabled={loading}
                  className={`w-full bg-gradient-to-r ${game.color} hover:${game.hoverColor} text-white font-semibold py-4 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none flex items-center justify-center space-x-2`}
                >
                  {loading ? (
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white" />
                  ) : (
                    <>
                      <Play className="h-5 w-5" />
                      <span>Start {game.title}</span>
                      <ArrowRight className="h-4 w-4" />
                    </>
                  )}
                </button>
              </div>

              {/* Decorative Elements */}
              <div className="absolute top-4 right-4 opacity-10">
                <IconComponent className="h-16 w-16 text-gray-400" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-gray-50 to-blue-50 rounded-2xl p-8 max-w-4xl mx-auto">
        <h3 className="text-xl font-bold text-gray-900 text-center mb-6">
          Learning Benefits
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="text-center">
            <div className="p-3 bg-blue-100 rounded-xl w-fit mx-auto mb-3">
              <TrendingUp className="h-6 w-6 text-blue-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">Track Progress</h4>
            <p className="text-sm text-gray-600">
              Monitor your learning journey and see improvement over time
            </p>
          </div>
          <div className="text-center">
            <div className="p-3 bg-purple-100 rounded-xl w-fit mx-auto mb-3">
              <Clock className="h-6 w-6 text-purple-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Flexible Timing
            </h4>
            <p className="text-sm text-gray-600">
              Study at your own pace with no time pressure
            </p>
          </div>
          <div className="text-center">
            <div className="p-3 bg-green-100 rounded-xl w-fit mx-auto mb-3">
              <Target className="h-6 w-6 text-green-600" />
            </div>
            <h4 className="font-semibold text-gray-900 mb-1">
              Targeted Learning
            </h4>
            <p className="text-sm text-gray-600">
              Focus on words you need to practice most
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
