import axios from "../api/axios";
import React, { useEffect, useMemo, useRef, useState } from "react";
import { useLocation, useNavigate, Link } from "react-router-dom";
import { useAuth } from "../context/authContext";
import { showToast } from "../utils/showToast";
import { getAvatarUrl } from "../utils/avatar";
import { compressImage } from "../utils/compressImage";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Globe,
  ArrowLeft,
  ShieldCheck,
  Save,
  Camera,
  Home as HomeIcon,
  Compass,
  Plus,
  MessageCircle,
  User as UserIcon,
  Calendar,
  Image,
  Layout,
  AtSign,
  AlignLeft,
  Users,
  AlertCircle,
  Loader2,
  Check,
  X,
  ShieldAlert,
} from "lucide-react";
import moment from "moment";

const CLOUD_NAME =
  process.env.REACT_APP_CLOUDINARY_CLOUD ||
  (process.env.NODE_ENV === "production" ? "" : "dpgelkpd4");
const UPLOAD_PRESET =
  process.env.REACT_APP_CLOUDINARY_PRESET ||
  (process.env.NODE_ENV === "production" ? "" : "upload");
const MAX_FILE_SIZE_MB = 2;
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp", "image/gif"];
const MAX_NAME_LENGTH = 80;
const MAX_USERNAME_LENGTH = 30;
const MAX_COUNTRY_LENGTH = 80;
const MAX_MOBILE_LENGTH = 20;
const MAX_BIO_LENGTH = 280;
const USERNAME_REGEX = /^[a-z0-9_](?:[a-z0-9._]{1,28}[a-z0-9_])$/;
const MOBILE_REGEX = /^[+]?[\d\s().-]{7,20}$/;

const normalizeSingleLine = (value) => value.replace(/\s+/g, " ").trim();
const normalizeUsername = (value) =>
  value.replace(/\s+/g, "").trim().toLowerCase();
const normalizeBio = (value) => value.replace(/\r\n/g, "\n").trim();
const getProfileId = (profile) => profile?._id || profile?.id || "";

const buildProfilePayload = ({
  name,
  username,
  country,
  mobile,
  bio,
  interests,
  govIdType,
}) => ({
  name: normalizeSingleLine(name),
  username: normalizeUsername(username),
  country: normalizeSingleLine(country),
  mobile: normalizeSingleLine(mobile),
  bio: normalizeBio(bio),
  interests: interests || [],
  govIdType: govIdType || "",
});

const getErrorMessage = (error) =>
  error?.response?.data?.message ||
  error?.message ||
  "Something went wrong while saving your changes.";

const validateProfile = (payload) => {
  const nextErrors = {};

  if (!payload.name) {
    nextErrors.name = "Full name is required.";
  } else if (payload.name.length > MAX_NAME_LENGTH) {
    nextErrors.name = `Use ${MAX_NAME_LENGTH} characters or fewer.`;
  }

  if (!payload.username) {
    nextErrors.username = "Username is required.";
  } else if (
    payload.username.length > MAX_USERNAME_LENGTH ||
    !USERNAME_REGEX.test(payload.username) ||
    payload.username.includes("..")
  ) {
    nextErrors.username =
      "Use 3-30 lowercase letters, numbers, dots, or underscores.";
  }

  if (payload.country.length > MAX_COUNTRY_LENGTH) {
    nextErrors.country = `Use ${MAX_COUNTRY_LENGTH} characters or fewer.`;
  }

  if (payload.mobile && !MOBILE_REGEX.test(payload.mobile)) {
    nextErrors.mobile = "Enter a valid phone number.";
  }

  if (payload.mobile.length > MAX_MOBILE_LENGTH) {
    nextErrors.mobile = `Use ${MAX_MOBILE_LENGTH} characters or fewer.`;
  }

  if (payload.bio.length > MAX_BIO_LENGTH) {
    nextErrors.bio = `Use ${MAX_BIO_LENGTH} characters or fewer.`;
  }

  if (payload.interests && payload.interests.length > 10) {
    nextErrors.interests = "Maximum 10 interests allowed.";
  }

  return nextErrors;
};

const FieldError = ({ id, message }) => {
  if (!message) return null;

  return (
    <p
      id={id}
      role="alert"
      className="mt-1.5 flex items-center gap-1.5 px-1 text-[10px] font-bold text-red-500"
    >
      <AlertCircle className="h-3 w-3 shrink-0" />
      <span>{message}</span>
    </p>
  );
};

const Profileupdate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const { user, updateUser } = useAuth();

  const profileUser = state?._id ? state : state?.user || user;
  const profileUserId = getProfileId(profileUser);
  const isAdminMode = location.pathname.startsWith("/admin");
  const backPath = isAdminMode ? "/admin/profile" : "/profile";
  const successPath = isAdminMode ? "/admin/profile" : "/profile";

  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});

  const [stats, setStats] = useState({
    postsCount: 0,
    storiesCount: 0,
    groupsCount: 0,
    joinedDate: profileUser?.createdAt || Date.now(),
  });

  const [name, setName] = useState(profileUser?.name || "");
  const [username, setUsername] = useState(profileUser?.username || "");
  const [country, setCountry] = useState(profileUser?.country || "");
  const [mobile, setMobile] = useState(profileUser?.mobile || "");
  const [bio, setBio] = useState(profileUser?.bio || "");
  const [interests, setInterests] = useState(profileUser?.interests || []);
  const [newInterest, setNewInterest] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const previewUrlRef = useRef(null);
  const fileInputRef = useRef(null);

  const [govIdFile, setGovIdFile] = useState(null);
  const [govIdPreview, setGovIdPreview] = useState("");
  const govIdPreviewUrlRef = useRef(null);
  const [govIdType, setGovIdType] = useState("");

  const pageMeta = useMemo(
    () =>
      isAdminMode
        ? {
            title: "Admin Profile Identity",
            subtitle: "Update your public administrator details",
            backLabel: "Back to Admin Profile",
          }
        : {
            title: "Edit Public Identity",
            subtitle: "Update how travelers see you on GoYatriGo",
            backLabel: "Back to Profile",
          },
    [isAdminMode],
  );

  const currentPayload = useMemo(
    () =>
      buildProfilePayload({
        name,
        username,
        country,
        mobile,
        bio,
        interests,
        govIdType,
      }),
    [name, username, country, mobile, bio, interests, govIdType],
  );

  const originalPayload = useMemo(
    () =>
      buildProfilePayload({
        name: profileUser?.name || "",
        username: profileUser?.username || "",
        country: profileUser?.country || "",
        mobile: profileUser?.mobile || "",
        bio: profileUser?.bio || "",
        interests: profileUser?.interests || [],
        govIdType: profileUser?.govIdType || "",
      }),
    [profileUser],
  );

  const hasChanges =
    Boolean(file) ||
    Object.keys(currentPayload).some((key) => {
      if (Array.isArray(currentPayload[key])) {
        return (
          JSON.stringify(currentPayload[key]) !==
          JSON.stringify(originalPayload[key])
        );
      }
      return currentPayload[key] !== originalPayload[key];
    });

  useEffect(() => {
    if (!profileUser) {
      navigate("/login", { replace: true });
      return;
    }

    setName(profileUser.name || "");
    setUsername(profileUser.username || "");
    setCountry(profileUser.country || "");
    setMobile(profileUser.mobile || "");
    setBio(profileUser.bio || "");
    setInterests(profileUser.interests || []);
    setGovIdType(profileUser.govIdType || "");
    setErrors({});

    let isActive = true;

    const fetchStats = async () => {
      try {
        const res = await axios.get("/users/profile-stats", {
          withCredentials: true,
        });
        if (isActive && res.data.success) {
          setStats({
            postsCount: res.data.postsCount,
            storiesCount: res.data.storiesCount,
            groupsCount: res.data.groupsCount,
            joinedDate: res.data.joinedDate || profileUser.createdAt,
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile stats:", error);
      }
    };
    fetchStats();

    return () => {
      isActive = false;
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
        previewUrlRef.current = null;
      }
    };
  }, [navigate, profileUser]);

  const inputClass =
    "w-full rounded-2xl border border-slate-100 bg-[#FAFAFA]/80 px-5 py-3 text-xs font-bold text-[#111827] shadow-inner outline-none transition-all placeholder:text-slate-400 focus:border-[#6C4DF6] focus:bg-white focus:ring-4 focus:ring-[#6C4DF6]/10";

  const labelClass =
    "mb-2 ml-2 block select-none text-[10px] font-black uppercase tracking-widest text-slate-500";

  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      showToast.error(
        "Invalid file type",
        "Please upload a JPG, PNG, WebP, or GIF image.",
      );
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showToast.error(
        "File too large",
        `Image must be under ${MAX_FILE_SIZE_MB}MB.`,
      );
      event.target.value = "";
      return;
    }

    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
    }

    const objectUrl = URL.createObjectURL(selectedFile);
    previewUrlRef.current = objectUrl;
    setFile(selectedFile);
    setPreview(objectUrl);
    clearError("file");
  };

  const clearFile = () => {
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    if (govIdPreviewUrlRef.current)
      URL.revokeObjectURL(govIdPreviewUrlRef.current);

    setFile(null);
    setPreview("");
    setGovIdFile(null);
    setGovIdPreview("");
    setGovIdType("");
    setErrors({});

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGovIdChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (
      !["image/jpeg", "image/png", "application/pdf"].includes(
        selectedFile.type,
      )
    ) {
      showToast.error(
        "Invalid file type",
        "Only JPG, PNG, and PDF files are allowed.",
      );
      return;
    }

    if (selectedFile.size > 10 * 1024 * 1024) {
      showToast.error("File too large", "Government ID must be under 10MB.");
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    if (govIdPreviewUrlRef.current)
      URL.revokeObjectURL(govIdPreviewUrlRef.current);
    govIdPreviewUrlRef.current = url;

    setGovIdFile(selectedFile);
    setGovIdPreview(url);
  };

  const uploadImageToCloudinary = async (imageFile) => {
    const compressed = await compressImage(imageFile);
    const data = new FormData();
    data.append("image", compressed);

    const uploadUrl = axios.defaults.baseURL ? `${axios.defaults.baseURL}/upload` : "/api/upload";

    const imageUrl = await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("POST", uploadUrl);
      xhr.timeout = 45000;

      // Attach token from localStorage
      try {
        const userStr = localStorage.getItem("user");
        if (userStr) {
          const user = JSON.parse(userStr);
          if (user && user.token) {
            xhr.setRequestHeader("Authorization", `Bearer ${user.token}`);
          }
        }
      } catch (err) {
        console.error("Failed to attach auth header:", err);
      }

      xhr.upload.onprogress = (event) => {
        if (event.lengthComputable) {
          setUploadProgress(Math.round((event.loaded / event.total) * 100));
        }
      };

      xhr.onload = () => {
        try {
          const response = JSON.parse(xhr.responseText);
          if (xhr.status === 200 && response.url) {
            resolve(response.url);
            return;
          }
          reject(new Error(response.message || "Upload failed"));
        } catch {
          reject(new Error("Invalid upload response"));
        }
      };

      xhr.onerror = () => reject(new Error("Network error during upload"));
      xhr.ontimeout = () => reject(new Error("Image upload timed out"));
      xhr.send(data);
    });

    return imageUrl;
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (loading) return;

    try {
      if (!profileUserId) {
        throw new Error("Profile data is missing. Please sign in again.");
      }

      const nextErrors = validateProfile(currentPayload);
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        showToast.error(
          "Check the highlighted fields",
          "Fix the profile details before saving.",
        );
        return;
      }

      if (!hasChanges) {
        showToast.info("No changes to save");
        return;
      }

      setLoading(true);
      setUploadProgress(0);

      const updatedProfile = { ...currentPayload };

      if (file) {
        const uploadedImageUrl = await uploadImageToCloudinary(file);
        updatedProfile.img = uploadedImageUrl;
        updatedProfile.pic = uploadedImageUrl;
        updatedProfile.avatar = uploadedImageUrl;
      }

      if (govIdFile) {
        const uploadedGovIdUrl = await uploadImageToCloudinary(govIdFile);
        updatedProfile.govId = uploadedGovIdUrl;
        // User uploads a new ID, so the status should reset to pending
        updatedProfile.verificationStatus = "pending";
        updatedProfile.verificationNote = "";
      }

      const response = await axios.put(
        `/users/${profileUserId}`,
        updatedProfile,
        { withCredentials: true },
      );

      const refreshedUser = {
        ...user,
        ...profileUser,
        ...response.data,
        token: user?.token || profileUser.token,
      };

      updateUser(refreshedUser);
      setSaveSuccess(true);
      showToast.success(
        "Profile updated",
        "Your public identity has been saved.",
      );

      setTimeout(() => {
        setSaveSuccess(false);
        navigate(successPath, { replace: true });
      }, 1000);
    } catch (error) {
      console.error(error);
      showToast.error("Update failed", getErrorMessage(error));
    } finally {
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const joinedDateFormatted = moment(stats.joinedDate).format("MMMM YYYY");

  return (
    <div className="relative min-h-screen bg-[#FDFDFD] px-4 pb-24 md:pb-8 pt-0 font-sans antialiased text-[#111827] sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute top-10 right-0 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-[#6C4DF6]/10 to-fuchsia-400/10 blur-[80px]" />
      <div className="pointer-events-none absolute bottom-40 left-0 h-[20rem] w-[20rem] rounded-full bg-gradient-to-tr from-[#6C4DF6]/10 to-transparent blur-[80px]" />

      <div className="relative z-10 mx-auto max-w-5xl space-y-2">
        <Link
          to={backPath}
          className="group inline-flex select-none items-center gap-2 text-xs font-extrabold uppercase tracking-widest text-slate-400 transition-colors hover:text-[#6C4DF6]"
        >
          <div className="p-2 bg-white rounded-full shadow-sm border border-slate-100 group-hover:border-[#6C4DF6]/20 group-hover:bg-[#6C4DF6]/5 transition-all">
            <ArrowLeft className="h-4 w-4 transition-transform group-hover:-translate-x-0.5" />
          </div>
          <span>{pageMeta.backLabel}</span>
        </Link>

        <form
          id="profile-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-star"
          noValidate
        >
          {/* LEFT COLUMN: Avatar & Stats */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-5 flex flex-col gap-3"
          >
            {/* Avatar Card */}
            <div className="rounded-3xl border border-white/50 bg-white/80 backdrop-blur-xl p-6 text-center shadow-[0_10px_40px_rgba(0,0,0,0.06)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-[#6C4DF6]/5 to-transparent"></div>

              <div className="group relative inline-block select-none mb-4 mt-2">
                <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-full border-[6px] border-white shadow-xl ring-4 ring-[#6C4DF6]/20 transition-transform duration-300 group-hover:scale-105">
                  <img
                    src={
                      preview ||
                      getAvatarUrl(
                        profileUser?.pic,
                        profileUser?.img,
                        profileUser?.avatar,
                        profileUser?.name,
                      )
                    }
                    className="h-full w-full object-cover bg-slate-50"
                    alt="Avatar"
                  />
                  <label
                    htmlFor="file"
                    className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-[#6C4DF6]/80 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100"
                  >
                    <Camera className="mb-1 h-6 w-6" />
                    <span className="text-[8px] font-black uppercase tracking-widest">
                      Upload
                    </span>
                  </label>
                </div>
                <div className="absolute bottom-1 right-1 bg-[#6C4DF6] rounded-full p-1.5 border-2 border-white shadow-md">
                  <ShieldCheck className="h-4 w-4 text-white" />
                </div>
                <input
                  type="file"
                  id="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.heic,.heif"
                  disabled={loading}
                />
                <FieldError id="file-error" message={errors.file} />
              </div>

              <h3 className="text-xl font-black text-[#111827] tracking-tight truncate px-2">
                {name || "Explorer"}
              </h3>
              <p className="text-xs font-bold text-slate-400 mt-1 truncate mb-3">
                @{username || "username"}
              </p>

              <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50/80 px-3 py-1.5 text-[10px] font-bold text-slate-500 border border-slate-100/50">
                <Calendar className="h-3 w-3" />
                Member Since {joinedDateFormatted}
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4">
                  <div className="h-1 w-full rounded-full bg-slate-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-[#6C4DF6] transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[9px] font-bold text-slate-400">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>

            {/* Personality Card (Bio & Interests) */}
            <div className="rounded-3xl border border-white/50 bg-white/80 backdrop-blur-xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] relative overflow-hidden">
              <div>
                <label htmlFor="bio" className={labelClass}>
                  Bio / About Me
                </label>
                <div className="group relative flex-1">
                  <AlignLeft className="absolute left-4 top-4 h-4 w-4 text-slate-400 transition-colors group-focus-within:text-[#6C4DF6]" />
                  <textarea
                    id="bio"
                    rows="3"
                    className={`${inputClass} pl-11 py-3 min-h-[80px] overflow-hidden`}
                    value={bio}
                    onInput={(e) => {
                      e.target.style.height = "auto";
                      e.target.style.height = e.target.scrollHeight + "px";
                    }}
                    onChange={(e) => {
                      setBio(e.target.value);
                      clearError("bio");
                    }}
                    placeholder="Share your travel spirit..."
                    maxLength={MAX_BIO_LENGTH}
                    aria-invalid={Boolean(errors.bio)}
                    aria-describedby={
                      errors.bio ? "bio-error bio-count" : "bio-count"
                    }
                  />
                </div>
                <div className="mt-1 flex items-center justify-between px-1 mb-0">
                  <FieldError id="bio-error" message={errors.bio} />
                  <span
                    id="bio-count"
                    className="ml-auto text-[10px] font-bold text-slate-400"
                  >
                    {normalizeBio(bio).length} / {MAX_BIO_LENGTH}
                  </span>
                </div>
              </div>

              <div>
                <label className={labelClass}>Interests</label>
                <div className="flex flex-wrap gap-2 mb-1">
                  {interests.map((interest, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-2 py-1 bg-white border border-[#6C4DF6]/20 text-[#6C4DF6] text-[10px] font-bold rounded-xl shadow-sm"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() =>
                          setInterests(interests.filter((_, i) => i !== idx))
                        }
                        className="text-[#6C4DF6]/60 hover:text-[#6C4DF6] transition-colors focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                {interests.length < 10 && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className={`${inputClass} flex-1`}
                      placeholder="Add an interest (e.g. Photography)"
                      value={newInterest}
                      onChange={(e) => setNewInterest(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            newInterest.trim() &&
                            !interests.includes(newInterest.trim())
                          ) {
                            setInterests([...interests, newInterest.trim()]);
                            setNewInterest("");
                          }
                        }
                      }}
                    />
                    <button
                      type="button"
                      onClick={() => {
                        if (
                          newInterest.trim() &&
                          !interests.includes(newInterest.trim())
                        ) {
                          setInterests([...interests, newInterest.trim()]);
                          setNewInterest("");
                        }
                      }}
                      className="px-4 py-3 bg-[#6C4DF6]/10 text-[#6C4DF6] rounded-2xl text-[10px] font-black uppercase tracking-wider hover:bg-[#6C4DF6]/20 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}
                <FieldError id="interests-error" message={errors.interests} />
              </div>
            </div>
          </motion.div>

          {/* RIGHT COLUMN: Identity Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-7"
          >
            <div className="rounded-3xl border border-white/50 bg-white/80 backdrop-blur-xl p-6 shadow-[0_10px_40px_rgba(0,0,0,0.06)] relative overflow-hidden">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 select-none">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl border border-[#6C4DF6]/20 bg-gradient-to-br from-[#6C4DF6]/10 to-fuchsia-500/10 p-3 text-[#6C4DF6]">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-black tracking-tight text-[#111827]">
                      {pageMeta.title}
                    </h2>
                    <p className="text-[10px] font-bold text-slate-400">
                      {pageMeta.subtitle}
                    </p>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                  <div>
                    <label htmlFor="name" className={labelClass}>
                      Full Name
                    </label>
                    <div className="group relative">
                      <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#6C4DF6]" />
                      <input
                        id="name"
                        className={`${inputClass} pl-11`}
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          clearError("name");
                        }}
                        required
                        placeholder="Your Name"
                        autoComplete="name"
                        maxLength={MAX_NAME_LENGTH}
                        aria-invalid={Boolean(errors.name)}
                        aria-describedby={
                          errors.name ? "name-error" : undefined
                        }
                      />
                    </div>
                    <FieldError id="name-error" message={errors.name} />
                  </div>

                  <div>
                    <label htmlFor="username" className={labelClass}>
                      Username
                    </label>
                    <div className="group relative">
                      <AtSign className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#6C4DF6]" />
                      <input
                        id="username"
                        className={`${inputClass} pl-11`}
                        value={username}
                        onChange={(e) => {
                          setUsername(e.target.value.replace(/\s+/g, ""));
                          clearError("username");
                        }}
                        onBlur={() =>
                          setUsername((value) => normalizeUsername(value))
                        }
                        placeholder="username"
                        required
                        autoComplete="username"
                        maxLength={MAX_USERNAME_LENGTH}
                        aria-invalid={Boolean(errors.username)}
                        aria-describedby={
                          errors.username ? "username-error" : undefined
                        }
                      />
                    </div>
                    <FieldError id="username-error" message={errors.username} />
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
                  <div>
                    <label className={labelClass}>Email Address</label>
                    <div className="group relative select-none">
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                      <input
                        className={`${inputClass} cursor-not-allowed border-transparent bg-slate-100 pl-11 opacity-70 shadow-none focus:ring-0`}
                        value={profileUser?.email || ""}
                        disabled
                        aria-label="Email address (read-only)"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="mobile" className={labelClass}>
                      Phone Number
                    </label>
                    <div className="group relative">
                      <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400 transition-colors group-focus-within:text-[#6C4DF6]" />
                      <input
                        id="mobile"
                        className={`${inputClass} pl-11`}
                        value={mobile}
                        onChange={(e) => {
                          setMobile(e.target.value);
                          clearError("mobile");
                        }}
                        placeholder="+1 234 567 8900"
                        autoComplete="tel"
                        inputMode="tel"
                        maxLength={MAX_MOBILE_LENGTH}
                        aria-invalid={Boolean(errors.mobile)}
                        aria-describedby={
                          errors.mobile ? "mobile-error" : undefined
                        }
                      />
                    </div>
                    <FieldError id="mobile-error" message={errors.mobile} />
                  </div>
                </div>

                {(profileUser.verificationStatus === "rejected" ||
                  !profileUser.verificationStatus ||
                  profileUser.verificationStatus === "unverified") && (
                  <div className="bg-red-50/50 border border-red-100 rounded-2xl p-5 mb-4">
                    <h3 className="text-sm font-bold text-red-900 mb-1 flex items-center gap-2">
                      <ShieldAlert className="w-4 h-4 text-red-600" />
                      {profileUser.verificationStatus === "rejected"
                        ? "Verification Rejected"
                        : "Verification Required"}
                    </h3>
                    <p className="text-xs text-red-700 mb-4 leading-relaxed">
                      {profileUser.verificationStatus === "rejected"
                        ? `Your previous Government ID was rejected. Reason: ${profileUser.verificationNote || "Invalid ID"}. Please upload a clear, valid Government ID.`
                        : "Upload a valid Government ID to get the Verified Traveler badge."}
                    </p>
                    <div className="mb-2">
                      <label className="mb-2 ml-2 block select-none text-[10px] font-black uppercase tracking-widest text-slate-500">
                        Document Type
                      </label>
                      <select
                        className={`${inputClass} !py-2 mb-2`}
                        value={govIdType}
                        onChange={(e) => setGovIdType(e.target.value)}
                      >
                        <option value="" disabled>
                          Select Document Type
                        </option>
                        <option value="Aadhaar Card">Aadhaar Card</option>
                        <option value="PAN Card">PAN Card</option>
                        <option value="Passport">Passport</option>
                        <option value="Driving License">Driving License</option>
                      </select>
                    </div>

                    <div className="relative group">
                      <ShieldCheck
                        className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.govId ? "text-red-500" : "text-slate-400 group-focus-within:text-purple-500"}`}
                      />
                      <label
                        htmlFor="govIdFile"
                        className={`w-full pl-11 pr-4 py-3 bg-white border ${errors.govId ? "border-red-300 focus:border-red-400 focus:ring-red-400/20" : "border-slate-200 focus:border-purple-500 hover:border-purple-300"} rounded-xl text-slate-900 font-bold outline-none focus:bg-slate-50 focus:ring-4 transition-all text-sm shadow-sm flex items-center justify-between cursor-pointer ${!govIdType ? "opacity-50 pointer-events-none" : ""}`}
                      >
                        <span className="truncate">
                          {govIdFile
                            ? govIdFile.name
                            : "Upload New Government ID..."}
                        </span>
                        {govIdPreview && (
                          <img
                            src={govIdPreview}
                            alt="Gov ID"
                            className="h-6 w-10 object-cover rounded shadow-sm border border-slate-200 ml-3 shrink-0"
                          />
                        )}
                      </label>
                      <input
                        type="file"
                        id="govIdFile"
                        accept="image/jpeg,image/png,application/pdf"
                        className="hidden"
                        onChange={handleGovIdChange}
                        disabled={!govIdType}
                      />
                    </div>
                    <p className="text-[10px] font-semibold text-slate-500 mt-2 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> Uploading fake or
                      unrelated documents may result in account restrictions.
                    </p>
                  </div>
                )}

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={loading || !hasChanges}
                    className="flex h-11 w-full md:w-auto md:px-8 items-center justify-center gap-2 rounded-md text-sm font-semibold text-white bg-[#6C4DF6] hover:bg-[#5b3ee0] shadow-md shadow-[#6c4df6]/20 transition-all active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {loading ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : saveSuccess ? (
                      <span>Saved Successfully</span>
                    ) : (
                      <span>{hasChanges ? "Save Changes" : "Saved"}</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </form>
      </div>

      {/* Mobile Bottom Navigation */}
      {!isAdminMode && (
        <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-[4.5rem] items-center justify-around border-t border-slate-100 bg-white/90 backdrop-blur-md px-4 pb-safe md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
          <Link
            to="/"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-[#6C4DF6] transition-colors p-2"
          >
            <HomeIcon className="h-5 w-5" />
            <span className="text-[9px] font-bold">Home</span>
          </Link>
          <Link
            to="/social/buddy"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-[#6C4DF6] transition-colors p-2"
          >
            <Compass className="h-5 w-5" />
            <span className="text-[9px] font-bold">Explore</span>
          </Link>
          <Link
            to="/social/buddy/new"
            className="relative -top-5 flex flex-col items-center"
          >
            <div className="bg-[#6C4DF6] text-white p-3.5 rounded-2xl shadow-lg shadow-[#6c4df6]/30 transform rotate-3 hover:rotate-6 transition-transform">
              <Plus className="h-6 w-6" />
            </div>
          </Link>
          <Link
            to="/social/chat"
            className="flex flex-col items-center gap-1 text-slate-400 hover:text-[#6C4DF6] transition-colors p-2"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-[9px] font-bold">Chat</span>
          </Link>
          <Link
            to="/profile"
            className="flex flex-col items-center gap-1 text-[#6C4DF6] transition-colors p-2"
          >
            <div className="relative">
              <UserIcon className="h-5 w-5" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-[#6C4DF6] rounded-full"></div>
            </div>
            <span className="text-[9px] font-bold">Profile</span>
          </Link>
        </nav>
      )}
    </div>
  );
};

export default Profileupdate;
