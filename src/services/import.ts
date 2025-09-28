import { WordsService } from "./words";
import { ExamplesService } from "./examples";

export interface ImportWord {
  word: string;
  translation: string;
  type?: "noun" | "verb" | "adjective" | "adverb" | "phrase" | "idiom";
  difficulty?: "beginner" | "intermediate" | "advanced";
  categories?: string[];
  examples?: Array<{
    sentence: string;
    translation?: string;
  }>;
  notes?: string;
}

export interface ImportData {
  words: ImportWord[];
}

export class ImportService {
  static async importWordsFromJSON(
    userId: string,
    jsonData: ImportData
  ): Promise<{
    success: number;
    errors: string[];
    total: number;
  }> {
    const results = {
      success: 0,
      errors: [] as string[],
      total: jsonData.words.length,
    };

    for (const wordData of jsonData.words) {
      try {
        // Validate required fields
        if (!wordData.word || !wordData.translation) {
          results.errors.push(
            `Word "${wordData.word || "unknown"}" is missing required fields (word, translation)`
          );
          continue;
        }

        // Validate type if provided
        const validTypes = ["noun", "verb", "adjective", "adverb", "phrase", "idiom"];
        const validatedType = wordData.type && validTypes.includes(wordData.type) 
          ? wordData.type 
          : undefined;

        // Validate difficulty if provided
        const validDifficulties = ["beginner", "intermediate", "advanced"];
        const validatedDifficulty = wordData.difficulty && validDifficulties.includes(wordData.difficulty)
          ? wordData.difficulty
          : undefined;

        // Add the word
        const wordId = await WordsService.addWord(
          userId,
          wordData.word.trim(),
          wordData.translation.trim(),
          validatedType,
          wordData.notes?.trim() || undefined,
          wordData.categories && wordData.categories.length > 0 ? wordData.categories : undefined,
          validatedDifficulty
        );

        // Add examples if provided
        if (wordData.examples && wordData.examples.length > 0) {
          for (const example of wordData.examples) {
            if (example.sentence.trim()) {
              await ExamplesService.addExample(
                userId,
                wordId,
                example.sentence.trim(),
                example.translation?.trim() || undefined
              );
            }
          }
        }

        results.success++;
      } catch (error: any) {
        results.errors.push(
          `Failed to import "${wordData.word}": ${error.message || "Unknown error"}`
        );
      }
    }

    return results;
  }

  static validateJSONStructure(data: any): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];

    if (!data || typeof data !== "object") {
      errors.push("JSON must be an object");
      return { isValid: false, errors };
    }

    if (!data.words || !Array.isArray(data.words)) {
      errors.push("JSON must contain a 'words' array");
      return { isValid: false, errors };
    }

    if (data.words.length === 0) {
      errors.push("Words array cannot be empty");
      return { isValid: false, errors };
    }

    // Validate each word
    data.words.forEach((word: any, index: number) => {
      if (!word.word || typeof word.word !== "string") {
        errors.push(`Word at index ${index}: 'word' field is required and must be a string`);
      }
      if (!word.translation || typeof word.translation !== "string") {
        errors.push(`Word at index ${index}: 'translation' field is required and must be a string`);
      }
      if (word.type && !["noun", "verb", "adjective", "adverb", "phrase", "idiom"].includes(word.type)) {
        errors.push(`Word at index ${index}: 'type' must be one of: noun, verb, adjective, adverb, phrase, idiom`);
      }
      if (word.difficulty && !["beginner", "intermediate", "advanced"].includes(word.difficulty)) {
        errors.push(`Word at index ${index}: 'difficulty' must be one of: beginner, intermediate, advanced`);
      }
      if (word.categories && !Array.isArray(word.categories)) {
        errors.push(`Word at index ${index}: 'categories' must be an array`);
      }
      if (word.examples && !Array.isArray(word.examples)) {
        errors.push(`Word at index ${index}: 'examples' must be an array`);
      }
    });

    return { isValid: errors.length === 0, errors };
  }
}
