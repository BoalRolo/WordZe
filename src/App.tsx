import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { Layout } from "@/components/Layout";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { Landing } from "@/pages/Landing";
import { Login } from "@/pages/Login";
import { Signup } from "@/pages/Signup";
import { Dashboard } from "@/pages/Dashboard";
import { Words } from "@/pages/Words";
import { AddWord } from "@/pages/AddWord";
import { EditWord } from "@/pages/EditWord";
import { Games } from "@/pages/Games";
import { Flashcards } from "@/pages/Flashcards";
import { FlashcardSettings } from "@/pages/FlashcardSettings";
import { Quiz } from "@/pages/Quiz";
import { QuizSettings } from "@/pages/QuizSettings";
import { History } from "@/pages/History";
import { Profile } from "@/pages/Profile";

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/" element={<Landing />} />
        <Route path="/login" element={<Login />} />
        <Route path="/signup" element={<Signup />} />

        {/* Protected routes */}
        <Route
          path="/app"
          element={
            <ProtectedRoute>
              <Layout>
                <Navigate to="/dashboard" replace />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/words"
          element={
            <ProtectedRoute>
              <Layout>
                <Words />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/words/add"
          element={
            <ProtectedRoute>
              <Layout>
                <AddWord />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/words/edit/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <EditWord />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/games"
          element={
            <ProtectedRoute>
              <Layout>
                <Games />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/flashcards"
          element={
            <ProtectedRoute>
              <Layout>
                <Flashcards />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/flashcard-settings"
          element={
            <ProtectedRoute>
              <Layout>
                <FlashcardSettings />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/quiz"
          element={
            <ProtectedRoute>
              <Layout>
                <Quiz />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/quiz-settings"
          element={
            <ProtectedRoute>
              <Layout>
                <QuizSettings />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/history"
          element={
            <ProtectedRoute>
              <Layout>
                <History />
              </Layout>
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Layout>
                <Profile />
              </Layout>
            </ProtectedRoute>
          }
        />

        {/* Catch all route */}
        <Route path="*" element={<Navigate to="/dashboard" replace />} />
      </Routes>
    </Router>
  );
}

export default App;
