import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/context/AuthContext";
import AuthPage from "@/pages/AuthPage";
import ClosetPage from "@/pages/ClosetPage";
import SuggestionPage from "@/pages/SuggestionPage";
import StatsPage from "@/pages/StatsPage";
import TrendsPage from "@/pages/TrendsPage";
import ProfilePage from "@/pages/ProfilePage";
import NotFound from "@/pages/NotFound";

function AppRoutes() {
  const { user, loading } = useAuth();

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
    </div>
  );

  if (!user) return (
    <Routes>
      <Route path="/auth" element={<AuthPage />} />
      <Route path="*" element={<Navigate to="/auth" replace />} />
    </Routes>
  );

  return (
    <Routes>
      <Route path="/" element={<ClosetPage />} />
      <Route path="/suggestion" element={<SuggestionPage />} />
      <Route path="/tendances" element={<TrendsPage />} />
      <Route path="/stats" element={<StatsPage />} />
      <Route path="/profil" element={<ProfilePage />} />
      <Route path="/auth" element={<Navigate to="/" replace />} />
      <Route path="*" element={<NotFound />} />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
        <Toaster richColors position="top-right" />
      </AuthProvider>
    </BrowserRouter>
  );
}
