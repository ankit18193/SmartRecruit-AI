import React, { useState, useEffect } from "react";
import RecruiterProfile from './pages/RecruiterProfile';
import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { Toaster } from "react-hot-toast";
import ProtectedRoute from "./components/auth/ProtectedRoute";
import ManageJobs from './pages/recruiter/ManageJobs';
import RecruiterJobDetails from './pages/RecruiterJobDetails';



import RecruiterSettings from './pages/settings';


import CandidateSettings from './pages/candidate/Settings';


import AIInterview from './pages/candidate/AIInterview';
import BrowseJobs from "./pages/candidate/BrowseJobs";
import InterviewPage from "./pages/recruiter/InterviewPage";
import RecruiterCandidateView from "./pages/recruiter/CandidateProfile";
import CandidateProfile from "./pages/candidate/CandidateProfile";

import Login from "./pages/login";
import Signup from "./pages/Signup";

import Dashboard from "./pages/Dashboard";
import CandidateDashboard from "./pages/CandidateDashboard";
import JobDetails from "./pages/JobDetails";
import MyApplications from "./pages/candidate/MyApplications";
import Candidates from './pages/recruiter/Candidates';
import AIRanking from './pages/recruiter/AIRanking';
import Analytics from './pages/recruiter/Analytics';

function App() {

  const [auth, setAuth] = useState({
    token: localStorage.getItem("token"),
    role: localStorage.getItem("role"),
  });

  const [loading, setLoading] = useState(true);

  useEffect(() => {

    const syncAuth = () => {
      setAuth({
        token: localStorage.getItem("token"),
        role: localStorage.getItem("role"),
      });
    };

    syncAuth();
    setLoading(false);

    window.addEventListener("storage", syncAuth);
    return () => window.removeEventListener("storage", syncAuth);

  }, []);

  const getHomeRoute = () => {
    const token = localStorage.getItem("token");
    const role = localStorage.getItem("role");

    if (!token) return <Navigate to="/login" />;
    if (role === "recruiter") return <Navigate to="/admin" />;
    
    if (role === "candidate") return <Navigate to="/dashboard" />;
    return <Navigate to="/login" />;
  };

  if (loading) {
    return <div style={{ textAlign: "center", marginTop: "100px" }}>Loading...</div>;
  }


  return (
    <Router>
      <Toaster position="top-right" />

      <Routes>

        {/* Public Routes */}

        <Route
          path="/login"
          element={auth.token ? getHomeRoute() : <Login />}
        />

        <Route
          path="/signup"
          element={auth.token ? getHomeRoute() : <Signup />}
        />

        {/* Root Route */}

        <Route path="/" element={getHomeRoute()} />

        {/* Recruiter Dashboard */}

        <Route
          path="/admin"
          element={
            <ProtectedRoute allowedRoles={["recruiter"]}>
              <Dashboard />
            </ProtectedRoute>
          }
        />

        {/* Candidate Interview */}

        <Route path="/interview/:jobId" element={<AIInterview />} />

        

        {/* Candidate Space */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute allowedRoles={["candidate"]}>
              <CandidateDashboard />
            </ProtectedRoute>
          }
        />

        <Route
          path="/explore"
          element={
            <ProtectedRoute allowedRoles={["candidate"]}>
              <BrowseJobs />
            </ProtectedRoute>
          }
        />

        {/* Manage Jobs */}

        <Route
          path="/jobs"
          element={
            <ProtectedRoute allowedRoles={["recruiter"]}>
              <ManageJobs />
            </ProtectedRoute>
          }
        />

        {/* Recruiter Routes */}

        <Route
          path="/recruiter/candidates"
          element={
            <ProtectedRoute allowedRoles={["recruiter"]}>
              <Candidates />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/ai-ranking"
          element={
            <ProtectedRoute allowedRoles={["recruiter"]}>
              <AIRanking />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/analytics"
          element={
            <ProtectedRoute allowedRoles={["recruiter"]}>
              <Analytics />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/settings"
          element={
            <ProtectedRoute allowedRoles={["recruiter"]}>
              <RecruiterSettings />
            </ProtectedRoute>
          }
        />
        
        <Route
          path="/recruiter/job/:id"
          element={<RecruiterJobDetails />}
        />




        <Route
         path="/recruiter-profile"
          element={<RecruiterProfile />} 
          />

        <Route
          path="/job/:id"
          element={
            <ProtectedRoute allowedRoles={["candidate"]}>
              <JobDetails />
            </ProtectedRoute>
          }
        />

        <Route
          path="/recruiter/interview/:id"
          element={
            <ProtectedRoute allowedRoles={["recruiter"]}>
              <InterviewPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/my-applications"
          element={
            <ProtectedRoute allowedRoles={["candidate"]}>
              <MyApplications />
            </ProtectedRoute>
          }
        />

        {/* Recruiter viewing Candidate Profile */}
        <Route
          path="/recruiter/candidate/:id"
          element={
            <ProtectedRoute allowedRoles={["recruiter"]}>
              <RecruiterCandidateView /> 
            </ProtectedRoute>
          }
        />

        <Route
          path="/settings"
          element={
            <ProtectedRoute allowedRoles={["candidate", "recruiter"]}>
              <CandidateSettings />
            </ProtectedRoute>
          }
        />



        <Route
          path="/profile"
          element={
            <ProtectedRoute role="candidate">
              <CandidateProfile />
            </ProtectedRoute>
          }
        />

        {/* Fallback */}

        <Route path="*" element={<Navigate to="/" />} />

      </Routes>

    </Router>
  );
}

export default App;