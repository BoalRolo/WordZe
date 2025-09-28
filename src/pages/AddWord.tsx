import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { WordsService } from "@/services/words";
import { ExamplesService } from "@/services/examples";
import { Plus, X, BookOpen, Tag, Check } from "lucide-react";
import { categories, Category } from "@/data/categories";

const wordTypes = [
  {
    id: "noun",
    label: "📚 Noun",
    description: "A person, place, thing, or idea",
  },
  { id: "verb", label: "🏃 Verb", description: "An action or state of being" },
  {
    id: "adjective",
    label: "✨ Adjective",
    description: "Describes or modifies a noun",
  },
  {
    id: "adverb",
    label: "⚡ Adverb",
    description: "Describes or modifies a verb, adjective, or other adverb",
  },
  {
    id: "phrase",
    label: "📝 Phrase",
    description: "A group of words expressing a single idea",
  },
  {
    id: "idiom",
    label: "💡 Idiom",
    description: "An expression with a meaning different from literal words",
  },
];

const difficultyLevels = [
  {
    id: "beginner",
    label: "🟢 Beginner",
    description: "Basic level words for beginners",
  },
  {
    id: "intermediate",
    label: "🟡 Intermediate",
    description: "Intermediate level words",
  },
  {
    id: "advanced",
    label: "🔴 Advanced",
    description: "Advanced level words",
  },
];

export function AddWord() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    word: "",
    translation: "",
    type: "",
    difficulty: "",
    notes: "",
  });

  const [selectedCategories, setSelectedCategories] = useState<string[]>([]);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [categorySearch, setCategorySearch] = useState("");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [showDifficultyDropdown, setShowDifficultyDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const typeDropdownRef = useRef<HTMLDivElement>(null);
  const difficultyDropdownRef = useRef<HTMLDivElement>(null);

  const [examples, setExamples] = useState<
    Array<{ sentence: string; translation: string; isValid?: boolean }>
  >([{ sentence: "", translation: "", isValid: false }]); // Start with one mandatory example
  const [newExample, setNewExample] = useState({
    sentence: "",
    translation: "",
  });

  // Function to validate if example contains the word
  const validateExample = (sentence: string, word: string): boolean => {
    if (!sentence.trim() || !word.trim()) return false;
    const wordLower = word.toLowerCase().trim();
    const sentenceLower = sentence.toLowerCase();
    return sentenceLower.includes(wordLower);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    // Validate that at least one example sentence is provided
    const validExamples = examples.filter((ex) => ex.sentence.trim() !== "");
    if (validExamples.length === 0) {
      setError("At least one example sentence is required");
      return;
    }

    // Validate that all examples contain the word
    const invalidExamples = validExamples.filter(
      (ex) => !validateExample(ex.sentence, formData.word)
    );
    if (invalidExamples.length > 0) {
      setError(
        `All example sentences must contain the word "${formData.word}". Please check your examples.`
      );
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Check if word already exists
      const existingWords = await WordsService.getWords(user.uid);
      const existingWord = existingWords.find(
        (word) => word.word.toLowerCase() === formData.word.toLowerCase()
      );

      if (existingWord) {
        setError(
          `The word "${formData.word}" already exists in your vocabulary with the translation "${existingWord.translation}". Please choose a different word or edit the existing one.`
        );
        setLoading(false);
        return;
      }

      // Add the word first (without the old example field)
      const wordId = await WordsService.addWord(
        user.uid,
        formData.word.trim(),
        formData.translation.trim(),
        formData.type?.trim() || undefined,
        formData.notes?.trim() || undefined,
        selectedCategories.length > 0 ? selectedCategories : undefined,
        formData.difficulty?.trim() || undefined
      );

      // Add example sentences
      for (const example of validExamples) {
        await ExamplesService.addExample(
          user.uid,
          wordId,
          example.sentence.trim(),
          example.translation.trim() || undefined
        );
      }

      navigate("/words");
    } catch (err: any) {
      setError(err.message || "Failed to add word");
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement
    >
  ) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const addExample = () => {
    if (newExample.sentence.trim()) {
      setExamples([...examples, { ...newExample }]);
      setNewExample({ sentence: "", translation: "" });
    }
  };

  const removeExample = (index: number) => {
    // Don't allow removing if it's the only example
    if (examples.length > 1) {
      setExamples(examples.filter((_, i) => i !== index));
    }
  };

  const updateExample = (
    index: number,
    field: "sentence" | "translation",
    value: string
  ) => {
    const updatedExamples = [...examples];
    updatedExamples[index] = { ...updatedExamples[index], [field]: value };

    // Validate the example if it's a sentence field
    if (field === "sentence") {
      updatedExamples[index].isValid = validateExample(value, formData.word);
    }

    setExamples(updatedExamples);
  };

  const addNewExampleField = () => {
    setExamples([
      ...examples,
      { sentence: "", translation: "", isValid: false },
    ]);
  };

  const toggleCategory = (categoryId: string) => {
    setSelectedCategories((prev) =>
      prev.includes(categoryId)
        ? prev.filter((id) => id !== categoryId)
        : [...prev, categoryId]
    );
  };

  const handleDropdownToggle = () => {
    setShowCategoryDropdown(!showCategoryDropdown);
    if (showCategoryDropdown) {
      setCategorySearch(""); // Clear search when closing
    }
  };

  const handleTypeDropdownToggle = () => {
    setShowTypeDropdown(!showTypeDropdown);
  };

  const selectType = (typeId: string) => {
    setFormData((prev) => ({ ...prev, type: typeId }));
    setShowTypeDropdown(false);
  };

  const getSelectedTypeLabel = () => {
    const selectedType = wordTypes.find((type) => type.id === formData.type);
    return selectedType ? selectedType.label : "Select type (optional)";
  };

  const handleDifficultyDropdownToggle = () => {
    setShowDifficultyDropdown(!showDifficultyDropdown);
  };

  const selectDifficulty = (difficultyId: string) => {
    setFormData((prev) => ({ ...prev, difficulty: difficultyId }));
    setShowDifficultyDropdown(false);
  };

  const getSelectedDifficultyLabel = () => {
    const selectedDifficulty = difficultyLevels.find(
      (level) => level.id === formData.difficulty
    );
    return selectedDifficulty
      ? selectedDifficulty.label
      : "Select difficulty (optional)";
  };

  const removeCategory = (categoryId: string) => {
    setSelectedCategories((prev) => prev.filter((id) => id !== categoryId));
  };

  const getSelectedCategoryLabels = () => {
    return selectedCategories
      .map((id) => categories.find((cat) => cat.id === id)?.label)
      .filter(Boolean);
  };

  const getFilteredCategories = () => {
    if (!categorySearch.trim()) return categories;

    const searchTerm = categorySearch.toLowerCase();
    return categories.filter(
      (category) =>
        category.label.toLowerCase().includes(searchTerm) ||
        category.description.toLowerCase().includes(searchTerm)
    );
  };

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setShowCategoryDropdown(false);
      }
      if (
        typeDropdownRef.current &&
        !typeDropdownRef.current.contains(event.target as Node)
      ) {
        setShowTypeDropdown(false);
      }
      if (
        difficultyDropdownRef.current &&
        !difficultyDropdownRef.current.contains(event.target as Node)
      ) {
        setShowDifficultyDropdown(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div
      className="max-w-3xl mx-auto"
      style={{ maxWidth: "768px", margin: "0 auto" }}
    >
      <div
        className="text-center mb-8"
        style={{ textAlign: "center", marginBottom: "2rem" }}
      >
        <h1
          className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2"
          style={{
            fontSize: "2.25rem",
            fontWeight: "bold",
            background: "linear-gradient(to right, #2563eb, #9333ea)",
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            marginBottom: "0.5rem",
          }}
        >
          Add New Word
        </h1>
        <p
          className="text-lg text-gray-600"
          style={{ fontSize: "1.125rem", color: "#6b7280" }}
        >
          Expand your vocabulary by adding a new word with translation and
          examples.
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-white rounded-2xl shadow-xl border border-gray-200 p-8 space-y-8"
        style={{
          backgroundColor: "white",
          borderRadius: "1rem",
          boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
          border: "1px solid #e5e7eb",
          padding: "2rem",
          display: "flex",
          flexDirection: "column",
          gap: "2rem",
        }}
      >
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-600 px-6 py-4 rounded-xl">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 gap-8 sm:grid-cols-2">
          <div>
            <label
              htmlFor="word"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Word *
            </label>
            <input
              type="text"
              name="word"
              id="word"
              required
              value={formData.word}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              style={{
                display: "block",
                width: "100%",
                border: "1px solid #d1d5db",
                borderRadius: "0.75rem",
                padding: "0.75rem 1rem",
                boxShadow: "0 1px 2px 0 rgba(0, 0, 0, 0.05)",
                fontSize: "1.125rem",
                outline: "none",
              }}
              placeholder="Enter the word in English"
            />
          </div>

          <div>
            <label
              htmlFor="translation"
              className="block text-sm font-semibold text-gray-700 mb-2"
            >
              Translation *
            </label>
            <input
              type="text"
              name="translation"
              id="translation"
              required
              value={formData.translation}
              onChange={handleChange}
              className="block w-full border border-gray-300 rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
              placeholder="Enter the translation"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Type
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Select the word type (optional)
          </p>

          {/* Type Dropdown */}
          <div className="relative" ref={typeDropdownRef}>
            <button
              type="button"
              onClick={handleTypeDropdownToggle}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <span className="text-gray-700">{getSelectedTypeLabel()}</span>
              <svg
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  showTypeDropdown ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showTypeDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg">
                <div className="p-2">
                  {wordTypes.map((type) => (
                    <div
                      key={type.id}
                      className="flex items-start p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => selectType(type.id)}
                    >
                      <div className="flex items-center h-5">
                        {formData.type === type.id ? (
                          <Check className="h-4 w-4 text-blue-600" />
                        ) : (
                          <div className="h-4 w-4 border border-gray-300 rounded" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {type.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {type.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Difficulty Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            Difficulty
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Select the difficulty level (optional)
          </p>

          {/* Difficulty Dropdown */}
          <div className="relative" ref={difficultyDropdownRef}>
            <button
              type="button"
              onClick={handleDifficultyDropdownToggle}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <span className="text-gray-700">
                {getSelectedDifficultyLabel()}
              </span>
              <svg
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  showDifficultyDropdown ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showDifficultyDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg">
                <div className="p-2">
                  {difficultyLevels.map((level) => (
                    <div
                      key={level.id}
                      className="flex items-start p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                      onClick={() => selectDifficulty(level.id)}
                    >
                      <div className="flex items-center h-5">
                        {formData.difficulty === level.id ? (
                          <Check className="h-4 w-4 text-blue-600" />
                        ) : (
                          <div className="h-4 w-4 border border-gray-300 rounded" />
                        )}
                      </div>
                      <div className="ml-3 flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {level.label}
                        </div>
                        <div className="text-xs text-gray-500 mt-1">
                          {level.description}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Categories Section */}
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">
            <Tag className="h-4 w-4 inline mr-1" />
            Categories
          </label>
          <p className="text-sm text-gray-600 mb-4">
            Select one or more categories that best describe this word
            (optional)
          </p>

          {/* Selected Categories Display */}
          {selectedCategories.length > 0 && (
            <div className="mb-4">
              <div className="flex flex-wrap gap-2">
                {getSelectedCategoryLabels().map((label, index) => (
                  <span
                    key={selectedCategories[index]}
                    className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-100 text-blue-800 border border-blue-200"
                  >
                    {label}
                    <button
                      type="button"
                      onClick={() => removeCategory(selectedCategories[index])}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Category Dropdown */}
          <div className="relative" ref={dropdownRef}>
            <button
              type="button"
              onClick={handleDropdownToggle}
              className="w-full flex items-center justify-between px-4 py-3 border border-gray-300 rounded-xl bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors"
            >
              <span className="text-gray-700">
                {selectedCategories.length === 0
                  ? "Select categories..."
                  : `${selectedCategories.length} categor${
                      selectedCategories.length === 1 ? "y" : "ies"
                    } selected`}
              </span>
              <svg
                className={`h-5 w-5 text-gray-400 transition-transform ${
                  showCategoryDropdown ? "rotate-180" : ""
                }`}
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M19 9l-7 7-7-7"
                />
              </svg>
            </button>

            {showCategoryDropdown && (
              <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded-xl shadow-lg max-h-60 overflow-y-auto">
                {/* Search Input */}
                <div className="p-3 border-b border-gray-200">
                  <input
                    type="text"
                    placeholder="Search categories..."
                    value={categorySearch}
                    onChange={(e) => setCategorySearch(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent text-sm"
                    onClick={(e) => e.stopPropagation()}
                  />
                </div>

                <div className="p-2">
                  {getFilteredCategories().length === 0 ? (
                    <div className="p-3 text-center text-gray-500 text-sm">
                      No categories found matching "{categorySearch}"
                    </div>
                  ) : (
                    getFilteredCategories().map((category) => (
                      <div
                        key={category.id}
                        className="flex items-start p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors"
                        onClick={() => toggleCategory(category.id)}
                      >
                        <div className="flex items-center h-5">
                          {selectedCategories.includes(category.id) ? (
                            <Check className="h-4 w-4 text-blue-600" />
                          ) : (
                            <div className="h-4 w-4 border border-gray-300 rounded" />
                          )}
                        </div>
                        <div className="ml-3 flex-1">
                          <div className="text-sm font-medium text-gray-900">
                            {category.label}
                          </div>
                          <div className="text-xs text-gray-500 mt-1">
                            {category.description}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Example Sentences Section - Now Mandatory */}
        <div className="border-t border-gray-200 pt-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
              Example Sentences *
            </h3>
            <span className="text-sm text-red-500">Required</span>
          </div>

          {/* Help text */}
          <div className="mb-4 p-3 bg-blue-50 border border-blue-200 rounded-lg">
            <p className="text-sm text-blue-700">
              <strong>💡 Tip:</strong> Each example sentence must contain the
              word "
              <span className="font-semibold">
                {formData.word || "your word"}
              </span>
              " to ensure accuracy.
            </p>
          </div>

          {/* Example Sentences List */}
          <div className="space-y-4">
            {examples.map((example, index) => (
              <div
                key={index}
                className={`border rounded-xl p-4 ${
                  example.sentence && formData.word
                    ? example.isValid
                      ? "bg-green-50 border-green-200"
                      : "bg-red-50 border-red-200"
                    : "bg-blue-50 border-blue-200"
                }`}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2">
                    <span className="text-sm font-medium text-gray-700">
                      Example {index + 1}
                    </span>
                    {example.sentence && formData.word && (
                      <span
                        className={`text-xs px-2 py-1 rounded-full ${
                          example.isValid
                            ? "bg-green-100 text-green-700"
                            : "bg-red-100 text-red-700"
                        }`}
                      >
                        {example.isValid
                          ? "✓ Valid"
                          : "✗ Must contain the word"}
                      </span>
                    )}
                  </div>
                  {examples.length > 1 && (
                    <button
                      type="button"
                      onClick={() => removeExample(index)}
                      className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove example"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Example Sentence *
                    </label>
                    <input
                      type="text"
                      value={example.sentence}
                      onChange={(e) =>
                        updateExample(index, "sentence", e.target.value)
                      }
                      placeholder={
                        formData.word
                          ? `Example: "I ${formData.word} every day"`
                          : "Example: Enter a sentence containing your word"
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Translation (Optional)
                    </label>
                    <input
                      type="text"
                      value={example.translation}
                      onChange={(e) =>
                        updateExample(index, "translation", e.target.value)
                      }
                      placeholder={
                        formData.translation
                          ? `Translation: "Eu ${formData.translation} todos os dias"`
                          : "Translation: Enter the Portuguese translation"
                      }
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Add More Examples Button */}
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={addNewExampleField}
              className="inline-flex items-center px-4 py-2 border border-blue-300 text-sm font-medium rounded-lg text-blue-700 bg-blue-50 hover:bg-blue-100 transition-colors duration-200"
            >
              <Plus className="h-4 w-4 mr-1" />
              Add Another Example
            </button>
          </div>
        </div>

        <div>
          <label
            htmlFor="notes"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Notes
          </label>
          <textarea
            name="notes"
            id="notes"
            rows={4}
            value={formData.notes}
            onChange={handleChange}
            className="block w-full border border-gray-300 rounded-xl px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg"
            placeholder="Additional notes or tips"
          />
        </div>

        <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-4 pt-6">
          <button
            type="button"
            onClick={() => navigate("/words")}
            className="px-8 py-3 border border-gray-300 rounded-xl shadow-sm text-sm font-semibold text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
          >
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transform hover:scale-105 transition-all duration-200"
            style={{
              padding: "0.75rem 2rem",
              border: "none",
              borderRadius: "0.75rem",
              boxShadow: "0 10px 15px -3px rgba(0, 0, 0, 0.1)",
              fontSize: "0.875rem",
              fontWeight: "600",
              color: "white",
              background: "linear-gradient(to right, #3b82f6, #9333ea)",
              cursor: "pointer",
              outline: "none",
              transition: "all 0.2s",
              opacity: loading ? 0.5 : 1,
            }}
          >
            {loading ? "Adding..." : "Add Word"}
          </button>
        </div>
      </form>
    </div>
  );
}
