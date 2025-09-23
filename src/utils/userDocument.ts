import { doc, getDoc, setDoc } from 'firebase/firestore'
import { db } from '@/lib/firebase'
import { UserDoc } from '@/types/models'
import { User } from 'firebase/auth'
import { cleanFirestoreData } from './firestore'

/**
 * Ensures a user document exists in Firestore
 * If it doesn't exist, creates it with the user's current data
 */
export async function ensureUserDocument(user: User): Promise<UserDoc> {
  const userDocRef = doc(db, 'users', user.uid)
  
  try {
    const userDoc = await getDoc(userDocRef)
    
    if (userDoc.exists()) {
      return userDoc.data() as UserDoc
    }
    
    // User document doesn't exist, create it
    
    const newUserDoc = cleanFirestoreData({
      name: user.displayName || user.email || 'User',
      email: user.email || '',
      photoURL: user.photoURL || undefined,
      createdAt: new Date() as any, // Will be converted to Timestamp by Firestore
    })
    
    await setDoc(userDocRef, newUserDoc)
    
    return newUserDoc as UserDoc
  } catch (error) {
    console.error('Error ensuring user document:', error)
    throw error
  }
}

/**
 * Updates a user document in Firestore
 * If the document doesn't exist, creates it first
 */
export async function updateUserDocument(
  user: User, 
  updateData: Partial<UserDoc>
): Promise<void> {
  const userDocRef = doc(db, 'users', user.uid)
  
  try {
    // Try to update the document
    const { updateDoc } = await import('firebase/firestore')
    const cleanData = cleanFirestoreData(updateData)
    await updateDoc(userDocRef, cleanData)
  } catch (error: any) {
    // If document doesn't exist, create it
    if (error.code === 'not-found') {
      await ensureUserDocument(user)
      
      // Try to update again
      const { updateDoc } = await import('firebase/firestore')
      const cleanData = cleanFirestoreData(updateData)
      await updateDoc(userDocRef, cleanData)
    } else {
      throw error
    }
  }
}
