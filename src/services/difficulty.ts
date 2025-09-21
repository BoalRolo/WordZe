import { WordDoc } from '@/types/models'
import { Difficulty } from '@/types/models'

export class DifficultyService {
  static calculateDifficulty(word: WordDoc): Difficulty {
    const { attempts, successes, fails } = word

    if (attempts === 0) {
      return 'medium' // New words start as medium
    }

    const successRate = successes / attempts

    if (successRate >= 0.8) {
      return 'easy'
    }

    if (fails > successes) {
      return 'hard'
    }

    return 'medium'
  }

  static filterWordsByDifficulty(words: (WordDoc & { id: string })[], difficulty: Difficulty): (WordDoc & { id: string })[] {
    return words.filter(word => this.calculateDifficulty(word) === difficulty)
  }

  static getDifficultyStats(words: (WordDoc & { id: string })[]) {
    const stats = {
      easy: 0,
      medium: 0,
      hard: 0,
      total: words.length
    }

    words.forEach(word => {
      const difficulty = this.calculateDifficulty(word)
      stats[difficulty]++
    })

    return stats
  }
}
