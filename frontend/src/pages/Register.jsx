import { showToast } from "../utils/showToast";
import axios from "../api/axios";
import { useState, useEffect, useContext, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Lock,
  Camera,
  ArrowRight,
  ShieldCheck,
  ChevronLeft,
  Eye,
  EyeOff,
  CheckCircle2,
  AlertCircle,
} from "lucide-react";
import { AuthContext } from "../context/authContext";
import Spinner from "../components/spinner/LoadingSpinner";
import stickerPack from "../assets/images/sign.jpg";
import travelBg from "../assets/images/bg.jpg";
const CLOUD_NAME = process.env.REACT_APP_CLOUDINARY_CLOUD || "dpgelkpd4";
const UPLOAD_PRESET = process.env.REACT_APP_CLOUDINARY_PRESET || "upload";
const MAX_FILE_SIZE_MB = 2;
const ALLOWED_MIME_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
];

const Register = () => {
  const { user } = useContext(AuthContext);
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [preview, setPreview] = useState("");
  const [govIdFile, setGovIdFile] = useState(null);
  const [govIdPreview, setGovIdPreview] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    mobile: "",
    password: "",
    repeatPassword: "",
    acceptedPolicies: false,
    govIdType: "",
  });

  const [errors, setErrors] = useState({});
  const isMounted = useRef(true);
  const previewUrlRef = useRef(null);
  const govIdPreviewUrlRef = useRef(null);
  const navigate = useNavigate();

  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
      if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
      if (govIdPreviewUrlRef.current)
        URL.revokeObjectURL(govIdPreviewUrlRef.current);
    };
  }, []);

  useEffect(() => {
    if (user) navigate("/", { replace: true });
  }, [user, navigate]);

  const validateEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  const validatePhone = (phone) => /^[+]?[\d\s-]{10,}$/.test(phone);

  const calculatePasswordStrength = (pass) => {
    if (!pass) return 0;
    let score = 0;
    if (pass.length > 6) score += 1;
    if (pass.length > 10) score += 1;
    if (/[A-Z]/.test(pass)) score += 1;
    if (/[0-9]/.test(pass)) score += 1;
    if (/[^A-Za-z0-9]/.test(pass)) score += 1;
    return Math.min(4, score);
  };

  const strength = calculatePasswordStrength(formData.password);
  const STRENGTH_META = {
    0: { bar: "bg-white/10", text: "", textColor: "text-white/20" },
    1: { bar: "bg-red-500", text: "Weak", textColor: "text-red-400" },
    2: { bar: "bg-orange-500", text: "Fair", textColor: "text-orange-400" },
    3: { bar: "bg-brand-500", text: "Good", textColor: "text-brand-400" },
    4: { bar: "bg-emerald-500", text: "Strong", textColor: "text-emerald-400" },
  };

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
    if (errors[id]) setErrors((prev) => ({ ...prev, [id]: "" }));
  };

  const handleFileChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    // Verify the exact MIME type to ensure valid image formats
    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
      showToast.error(
        "Invalid File Type",
        "Please upload a JPG, PNG, WebP, or GIF image.",
      );
      return;
    }

    // Enforce file size limits locally before initiating upload
    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showToast.error(
        "File Too Large",
        `Maximum file size is ${MAX_FILE_SIZE_MB}MB.`,
      );
      return;
    }

    // Release memory by revoking the previous object URL
    if (previewUrlRef.current) URL.revokeObjectURL(previewUrlRef.current);
    const url = URL.createObjectURL(selectedFile);
    previewUrlRef.current = url;
    setFile(selectedFile);
    setPreview(url);
  };

  const handleGovIdChange = (e) => {
    const selectedFile = e.target.files[0];
    if (!selectedFile) return;

    if (!ALLOWED_MIME_TYPES.includes(selectedFile.type)) {
      showToast.error(
        "Invalid File Type",
        "Please upload a JPG, PNG, WebP, or GIF image for Gov ID.",
      );
      return;
    }

    if (selectedFile.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      showToast.error(
        "File Too Large",
        `Maximum file size is ${MAX_FILE_SIZE_MB}MB.`,
      );
      return;
    }

    if (govIdPreviewUrlRef.current)
      URL.revokeObjectURL(govIdPreviewUrlRef.current);
    const url = URL.createObjectURL(selectedFile);
    govIdPreviewUrlRef.current = url;
    setGovIdFile(selectedFile);
    setGovIdPreview(url);
    if (errors.govId) setErrors((prev) => ({ ...prev, govId: "" }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return; // Guard against multiple form submissions

    const { name, email, mobile, password, repeatPassword, govIdType } =
      formData;
    const newErrors = {};

    if (!name.trim()) newErrors.name = "Name is required";
    if (!email) newErrors.email = "Email is required";
    else if (!validateEmail(email)) newErrors.email = "Invalid email format";
    if (!mobile) newErrors.mobile = "Phone is required";
    else if (!validatePhone(mobile)) newErrors.mobile = "Invalid phone format";
    if (!govIdType) newErrors.govIdType = "Document type is required";
    if (!password) newErrors.password = "Password is required";
    // Verify that passwords match during the unified validation check
    if (password && repeatPassword && password !== repeatPassword) {
      newErrors.repeatPassword = "Passwords do not match";
    } else if (password && !repeatPassword) {
      newErrors.repeatPassword = "Please confirm your password";
    }
    if (!formData.acceptedPolicies) {
      newErrors.acceptedPolicies =
        "You must accept the Privacy Policy and Terms of Service.";
    }

    if (!govIdFile) {
      newErrors.govId = "Government ID is required for verification.";
    }

    if (Object.keys(newErrors).length > 0) {
      setErrors(newErrors);
      // Display a single consolidated warning for all validation errors
      showToast.warning(
        "Incomplete Form",
        "Please fill in all required fields correctly.",
      );
      return;
    }

    setLoading(true);
    try {
      let imageUrl = "";
      let govIdUrl = "";

      if (file || govIdFile) {
        if (!CLOUD_NAME || !UPLOAD_PRESET) {
          throw new Error("Image upload is not configured. Contact support.");
        }

        if (file) {
          const data = new FormData();
          data.append("file", file);
          data.append("upload_preset", UPLOAD_PRESET);

          const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            { method: "POST", body: data },
          ).then((res) => res.json());

          if (!uploadRes.secure_url) {
            throw new Error(uploadRes.error?.message || "Image upload failed.");
          }
          imageUrl = uploadRes.secure_url;
        }

        if (govIdFile) {
          const data = new FormData();
          data.append("file", govIdFile);
          data.append("upload_preset", UPLOAD_PRESET);

          const uploadRes = await fetch(
            `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
            { method: "POST", body: data },
          ).then((res) => res.json());

          if (!uploadRes.secure_url) {
            throw new Error(
              uploadRes.error?.message || "Gov ID upload failed.",
            );
          }
          govIdUrl = uploadRes.secure_url;
        }
      }

      // Remove repeatPassword from payload before sending to the API
      const { repeatPassword: _, ...payload } = formData;
      await axios.post("/auth/register", {
        ...payload,
        img: imageUrl,
        govId: govIdUrl,
      });

      if (!isMounted.current) return;

      showToast.success(
        "Welcome Aboard!",
        "Your account has been created successfully.",
      );
      navigate("/login", { replace: true });
    } catch (err) {
      if (!isMounted.current) return;

      const errorMsg =
        typeof err.response?.data === "string"
          ? err.response.data
          : err.response?.data?.message ||
            err.message ||
            "Registration failed. Please try again.";
      showToast.error(errorMsg);
    } finally {
      if (isMounted.current) setLoading(false);
    }
  };

  const labelClass =
    "text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1 mb-1 block";
  const inputClass = (field) =>
    `w-full pl-11 pr-4 py-1.5 bg-slate-50 border ${
      errors[field]
        ? "border-red-300 focus:border-red-400 focus:ring-red-400/20"
        : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20"
    } rounded-xl text-slate-900 font-bold outline-none focus:bg-white focus:ring-4 transition-all placeholder:text-slate-400 text-sm shadow-sm`;

  return (
    <div className="min-h-screen bg-slate-50 flex font-sans overflow-hidden relative">
      <div
        className="absolute inset-0 z-0 bg-cover bg-center opacity-10 scale-110"
        style={{ backgroundImage: `url(${travelBg})` }}
      />
      <div className="absolute inset-0 z-10 bg-gradient-to-br from-white/60 via-white/80 to-slate-50" />
      <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-brand-500/10 rounded-full blur-[120px] translate-x-1/2 -translate-y-1/2 z-10 pointer-events-none" />
      <div className="absolute bottom-0 left-0 w-[600px] h-[600px] bg-blue-500/5 rounded-full blur-[150px] -translate-x-1/3 translate-y-1/3 z-10 pointer-events-none" />

      <div className="relative z-20 w-full flex flex-col lg:flex-row min-h-screen">
        {/* Left: hero */}
        <div className="hidden lg:flex flex-col lg:w-1/2 items-end justify-center p-8 lg:pr-12 relative">
          <motion.div
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.2 }}
            className="w-full max-w-lg"
          >
            <div className="relative bg-white/50 backdrop-blur-xl border border-slate-200 rounded-[2rem] p-2 overflow-hidden shadow-xl group">
              <div className="absolute -inset-4 bg-brand-500/10 blur-3xl rounded-[3rem] opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" />
              <img
                src={stickerPack}
                alt="Indian city stickers"
                className="w-full h-[80vh] object-cover rounded-[1.8rem] opacity-90 transform group-hover:scale-[1.02] transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent rounded-[1.8rem]" />
              <div className="absolute bottom-6 left-6 right-6">
                <h2 className="text-3xl font-black text-white leading-tight tracking-tighter drop-shadow-lg">
                  Join the <br />
                  <span className="italic text-brand-300 font-black">
                    Go YatriGo Circle.
                  </span>
                </h2>
              </div>
            </div>
          </motion.div>
        </div>

        {/* Right: form */}
        <div className="w-full lg:w-1/2 flex flex-col items-center lg:items-start justify-center p-4 sm:p-8 lg:pl-14 overflow-y-auto custom-scrollbar">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="w-full max-w-[600px] bg-white border border-slate-100 p-5 sm:p-6 rounded-[2rem] shadow-xl my-2"
          >
            <div className="mb-2 flex flex-col items-center lg:items-start relative">
              <div className="flex items-center justify-between w-full">
                <div>
                  <h1 className="text-2xl font-black text-slate-900 tracking-tighter mb-1 italic">
                    Sign Up.
                  </h1>
                  <p className="text-slate-500 font-medium text-[11px]">
                    Create your profile Here
                  </p>
                </div>

                {/* Avatar upload */}
                <div className="relative group">
                  <motion.div
                    whileHover={{ scale: 1.05 }}
                    className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-slate-50 shadow-inner flex items-center justify-center overflow-hidden border border-slate-200 p-1 group-hover:border-brand-500/50 transition-colors"
                  >
                    {preview ? (
                      <img
                        src={preview}
                        alt="Avatar preview"
                        className="w-full h-full object-cover rounded-xl"
                      />
                    ) : (
                      <div className="flex flex-col items-center gap-1">
                        <User className="w-5 h-5 text-slate-300 group-hover:text-brand-500 transition-colors" />
                        <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter hidden sm:block">
                          Avatar
                        </span>
                      </div>
                    )}
                  </motion.div>
                  <label
                    htmlFor="file"
                    className="absolute -bottom-2 -right-2 p-2 sm:p-2.5 bg-brand-600 text-white rounded-xl shadow-md cursor-pointer hover:bg-brand-500 transition-all border-2 border-white active:scale-90 z-10 overflow-hidden"
                    aria-label="Upload avatar photo"
                  >
                    <Camera className="w-3.5 h-3.5 sm:w-4 sm:h-4 relative z-10" />
                    {/* FIX: explicit accept list matching ALLOWED_MIME_TYPES */}
                    <input
                      type="file"
                      id="file"
                      className="hidden"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      onChange={handleFileChange}
                    />
                  </label>
                </div>
              </div>
            </div>

            <form onSubmit={handleSubmit} className="space-y-3" noValidate>
              {/* Name & Email */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  {/* FIX: htmlFor matches input id */}
                  <label htmlFor="name" className={labelClass}>
                    Full Name
                  </label>
                  <div className="relative group">
                    <User
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.name ? "text-red-500" : "text-slate-400 group-focus-within:text-brand-500"}`}
                    />
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      id="name"
                      type="text"
                      autoComplete="name"
                      placeholder="Arjun Sharma"
                      value={formData.name}
                      onChange={handleChange}
                      aria-invalid={!!errors.name}
                      aria-describedby={errors.name ? "name-error" : undefined}
                      className={`${inputClass("name")} pr-4`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.name && (
                      <motion.div
                        id="name-error"
                        role="alert"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                      >
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-[10px] font-bold">
                          {errors.name}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-1">
                  <label htmlFor="email" className={labelClass}>
                    Email Address
                  </label>
                  <div className="relative group">
                    <Mail
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.email ? "text-red-500" : "text-slate-400 group-focus-within:text-brand-500"}`}
                    />
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      id="email"
                      type="email"
                      autoComplete="email"
                      placeholder="arjun@gmail.com"
                      value={formData.email}
                      onChange={handleChange}
                      aria-invalid={!!errors.email}
                      aria-describedby={
                        errors.email ? "email-error" : undefined
                      }
                      className={`${inputClass("email")} pr-4`}
                    />
                  </div>
                  <AnimatePresence>
                    {errors.email && (
                      <motion.div
                        id="email-error"
                        role="alert"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                      >
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-[10px] font-bold">
                          {errors.email}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Phone */}
              <div className="space-y-1">
                <label htmlFor="mobile" className={labelClass}>
                  Phone Number
                </label>
                <div className="relative group">
                  <Phone
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.mobile ? "text-red-500" : "text-slate-400 group-focus-within:text-brand-500"}`}
                  />
                  <motion.input
                    whileFocus={{ scale: 1.01 }}
                    id="mobile"
                    type="tel"
                    autoComplete="tel"
                    inputMode="tel"
                    placeholder="+91 00000 00000"
                    value={formData.mobile}
                    onChange={handleChange}
                    aria-invalid={!!errors.mobile}
                    aria-describedby={
                      errors.mobile ? "mobile-error" : undefined
                    }
                    className={`${inputClass("mobile")} pr-4`}
                  />
                </div>
                <AnimatePresence>
                  {errors.mobile && (
                    <motion.div
                      id="mobile-error"
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-[10px] font-bold">
                        {errors.mobile}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              <div className="mb-4 space-y-1">
                <label htmlFor="govIdType" className={labelClass}>
                  Document Type
                </label>
                <select
                  id="govIdType"
                  className={`${inputClass("govIdType")} !py-2`}
                  value={formData.govIdType}
                  onChange={handleChange}
                  aria-invalid={!!errors.govIdType}
                  aria-describedby={
                    errors.govIdType ? "govIdType-error" : undefined
                  }
                >
                  <option value="" disabled>
                    Select Document Type
                  </option>
                  <option value="Aadhaar Card">Aadhaar Card</option>
                  <option value="PAN Card">PAN Card</option>
                  <option value="Passport">Passport</option>
                  <option value="Driving License">Driving License</option>
                </select>
                <AnimatePresence>
                  {errors.govIdType && (
                    <motion.div
                      id="govIdType-error"
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-[10px] font-bold">
                        {errors.govIdType}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
              {/* Government ID Upload */}
              <div className="space-y-1">
                <label className={labelClass}>
                  Government ID (Required for Verification)
                </label>
                <div className="relative group">
                  <ShieldCheck
                    className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.govId ? "text-red-500" : "text-slate-400 group-focus-within:text-brand-500"}`}
                  />
                  <label
                    htmlFor="govIdFile"
                    className={`w-full pl-11 pr-4 py-1.5 bg-slate-50 border ${errors.govId ? "border-red-300 focus:border-red-400 focus:ring-red-400/20" : "border-slate-200 focus:border-brand-500 hover:border-brand-300"} rounded-xl text-slate-900 font-bold outline-none focus:bg-white focus:ring-4 transition-all text-sm shadow-sm flex items-center justify-between cursor-pointer`}
                  >
                    <span className="truncate text-slate-500 font-medium">
                      {govIdFile ? govIdFile.name : "Upload Image..."}
                    </span>
                    {govIdPreview && (
                      <img
                        src={govIdPreview}
                        alt="Gov ID"
                        className="h-6 w-10 object-cover rounded shadow-sm border border-slate-200"
                      />
                    )}
                  </label>
                  <input
                    type="file"
                    id="govIdFile"
                    className="hidden"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleGovIdChange}
                  />
                </div>
                <AnimatePresence>
                  {errors.govId && (
                    <motion.div
                      id="govId-error"
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-[10px] font-bold">
                        {errors.govId}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              {/* Password & Confirm */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label htmlFor="password" className={labelClass}>
                    Password
                  </label>
                  <div className="relative group">
                    <Lock
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.password ? "text-red-500" : "text-slate-400 group-focus-within:text-brand-500"}`}
                    />
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      id="password"
                      type={showPassword ? "text" : "password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={formData.password}
                      onChange={handleChange}
                      aria-invalid={!!errors.password}
                      aria-describedby="password-strength"
                      className={`${inputClass("password")} pr-10`}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((p) => !p)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors p-1"
                      aria-label={
                        showPassword ? "Hide password" : "Show password"
                      }
                    >
                      {showPassword ? (
                        <EyeOff className="w-3.5 h-3.5" />
                      ) : (
                        <Eye className="w-3.5 h-3.5" />
                      )}
                    </button>
                  </div>

                  {formData.password && (
                    <div
                      id="password-strength"
                      className="px-1 pt-1"
                      aria-live="polite"
                    >
                      <div className="flex gap-1 h-1 mt-1">
                        {[1, 2, 3, 4].map((index) => (
                          <div
                            key={index}
                            className={`flex-1 rounded-full transition-all duration-300 ${
                              strength >= index
                                ? STRENGTH_META[strength].bar
                                : "bg-slate-200"
                            }`}
                          />
                        ))}
                      </div>
                      <p
                        className={`text-[9px] font-black uppercase tracking-wider text-right mt-1 ${STRENGTH_META[strength].textColor}`}
                      >
                        {STRENGTH_META[strength].text}
                      </p>
                    </div>
                  )}

                  <AnimatePresence>
                    {errors.password && (
                      <motion.div
                        role="alert"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                      >
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-[10px] font-bold">
                          {errors.password}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>

                <div className="space-y-1">
                  <label htmlFor="repeatPassword" className={labelClass}>
                    Confirm Password
                  </label>
                  <div className="relative group">
                    <Lock
                      className={`absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 transition-colors ${errors.repeatPassword ? "text-red-500" : "text-slate-400 group-focus-within:text-brand-500"}`}
                    />
                    <motion.input
                      whileFocus={{ scale: 1.01 }}
                      id="repeatPassword"
                      type={"password"}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      value={formData.repeatPassword}
                      onChange={handleChange}
                      aria-invalid={!!errors.repeatPassword}
                      aria-describedby={
                        errors.repeatPassword ? "repeat-error" : undefined
                      }
                      className={`w-full pl-11 pr-10 py-1.5 bg-slate-50 border ${
                        errors.repeatPassword
                          ? "border-red-300 focus:border-red-400 focus:ring-red-400/20"
                          : formData.repeatPassword &&
                              formData.repeatPassword === formData.password
                            ? "border-emerald-300 focus:border-emerald-400 focus:ring-emerald-400/20"
                            : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20"
                      } rounded-xl text-slate-900 font-bold outline-none focus:bg-white focus:ring-4 transition-all placeholder:text-slate-400 text-sm shadow-sm`}
                    />

                    {formData.repeatPassword &&
                      formData.repeatPassword === formData.password && (
                        <CheckCircle2 className="absolute right-10 top-1/2 -translate-y-1/2 w-4 h-4 text-emerald-500 animate-in fade-in" />
                      )}
                  </div>
                  <AnimatePresence>
                    {errors.repeatPassword && (
                      <motion.div
                        id="repeat-error"
                        role="alert"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: "auto" }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                      >
                        <AlertCircle className="w-3 h-3" />
                        <span className="text-[10px] font-bold">
                          {errors.repeatPassword}
                        </span>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Policies Checkbox */}
              <div className="space-y-1">
                <div className="flex items-start gap-3">
                  <div className="relative flex items-center pt-1">
                    <input
                      type="checkbox"
                      id="acceptedPolicies"
                      checked={formData.acceptedPolicies}
                      onChange={handleChange}
                      className="w-4 h-4 rounded bg-slate-50 border-slate-200 text-brand-500 focus:ring-brand-500 focus:ring-offset-white transition-all cursor-pointer"
                    />
                  </div>
                  <label
                    htmlFor="acceptedPolicies"
                    className="text-[11px] font-medium text-slate-600 leading-relaxed cursor-pointer select-none"
                  >
                    I have read and agree to the{" "}
                    <Link
                      to="/terms"
                      target="_blank"
                      className="text-brand-500 hover:text-brand-600 hover:underline"
                    >
                      Terms and Conditions
                    </Link>{" "}
                    and{" "}
                    <Link
                      to="/privacy-policy"
                      target="_blank"
                      className="text-brand-500 hover:text-brand-600 hover:underline"
                    >
                      Privacy Policy
                    </Link>
                    .
                  </label>
                </div>
                <AnimatePresence>
                  {errors.acceptedPolicies && (
                    <motion.div
                      id="acceptedPolicies-error"
                      role="alert"
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="flex items-center gap-1.5 mt-1 ml-1 text-red-500"
                    >
                      <AlertCircle className="w-3 h-3" />
                      <span className="text-[10px] font-bold">
                        {errors.acceptedPolicies}
                      </span>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>

              <motion.button
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                disabled={loading}
                type="submit"
                className="w-full py-2 bg-brand-600 text-white font-black rounded-xl transition-all duration-300 shadow-[0_4px_14px_rgba(124,58,237,0.3)] hover:shadow-[0_6px_20px_rgba(124,58,237,0.4)] flex items-center justify-center gap-3 hover:bg-brand-500 disabled:opacity-70 disabled:cursor-not-allowed group mt-4 overflow-hidden relative"
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                {loading ? (
                  <Spinner className="h-5 w-5 border-white" containerClass="" />
                ) : (
                  <>
                    <span className="uppercase tracking-widest text-xs relative z-10">
                      Create Identity
                    </span>
                    <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform relative z-10" />
                  </>
                )}
              </motion.button>
            </form>

            <div className="mt-2 pt-2 border-t border-slate-100 flex flex-col items-center gap-3">
              <p className="text-center text-[11px] font-bold text-slate-500">
                Already known?
                <Link
                  to="/login"
                  className="ml-2 text-brand-600 font-black hover:text-brand-700 transition-colors hover:underline underline-offset-4 decoration-2"
                >
                  Sign In
                </Link>
              </p>
              <Link
                to="/"
                className="inline-flex items-center gap-2 text-slate-400 hover:text-slate-600 font-black text-[9px] uppercase tracking-[0.4em] transition-colors group"
              >
                <ChevronLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                Portal Exit
              </Link>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
};

export default Register;
