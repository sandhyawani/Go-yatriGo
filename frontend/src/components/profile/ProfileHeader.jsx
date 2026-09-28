import React, { useState, useEffect, useRef } from "react";
import { Mail, Phone, Calendar, MapPin, Clock, Edit, Share2, Ban, ShieldAlert, Star, ShieldCheck, XCircle, MoreVertical, MessageCircle, Check, UserPlus, UserCheck, Loader2, X, Eye } from "lucide-react";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../../api/axios";
import { getAvatarUrl } from "../../utils/avatar";
import { toHttps } from "../../utils/toHttps";
import { showToast } from "../../utils/showToast";
import { chatService } from "../../services/chatService";
import { isActuallyVerified } from "../../utils/verification";
import { compressImage } from "../../utils/compressImage";
import { INDIAN_STATES_AND_CITIES } from "../../constants/locationData";
import CustomSelect from "../ui/CustomSelect";

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
  triggerInlineField = null,
  onTriggerInlineFieldHandled,
}) => {
  const [copied, setCopied] = useState(false);
  const [showPhotoModal, setShowPhotoModal] = useState(false);

  // Inline edit state machine
  const [activeField, setActiveField] = useState(null);
  const [editValues, setEditValues] = useState({
    name: "",
    username: "",
    bio: "",
    state: "",
    city: "",
    mobile: "",
    interests: [],
  });
  const [fieldErrors, setFieldErrors] = useState({});
  const [isSaving, setIsSaving] = useState(false);
  const [newInterestInput, setNewInterestInput] = useState("");

  // Avatar inline editing
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState(null);
  const avatarFileInputRef = useRef(null);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setShowPhotoModal(false);
      }
    };
    if (showPhotoModal) {
      window.addEventListener("keydown", handleKeyDown);
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showPhotoModal]);

  // Clean up avatar preview URL on change/unmount
  useEffect(() => {
    return () => {
      if (avatarPreview && avatarPreview.startsWith("blob:")) {
        URL.revokeObjectURL(avatarPreview);
      }
    };
  }, [avatarPreview]);

  // Handle external trigger for inline editing (e.g. from completion checklist)
  useEffect(() => {
    if (triggerInlineField && isOwnProfile) {
      if (triggerInlineField === "avatar") {
        avatarFileInputRef.current?.click();
      } else {
        handleStartEdit(triggerInlineField);
      }
      onTriggerInlineFieldHandled?.();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [triggerInlineField, isOwnProfile]);

  const handleStartEdit = (field) => {
    if (!isOwnProfile || isSaving) return;

    if (activeField === "avatar") {
      handleCancelAvatar();
    }

    setEditValues({
      name: profileUser?.name || "",
      username: profileUser?.username || "",
      bio: profileUser?.bio || "",
      state: profileUser?.state || "",
      city: profileUser?.city || "",
      mobile: profileUser?.mobile || "",
      interests: Array.isArray(profileUser?.interests) ? [...profileUser.interests] : [],
    });
    setNewInterestInput("");
    setFieldErrors({});
    setActiveField(field);
  };

  const handleCancelEdit = () => {
    if (isSaving) return;
    if (activeField === "avatar") {
      handleCancelAvatar();
      return;
    }
    setFieldErrors({});
    setActiveField(null);
  };

  const handleFieldChange = (field, value) => {
    setEditValues((prev) => ({ ...prev, [field]: value }));
    if (fieldErrors[field]) {
      setFieldErrors((prev) => ({ ...prev, [field]: "" }));
    }
  };

  const handleAddInterest = (interestToAdd) => {
    const trimmed = (interestToAdd || "").trim();
    if (!trimmed) return;
    if (editValues.interests.length >= 10) {
      setFieldErrors((prev) => ({ ...prev, interests: "Maximum 10 interests allowed." }));
      return;
    }
    if (editValues.interests.some((item) => item.toLowerCase() === trimmed.toLowerCase())) {
      setFieldErrors((prev) => ({ ...prev, interests: "Interest already added." }));
      return;
    }
    setEditValues((prev) => ({
      ...prev,
      interests: [...prev.interests, trimmed],
    }));
    setNewInterestInput("");
    setFieldErrors((prev) => ({ ...prev, interests: "" }));
  };

  const validateField = (field, values) => {
    if (field === "name") {
      const val = (values.name || "").trim();
      if (!val) return "Full name is required.";
      if (val.length > 80) return "Use 80 characters or fewer.";
    }
    if (field === "username") {
      const val = (values.username || "").trim().toLowerCase();
      if (!val) return "Username is required.";
      if (val.length < 3 || val.length > 30) return "Username must be between 3 and 30 characters.";
      if (!/^[a-z0-9_](?:[a-z0-9._]{1,28}[a-z0-9_])$/.test(val) || val.includes("..")) {
        return "Use 3-30 lowercase letters, numbers, dots, or underscores.";
      }
    }
    if (field === "bio") {
      const val = (values.bio || "").trim();
      if (val.length > 280) return "Use 280 characters or fewer.";
    }
    if (field === "location") {
      const state = (values.state || "").trim();
      const city = (values.city || "").trim();
      if (!state) return "State is required.";
      if (!city) return "City is required.";
      const validCities = INDIAN_STATES_AND_CITIES[state];
      if (!validCities || !validCities.includes(city)) {
        return "Selected city does not belong to the state.";
      }
    }
    if (field === "mobile") {
      const val = (values.mobile || "").trim();
      if (val && !/^[6-9]\d{9}$/.test(val)) {
        return "Enter a valid 10-digit Indian mobile number.";
      }
    }
    if (field === "interests") {
      if (values.interests && values.interests.length > 10) {
        return "Maximum 10 interests allowed.";
      }
    }
    return null;
  };

  const handleSaveField = async (field) => {
    const error = validateField(field, editValues);
    if (error) {
      setFieldErrors((prev) => ({ ...prev, [field]: error }));
      return;
    }
    setFieldErrors((prev) => ({ ...prev, [field]: "" }));

    const targetUserId = profileUser?._id || profileUser?.id;
    if (!targetUserId) {
      showToast.error("User not found");
      return;
    }

    let payload = {};
    if (field === "name") {
      payload = { name: editValues.name.trim() };
    } else if (field === "username") {
      payload = { username: editValues.username.trim().toLowerCase() };
    } else if (field === "bio") {
      payload = { bio: editValues.bio.trim() };
    } else if (field === "location") {
      payload = { state: editValues.state.trim(), city: editValues.city.trim(), country: "India" };
    } else if (field === "mobile") {
      payload = { mobile: editValues.mobile.trim() };
    } else if (field === "interests") {
      payload = { interests: editValues.interests };
    }

    setIsSaving(true);
    try {
      const response = await axios.put(`/users/${targetUserId}`, payload, {
        withCredentials: true,
      });

      const updatedUser = response.data?.user || response.data;
      if (onProfileUpdate) {
        onProfileUpdate(updatedUser);
      }
      showToast.success(`${field.charAt(0).toUpperCase() + field.slice(1)} updated successfully!`);
      setActiveField(null);
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to update profile.";
      setFieldErrors((prev) => ({ ...prev, [field]: errorMsg }));
      showToast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarFileSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith("image/")) {
      showToast.error("Invalid file type", "Please upload a valid image file.");
      e.target.value = "";
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      showToast.error("File too large", "Image must be under 5MB.");
      e.target.value = "";
      return;
    }

    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }

    const previewUrl = URL.createObjectURL(file);
    setAvatarFile(file);
    setAvatarPreview(previewUrl);
    setActiveField("avatar");
  };

  const handleSaveAvatar = async () => {
    if (!avatarFile) return;

    const targetUserId = profileUser?._id || profileUser?.id;
    if (!targetUserId) return;

    setIsSaving(true);
    try {
      const compressed = await compressImage(avatarFile);
      const formData = new FormData();
      formData.append("image", compressed);

      const uploadRes = await axios.post("/upload", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true,
      });

      const uploadedUrl = (uploadRes.data?.secure_url || uploadRes.data?.url || "").replace(/^http:\/\//i, "https://");
      if (!uploadedUrl) {
        throw new Error("No image URL returned from upload");
      }

      const payload = {
        avatar: uploadedUrl,
        pic: uploadedUrl,
        img: uploadedUrl,
      };

      const updateRes = await axios.put(`/users/${targetUserId}`, payload, {
        withCredentials: true,
      });

      const updatedUser = updateRes.data?.user || updateRes.data;
      if (onProfileUpdate) {
        onProfileUpdate(updatedUser);
      }

      showToast.success("Profile photo updated successfully!");
      handleCancelAvatar();
    } catch (err) {
      const errorMsg =
        err?.response?.data?.message ||
        err?.message ||
        "Failed to upload photo.";
      showToast.error(errorMsg);
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancelAvatar = () => {
    if (avatarPreview && avatarPreview.startsWith("blob:")) {
      URL.revokeObjectURL(avatarPreview);
    }
    setAvatarFile(null);
    setAvatarPreview(null);
    if (avatarFileInputRef.current) {
      avatarFileInputRef.current.value = "";
    }
    if (activeField === "avatar") {
      setActiveField(null);
    }
  };

  const handleKeyDown = (e, field) => {
    if (e.key === "Escape") {
      e.preventDefault();
      handleCancelEdit();
    } else if (e.key === "Enter") {
      e.preventDefault();
      handleSaveField(field);
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
  const isTripMate = Boolean(relationship?.isTripMate);

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

  const rawBio = (profileUser?.bio || "").trim();
  const displayBio =
    rawBio &&
    /^hey there!? i(?:'m| am) using (?:go )?yatrigo\.? (?:what|wht) about you\??$/i.test(
      rawBio
    )
      ? "Hey there! I’m using YatriGo. What about you?"
      : profileUser?.bio;

  const renderVerificationBadge = () => {
    if (isActuallyVerified(profileUser)) {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2 py-0.5 text-[11px] font-bold text-emerald-700 shadow-2xs">
          <ShieldCheck className="h-3 w-3 text-emerald-600" />
          Verified
        </span>
      );
    }
    if (profileUser?.verificationStatus === "pending") {
      return (
        <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[11px] font-bold text-amber-700 shadow-2xs">
          <Clock className="h-3 w-3 text-amber-600" />
          Verification Pending
        </span>
      );
    }
    if (profileUser?.verificationStatus === "rejected") {
      return (
        <span
          className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2 py-0.5 text-[11px] font-bold text-red-600 shadow-2xs"
          title={profileUser?.verificationNote || "Verification was unsuccessful"}
        >
          <XCircle className="h-3 w-3" />
          Not Verified (Rejected)
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2 py-0.5 text-[11px] font-bold text-slate-600 shadow-2xs">
        <ShieldAlert className="h-3 w-3 text-slate-500" />
        Not Verified
      </span>
    );
  };

  const renderRelationshipAction = () => {
    if (isBlockedByMe) {
      return (
        <button
          onClick={() => setShowBlockModal(true)}
          className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-full border border-red-200 bg-red-50 px-4 text-xs font-bold text-red-600 shadow-xs transition hover:bg-red-100 active:scale-95 cursor-pointer"
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
            className="flex min-h-[34px] items-center justify-center gap-1 rounded-full bg-primary-600 px-3.5 text-xs font-bold text-white shadow-xs transition hover:bg-primary-700 active:scale-95 cursor-pointer"
          >
            <Check className="h-3.5 w-3.5" />
            Accept
          </button>
          <button
            onClick={handleDeclineRequest}
            className="flex min-h-[34px] items-center justify-center rounded-full px-3 text-xs font-bold text-secondary-700 transition hover:bg-white active:scale-95 cursor-pointer"
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
        className={`flex min-h-[38px] items-center justify-center gap-1.5 rounded-full px-4 text-xs font-bold transition-all duration-200 active:scale-95 cursor-pointer ${
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
    <>
      <section className="relative overflow-hidden rounded-3xl border border-border/80 bg-surface shadow-sm">
      <div className="relative h-28 sm:h-36 md:h-44 w-full overflow-hidden bg-gradient-to-r from-sky-800 via-brand to-sky-900 select-none group/cover">
        {profileUser?.coverImage || profileUser?.coverPic ? (
          <img
            src={toHttps(profileUser?.coverImage || profileUser?.coverPic)}
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
      </div>

      <div className="px-4 sm:px-6 pb-5 pt-0">
        <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-12 sm:-mt-14 mb-4">
          <div className="relative shrink-0 self-start">
            <div
              onClick={() => setShowPhotoModal(true)}
              className={`relative h-24 w-24 sm:h-28 sm:w-28 rounded-full overflow-hidden border-4 border-surface bg-secondary-100 shadow-md cursor-pointer hover:ring-3 hover:ring-primary-400 hover:scale-[1.02] transition-all duration-200 group/avatar ${
                hasStories
                  ? "ring-3 ring-primary-500 ring-offset-2"
                  : ""
              }`}
              title="Click to view profile photo"
            >
              <img
                src={avatarPreview || getAvatarUrl(profileUser)}
                alt={profileUser?.name || "Traveler"}
                className="h-full w-full object-cover transition-transform duration-300 group-hover/avatar:scale-105"
                onError={(e) => {
                  e.target.onerror = null;
                  e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                    profileUser?.name || "Explorer"
                  )}&background=0284c7&color=fff&bold=true`;
                }}
              />
              <div className="absolute inset-0 bg-black/25 opacity-0 group-hover/avatar:opacity-100 transition-opacity flex items-center justify-center pointer-events-none">
                <Eye className="w-6 h-6 text-white drop-shadow-md" />
              </div>
            </div>

            {/* Avatar Inline Edit Controls */}
            {isOwnProfile && activeField !== "avatar" && (
              <>
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    avatarFileInputRef.current?.click();
                  }}
                  className="absolute bottom-0 right-0 p-1.5 bg-primary-600 hover:bg-primary-700 text-white rounded-full border-2 border-surface shadow-sm hover:scale-105 transition-transform cursor-pointer"
                  title="Change Profile Photo"
                  aria-label="Change Profile Photo"
                >
                  <Edit className="w-3 h-3" />
                </button>
                <input
                  type="file"
                  ref={avatarFileInputRef}
                  onChange={handleAvatarFileSelect}
                  className="hidden"
                  accept="image/*,.heic,.heif"
                  disabled={isSaving}
                />
              </>
            )}

            {/* Save / Cancel buttons when avatar is actively being edited */}
            {activeField === "avatar" && (
              <div className="absolute -bottom-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 bg-white border border-primary-200 shadow-md rounded-full px-2 py-0.5 z-20">
                <button
                  type="button"
                  onClick={handleSaveAvatar}
                  disabled={isSaving}
                  className="p-1 rounded-full bg-primary-600 hover:bg-primary-700 text-white transition disabled:opacity-50 cursor-pointer shadow-xs"
                  title="Save new photo"
                  aria-label="Save photo"
                >
                  {isSaving ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Check className="w-3.5 h-3.5" />
                  )}
                </button>
                <button
                  type="button"
                  onClick={handleCancelAvatar}
                  disabled={isSaving}
                  className="p-1 rounded-full hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                  title="Cancel"
                  aria-label="Cancel photo change"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}
          </div>

          <div className="flex flex-wrap items-center gap-2 self-start sm:self-end pt-1">
            {isOwnProfile ? (
              <>
                <button
                  type="button"
                  onClick={() => handleStartEdit("name")}
                  className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-full bg-primary-600 px-4 text-xs font-bold text-white shadow-xs transition hover:bg-primary-700 active:scale-95 cursor-pointer"
                  title="Edit Profile"
                >
                  <Edit className="h-3.5 w-3.5" />
                  Edit Profile
                </button>

                <button
                  type="button"
                  onClick={handleShareProfile}
                  className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-bold text-secondary-700 shadow-xs transition hover:bg-secondary-50 active:scale-95 cursor-pointer"
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
                    className="flex min-h-[38px] items-center justify-center gap-1.5 rounded-full border border-border bg-surface px-3.5 text-xs font-bold text-secondary-700 shadow-xs transition hover:border-primary-200 hover:bg-primary-50 active:scale-95 cursor-pointer"
                  >
                    <MessageCircle className="h-3.5 w-3.5 text-primary-600" />
                    Message
                  </button>
                )}

                <div className="relative dropdown-container">
                  <button
                    onClick={() => setShowProfileMenu(!showProfileMenu)}
                    className="flex h-[38px] w-[38px] items-center justify-center rounded-full border border-border bg-surface text-muted shadow-xs transition hover:bg-secondary-50 hover:text-dark cursor-pointer"
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
                            className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-secondary-700 hover:bg-amber-50 hover:text-amber-800 transition-colors cursor-pointer"
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
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-secondary-700 hover:bg-secondary-50 transition-colors cursor-pointer"
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
                          className="flex w-full items-center gap-2.5 px-3.5 py-2 text-xs font-bold text-danger hover:bg-red-50 transition-colors cursor-pointer"
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

        <div className="space-y-2">
          {/* 1. Name row */}
          <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
            {activeField === "name" ? (
              <div className="flex flex-wrap items-center gap-1.5 sm:gap-2">
                <input
                  type="text"
                  value={editValues.name}
                  onChange={(e) => handleFieldChange("name", e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, "name")}
                  maxLength={80}
                  disabled={isSaving}
                  className="px-2.5 py-1 text-base sm:text-lg font-bold text-dark bg-white border border-primary-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 rounded-xl outline-none transition shadow-2xs min-w-[180px] sm:min-w-[240px]"
                  autoFocus
                  placeholder="Full name"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSaveField("name")}
                    disabled={isSaving}
                    className="p-1.5 rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                    title="Save (Enter)"
                    aria-label="Save name"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                    title="Cancel (Esc)"
                    aria-label="Cancel editing"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {fieldErrors.name && (
                  <p className="w-full text-[11px] font-semibold text-red-500">{fieldErrors.name}</p>
                )}
              </div>
            ) : (
              <div className="flex items-center gap-1.5 group/name">
                <h1 className="text-base sm:text-xl font-bold tracking-tight text-dark font-heading leading-snug">
                  {profileUser?.name || "Explorer"}
                </h1>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => handleStartEdit("name")}
                    className="p-1 rounded-full text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                    title="Edit name"
                    aria-label="Edit name"
                  >
                    <Edit className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>
            )}

            {renderVerificationBadge()}
            {Number(profileUser?.rating) > 0 ? (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2 py-0.5 text-[10.5px] sm:text-xs font-semibold text-amber-800 font-sans"
                title={profileUser?.reviewsCount ? `${profileUser.reviewsCount} review${profileUser.reviewsCount > 1 ? "s" : ""}` : "Rating"}
              >
                <Star className="h-3 w-3 fill-amber-400 text-amber-500" />
                {profileUser.rating}
              </span>
            ) : (
              <span
                className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-50 px-2 py-0.5 text-[10.5px] sm:text-xs font-semibold text-slate-500 font-sans"
                title="No reviews yet"
              >
                <Star className="h-3 w-3 text-slate-400" />
                Unrated
              </span>
            )}
          </div>

          {/* 2. Username row */}
          {activeField === "username" ? (
            <div className="flex flex-wrap items-center gap-1.5">
              <div className="flex items-center bg-white border border-primary-400 focus-within:border-primary-600 focus-within:ring-2 focus-within:ring-primary-100 rounded-lg px-2 py-0.5 shadow-2xs">
                <span className="text-xs font-bold text-primary-600 select-none">@</span>
                <input
                  type="text"
                  value={editValues.username}
                  onChange={(e) => handleFieldChange("username", e.target.value.toLowerCase().replace(/\s+/g, ""))}
                  onKeyDown={(e) => handleKeyDown(e, "username")}
                  maxLength={30}
                  disabled={isSaving}
                  className="px-1 py-0.5 text-xs font-medium text-primary-700 bg-transparent outline-none min-w-[120px] sm:min-w-[160px]"
                  autoFocus
                  placeholder="username"
                />
              </div>
              <div className="flex items-center gap-1">
                <button
                  type="button"
                  onClick={() => handleSaveField("username")}
                  disabled={isSaving}
                  className="p-1 rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                  title="Save (Enter)"
                  aria-label="Save username"
                >
                  {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                </button>
                <button
                  type="button"
                  onClick={handleCancelEdit}
                  disabled={isSaving}
                  className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                  title="Cancel (Esc)"
                  aria-label="Cancel editing"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              {fieldErrors.username && (
                <p className="w-full text-[11px] font-semibold text-red-500">{fieldErrors.username}</p>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-1 group/username">
              <p className="text-xs font-medium text-primary-600 font-sans">
                @{profileUser?.username || "traveler"}
              </p>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => handleStartEdit("username")}
                  className="p-0.5 rounded-full text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                  title="Edit username"
                  aria-label="Edit username"
                >
                  <Edit className="w-3 h-3" />
                </button>
              )}
            </div>
          )}

          {/* 3. Bio row */}
          {activeField === "bio" ? (
            <div className="w-full max-w-2xl space-y-1.5 pt-0.5">
              <textarea
                value={editValues.bio}
                onChange={(e) => handleFieldChange("bio", e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Escape") handleCancelEdit();
                  if ((e.ctrlKey || e.metaKey) && e.key === "Enter") handleSaveField("bio");
                }}
                maxLength={280}
                rows={3}
                disabled={isSaving}
                className="w-full rounded-xl border border-primary-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 bg-white p-2.5 text-xs sm:text-sm text-dark outline-none transition shadow-2xs"
                placeholder="Tell other travelers about yourself..."
                autoFocus
              />
              <div className="flex items-center justify-between">
                <span className="text-[10px] text-muted font-mono">
                  {(editValues.bio || "").length} / 280
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSaveField("bio")}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                    title="Save (Ctrl+Enter)"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold transition cursor-pointer"
                    title="Cancel (Esc)"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
              {fieldErrors.bio && (
                <p className="text-[11px] font-semibold text-red-500">{fieldErrors.bio}</p>
              )}
            </div>
          ) : displayBio ? (
            <div className="group/bio flex items-start gap-1 max-w-2xl pt-0.5">
              <p className="text-xs sm:text-sm text-secondary-600 font-normal sm:font-medium leading-relaxed whitespace-pre-wrap break-words font-sans">
                {displayBio}
              </p>
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => handleStartEdit("bio")}
                  className="p-1 rounded-full text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors shrink-0 cursor-pointer"
                  title="Edit bio"
                  aria-label="Edit bio"
                >
                  <Edit className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : isOwnProfile ? (
            <button
              type="button"
              onClick={() => handleStartEdit("bio")}
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium py-0.5 hover:underline cursor-pointer"
            >
              <Edit className="w-3 h-3" />
              <span>+ Add Bio</span>
            </button>
          ) : null}

          {/* 4. Metadata details row (Location, Mobile, Joined, Email) */}
          <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1.5 text-xs text-muted font-medium pt-1 font-sans">
            {/* Location */}
            {activeField === "location" ? (
              <div className="flex flex-wrap items-center gap-1.5 py-1 w-full max-w-md">
                <MapPin className="h-3.5 w-3.5 text-danger shrink-0" />
                <div className="min-w-[130px] flex-1">
                  <CustomSelect
                    value={editValues.state}
                    onChange={(e) => {
                      const state = e.target.value;
                      setEditValues((prev) => ({ ...prev, state, city: "" }));
                      setFieldErrors((prev) => ({ ...prev, location: "" }));
                    }}
                    options={Object.keys(INDIAN_STATES_AND_CITIES).map((s) => ({ value: s, label: s }))}
                    placeholder="Select State"
                    searchable={true}
                  />
                </div>
                <div className="min-w-[130px] flex-1">
                  <CustomSelect
                    value={editValues.city}
                    onChange={(e) => {
                      const city = e.target.value;
                      setEditValues((prev) => ({ ...prev, city }));
                      setFieldErrors((prev) => ({ ...prev, location: "" }));
                    }}
                    disabled={!editValues.state}
                    options={
                      editValues.state && INDIAN_STATES_AND_CITIES[editValues.state]
                        ? INDIAN_STATES_AND_CITIES[editValues.state].map((c) => ({ value: c, label: c }))
                        : []
                    }
                    placeholder={editValues.state ? "Select City" : "Select State first"}
                    searchable={true}
                  />
                </div>
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSaveField("location")}
                    disabled={isSaving}
                    className="p-2 rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                    title="Save location"
                    aria-label="Save location"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="p-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                    title="Cancel"
                    aria-label="Cancel"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
                {fieldErrors.location && (
                  <p className="w-full text-[11px] font-semibold text-red-500">{fieldErrors.location}</p>
                )}
              </div>
            ) : profileUser?.city || profileUser?.state || profileUser?.country ? (
              <span className="inline-flex items-center gap-1 text-secondary-600">
                <MapPin className="h-3.5 w-3.5 text-danger shrink-0" />
                <span>
                  {profileUser?.city && profileUser?.state
                    ? `${profileUser.city}, ${profileUser.state}`
                    : profileUser?.city || profileUser?.country}
                </span>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => handleStartEdit("location")}
                    className="p-0.5 rounded-full text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                    title="Edit location"
                    aria-label="Edit location"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                )}
              </span>
            ) : isOwnProfile ? (
              <button
                type="button"
                onClick={() => handleStartEdit("location")}
                className="inline-flex items-center gap-1 text-primary-600 bg-primary-50 border border-primary-200 px-2.5 py-0.5 rounded-full text-xs font-semibold hover:bg-primary-100 transition-colors cursor-pointer"
              >
                <MapPin className="h-3 w-3 text-danger" /> Add Location
                <Edit className="w-2.5 h-2.5 ml-0.5 text-primary-500" />
              </button>
            ) : null}

            {/* Mobile / Phone */}
            {activeField === "mobile" ? (
              <div className="flex flex-wrap items-center gap-1.5">
                <Phone className="h-3.5 w-3.5 text-secondary-500 shrink-0" />
                <input
                  type="tel"
                  value={editValues.mobile}
                  onChange={(e) => handleFieldChange("mobile", e.target.value.replace(/\D/g, ""))}
                  onKeyDown={(e) => handleKeyDown(e, "mobile")}
                  maxLength={10}
                  disabled={isSaving}
                  className="px-2 py-0.5 text-xs font-medium text-dark bg-white border border-primary-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 rounded-lg outline-none transition shadow-2xs w-28 sm:w-32"
                  autoFocus
                  placeholder="10-digit mobile"
                />
                <div className="flex items-center gap-1">
                  <button
                    type="button"
                    onClick={() => handleSaveField("mobile")}
                    disabled={isSaving}
                    className="p-1 rounded-lg bg-primary-600 hover:bg-primary-700 text-white shadow-xs transition disabled:opacity-50 cursor-pointer"
                    title="Save (Enter)"
                    aria-label="Save mobile"
                  >
                    {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Check className="w-3 h-3" />}
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="p-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 transition cursor-pointer"
                    title="Cancel (Esc)"
                    aria-label="Cancel editing"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                {fieldErrors.mobile && (
                  <p className="w-full text-[11px] font-semibold text-red-500">{fieldErrors.mobile}</p>
                )}
              </div>
            ) : profileUser?.mobile ? (
              <span className="inline-flex items-center gap-1 text-secondary-600">
                <Phone className="h-3.5 w-3.5 text-secondary-500 shrink-0" />
                <span>{profileUser.mobile}</span>
                {isOwnProfile && (
                  <button
                    type="button"
                    onClick={() => handleStartEdit("mobile")}
                    className="p-0.5 rounded-full text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors cursor-pointer"
                    title="Edit mobile"
                    aria-label="Edit mobile"
                  >
                    <Edit className="w-3 h-3" />
                  </button>
                )}
              </span>
            ) : isOwnProfile ? (
              <button
                type="button"
                onClick={() => handleStartEdit("mobile")}
                className="inline-flex items-center gap-1 text-slate-500 hover:text-primary-600 text-xs font-medium hover:underline cursor-pointer"
                title="Add mobile number"
              >
                <Phone className="h-3.5 w-3.5 text-slate-400" />
                <span>+ Add Mobile</span>
                <Edit className="w-2.5 h-2.5 ml-0.5 text-slate-400" />
              </button>
            ) : null}

            {/* Member Since (Read-only metadata) */}
            <span className="inline-flex items-center gap-1 text-secondary-600">
              <Calendar className="h-3.5 w-3.5 text-muted shrink-0" />
              Joined {memberSinceFormatted}
            </span>

            {/* Email (Read-only account identity) */}
            {isOwnProfile && profileUser?.email && (
              <span className="inline-flex items-center gap-1 text-muted">
                <Mail className="h-3.5 w-3.5 shrink-0" />
                <span className="break-all">{profileUser.email}</span>
              </span>
            )}
          </div>

          {/* 5. Interests */}
          {activeField === "interests" ? (
            <div className="w-full max-w-2xl space-y-2 pt-1.5 font-sans">
              <div className="flex flex-wrap items-center gap-1.5">
                {editValues.interests.map((interest, idx) => (
                  <span
                    key={idx}
                    className="inline-flex items-center gap-1 rounded-full border border-primary-200 bg-primary-50 px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold text-primary-700 shadow-2xs"
                  >
                    <span>{INTEREST_ICON_MAP[(interest || "").toLowerCase()] || "🌍"}</span>
                    <span>{interest}</span>
                    <button
                      type="button"
                      onClick={() => {
                        const updated = editValues.interests.filter((_, i) => i !== idx);
                        setEditValues((prev) => ({ ...prev, interests: updated }));
                      }}
                      className="ml-0.5 hover:text-danger rounded-full p-0.5 transition cursor-pointer"
                      title="Remove interest"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>

              {editValues.interests.length < 10 && (
                <div className="flex items-center gap-1.5 max-w-sm">
                  <input
                    type="text"
                    value={newInterestInput}
                    onChange={(e) => setNewInterestInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddInterest(newInterestInput);
                      }
                    }}
                    placeholder="Add interest (e.g. Hiking)"
                    className="px-2.5 py-1 text-xs font-medium text-dark bg-white border border-primary-400 focus:border-primary-600 focus:ring-2 focus:ring-primary-100 rounded-lg outline-none transition shadow-2xs flex-1"
                  />
                  <button
                    type="button"
                    onClick={() => handleAddInterest(newInterestInput)}
                    className="px-2.5 py-1 bg-primary-50 hover:bg-primary-100 border border-primary-200 text-primary-700 text-xs font-bold rounded-lg transition cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              )}

              {/* Quick suggestions */}
              {editValues.interests.length < 10 && (
                <div className="flex flex-wrap items-center gap-1 pt-0.5">
                  <span className="text-[10px] text-muted font-medium mr-1">Suggestions:</span>
                  {["Photography", "Road Trips", "Trekking", "Mountains", "Beaches", "Food", "Camping", "Solo Travel", "Culture", "Backpacking"]
                    .filter((item) => !editValues.interests.some((existing) => existing.toLowerCase() === item.toLowerCase()))
                    .slice(0, 5)
                    .map((suggestion) => (
                      <button
                        key={suggestion}
                        type="button"
                        onClick={() => handleAddInterest(suggestion)}
                        className="text-[10.5px] px-2 py-0.5 bg-slate-100 hover:bg-primary-50 hover:text-primary-700 rounded-full border border-slate-200 text-slate-600 transition cursor-pointer"
                      >
                        + {suggestion}
                      </button>
                    ))}
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-muted font-mono">
                  {editValues.interests.length} / 10 interests
                </span>
                <div className="flex items-center gap-1.5">
                  <button
                    type="button"
                    onClick={() => handleSaveField("interests")}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-3 py-1 rounded-lg bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-xs transition disabled:opacity-50 cursor-pointer"
                  >
                    {isSaving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                    <span>Save</span>
                  </button>
                  <button
                    type="button"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="flex items-center gap-1 px-2.5 py-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-600 text-xs font-semibold transition cursor-pointer"
                  >
                    <X className="w-3.5 h-3.5" />
                    <span>Cancel</span>
                  </button>
                </div>
              </div>
              {fieldErrors.interests && (
                <p className="text-[11px] font-semibold text-red-500">{fieldErrors.interests}</p>
              )}
            </div>
          ) : profileUser?.interests && profileUser.interests.length > 0 ? (
            <div className="flex flex-wrap items-center gap-1.5 pt-1.5 font-sans group/interests">
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
                    className="inline-flex items-center gap-1 rounded-full border border-primary-100 bg-primary-50/80 px-2.5 py-0.5 text-[11px] sm:text-xs font-semibold text-primary-700"
                  >
                    <span>
                      {INTEREST_ICON_MAP[(interest || "").toLowerCase()] || "🌍"}
                    </span>
                    <span>{interest}</span>
                  </span>
                ))}
              {isOwnProfile && (
                <button
                  type="button"
                  onClick={() => handleStartEdit("interests")}
                  className="p-1 rounded-full text-slate-400 hover:text-primary-600 hover:bg-primary-50 transition-colors ml-0.5 cursor-pointer"
                  title="Edit interests"
                  aria-label="Edit interests"
                >
                  <Edit className="w-3 h-3" />
                </button>
              )}
            </div>
          ) : isOwnProfile ? (
            <button
              type="button"
              onClick={() => handleStartEdit("interests")}
              className="inline-flex items-center gap-1 text-xs text-primary-600 hover:text-primary-700 font-medium py-1 hover:underline cursor-pointer"
            >
              <Edit className="w-3 h-3" />
              <span>+ Add Interests</span>
            </button>
          ) : null}
        </div>

        <div className="mt-4 grid grid-cols-3 min-[430px]:grid-cols-5 overflow-hidden rounded-2xl border border-border/80 bg-secondary-50/60 divide-y min-[430px]:divide-y-0 divide-x divide-border/60">
          <button
            type="button"
            onClick={() => setActiveTab("posts")}
            className="p-2 sm:p-3 text-center transition hover:bg-primary-50/50 group"
          >
            <span className="block text-sm min-[430px]:text-base sm:text-lg font-bold text-dark group-hover:text-primary-600 transition-colors leading-tight font-heading">
              {memoriesCount}
            </span>
            <span className="mt-1 text-[11px] sm:text-xs font-medium text-slate-500 group-hover:text-primary-700 font-sans block text-center leading-tight">
              Memories
            </span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab("trips")}
            className="p-2 sm:p-3 text-center transition hover:bg-primary-50/50 group"
          >
            <span className="block text-sm min-[430px]:text-base sm:text-lg font-bold text-dark group-hover:text-primary-600 transition-colors leading-tight font-heading">
              {completedTrips}
            </span>
            <span className="mt-1 text-[11px] sm:text-xs font-medium text-slate-500 group-hover:text-primary-700 font-sans block text-center leading-tight">
              {isOwnProfile ? "My Trips" : "Trips"}
            </span>
          </button>

          <button
            type="button"
            onClick={() => openRelationsModal("followers")}
            className="p-2 sm:p-3 text-center transition hover:bg-primary-50/50 group"
          >
            <span className="block text-sm min-[430px]:text-base sm:text-lg font-bold text-dark group-hover:text-primary-600 transition-colors leading-tight font-heading">
              {followersCount}
            </span>
            <span className="mt-1 text-[11px] sm:text-xs font-medium text-slate-500 group-hover:text-primary-700 font-sans block text-center leading-tight">
              Followers
            </span>
          </button>

          <button
            type="button"
            onClick={() => openRelationsModal("following")}
            className="p-2 sm:p-3 text-center transition hover:bg-primary-50/50 group"
          >
            <span className="block text-sm min-[430px]:text-base sm:text-lg font-bold text-dark group-hover:text-primary-600 transition-colors leading-tight font-heading">
              {followingCount}
            </span>
            <span className="mt-1 text-[11px] sm:text-xs font-medium text-slate-500 group-hover:text-primary-700 font-sans block text-center leading-tight">
              Following
            </span>
          </button>

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
            <span className="mt-1 text-[11px] sm:text-xs font-medium text-slate-500 group-hover:text-primary-700 font-sans block text-center leading-tight">
              {profileUser?.tripMatesCount > 0 ? "Trip Mates" : "Mutuals"}
            </span>
          </button>
        </div>
      </div>
    </section>

      <AnimatePresence>
        {showPhotoModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[9999] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 sm:p-6"
            onClick={() => setShowPhotoModal(false)}
          >
            <motion.div
              initial={{ scale: 0.85, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.85, opacity: 0 }}
              transition={{ type: "spring", stiffness: 320, damping: 26 }}
              className="relative max-w-md sm:max-w-lg w-full flex flex-col items-center"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="w-full flex items-center justify-between pb-3 text-white">
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-full overflow-hidden border-2 border-white/20 shadow-xs">
                    <img
                      src={avatarPreview || getAvatarUrl(profileUser)}
                      alt={profileUser?.name || "Traveler"}
                      className="h-full w-full object-cover"
                    />
                  </div>
                  <div>
                    <h3 className="text-sm sm:text-base font-bold text-white leading-tight">
                      {profileUser?.name || "Traveler"}
                    </h3>
                    {profileUser?.username && (
                      <p className="text-xs text-white/70">
                        @{profileUser.username}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  {isOwnProfile && (
                    <button
                      type="button"
                      onClick={() => {
                        setShowPhotoModal(false);
                        avatarFileInputRef.current?.click();
                      }}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition active:scale-95 border border-white/15 cursor-pointer"
                    >
                      <Edit className="w-3.5 h-3.5" />
                      <span>Change Photo</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={() => setShowPhotoModal(false)}
                    className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition active:scale-95 border border-white/15 cursor-pointer"
                    title="Close (Esc)"
                    aria-label="Close"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="relative w-full max-h-[72vh] flex items-center justify-center rounded-2xl overflow-hidden bg-black/40 border border-white/10 shadow-2xl p-2 sm:p-3">
                <img
                  src={avatarPreview || getAvatarUrl(profileUser)}
                  alt={profileUser?.name || "Profile Photo"}
                  className="max-h-[66vh] w-auto max-w-full object-contain rounded-xl select-none"
                  onError={(e) => {
                    e.target.onerror = null;
                    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
                      profileUser?.name || "Explorer"
                    )}&background=0284c7&color=fff&bold=true`;
                  }}
                />
              </div>

              <div className="flex items-center gap-3 pt-3">
                {hasStories && (
                  <button
                    type="button"
                    onClick={() => {
                      setShowPhotoModal(false);
                      handleOpenStory?.(0);
                    }}
                    className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md transition active:scale-95 cursor-pointer"
                  >
                    <span>View Story</span>
                  </button>
                )}
                <a
                  href={avatarPreview || getAvatarUrl(profileUser)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 px-3.5 py-1.5 rounded-full bg-white/10 hover:bg-white/20 text-white/90 hover:text-white text-xs font-semibold transition border border-white/15 cursor-pointer"
                >
                  <span>Open Full Size</span>
                </a>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};

export default ProfileHeader;