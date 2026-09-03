import React, { useContext, lazy, Suspense } from "react";
import { Routes, Route, Navigate, useLocation } from "react-router-dom";
import { motion } from "framer-motion";
import { AuthContext } from "../context/authContext";
import { userColumns } from "../components/datatable/datatablesource";
import RouteLoadingFallback from "../components/common/RouteLoadingFallback";

const Login = lazy(() => import("../pages/Login"));
const Register = lazy(() => import("../pages/Register"));
const ForgotPassword = lazy(() => import("../pages/ForgotPassword"));
const ResetPassword = lazy(() => import("../pages/ResetPassword"));
const PrivacyPolicy = lazy(() => import("../pages/PrivacyPolicy"));
const Terms = lazy(() => import("../pages/Terms"));

const Home = lazy(() => import("../pages/Home"));
const Profile = lazy(() => import("../pages/Profile"));
const ProfileUpdate = lazy(() => import("../pages/ProfileUpdate"));
const ContactUs = lazy(() => import("../pages/ContactUs"));
const ReportProblem = lazy(() => import("../pages/social/ReportProblem"));

const Admin = lazy(() => import("../pages/Admin"));
const AdminReports = lazy(() => import("../pages/admin/AdminReports"));
const VerificationRequests = lazy(() => import("../pages/admin/VerificationRequests"));
const AdminProfile = lazy(() => import("../pages/admin/AdminProfile"));
const AdminContactRequests = lazy(() => import("../pages/AdminContactRequests"));
const AdminUserList = lazy(() => import("../pages/AdminUserList"));
const AdminUserDetails = lazy(() => import("../pages/AdminUserDetails"));
const AdminEditUser = lazy(() => import("../pages/AdminEditUser"));
const AdminAddUser = lazy(() => import("../pages/AdminAddUser"));

const TravelBuddyHub = lazy(() => import("../pages/social/TravelBuddyHub"));
const CreateBuddyTrip = lazy(() => import("../pages/social/CreateBuddyTrip"));
const TravelBuddyDetails = lazy(() => import("../pages/social/TravelBuddyDetails"));
const ChatRoom = lazy(() => import("../pages/social/ChatRoom"));
const MyJourneys = lazy(() => import("../pages/social/MyJourneys"));
const JourneyDetailsPage = lazy(() => import("../pages/social/JourneyDetailsPage"));
const ActiveTravelsByLocation = lazy(() => import("../pages/social/ActiveTravelsByLocation"));
const Community = lazy(() => import("../pages/social/Community"));
const FeltVibes = lazy(() => import("../pages/social/FeltVibes"));
const BlockedUsers = lazy(() => import("../pages/social/BlockedUsers"));
const EmergencyContacts = lazy(() => import("../pages/social/EmergencyContacts"));
const HelpSupport = lazy(() => import("../pages/social/HelpSupport"));

const Settings = lazy(() => import("../pages/social/Settings"));
const PrivacySettings = lazy(() => import("../pages/social/settings/PrivacySettings"));
const SecuritySettings = lazy(() => import("../pages/social/settings/SecuritySettings"));
const SafetySettings = lazy(() => import("../pages/social/settings/SafetySettings"));
const TravelSafetyGuidelines = lazy(() => import("../pages/social/settings/TravelSafetyGuidelines"));
const CommunityGuidelines = lazy(() => import("../pages/social/settings/CommunityGuidelines"));
const NotificationsSettings = lazy(() => import("../pages/social/settings/NotificationsSettings"));
const LegalSettings = lazy(() => import("../pages/social/settings/LegalSettings"));

const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading, initialized } = useContext(AuthContext);

  if (loading || !initialized) {
    return <RouteLoadingFallback />;
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.type) && !user.isAdmin) {
    return <Navigate to="/" replace />;
  }

  return children;
};

const RouteTour = () => {
  const location = useLocation();

  return (
    <Suspense fallback={<RouteLoadingFallback />}>
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 6 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.16, 1, 0.3, 1] }}
        className="w-full min-h-full h-full min-h-0 flex flex-col"
      >
        <Routes location={location}>
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

        {/* Admin Routes */}
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
              <ProfileUpdate />
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
              <AdminUserList columns={userColumns} />
            </ProtectedRoute>
          }
        />
        <Route
          path="/userpage"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminUserDetails />
            </ProtectedRoute>
          }
        />
        <Route
          path="/update"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminEditUser />
            </ProtectedRoute>
          }
        />
        <Route
          path="/adduser"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminAddUser />
            </ProtectedRoute>
          }
        />

        {/* User Profiles & Contacts */}
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
              <ProfileUpdate />
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

        {/* Travel Buddy Hub */}
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
          path="/social/explore"
          element={
            <ProtectedRoute>
              <TravelBuddyHub />
            </ProtectedRoute>
          }
        />

        {/* Journeys & Travels */}
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
          path="/social/journey"
          element={
            <ProtectedRoute>
              <Navigate to="/social/journeys" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/social/journey/:id"
          element={
            <ProtectedRoute>
              <Navigate to="/social/journeys" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/social/active-travels"
          element={
            <ProtectedRoute>
              <ActiveTravelsByLocation />
            </ProtectedRoute>
          }
        />

        {/* Chat */}
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

        {/* Community & Vibes */}
        <Route
          path="/community"
          element={
            <ProtectedRoute>
              <Community />
            </ProtectedRoute>
          }
        />
        <Route
          path="/social/community"
          element={
            <ProtectedRoute>
              <Navigate to="/community" replace />
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
          path="/social/memories"
          element={
            <ProtectedRoute>
              <Navigate to="/" replace />
            </ProtectedRoute>
          }
        />

        {/* Settings & Guidelines */}
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
          path="/safety"
          element={
            <ProtectedRoute>
              <SafetySettings />
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
          path="/safety-guidelines"
          element={
            <ProtectedRoute>
              <Navigate to="/settings/safety-guidelines" replace />
            </ProtectedRoute>
          }
        />
        <Route
          path="/settings/community-guidelines"
          element={
            <ProtectedRoute>
              <CommunityGuidelines />
            </ProtectedRoute>
          }
        />
        <Route
          path="/community-guidelines"
          element={
            <ProtectedRoute>
              <Navigate to="/settings/community-guidelines" replace />
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
          path="/settings/legal"
          element={
            <ProtectedRoute>
              <LegalSettings />
            </ProtectedRoute>
          }
        />

        {/* Safety & Support */}
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
          path="/emergency"
          element={
            <ProtectedRoute>
              <Navigate to="/emergency-contacts" replace />
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

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      </motion.div>
    </Suspense>
  );
};

export default RouteTour;
