import {
  collection,
  addDoc,
  getDocs,
  doc,
  getDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  where,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { WordDoc } from "@/types/models";

export class WordsService {
  static async addWord(
    userId: string,
    word: string,
    translation: string,
    type?: string,
    example?: string,
    notes?: string
  ): Promise<string> {
    // Validate word type
    const validTypes = [
      "verb",
      "noun",
      "phrasal verb",
      "adjective",
      "adverb",
    ] as const;
    const validatedType =
      type && validTypes.includes(type as any) ? (type as any) : undefined;

    const wordData: Omit<WordDoc, "createdAt"> = {
      word,
      translation,
      type: validatedType,
      example: example || undefined,
      notes: notes || undefined,
      attempts: 0,
      successes: 0,
      fails: 0,
    };

    // Remove undefined values before sending to Firestore
    const cleanWordData = Object.fromEntries(
      Object.entries(wordData).filter(([_, value]) => value !== undefined)
    );

    const docRef = await addDoc(collection(db, "users", userId, "words"), {
      ...cleanWordData,
      createdAt: serverTimestamp(),
    });

    return docRef.id;
  }

  static async getWords(userId: string): Promise<(WordDoc & { id: string })[]> {
    const wordsRef = collection(db, "users", userId, "words");
    const q = query(wordsRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as WordDoc),
    }));
  }

  static async updateWord(
    userId: string,
    wordId: string,
    updates: Partial<
      Pick<WordDoc, "word" | "translation" | "type" | "example" | "notes">
    >
  ): Promise<void> {
    const wordRef = doc(db, "users", userId, "words", wordId);

    // Remove undefined values before sending to Firestore
    const cleanUpdates = Object.fromEntries(
      Object.entries(updates).filter(([_, value]) => value !== undefined)
    );

    await updateDoc(wordRef, cleanUpdates);
  }

  static async deleteWord(userId: string, wordId: string): Promise<void> {
    const wordRef = doc(db, "users", userId, "words", wordId);
    await deleteDoc(wordRef);
  }

  static async getFailedWords(
    userId: string
  ): Promise<(WordDoc & { id: string })[]> {
    const wordsRef = collection(db, "users", userId, "words");
    const q = query(wordsRef, where("lastResult", "==", "fail"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      id: doc.id,
      ...(doc.data() as WordDoc),
    }));
  }

  static async getWord(
    userId: string,
    wordId: string
  ): Promise<(WordDoc & { id: string }) | null> {
    const wordRef = doc(db, "users", userId, "words", wordId);
    const wordSnap = await getDoc(wordRef);

    if (wordSnap.exists()) {
      return {
        id: wordSnap.id,
        ...(wordSnap.data() as WordDoc),
      };
    }

    return null;
  }
}
