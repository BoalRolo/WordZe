import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { WordsService } from "@/services/words";
import { DifficultyService } from "@/services/difficulty";
import { WordImporter } from "@/components/WordImporter";
import { WordDoc, Difficulty } from "@/types/models";
import { categories } from "@/data/categories";
import { ExampleSentences } from "@/components/ExampleSentences";
import { Pagination } from "@/components/Pagination";
import {
  formatWordForDisplay,
  formatTranslationForDisplay,
  capitalizeSentence,
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
  Upload,
  Volume2,
} from "lucide-react";

export function Words() {
  const { user } = useAuth();
  const [words, setWords] = useState<(WordDoc & { id: string })[]>([]);
  const [filteredWords, setFilteredWords] = useState<
    (WordDoc & { id: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const wordsPerPage = 10;
  const [difficultyFilter, setDifficultyFilter] = useState<Difficulty | "all">(
    "all"
  );
  const [showFailedOnly, setShowFailedOnly] = useState(false);
  const [expandedWords, setExpandedWords] = useState<Set<string>>(new Set());
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [showImportModal, setShowImportModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [wordToDelete, setWordToDelete] = useState<{
    id: string;
    word: string;
  } | null>(null);
  const [showDeleteAllModal, setShowDeleteAllModal] = useState(false);

  useEffect(() => {
    if (user) {
      loadWords();
    }
  }, [user]);

  useEffect(() => {
    applyFilters();
  }, [
    words,
    difficultyFilter,
    showFailedOnly,
    typeFilter,
    searchQuery,
    currentPage,
  ]);

  const loadWords = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const wordsData = await WordsService.getWords(user.uid);
      setWords(wordsData);
    } catch (error) {
      console.error("Error loading words:", error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = () => {
    let filtered = [...words];

    // Apply search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered
        .filter(
          (word) =>
            word.word.toLowerCase().includes(query) ||
            word.translation.toLowerCase().includes(query)
        )
        .sort((a, b) => {
          const aWord = a.word.toLowerCase();
          const bWord = b.word.toLowerCase();
          const aTranslation = a.translation.toLowerCase();
          const bTranslation = b.translation.toLowerCase();

          // Priority 1: Exact match at start of word
          const aStartsWith = aWord.startsWith(query) ? 0 : 1;
          const bStartsWith = bWord.startsWith(query) ? 0 : 1;
          if (aStartsWith !== bStartsWith) return aStartsWith - bStartsWith;

          // Priority 2: Exact match at start of translation
          const aTransStartsWith = aTranslation.startsWith(query) ? 0 : 1;
          const bTransStartsWith = bTranslation.startsWith(query) ? 0 : 1;
          if (aTransStartsWith !== bTransStartsWith)
            return aTransStartsWith - bTransStartsWith;

          // Priority 3: Shorter words first (more specific matches)
          const aLength = aWord.length;
          const bLength = bWord.length;
          if (aLength !== bLength) return aLength - bLength;

          // Priority 4: Alphabetical order
          return aWord.localeCompare(bWord);
        });
      // Reset to page 1 when searching
      setCurrentPage(1);
    }

    // Apply difficulty filter
    if (difficultyFilter !== "all") {
      filtered = filtered.filter((word) => {
        const calculatedDifficulty =
          DifficultyService.calculateDifficulty(word);
        return calculatedDifficulty === difficultyFilter;
      });
    }

    // Apply type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((word) => word.type === typeFilter);
    }

    // Apply failed only filter
    if (showFailedOnly) {
      filtered = filtered.filter((word) => word.fails > 0);
    }

    // Calculate pagination
    const totalPages = Math.ceil(filtered.length / wordsPerPage);
    setTotalPages(totalPages);

    // Ensure currentPage doesn't exceed totalPages
    const validCurrentPage = Math.min(currentPage, Math.max(1, totalPages));
    if (validCurrentPage !== currentPage) {
      setCurrentPage(validCurrentPage);
    }

    // Get current page items
    const startIndex = (validCurrentPage - 1) * wordsPerPage;
    const endIndex = startIndex + wordsPerPage;
    const paginatedWords = filtered.slice(startIndex, endIndex);

    setFilteredWords(paginatedWords);
  };

  const handleDeleteClick = (wordId: string, word: string) => {
    window.scrollTo(0, 0);
    setWordToDelete({ id: wordId, word });
    setShowDeleteModal(true);
  };

  const handleDeleteConfirm = async () => {
    if (!user || !wordToDelete) return;

    try {
      await WordsService.deleteWord(user.uid, wordToDelete.id);
      setWords(words.filter((word) => word.id !== wordToDelete.id));
      setShowDeleteModal(false);
      setWordToDelete(null);
    } catch (error) {
      console.error("Error deleting word:", error);
    }
  };

  const handleDeleteCancel = () => {
    setShowDeleteModal(false);
    setWordToDelete(null);
  };

  const handleDeleteAllClick = () => {
    setShowDeleteAllModal(true);
  };

  const handleDeleteAllConfirm = async () => {
    if (!user) return;

    try {
      // Delete all words
      for (const word of words) {
        await WordsService.deleteWord(user.uid, word.id);
      }
      setWords([]);
      setShowDeleteAllModal(false);
    } catch (error) {
      console.error("Error deleting all words:", error);
    }
  };

  const handleDeleteAllCancel = () => {
    setShowDeleteAllModal(false);
  };

  const closeImportModal = () => {
    setShowImportModal(false);
  };

  const handlePageChange = (page: number) => {
    setCurrentPage(page);
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

  const getDifficultyColor = (word: WordDoc) => {
    const difficulty = DifficultyService.calculateDifficulty(word);
    switch (difficulty) {
      case "easy":
        return "bg-green-100 text-green-800 border border-green-200";
      case "medium":
        return "bg-yellow-100 text-yellow-800 border border-yellow-200";
      case "hard":
        return "bg-red-100 text-red-800 border border-red-200";
      default:
        return "bg-gray-100 text-gray-800 border border-gray-200";
    }
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
    <div className="space-y-6 px-4 sm:px-6 lg:px-8">
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <div>
          <div className="flex items-center gap-2 sm:gap-4 mb-2 flex-wrap">
            <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
              Words
            </h1>
            <div className="bg-gradient-to-r from-blue-500 to-purple-600 text-white px-3 sm:px-4 py-1.5 sm:py-2 rounded-full shadow-lg">
              <span className="text-base sm:text-lg font-bold">
                {words.length}
              </span>
              <span className="text-xs sm:text-sm ml-1 opacity-90">
                {words.length === 1 ? "word" : "words"}
              </span>
            </div>
          </div>
          <p className="text-sm sm:text-base text-gray-600">
            Manage your vocabulary collection
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-3">
          <Link
            to="/words/add"
            className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm sm:text-base"
          >
            <Plus className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Add Word
          </Link>

          <button
            onClick={() => {
              window.scrollTo(0, 0);
              setShowImportModal(true);
            }}
            className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-green-500 to-emerald-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm sm:text-base"
          >
            <Upload className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
            Import Words
          </button>

          {words.length > 0 && (
            <button
              onClick={handleDeleteAllClick}
              className="inline-flex items-center px-4 sm:px-6 py-2.5 sm:py-3 bg-gradient-to-r from-red-500 to-red-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 text-sm sm:text-base"
            >
              <Trash2 className="w-4 h-4 sm:w-5 sm:h-5 mr-1 sm:mr-2" />
              Delete All
            </button>
          )}
        </div>
      </div>

      {/* Search Bar */}
      <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 sm:p-6 rounded-2xl shadow-lg border border-blue-200">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4 sm:w-5 sm:h-5" />
          <input
            type="text"
            placeholder="Search words..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 sm:pl-12 pr-4 py-3 sm:py-4 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm sm:text-base"
          />
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white p-4 sm:p-6 rounded-2xl shadow-lg border border-gray-200">
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Difficulty
            </label>
            <select
              value={difficultyFilter}
              onChange={(e) =>
                setDifficultyFilter(e.target.value as Difficulty | "all")
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Difficulties</option>
              <option value="beginner">Beginner</option>
              <option value="intermediate">Intermediate</option>
              <option value="advanced">Advanced</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Type
            </label>
            <select
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
            >
              <option value="all">All Types</option>
              <option value="noun">Noun</option>
              <option value="verb">Verb</option>
              <option value="adjective">Adjective</option>
              <option value="adverb">Adverb</option>
              <option value="phrase">Phrase</option>
              <option value="idiom">Idiom</option>
            </select>
          </div>

          <div className="flex items-center">
            <label className="flex items-center">
              <input
                type="checkbox"
                checked={showFailedOnly}
                onChange={(e) => setShowFailedOnly(e.target.checked)}
                className="mr-2 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              />
              <span className="text-sm font-medium text-gray-700">
                Show failed words only
              </span>
            </label>
          </div>
        </div>
      </div>

      {/* Words List */}
      <div className="space-y-4">
        {filteredWords.length === 0 ? (
          <div className="text-center py-12">
            <BookOpen className="w-16 h-16 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              No words found
            </h3>
            <p className="text-gray-500 mb-6">
              {searchQuery ||
              difficultyFilter !== "all" ||
              typeFilter !== "all" ||
              showFailedOnly
                ? "Try adjusting your filters or search terms"
                : "Start building your vocabulary by adding your first word"}
            </p>
            {!searchQuery &&
              difficultyFilter === "all" &&
              typeFilter === "all" &&
              !showFailedOnly && (
                <Link
                  to="/words/add"
                  className="inline-flex items-center px-6 py-3 bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200"
                >
                  <Plus className="w-5 h-5 mr-2" />
                  Add Your First Word
                </Link>
              )}
          </div>
        ) : (
          filteredWords.map((word) => (
            <div
              key={word.id}
              className="bg-white rounded-2xl shadow-lg border border-gray-200 p-4 sm:p-6 hover:shadow-xl transition-shadow duration-200"
            >
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center space-x-3 mb-2">
                    <h3 className="text-lg sm:text-xl font-bold text-gray-900">
                      {formatWordForDisplay(word.word)}
                    </h3>
                    {word.phonetic && (
                      <div className="relative group">
                        <Volume2 className="h-4 w-4 text-blue-500 cursor-help" />
                        <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-48 bg-gray-900 text-white text-xs rounded-lg p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                          <div className="text-center">
                            <div className="font-semibold text-blue-300 mb-1">
                              Phonetic
                            </div>
                            <div className="text-white">{word.phonetic}</div>
                          </div>
                          <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
                        </div>
                      </div>
                    )}
                    {word.type && (
                      <span className="px-2 py-1 bg-blue-100 text-blue-800 text-xs font-medium rounded-full">
                        {word.type}
                      </span>
                    )}
                    {word.difficulty && (
                      <span
                        className={`px-2 py-1 text-xs font-medium rounded-full ${
                          word.difficulty === "beginner"
                            ? "bg-green-100 text-green-800"
                            : word.difficulty === "intermediate"
                            ? "bg-yellow-100 text-yellow-800"
                            : "bg-red-100 text-red-800"
                        }`}
                      >
                        {word.difficulty}
                      </span>
                    )}
                  </div>

                  <p className="text-gray-600 mb-3">
                    {formatTranslationForDisplay(word.translation)}
                  </p>

                  {word.categories && word.categories.length > 0 && (
                    <div className="flex flex-wrap gap-1 mb-3">
                      {word.categories.map((categoryId) => {
                        const category = categories.find(
                          (cat) => cat.id === categoryId
                        );
                        return category ? (
                          <span
                            key={categoryId}
                            className="px-2 py-1 bg-purple-100 text-purple-800 text-xs font-medium rounded-full"
                          >
                            {category.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  )}

                  {word.notes && (
                    <p className="text-sm text-gray-500 mb-3 italic">
                      {word.notes}
                    </p>
                  )}

                  <div className="flex items-center space-x-4 text-sm text-gray-500">
                    <span>Attempts: {word.attempts}</span>
                    <span>Success: {word.successes}</span>
                    <span>Fails: {word.fails}</span>
                  </div>
                </div>

                <div className="flex items-center space-x-2 ml-4">
                  <button
                    onClick={() => {
                      const newExpanded = new Set(expandedWords);
                      if (newExpanded.has(word.id)) {
                        newExpanded.delete(word.id);
                      } else {
                        newExpanded.add(word.id);
                      }
                      setExpandedWords(newExpanded);
                    }}
                    className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  >
                    {expandedWords.has(word.id) ? (
                      <ChevronDown className="w-4 h-4" />
                    ) : (
                      <ChevronRight className="w-4 h-4" />
                    )}
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteClick(
                        word.id,
                        formatWordForDisplay(word.word)
                      )
                    }
                    className="p-2 text-red-400 hover:text-red-600 transition-colors"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {expandedWords.has(word.id) && (
                <div className="mt-4 pt-4 border-t border-gray-200">
                  <ExampleSentences
                    userId={user!.uid}
                    wordId={word.id}
                    word={formatWordForDisplay(word.word)}
                    translation={formatTranslationForDisplay(word.translation)}
                  />
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex justify-center">
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={handlePageChange}
            itemsPerPage={wordsPerPage}
            totalItems={words.length}
            showInfo={true}
          />
        </div>
      )}

      {/* Import Modal */}
      {showImportModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-8 sm:pt-16">
          <div className="bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-2xl font-bold text-gray-900">
                  Import Words
                </h2>
                <button
                  onClick={closeImportModal}
                  className="text-gray-400 hover:text-gray-600 transition-colors"
                >
                  <svg
                    className="w-6 h-6"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
              <WordImporter
                onClose={() => {
                  setShowImportModal(false);
                  loadWords();
                }}
              />
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && wordToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-8 sm:pt-16">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete Word
                  </h3>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700">
                  Are you sure you want to delete{" "}
                  <strong>"{wordToDelete.word}"</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  All associated examples and progress data will be permanently
                  removed.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleDeleteCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete Word
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Delete All Confirmation Modal */}
      {showDeleteAllModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-start justify-center z-50 p-4 pt-8 sm:pt-16">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <Trash2 className="w-6 h-6 text-red-600" />
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">
                    Delete All Words
                  </h3>
                  <p className="text-sm text-gray-600">
                    This action cannot be undone
                  </p>
                </div>
              </div>

              <div className="mb-6">
                <p className="text-gray-700">
                  Are you sure you want to delete{" "}
                  <strong>all {words.length} words</strong>?
                </p>
                <p className="text-sm text-gray-500 mt-2">
                  All words, examples, and progress data will be permanently
                  removed.
                </p>
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={handleDeleteAllCancel}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteAllConfirm}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-medium"
                >
                  Delete All Words
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
