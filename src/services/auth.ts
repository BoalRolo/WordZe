import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  User,
  UserCredential,
  updateProfile,
} from "firebase/auth";
import { doc, setDoc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { UserDoc } from "@/types/models";
import { cleanFirestoreData } from "@/utils/firestore";

export class AuthService {
  static async signUp(
    email: string,
    password: string,
    name: string
  ): Promise<UserCredential> {
    const userCredential = await createUserWithEmailAndPassword(
      auth,
      email,
      password
    );

    // Update Firebase Auth profile with display name
    await updateProfile(userCredential.user, {
      displayName: name,
    });

    // Create user document in Firestore
    const userDoc = cleanFirestoreData({
      name,
      email,
      photoURL: userCredential.user.photoURL,
      createdAt: new Date() as any, // Will be converted to Timestamp by Firestore
    });

    await setDoc(doc(db, "users", userCredential.user.uid), userDoc);

    return userCredential;
  }

  static async signIn(
    email: string,
    password: string
  ): Promise<UserCredential> {
    return signInWithEmailAndPassword(auth, email, password);
  }

  static async signOut(): Promise<void> {
    return signOut(auth);
  }

  static onAuthStateChanged(callback: (user: User | null) => void) {
    return onAuthStateChanged(auth, callback);
  }

  static async getCurrentUser(): Promise<User | null> {
    return auth.currentUser;
  }

  static async getUserProfile(uid: string): Promise<UserDoc | null> {
    const userDoc = await getDoc(doc(db, "users", uid));
    return userDoc.exists() ? (userDoc.data() as UserDoc) : null;
  }
}
