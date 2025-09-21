/**
 * Storage configuration
 *
 * This file controls how photos are stored in the application.
 * You can easily switch between Firebase Storage and base64 encoding.
 */

// Set to true to use Firebase Storage (requires CORS configuration)
// Set to false to use base64 encoding (works without CORS setup)
export const USE_FIREBASE_STORAGE = false;

// Firebase Storage configuration
export const STORAGE_CONFIG = {
  // Maximum file size in bytes (5MB)
  MAX_FILE_SIZE: 5 * 1024 * 1024,

  // Allowed file types
  ALLOWED_TYPES: [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/gif",
    "image/webp",
  ],

  // Storage path prefix
  STORAGE_PATH: "profile-photos",
} as const;

// Helper function to check if file is valid
export function isValidImageFile(file: File): {
  valid: boolean;
  error?: string;
} {
  if (file.size > STORAGE_CONFIG.MAX_FILE_SIZE) {
    return { valid: false, error: "File size must be less than 5MB" };
  }

  if (!STORAGE_CONFIG.ALLOWED_TYPES.includes(file.type as any)) {
    return {
      valid: false,
      error: "Please select a valid image file (JPEG, PNG, GIF, WebP)",
    };
  }

  return { valid: true };
}
