import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import Landing from "./pages/Landing";
import { LoginPage, SignupPage, ForgotPasswordPage } from "./pages/Auth";
import ExplorePage from "./pages/Explore";
import FragranceDetail from "./pages/FragranceDetail";
import Dashboard from "./pages/Dashboard";
import { CollectionPage, WishlistPage } from "./pages/CollectionAndWishlist";
import FriendsPage from "./pages/Friends";
import UserProfile from "./pages/UserProfile";
import ActivityFeed from "./pages/ActivityFeed";
import SettingsPage from "./pages/Settings";
import FinderPage from "./pages/Finder";
import BlindDiscovery from "./pages/BlindDiscovery";
import WearingLogPage from "./pages/WearingLog";
import NotesPage from "./pages/NotesPage";
import DesignersPage from "./pages/DesignersPage";
import ComparePage from "./pages/ComparePage";
import AdminImport from "./pages/AdminImport";
import NewsPage from "./pages/NewsPage";
import TrendsPage from "./pages/TrendsPage";
import AboutPage from "./pages/AboutPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import ContactPage from "./pages/ContactPage";
import SearchPage from "./pages/SearchPage";
import DashboardFriends from "./pages/DashboardFriends";
import DashboardSettings from "./pages/DashboardSettings";
import SeasonsPage from "./pages/SeasonsPage";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Landing />} />
            <Route path="/login" element={<LoginPage />} />
            <Route path="/signup" element={<SignupPage />} />
            <Route path="/forgot-password" element={<ForgotPasswordPage />} />
            <Route path="/search" element={<SearchPage />} />
            <Route path="/fragrances" element={<ExplorePage />} />
            <Route path="/fragrance/:id" element={<FragranceDetail />} />
            <Route path="/me" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/me/collection" element={<ProtectedRoute><CollectionPage /></ProtectedRoute>} />
            <Route path="/me/wishlist" element={<ProtectedRoute><WishlistPage /></ProtectedRoute>} />
            <Route path="/me/log" element={<ProtectedRoute><WearingLogPage /></ProtectedRoute>} />
            <Route path="/me/friends" element={<ProtectedRoute><DashboardFriends /></ProtectedRoute>} />
            <Route path="/me/settings" element={<ProtectedRoute><DashboardSettings /></ProtectedRoute>} />
            <Route path="/settings" element={<ProtectedRoute><SettingsPage /></ProtectedRoute>} />
            <Route path="/friends" element={<FriendsPage />} />
            <Route path="/user/:username" element={<UserProfile />} />
            <Route path="/activity" element={<ActivityFeed />} />
            <Route path="/finder" element={<FinderPage />} />
            <Route path="/blind-discovery" element={<BlindDiscovery />} />
            <Route path="/notes" element={<NotesPage />} />
            <Route path="/designers" element={<DesignersPage />} />
            <Route path="/seasons" element={<SeasonsPage />} />
            <Route path="/compare" element={<ComparePage />} />
            <Route path="/news" element={<NewsPage />} />
            <Route path="/trends" element={<TrendsPage />} />
            <Route path="/admin/import" element={<AdminImport />} />
            <Route path="/about" element={<AboutPage />} />
            <Route path="/privacy" element={<PrivacyPage />} />
            <Route path="/terms" element={<TermsPage />} />
            <Route path="/contact" element={<ContactPage />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
