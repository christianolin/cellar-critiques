import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Index from "@/pages/Index";
import Auth from "@/pages/Auth";
import Cellar from "@/pages/Cellar";
import Friends from "@/pages/Friends";
import Ratings from "@/pages/Ratings";
import Admin from "@/pages/Admin";
import Profile from "@/pages/Profile";
import FriendCellar from "@/pages/FriendCellar";
import FriendRatings from "@/pages/FriendRatings";
import NotFound from "@/pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
        <Route path="/" element={<Index />} />
        <Route path="/auth" element={<Auth />} />
        <Route path="/cellar" element={<Cellar />} />
        <Route path="/friends" element={<Friends />} />
        <Route path="/ratings" element={<Ratings />} />
        <Route path="/admin" element={<Admin />} />
        <Route path="/profile" element={<Profile />} />
          <Route path="/friends/:friendId/cellar" element={<FriendCellar />} />
          <Route path="/friends/:friendId/ratings" element={<FriendRatings />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
