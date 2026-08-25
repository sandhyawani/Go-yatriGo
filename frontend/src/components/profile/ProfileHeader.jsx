import React, { useState, useRef, useEffect } from "react";
import { Mail, Phone, Calendar, MapPin, Clock, Edit, Share2, Ban, ShieldAlert, Star, ShieldCheck, XCircle, MoreVertical, MessageCircle, Check, UserPlus, UserCheck, Loader2, X } from "lucide-react";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../../api/axios";
import { getAvatarUrl } from "../../utils/avatar";
import { showToast } from "../../utils/showToast";
import { compressImage } from "../../utils/compressImage";
import { chatService } from "../../services/chatService";

export const ProfileHeader = ({
  profileUser,
  currentUser,
  isOwnProfile,
  relationship,
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
  userMemories = [],
  userMemoriesTotal = 0,
  userTrips = [],
  openRelationsModal,
  setActiveTab,
  canWriteReview = false,
  userStories = [],
  handleOpenStory,
  journeyStats,
  onProfileUpdate,
}) => {
  const [copied, setCopied] = useState(false);
  const [coverFile, setCoverFile] = useState(null);
  const [coverPreview, setCoverPreview] = useState("");
  const [isUploadingCover, setIsUploadingCover] = useState(false);
  const coverInputRef = useRef(null);
  const previewUrlRef = useRef(null);

  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, []);

  const handleCoverSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(file.type?.toLowerCase())) {
      showToast.error(
        "Invalid image format",
        "Please select a JPG, JPEG, PNG, or WEBP image."
      );
      e.target.value = "";
      return;
    }

    const maxSizeBytes = 5 * 1024 * 1024;
    if (file.size > maxSizeBytes) {
      showToast.error("File too large", "Cover photo must be under 5MB.");
      e.target.value = "";
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(file);
    previewUrlRef.current = objectUrl;
    setCoverFile(file);
    setCoverPreview(objectUrl);
  };

  const handleCancelCover = () => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setCoverFile(null);
    setCoverPreview("");
    if (coverInputRef.current) coverInputRef.current.value = "";
  };

  const handleSaveCover = async () => {
    if (!coverFile || isUploadingCover) return;

    setIsUploadingCover(true);
    try {
      const compressed = await compressImage(coverFile, 1.5, 1920);

      const formData = new FormData();
      formData.append("image", compressed);

      const uploadRes = await axios.post("/upload", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedUrl = uploadRes.data?.url || uploadRes.data?.secure_url;
      if (!uploadedUrl) {
        throw new Error(uploadRes.data?.message || "Upload failed");
      }

      const targetUserId = profileUser?._id || currentUser?._id;
      const updateRes = await axios.put(
        `/users/${targetUserId}`,
        {
          coverImage: uploadedUrl,
          coverPic: uploadedUrl,
        },
        { withCredentials: true }
      );

      if (updateRes.data?.success) {
        showToast.success("Cover photo updated successfully!");
        onProfileUpdate?.({
          coverImage: uploadedUrl,
          coverPic: uploadedUrl,
        });
        handleCancelCover();
      } else {
        throw new Error(updateRes.data?.message || "Failed to update profile");
      }
    } catch (err) {
      console.error("Cover photo update error:", err);
      showToast.error(
        "Upload failed",
        err.response?.data?.message ||
          err.message ||
          "Failed to upload cover photo"
      );
    } finally {
      setIsUploadingCover(false);
    }
  };

  const handleMessage = async () => {
    try {
      const roomId = await chatService.getDirectRoomId(profileUser._id);
      if (roomId) navigate(`/social/chat/${roomId}`);
    } catch {
      showToast.error("Failed to open conversation");
    }
  };

  const socialState = relationship?.socialState || "none";
  const isFollowing = Boolean(relationship?.isFollowing);
  const isRequested = Boolean(relationship?.requestSent);
  const isTripMate = Boolean(relationship?.isTripMate);

  // ------------------------------------------------------------
  // Messaging permission
  // ------------------------------------------------------------
  const canMessageUser = (() => {
    if (isOwnProfile || !currentUser || !profileUser) return false;

    if (
      isBlockedByMe ||
      profileUser.isBlocked ||
      profileUser.isBlockedByThem ||
      currentUser?.blockedUsers?.some(
        (id) => (id._id || id).toString() === profileUser._id?.toString()
      )
    ) {
      return false;
    }

    const whoCanMessage =
      profileUser.privacySettings?.whoCanMessage || "everyone";

    if (whoCanMessage === "everyone") {
      if (
        profileUser.privateAccount &&
        !isFollowing &&
        !currentUser?.isAdmin
      ) {
        return false;
      }
      return true;
    }

    if (whoCanMessage === "none") return false;
    if (whoCanMessage === "mates_only") return isTripMate;
    return true;
  })();

  const memberSinceFormatted = profileUser?.createdAt
    ? moment(profileUser.createdAt).format("MMMM YYYY")
    : "Recently";

  const hasStories = Array.isArray(userStories) && userStories.length > 0;

  // ------------------------------------------------------------
  // Share profile
  // ------------------------------------------------------------
  const handleShareProfile = async () => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(window.location.href);
        setCopied(true);
        showToast.success("Profile link copied to clipboard!");
        setTimeout(() => setCopied(false), 2000);
      } else {
        showToast.success("Profile URL: " + window.location.href);
      }
    } catch {
      showToast.error("Failed to copy link");
    }
  };

  // ------------------------------------------------------------
  // Travel interest icons
  // ------------------------------------------------------------
  const INTEREST_ICON_MAP = {
    "road trips": "🛣️",
    backpacking: "🎒",
    photography: "📷",
    family: "👨‍👩‍👧",
    hiking: "🥾",
    camping: "⛺",
    beaches: "🏖️",
    mountains: "🏔️",
    culture: "🏛️",
    food: "🍜",
    adventure: "🤿",
    wildlife: "🦁",
    "solo travel": "🧭",
    luxury: "🛎️",
    "budget travel": "💰",
    cycling: "🚴",
    trekking: "🥾",
    "water sports": "🌊",
    history: "📜",
    spirituality: "🙏",
  };

  // ------------------------------------------------------------
  // Counts
  // ------------------------------------------------------------
  const mutualCount =
    profileUser?.mutualsCount !== undefined
      ? profileUser.mutualsCount
      : profileUser?.followers?.filter((f) =>
          profileUser?.following?.some(
            (following) =>
              String(following._id || following) === String(f._id || f)
          )
        ).length || 0;

  const followersCount =
    profileUser?.followersCount !== undefined
      ? profileUser.followersCount
      : profileUser?.followers?.length || 0;

  const followingCount =
    profileUser?.followingCount !== undefined
      ? profileUser.followingCount
      : profileUser?.following?.length || 0;

  const memoriesCount =
    userMemoriesTotal ||
    profileUser?.postsCount ||
    profileUser?.memoriesCount ||
    userMemories.length ||
    0;

  const completedTrips =
    journeyStats?.completedJourneysCount ??
    profileUser?.completedTrips ??
    userTrips.length ??
    0;

  const verificationStatus = profileUser?.verificationStatus || "unverified";

  // ------------------------------------------------------------
  // Verification badge
  // ------------------------------------------------------------
  const renderVerificationBadge = () => {
    if (verificationStatus === "verified") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2 py-0.5 text-[11px] font-bold text-primary-700">
          <ShieldCheck className="h-3 w-3 text-primary-600" />
          Verified
        </span>
      );
    }
    if (verificationStatus === "pending") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700">
          <Clock className="h-3 w-3 text-amber-600" />
          Pending
        </span>
      );
    }
    if (verificationStatus === "rejected") {
      return (
        <span
          className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600"
          title={profileUser?.verificationNote}
        >
          <XCircle className="h-3 w-3" />
          Rejected
        </span>
      );
    }
    return null;
  };

  // ------------------------------------------------------------
  // Relationship action button
  // ------------------------------------------------------------
  const renderRelationshipAction = () => {
    if (isBlockedByMe) {
      return (
        <button
          onClick={() => setShowBlockModal(true)}
          className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-600 shadow-xs transition hover:bg-red-100 active:scale-95"
        >
          <Ban className="h-3.5 w-3.5" />
          Unblock
        </button>
      );
    }

    if (socialState === "incoming_request") {
      return (
        <div className="flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 p-1">
          <button
            onClick={handleAcceptRequest}
            className="flex min-h-[34px] items-center justify-center gap-1 rounded-full bg-primary-600 px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-primary-700 active:scale-95"
          >
            <Check className="h-3.5 w-3.5" />
            Accept
          </button>
          <button
            onClick={handleDeclineRequest}
            className="flex min-h-[34px] items-center justify-center rounded-full px-3 text-xs font-bold text-secondary-700 transition hover:bg-white active:scale-95"
          >
            Decline
          </button>
        </div>
      );
    }

    const isFollowingState =
      socialState === "following" || socialState === "mutual";
    const isRequestedState = socialState === "requested";

    return (
      <button
        onClick={handleFollowToggle}
        disabled={followLoading}
        className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold transition-all duration-200 active:scale-95 ${
          followLoading ? "cursor-not-allowed opacity-50" : ""
        } ${
          isFollowingState || isRequestedState
            ? "border border-primary-200 bg-primary-50 text-primary-700 hover:bg-primary-100"
            : "bg-primary-600 text-white shadow-sm shadow-primary-600/20 hover:bg-primary-700"
        }`}
      >
        {followLoading ? (
          "..."
        ) : isFollowingState ? (
          <>
            <UserCheck className="h-3.5 w-3.5" />
            Following
          </>
        ) : isRequestedState ? (
          <>
            <Clock className="h-3.5 w-3.5" />
            Requested
          </>
        ) : (
          <>
            <UserPlus className="h-3.5 w-3.5" />
            Follow
          </>
        )}
      </button>
    );
  };

  return (
    <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-sm">
      {/* ─── 1. COVER AREA ────────────────────────────────────────── */}
      <div className="relative h-28 sm:h-36 md:h-44 w-full overflow-hidden bg-gradient-to-r from-purple-800 via-primary-600 to-purple-900 select-none group/cover">
        {coverPreview || profileUser?.coverImage || profileUser?.coverPic ? (
          <img
            src={
              coverPreview ||
              profileUser?.coverImage ||
              profileUser?.coverPic
            }
            alt="Cover"
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="absolute inset-0 opacity-25">
            <svg
              className="w-full h-full"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 1440 320"
              preserveAspectRatio="none"
            >
              <path
                fill="#ffffff"
                fillOpacity="1"
                d="M0,192L48,197.3C96,203,192,213,288,197.3C384,181,480,139,576,138.7C672,139,768,181,864,197.3C960,213,1056,203,1152,181.3C1248,160,1344,128,1392,112L1440,96L1440,320L1392,320C1344,320,1248,320,1152,320C1056,320,960,320,864,320C768,320,672,320,576,320C480,320,384,320,288,320C192,320,96,320,48,320L0,320Z"
              />
            </svg>
          </div>
        )}

        {/* Cover Photo Edit / Action Controls */}
        {isOwnProfile && (
          <div className="absolute bottom-2.5 right-2.5 sm:bottom-3 sm:right-3 z-20 flex items-center gap-2">
            <input
              ref={coverInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handleCoverSelect}
              className="hidden"
            />

            {coverPreview ? (
              /* Preview Confirmation Actions */
              <div className="flex items-center gap-1.5 rounded-full bg-slate-900/80 p-1 backdrop-blur-md shadow-lg border border-white/20">
                <button
                  type="button"
                  onClick={handleCancelCover}
                  disabled={isUploadingCover}
                  className="flex items-center gap-1 rounded-full px-2.5 py-1 text-[11px] font-bold text-white/90 transition hover:bg-white/20 active:scale-95 disabled:opacity-50"
                  title="Cancel"
                >
                  <X className="h-3.5 w-3.5" />
                  <span>Cancel</span>
                </button>
                <button
                  type="button"
                  onClick={handleSaveCover}
                  disabled={isUploadingCover}
                  className="flex items-center gap-1 rounded-full bg-primary-600 px-3 py-1 text-[11px] font-bold text-white shadow-sm transition hover:bg-primary-700 active:scale-95 disabled:opacity-50"
                  title="Save Cover Photo"
                >
                  {isUploadingCover ? (
                    <>
                      <Loader2 className="h-3.5 w-3.5 animate-spin" />
                      <span>Saving...</span>
                    </>
                  ) : (
                    <>
                      <Check className="h-3.5 w-3.5" />
                      <span>Save</span>
                    </>
                  )}
                </button>
              </div>
            ) : (
              /* Subtle Purple Edit Button */
              <button
                type="button"
                onClick={() => coverInputRef.current?.click()}
                disabled={isUploadingCover}
                className="flex items-center justify-center p-2 rounded-full bg-primary-600 hover:bg-primary-700 text-white shadow-md border-2 border-white backdrop-blur-xs transition-all hover:scale-105 active:scale-95 group/btn"
                title="Edit Cover Photo"
                aria-label="Edit Cover Photo"
              >
                <Edit className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* ─── 2. PROFILE DETAILS & OVERLAPPING AVATAR ─────────────── */}
      <div className="px-4 sm:px-6 pb-5 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
          {/* Avatar with Story ring & Edit button */}
          <div className="relative shrink-0 self-start">
            <div
              onClick={hasStories ? () => handleOpenStory(0) : undefined}
              className={`relative h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden border-4 border-surface bg-secondary-100 shadow-md ${
                hasStories
                  ? "cursor-pointer ring-3 ring-primary-500 ring-offset-2 hover:scale-[1.02] transition-transform"
                  : ""
              }`}
            >
              <img
                src={getAvatarUrl(profileUser)}
                alt={profileUser?.name || "Traveler"}
                className="h-full w-full object-cover"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    profileUser?.name || "Explorer"
                  )}&background=7C3AED&color=fff&bold=true`;
                }}
              />
            </div>

            {isOwnProfile && (
              <button
                onClick={() =>
                  navigate("/updateProfile", { state: profileUser })
                }
                className="absolute bottom-0 right-0 p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-full border-2 border-surface shadow-sm hover:scale-105 transition-transform"
                title="Edit Profile"
                aria-label="Edit Profile"
              >
                <Edit className="w-3 h-3" />
              </button>
            )}
          </div>

          {/* Action buttons on top right */}
          <div className="flex flex-wrap items-center gap-2 self-start sm:self-end pt-1">
            {isOwnProfile ? (
              <>
                <button
                  onClick={() =>
                    navigate("/updateProfile", { state: profileUser })
                  }
                  className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-full bg-primary-600 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-primary-700 active:scale-95"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Profile
                </button>

                <button
                  onClick={handleShareProfile}
                  className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-bold text-secondary-700 shadow-xs transition hover:bg-secondary-50 active:scale-95"
                  title="Share Profile"
                >
                  {copied ? (
                    <Check className="h-3.5 w-3.5 text-success" />
                  ) : (
                    <Share2 className="h-3.5 w-3.5 text-secondary-500" />
                  )}
                  <span>{copied ? "Copied" : "Share"}</span>
                </button>
              </>
            ) : (
              <>
                {renderRelationshipAction()}

                {canMessageUser && (
                  <button
                    onClick={handleMessage}
                    className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-bold text-secondary-700 shadow-xs transition hover:border-primary-200 hover:bg-primary-50 active:scale-95"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-primary-600" />
                    Message
                  </button>
                )}

                {/* More options menu */}
                <div className="relative dropdown-container">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-border bg-surface text-muted shadow-xs transition hover:bg-secondary-50 hover:text-dark"
                    aria-label="More options"
                  >
                    <MoreVertical className="h-4 w-4" />
                  </button>

                  <AnimatePresence>
                    {showProfileMenu && (
                      <motion.div
                        initial={{ opacity: 0, scale: 0.96, y: 4 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.96, y: 4 }}
                        transition={{ duration: 0.12 }}
                        className="absolute right-0 z-50 mt-1 w-48 rounded-2xl border border-border bg-surface py-1 text-left shadow-lg"
                      >
                        {canWriteReview && (
                          <button
                            onClick={() => {
                              setShowProfileMenu(false);
                              setShowRateModal(true);
                            }}
                            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-secondary-700 hover:bg-amber-50 hover:text-amber-800 transition-colors"
                          >
                            <Star className="h-3.5 w-3.5 fill-amber-400 text-amber-500" />
                            Write Review
                          </button>
                        )}

                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            setShowReportModal(true);
                          }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-secondary-700 hover:bg-secondary-50 transition-colors"
                        >
                          <ShieldAlert className="h-3.5 w-3.5 text-muted" />
                          Report User
                        </button>

                        <div className="my-1 border-t border-border" />

                        <button
                          onClick={() => {
                            setShowProfileMenu(false);
                            setShowBlockModal(true);
                          }}
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-danger hover:bg-red-50 transition-colors"
                        >
                          <Ban className="h-3.5 w-3.5 text-danger" />
                          {isBlockedByMe ? "Unblock User" : "Block User"}
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Identity & Bio */}
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-dark font-heading">
              {profileUser?.name || "Explorer"}
            </h1>
            {renderVerificationBadge()}
            {profileUser?.rating && (
              <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-semibold text-amber-800 font-sans">
                <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                {profileUser.rating}
              </span>
            )}
          </div>

          <p className="text-xs sm:text-sm font-medium text-primary-600 font-sans">
            @{profileUser?.username || "traveler"}
          </p>

          {profileUser?.bio && (
            <p className="text-xs sm:text-sm text-secondary-600 font-normal sm:font-medium leading-relaxed max-w-2xl whitespace-pre-wrap break-words pt-0.5 font-sans">
              {profileUser.bio}
            </p>
          )}

          {/* Metadata chips (Location, Member since, Email/Phone) */}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-muted font-medium pt-1 font-sans">
            {profileUser?.city || profileUser?.state || profileUser?.country ? (
              <span className="inline-flex items-center gap-1 text-secondary-600">
                <MapPin className="h-3.5 w-3.5 text-danger shrink-0" />
                <span>
                  {profileUser?.city && profileUser?.state
                    ? `${profileUser.city}, ${profileUser.state}`
                    : profileUser?.city || profileUser?.country}
                </span>
              </span>
            ) : isOwnProfile ? (
              <button
                onClick={() =>
                  navigate("/updateProfile", { state: profileUser })
                }
                className="inline-flex items-center gap-1 text-primary-600 bg-primary-50 border border-primary-200 px-2.5 py-0.5 rounded-full text-[11px] font-semibold hover:bg-primary-100 transition-colors"
              >
                <MapPin className="h-3 w-3 text-danger" /> Add Location
              </button>
            ) : null}

            <span className="inline-flex items-center gap-1 text-secondary-600">
              <Calendar className="h-3.5 w-3.5 text-muted shrink-0" />
              Joined {memberSinceFormatted}
            </span>

            {isOwnProfile && profileUser?.email && (
              <span className="inline-flex items-center gap-1 text-muted">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="break-all">{profileUser.email}</span>
              </span>
            )}
          </div>

          {/* Travel Interests & Styles (Compact chips) */}
          {profileUser?.interests && profileUser.interests.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 pt-2 font-sans">
              {profileUser.interests
                .filter((interest) => {
                  const lower = (interest || "").toLowerCase().trim();
                  return (
                    lower !== "trip mate" &&
                    lower !== "tripmate" &&
                    lower !== "trip_mate"
                  );
                })
                .map((interest) => (
                  <span
                    key={interest}
                    className="inline-flex items-center gap-1 rounded-full border border-primary-100 bg-primary-50/80 px-2.5 py-0.5 text-[11px] font-semibold text-primary-700"
                  >
                    <span>
                      {INTEREST_ICON_MAP[(interest || "").toLowerCase()] || "🌍"}
                    </span>
                    <span>{interest}</span>
                  </span>
                ))}
            </div>
          )}
        </div>

        {/* ─── 3. UNIFIED HORIZONTAL PROFILE STATISTICS ───────────── */}
        <div className="mt-4 grid grid-cols-3 min-[430px]:grid-cols-5 overflow-hidden rounded-2xl border border-border/80 bg-secondary-50/60 divide-y min-[430px]:divide-y-0 divide-x divide-border/60">
          {/* Travel Memories */}
          <button
            type="button"
            onClick={() => setActiveTab("posts")}
            className="p-2 sm:p-3 text-center transition hover:bg-primary-50/50 group"
          >
            <span className="block text-sm min-[430px]:text-base sm:text-lg font-bold text-dark group-hover:text-primary-600 transition-colors leading-tight font-heading">
              {memoriesCount}
            </span>
            <span className="text-[9px] min-[430px]:text-[10px] font-semibold uppercase tracking-[0.08em] text-muted group-hover:text-primary-700 font-sans truncate block">
              Memories
            </span>
          </button>

          {/* Trips */}
          <button
            type="button"
            onClick={() => setActiveTab("trips")}
            className="p-2 sm:p-3 text-center transition hover:bg-primary-50/50 group"
          >
            <span className="block text-sm min-[430px]:text-base sm:text-lg font-bold text-dark group-hover:text-primary-600 transition-colors leading-tight font-heading">
              {completedTrips}
            </span>
            <span className="text-[9px] min-[430px]:text-[10px] font-semibold uppercase tracking-[0.08em] text-muted group-hover:text-primary-700 font-sans truncate block">
              Trips
            </span>
          </button>

          {/* Followers */}
          <button
            type="button"
            onClick={() => openRelationsModal("followers")}
            className="p-2 sm:p-3 text-center transition hover:bg-primary-50/50 group"
          >
            <span className="block text-sm min-[430px]:text-base sm:text-lg font-bold text-dark group-hover:text-primary-600 transition-colors leading-tight font-heading">
              {followersCount}
            </span>
            <span className="text-[9px] min-[430px]:text-[10px] font-semibold uppercase tracking-[0.08em] text-muted group-hover:text-primary-700 font-sans truncate block">
              Followers
            </span>
          </button>

          {/* Following */}
          <button
            type="button"
            onClick={() => openRelationsModal("following")}
            className="p-2 sm:p-3 text-center transition hover:bg-primary-50/50 group"
          >
            <span className="block text-sm min-[430px]:text-base sm:text-lg font-bold text-dark group-hover:text-primary-600 transition-colors leading-tight font-heading">
              {followingCount}
            </span>
            <span className="text-[9px] min-[430px]:text-[10px] font-semibold uppercase tracking-[0.08em] text-muted group-hover:text-primary-700 font-sans truncate block">
              Following
            </span>
          </button>

          {/* Mutuals / Trip Mates / Badges */}
          <button
            type="button"
            onClick={() =>
              openRelationsModal(
                profileUser?.tripMatesCount > 0 ? "trip_mates" : "mutuals"
              )
            }
            className="p-2 sm:p-3 text-center transition hover:bg-primary-50/50 group col-span-2 min-[430px]:col-span-1"
          >
            <span className="block text-sm min-[430px]:text-base sm:text-lg font-bold text-dark group-hover:text-primary-600 transition-colors leading-tight font-heading">
              {profileUser?.tripMatesCount || mutualCount || 0}
            </span>
            <span className="text-[9px] min-[430px]:text-[10px] font-semibold uppercase tracking-[0.08em] text-muted group-hover:text-primary-700 font-sans truncate block">
              {profileUser?.tripMatesCount > 0 ? "Trip Mates" : "Mutuals"}
            </span>
          </button>
        </div>
      </div>
    </section>
  );
};

export default ProfileHeader;