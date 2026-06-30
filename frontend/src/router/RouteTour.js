import React, { useContext } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import Home from "../pages/Home";
import Login from "../pages/Login";
import Admin from "../pages/Admin";
import AdminReports from "../pages/admin/AdminReports";
import VerificationRequests from "../pages/admin/VerificationRequests";
import AdminProfile from "../pages/admin/AdminProfile";
import Register from "../pages/Register";
import Userlist from "../pages/Userlist";
import { AuthContext } from "../context/authContext";
import { userColumns } from "../components/datatable/datatablesource";
import UserpageA from "../pages/UserpageA";
import UpdateuserA from "../pages/UpdateuserA";
import Profile from "../pages/Profile";
import Profileupdate from "../pages/Profileupdate";
import Adduser from "../pages/Adduser";
import ContactUs from "../pages/ContactUs";
import ForgotPassword from "../pages/ForgotPassword";
import ResetPassword from "../pages/ResetPassword";
import AdminContactRequests from "../pages/AdminContactRequests";
import PrivacyPolicy from "../pages/PrivacyPolicy";
import Terms from "../pages/Terms";

import TravelBuddyHub from "../pages/social/TravelBuddyHub";
import CreateBuddyTrip from "../pages/social/CreateBuddyTrip";
import TravelBuddyDetails from "../pages/social/TravelBuddyDetails";
import ChatRoom from "../pages/social/ChatRoom";
import Settings from "../pages/social/Settings";
import PrivacySettings from "../pages/social/settings/PrivacySettings";
import SecuritySettings from "../pages/social/settings/SecuritySettings";
import SafetySettings from "../pages/social/settings/SafetySettings";
import TravelSafetyGuidelines from "../pages/social/settings/TravelSafetyGuidelines";
import NotificationsSettings from "../pages/social/settings/NotificationsSettings";
import LegalSettings from "../pages/social/settings/LegalSettings";
import FeltVibes from "../pages/social/FeltVibes";
import BlockedUsers from "../pages/social/BlockedUsers";
import EmergencyContacts from "../pages/social/EmergencyContacts";
import HelpSupport from "../pages/social/HelpSupport";
import ReportProblem from "../pages/social/ReportProblem";
import MyJourneys from "../pages/social/MyJourneys";
import JourneyDetailsPage from "../pages/social/JourneyDetailsPage";

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user } = useContext(AuthContext);

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.type) && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const RouteTour = () => {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/reset-password/:token" element={<ResetPassword />} />
      <Route path="/privacy-policy" element={<PrivacyPolicy />} />
      <Route path="/terms" element={<Terms />} />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <Home />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Admin />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/contacts"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminContactRequests />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/reports"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminReports />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/verifications"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <VerificationRequests />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/profile"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <AdminProfile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/profile/edit"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Profileupdate />
          </ProtectedRoute>
        }
      />

      <Route
        path="/admin/settings/security"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <SecuritySettings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/users"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Userlist columns={userColumns} />
          </ProtectedRoute>
        }
      />

      <Route
        path="/userpage"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <UserpageA />
          </ProtectedRoute>
        }
      />

      <Route
        path="/update"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <UpdateuserA />
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

      <Route
        path="/profile/:id"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/updateProfile"
        element={
          <ProtectedRoute>
            <Profileupdate />
          </ProtectedRoute>
        }
      />

      <Route
        path="/adduser"
        element={
          <ProtectedRoute allowedRoles={["admin"]}>
            <Adduser />
          </ProtectedRoute>
        }
      />

      <Route
        path="/contactus"
        element={
          <ProtectedRoute>
            <ContactUs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/contact"
        element={
          <ProtectedRoute>
            <ContactUs />
          </ProtectedRoute>
        }
      />

      <Route
        path="/report"
        element={
          <ProtectedRoute>
            <ReportProblem />
          </ProtectedRoute>
        }
      />

      <Route
        path="/saved"
        element={
          <ProtectedRoute>
            <Profile />
          </ProtectedRoute>
        }
      />

      <Route
        path="/social/buddy"
        element={
          <ProtectedRoute>
            <TravelBuddyHub />
          </ProtectedRoute>
        }
      />

      <Route
        path="/social/buddy/new"
        element={
          <ProtectedRoute>
            <CreateBuddyTrip />
          </ProtectedRoute>
        }
      />

      <Route
        path="/social/buddy/:id"
        element={
          <ProtectedRoute>
            <TravelBuddyDetails />
          </ProtectedRoute>
        }
      />

      <Route
        path="/social/journeys"
        element={
          <ProtectedRoute>
            <MyJourneys />
          </ProtectedRoute>
        }
      />

      <Route
        path="/social/journeys/:id"
        element={
          <ProtectedRoute>
            <JourneyDetailsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/social/chat"
        element={
          <ProtectedRoute>
            <ChatRoom />
          </ProtectedRoute>
        }
      />

      <Route
        path="/social/chat/:roomId"
        element={
          <ProtectedRoute>
            <ChatRoom />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings"
        element={
          <ProtectedRoute>
            <Settings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings/privacy"
        element={
          <ProtectedRoute>
            <PrivacySettings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings/security"
        element={
          <ProtectedRoute>
            <SecuritySettings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings/safety"
        element={
          <ProtectedRoute>
            <SafetySettings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings/safety-guidelines"
        element={
          <ProtectedRoute>
            <TravelSafetyGuidelines />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings/notifications"
        element={
          <ProtectedRoute>
            <NotificationsSettings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/settings/legal/:type"
        element={
          <ProtectedRoute>
            <LegalSettings />
          </ProtectedRoute>
        }
      />

      <Route
        path="/felt-vibes"
        element={
          <ProtectedRoute>
            <FeltVibes />
          </ProtectedRoute>
        }
      />

      <Route
        path="/blocked-users"
        element={
          <ProtectedRoute>
            <BlockedUsers />
          </ProtectedRoute>
        }
      />

      <Route
        path="/emergency-contacts"
        element={
          <ProtectedRoute>
            <EmergencyContacts />
          </ProtectedRoute>
        }
      />

      <Route
        path="/help-support"
        element={
          <ProtectedRoute>
            <HelpSupport />
          </ProtectedRoute>
        }
      />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
};

export default RouteTour;
