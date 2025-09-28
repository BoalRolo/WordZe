import { useState } from "react";
import { useAuth } from "@/hooks/useAuth";
import { WordsService } from "@/services/words";
import { ExamplesService } from "@/services/examples";
import { capitalizeWord, capitalizeSentence } from "@/utils/formatting";
import typesAndCategories from "@/data/typesAndCategories.json";
import {
  Upload,
  FileText,
  CheckCircle,
  AlertTriangle,
  X,
  Loader2,
  Info,
} from "lucide-react";

interface WordData {
  id?: string;
  word: string;
  translation: string;
  type?: string;
  difficulty?: string;
  categories?: string[];
  phonetic?: string;
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

interface WordImporterProps {
  onImportSuccess?: () => void;
  onClose?: () => void;
}

export function WordImporter({ onImportSuccess, onClose }: WordImporterProps) {
  const { user } = useAuth();
  const [file, setFile] = useState<File | null>(null);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [error, setError] = useState("");
  const [progress, setProgress] = useState({ current: 0, total: 0 });
  const [batchSize] = useState(10); // Process 10 words at a time

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

    // Obter tipos e categorias válidos
    const validTypes = typesAndCategories.wordTypes.map((t) => t.id);
    const validCategories = typesAndCategories.categories.map((c) => c.id);

    // Verificar duplicatas dentro do ficheiro
    const wordCounts = new Map<string, number[]>();
    words.forEach((word, index) => {
      if (word.word) {
        const wordKey = word.word.toLowerCase().trim();
        if (!wordCounts.has(wordKey)) {
          wordCounts.set(wordKey, []);
        }
        wordCounts.get(wordKey)!.push(index + 1);
      }
    });

    // Encontrar duplicatas
    const duplicates: string[] = [];
    wordCounts.forEach((positions, word) => {
      if (positions.length > 1) {
        duplicates.push(`"${word}" (posições: ${positions.join(', ')})`);
      }
    });

    if (duplicates.length > 0) {
      throw new Error(
        `Palavras duplicadas encontradas no ficheiro:\n${duplicates.join('\n')}\n\nPor favor, remova as duplicatas antes de importar.`
      );
    }

    // Validar cada palavra
    return words.map((word, index) => {
      if (!word.word || !word.translation) {
        throw new Error(
          `Palavra ${index + 1}: 'word' e 'translation' são obrigatórios.`
        );
      }

      // Validar tipo
      if (word.type && !validTypes.includes(word.type)) {
        throw new Error(
          `Palavra ${index + 1} ("${word.word}"): Tipo '${
            word.type
          }' inválido. Tipos válidos: ${validTypes.join(", ")}`
        );
      }

      // Validar categorias
      if (word.categories && Array.isArray(word.categories)) {
        const invalidCategories = word.categories.filter(
          (cat) => !validCategories.includes(cat)
        );
        if (invalidCategories.length > 0) {
          throw new Error(
            `Palavra ${index + 1} ("${
              word.word
            }"): Categorias inválidas: ${invalidCategories.join(
              ", "
            )}. Categorias válidas: ${validCategories.join(", ")}`
          );
        }
      }

      // Validar categorias duplicadas
      if (word.categories && Array.isArray(word.categories)) {
        const categoryCounts = new Map<string, number>();
        const duplicateCategories: string[] = [];
        
        word.categories.forEach((category) => {
          const count = categoryCounts.get(category) || 0;
          categoryCounts.set(category, count + 1);
          if (count === 1) {
            duplicateCategories.push(category);
          }
        });

        if (duplicateCategories.length > 0) {
          throw new Error(
            `Palavra ${index + 1} ("${word.word}"): Categorias duplicadas: ${duplicateCategories.join(", ")}. Por favor, remova as categorias duplicadas.`
          );
        }
      }

      // Validar example sentences
      if (word.examples && Array.isArray(word.examples)) {
        const wordToCheck = word.word.toLowerCase().trim();
        const invalidExamples = word.examples.filter((example) => {
          if (!example.sentence) return true;
          return !example.sentence.toLowerCase().includes(wordToCheck);
        });

        if (invalidExamples.length > 0) {
          throw new Error(
            `Palavra ${index + 1} ("${
              word.word
            }"): Example sentences devem conter a palavra "${
              word.word
            }". Exemplos inválidos: ${invalidExamples
              .map((ex) => `"${ex.sentence}"`)
              .join(", ")}`
          );
        }
      }

      return {
        id: word.id || `imported_${Date.now()}_${index}`,
        word: word.word.toString().trim(),
        translation: word.translation.toString().trim(),
        type: word.type || "adjective",
        difficulty: word.difficulty || "intermediate",
        categories: word.categories || [],
        phonetic: word.phonetic || "",
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

      // Importar palavras em batches
      setProgress({ current: 0, total: newWords.length });

      for (let i = 0; i < newWords.length; i += batchSize) {
        const batch = newWords.slice(i, i + batchSize);

        // Processar batch em paralelo
        const batchPromises = batch.map(async (wordData) => {
          try {
            // Adicionar palavra principal
            const wordId = await WordsService.addWord(
              user.uid,
              wordData.word,
              wordData.translation,
              wordData.type,
              wordData.notes,
              wordData.categories,
              wordData.difficulty,
              wordData.phonetic
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

            return { success: true, word: wordData.word };
          } catch (error) {
            const errorMsg = `Erro ao importar "${wordData.word}": ${
              error instanceof Error ? error.message : "Erro desconhecido"
            }`;
            console.error(errorMsg, error);
            return { success: false, word: wordData.word, error: errorMsg };
          }
        });

        // Aguardar batch atual
        const batchResults = await Promise.all(batchPromises);

        // Atualizar resultados
        batchResults.forEach((result) => {
          if (result.success) {
            importResult.imported++;
          } else {
            importResult.errors.push(result.error!);
          }
        });

        // Atualizar progresso
        setProgress({
          current: Math.min(i + batchSize, newWords.length),
          total: newWords.length,
        });

        // Pequena pausa entre batches para não sobrecarregar
        if (i + batchSize < newWords.length) {
          await new Promise((resolve) => setTimeout(resolve, 100));
        }
      }

      setResult(importResult);

      // Note: onImportSuccess will be called when user clicks "Close" button
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
              <div className="flex flex-col items-center space-y-2">
                <div className="flex items-center space-x-2">
                  <Loader2 className="h-5 w-5 animate-spin" />
                  <span>Importando...</span>
                </div>
                {progress.total > 0 && (
                  <div className="w-full">
                    <div className="flex justify-between text-xs text-white/80 mb-1">
                      <span>
                        {progress.current} de {progress.total}
                      </span>
                      <span>
                        {Math.round((progress.current / progress.total) * 100)}%
                      </span>
                    </div>
                    <div className="w-full bg-white/20 rounded-full h-2">
                      <div
                        className="bg-white rounded-full h-2 transition-all duration-300"
                        style={{
                          width: `${
                            (progress.current / progress.total) * 100
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                )}
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

              <div className="flex gap-3 mt-4">
                <button
                  onClick={resetImporter}
                  className="flex-1 bg-gray-100 text-gray-700 font-medium py-2 px-4 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  Importar Outro Ficheiro
                </button>
                {onClose && (
                  <button
                    onClick={onClose}
                    className="flex-1 bg-blue-600 text-white font-medium py-2 px-4 rounded-lg hover:bg-blue-700 transition-colors"
                  >
                    Close
                  </button>
                )}
              </div>
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
        <div className="flex items-center space-x-2 mb-2">
          <h4 className="text-sm font-medium text-gray-900">
            Formato do Ficheiro JSON
          </h4>
          <div className="relative group">
            <Info className="h-4 w-4 text-gray-500 cursor-help" />
            <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 w-96 bg-gray-900 text-white text-xs rounded-lg p-3 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
              <div className="space-y-2">
                <div>
                  <strong className="text-red-300">Tipos Válidos:</strong>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {typesAndCategories.wordTypes.map((type) => (
                      <span
                        key={type.id}
                        className="inline-block px-1 py-0.5 text-xs bg-gray-700 rounded"
                      >
                        {type.id}
                      </span>
                    ))}
                  </div>
                </div>
                <div>
                  <strong className="text-red-300">Categorias Válidas:</strong>
                  <div className="flex flex-wrap gap-1 mt-1 max-h-32 overflow-y-auto">
                    {typesAndCategories.categories.map((category) => (
                      <span
                        key={category.id}
                        className="inline-block px-1 py-0.5 text-xs bg-gray-700 rounded"
                      >
                        {category.id}
                      </span>
                    ))}
                  </div>
                </div>
                <p className="text-gray-300 text-xs">
                  <strong>Nota:</strong> Tipos ou categorias inválidos causarão
                  erro na importação.
                </p>
              </div>
              <div className="absolute top-full left-1/2 transform -translate-x-1/2 w-0 h-0 border-l-4 border-r-4 border-t-4 border-transparent border-t-gray-900"></div>
            </div>
          </div>
        </div>
        <p className="text-xs text-gray-600 mb-2">
          O ficheiro deve conter um array de palavras com a seguinte estrutura:
        </p>
        <pre className="text-xs bg-white p-2 rounded border whitespace-pre-wrap break-words">
          {`{
  "words": [
    {
      "word": "Keynote",
      "translation": "ponto principal / destaque",
      "type": "noun",
      "difficulty": "intermediate",
      "categories": ["social", "miscellaneous"],
      "phonetic": "/ˈkiːnoʊt/",
      "examples": [
        {
          "sentence": "The keynote of his speech was innovation.",
          "translation": "O keynote do discurso dele foi inovação."
        }
      ],
      "notes": "Usado muitas vezes em contextos de apresentações ou discursos."
    }
  ]
}`}
        </pre>
      </div>
    </div>
  );
}
