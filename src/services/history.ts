import {
  collection,
  getDocs,
  query,
  orderBy,
  limit,
  where,
  Timestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import {
  SessionDoc,
  QuizHistoryItem,
  WordDoc,
  ExampleSentence,
} from "@/types/models";

export class HistoryService {
  static async getQuizHistory(
    userId: string,
    limitCount: number = 50
  ): Promise<QuizHistoryItem[]> {
    const sessionsRef = collection(db, "users", userId, "sessions");
    const q = query(
      sessionsRef,
      orderBy("playedAt", "desc"),
      limit(limitCount)
    );
    const snapshot = await getDocs(q);

    const sessions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as SessionDoc),
    }));

    // Get all words to map IDs to word details
    const wordsRef = collection(db, "users", userId, "words");
    const wordsSnapshot = await getDocs(wordsRef);
    const wordsMap = new Map<string, WordDoc & { id: string }>();

    wordsSnapshot.docs.forEach((doc) => {
      wordsMap.set(doc.id, {
        id: doc.id,
        ...(doc.data() as WordDoc),
      });
    });

    return sessions.map((session) => {
      const percentage = Math.round((session.score / session.total) * 100);

      const failedWords = (session.failedWords || [])
        .map((wordId) => {
          const word = wordsMap.get(wordId);
          return {
            wordId,
            word: word?.word || "Unknown",
            translation: word?.translation || "Unknown",
          };
        })
        .filter((item) => item.word !== "Unknown");

      const correctWords = (session.correctWords || [])
        .map((wordId) => {
          const word = wordsMap.get(wordId);
          return {
            wordId,
            word: word?.word || "Unknown",
            translation: word?.translation || "Unknown",
          };
        })
        .filter((item) => item.word !== "Unknown");

      return {
        id: session.id,
        date:
          session.playedAt instanceof Timestamp
            ? session.playedAt.toDate().toLocaleDateString()
            : new Date(session.playedAt).toLocaleDateString(),
        type: session.type,
        score: session.score,
        total: session.total,
        percentage,
        duration: session.duration || 0,
        failedWords,
        correctWords,
      };
    });
  }

  static async getTodaySessions(userId: string): Promise<QuizHistoryItem[]> {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const sessionsRef = collection(db, "users", userId, "sessions");
    const q = query(
      sessionsRef,
      where("playedAt", ">=", Timestamp.fromDate(today)),
      orderBy("playedAt", "desc")
    );
    const snapshot = await getDocs(q);

    const sessions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as SessionDoc),
    }));

    // Get all words to map IDs to word details
    const wordsRef = collection(db, "users", userId, "words");
    const wordsSnapshot = await getDocs(wordsRef);
    const wordsMap = new Map<string, WordDoc & { id: string }>();

    wordsSnapshot.docs.forEach((doc) => {
      wordsMap.set(doc.id, {
        id: doc.id,
        ...(doc.data() as WordDoc),
      });
    });

    return sessions.map((session) => {
      const percentage = Math.round((session.score / session.total) * 100);

      const failedWords = (session.failedWords || [])
        .map((wordId) => {
          const word = wordsMap.get(wordId);
          return {
            wordId,
            word: word?.word || "Unknown",
            translation: word?.translation || "Unknown",
          };
        })
        .filter((item) => item.word !== "Unknown");

      const correctWords = (session.correctWords || [])
        .map((wordId) => {
          const word = wordsMap.get(wordId);
          return {
            wordId,
            word: word?.word || "Unknown",
            translation: word?.translation || "Unknown",
          };
        })
        .filter((item) => item.word !== "Unknown");

      return {
        id: session.id,
        date:
          session.playedAt instanceof Timestamp
            ? session.playedAt.toDate().toLocaleDateString()
            : new Date(session.playedAt).toLocaleDateString(),
        type: session.type,
        score: session.score,
        total: session.total,
        percentage,
        duration: session.duration || 0,
        failedWords,
        correctWords,
      };
    });
  }

  static async getFailedWordsFromHistory(
    userId: string,
    days: number = 7
  ): Promise<
    Array<{
      wordId: string;
      word: string;
      translation: string;
      failCount: number;
      lastFailed: string;
      examples?: Array<{ sentence: string; translation?: string }>;
      type?: string;
    }>
  > {
    // Get all sessions (all time) instead of filtering by date
    const sessionsRef = collection(db, "users", userId, "sessions");
    const q = query(sessionsRef, orderBy("playedAt", "desc"));
    const snapshot = await getDocs(q);

    const sessions = snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as SessionDoc),
    }));

    // Count failed words
    const failedWordsMap = new Map<
      string,
      { count: number; lastFailed: Date }
    >();

    sessions.forEach((session) => {
      const sessionDate =
        session.playedAt instanceof Timestamp
          ? session.playedAt.toDate()
          : new Date(session.playedAt);

      (session.failedWords || []).forEach((wordId) => {
        const existing = failedWordsMap.get(wordId);
        if (existing) {
          existing.count++;
          if (sessionDate > existing.lastFailed) {
            existing.lastFailed = sessionDate;
          }
        } else {
          failedWordsMap.set(wordId, { count: 1, lastFailed: sessionDate });
        }
      });
    });

    // Get word details
    const wordsRef = collection(db, "users", userId, "words");
    const wordsSnapshot = await getDocs(wordsRef);
    const wordsMap = new Map<string, WordDoc & { id: string }>();

    wordsSnapshot.docs.forEach((doc) => {
      wordsMap.set(doc.id, {
        id: doc.id,
        ...(doc.data() as WordDoc),
      });
    });

    // Get examples for each failed word
    const failedWordsWithExamples = await Promise.all(
      Array.from(failedWordsMap.entries()).map(async ([wordId, data]) => {
        const word = wordsMap.get(wordId);

        // Get examples from subcollection
        let examples: Array<{ sentence: string; translation?: string }> = [];
        try {
          const examplesRef = collection(
            db,
            "users",
            userId,
            "words",
            wordId,
            "examples"
          );
          const examplesQuery = query(
            examplesRef,
            orderBy("createdAt", "desc")
          );
          const examplesSnapshot = await getDocs(examplesQuery);
          examples = examplesSnapshot.docs.map((doc) => ({
            sentence: doc.data().sentence,
            translation: doc.data().translation,
          }));
        } catch (error) {
          console.error(`Error loading examples for word ${wordId}:`, error);
        }

        return {
          wordId,
          word: word?.word || "Unknown",
          translation: word?.translation || "Unknown",
          failCount: data.count,
          lastFailed: data.lastFailed.toLocaleDateString(),
          examples: examples,
          type: word?.type || "unknown",
        };
      })
    );

    return failedWordsWithExamples
      .filter((item) => item.word !== "Unknown")
      .sort((a, b) => b.failCount - a.failCount)
      .slice(0, 10); // Show only top 10 failed words
  }
}
