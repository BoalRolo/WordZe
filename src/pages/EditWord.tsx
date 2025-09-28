import { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { WordsService } from "@/services/words";
import { ExamplesService } from "@/services/examples";
import { Plus, X, BookOpen, ArrowLeft } from "lucide-react";

export function EditWord() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const { id } = useParams<{ id: string }>();
  const [loading, setLoading] = useState(false);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");

  const [formData, setFormData] = useState({
    word: "",
    translation: "",
    type: "",
    notes: "",
  });

  const [examples, setExamples] = useState<
    Array<{ id?: string; sentence: string; translation: string }>
  >([]);
  const [originalExamples, setOriginalExamples] = useState<
    Array<{ id: string; sentence: string; translation: string }>
  >([]);

  useEffect(() => {
    if (user && id) {
      loadWordData();
    }
  }, [user, id]);

  const loadWordData = async () => {
    if (!user || !id) return;

    setLoadingData(true);
    try {
      // Load word data
      const word = await WordsService.getWord(user.uid, id);
      if (word) {
        setFormData({
          word: word.word,
          translation: word.translation,
          type: word.type || "",
          notes: word.notes || "",
        });
      }

      // Load example sentences
      const examplesData = await ExamplesService.getExamples(user.uid, id);
      const examplesWithId = examplesData.map((ex) => ({
        id: ex.id,
        sentence: ex.sentence,
        translation: ex.translation || "",
      }));

      setExamples(
        examplesWithId.length > 0
          ? examplesWithId
          : [{ sentence: "", translation: "" }]
      );
      setOriginalExamples(examplesWithId);
    } catch (error) {
      console.error("Error loading word data:", error);
      setError("Failed to load word data");
    } finally {
      setLoadingData(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !id) return;

    // Validate that at least one example sentence is provided
    const validExamples = examples.filter((ex) => ex.sentence.trim() !== "");
    if (validExamples.length === 0) {
      setError("At least one example sentence is required");
      return;
    }

    setLoading(true);
    setError("");

    try {
      // Update the word
      await WordsService.updateWord(user.uid, id, {
        word: formData.word.trim(),
        translation: formData.translation.trim(),
        type: (formData.type?.trim() as 'noun' | 'verb' | 'adjective' | 'adverb' | 'phrase' | 'idiom') || undefined,
        notes: formData.notes?.trim() || undefined,
      });

      // Update example sentences
      const currentExampleIds = examples
        .filter((ex) => ex.id)
        .map((ex) => ex.id!);
      const originalExampleIds = originalExamples.map((ex) => ex.id);

      // Delete removed examples
      const toDelete = originalExampleIds.filter(
        (id) => !currentExampleIds.includes(id)
      );
      for (const exampleId of toDelete) {
        await ExamplesService.deleteExample(user.uid, id, exampleId);
      }

      // Update or create examples
      for (const example of validExamples) {
        if (example.id) {
          // Update existing example
          await ExamplesService.updateExample(
            user.uid,
            id,
            example.id,
            example.sentence.trim(),
            example.translation.trim() || undefined
          );
        } else {
          // Create new example
          await ExamplesService.addExample(
            user.uid,
            id,
            example.sentence.trim(),
            example.translation.trim() || undefined
          );
        }
      }

      navigate("/words");
    } catch (err: any) {
      setError(err.message || "Failed to update word");
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

  const updateExample = (
    index: number,
    field: "sentence" | "translation",
    value: string
  ) => {
    const updatedExamples = [...examples];
    updatedExamples[index] = { ...updatedExamples[index], [field]: value };
    setExamples(updatedExamples);
  };

  const removeExample = (index: number) => {
    // Don't allow removing if it's the only example
    if (examples.length > 1) {
      setExamples(examples.filter((_, i) => i !== index));
    }
  };

  const addNewExampleField = () => {
    setExamples([...examples, { sentence: "", translation: "" }]);
  };

  if (loadingData) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
      </div>
    );
  }

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
          Edit Word
        </h1>
        <p
          className="text-lg text-gray-600"
          style={{ fontSize: "1.125rem", color: "#6b7280" }}
        >
          Update your word with new information and examples
        </p>
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

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
        {/* Word and Translation */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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

          {/* Example Sentences List */}
          <div className="space-y-4">
            {examples.map((example, index) => (
              <div
                key={index}
                className="bg-blue-50 border border-blue-200 rounded-xl p-4"
              >
                <div className="flex items-center justify-between mb-3">
                  <span className="text-sm font-medium text-gray-700">
                    Example {index + 1}
                  </span>
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
                      placeholder={`Example: "I ${
                        formData.word || "word"
                      } every day"`}
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
                      placeholder={`Translation: "Eu ${
                        formData.translation || "translation"
                      } todos os dias"`}
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
            <ArrowLeft className="w-4 h-4 mr-2 inline" />
            Cancel
          </button>
          <button
            type="submit"
            disabled={loading}
            className="px-8 py-3 border border-transparent rounded-xl shadow-lg text-sm font-semibold text-white bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 transform hover:scale-105 transition-all duration-200"
          >
            {loading ? "Updating..." : "Update Word"}
          </button>
        </div>
      </form>
    </div>
  );
}
