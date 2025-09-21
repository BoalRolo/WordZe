import { WordDoc } from "@/types/models";
import { QuizItem } from "@/types/models";

export class QuizService {
  static generateQuizItems(
    words: (WordDoc & { id: string })[],
    count: number = 10
  ): QuizItem[] {
    // Shuffle words and take the requested count
    const shuffledWords = this.shuffleArray([...words]).slice(0, count);

    return shuffledWords.map((word) => this.createQuizItem(word, words));
  }

  private static createQuizItem(
    word: WordDoc & { id: string },
    allWords: (WordDoc & { id: string })[]
  ): QuizItem {
    // Get 3 random distractor translations (excluding the correct one)
    const otherTranslations = allWords
      .filter((w) => w.id !== word.id && w.translation !== word.translation)
      .map((w) => w.translation);

    const shuffledDistractors = this.shuffleArray([...otherTranslations]);
    const distractors = shuffledDistractors.slice(0, 3);

    // Create options array with correct answer and distractors
    const options = this.shuffleArray([word.translation, ...distractors]);

    return {
      word: word.word,
      translation: word.translation,
      options,
      correctAnswer: word.translation,
    };
  }

  private static shuffleArray<T>(array: T[]): T[] {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  static validateAnswer(quizItem: QuizItem, selectedAnswer: string): boolean {
    return selectedAnswer === quizItem.correctAnswer;
  }

  static getRandomWords(
    words: (WordDoc & { id: string })[],
    count: number
  ): (WordDoc & { id: string })[] {
    return this.shuffleArray([...words]).slice(0, count);
  }
}
