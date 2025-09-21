# Deploy Instructions

## Firebase Setup

### 1. Install Firebase CLI

```bash
npm install -g firebase-tools
```

### 2. Login to Firebase

```bash
firebase login
```

### 3. Initialize Firebase Project

```bash
firebase init
```

Select:
- Firestore: Configure security rules and indexes files
- Hosting: Configure files for Firebase Hosting

### 4. Configure Environment Variables

1. Copy `env.example` to `.env`
2. Get your Firebase config from the Firebase Console
3. Fill in the environment variables

### 5. Deploy

```bash
# Build the project
npm run build

# Deploy to Firebase
firebase deploy
```

## Environment Variables

Create a `.env` file with your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## Firebase Console Setup

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable Authentication with Email/Password provider
4. Create a Firestore database
5. Deploy the security rules from `firestore.rules`
6. Get your web app configuration

## Security Rules

The Firestore security rules are already configured in `firestore.rules`. These rules ensure:

- Only authenticated users can access the database
- Users can only read/write their own data
- All subcollections inherit the parent's security rules

Deploy the rules with:

```bash
firebase deploy --only firestore:rules
```

## Hosting

The app is configured for Firebase Hosting. After building, deploy with:

```bash
firebase deploy --only hosting
```

## Development

For local development:

```bash
npm run dev
```

The app will be available at `http://localhost:5173`

## Production Build

```bash
npm run build
```

The built files will be in the `dist` directory, ready for deployment.
