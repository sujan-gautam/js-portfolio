import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import Index from "./pages/Index.tsx";
import About from "./pages/About.tsx";
import Feed from "./pages/Feed.tsx";
import Portfolio from "./pages/Portfolio.tsx";
import Contact from "./pages/Contact.tsx";
import NotFound from "./pages/NotFound.tsx";

import AdminLayout from "@/components/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import AdminAbout from "@/pages/admin/AdminAbout";
import AdminEducation from "@/pages/admin/AdminEducation";
import AdminFeed from "@/pages/admin/AdminFeed";
import AdminSliders from "@/pages/admin/AdminSliders";
import AdminPortfolio from "@/pages/admin/AdminPortfolio";
import AdminFunWork from "@/pages/admin/AdminFunWork";
import AdminVideos from "@/pages/admin/AdminVideos";
import AdminServices from "@/pages/admin/AdminServices";
import AdminStory from "@/pages/admin/AdminStory";
import AdminPopups from "@/pages/admin/AdminPopups";
import AdminAds from "@/pages/admin/AdminAds";
import AdminContact from "@/pages/admin/AdminContact";
import AdminVisitors from "@/pages/admin/AdminVisitors";
import AdminUsers from "@/pages/admin/AdminUsers";
import AdminApps from "@/pages/admin/AdminApps";
import AdminCustomers from "@/pages/admin/AdminCustomers";
import AdminWhatsNew from "@/pages/admin/AdminWhatsNew";
import AdminSettings from "@/pages/admin/AdminSettings";
import AdminMusic from "@/pages/admin/AdminMusic";
import AdminUpdates from "@/pages/admin/AdminUpdates";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <Routes>
          {/* Public */}
          <Route path="/" element={<Index />} />
          <Route path="/about" element={<About />} />
          <Route path="/feed" element={<Feed />} />
          <Route path="/portfolio" element={<Portfolio />} />
          <Route path="/contact" element={<Contact />} />

          {/* Admin */}
          <Route path="/admin" element={<AdminLayout />}>
            <Route index element={<Dashboard />} />
            <Route path="about" element={<AdminAbout />} />
            <Route path="education" element={<AdminEducation />} />
            <Route path="feed" element={<AdminFeed />} />
            <Route path="sliders" element={<AdminSliders />} />
            <Route path="portfolio" element={<AdminPortfolio />} />
            <Route path="funwork" element={<AdminFunWork />} />
            <Route path="videos" element={<AdminVideos />} />
            <Route path="services" element={<AdminServices />} />
            <Route path="story" element={<AdminStory />} />
            <Route path="popups" element={<AdminPopups />} />
            <Route path="ads" element={<AdminAds />} />
            <Route path="contact" element={<AdminContact />} />
            <Route path="visitors" element={<AdminVisitors />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="apps" element={<AdminApps />} />
            <Route path="customers" element={<AdminCustomers />} />
            <Route path="whatsnew" element={<AdminWhatsNew />} />
            <Route path="settings" element={<AdminSettings />} />
            <Route path="music" element={<AdminMusic />} />
            <Route path="updates" element={<AdminUpdates />} />
          </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>
        <Routes>
          <Route path="/admin/*" element={null} />
          <Route path="*" element={<BottomNav />} />
        </Routes>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
