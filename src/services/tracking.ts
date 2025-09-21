import {
  doc,
  updateDoc,
  addDoc,
  collection,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { SessionDoc } from "@/types/models";

export class TrackingService {
  static async recordAnswer(
    userId: string,
    wordId: string,
    isCorrect: boolean
  ): Promise<void> {
    const wordRef = doc(db, "users", userId, "words", wordId);

    // Get current word data to update counters
    const wordDoc = await import("firebase/firestore").then((firestore) =>
      firestore.getDoc(wordRef)
    );

    if (!wordDoc.exists()) {
      throw new Error("Word not found");
    }

    const currentData = wordDoc.data();
    const newAttempts = (currentData.attempts || 0) + 1;
    const newSuccesses = (currentData.successes || 0) + (isCorrect ? 1 : 0);
    const newFails = (currentData.fails || 0) + (isCorrect ? 0 : 1);

    const updateData = {
      attempts: newAttempts,
      successes: newSuccesses,
      fails: newFails,
      lastAttempt: serverTimestamp(),
      lastResult: isCorrect ? "success" : "fail",
    };

    // Remove undefined values before sending to Firestore
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(wordRef, cleanUpdateData);
  }

  static async saveSession(
    userId: string,
    type: "quiz" | "flashcards",
    score: number,
    total: number,
    duration?: number,
    failedWords?: string[],
    correctWords?: string[],
    difficulty?: string
  ): Promise<string> {
    const sessionData: Omit<SessionDoc, "playedAt"> = {
      type,
      score,
      total,
      duration,
      failedWords,
      correctWords,
      difficulty,
    };

    // Remove undefined values before saving
    const cleanSessionData = Object.fromEntries(
      Object.entries(sessionData).filter(([_, value]) => value !== undefined)
    );

    const docRef = await addDoc(collection(db, "users", userId, "sessions"), {
      ...cleanSessionData,
      playedAt: serverTimestamp(),
    });

    return docRef.id;
  }

  static calculateSuccessRate(attempts: number, successes: number): number {
    if (attempts === 0) return 0;
    return Math.round((successes / attempts) * 100);
  }
}
