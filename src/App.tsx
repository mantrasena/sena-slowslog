import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate, useParams } from "react-router-dom";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index";
import Profile from "./pages/Profile";
import Write from "./pages/Write";
import StoryDetail from "./pages/StoryDetail";

import Auth from "./pages/Auth";
import ResetPassword from "./pages/ResetPassword";
import Admin from "./pages/Admin";
import Settings from "./pages/Settings";
import Bookmarks from "./pages/Bookmarks";
import InnerCircle from "./pages/InnerCircle";
import InnerCirclePayment from "./pages/InnerCirclePayment";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const ProfileRedirect = () => {
  const { username } = useParams();
  return <Navigate to={`/@${username}`} replace />;
};

const App = () => (

  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <BrowserRouter>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/:username" element={<Profile />} />
            <Route path="/profile/:username" element={<ProfileRedirect />} />
            <Route path="/write" element={<Write />} />
            <Route path="/story/:id" element={<StoryDetail />} />
            
            <Route path="/admin" element={<Admin />} />
            <Route path="/settings" element={<Settings />} />
            <Route path="/bookmarks" element={<Bookmarks />} />
            <Route path="/inner-circle" element={<InnerCircle />} />
            <Route path="/inner-circle/payment" element={<InnerCirclePayment />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
