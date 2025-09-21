import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { HistoryService } from "@/services/history";
import { QuizHistoryItem } from "@/types/models";
import {
  Calendar,
  Clock,
  Target,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  BarChart3,
  BookOpen,
  Play,
  ChevronDown,
  ChevronUp,
} from "lucide-react";

export function History() {
  const { user } = useAuth();
  const [history, setHistory] = useState<QuizHistoryItem[]>([]);
  const [todayHistory, setTodayHistory] = useState<QuizHistoryItem[]>([]);
  const [failedWords, setFailedWords] = useState<
    Array<{
      wordId: string;
      word: string;
      translation: string;
      failCount: number;
      lastFailed: string;
      examples?: string[];
      example?: string;
      type?: string;
    }>
  >([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"all" | "today" | "failed">("all");
  const [expandedWords, setExpandedWords] = useState<Set<string>>(new Set());

  useEffect(() => {
    if (user) {
      loadHistory();
    }
  }, [user]);

  const loadHistory = async () => {
    if (!user) return;

    try {
      const [allHistory, todaySessions, failedWordsData] = await Promise.all([
        HistoryService.getQuizHistory(user.uid),
        HistoryService.getTodaySessions(user.uid),
        HistoryService.getFailedWordsFromHistory(user.uid),
      ]);

      setHistory(allHistory);
      setTodayHistory(todaySessions);
      setFailedWords(failedWordsData);
    } catch (error) {
      console.error("Error loading history:", error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (seconds: number): string => {
    if (seconds < 60) return `${seconds}s`;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}m ${remainingSeconds}s`;
  };

  const toggleExpanded = (wordId: string) => {
    console.log("Toggle expanded for wordId:", wordId);
    setExpandedWords((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(wordId)) {
        newSet.delete(wordId);
        console.log("Collapsed word:", wordId);
      } else {
        newSet.add(wordId);
        console.log("Expanded word:", wordId);
      }
      return newSet;
    });
  };

  const getScoreColor = (percentage: number): string => {
    if (percentage >= 80) return "text-green-600";
    if (percentage >= 60) return "text-yellow-600";
    return "text-red-600";
  };

  const getScoreBgColor = (percentage: number): string => {
    if (percentage >= 80) return "bg-green-100";
    if (percentage >= 60) return "bg-yellow-100";
    return "bg-red-100";
  };

  const getRankingColor = (index: number): string => {
    switch (index) {
      case 0:
        return "bg-gradient-to-r from-red-600 to-red-700 text-white"; // Dark Red
      case 1:
        return "bg-gradient-to-r from-red-500 to-red-600 text-white"; // Red
      case 2:
        return "bg-gradient-to-r from-orange-600 to-orange-700 text-white"; // Orange
      case 3:
        return "bg-gradient-to-r from-orange-500 to-orange-600 text-white"; // Orange
      case 4:
        return "bg-gradient-to-r from-yellow-600 to-yellow-700 text-white"; // Yellow
      case 5:
        return "bg-gradient-to-r from-yellow-500 to-yellow-600 text-white"; // Yellow
      default:
        return "bg-gradient-to-r from-blue-500 to-blue-600 text-white"; // Blue for others
    }
  };

  const getRankingBorderColor = (index: number): string => {
    switch (index) {
      case 0:
        return "border-red-400 shadow-red-300";
      case 1:
        return "border-red-300 shadow-red-200";
      case 2:
        return "border-orange-400 shadow-orange-300";
      case 3:
        return "border-orange-300 shadow-orange-200";
      case 4:
        return "border-yellow-400 shadow-yellow-300";
      case 5:
        return "border-yellow-300 shadow-yellow-200";
      default:
        return "border-blue-300 shadow-blue-200";
    }
  };

  const getCardBackgroundColor = (index: number): string => {
    switch (index) {
      case 0:
        return "bg-gradient-to-br from-red-50 to-red-100";
      case 1:
        return "bg-gradient-to-br from-red-50 to-red-100";
      case 2:
        return "bg-gradient-to-br from-orange-50 to-orange-100";
      case 3:
        return "bg-gradient-to-br from-orange-50 to-orange-100";
      case 4:
        return "bg-gradient-to-br from-yellow-50 to-yellow-100";
      case 5:
        return "bg-gradient-to-br from-yellow-50 to-yellow-100";
      default:
        return "bg-gradient-to-br from-blue-50 to-blue-100";
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  const currentData =
    activeTab === "all" ? history : activeTab === "today" ? todayHistory : [];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Quiz History
        </h1>
        <p className="text-lg text-gray-600">
          Track your learning progress and identify areas for improvement
        </p>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-4">
        <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-2xl p-6 border border-blue-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-blue-600 mb-1">
                Total Sessions
              </p>
              <p className="text-3xl font-bold text-blue-900">
                {history.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-blue-500 rounded-xl flex items-center justify-center">
              <BarChart3 className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-2xl p-6 border border-green-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600 mb-1">
                Today's Sessions
              </p>
              <p className="text-3xl font-bold text-green-900">
                {todayHistory.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-green-500 rounded-xl flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-purple-50 to-purple-100 rounded-2xl p-6 border border-purple-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600 mb-1">
                Avg Score
              </p>
              <p className="text-3xl font-bold text-purple-900">
                {history.length > 0
                  ? Math.round(
                      history.reduce(
                        (sum, session) => sum + session.percentage,
                        0
                      ) / history.length
                    )
                  : 0}
                %
              </p>
            </div>
            <div className="w-12 h-12 bg-purple-500 rounded-xl flex items-center justify-center">
              <Target className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>

        <div className="bg-gradient-to-br from-red-50 to-red-100 rounded-2xl p-6 border border-red-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-red-600 mb-1">
                Failed Words
              </p>
              <p className="text-3xl font-bold text-red-900">
                {failedWords.length}
              </p>
            </div>
            <div className="w-12 h-12 bg-red-500 rounded-xl flex items-center justify-center">
              <AlertCircle className="h-6 w-6 text-white" />
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex space-x-1 bg-gray-100 rounded-xl p-1">
        <button
          onClick={() => setActiveTab("all")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === "all"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          All History
        </button>
        <button
          onClick={() => setActiveTab("today")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === "today"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Today
        </button>
        <button
          onClick={() => setActiveTab("failed")}
          className={`flex-1 py-2 px-4 rounded-lg text-sm font-medium transition-all duration-200 ${
            activeTab === "failed"
              ? "bg-white text-blue-600 shadow-sm"
              : "text-gray-600 hover:text-gray-900"
          }`}
        >
          Failed Words
        </button>
      </div>

      {/* Content */}
      {activeTab === "failed" ? (
        <div className="space-y-4">
          <div className="flex items-center justify-between mb-6">
            <div>
              <div className="flex items-center space-x-3 mb-2">
                <div className="w-10 h-10 bg-gradient-to-r from-red-500 to-orange-500 rounded-xl flex items-center justify-center">
                  <span className="text-white font-bold text-lg">⚡</span>
                </div>
                <h2 className="text-3xl font-bold bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                  Top 10 Failed Words
                </h2>
              </div>
              <p className="text-gray-600 text-lg">
                Your most challenging words from the last 7 days, ranked by
                frequency
              </p>
            </div>
            <div className="relative">
              <div className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-6 py-3 rounded-2xl font-bold text-lg shadow-lg">
                {failedWords.length} Words
              </div>
              <div className="absolute -top-1 -right-1 w-6 h-6 bg-yellow-400 rounded-full flex items-center justify-center">
                <span className="text-xs font-bold text-gray-800">🔥</span>
              </div>
            </div>
          </div>
          {failedWords.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gradient-to-r from-green-100 to-green-200 rounded-full flex items-center justify-center mb-6">
                <CheckCircle className="h-12 w-12 text-green-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No Failed Words!
              </h3>
              <p className="text-lg text-gray-600">
                Great job! You haven't failed any words recently.
              </p>
            </div>
          ) : (
            <div className="grid gap-4">
              {failedWords.map((item, index) => {
                const isExpanded = expandedWords.has(item.wordId);
                const hasExamples =
                  (item.examples && item.examples.length > 0) ||
                  (item.example && item.example.trim().length > 0);

                // Debug log
                console.log(
                  `Word: ${item.word}, hasExamples: ${hasExamples}, examples:`,
                  item.examples,
                  `example: ${item.example}`,
                  `wordId: ${item.wordId}`
                );

                return (
                  <div
                    key={item.wordId}
                    className={`${getCardBackgroundColor(
                      index
                    )} rounded-2xl shadow-lg border-2 p-6 transition-all duration-200 ${getRankingBorderColor(
                      index
                    )}`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <div className="flex items-center space-x-4 mb-2">
                          <span
                            className={`text-2xl font-bold px-3 py-1 rounded-full ${getRankingColor(
                              index
                            )}`}
                          >
                            #{index + 1}
                          </span>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2">
                              <h3 className="text-xl font-bold text-gray-900">
                                {item.word}
                              </h3>
                              {item.type && (
                                <span className="px-2 py-1 text-xs font-medium bg-gray-100 text-gray-600 rounded-full">
                                  {item.type}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-600">{item.translation}</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4 text-sm text-gray-500">
                          <span>Failed {item.failCount} times</span>
                          <span>Last failed: {item.lastFailed}</span>
                          {hasExamples && (
                            <button
                              onClick={() => toggleExpanded(item.wordId)}
                              className="flex items-center space-x-1 px-2 py-1 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md transition-all duration-200"
                            >
                              <span className="text-sm font-medium">
                                Examples
                              </span>
                              {isExpanded ? (
                                <ChevronUp className="h-4 w-4" />
                              ) : (
                                <ChevronDown className="h-4 w-4" />
                              )}
                            </button>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="text-2xl font-bold text-red-600">
                          {item.failCount}
                        </div>
                        <div className="text-sm text-gray-500">failures</div>
                      </div>
                    </div>

                    {/* Expanded Examples Section */}
                    {isExpanded && (
                      <div className="mt-4 pt-4 border-t border-gray-200 animate-in slide-in-from-top-2 duration-200">
                        {hasExamples ? (
                          <>
                            <div className="flex items-center space-x-2 mb-3">
                              <BookOpen className="h-4 w-4 text-blue-600" />
                              <h4 className="text-sm font-semibold text-gray-700">
                                Example Sentences (
                                {item.examples ? item.examples.length : 1})
                              </h4>
                            </div>
                            <div className="space-y-3">
                              {(item.examples || [item.example!]).map(
                                (example, exampleIndex) => (
                                  <div
                                    key={exampleIndex}
                                    className="bg-gradient-to-r from-blue-50 to-indigo-50 p-4 rounded-lg border border-blue-100"
                                  >
                                    <div className="flex items-start space-x-2">
                                      <span className="text-xs font-bold text-blue-600 bg-blue-200 px-2 py-1 rounded-full">
                                        {exampleIndex + 1}
                                      </span>
                                      <p className="text-sm text-gray-800 italic leading-relaxed">
                                        "{example}"
                                      </p>
                                    </div>
                                  </div>
                                )
                              )}
                            </div>
                          </>
                        ) : (
                          <div className="text-center py-4">
                            <p className="text-gray-500 text-sm">
                              No example sentences available for this word.
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-900 mb-4">
            {activeTab === "today" ? "Today's Sessions" : "All Quiz Sessions"}
          </h2>
          {currentData.length === 0 ? (
            <div className="text-center py-12">
              <div className="mx-auto w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No sessions yet
              </h3>
              <p className="text-lg text-gray-600">
                {activeTab === "today"
                  ? "You haven't completed any sessions today. Start learning!"
                  : "Complete some quizzes or flashcards to see your history here."}
              </p>
            </div>
          ) : (
            <div className="grid gap-6">
              {currentData.map((session) => (
                <div
                  key={session.id}
                  className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                        {session.type === "quiz" ? (
                          <Play className="h-6 w-6 text-white" />
                        ) : (
                          <BookOpen className="h-6 w-6 text-white" />
                        )}
                      </div>
                      <div>
                        <h3 className="text-xl font-bold text-gray-900 capitalize">
                          {session.type} Session
                        </h3>
                        <p className="text-gray-600">{session.date}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <div
                        className={`text-3xl font-bold ${getScoreColor(
                          session.percentage
                        )}`}
                      >
                        {session.percentage}%
                      </div>
                      <div className="text-sm text-gray-500">
                        {session.score}/{session.total} correct
                      </div>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-4 w-4 text-gray-500" />
                      <span className="text-sm text-gray-600">
                        Duration: {formatDuration(session.duration)}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4 text-green-500" />
                      <span className="text-sm text-gray-600">
                        Correct: {session.correctWords.length}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <AlertCircle className="h-4 w-4 text-red-500" />
                      <span className="text-sm text-gray-600">
                        Failed: {session.failedWords.length}
                      </span>
                    </div>
                  </div>

                  {session.failedWords.length > 0 && (
                    <div className="border-t border-gray-200 pt-4">
                      <h4 className="text-sm font-semibold text-gray-700 mb-2">
                        Failed Words:
                      </h4>
                      <div className="flex flex-wrap gap-2">
                        {session.failedWords.map((word, index) => (
                          <span
                            key={index}
                            className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800"
                          >
                            {word.word} → {word.translation}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
