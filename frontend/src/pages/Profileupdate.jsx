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
  ArrowLeft,
  ShieldCheck,
  Camera,
  Home as HomeIcon,
  Compass,
  Plus,
  MessageCircle,
  User as UserIcon,
  Calendar,
  AtSign,
  AlignLeft,
  AlertCircle,
  Loader2,
  Check,
  X,
  ShieldAlert,
  MapPin,
  Clock,
  CheckCircle,
  AlertTriangle,
  ChevronDown,
  XCircle
} from "lucide-react";
import moment from "moment";
import { INDIAN_STATES_AND_CITIES } from "../constants/locationData";
import CustomSelect from "../components/ui/CustomSelect";
import { isActuallyVerified } from "../utils/verification";

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
const MAX_MOBILE_LENGTH = 20;
const MAX_BIO_LENGTH = 280;
const USERNAME_REGEX = /^[a-z0-9_](?:[a-z0-9._]{1,28}[a-z0-9_])$/;
const MOBILE_REGEX = /^[6-9]\d{9}$/;

const normalizeSingleLine = (value) => value.replace(/\s+/g, " ").trim();
const normalizeUsername = (value) =>
  value.replace(/\s+/g, "").trim().toLowerCase();
const normalizeBio = (value) => value.replace(/\r\n/g, "\n").trim();
const getProfileId = (profile) => profile?._id || profile?.id || "";

const buildProfilePayload = ({
  name,
  username,
  city,
  state,
  mobile,
  bio,
  interests,
  preferredTravelStyle,
  favoriteDestinations
}) => ({
  name: normalizeSingleLine(name),
  username: normalizeUsername(username),
  city: normalizeSingleLine(city),
  state: normalizeSingleLine(state),
  country: "India",
  mobile: normalizeSingleLine(mobile),
  bio: normalizeBio(bio),
  interests: interests || [],
  preferredTravelStyle: preferredTravelStyle || "",
  favoriteDestinations: favoriteDestinations || []
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

  if (!payload.state) {
    nextErrors.state = "State is required.";
  }

  if (!payload.city) {
    nextErrors.city = "City is required.";
  } else if (payload.state) {
    const validCities = INDIAN_STATES_AND_CITIES[payload.state];
    if (!validCities || !validCities.includes(payload.city)) {
      nextErrors.city = "Invalid city/state combination.";
    }
  }

  if (payload.mobile && !MOBILE_REGEX.test(payload.mobile)) {
    nextErrors.mobile = "Enter a valid 10-digit Indian mobile number.";
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

const uploadImageToCloudinary = async (imageFile, onProgress) => {
  const compressed = await compressImage(imageFile);
  const data = new FormData();
  data.append("image", compressed);

  const uploadUrl = axios.defaults.baseURL
    ? `${axios.defaults.baseURL}/upload`
    : "/api/upload";

  const imageUrl = await new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    xhr.open("POST", uploadUrl);
    xhr.timeout = 45000;

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
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
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

const VerificationModal = ({
  isOpen,
  onClose,
  profileUserId,
  user,
  profileUser,
  updateUser
}) => {
  const [govIdType, setGovIdType] = useState("");
  const [govIdFile, setGovIdFile] = useState(null);
  const [govIdPreview, setGovIdPreview] = useState("");
  const govIdPreviewUrlRef = useRef(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    return () => {
      if (govIdPreviewUrlRef.current) URL.revokeObjectURL(govIdPreviewUrlRef.current);
    };
  }, []);

  const handleGovIdChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (
      !["image/jpeg", "image/png", "application/pdf"].includes(selectedFile.type)
    ) {
      showToast.error("Invalid file type", "Only JPG, PNG, and PDF files are allowed.");
      return;
    }
    if (selectedFile.size > 10 * 1024 * 1024) {
      showToast.error("File too large", "Government ID must be under 10MB.");
      return;
    }

    const url = URL.createObjectURL(selectedFile);
    if (govIdPreviewUrlRef.current) URL.revokeObjectURL(govIdPreviewUrlRef.current);
    govIdPreviewUrlRef.current = url;

    setGovIdFile(selectedFile);
    setGovIdPreview(url);
  };

  const clearFile = () => {
    if (govIdPreviewUrlRef.current) URL.revokeObjectURL(govIdPreviewUrlRef.current);
    setGovIdFile(null);
    setGovIdPreview("");
    setGovIdType("");
    setIsDropdownOpen(false);
    setUploadProgress(0);
  };

  const handleClose = () => {
    if (isSubmitting) return;
    clearFile();
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!govIdFile || !govIdType || isSubmitting) return;

    setIsSubmitting(true);
    setUploadProgress(0);
    try {
      const uploadedGovIdUrl = await uploadImageToCloudinary(
        govIdFile,
        setUploadProgress
      );
      const response = await axios.put(
        `/users/${profileUserId}`,
        { govId: uploadedGovIdUrl, govIdType },
        { withCredentials: true }
      );

      const refreshedUser = {
        ...user,
        ...profileUser,
        ...(response.data?.user || response.data),
        token: user?.token || profileUser?.token
      };

      updateUser(refreshedUser);
      showToast.success(
        "Verification Submitted",
        "Your document is pending review."
      );
      handleClose();
    } catch (err) {
      console.error(err);
      showToast.error("Submission failed", getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center bg-brand/40 backdrop-blur-sm p-4"
    >
      <motion.div
        initial={{ scale: 0.95, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.95, opacity: 0 }}
        className="bg-surface rounded-2xl shadow-xl w-full max-w-md overflow-hidden flex flex-col bg-white"
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-100">
          <h3 className="text-lg font-bold text-text-primary">Verify Identity</h3>
          <button
            type="button"
            onClick={handleClose}
            disabled={isSubmitting}
            className="p-2 text-text-muted hover:text-text-secondary rounded-full hover:bg-background transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 flex flex-col gap-4">
          <div>
            <label className="mb-2 ml-2 block select-none text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Document Type
            </label>
            <div className="relative">
              <button
                type="button"
                onClick={() => !isSubmitting && setIsDropdownOpen(!isDropdownOpen)}
                disabled={isSubmitting}
                className={`w-full flex items-center justify-between text-left px-4 py-3 bg-white border ${
                  isDropdownOpen
                    ? "border-brand-500 ring-2 ring-brand-500/20"
                    : "border-slate-200"
                } rounded-xl text-text-primary font-bold outline-none transition-all text-sm shadow-sm ${
                  isSubmitting
                    ? "opacity-50 cursor-not-allowed"
                    : "hover:border-brand-300"
                }`}
              >
                <span
                  className={govIdType ? "text-text-primary" : "text-text-muted"}
                >
                  {govIdType || "Select Document Type"}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-text-muted transition-transform ${
                    isDropdownOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              <AnimatePresence>
                {isDropdownOpen && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -10 }}
                    className="absolute top-full left-0 right-0 mt-2 bg-white border border-slate-100 rounded-xl shadow-xl overflow-hidden z-[60]"
                  >
                    {[
                      "Aadhaar Card",
                      "PAN Card",
                      "Passport",
                      "Driving License"
                    ].map((type) => (
                      <button
                        key={type}
                        type="button"
                        onClick={() => {
                          setGovIdType(type);
                          setIsDropdownOpen(false);
                        }}
                        className={`w-full text-left px-4 py-3 text-sm font-semibold transition-colors hover:bg-brand-50 ${
                          govIdType === type
                            ? "bg-brand-50 text-brand"
                            : "text-text-primary"
                        }`}
                      >
                        {type}
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>

          <div>
            <label className="mb-2 ml-2 block select-none text-[10px] font-bold uppercase tracking-wider text-text-muted">
              Upload Document
            </label>
            <div className="relative group">
              <ShieldCheck className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors text-text-muted" />
              <label
                htmlFor="modalGovIdFile"
                className={`w-full pl-11 pr-4 py-3 bg-white border border-slate-200 focus:border-brand-500 hover:border-brand-300 rounded-xl text-text-primary font-bold outline-none transition-all text-sm shadow-sm flex items-center justify-between cursor-pointer ${
                  !govIdType || isSubmitting
                    ? "opacity-50 pointer-events-none"
                    : ""
                }`}
              >
                <span className="truncate">
                  {govIdFile ? govIdFile.name : "Choose File..."}
                </span>
                {govIdPreview && (
                  <img
                    src={govIdPreview}
                    alt="Preview"
                    className="h-6 w-10 object-cover rounded shadow-sm border border-slate-200 ml-3 shrink-0"
                  />
                )}
              </label>
              <input
                type="file"
                id="modalGovIdFile"
                accept="image/jpeg,image/png,application/pdf"
                className="hidden"
                onChange={handleGovIdChange}
                disabled={!govIdType || isSubmitting}
                required
              />
            </div>
            <p className="text-[10px] font-semibold text-text-muted mt-2 flex items-center gap-1">
              <AlertCircle className="w-3 h-3" /> Only JPG, PNG, and PDF files under 10MB.
            </p>
          </div>

          {uploadProgress > 0 && uploadProgress < 100 && (
            <div className="mt-2">
              <div className="h-1 w-full rounded-full bg-background overflow-hidden">
                <div
                  className="h-full rounded-full bg-brand transition-all duration-200"
                  style={{ width: `${uploadProgress}%` }}
                />
              </div>
              <p className="mt-1 text-[9px] font-bold text-text-muted">
                Uploading... {uploadProgress}%
              </p>
            </div>
          )}

          <div className="mt-4 flex gap-3">
            <button
              type="button"
              onClick={handleClose}
              disabled={isSubmitting}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-text-secondary bg-background hover:bg-gray-100 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !govIdFile || !govIdType}
              className="flex-1 py-3 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-dark transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Submitting...
                </>
              ) : (
                "Submit Verification"
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </motion.div>
  );
};

const ProfileUpdate = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { state } = location;
  const { user, updateUser } = useAuth();

  const profileUser =
    user?.isAdmin && (state?._id || state?.user)
      ? state?._id
        ? state
        : state?.user
      : user;
  const profileUserId = getProfileId(profileUser);
  const isAdminMode = location.pathname.startsWith("/admin");

  const backPath = isAdminMode ? "/admin/profile" : "/profile";
  const successPath = isAdminMode ? "/admin/profile" : "/profile";

  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errors, setErrors] = useState({});
  const [isVerificationModalOpen, setIsVerificationModalOpen] = useState(false);

  const [stats, setStats] = useState({
    postsCount: 0,
    storiesCount: 0,
    groupsCount: 0,
    joinedDate: profileUser?.createdAt || Date.now()
  });

  const [name, setName] = useState(profileUser?.name || "");
  const [username, setUsername] = useState(profileUser?.username || "");
  const [city, setCity] = useState(profileUser?.city || "");
  const [stateVal, setStateVal] = useState(profileUser?.state || "");
  const [mobile, setMobile] = useState(profileUser?.mobile || "");
  const [bio, setBio] = useState(profileUser?.bio || "");
  const [interests, setInterests] = useState(profileUser?.interests || []);
  const [newInterest, setNewInterest] = useState("");
  const [preferredTravelStyle, setPreferredTravelStyle] = useState(
    profileUser?.preferredTravelStyle || ""
  );
  const [favoriteDestinations, setFavoriteDestinations] = useState(
    profileUser?.favoriteDestinations || []
  );
  const [newFavDest, setNewFavDest] = useState("");
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const previewUrlRef = useRef(null);
  const fileInputRef = useRef(null);

  const pageMeta = useMemo(
    () =>
      isAdminMode
        ? {
            title: "Admin Profile Identity",
            subtitle: "Update your administrator profile details",
            backLabel: "Back to Admin Profile"
          }
        : {
            title: "Edit Profile",
            subtitle: "Update how travelers see you on GoYatriGo",
            backLabel: "Back to Profile"
          },
    [isAdminMode]
  );

  const currentPayload = useMemo(
    () =>
      buildProfilePayload({
        name,
        username,
        city,
        state: stateVal,
        mobile,
        bio,
        interests,
        preferredTravelStyle,
        favoriteDestinations
      }),
    [
      name,
      username,
      city,
      stateVal,
      mobile,
      bio,
      interests,
      preferredTravelStyle,
      favoriteDestinations
    ]
  );

  const originalPayload = useMemo(
    () =>
      buildProfilePayload({
        name: profileUser?.name || "",
        username: profileUser?.username || "",
        city: profileUser?.city || "",
        state: profileUser?.state || "",
        mobile: profileUser?.mobile || "",
        bio: profileUser?.bio || "",
        interests: profileUser?.interests || [],
        preferredTravelStyle: profileUser?.preferredTravelStyle || "",
        favoriteDestinations: profileUser?.favoriteDestinations || []
      }),
    [profileUser]
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

  const lastProfileId = useRef(null);

  useEffect(() => {
    if (!profileUser) {
      navigate("/login", { replace: true });
      return;
    }

    if (lastProfileId.current !== profileUserId) {
      setName(profileUser.name || "");
      setUsername(profileUser.username || "");
      setCity(profileUser.city || "");
      setStateVal(profileUser.state || "");
      setMobile(profileUser.mobile || "");
      setBio(profileUser.bio || "");
      setInterests(profileUser.interests || []);
      setPreferredTravelStyle(profileUser.preferredTravelStyle || "");
      setFavoriteDestinations(profileUser.favoriteDestinations || []);
      setErrors({});
      lastProfileId.current = profileUserId;
    }

    let isActive = true;

    const fetchStats = async () => {
      try {
        const res = await axios.get("/users/profile-stats", {
          withCredentials: true
        });
        if (isActive && res.data.success) {
          setStats({
            postsCount: res.data.postsCount,
            storiesCount: res.data.storiesCount,
            groupsCount: res.data.groupsCount,
            joinedDate: res.data.joinedDate || profileUser.createdAt
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
  }, [navigate, profileUser, profileUserId]);

  const inputClass =
    "w-full rounded-xl border border-border-default bg-white px-5 py-3 text-sm font-semibold text-text-primary outline-none transition-all duration-200 ease-out placeholder:text-text-muted/50 focus:border-brand focus:ring-4 focus:ring-brand/10";

  const labelClass =
    "mb-2 ml-2 block select-none text-[10px] font-bold uppercase tracking-wider text-text-muted";

  const clearError = (field) => {
    setErrors((prev) => {
      if (!prev[field]) return prev;
      const next = { ...prev };
      delete next[field];
      return next;
    });
  };

  const handleStateChange = (e) => {
    const val = e.target.value;
    setStateVal(val);
    setCity("");
    clearError("state");
    clearError("city");
  };

  const handleCityChange = (e) => {
    const val = e.target.value;
    setCity(val);
    clearError("city");
  };

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];
    if (!selectedFile) return;

    if (!ALLOWED_TYPES.includes(selectedFile.type)) {
      showToast.error(
        "Invalid file type",
        "Please upload a JPG, PNG, WebP, or GIF image."
      );
      event.target.value = "";
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showToast.error(
        "File too large",
        `Image must be under ${MAX_FILE_SIZE_MB}MB.`
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

    setFile(null);
    setPreview("");
    setErrors({});

    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (isSavingProfile) return;

    try {
      if (!profileUserId) {
        throw new Error("Profile data is missing. Please sign in again.");
      }

      const nextErrors = validateProfile(currentPayload);
      if (Object.keys(nextErrors).length > 0) {
        setErrors(nextErrors);
        showToast.error(
          "Check the highlighted fields",
          "Fix the profile details before saving."
        );
        return;
      }

      if (!hasChanges) {
        showToast.info("No changes to save");
        return;
      }

      setIsSavingProfile(true);
      setUploadProgress(0);

      const updatedProfile = { ...currentPayload };

      if (file) {
        const uploadedImageUrl = await uploadImageToCloudinary(
          file,
          setUploadProgress
        );
        updatedProfile.img = uploadedImageUrl;
        updatedProfile.pic = uploadedImageUrl;
        updatedProfile.avatar = uploadedImageUrl;
      }

      const response = await axios.put(
        `/users/${profileUserId}`,
        updatedProfile,
        { withCredentials: true }
      );

      const refreshedUser = {
        ...user,
        ...profileUser,
        ...(response.data?.user || response.data),
        token: user?.token || profileUser?.token
      };

      updateUser(refreshedUser);
      setSaveSuccess(true);
      showToast.success("Profile updated", "Your profile has been saved.");

      clearFile();

      setTimeout(() => {
        setSaveSuccess(false);
        navigate(successPath);
      }, 1000);
    } catch (error) {
      console.error(error);
      showToast.error("Update failed", getErrorMessage(error));
    } finally {
      setIsSavingProfile(false);
      setUploadProgress(0);
    }
  };

  const joinedDateFormatted = moment(stats.joinedDate).format("MMMM YYYY");

  return (
    <div className="relative min-h-screen bg-background px-4 pb-24 md:pb-8 pt-0 font-sans antialiased text-text-primary sm:px-6 lg:px-8">
      <div className="pointer-events-none absolute top-10 right-0 h-[30rem] w-[30rem] rounded-full bg-gradient-to-br from-brand/10 to-primary-300/10 blur-[80px]" />
      <div className="pointer-events-none absolute bottom-40 left-0 h-[20rem] w-[20rem] rounded-full bg-gradient-to-tr from-brand/10 to-transparent blur-[80px]" />

      <div className="relative z-10 mx-auto max-w-5xl space-y-2">
        <Link
          to={backPath}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-xl bg-white hover:bg-gray-50 border border-border-default text-text-primary text-sm font-semibold shadow-sm transition-all duration-200"
        >
          <ArrowLeft className="w-4 h-4 text-brand" />
          <span>{pageMeta.backLabel}</span>
        </Link>

        <form
          id="profile-form"
          onSubmit={handleSubmit}
          className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start"
          noValidate
        >
          {/* Avatar and Bio Card */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="lg:col-span-5 flex flex-col gap-3"
          >
            <div className="rounded-3xl border border-border-default/60 bg-white p-6 text-center shadow-sm relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-24 bg-gradient-to-b from-brand/5 to-transparent"></div>

              <div className="group relative inline-block select-none mb-4 mt-2">
                <div className="relative mx-auto h-32 w-32 overflow-hidden rounded-full border-[6px] border-white shadow-xl ring-4 ring-brand/20 transition-transform duration-300 group-hover:scale-105">
                  <img
                    src={
                      preview ||
                      getAvatarUrl(
                        profileUser?.pic,
                        profileUser?.img,
                        profileUser?.avatar,
                        profileUser?.name
                      )
                    }
                    className="h-full w-full object-cover bg-slate-50"
                    alt="Avatar"
                  />

                  <label
                    htmlFor="file"
                    className="absolute inset-0 flex cursor-pointer flex-col items-center justify-center bg-brand/80 text-white opacity-0 backdrop-blur-sm transition-all duration-300 group-hover:opacity-100"
                  >
                    <Camera className="mb-1 h-6 w-6" />
                    <span className="text-[10px] font-bold uppercase tracking-wider">
                      Upload
                    </span>
                  </label>
                </div>
                {isActuallyVerified(profileUser) && (
                  <div className="absolute bottom-1 right-1 bg-brand rounded-full p-1.5 border-2 border-white shadow-md">
                    <ShieldCheck className="h-4 w-4 text-white" />
                  </div>
                )}

                <input
                  type="file"
                  id="file"
                  ref={fileInputRef}
                  onChange={handleFileChange}
                  className="hidden"
                  accept="image/*,.heic,.heif"
                  disabled={isSavingProfile}
                />

                <FieldError id="file-error" message={errors.file} />
              </div>

              <div className="flex items-center justify-center gap-1.5 px-2">
                <h3 className="text-xl font-bold text-text-primary tracking-tight truncate">
                  {name || "Explorer"}
                </h3>
                {isActuallyVerified(profileUser) && (
                  <CheckCircle className="w-4 h-4 text-brand shrink-0" />
                )}
              </div>
              <p className="text-xs font-semibold text-text-muted mt-1 truncate mb-2">
                @{username || "username"}
              </p>

              <div className="mb-3">
                {isActuallyVerified(profileUser) ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-2.5 py-0.5 text-[11px] font-bold text-emerald-700 shadow-2xs">
                    <ShieldCheck className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                    Verified
                  </span>
                ) : profileUser?.verificationStatus === "pending" ? (
                  <span className="inline-flex items-center gap-1 rounded-full border border-amber-200 bg-amber-50 px-2.5 py-0.5 text-[11px] font-bold text-amber-700 shadow-2xs">
                    <Clock className="h-3.5 w-3.5 text-amber-600 shrink-0" />
                    Verification Pending
                  </span>
                ) : profileUser?.verificationStatus === "rejected" ? (
                  <span
                    className="inline-flex items-center gap-1 rounded-full border border-red-200 bg-red-50 px-2.5 py-0.5 text-[11px] font-bold text-red-600 shadow-2xs"
                    title={profileUser?.verificationNote || "Verification was unsuccessful"}
                  >
                    <XCircle className="h-3.5 w-3.5 shrink-0" />
                    Not Verified (Rejected)
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full border border-slate-200 bg-slate-100 px-2.5 py-0.5 text-[11px] font-bold text-slate-600 shadow-2xs">
                    <ShieldAlert className="h-3.5 w-3.5 text-slate-500 shrink-0" />
                    Not Verified
                  </span>
                )}
              </div>

              <div className="inline-flex items-center gap-1.5 rounded-xl bg-slate-50/80 px-3 py-1.5 text-[10px] font-bold text-text-muted border border-slate-100/50">
                <Calendar className="h-3 w-3" />
                Member Since {joinedDateFormatted}
              </div>

              {uploadProgress > 0 && uploadProgress < 100 && (
                <div className="mt-4">
                  <div className="h-1 w-full rounded-full bg-background overflow-hidden">
                    <div
                      className="h-full rounded-full bg-brand transition-all duration-200"
                      style={{ width: `${uploadProgress}%` }}
                    />
                  </div>
                  <p className="mt-1 text-[9px] font-bold text-text-muted">
                    Uploading... {uploadProgress}%
                  </p>
                </div>
              )}
            </div>

            {/* Bio & Interests */}
            <div className="rounded-3xl border border-border-default/60 bg-white p-6 shadow-sm relative overflow-hidden">
              <div>
                <label htmlFor="bio" className={labelClass}>
                  Bio / About Me
                </label>
                <div className="group relative flex-1">
                  <AlignLeft className="absolute left-4 top-4 h-4 w-4 text-text-muted transition-colors group-focus-within:text-brand" />
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
                    placeholder="Share your travel interests..."
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
                    className="ml-auto text-[10px] font-bold text-text-muted"
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
                      className="flex items-center gap-2 px-2 py-1 bg-white border border-brand/20 text-brand text-[10px] font-bold rounded-xl shadow-sm"
                    >
                      {interest}
                      <button
                        type="button"
                        onClick={() =>
                          setInterests(interests.filter((_, i) => i !== idx))
                        }
                        className="text-brand/60 hover:text-brand transition-colors focus:outline-none"
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
                      className="px-4 py-3 bg-brand/10 text-brand rounded-2xl text-[10px] font-bold uppercase tracking-wider hover:bg-brand/20 transition-colors"
                    >
                      Add
                    </button>
                  </div>
                )}

                <FieldError id="interests-error" message={errors.interests} />
              </div>

              <div className="mt-4">
                <label htmlFor="preferredTravelStyle" className={labelClass}>
                  Preferred Travel Style
                </label>
                <div className="group relative">
                  <Compass className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-brand" />
                  <CustomSelect
                    value={preferredTravelStyle}
                    onChange={(e) => setPreferredTravelStyle(e.target.value)}
                    options={[
                      { value: "Journey", label: "Journey" },
                      { value: "Backpacking", label: "Backpacking" },
                      { value: "Photography", label: "Photography" },
                      { value: "Budget", label: "Budget" },
                      { value: "Luxury", label: "Luxury" },
                      { value: "Solo Journey", label: "Solo Journey" },
                      { value: "Road Trip", label: "Road Trip" },
                      { value: "Trekking", label: "Trekking" },
                      { value: "Beaches", label: "Beaches" },
                      { value: "Historical", label: "Historical" }
                    ]}
                    placeholder="Select Travel Style"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className={labelClass}>Favorite Destinations</label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {favoriteDestinations.map((dest, idx) => (
                    <div
                      key={idx}
                      className="flex items-center gap-2 px-2.5 py-1 bg-emerald-50 border border-emerald-200 text-emerald-700 text-[10px] font-bold rounded-xl shadow-sm"
                    >
                      📍 {dest}
                      <button
                        type="button"
                        onClick={() =>
                          setFavoriteDestinations(
                            favoriteDestinations.filter((_, i) => i !== idx)
                          )
                        }
                        className="text-emerald-500 hover:text-emerald-700 transition-colors focus:outline-none"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    </div>
                  ))}
                </div>
                {favoriteDestinations.length < 5 && (
                  <div className="flex gap-2">
                    <input
                      type="text"
                      className={`${inputClass} flex-1`}
                      placeholder="Add a favorite place (e.g. Manali)"
                      value={newFavDest}
                      onChange={(e) => setNewFavDest(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") {
                          e.preventDefault();
                          if (
                            newFavDest.trim() &&
                            !favoriteDestinations.includes(newFavDest.trim())
                          ) {
                            setFavoriteDestinations([
                              ...favoriteDestinations,
                              newFavDest.trim()
                            ]);
                            setNewFavDest("");
                          }
                        }
                      }}
                    />

                    <button
                      type="button"
                      onClick={() => {
                        if (
                          newFavDest.trim() &&
                          !favoriteDestinations.includes(newFavDest.trim())
                        ) {
                          setFavoriteDestinations([
                            ...favoriteDestinations,
                            newFavDest.trim()
                          ]);
                          setNewFavDest("");
                        }
                      }}
                      className="px-4 py-3 bg-emerald-50 text-emerald-700 rounded-2xl text-[10px] font-bold uppercase tracking-wider hover:bg-emerald-100 transition-colors border border-emerald-200"
                    >
                      Add
                    </button>
                  </div>
                )}
              </div>
            </div>
          </motion.div>

          {/* Profile Details Form */}
          <motion.div
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            className="lg:col-span-7"
          >
            <div className="rounded-3xl border border-border-default/60 bg-white p-6 shadow-sm relative overflow-hidden">
              <div className="mb-5 flex items-center justify-between border-b border-slate-100 pb-4 select-none">
                <div className="flex items-center gap-4">
                  <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-brand/10 to-primary-400/10 p-3 text-brand">
                    <UserIcon className="h-5 w-5" />
                  </div>
                  <div>
                    <h2 className="text-xl font-bold tracking-tight text-text-primary">
                      {pageMeta.title}
                    </h2>
                    <p className="text-[10px] font-semibold text-text-muted">
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
                      <User className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-brand" />
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
                        aria-describedby={errors.name ? "name-error" : undefined}
                      />
                    </div>
                    <FieldError id="name-error" message={errors.name} />
                  </div>

                  <div>
                    <label htmlFor="username" className={labelClass}>
                      Username
                    </label>
                    <div className="group relative">
                      <AtSign className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-brand" />
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
                      <Mail className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted" />
                      <input
                        className={`${inputClass} cursor-not-allowed border-transparent bg-background pl-11 opacity-70 shadow-none focus:ring-0`}
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
                      <Phone className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-brand" />
                      <input
                        id="mobile"
                        className={`${inputClass} pl-11`}
                        value={mobile}
                        onChange={(e) => {
                          setMobile(e.target.value);
                          clearError("mobile");
                        }}
                        placeholder="9876543210"
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

                <div className="grid grid-cols-1 gap-4 md:grid-cols-2 mt-4">
                  <div>
                    <label htmlFor="state" className={labelClass}>
                      State
                    </label>
                    <div className="group relative">
                      <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-brand" />
                      <CustomSelect
                        value={stateVal}
                        onChange={handleStateChange}
                        searchable={true}
                        options={Object.keys(INDIAN_STATES_AND_CITIES).map(
                          (s) => ({ value: s, label: s })
                        )}
                        placeholder="Select State"
                        error={errors.state ? "Invalid state" : ""}
                      />
                    </div>
                    <FieldError id="state-error" message={errors.state} />
                  </div>

                  <div>
                    <label htmlFor="city" className={labelClass}>
                      City
                    </label>
                    <div className="group relative">
                      <MapPin className="absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-text-muted transition-colors group-focus-within:text-brand" />
                      <CustomSelect
                        value={city}
                        onChange={handleCityChange}
                        disabled={!stateVal}
                        searchable={true}
                        options={
                          stateVal
                            ? INDIAN_STATES_AND_CITIES[stateVal].map((c) => ({
                                value: c,
                                label: c
                              }))
                            : []
                        }
                        placeholder={stateVal ? "Select City" : "Select State first"}
                        error={errors.city ? "Invalid city" : ""}
                      />
                    </div>
                    <FieldError id="city-error" message={errors.city} />
                  </div>
                </div>

                <div className="mt-8 border-t border-slate-100 pt-6 mb-4">
                  <h3 className="text-sm font-bold text-text-primary mb-3 uppercase tracking-wider">
                    Traveler Verification
                  </h3>
                  {profileUser?.verificationStatus === "verified" ? (
                    <div className="bg-emerald-50 border border-emerald-100 rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-emerald-900 mb-1 flex items-center gap-2">
                          <CheckCircle className="w-4 h-4 text-emerald-600" />
                          Verified Traveler
                        </h4>
                        <p className="text-xs text-emerald-700">
                          Your traveler identity has been verified.
                        </p>
                      </div>
                    </div>
                  ) : profileUser?.verificationStatus === "pending" ? (
                    <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-amber-900 mb-1 flex items-center gap-2">
                          <Clock className="w-4 h-4 text-amber-600" />
                          Verification Pending
                        </h4>
                        <p className="text-xs text-amber-700">
                          Your identity document has been submitted for review.
                        </p>
                      </div>
                    </div>
                  ) : profileUser?.verificationStatus === "rejected" ? (
                    <div className="bg-red-50 border border-red-100 rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-red-900 mb-1 flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-red-600" />
                          Verification Unsuccessful
                        </h4>
                        <p className="text-xs text-red-700 mb-3">
                          {profileUser?.verificationNote ||
                            "Please upload a clear, valid Government ID."}
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsVerificationModalOpen(true)}
                          className="px-4 py-2 bg-red-100 hover:bg-red-200 text-red-800 text-xs font-bold rounded-xl transition-colors"
                        >
                          Try Again
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 flex items-center justify-between">
                      <div>
                        <h4 className="text-sm font-bold text-text-primary mb-1 flex items-center gap-2">
                          <ShieldAlert className="w-4 h-4 text-text-muted" />
                          Not Verified
                        </h4>
                        <p className="text-xs text-text-muted mb-3">
                          Verify your identity to build trust with other travelers.
                        </p>
                        <button
                          type="button"
                          onClick={() => setIsVerificationModalOpen(true)}
                          className="px-4 py-2 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-xl transition-colors"
                        >
                          Verify Identity
                        </button>
                      </div>
                    </div>
                  )}
                </div>

                <div className="pt-1">
                  <button
                    type="submit"
                    disabled={isSavingProfile || !hasChanges}
                    className="flex h-11 w-full md:w-auto md:px-8 items-center justify-center gap-2 rounded-xl text-sm font-semibold text-white bg-brand hover:bg-brand-dark shadow-sm transition-all duration-200 active:scale-95 disabled:cursor-not-allowed disabled:opacity-70"
                  >
                    {isSavingProfile ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" />
                        <span>Saving...</span>
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="h-4 w-4" />
                        <span>Saved</span>
                      </>
                    ) : (
                      <span>Save Changes</span>
                    )}
                  </button>
                </div>
              </div>
            </div>
          </motion.div>
        </form>
      </div>

      <AnimatePresence>
        {isVerificationModalOpen && (
          <VerificationModal
            isOpen={isVerificationModalOpen}
            onClose={() => setIsVerificationModalOpen(false)}
            profileUserId={profileUserId}
            user={user}
            profileUser={profileUser}
            updateUser={updateUser}
          />
        )}
      </AnimatePresence>

      {!isAdminMode && (
        <nav className="fixed bottom-0 left-0 right-0 z-20 flex h-[4.5rem] items-center justify-around border-t border-slate-100 bg-white/90 backdrop-blur-md px-4 pb-safe md:hidden shadow-[0_-10px_40px_rgba(0,0,0,0.03)]">
          <Link
            to="/"
            className="flex flex-col items-center gap-1 text-text-muted hover:text-brand transition-colors p-2"
          >
            <HomeIcon className="h-5 w-5" />
            <span className="text-[9px] font-bold">Home</span>
          </Link>
          <Link
            to="/social/buddy"
            className="flex flex-col items-center gap-1 text-text-muted hover:text-brand transition-colors p-2"
          >
            <Compass className="h-5 w-5" />
            <span className="text-[9px] font-bold">Explore</span>
          </Link>
          <Link
            to="/social/buddy/new"
            className="relative -top-5 flex flex-col items-center"
          >
            <div className="bg-brand text-white p-3.5 rounded-2xl shadow-lg shadow-brand/30 transform rotate-3 hover:rotate-6 transition-transform">
              <Plus className="h-6 w-6" />
            </div>
          </Link>
          <Link
            to="/social/chat"
            className="flex flex-col items-center gap-1 text-text-muted hover:text-brand transition-colors p-2"
          >
            <MessageCircle className="h-5 w-5" />
            <span className="text-[9px] font-bold">Chat</span>
          </Link>
          <Link
            to="/profile"
            className="flex flex-col items-center gap-1 text-brand transition-colors p-2"
          >
            <div className="relative">
              <UserIcon className="h-5 w-5" />
              <div className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-1 h-1 bg-brand rounded-full"></div>
            </div>
            <span className="text-[9px] font-bold">Profile</span>
          </Link>
        </nav>
      )}
    </div>
  );
};

export default ProfileUpdate;
