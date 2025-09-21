# Firebase Setup Guide

## 🔥 Firebase Project Configuration

### 1. Firebase Console Setup

1. **Go to [Firebase Console](https://console.firebase.google.com/)**
2. **Select your project** (or create a new one)
3. **Enable required services:**

#### Authentication
- Go to **Authentication** → **Sign-in method**
- Enable **Email/Password** provider
- Save changes

#### Firestore Database
- Go to **Firestore Database**
- Click **Create database**
- Choose **Start in test mode** (for development)
- Select a location close to you

#### Storage
- Go to **Storage**
- Click **Get started**
- Choose **Start in test mode** (for development)
- Select the same location as Firestore

### 2. Web App Configuration

1. **Go to Project Settings** (gear icon)
2. **Scroll down to "Your apps"**
3. **Click "Add app" → Web app**
4. **Register your app** with a nickname
5. **Copy the configuration object**

### 3. Environment Variables

Create a `.env` file in your project root:

```env
# Firebase Configuration
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Storage CORS Configuration

If you're getting CORS errors with Firebase Storage, you need to configure CORS:

1. **Install Google Cloud SDK** (if not already installed)
2. **Create a CORS configuration file** (`cors.json`):

```json
[
  {
    "origin": ["http://localhost:5173", "http://localhost:5174", "http://localhost:5175", "http://192.168.1.122:5173"],
    "method": ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    "maxAgeSeconds": 3600
  }
]
```

3. **Apply CORS configuration**:
```bash
gsutil cors set cors.json gs://your-project-id.appspot.com
```

### 5. Security Rules

#### Firestore Rules
Go to **Firestore Database** → **Rules** and update:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can only access their own data
    match /users/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
      
      // Allow access to user's words and sessions
      match /words/{wordId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
      
      match /sessions/{sessionId} {
        allow read, write: if request.auth != null && request.auth.uid == userId;
      }
    }
  }
}
```

#### Storage Rules
Go to **Storage** → **Rules** and update:

```javascript
rules_version = '2';
service firebase.storage {
  match /b/{bucket}/o {
    // Users can only upload to their own profile photos
    match /profile-photos/{userId}/{allPaths=**} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
  }
}
```

### 6. Testing the Setup

1. **Start your development server**:
   ```bash
   npm run dev
   ```

2. **Test authentication**:
   - Try signing up with a new account
   - Check Firebase Console → Authentication for new users

3. **Test photo upload**:
   - Try uploading a profile photo
   - Check if it falls back to base64 if Storage fails

### 7. Troubleshooting

#### Common Issues:

1. **"Failed to load resource" errors**:
   - Check if your `.env` file has the correct values
   - Verify the Firebase project ID matches

2. **CORS errors**:
   - Configure CORS for Storage (see step 4)
   - Or use the base64 fallback (already implemented)

3. **Authentication errors**:
   - Make sure Email/Password is enabled in Firebase Console
   - Check if the API key is correct

4. **Storage errors**:
   - Verify Storage is enabled in Firebase Console
   - Check Storage security rules

### 8. Production Considerations

For production deployment:

1. **Update CORS configuration** to include your production domain
2. **Update Firestore rules** to be more restrictive
3. **Update Storage rules** to be more restrictive
4. **Use environment variables** for different environments
5. **Enable Firebase App Check** for additional security

## 🚀 Quick Fix for Development

If you want to get started quickly without configuring Storage CORS:

1. The app will automatically fall back to base64 encoding for photos
2. Photos will be stored as data URLs in Firestore
3. This works perfectly for development and small images
4. For production, configure Firebase Storage CORS properly
