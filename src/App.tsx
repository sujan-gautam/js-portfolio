import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { lazy } from "react";
import { BrowserRouter, Route, Routes, useSearchParams } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { StoryRedirect, VersionedPage } from "@/components/VersionedPage";
import VersionedStories from "@/components/VersionedStories";

// Public pages
import NotFound from "./pages/NotFound.tsx";
import Privacy from "./pages/Privacy.tsx";
import Terms from "./pages/Terms.tsx";
import TechyPos from "./pages/TechyPos.tsx";
import MitasKitchen from "./pages/MitasKitchen.tsx";
import ProjectIda from "./pages/ProjectIda.tsx";
import GoldenDeals from "./pages/GoldenDeals.tsx";
import WebWithFreelancer from "./pages/WebWithFreelancer.tsx";
import Trace from "./pages/Trace.tsx";

// Admin layout
import AdminLayout from "@/components/admin/AdminLayout";
import Dashboard from "@/pages/admin/Dashboard";
import AdminAbout from "@/pages/admin/AdminAbout";
import AdminSettings from "@/pages/admin/AdminSettings";

// Feed
import AdminFeedList from "@/pages/admin/AdminFeedList";
import AdminFeedForm from "@/pages/admin/AdminFeedForm";

// Blog
import AdminBlogList from "@/pages/admin/AdminBlogList";
import AdminBlogForm from "@/pages/admin/AdminBlogForm";
import AdminBlogIdeaBoard from "@/pages/admin/AdminBlogIdeaBoard";
import AdminBlogCategories from "@/pages/admin/AdminBlogCategories";

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
import AdminVisitors from "@/pages/admin/AdminVisitors";

import SEO from "@/components/SEO";
import AnalyticsTracker from "@/components/AnalyticsTracker";

import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/admin/ProtectedRoute";
import Login from "@/pages/admin/Login";
import AuthSuccess from "@/pages/admin/AuthSuccess";

const queryClient = new QueryClient();

const LegacyHome = lazy(() => import("@/legacy/Index"));
const LegacyAbout = lazy(() => import("@/legacy/About"));
const LegacyFeed = lazy(() => import("@/legacy/Feed"));
const LegacyPortfolio = lazy(() => import("@/legacy/Portfolio"));
const LegacyContact = lazy(() => import("@/legacy/Contact"));
const LegacyFeedPost = lazy(() => import("@/legacy/PostPage").then((module) => ({ default: module.FeedPostPage })));
const LegacyBlogPost = lazy(() => import("@/legacy/BlogPostPage"));
const LegacyBlog = lazy(() => import("@/legacy/Blog"));
const LegacyBottomNav = lazy(() => import("@/legacy/BottomNav"));
const Index = lazy(() => import("./pages/Index"));
const About = lazy(() => import("./pages/About"));
const Blog = lazy(() => import("./pages/Blog"));
const Feed = lazy(() => import("./pages/Feed"));
const Portfolio = lazy(() => import("./pages/Portfolio"));
const Contact = lazy(() => import("./pages/Contact"));
const FeedPostPage = lazy(() => import("./pages/PostPage").then((module) => ({ default: module.FeedPostPage })));
const BottomNav = lazy(() => import("@/components/BottomNav"));

function LegacyFeedRoute() {
  const [params] = useSearchParams();
  return <>{params.has("story") && <VersionedStories showLabel={false} />}<LegacyFeed /></>;
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <SEO />
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AnalyticsTracker />
          <Routes>
            {/* ── Public ────────────────────────────────── */}
            <Route path="/" element={<VersionedPage page="home" v1={<LegacyHome />} v2={<Index />} />} />
            <Route path="/about/" element={<VersionedPage page="about" v1={<LegacyAbout />} v2={<About />} />} />
            <Route path="/feed/" element={<VersionedPage page="feed" v1={<LegacyFeedRoute />} v2={<Feed />} />} />
            <Route path="/portfolio/" element={<VersionedPage page="portfolio" v1={<LegacyPortfolio />} v2={<Portfolio />} />} />
            <Route path="/contact/" element={<VersionedPage page="contact" v1={<LegacyContact />} v2={<Contact />} />} />
            <Route path="/privacy/" element={<Privacy />} />
            <Route path="/terms/" element={<Terms />} />
            <Route path="/techy-pos/" element={<TechyPos />} />
            <Route path="/mitas-kitchen/" element={<MitasKitchen />} />
            <Route path="/project-ida/" element={<ProjectIda />} />
            <Route path="/golden-deals/" element={<GoldenDeals />} />
            <Route path="/webwithfreelancer/" element={<WebWithFreelancer />} />
            <Route path="/trace/" element={<Trace />} />

            {/* ── SEO: Individual Post & Story Pages (Google indexable) ── */}
            <Route path="/feed/post/:id" element={<VersionedPage page="feedPost" v1={<LegacyFeedPost />} v2={<FeedPostPage />} />} />
            <Route path="/post/:id" element={<VersionedPage page="feedPost" v1={<LegacyFeedPost />} v2={<FeedPostPage />} />} />
            <Route path="/blog" element={<VersionedPage page="blog" v1={<LegacyBlog />} v2={<Blog />} />} />
            <Route path="/blog/:slug" element={<VersionedPage page="blogPost" v1={<LegacyBlogPost />} v2={<FeedPostPage />} />} />
            <Route path="/story/:id" element={<StoryRedirect />} />

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

                {/* Blog */}
                <Route path="blog"          element={<AdminBlogList />} />
                <Route path="blog/add"      element={<AdminBlogForm />} />
                <Route path="blog/edit/:id" element={<AdminBlogForm />} />
                <Route path="blog/ideas"    element={<AdminBlogIdeaBoard />} />
                <Route path="blog/categories" element={<AdminBlogCategories />} />

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
                <Route path="visitors"          element={<AdminVisitors />} />
              </Route>
            </Route>

          <Route path="*" element={<NotFound />} />
        </Routes>

        {/* Footer and Bottom Nav */}
        <Routes>
          <Route path="/admin/*" element={null} />
          <Route 
            path="*" 
            element={
              <VersionedPage page="navigation" v1={<LegacyBottomNav />} v2={<BottomNav />} quiet />
            } 
          />
        </Routes>


      </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
