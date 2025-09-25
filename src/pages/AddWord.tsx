import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { WordsService } from "@/services/words";
import { ExamplesService } from "@/services/examples";
import { Plus, X, BookOpen } from "lucide-react";

export function AddWord() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    word: "",
    translation: "",
    type: "",
    notes: "",
  });

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
      // Add the word first (without the old example field)
      const wordId = await WordsService.addWord(
        user.uid,
        formData.word.trim(),
        formData.translation.trim(),
        formData.type?.trim() || undefined,
        formData.notes?.trim() || undefined
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
          <label
            htmlFor="type"
            className="block text-sm font-semibold text-gray-700 mb-2"
          >
            Type
          </label>
          <select
            name="type"
            id="type"
            value={formData.type}
            onChange={handleChange}
            className="block w-full border-2 border-gradient-to-r from-blue-300 to-purple-300 rounded-xl px-4 py-3 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-lg font-medium text-gray-800 hover:from-blue-100 hover:to-purple-100 transition-all duration-200"
            style={{
              background: "linear-gradient(135deg, #dbeafe 0%, #f3e8ff 100%)",
              border: "2px solid transparent",
              backgroundClip: "padding-box",
              borderImage: "linear-gradient(135deg, #3b82f6, #8b5cf6) 1",
            }}
          >
            <option value="" className="text-gray-500">
              Select type (optional)
            </option>
            <option value="noun" className="text-blue-700 font-medium">
              📚 Noun
            </option>
            <option value="verb" className="text-green-700 font-medium">
              🏃 Verb
            </option>
            <option value="adjective" className="text-purple-700 font-medium">
              ✨ Adjective
            </option>
            <option value="adverb" className="text-orange-700 font-medium">
              ⚡ Adverb
            </option>
            <option value="phrasal verb" className="text-red-700 font-medium">
              🔗 Phrasal Verb
            </option>
          </select>
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
