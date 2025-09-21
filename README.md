# WordZe - English Vocabulary Trainer

A web application for training English vocabulary with flashcards and quiz modes, built with React, TypeScript, and Firebase.

## Features

- **Authentication**: Email/password authentication with Firebase Auth
- **Word Management**: Add, edit, delete, and organize vocabulary words
- **Dynamic Difficulty**: Words are automatically categorized as Easy, Medium, or Hard based on performance
- **Flashcards**: Interactive flashcard mode for memorization
- **Quiz Mode**: Multiple choice questions with 4 options
- **Performance Tracking**: Track attempts, successes, and failures for each word
- **Filtering**: Filter words by difficulty or show only failed words
- **Dashboard**: View statistics and progress

## Tech Stack

- **Frontend**: React 18 + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Backend**: Firebase (Auth + Firestore)
- **Icons**: Lucide React
- **Routing**: React Router v6

## Project Structure

```
src/
├── components/          # Reusable UI components
│   ├── Layout.tsx      # Main layout with navigation
│   └── ProtectedRoute.tsx
├── hooks/              # Custom React hooks
│   └── useAuth.ts
├── lib/                # Firebase configuration
│   └── firebase.ts
├── pages/              # Page components
│   ├── Login.tsx
│   ├── Signup.tsx
│   ├── Dashboard.tsx
│   ├── Words.tsx
│   ├── AddWord.tsx
│   ├── Flashcards.tsx
│   └── Quiz.tsx
├── services/           # Business logic services
│   ├── auth.ts
│   ├── words.ts
│   ├── tracking.ts
│   ├── quiz.ts
│   └── difficulty.ts
├── types/              # TypeScript type definitions
│   └── models.ts
├── App.tsx
├── main.tsx
└── index.css
```

## Setup Instructions

### 1. Prerequisites

- Node.js (v16 or higher)
- npm or yarn
- Firebase project

### 2. Firebase Setup

1. Create a new Firebase project at [Firebase Console](https://console.firebase.google.com/)
2. Enable Authentication with Email/Password provider
3. Create a Firestore database
4. Deploy the security rules from `firestore.rules`
5. Get your Firebase configuration

### 3. Environment Configuration

1. Copy `env.example` to `.env`
2. Fill in your Firebase configuration:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

### 4. Install Dependencies

```bash
npm install
```

### 5. Development

```bash
npm run dev
```

The application will be available at `http://localhost:5173`

### 6. Build for Production

```bash
npm run build
```

## Data Model

### Firestore Structure

```
users (collection)
└── {userId} (document)
    ├── name: string
    ├── email: string
    ├── createdAt: timestamp
    ├── words (subcollection)
    │   └── {wordId} (document)
    │       ├── word: string
    │       ├── translation: string
    │       ├── type?: string
    │       ├── example?: string
    │       ├── notes?: string
    │       ├── createdAt: timestamp
    │       ├── attempts: number
    │       ├── successes: number
    │       ├── fails: number
    │       ├── lastAttempt?: timestamp
    │       └── lastResult?: "success" | "fail"
    └── sessions (subcollection)
        └── {sessionId} (document)
            ├── type: "quiz" | "flashcards"
            ├── score: number
            ├── total: number
            └── playedAt: timestamp
```

## Difficulty Algorithm

Words are automatically categorized based on performance:

- **Easy**: Success rate ≥ 80%
- **Hard**: Fails > Successes
- **Medium**: Everything else

## Security Rules

The Firestore security rules ensure that:
- Only authenticated users can access the database
- Users can only read/write their own data
- All subcollections inherit the parent's security rules

## Features in Detail

### Word Management
- Add words with translation, type, example, and notes
- Edit existing words
- Delete words
- Filter by difficulty or failed words only

### Flashcards
- Show word on front, translation on back
- Mark as correct/incorrect
- Progress tracking
- Session statistics

### Quiz Mode
- Multiple choice questions (4 options)
- Random selection of words
- Immediate feedback
- Score tracking

### Dashboard
- Total word count
- Global success rate
- Difficulty distribution
- Quick action buttons

## Future Enhancements

- Spaced repetition algorithm
- Import/export functionality
- Audio pronunciation
- Mobile app (PWA)
- Social features
- Advanced analytics

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## Deployment

### GitHub Pages

This project is configured for automatic deployment to GitHub Pages:

1. **Push to main branch** - The GitHub Actions workflow will automatically build and deploy
2. **Access your site** - Available at `https://yourusername.github.io/WordZe/`
3. **Custom domain** - You can configure a custom domain in GitHub Pages settings

### Manual Deployment

```bash
# Build the project
npm run build

# The dist folder contains the production build
# Deploy the contents of dist/ to your hosting service
```

## Environment Variables

For production deployment, make sure to set these environment variables in your hosting platform:

```env
VITE_FIREBASE_API_KEY=your_api_key_here
VITE_FIREBASE_AUTH_DOMAIN=your_project_id.firebaseapp.com
VITE_FIREBASE_PROJECT_ID=your_project_id
VITE_FIREBASE_STORAGE_BUCKET=your_project_id.appspot.com
VITE_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
VITE_FIREBASE_APP_ID=your_app_id
```

## License

MIT License - see LICENSE file for details
