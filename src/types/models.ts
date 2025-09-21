import { Timestamp } from 'firebase/firestore'

export interface UserDoc {
  name: string
  email: string
  photoURL?: string
  createdAt: Timestamp
}

export interface WordDoc {
  word: string
  translation: string
  type?: 'verb' | 'noun' | 'phrasal verb' | 'adjective' | 'adverb'
  notes?: string
  createdAt: Timestamp
  attempts: number
  successes: number
  fails: number
  lastAttempt?: Timestamp
  lastResult?: 'success' | 'fail'
}

export interface ExampleSentence {
  id: string
  sentence: string
  translation?: string
  createdAt: Timestamp
}

export interface SessionDoc {
  type: 'quiz' | 'flashcards'
  score: number
  total: number
  playedAt: Timestamp
  duration?: number // in seconds
  failedWords?: string[] // array of word IDs that were failed
  correctWords?: string[] // array of word IDs that were correct
  difficulty?: string // overall difficulty of the session
}

export interface QuizHistoryItem {
  id: string
  date: string
  type: 'quiz' | 'flashcards'
  score: number
  total: number
  percentage: number
  duration: number
  failedWords: Array<{
    wordId: string
    word: string
    translation: string
  }>
  correctWords: Array<{
    wordId: string
    word: string
    translation: string
  }>
}

export type Difficulty = 'easy' | 'medium' | 'hard'

export interface QuizItem {
  word: string
  translation: string
  options: string[]
  correctAnswer: string
}

export interface GameSession {
  type: 'quiz' | 'flashcards'
  items: WordDoc[]
  currentIndex: number
  score: number
  total: number
  startTime: Date
}
