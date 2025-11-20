import React from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Navbar from "./components/Navbar";
import PDFStorage from "./components/PDFStorage";
import PricingPage from "./components/PricingPage.jsx";
import Login from "./components/auth/Login.jsx";
import Register from "./components/auth/Register.jsx";
import PendingApproval from "./components/auth/PendingApproval.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import { AuthProvider } from "./hooks/useAuth";
import MentorApproval from "@/pages/admin/MentorApproval.jsx";
import AdminPaymentPanel from "@/components/AdminPaymentPanel.jsx";
import Profile from "@/pages/Profile.jsx";
import CreditDashboard from "@/components/CreditDashboard.jsx";
import Downloads from "@/pages/Downloads.jsx";

import PostsFeed from "@/pages/PostsFeed.jsx";
import CreatePost from "@/pages/CreatePost.jsx";
import PostDetail from "@/pages/PostDetail.jsx";
import UserPosts from "@/pages/UserPosts.jsx";

import "react-pdf/dist/Page/AnnotationLayer.css";
import "react-pdf/dist/Page/TextLayer.css";
import "./index.css";

function App() {
  return (
    <AuthProvider>
      <Navbar />
      <main className="container mx-auto px-4 py-8">
        <Routes>
          {/* main app pages */}
          <Route path="/" element={<PDFStorage />} />
          <Route path="/pricing" element={<PricingPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/pending-approval" element={<PendingApproval />} />

          {/* Solving hub - public listing and post detail */}
          <Route path="/posts" element={<PostsFeed />} />
          <Route path="/posts/:id" element={<PostDetail />} />

          {/* Protected routes (user-only) */}
          <Route element={<ProtectedRoute />}>
            <Route path="/profile" element={<Profile />} />
            <Route path="/credits" element={<CreditDashboard />} />
            <Route path="/posts/create" element={<CreatePost />} />
            <Route path="/my-posts" element={<UserPosts />} />
            <Route path="/downloads" element={<Downloads />} />
          </Route>

          {/* Mentor-only */}
          <Route element={<ProtectedRoute requireApprovedMentor />}>
            {/* <Route path="/mentor/dashboard" element={<MentorDashboard />} /> */}
          </Route>

          {/* Admin-only */}
          <Route element={<ProtectedRoute requireAdmin />}>
            <Route
              path="/admin"
              element={<Navigate to="/admin/mentors" replace />}
            />
            <Route path="/admin/mentors" element={<MentorApproval />} />
            <Route path="/admin/payments" element={<AdminPaymentPanel />} />
          </Route>

          {/* fallback */}
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
    </AuthProvider>
  );
}

export default App;
