import { useState, useEffect } from "react";
import { useAuth } from "./useAuth";
import { doc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { UserDoc } from "@/types/models";
import { ensureUserDocument } from "@/utils/userDocument";

export function useUserProfile() {
  const { user } = useAuth();
  const [userProfile, setUserProfile] = useState<UserDoc | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  useEffect(() => {
    if (!user) {
      setUserProfile(null);
      setLoading(false);
      return;
    }

    const fetchUserProfile = async () => {
      try {
        // Use the utility function to ensure document exists
        const userDoc = await ensureUserDocument(user);
        setUserProfile(userDoc);
      } catch (error) {
        console.error("Error fetching user profile:", error);
        setUserProfile(null);
      } finally {
        setLoading(false);
      }
    };

    fetchUserProfile();
  }, [user, refreshTrigger]);

  // Get the best available photo URL
  const getPhotoURL = (): string | null => {
    if (!user) return null;

    // First try to get from Firestore (for base64 images)
    if (userProfile?.photoURL) {
      return userProfile.photoURL;
    }

    // Fallback to Firebase Auth photoURL (for Firebase Storage URLs)
    if (user.photoURL && !user.photoURL.startsWith("data:")) {
      return user.photoURL;
    }

    return null;
  };

  // Get the best available display name
  const getDisplayName = (): string => {
    if (!user) return "User";

    // First try Firebase Auth displayName
    if (user.displayName) {
      return user.displayName;
    }

    // Fallback to Firestore name
    if (userProfile?.name) {
      return userProfile.name;
    }

    // Final fallback to email
    return user.email || "User";
  };

  const refreshProfile = () => {
    setRefreshTrigger((prev) => prev + 1);
  };

  return {
    user,
    userProfile,
    loading,
    photoURL: getPhotoURL(),
    displayName: getDisplayName(),
    email: user?.email || null,
    refreshProfile,
  };
}
