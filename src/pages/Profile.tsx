import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useUserProfile } from "@/hooks/useUserProfile";
import { auth } from "@/lib/firebase";
import {
  updateProfile,
  updatePassword,
  deleteUser,
  reauthenticateWithCredential,
  EmailAuthProvider,
  updateEmail,
} from "firebase/auth";
import { doc, updateDoc, deleteDoc, getDoc } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { StorageService } from "@/services/storage";
import { prepareFirestoreUpdate } from "@/utils/firestore";
import { USE_FIREBASE_STORAGE, isValidImageFile } from "@/config/storage";
import { updateUserDocument } from "@/utils/userDocument";
import {
  User,
  Camera,
  Save,
  Key,
  Trash2,
  AlertTriangle,
  CheckCircle,
  Eye,
  EyeOff,
  Upload,
} from "lucide-react";

export function Profile() {
  const { user, logout } = useAuth();
  const {
    userProfile,
    photoURL: currentPhotoURL,
    refreshProfile,
  } = useUserProfile();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  // Profile data
  const [displayName, setDisplayName] = useState("");
  const [email, setEmail] = useState("");
  const [photoURL, setPhotoURL] = useState("");

  // Password change
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPasswords, setShowPasswords] = useState(false);

  // Account deletion
  const [deletePassword, setDeletePassword] = useState("");
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showDeletePassword, setShowDeletePassword] = useState(false);

  // Photo upload
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [photoPreview, setPhotoPreview] = useState("");

  useEffect(() => {
    if (user) {
      setDisplayName(user.displayName || userProfile?.name || "");
      setEmail(user.email || "");
      setPhotoURL(currentPhotoURL || "");
    }
  }, [user, userProfile, currentPhotoURL]);

  const handlePhotoUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file using configuration
      const validation = isValidImageFile(file);
      if (!validation.valid) {
        setError(validation.error || "Invalid file");
        return;
      }

      setPhotoFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadPhotoToFirebase = async (file: File): Promise<string> => {
    if (!user) throw new Error("User not authenticated");

    if (USE_FIREBASE_STORAGE) {
      // Use Firebase Storage (requires CORS configuration)
      try {
        const downloadURL = await StorageService.uploadProfilePhoto(
          user.uid,
          file
        );
        return downloadURL;
      } catch (error) {
        console.warn(
          "Firebase Storage upload failed, using base64 fallback:",
          error
        );
        // Fallback to base64
        return new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = (e) => {
            const result = e.target?.result as string;
            if (result) {
              resolve(result);
            } else {
              reject(new Error("Failed to read file"));
            }
          };
          reader.onerror = () => reject(new Error("Failed to read file"));
          reader.readAsDataURL(file);
        });
      }
    } else {
      // Use base64 encoding (no CORS issues)

      return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
          const result = e.target?.result as string;
          if (result) {
            resolve(result);
          } else {
            reject(new Error("Failed to read file"));
          }
        };
        reader.onerror = () => {
          reject(new Error("Failed to read file"));
        };
        reader.readAsDataURL(file);
      });
    }
  };

  const handleUpdateProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      let newPhotoURL = photoURL;
      const oldPhotoURL = photoURL;

      // Upload new photo if selected
      if (photoFile) {
        newPhotoURL = await uploadPhotoToFirebase(photoFile);

        // Handle old photo deletion based on configuration
        if (oldPhotoURL && oldPhotoURL !== newPhotoURL) {
          if (oldPhotoURL.startsWith("data:")) {
            // Old photo was base64, no need to delete from storage
          } else if (
            oldPhotoURL.startsWith("https://firebasestorage.googleapis.com") &&
            USE_FIREBASE_STORAGE
          ) {
            try {
              await StorageService.deleteProfilePhoto(oldPhotoURL);
            } catch (error) {
              console.warn(
                "Failed to delete old photo from Firebase Storage:",
                error
              );
            }
          } else if (
            oldPhotoURL.startsWith("https://firebasestorage.googleapis.com") &&
            !USE_FIREBASE_STORAGE
          ) {
            // Old photo was from Firebase Storage, but skipping deletion (Firebase Storage disabled)
          }
        }
      }

      // Update Firebase Auth profile (only displayName, not photoURL for base64)
      // Only update photoURL in Firebase Auth if it's a short URL (Firebase Storage URL)
      const authUpdateData: any = {
        displayName: displayName.trim(),
      };

      // Only add photoURL to Firebase Auth if it's not a long base64 string
      if (
        newPhotoURL &&
        !newPhotoURL.startsWith("data:") &&
        newPhotoURL.length < 1000
      ) {
        authUpdateData.photoURL = newPhotoURL;
      }

      await updateProfile(user, authUpdateData);

      // Use the utility function to ensure document exists and update it
      await updateUserDocument(user, {
        name: displayName.trim(),
        photoURL: newPhotoURL,
      });

      // Update local state to reflect changes
      setPhotoURL(newPhotoURL);
      setSuccess("Profile updated successfully!");
      setPhotoFile(null);
      setPhotoPreview("");

      // Clear success message after 3 seconds
      setTimeout(() => {
        setSuccess("");
      }, 3000);

      // Refresh the user profile to show updated data
      setTimeout(() => {
        refreshProfile();
      }, 500);
    } catch (error: any) {
      console.error("Profile update error:", error);

      // Provide more specific error messages
      if (error.code === "auth/network-request-failed") {
        setError("Network error. Please check your internet connection.");
      } else if (error.code === "auth/too-many-requests") {
        setError("Too many requests. Please try again later.");
      } else if (error.code === "permission-denied") {
        setError(
          "Permission denied. Please check your Firebase configuration."
        );
      } else if (error.message?.includes("CORS")) {
        setError(
          "Storage upload failed due to CORS configuration. Photo saved as base64 instead."
        );
        // Still show success since the profile was updated with base64 photo
        setSuccess(
          "Profile updated successfully! (Photo saved locally due to storage configuration)"
        );
        setPhotoFile(null);
        setPhotoPreview("");
      } else {
        setError(error.message || "Failed to update profile");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    if (newPassword.length < 6) {
      setError("Password must be at least 6 characters");
      return;
    }

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update password
      await updatePassword(user, newPassword);

      setSuccess("Password updated successfully!");
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        setError("Current password is incorrect");
      } else {
        setError(error.message || "Failed to update password");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");
    setSuccess("");

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email!,
        currentPassword
      );
      await reauthenticateWithCredential(user, credential);

      // Update email
      await updateEmail(user, email);

      setSuccess("Email updated successfully!");
      setCurrentPassword("");
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        setError("Current password is incorrect");
      } else {
        setError(error.message || "Failed to update email");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setLoading(true);
    setError("");

    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(
        user.email!,
        deletePassword
      );
      await reauthenticateWithCredential(user, credential);

      // Delete user document from Firestore
      const userDocRef = doc(db, "users", user.uid);
      await deleteDoc(userDocRef);

      // Delete user from Firebase Auth
      await deleteUser(user);

      // Logout and redirect
      await logout();
    } catch (error: any) {
      if (error.code === "auth/wrong-password") {
        setError("Password is incorrect");
      } else {
        setError(error.message || "Failed to delete account");
      }
      setLoading(false);
    }
  };

  if (!user) {
    return <div>Loading...</div>;
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center">
        <h1 className="text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent mb-2">
          Profile Settings
        </h1>
        <p className="text-lg text-gray-600">
          Manage your account information and preferences
        </p>
      </div>

      {/* Error/Success Messages */}
      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex items-center space-x-3">
          <AlertTriangle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700">{error}</p>
        </div>
      )}

      {success && (
        <div className="bg-green-50 border border-green-200 rounded-xl p-4 flex items-center space-x-3">
          <CheckCircle className="h-5 w-5 text-green-500 flex-shrink-0" />
          <p className="text-green-700">{success}</p>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Profile Information */}
        <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
          <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
            <User className="h-6 w-6 mr-3 text-blue-500" />
            Profile Information
          </h2>

          <form onSubmit={handleUpdateProfile} className="space-y-6">
            {/* Photo Upload */}
            <div className="text-center">
              <div className="relative inline-block">
                <div className="w-32 h-32 rounded-full bg-gradient-to-r from-blue-500 to-purple-600 flex items-center justify-center text-white text-4xl font-bold overflow-hidden">
                  {photoPreview ? (
                    <img
                      src={photoPreview}
                      alt="Profile preview"
                      className="w-full h-full object-cover"
                    />
                  ) : photoURL ? (
                    <img
                      src={photoURL}
                      alt="Profile"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="h-16 w-16" />
                  )}
                </div>
                <label className="absolute bottom-0 right-0 w-10 h-10 bg-blue-500 rounded-full flex items-center justify-center cursor-pointer hover:bg-blue-600 transition-colors">
                  <Camera className="h-5 w-5 text-white" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                </label>
              </div>
              <p className="text-sm text-gray-500 mt-2">
                Click to upload photo (max 5MB)
              </p>
              <p className="text-xs text-gray-400 mt-1">
                Photos are stored securely as base64 data. This ensures reliable
                uploads without CORS issues.
              </p>
            </div>

            {/* Display Name */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Display Name
              </label>
              <input
                type="text"
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your display name"
                required
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all"
                placeholder="Enter your email"
                required
              />
              <p className="text-sm text-gray-500 mt-1">
                Use the email change form below to update your email
              </p>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-gradient-to-r from-blue-500 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-blue-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
            >
              <Save className="h-5 w-5" />
              <span>{loading ? "Updating..." : "Update Profile"}</span>
            </button>
          </form>
        </div>

        {/* Password & Email Change */}
        <div className="space-y-6">
          {/* Change Password */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Key className="h-6 w-6 mr-3 text-green-500" />
              Change Password
            </h2>

            <form onSubmit={handleChangePassword} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPasswords ? "text" : "password"}
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    className="w-full px-4 py-3 pr-12 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                    placeholder="Enter current password"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswords(!showPasswords)}
                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPasswords ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  New Password
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Enter new password"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm New Password
                </label>
                <input
                  type={showPasswords ? "text" : "password"}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-green-500 focus:border-transparent transition-all"
                  placeholder="Confirm new password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white py-3 px-6 rounded-xl font-medium hover:from-green-600 hover:to-green-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Key className="h-5 w-5" />
                <span>{loading ? "Updating..." : "Update Password"}</span>
              </button>
            </form>
          </div>

          {/* Change Email */}
          <div className="bg-white rounded-2xl shadow-lg border border-gray-200 p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6 flex items-center">
              <Upload className="h-6 w-6 mr-3 text-purple-500" />
              Change Email
            </h2>

            <form onSubmit={handleChangeEmail} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Current Password
                </label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  className="w-full px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-purple-500 focus:border-transparent transition-all"
                  placeholder="Enter current password"
                  required
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-gradient-to-r from-purple-500 to-purple-600 text-white py-3 px-6 rounded-xl font-medium hover:from-purple-600 hover:to-purple-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center space-x-2"
              >
                <Upload className="h-5 w-5" />
                <span>{loading ? "Updating..." : "Update Email"}</span>
              </button>
            </form>
          </div>
        </div>
      </div>

      {/* Account Deletion */}
      <div className="bg-red-50 border border-red-200 rounded-2xl p-6">
        <h2 className="text-2xl font-bold text-red-900 mb-4 flex items-center">
          <Trash2 className="h-6 w-6 mr-3" />
          Danger Zone
        </h2>
        <p className="text-red-700 mb-6">
          Once you delete your account, there is no going back. Please be
          certain.
        </p>

        {!showDeleteConfirm ? (
          <button
            onClick={() => setShowDeleteConfirm(true)}
            className="bg-red-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-red-600 transition-all flex items-center space-x-2"
          >
            <Trash2 className="h-5 w-5" />
            <span>Delete Account</span>
          </button>
        ) : (
          <form onSubmit={handleDeleteAccount} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-red-700 mb-2">
                Enter your password to confirm deletion
              </label>
              <div className="relative">
                <input
                  type={showDeletePassword ? "text" : "password"}
                  value={deletePassword}
                  onChange={(e) => setDeletePassword(e.target.value)}
                  className="w-full px-4 py-3 pr-12 border border-red-300 rounded-xl focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all"
                  placeholder="Enter your password"
                  required
                />
                <button
                  type="button"
                  onClick={() => setShowDeletePassword(!showDeletePassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-red-500 hover:text-red-700"
                >
                  {showDeletePassword ? (
                    <EyeOff className="h-5 w-5" />
                  ) : (
                    <Eye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex space-x-4">
              <button
                type="submit"
                disabled={loading}
                className="bg-red-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-red-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                <Trash2 className="h-5 w-5" />
                <span>
                  {loading ? "Deleting..." : "Yes, Delete My Account"}
                </span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setShowDeleteConfirm(false);
                  setDeletePassword("");
                }}
                className="bg-gray-500 text-white py-3 px-6 rounded-xl font-medium hover:bg-gray-600 transition-all"
              >
                Cancel
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
