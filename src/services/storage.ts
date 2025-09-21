import { 
  getStorage, 
  ref, 
  uploadBytes, 
  getDownloadURL, 
  deleteObject 
} from 'firebase/storage'
import { storage } from '@/lib/firebase'

export class StorageService {
  static async uploadProfilePhoto(userId: string, file: File): Promise<string> {
    try {
      // Create a reference to the file location
      const storageRef = ref(storage, `profile-photos/${userId}/${Date.now()}-${file.name}`)
      
      // Upload the file
      const snapshot = await uploadBytes(storageRef, file)
      
      // Get the download URL
      const downloadURL = await getDownloadURL(snapshot.ref)
      
      return downloadURL
    } catch (error) {
      console.error('Error uploading profile photo:', error)
      throw new Error('Failed to upload profile photo')
    }
  }

  static async deleteProfilePhoto(photoURL: string): Promise<void> {
    try {
      // Extract the file path from the URL
      const url = new URL(photoURL)
      const pathMatch = url.pathname.match(/\/o\/(.+)\?/)
      
      if (pathMatch) {
        const filePath = decodeURIComponent(pathMatch[1])
        const fileRef = ref(storage, filePath)
        await deleteObject(fileRef)
      }
    } catch (error) {
      console.error('Error deleting profile photo:', error)
      // Don't throw error for deletion failures as it's not critical
    }
  }
}
