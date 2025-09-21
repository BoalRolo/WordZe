import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { WordsService } from "@/services/words";
import { DifficultyService } from "@/services/difficulty";
import { WordDoc, Difficulty } from "@/types/models";
import { ExampleSentences } from "@/components/ExampleSentences";
import {
  formatWordForDisplay,
  formatTranslationForDisplay,
} from "@/utils/formatting";
import {
  Plus,
  Edit,
  Trash2,
  Filter,
  BookOpen,
  ChevronDown,
  ChevronRight,
  Search,
} from "lucide-react";

export function Words() {
  const { user } = useAuth();
  const [words, setWords] = useState<(WordDoc & { id: string })[]>([]);
  const [filteredWords, setFilteredWords] = useState<
    (WordDoc & { id: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">(
    "all"
  );
  const [showFailedOnly, setShowFailedOnly] = useState(false);
  const [expandedWords, setExpandedWords] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [hasExamplesFilter, setHasExamplesFilter] = useState<boolean | null>(
    null
  );
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (user) {
      loadWords();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [words, difficultyFilter, showFailedOnly, typeFilter, hasExamplesFilter, searchQuery]);

  const loadWords = async () => {
    if (!user) return;

    try {
      const wordsData = await WordsService.getWords(user.uid);
      console.log("Loaded words:", wordsData.length, wordsData);
      setWords(wordsData);
    } catch (error) {
      console.error("Error loading words:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...words];

    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((word) => {
        const wordText = word.word.toLowerCase();
        const translationText = word.translation.toLowerCase();
        const exampleText = word.example ? word.example.toLowerCase() : "";
        
        return (
          wordText.includes(query) ||
          translationText.includes(query) ||
          exampleText.includes(query)
        );
      });
    }

    if (difficultyFilter !== "all") {
      filtered = DifficultyService.filterWordsByDifficulty(
        filtered,
        difficultyFilter
      );
    }

    if (showFailedOnly) {
      filtered = filtered.filter((word) => word.lastResult === "fail");
    }

    if (typeFilter !== "all") {
      filtered = filtered.filter((word) => word.type === typeFilter);
    }

    if (hasExamplesFilter !== null) {
      // This will be updated when we implement the examples check
      // For now, we'll filter based on the original example field
      if (hasExamplesFilter) {
        filtered = filtered.filter(
          (word) => word.example && word.example.trim() !== ""
        );
      } else {
        filtered = filtered.filter(
          (word) => !word.example || word.example.trim() === ""
        );
      }
    }

    setFilteredWords(filtered);
  };

  const handleDelete = async (wordId: string) => {
    if (!user) return;

    if (window.confirm("Are you sure you want to delete this word?")) {
      try {
        await WordsService.deleteWord(user.uid, wordId);
        setWords(words.filter((word) => word.id !== wordId));
      } catch (error) {
        console.error("Error deleting word:", error);
      }
    }
  };

  const getDifficultyColor = (word: WordDoc) => {
    const difficulty = DifficultyService.calculateDifficulty(word);
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800";
      case "medium":
        return "bg-yellow-100 text-yellow-800";
      case "hard":
        return "bg-red-100 text-red-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  const toggleWordExpansion = (wordId: string) => {
    const newExpanded = new Set(expandedWords);
    if (newExpanded.has(wordId)) {
      newExpanded.delete(wordId);
    } else {
      newExpanded.add(wordId);
    }
    setExpandedWords(newExpanded);
  };

  const getDifficultyLabel = (word: WordDoc) => {
    return DifficultyService.calculateDifficulty(word);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Words
          </h1>
          <p className="text-gray-600 mt-2">
            Manage your vocabulary collection
          </p>
        </div>
        <Link
          to="/words/add"
          className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
        >
          <Plus className="w-5 h-5 mr-2" />
          Add Word
        </Link>
      </div>

      {/* Search Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-6 rounded-2xl shadow-lg border border-blue-200">
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-blue-500" />
          </div>
          <input
            type="text"
            placeholder="Search words, translations, or examples..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-4 text-lg border-2 border-blue-200 rounded-xl bg-white shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:border-blue-300 transition-all duration-200 placeholder-gray-400"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery("")}
              className="absolute inset-y-0 right-0 pr-4 flex items-center text-gray-400 hover:text-gray-600 transition-colors duration-200"
            >
              <span className="text-2xl">&times;</span>
            </button>
          )}
        </div>
        {searchQuery && (
          <div className="mt-3 text-sm text-blue-600 font-medium">
            Found {filteredWords.length} word{filteredWords.length !== 1 ? 's' : ''} matching "{searchQuery}"
          </div>
        )}
      </div>

      {/* Enhanced Filters */}
      <div className="bg-gradient-to-r from-white to-gray-50 p-6 rounded-2xl shadow-lg border border-gray-200">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Difficulty Filter */}
          <div className="flex items-center space-x-3">
            <Filter className="w-5 h-5 text-blue-500" />
            <select
              value={difficultyFilter}
              onChange={(e) =>
                setDifficultyFilter(e.target.value as Difficulty | "all")
              }
              className="border-2 border-gradient-to-r from-blue-300 to-purple-300 rounded-xl px-4 py-2 text-sm font-medium bg-gradient-to-r from-blue-50 to-purple-50 shadow-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 hover:from-blue-100 hover:to-purple-100 transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #dbeafe 0%, #f3e8ff 100%)",
                border: "2px solid transparent",
                backgroundClip: "padding-box",
                borderImage: "linear-gradient(135deg, #3b82f6, #8b5cf6) 1",
              }}
            >
              <option value="all" className="text-gray-600">
                All difficulties
              </option>
              <option value="easy" className="text-green-700 font-medium">
                🟢 Easy
              </option>
              <option value="medium" className="text-yellow-700 font-medium">
                🟡 Medium
              </option>
              <option value="hard" className="text-red-700 font-medium">
                🔴 Hard
              </option>
            </select>
          </div>

          {/* Type Filter */}
          <div className="flex items-center space-x-3">
            <BookOpen className="w-5 h-5 text-green-500" />
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="border-2 border-gradient-to-r from-green-300 to-blue-300 rounded-xl px-4 py-2 text-sm font-medium bg-gradient-to-r from-green-50 to-blue-50 shadow-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 hover:from-green-100 hover:to-blue-100 transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #dcfce7 0%, #dbeafe 100%)",
                border: "2px solid transparent",
                backgroundClip: "padding-box",
                borderImage: "linear-gradient(135deg, #22c55e, #3b82f6) 1",
              }}
            >
              <option value="all" className="text-gray-600">
                All types
              </option>
              <option value="noun" className="text-blue-700 font-medium">
                📚 Nouns
              </option>
              <option value="verb" className="text-green-700 font-medium">
                🏃 Verbs
              </option>
              <option value="adjective" className="text-purple-700 font-medium">
                ✨ Adjectives
              </option>
              <option value="adverb" className="text-orange-700 font-medium">
                ⚡ Adverbs
              </option>
              <option value="phrasal verb" className="text-red-700 font-medium">
                🔗 Phrasal Verbs
              </option>
            </select>
          </div>

          {/* Examples Filter */}
          <div className="flex items-center space-x-3">
            <BookOpen className="w-5 h-5 text-purple-500" />
            <select
              value={
                hasExamplesFilter === null
                  ? "all"
                  : hasExamplesFilter
                  ? "yes"
                  : "no"
              }
              onChange={(e) => {
                if (e.target.value === "all") {
                  setHasExamplesFilter(null);
                } else {
                  setHasExamplesFilter(e.target.value === "yes");
                }
              }}
              className="border-2 border-gradient-to-r from-purple-300 to-pink-300 rounded-xl px-4 py-2 text-sm font-medium bg-gradient-to-r from-purple-50 to-pink-50 shadow-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 hover:from-purple-100 hover:to-pink-100 transition-all duration-200"
              style={{
                background: "linear-gradient(135deg, #f3e8ff 0%, #fce7f3 100%)",
                border: "2px solid transparent",
                backgroundClip: "padding-box",
                borderImage: "linear-gradient(135deg, #8b5cf6, #ec4899) 1",
              }}
            >
              <option value="all" className="text-gray-600">
                All words
              </option>
              <option value="yes" className="text-purple-700 font-medium">
                📝 With examples
              </option>
              <option value="no" className="text-gray-700 font-medium">
                📄 Without examples
              </option>
            </select>
          </div>

          {/* Failed Only Filter */}
          <label className="flex items-center space-x-3 cursor-pointer">
            <input
              type="checkbox"
              checked={showFailedOnly}
              onChange={(e) => setShowFailedOnly(e.target.checked)}
              className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500"
            />
            <span className="text-sm font-medium text-gray-700">
              Failed only
            </span>
          </label>
        </div>
      </div>

      {filteredWords.length === 0 ? (
        <div className="text-center py-16">
          {words.length === 0 ? (
            <>
              <div className="mx-auto w-24 h-24 bg-gradient-to-r from-blue-100 to-purple-100 rounded-full flex items-center justify-center mb-6">
                <BookOpen className="h-12 w-12 text-blue-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No words yet
              </h3>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                Start building your vocabulary by adding your first word. Every
                journey begins with a single step!
              </p>
              <Link
                to="/words/add"
                className="inline-flex items-center px-8 py-4 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
              >
                <Plus className="w-5 h-5 mr-2" />
                Add your first word
              </Link>
            </>
          ) : (
            <>
              <div className="mx-auto w-24 h-24 bg-gradient-to-r from-gray-100 to-gray-200 rounded-full flex items-center justify-center mb-6">
                <Filter className="h-12 w-12 text-gray-500" />
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">
                No words match your filters
              </h3>
              <p className="text-lg text-gray-600 mb-8 max-w-md mx-auto">
                Try adjusting your filter criteria to see more words, or add new
                words to your collection.
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <button
                  onClick={() => {
                    setDifficultyFilter("all");
                    setShowFailedOnly(false);
                    setTypeFilter("all");
                    setHasExamplesFilter(null);
                    setSearchQuery("");
                  }}
                  className="inline-flex items-center px-6 py-3 bg-gray-100 text-gray-700 font-semibold rounded-xl hover:bg-gray-200 transition-colors duration-200"
                >
                  Clear filters
                </button>
                <Link
                  to="/words/add"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add new word
                </Link>
              </div>
            </>
          )}
        </div>
      ) : (
        <div className="grid gap-6">
          {filteredWords.map((word) => (
            <div
              key={word.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 hover:shadow-xl transition-all duration-200 p-6"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center space-x-4 mb-3">
                    <div className="flex-1">
                      <h3 className="text-2xl font-bold text-gray-900 mb-1">
                        {formatWordForDisplay(word.word)}
                      </h3>
                      <p className="text-lg text-gray-600 mb-2">
                        {formatTranslationForDisplay(word.translation)}
                      </p>
                      {word.type && (
                        <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-gradient-to-r from-blue-100 to-blue-200 text-blue-800 border border-blue-300">
                          {word.type}
                        </span>
                      )}
                    </div>
                  </div>

                  {word.example && (
                    <div className="bg-gray-50 rounded-xl p-4 mb-4">
                      <p className="text-gray-700 italic">"{word.example}"</p>
                    </div>
                  )}

                  <div className="flex flex-wrap items-center gap-4 text-sm mb-4">
                    <div className="flex items-center space-x-2">
                      <span className="text-gray-500">Attempts:</span>
                      <span className="font-semibold text-gray-900">
                        {word.attempts}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-green-600">Success:</span>
                      <span className="font-semibold text-green-700">
                        {word.successes}
                      </span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className="text-red-600">Fails:</span>
                      <span className="font-semibold text-red-700">
                        {word.fails}
                      </span>
                    </div>
                    <span
                      className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${getDifficultyColor(
                        word
                      )}`}
                    >
                      {getDifficultyLabel(word)}
                    </span>
                  </div>

                  {/* Example Sentences Section */}
                  <div className="border-t border-gray-200 pt-4">
                    <button
                      onClick={() => toggleWordExpansion(word.id)}
                      className="flex items-center space-x-2 text-blue-600 hover:text-blue-800 font-medium mb-3"
                    >
                      {expandedWords.has(word.id) ? (
                        <ChevronDown className="w-4 h-4" />
                      ) : (
                        <ChevronRight className="w-4 h-4" />
                      )}
                      <span>Example Sentences</span>
                    </button>

                    {expandedWords.has(word.id) && user && (
                      <ExampleSentences
                        userId={user.uid}
                        wordId={word.id}
                        word={formatWordForDisplay(word.word)}
                        translation={formatTranslationForDisplay(
                          word.translation
                        )}
                      />
                    )}
                  </div>
                </div>

                <div className="flex items-center space-x-3 ml-4">
                  <Link
                    to={`/words/edit/${word.id}`}
                    className="p-2 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-lg transition-colors duration-200"
                    title="Edit word"
                  >
                    <Edit className="w-5 h-5" />
                  </Link>
                  <button
                    onClick={() => handleDelete(word.id)}
                    className="p-2 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg transition-colors duration-200"
                    title="Delete word"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
