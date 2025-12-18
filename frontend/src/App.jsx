import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import Footer from "./components/Footer";
import PDFStorage from "./components/PDFStorage";
import PricingPage from "./components/PricingPage.jsx";
import Login from "./components/auth/Login.jsx";
import Register from "./components/auth/Register.jsx";
import { AuthProvider } from "@/context/AuthContext";
import ProtectedRoute from "@/components/auth/ProtectedRoute";

// Pages
import Home from "@/pages/Home";
import PublicProfile from "@/pages/PublicProfile";
import Connections from "@/pages/Connections";
import Profile from "@/pages/Profile";
import CreditDashboard from "@/pages/CreditDashboard";
import CreatePost from "@/pages/CreatePost";
import UserPosts from "@/pages/UserPosts";
import Downloads from "@/pages/Downloads";
import PendingApproval from "@/pages/PendingApproval";
import MentorApproval from "@/pages/admin/MentorApproval";
import AdminPaymentPanel from "@/pages/admin/AdminPaymentPanel";
import AdminComplaints from "@/pages/admin/AdminComplaints";
import AdminJoinRequestsPanel from "@/pages/admin/AdminJoinRequestsPanel";
import PostsFeed from "@/pages/PostsFeed";
import PostDetail from "@/pages/PostDetail";

// Community pages
import Communities from "@/pages/Communities";
import CommunityDetail from "@/pages/CommunityDetail";
import MyCommunities from "@/pages/MyCommunities";
import CreateCommunity from "@/pages/CreateCommunity";
import MentorDashboard from "@/pages/MentorDashboard";
import ApplyMentor from "@/pages/ApplyMentor";
import Mentors from "@/pages/Mentors";
import Chat from "@/pages/Chat";
import Notifications from "@/pages/Notifications";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <main className="container mx-auto">
        <Routes>
          {/* Main app pages */}
          <Route path="/" element={<Home />} />
          <Route path="/library" element={<PDFStorage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pending-approval" element={<PendingApproval />} />

          {/* Communities - Public */}
          <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/communities" element={<Communities />} />
          <Route path="/communities/:id" element={<CommunityDetail />} />

          {/* Public Profile */}
          <Route path="/profile/:id" element={<PublicProfile />} />
          <Route path="/connections" element={<Connections />} />

          {/* Mentors - Public */}
          <Route path="/mentors" element={<Mentors />} />

          {/* Solving hub - public listing and post detail */}
          <Route path="/posts" element={<PostsFeed />} />
          <Route path="/posts/:id" element={<PostDetail />} />

          {/* Protected routes (user-only) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/credits" element={<CreditDashboard />} />
            <Route path="/chat" element={<Chat />} />
            <Route path="/posts/create" element={<CreatePost />} />
            <Route path="/my-posts" element={<UserPosts />} />
            <Route path="/downloads" element={<Downloads />} />

            {/* Student: Apply to become mentor */}
            <Route path="/apply-mentor" element={<ApplyMentor />} />

            {/* Student: My joined communities */}
            <Route path="/my-communities" element={<MyCommunities />} />
          </Route>

          {/* Mentor-only (approved) */}
          <Route element={<ProtectedRoute requireApprovedMentor />}>
            <Route path="/mentor/dashboard" element={<MentorDashboard />} />
            <Route path="/communities/create" element={<CreateCommunity />} />
          </Route>

          {/* Admin-only */}
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route
              path="/admin"
              element={<Navigate to="/admin/mentors" replace />}
            />
            <Route path="/admin/mentors" element={<MentorApproval />} />
            <Route path="/admin/payments" element={<AdminPaymentPanel />} />
            <Route path="/admin/complaints" element={<AdminComplaints />} />
            <Route path="/admin/join-requests" element={<AdminJoinRequestsPanel />} />
          </Route>

        </Routes>
      </main>
      <Footer />
    </AuthProvider>
  );
}

export default App;