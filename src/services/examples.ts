import {
  collection,
  addDoc,
  getDocs,
  deleteDoc,
  doc,
  query,
  where,
  orderBy,
  serverTimestamp,
} from "firebase/firestore";
import { db } from "@/lib/firebase";
import { ExampleSentence } from "@/types/models";

export class ExamplesService {
  static async addExample(
    userId: string,
    wordId: string,
    sentence: string,
    translation?: string
  ): Promise<string> {
    const exampleData = {
      sentence: sentence.toLowerCase().trim(),
      translation: translation?.toLowerCase().trim() || undefined,
      createdAt: serverTimestamp(),
    };

    // Remove undefined values before saving
    const cleanExampleData = Object.fromEntries(
      Object.entries(exampleData).filter(([_, value]) => value !== undefined)
    );

    const docRef = await addDoc(
      collection(db, "users", userId, "words", wordId, "examples"),
      cleanExampleData
    );

    return docRef.id;
  }

  static async getExamples(
    userId: string,
    wordId: string
  ): Promise<(ExampleSentence & { id: string })[]> {
    const examplesRef = collection(
      db,
      "users",
      userId,
      "words",
      wordId,
      "examples"
    );
    const q = query(examplesRef, orderBy("createdAt", "desc"));
    const snapshot = await getDocs(q);

    return snapshot.docs.map((doc) => ({
      ...(doc.data() as ExampleSentence),
      id: doc.id,
    }));
  }

  static async deleteExample(
    userId: string,
    wordId: string,
    exampleId: string
  ): Promise<void> {
    const exampleRef = doc(
      db,
      "users",
      userId,
      "words",
      wordId,
      "examples",
      exampleId
    );
    await deleteDoc(exampleRef);
  }

  static async updateExample(
    userId: string,
    wordId: string,
    exampleId: string,
    sentence: string,
    translation?: string
  ): Promise<void> {
    const exampleRef = doc(
      db,
      "users",
      userId,
      "words",
      wordId,
      "examples",
      exampleId
    );

    const updateData = {
      sentence: sentence.toLowerCase().trim(),
      translation: translation?.toLowerCase().trim() || undefined,
    };

    // Remove undefined values before saving
    const cleanUpdateData = Object.fromEntries(
      Object.entries(updateData).filter(([_, value]) => value !== undefined)
    );

    const { updateDoc } = await import("firebase/firestore");
    await updateDoc(exampleRef, cleanUpdateData);
  }
}
