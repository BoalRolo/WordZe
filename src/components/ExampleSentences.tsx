import { useState, useEffect } from "react";
import { ExamplesService } from "@/services/examples";
import { ExampleSentence } from "@/types/models";
import { Plus, Edit2, Trash2, Save, X, BookOpen } from "lucide-react";
import { capitalizeSentence } from "@/utils/formatting";

interface ExampleSentencesProps {
  userId: string;
  wordId: string;
  word: string;
  translation: string;
}

export function ExampleSentences({
  userId,
  wordId,
  word,
  translation,
}: ExampleSentencesProps) {
  const [examples, setExamples] = useState<
    (ExampleSentence & { id: string })[]
  >([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newSentence, setNewSentence] = useState("");
  const [newTranslation, setNewTranslation] = useState("");
  const [editSentence, setEditSentence] = useState("");
  const [editTranslation, setEditTranslation] = useState("");

  useEffect(() => {
    loadExamples();
  }, [userId, wordId]);

  const loadExamples = async () => {
    try {
      const examplesData = await ExamplesService.getExamples(userId, wordId);
      setExamples(examplesData);
    } catch (error) {
      console.error("Error loading examples:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddExample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newSentence.trim()) return;

    try {
      await ExamplesService.addExample(
        userId,
        wordId,
        newSentence,
        newTranslation
      );
      setNewSentence("");
      setNewTranslation("");
      setShowAddForm(false);
      await loadExamples();
    } catch (error) {
      console.error("Error adding example:", error);
    }
  };

  const handleEditExample = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingId || !editSentence.trim()) return;

    try {
      await ExamplesService.updateExample(
        userId,
        wordId,
        editingId,
        editSentence,
        editTranslation
      );
      setEditingId(null);
      setEditSentence("");
      setEditTranslation("");
      await loadExamples();
    } catch (error) {
      console.error("Error updating example:", error);
    }
  };

  const handleDeleteExample = async (exampleId: string) => {
    if (!confirm("Are you sure you want to delete this example?")) return;

    try {
      await ExamplesService.deleteExample(userId, wordId, exampleId);
      await loadExamples();
    } catch (error) {
      console.error("Error deleting example:", error);
    }
  };

  const startEdit = (example: ExampleSentence & { id: string }) => {
    setEditingId(example.id);
    setEditSentence(example.sentence);
    setEditTranslation(example.translation || "");
  };

  const cancelEdit = () => {
    setEditingId(null);
    setEditSentence("");
    setEditTranslation("");
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold text-gray-900 flex items-center">
          <BookOpen className="h-5 w-5 mr-2 text-blue-500" />
          Example Sentences
        </h3>
        <button
          onClick={() => setShowAddForm(!showAddForm)}
          className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <Plus className="h-4 w-4 mr-1" />
          Add Example
        </button>
      </div>

      {/* Add Form */}
      {showAddForm && (
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <form onSubmit={handleAddExample} className="space-y-3">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Example Sentence
              </label>
              <input
                type="text"
                value={newSentence}
                onChange={(e) => setNewSentence(e.target.value)}
                placeholder={`Example: "I ${word} every day"`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Translation (Optional)
              </label>
              <input
                type="text"
                value={newTranslation}
                onChange={(e) => setNewTranslation(e.target.value)}
                placeholder={`Translation: "Eu ${translation} todos os dias"`}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div className="flex space-x-2">
              <button
                type="submit"
                className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                <Save className="h-4 w-4 mr-1" />
                Add Example
              </button>
              <button
                type="button"
                onClick={() => setShowAddForm(false)}
                className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Examples List */}
      <div className="space-y-3">
        {examples.length === 0 ? (
          <div className="text-center py-6 text-gray-500">
            <BookOpen className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No example sentences yet.</p>
            <p className="text-sm">Add some examples to help with learning!</p>
          </div>
        ) : (
          examples.map((example) => (
            <div
              key={example.id}
              className="bg-white border border-gray-200 rounded-lg p-4"
            >
              {editingId === example.id ? (
                <form onSubmit={handleEditExample} className="space-y-3">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Example Sentence
                    </label>
                    <input
                      type="text"
                      value={editSentence}
                      onChange={(e) => setEditSentence(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Translation (Optional)
                    </label>
                    <input
                      type="text"
                      value={editTranslation}
                      onChange={(e) => setEditTranslation(e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    />
                  </div>
                  <div className="flex space-x-2">
                    <button
                      type="submit"
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                    >
                      <Save className="h-4 w-4 mr-1" />
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={cancelEdit}
                      className="inline-flex items-center px-3 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Cancel
                    </button>
                  </div>
                </form>
              ) : (
                <div className="space-y-2">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <p className="text-gray-900 font-medium">
                        "{capitalizeSentence(example.sentence)}"
                      </p>
                      {example.translation && (
                        <p className="text-gray-600 text-sm mt-1">
                          "{capitalizeSentence(example.translation)}"
                        </p>
                      )}
                    </div>
                    <div className="flex space-x-1 ml-4">
                      <button
                        onClick={() => startEdit(example)}
                        className="p-1 text-gray-400 hover:text-blue-600 transition-colors"
                        title="Edit example"
                      >
                        <Edit2 className="h-4 w-4" />
                      </button>
                      <button
                        onClick={() => handleDeleteExample(example.id)}
                        className="p-1 text-gray-400 hover:text-red-600 transition-colors"
                        title="Delete example"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
