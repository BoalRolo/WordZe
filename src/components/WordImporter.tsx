import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { WordsService } from "@/services/words";
import { ExamplesService } from "@/services/examples";
import { capitalizeWord, capitalizeSentence } from "@/utils/formatting";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2,
} from "lucide-react";

interface WordData {
  id?: string;
  word: string;
  translation: string;
  type?: string;
  difficulty?: string;
  examples?: Array<{
    sentence: string;
    translation: string;
  }>;
  notes?: string;
}

interface ImportResult {
  success: boolean;
  imported: number;
  skipped: number;
  errors: string[];
  total: number;
}

export function WordImporter() {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0];
    if (selectedFile) {
      if (
        selectedFile.type === "application/json" ||
        selectedFile.name.endsWith(".json")
      ) {
        setFile(selectedFile);
        setError("");
        setResult(null);
      } else {
        setError("Por favor, selecione um ficheiro JSON válido.");
        setFile(null);
      }
    }
  };

  const validateWordData = (data: any): WordData[] => {
    if (!data || typeof data !== "object") {
      throw new Error("Formato de ficheiro inválido. Deve ser um objeto JSON.");
    }

    let words: WordData[] = [];

    // Verificar se é um array direto de palavras
    if (Array.isArray(data)) {
      words = data;
    }
    // Verificar se tem propriedade 'words'
    else if (data.words && Array.isArray(data.words)) {
      words = data.words;
    }
    // Verificar se tem propriedade 'adjectives' (para compatibilidade)
    else if (data.adjectives && Array.isArray(data.adjectives)) {
      words = data.adjectives;
    } else {
      throw new Error(
        "Formato não reconhecido. O ficheiro deve conter um array de palavras na propriedade 'words' ou 'adjectives'."
      );
    }

    // Validar cada palavra
    return words.map((word, index) => {
      if (!word.word || !word.translation) {
        throw new Error(
          `Palavra ${index + 1}: 'word' e 'translation' são obrigatórios.`
        );
      }

      return {
        id: word.id || `imported_${Date.now()}_${index}`,
        word: word.word.toString().trim(),
        translation: word.translation.toString().trim(),
        type: word.type || "adjective",
        difficulty: word.difficulty || "intermediate",
        examples: word.examples || [],
        notes: word.notes || `Importado em ${new Date().toLocaleDateString()}`,
      };
    });
  };

  const importWords = async () => {
    if (!file || !user) return;

    setImporting(true);
    setError("");
    setResult(null);

    try {
      // Ler o ficheiro
      const fileContent = await file.text();
      const jsonData = JSON.parse(fileContent);

      // Validar dados
      const wordsToImport = validateWordData(jsonData);

      if (wordsToImport.length === 0) {
        throw new Error("Nenhuma palavra encontrada no ficheiro.");
      }

      // Obter palavras existentes para evitar duplicatas
      const existingWords = await WordsService.getWords(user.uid);
      const existingWordsSet = new Set(
        existingWords.map((w) => w.word.toLowerCase().trim())
      );

      // Filtrar palavras novas
      const newWords = wordsToImport.filter(
        (word) => !existingWordsSet.has(word.word.toLowerCase().trim())
      );

      const importResult: ImportResult = {
        success: true,
        imported: 0,
        skipped: wordsToImport.length - newWords.length,
        errors: [],
        total: wordsToImport.length,
      };

      // Importar palavras
      for (const [index, wordData] of newWords.entries()) {
        try {
          // Adicionar palavra principal
          const wordId = await WordsService.addWord(
            user.uid,
            wordData.word,
            wordData.translation,
            wordData.type,
            wordData.notes
          );

          // Adicionar exemplos
          if (wordData.examples && Array.isArray(wordData.examples)) {
            for (const example of wordData.examples) {
              await ExamplesService.addExample(
                user.uid,
                wordId,
                example.sentence,
                example.translation
              );
            }
          }

          importResult.imported++;
        } catch (error) {
          const errorMsg = `Erro ao importar "${wordData.word}": ${
            error instanceof Error ? error.message : "Erro desconhecido"
          }`;
          importResult.errors.push(errorMsg);
          console.error(errorMsg, error);
        }
      }

      setResult(importResult);
    } catch (error) {
      const errorMessage =
        error instanceof Error
          ? error.message
          : "Erro ao processar o ficheiro.";
      setError(errorMessage);
      console.error("Erro na importação:", error);
    } finally {
      setImporting(false);
    }
  };

  const resetImporter = () => {
    setFile(null);
    setResult(null);
    setError("");
    // Reset file input
    const fileInput = document.getElementById(
      "word-file-input"
    ) as HTMLInputElement;
    if (fileInput) {
      fileInput.value = "";
    }
  };

  return (
    <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
      <div className="flex items-center space-x-3 mb-6">
        <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
          <Upload className="h-6 w-6 text-white" />
        </div>
        <div>
          <h3 className="text-xl font-bold text-gray-900">Importar Palavras</h3>
          <p className="text-gray-600">
            Carregue um ficheiro JSON com palavras para importar
          </p>
        </div>
      </div>

      {/* File Selection */}
      <div className="space-y-4">
        <div>
          <label
            htmlFor="word-file-input"
            className="block text-sm font-medium text-gray-700 mb-2"
          >
            Selecionar Ficheiro JSON
          </label>
          <div className="flex items-center space-x-4">
            <input
              id="word-file-input"
              type="file"
              accept=".json,application/json"
              onChange={handleFileSelect}
              className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-sm file:font-medium file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              disabled={importing}
            />
            {file && (
              <button
                onClick={resetImporter}
                className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                disabled={importing}
              >
                <X className="h-5 w-5" />
              </button>
            )}
          </div>
        </div>

        {/* File Info */}
        {file && (
          <div className="flex items-center space-x-3 p-3 bg-blue-50 rounded-lg border border-blue-200">
            <FileText className="h-5 w-5 text-blue-600" />
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-900">{file.name}</p>
              <p className="text-xs text-blue-700">
                {(file.size / 1024).toFixed(1)} KB
              </p>
            </div>
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="flex items-center space-x-3 p-4 bg-red-50 rounded-lg border border-red-200">
            <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
            <p className="text-red-700 text-sm">{error}</p>
          </div>
        )}

        {/* Import Button */}
        {file && !error && (
          <button
            onClick={importWords}
            disabled={importing}
            className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white font-semibold py-3 px-6 rounded-xl shadow-lg hover:shadow-xl transform hover:scale-105 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none"
          >
            {importing ? (
              <div className="flex items-center justify-center space-x-2">
                <Loader2 className="h-5 w-5 animate-spin" />
                <span>Importando...</span>
              </div>
            ) : (
              "Importar Palavras"
            )}
          </button>
        )}
      </div>

      {/* Import Result */}
      {result && (
        <div className="mt-6 p-4 rounded-lg border">
          {result.success ? (
            <div className="space-y-3">
              <div className="flex items-center space-x-3">
                <CheckCircle className="h-6 w-6 text-green-500" />
                <h4 className="text-lg font-semibold text-green-900">
                  Importação Concluída!
                </h4>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div className="bg-green-50 p-3 rounded-lg">
                  <p className="text-green-800 font-medium">Importadas</p>
                  <p className="text-2xl font-bold text-green-900">
                    {result.imported}
                  </p>
                </div>
                <div className="bg-yellow-50 p-3 rounded-lg">
                  <p className="text-yellow-800 font-medium">Já Existentes</p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {result.skipped}
                  </p>
                </div>
              </div>

              {result.errors.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-red-800 mb-2">
                    Erros ({result.errors.length}):
                  </p>
                  <div className="max-h-32 overflow-y-auto space-y-1">
                    {result.errors.map((error, index) => (
                      <p
                        key={index}
                        className="text-xs text-red-700 bg-red-50 p-2 rounded"
                      >
                        {error}
                      </p>
                    ))}
                  </div>
                </div>
              )}

              <button
                onClick={resetImporter}
                className="w-full mt-4 bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Importar Outro Ficheiro
              </button>
            </div>
          ) : (
            <div className="flex items-center space-x-3">
              <AlertTriangle className="h-6 w-6 text-red-500" />
              <p className="text-red-700">Erro na importação</p>
            </div>
          )}
        </div>
      )}

      {/* Format Help */}
      <div className="mt-6 p-4 bg-gray-50 rounded-lg">
        <h4 className="text-sm font-medium text-gray-900 mb-2">
          Formato do Ficheiro JSON
        </h4>
        <p className="text-xs text-gray-600 mb-2">
          O ficheiro deve conter um array de palavras com a seguinte estrutura:
        </p>
        <pre className="text-xs bg-white p-2 rounded border overflow-x-auto">
          {`{
  "words": [
    {
      "word": "example",
      "translation": "exemplo",
      "type": "noun",
      "difficulty": "intermediate",
      "examples": [
        {
          "sentence": "This is an example.",
          "translation": "Isto é um exemplo."
        }
      ],
      "notes": "Optional notes"
    }
  ]
}`}
        </pre>
      </div>
    </div>
  );
}
