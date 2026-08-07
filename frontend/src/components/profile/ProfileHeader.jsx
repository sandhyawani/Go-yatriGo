import React from "react";
import {
Mail,
Phone,
Calendar,
MapPin,
Clock,
Edit,
Ban,
ShieldAlert,
Star,
ShieldCheck,
Compass,
XCircle,
MoreVertical } from
"lucide-react";
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
  canWriteReview = false,
  userStories = [],
  handleOpenStory,
  journeyStats
}) => {
  const createdatnew = profileUser?.createdAt ?
  moment(profileUser.createdAt).format("MMMM YYYY") :
  "December 2023";

  const hasStories = userStories && userStories.length > 0;

  return (
    <div className="bg-white rounded-3xl p-6 shadow-soft border border-[#E5E7EB]/60 relative">
      <div className="flex flex-col md:flex-row items-center md:items-start gap-6 md:gap-8">
        {}
        <div className="relative group">
          <div
          onClick={hasStories ? () => handleOpenStory(0) : undefined}
          className={`relative w-28 h-28 sm:w-32 sm:h-32 rounded-full overflow-hidden shadow-md border-4 border-white ${
          hasStories ?
          "ring-4 ring-[#7C3AED] ring-offset-2 cursor-pointer transition-transform hover:scale-105" :
          ""
          }`}>

            <img
            src={getAvatarUrl(profileUser?.pic || profileUser?.avatar)}
            alt={profileUser.name}
            className="w-full h-full object-cover"
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = getAvatarUrl(null);
            }} />

          </div>
          {isOwnProfile &&
          <button
          onClick={() =>
          navigate("/updateProfile", { state: profileUser })}

          className="absolute bottom-1 right-1 p-2.5 bg-[#7C3AED] text-white rounded-full shadow-lg shadow-[#7C3AED]/40 hover:scale-110 transition-transform active:scale-95"
          title="Edit Account">

              <Edit className="w-4 h-4" />
            </button>}

        </div>

        {}
        <div className="flex-1 space-y-5 text-center md:text-left min-w-0 mt-2 md:mt-0">
          {}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex flex-col gap-1 min-w-0">
              <h1 className="text-xl sm:text-2xl font-bold text-slate-900 tracking-tight truncate flex items-center justify-center md:justify-start gap-1.5">
                {profileUser.username ??
                profileUser.name?.toLowerCase().replace(/\s/g, "") ??
                "User"}
              </h1>
              {profileUser.privateAccount &&
              currentUser?.isAdmin &&
              !isOwnProfile &&
              <span className="text-[10px] uppercase font-bold tracking-wider text-primary-600 bg-white border border-primary-600 px-2 py-0.5 rounded-md inline-flex items-center gap-1 w-fit mt-1">
                    Private Account — Admin Override Active
                  </span>}

            </div>

            {}
            {!isOwnProfile ?
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start items-center w-full sm:w-auto shrink-0">
                {hasPendingRequestForMe &&
              <div className="flex gap-2 w-full sm:w-auto bg-[#F3E8FF]/30 p-1.5 rounded-xl border border-[#7C3AED]/10 mb-2 sm:mb-0">
                    <span className="text-[11px] font-semibold text-[#7C3AED] self-center px-2 hidden sm:inline-block">
                      Pending Request:
                    </span>
                    <button
                onClick={handleAcceptRequest}
                className="flex-1 sm:flex-none px-4 py-1.5 rounded-xl text-[13px] font-semibold transition-all duration-200 bg-[#7C3AED] hover:bg-[#6D28D9] text-white shadow-soft">

                      Accept
                    </button>
                    <button
                onClick={handleDeclineRequest}
                className="flex-1 sm:flex-none px-4 py-1.5 rounded-xl text-[13px] font-semibold transition-all duration-200 bg-white border border-[#E5E7EB] text-[#1E293B] hover:bg-slate-50 shadow-soft">

                      Decline
                    </button>
                  </div>}

                <button
              onClick={handleFollowToggle}
              disabled={followLoading}
              className={`group px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 shadow-soft flex-1 sm:flex-none ${
              followLoading ? "opacity-50 cursor-not-allowed" : ""
              } ${
              isFollowing || isRequested ?
              "border border-[#7C3AED] text-[#7C3AED] bg-transparent hover:bg-[#F3E8FF]/20" :
              "bg-[#7C3AED] hover:bg-[#6D28D9] text-white"
              }`}>

                  {followLoading ?
                "..." :
                isFollowing ?
                <>
                      <span className="group-hover:hidden">Trip Mates</span>
                      <span className="hidden group-hover:inline">Remove Mate</span>
                    </> :
                isRequested ?
                "Requested" :

                "Add Trip Mate"}

                </button>
                <button
              onClick={() =>
              navigate("/social/chat", {
                state: { targetUserId: profileUser._id }
              })}

              className="px-5 py-2 rounded-xl text-sm font-semibold transition-all duration-200 bg-white border border-[#E5E7EB] text-[#1E293B] hover:bg-slate-50 shadow-soft flex-1 sm:flex-none">

                  Message
                </button>

                {}
                <div className="relative dropdown-container">
                  <button
                onClick={() => setShowProfileMenu(!showProfileMenu)}
                className="p-2 rounded-xl text-[#1E293B] hover:bg-slate-50 transition-colors bg-white h-full aspect-square flex items-center justify-center shadow-soft border border-[#E5E7EB]">

                    <MoreVertical className="w-5 h-5" />
                  </button>

                  <AnimatePresence>
                    {showProfileMenu &&
                  <motion.div
                  initial={{ opacity: 0, y: 5, scale: 0.95 }}
                  animate={{ opacity: 1, y: 0, scale: 1 }}
                  exit={{ opacity: 0, y: 5, scale: 0.95 }}
                  transition={{ duration: 0.15 }}
                  className="absolute right-0 mt-2 w-52 bg-white rounded-2xl shadow-xl border border-slate-100 py-2 z-50 overflow-hidden text-left">

                        {}
                        <button
                    onClick={() => {
                      if (canWriteReview) {
                        setShowProfileMenu(false);
                        setShowRateModal(true);
                      }
                    }}
                    disabled={!canWriteReview}
                    title={
                    !canWriteReview ?
                    "Available after completing a trip together" :
                    "Write a review"}

                    className={`w-full text-left px-4 py-2.5 text-sm font-bold flex items-center justify-between gap-2 transition-colors ${
                    canWriteReview ?
                    "hover:bg-slate-50 text-slate-700 cursor-pointer" :
                    "opacity-40 cursor-not-allowed text-slate-400 bg-slate-50/30"
                    }`}>

                          <div className="flex items-center gap-2">
                            <Star className={`w-4 h-4 ${canWriteReview ? "text-amber-500 fill-amber-500" : "text-slate-300"}`} />
                            <span>Write Review</span>
                          </div>
                          {!canWriteReview &&
                      <span className="text-[9px] font-extrabold text-slate-400 uppercase tracking-wider bg-slate-100 px-1.5 py-0.5 rounded">
                              Trip Req.
                            </span>}

                        </button>

                        {}
                        <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowReportModal(true);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-slate-50 text-sm font-bold text-slate-700 flex items-center gap-2 transition-colors">

                          <ShieldAlert className="w-4 h-4 text-slate-500" />
                          <span>Report User</span>
                        </button>

                        {}
                        <button
                    onClick={() => {
                      setShowProfileMenu(false);
                      setShowBlockModal(true);
                    }}
                    className="w-full text-left px-4 py-2.5 hover:bg-rose-50 text-sm font-bold text-rose-600 flex items-center gap-2 transition-colors border-t border-slate-100 mt-1 pt-2.5">

                          <Ban className="w-4 h-4 text-rose-600" />
                          <span>{isBlockedByMe ? "Unblock User" : "Block User"}</span>
                        </button>
                      </motion.div>}

                  </AnimatePresence>
                </div>
              </div> :

            <div className="flex gap-2 justify-center sm:justify-start w-full sm:w-auto">
                <button
              onClick={() =>
              navigate("/updateProfile", { state: profileUser })}

              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold bg-white border border-[#E5E7EB] text-[#1E293B] hover:bg-slate-50 active:scale-95 transition-all duration-200 shadow-soft">

                  <Edit className="w-3.5 h-3.5" />
                  Edit Profile
                </button>
              </div>}

          </div>

          {}
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-6 sm:gap-10 select-none text-slate-900 pt-1">
            <div
            className="cursor-pointer flex flex-col items-center md:items-start hover:opacity-80 transition-opacity"
            onClick={() => setActiveTab("posts")}>

              <span className="font-black text-[17px]">
                {journeyStats?.postsShared ?? userMemories?.length ?? 0}
              </span>
              <span className="text-xs text-slate-500 font-medium tracking-wide">
                Travel Memories
              </span>
            </div>
            <div
            className="cursor-pointer flex flex-col items-center md:items-start hover:opacity-80 transition-opacity"
            onClick={() => openRelationsModal("followers")}>

              <span className="font-black text-[17px]">
                {profileUser.followers?.length ?? 0}
              </span>
              <span className="text-xs text-slate-500 font-medium tracking-wide">
                Trip Mates
              </span>
            </div>
            <div
            className="cursor-pointer flex flex-col items-center md:items-start hover:opacity-80 transition-opacity"
            onClick={() => openRelationsModal("following")}>

              <span className="font-black text-[17px]">
                {profileUser.following?.length || 0}
              </span>
              <span className="text-xs text-slate-500 font-medium tracking-wide">
                My Network
              </span>
            </div>
          </div>

          {}
          <div className="space-y-1 select-none text-center md:text-left">
            <div className="font-semibold text-lg text-slate-900 flex flex-wrap items-center justify-center md:justify-start gap-2">
              <span>{profileUser.name}</span>
              {profileUser.verificationStatus === "verified" &&
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-brand-50 text-brand-700 border-brand-200">
                  <ShieldCheck className="w-3.5 h-3.5 text-brand-600" /> Verified Traveler
                </span>}

              {profileUser.verificationStatus === "pending" &&
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-amber-50 text-amber-700 border-amber-200">
                  <Clock className="w-3.5 h-3.5 text-amber-600" /> Verification Pending
                </span>}

              {profileUser.verificationStatus === "rejected" &&
              <span
              className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-rose-50 text-rose-700 border-rose-200"
              title={profileUser.verificationNote}>

                  <XCircle className="w-3.5 h-3.5 text-rose-600" /> Verification Rejected
                </span>}

              {(!profileUser.verificationStatus ||
              profileUser.verificationStatus === "unverified") &&
              <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium border bg-slate-100 text-slate-600 border-slate-200">
                  <ShieldAlert className="w-3.5 h-3.5 text-slate-400" /> Not Verified
                </span>}

            </div>

            {profileUser.bio &&
            <p className="mt-3 text-sm text-slate-700 max-w-xl mx-auto md:mx-0 leading-relaxed break-words whitespace-pre-wrap">
                {profileUser.bio}
              </p>}


            <div className="flex flex-wrap gap-x-5 gap-y-2.5 mt-3 pt-2 text-[13px] text-slate-600 font-medium items-center justify-center md:justify-start">
              {isOwnProfile &&
              <span className="flex items-center gap-1.5">
                  <Mail className="w-4 h-4 text-slate-400" />{" "}
                  {profileUser.email}
                </span>}

              {isOwnProfile && profileUser.mobile &&
              <span className="flex items-center gap-1.5">
                  <Phone className="w-4 h-4 text-slate-400" />{" "}
                  {profileUser.mobile}
                </span>}

              {isOwnProfile && (!profileUser.city || !profileUser.state) ?
              <div className="flex flex-col sm:flex-row sm:items-center gap-2 mt-1 select-none">
                  <span className="flex items-center gap-1.5 text-brand-600 bg-brand-50 border border-brand-100 rounded-xl px-3 py-1 text-xs font-bold shadow-sm">
                    <MapPin className="w-3.5 h-3.5 text-rose-500 animate-bounce" />{" "}
                    Add your city to discover nearby travelers
                  </span>
                  <button
                onClick={() => navigate("/updateProfile", { state: profileUser })}
                className="bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-3 py-1 font-bold text-[10px] uppercase tracking-wider transition-colors shadow-sm self-start">

                    Complete Profile
                  </button>
                </div> :

              <span className="flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-rose-500" />{" "}
                  {profileUser.city && profileUser.state ?
                `${profileUser.city}, ${profileUser.state}` :
                "Location not added"}
                </span>}

              <span className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-slate-400" /> Since{" "}
                {createdatnew}
              </span>
            </div>
          </div>

          {}
          <div className="flex items-center justify-center md:justify-start gap-4 select-none pt-2">
            <div className="flex items-center gap-1.5 bg-amber-50 px-3 py-1.5 rounded-lg border border-amber-100">
              <Star className="w-4 h-4 fill-amber-500 text-amber-500" />
              <span className="text-xs font-black text-amber-700">
                {profileUser.rating || "New"} Rating
              </span>
            </div>
            <div
            className="cursor-pointer flex items-center gap-1.5 bg-slate-100 px-3 py-1.5 rounded-lg border border-slate-200"
            onClick={() => setActiveTab("trips")}>

              <Compass className="w-4 h-4 text-slate-500" />
              <span className="text-xs font-black text-slate-700">
                {journeyStats?.totalJourneys ?? userTrips?.length ?? 0} Trips
              </span>
            </div>
          </div>

          {}
          {profileUser.interests && profileUser.interests.length > 0 &&
          <div className="text-left select-none pt-2">
              <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                {profileUser.interests?.map((interest) =>
              <span
              key={interest}
              className="text-slate-600 bg-slate-100 border border-slate-200 px-3 py-1 rounded-full text-xs font-medium shadow-sm">

                    {interest}
                  </span>
              )}
              </div>
            </div>}


          {}
          {(profileUser.preferredTravelStyle || profileUser.favoriteDestinations && profileUser.favoriteDestinations.length > 0) &&
          <div className="text-left select-none pt-3 flex flex-wrap gap-3 items-center justify-center md:justify-start">
              {profileUser.preferredTravelStyle &&
            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-bold">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Preferred Style:</span>
                  <span className="bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1 text-xs font-black shadow-sm">
                    {profileUser.preferredTravelStyle}
                  </span>
                </div>}

              {profileUser.favoriteDestinations && profileUser.favoriteDestinations.length > 0 &&
            <div className="flex flex-wrap items-center gap-1.5 text-xs text-slate-600 font-bold">
                  <span className="text-[10px] text-slate-400 uppercase tracking-widest font-black">Favorite Places:</span>
                  {profileUser.favoriteDestinations.map((dest) =>
              <span
              key={dest}
              className="bg-slate-100 border border-slate-200 text-slate-700 rounded-lg px-2.5 py-1 text-xs font-black shadow-sm animate-fade-in flex items-center gap-1">

                      <MapPin className="w-3 h-3 text-rose-500" /> {dest}
                    </span>
              )}
                </div>}

            </div>}

        </div>
      </div>
    </div>);

};

export default ProfileHeader;