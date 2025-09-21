import { useState, useEffect } from 'react'
import { User } from 'firebase/auth'
import { AuthService } from '@/services/auth'

export function useAuth() {
  const [user, setUser] = useState<User | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const unsubscribe = AuthService.onAuthStateChanged((user) => {
      setUser(user)
      setLoading(false)
    })

    return unsubscribe
  }, [])

  const logout = async () => {
    try {
      await AuthService.signOut()
    } catch (error) {
      console.error('Error signing out:', error)
    }
  }

  return { user, loading, logout }
}
