import React from "react";
import {
  Mail,
  Phone,
  Globe,
  Calendar,
  MapPin,
  Clock,
  Edit,
  UserPlus,
  UserMinus,
  Ban,
  ShieldAlert,
  Star,
  ShieldCheck,
  Compass,
  XCircle,
  MoreVertical
} from "lucide-react";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import { getAvatarUrl } from "../../utils/avatar";

export const ProfileHeader = ({
  profileUser,
  currentUser,
  isOwnProfile,
  isFollowing,
  isRequested,
  hasPendingRequestForMe,
  followLoading,
  isBlockedByMe,
  showProfileMenu,
  setShowProfileMenu,
  handleFollowToggle,
  handleAcceptRequest,
  handleDeclineRequest,
  setShowReportModal,
  setShowBlockModal,
  setShowRateModal,
  navigate,
  userMemories,
  userTrips,
  openRelationsModal,
  setActiveTab,
  userStories = [],
  handleOpenStory
}) => {
  const createdatnew = profileUser?.createdAt
    ? moment(profileUser.createdAt).format("MMMM YYYY")
    : "December 2023";

  const hasStories = userStories && userStories.length > 0;

  return (
    <div className="bg-white/90 backdrop-blur-xl p-6 sm:p-8 rounded-3xl shadow-[0_10px_40px_rgba(0,0,0,0.06)] border border-white/50">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-8 sm:gap-10">
        {/* Avatar Frame with gradient story ring */}
        <div className="relative shrink-0 select-none group">
          <div
            onClick={() => {
              if (hasStories && handleOpenStory) {
                handleOpenStory(0);
              }
            }}
            className={`w-28 h-28 sm:w-32 sm:h-32 rounded-full p-1 transition-all duration-300 ${
              hasStories
                ? "bg-gradient-to-tr from-brand-400 via-brand-500 to-brand-600 shadow-lg group-hover:scale-105 cursor-pointer active:scale-95"
                : "bg-slate-200/80 shadow-sm"
            }`}
          >
            <div className="w-full h-full rounded-full bg-white p-1">
              <img
                src={getAvatarUrl(
                  profileUser,
                  profileUser.img,
                  profileUser.name,
                )}
                className="w-full h-full rounded-full object-cover"
                alt={profileUser.name}
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(profileUser.name || "Explorer")}&background=8b5cf6&color=fff&bold=true`;
                }}
              />
            </div>
          </div>
          {isOwnProfile && (
            <button
              onClick={() =>
                navigate("/updateProfile", { state: profileUser })
              }
              className="absolute bottom-1 right-1 p-2.5 bg-primary-600 text-white rounded-full shadow-lg shadow-primary-600/40 hover:scale-110 transition-transform active:scale-95"
              title="Edit Account"
            >
              <Edit className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Profile main details */}
        <div className="flex-1 space-y-5 text-center md:text-left min-w-0 mt-2 md:mt-0">
          {/* Row 1: Username & Action Buttons */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate flex items-center justify-center md:justify-start gap-1.5">
                {profileUser.username ??
                  profileUser.name?.toLowerCase().replace(/\s/g, "") ??
                  "User"}
              </h1>
              {profileUser.privateAccount &&
                currentUser?.isAdmin &&
                !isOwnProfile && (
                  <span className="text-[10px] uppercase font-bold tracking-wider text-primary-600 bg-white border border-primary-600 px-2 py-0.5 rounded-md inline-block w-fit mt-1">
                    Private Account ðŸ”’ â€” Admin Override Active
                  </span>
                )}
            </div>

            {/* Follow/Unfollow and Message action buttons for other profiles */}
            {!isOwnProfile ? (
              <div className="flex flex-wrap gap-2 justify-center sm:justify-start items-center w-full">
                {hasPendingRequestForMe && (
                  <div className="flex gap-2 w-full sm:w-auto bg-brand-50/50 p-1.5 rounded-xl border border-brand-100 mb-2 sm:mb-0">
                    <span className="text-[11px] font-bold text-brand-600 self-center px-2 hidden sm:inline-block">
                      Pending Request:
                    </span>
                    <button
                      onClick={handleAcceptRequest}
                      className="flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all bg-primary-600 hover:bg-primary-700 text-white shadow-sm"
                    >
                      Accept
                    </button>
                    <button
                      onClick={handleDeclineRequest}
                      className="flex-1 sm:flex-none px-4 py-1.5 rounded-lg text-[13px] font-bold transition-all bg-white border border-slate-200 text-slate-700 hover:bg-slate-50 shadow-sm"
                    >
                      Decline
                    </button>
                  </div>
                )}
                <button
                  onClick={handleFollowToggle}
                  disabled={followLoading}
                  className={`group px-5 py-1.5 rounded-lg text-sm font-bold transition-all shadow-sm flex-1 sm:flex-none ${
                    followLoading ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    isFollowing || isRequested
                      ? "border border-primary-600 text-primary-600 bg-transparent hover:bg-rose-50 hover:text-rose-600 hover:border-rose-600"
                      : "bg-primary-600 hover:bg-primary-700 text-white"
                  }`}
                >
                  {followLoading ? (
                    "..."
                  ) : isFollowing ? (
                    <>
                      <span className="group-hover:hidden">My Journey Mates</span>
                      <span className="hidden group-hover:inline">Unfollow</span>
                    </>
                  ) : isRequested ? (
                    "Requested"
                  ) : (
                    "Journey Mates"
                  )}
                </button>
                <button
                  onClick={() =>
                    navigate("/social/chat", {
                      state: { targetUserId: profileUser._id },
                    })
                  }
                  className="px-5 py-1.5 rounded-lg text-sm font-bold transition-all bg-slate-100 text-[#111827] hover:bg-slate-200 shadow-sm flex-1 sm:flex-none"
                >
                  Message
                </button>

                {/* Three dot dropdown menu */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="p-1.5 rounded-lg text-slate-700 hover:bg-slate-50 transition-colors bg-white h-full aspect-square flex items-center justify-center shadow-sm"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        initial={{ opacity: 0, y: 5, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        exit={{ opacity: 0, y: 5, scale: 0.95 }}
                        transition={{ duration: 0.15 }}
                        className="absolute right-0 mt-2 w-48 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden text-left"
                      >
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            setShowRateModal(true);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors"
                        >
                          <Star className="w-4 h-4 text-amber-500" /> Write
                          Review
                        </button>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            setShowReportModal(true);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm font-bold text-rose-500 flex items-center gap-2 transition-colors"
                        >
                          <ShieldAlert className="w-4 h-4" /> Report User
                        </button>
                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            setShowBlockModal(true);
                          }}
                          className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm font-bold text-rose-500 flex items-center gap-2 transition-colors"
                        >
                          <Ban className="w-4 h-4" />{" "}
                          {isBlockedByMe ? "Unblock User" : "Block User"}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            ) : (
              <div className="flex gap-2 justify-center sm:justify-start w-full">
                <button
                  onClick={() =>
                    navigate("/updateProfile", { state: profileUser })
                  }
                  className="flex items-center gap-2 px-5 py-2 rounded-xl text-sm font-bold bg-slate-100 text-slate-800 hover:bg-slate-200 active:scale-95 transition-all shadow-sm"
                >
                  <Edit className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              </div>
            )}
          </div>

          {/* Row 2: Stats (Stats inline with more space) */}
          <div className="flex items-center justify-center md:justify-start gap-10 select-none text-slate-900">
            <div
              className="cursor-pointer flex flex-col items-center md:items-start hover:opacity-80 transition-opacity"
              onClick={() => setActiveTab("posts")}
            >
              <span className="font-black text-[17px]">
                {userMemories?.length || 0}
              </span>
              <span className="text-xs text-slate-500 font-medium tracking-wide">
                Travel Memories
              </span>
            </div>
            <div
              className="cursor-pointer flex flex-col items-center md:items-start hover:opacity-80 transition-opacity"
              onClick={() => openRelationsModal("followers")}
            >
              <span className="font-black text-[17px]">
                {profileUser.followers?.length || 0}
              </span>
              <span className="text-xs text-slate-500 font-medium tracking-wide">
                Journey Mates
              </span>
            </div>
            <div
              className="cursor-pointer flex flex-col items-center md:items-start hover:opacity-80 transition-opacity"
              onClick={() => openRelationsModal("following")}
            >
              <span className="font-black text-[17px]">
                {profileUser.following?.length || 0}
              </span>
              <span className="text-xs text-slate-500 font-medium tracking-wide">
                My Journey Mates
              </span>
            </div>
          </div>

          {/* Row 3: Bio & Details */}
          <div className="space-y-1 select-none text-center md:text-left">
            <div className="font-semibold text-lg text-slate-900 flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span>{profileUser.name}</span>
              {profileUser.verificationStatus === "verified" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-brand-500/10 text-brand-600 border-brand-500/20">
                  <ShieldCheck className="w-3.5 h-3.5" /> Verified Traveler
                </span>
              )}
              {profileUser.verificationStatus === "pending" && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-yellow-500/10 text-yellow-600 border-yellow-500/20">
                  <Clock className="w-3.5 h-3.5" /> Verification Pending
                </span>
              )}
              {profileUser.verificationStatus === "rejected" && (
                <span
                  className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-red-500/10 text-red-600 border-red-500/20"
                  title={profileUser.verificationNote}
                >
                  <XCircle className="w-3.5 h-3.5" /> Verification Rejected
                </span>
              )}
              {(!profileUser.verificationStatus ||
                profileUser.verificationStatus === "unverified") && (
                <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-500/10 text-slate-500 border-slate-500/20">
                  <ShieldAlert className="w-3.5 h-3.5" /> Not Verified
                </span>
              )}
            </div>

            {profileUser.bio && (
              <p className="mt-3 text-sm text-slate-700 max-w-xl mx-auto md:mx-0 leading-relaxed break-words whitespace-pre-wrap">
                {profileUser.bio}
              </p>
            )}

            <div className="flex flex-wrap gap-x-5 gap-y-2.5 mt-3 pt-2 text-[13px] text-slate-600 font-medium items-center justify-center md:justify-start">
              {isOwnProfile && (
                <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-400" />{" "}
                  {profileUser.email}
                </span>
              )}
              {isOwnProfile && profileUser.mobile && (
                <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400" />{" "}
                  {profileUser.mobile}
                </span>
              )}
              {isOwnProfile && (!profileUser.city || !profileUser.state) ? (
                <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1 select-none">
                  <span className="flex items-center gap-1.5 text-brand-600 bg-brand-50 border border-brand-100 rounded-xl px-3 py-1 text-xs font-bold shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-brand-500 animate-bounce" />{" "}
                    Add your city to discover nearby travelers
                  </span>
                  <button
                    onClick={() => navigate("/updateProfile", { state: profileUser })}
                    className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-3 py-1 font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm self-start"
                  >
                    Complete Profile
                  </button>
                </div>
              ) : (
                <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-slate-400" />{" "}
                  {profileUser.city && profileUser.state
                    ? `${profileUser.city}, ${profileUser.state}`
                    : "Location not added"}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" /> Since{" "}
                {createdatnew}
              </span>
            </div>
          </div>

          {/* Row 4: Extra Stats (Rating & Trips) acting like Highlights / Extra Info */}
          <div className="flex items-center justify-center md:justify-start gap-4 select-none pt-2">
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="text-xs font-black text-amber-700">
                {profileUser.rating || "4.6"} Rating
              </span>
            </div>
            <div
              className="cursor-pointer flex items-center gap-1.5 bg-brand-50 px-3 py-1.5 rounded-lg border border-brand-100"
              onClick={() => setActiveTab("trips")}
            >
              <Compass className="w-4 h-4 text-brand-500" />
              <span className="text-xs font-black text-brand-700">
                {userTrips?.length || 0} Hosted Squads
              </span>
            </div>
          </div>

          {/* Row 5: Interests tag display */}
          {profileUser.interests && profileUser.interests.length > 0 && (
            <div className="text-left select-none pt-2">
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {profileUser.interests?.map((interest) => (
                  <span
                    key={interest}
                    className="text-slate-600 bg-slate-100/80 border border-slate-200/60 px-3 py-1 rounded-full text-xs font-medium shadow-sm"
                  >
                    {interest}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ProfileHeader;

