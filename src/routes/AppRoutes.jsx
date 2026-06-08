import { Routes, Route } from "react-router-dom";

import Login from "../pages/Login";
import Register from "../pages/Register";
import Dashboard from "../pages/Dashboard";
import Subjects from "../pages/Subjects";
import StudySessions from "../pages/StudySessions";
import SmartPlanner from "../pages/SmartPlanner";
import Achievements from "../pages/Achievements";
import Profile from "../pages/Profile";

import ProtectedRoute from "../components/ProtectedRoute";

function AppRoutes() {
  return (
    <Routes>
      <Route path="/" element={<Login />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />

      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      <Route
        path="/subjects"
        element={
          <ProtectedRoute>
            <Subjects />
          </ProtectedRoute>
        }
      />

      <Route
        path="/study-sessions"
        element={
          <ProtectedRoute>
            <StudySessions />
          </ProtectedRoute>
        }
      />

      <Route
        path="/smart-planner"
        element={
          <ProtectedRoute>
            <SmartPlanner />
          </ProtectedRoute>
        }
      />

      <Route
        path="/achievements"
        element={
          <ProtectedRoute>
            <Achievements />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Login />} />
    </Routes>
  );
}

export default AppRoutes;