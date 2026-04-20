import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import BottomNav from "@/components/BottomNav";
import Footer from "@/components/Footer";

// Public pages
import Index from "./pages/Index.tsx";
import About from "./pages/About.tsx";
import Feed from "./pages/Feed.tsx";
import Portfolio from "./pages/Portfolio.tsx";
import Contact from "./pages/Contact.tsx";
import NotFound from "./pages/NotFound.tsx";
import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";

// Admin layout
import AdminLayout from "@/components/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import AdminAbout from "@/pages/admin/AdminAbout";
import AdminSettings from "@/pages/admin/AdminSettings";

// Feed
import AdminFeedList from "@/pages/admin/AdminFeedList";
import AdminFeedForm from "@/pages/admin/AdminFeedForm";

// Music
import AdminMusicList from "@/pages/admin/AdminMusicList";
import AdminMusicForm from "@/pages/admin/AdminMusicForm";

// Story
import AdminStoryList from "@/pages/admin/AdminStoryList";
import AdminStoryEditor from "@/pages/admin/AdminStoryEditor";

// Education
import { AdminEducationList, AdminEducationForm } from "@/pages/admin/AdminEducation";

// Contact
import { AdminContactList, AdminContactForm } from "@/pages/admin/AdminContact";

// Portfolio
import { AdminPortfolioList, AdminPortfolioForm } from "@/pages/admin/AdminPortfolio";

// Fun Work
import { AdminFunWorkList, AdminFunWorkForm } from "@/pages/admin/AdminFunWork";

// Services
import { AdminServicesList, AdminServicesForm } from "@/pages/admin/AdminServices";

// Skills
import { AdminSkillsList, AdminSkillsForm } from "@/pages/admin/AdminSkills";

// Sliders
import { AdminSlidersList, AdminSlidersForm } from "@/pages/admin/AdminSliders";

// Updates
import { AdminUpdatesList, AdminUpdatesForm } from "@/pages/admin/AdminUpdates";

// Users
import { AdminUsersList, AdminUsersForm } from "@/pages/admin/AdminUsers";

// Videos
import { AdminVideosList, AdminVideosForm } from "@/pages/admin/AdminVideos";

// Visitors
import { AdminVisitorsList, AdminVisitorsForm } from "@/pages/admin/AdminVisitors";

import SEO from "@/components/SEO";

import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import Login from "@/pages/admin/Login";
import AuthSuccess from "@/pages/admin/AuthSuccess";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <SEO />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <Routes>
            {/* ── Public ────────────────────────────────── */}
            <Route path="/" element={<Index />} />
            <Route path="/about/" element={<About />} />
            <Route path="/feed/" element={<Feed />} />
            <Route path="/portfolio/" element={<Portfolio />} />
            <Route path="/contact/" element={<Contact />} />
            <Route path="/privacy/" element={<Privacy />} />
            <Route path="/terms/" element={<Terms />} />

            {/* ── Admin Login (Unprotected) ──────────────── */}
            <Route path="/admin/login" element={<Login />} />
            <Route path="/admin/auth-success" element={<AuthSuccess />} />

            {/* ── Admin Panel (Protected) ────────────────── */}
            <Route element={<ProtectedRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
                <Route index element={<Dashboard />} />
                <Route path="about"    element={<AdminAbout />} />
                <Route path="settings" element={<AdminSettings />} />

                {/* Feed */}
                <Route path="feed"          element={<AdminFeedList />} />
                <Route path="feed/add"      element={<AdminFeedForm />} />
                <Route path="feed/edit/:id" element={<AdminFeedForm />} />

                {/* Music */}
                <Route path="music"          element={<AdminMusicList />} />
                <Route path="music/add"      element={<AdminMusicForm />} />
                <Route path="music/edit/:id" element={<AdminMusicForm />} />

                {/* Story */}
                <Route path="story"          element={<AdminStoryList />} />
                <Route path="story/add"      element={<AdminStoryEditor />} />
                <Route path="story/edit/:id" element={<AdminStoryEditor />} />

                {/* Education */}
                <Route path="education"          element={<AdminEducationList />} />
                <Route path="education/add"      element={<AdminEducationForm />} />
                <Route path="education/edit/:id" element={<AdminEducationForm />} />

                {/* Contact */}
                <Route path="contact"          element={<AdminContactList />} />
                <Route path="contact/add"      element={<AdminContactForm />} />
                <Route path="contact/edit/:id" element={<AdminContactForm />} />

                {/* Portfolio */}
                <Route path="portfolio"          element={<AdminPortfolioList />} />
                <Route path="portfolio/add"      element={<AdminPortfolioForm />} />
                <Route path="portfolio/edit/:id" element={<AdminPortfolioForm />} />

                {/* Fun Work */}
                <Route path="funwork"          element={<AdminFunWorkList />} />
                <Route path="funwork/add"      element={<AdminFunWorkForm />} />
                <Route path="funwork/edit/:id" element={<AdminFunWorkForm />} />

                {/* Services */}
                <Route path="services"          element={<AdminServicesList />} />
                <Route path="services/add"      element={<AdminServicesForm />} />
                <Route path="services/edit/:id" element={<AdminServicesForm />} />

                {/* Skills */}
                <Route path="skills"          element={<AdminSkillsList />} />
                <Route path="skills/add"      element={<AdminSkillsForm />} />
                <Route path="skills/edit/:id" element={<AdminSkillsForm />} />

                {/* Sliders (used inside AdminAbout, also standalone) */}
                <Route path="sliders"          element={<AdminSlidersList />} />
                <Route path="sliders/add"      element={<AdminSlidersForm />} />
                <Route path="sliders/edit/:id" element={<AdminSlidersForm />} />

                {/* Updates */}
                <Route path="updates"          element={<AdminUpdatesList />} />
                <Route path="updates/add"      element={<AdminUpdatesForm />} />
                <Route path="updates/edit/:id" element={<AdminUpdatesForm />} />

                {/* Users */}
                <Route path="users"          element={<AdminUsersList />} />
                <Route path="users/add"      element={<AdminUsersForm />} />
                <Route path="users/edit/:id" element={<AdminUsersForm />} />

                {/* Videos */}
                <Route path="videos"          element={<AdminVideosList />} />
                <Route path="videos/add"      element={<AdminVideosForm />} />
                <Route path="videos/edit/:id" element={<AdminVideosForm />} />

                {/* Visitors */}
                <Route path="visitors"          element={<AdminVisitorsList />} />
                <Route path="visitors/add"      element={<AdminVisitorsForm />} />
                <Route path="visitors/edit/:id" element={<AdminVisitorsForm />} />
              </Route>
            </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Footer and Bottom Nav */}
        <Routes>
          <Route path="/admin/*" element={null} />
          <Route path="/feed/*" element={<BottomNav />} />
          <Route 
            path="*" 
            element={
              <>
                <Footer />
                <BottomNav />
              </>
            } 
          />
        </Routes>

      </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
