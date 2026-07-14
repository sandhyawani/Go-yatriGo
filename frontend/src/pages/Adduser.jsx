import { showToast } from "../utils/showToast";
// src/pages/AddUser.jsx
import React, { useEffect, useMemo, useState } from "react";
import DriveFolderUploadOutlinedIcon from "@mui/icons-material/DriveFolderUploadOutlined";
import PersonOutlineOutlinedIcon from "@mui/icons-material/PersonOutlineOutlined";
import EmailOutlinedIcon from "@mui/icons-material/EmailOutlined";
import PlaceOutlinedIcon from "@mui/icons-material/PlaceOutlined";
import { INDIAN_STATES_AND_CITIES } from "../constants/locationData";
import PhoneOutlinedIcon from "@mui/icons-material/PhoneOutlined";
import LockOutlinedIcon from "@mui/icons-material/LockOutlined";
import BadgeOutlinedIcon from "@mui/icons-material/BadgeOutlined";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import axios from "../api/axios";
import Spinner from "../components/spinner/LoadingSpinner";

const CLOUDINARY_URL =
  process.env.REACT_APP_CLOUDINARY_URL ||
  "https://api.cloudinary.com/v1_1/ddgjxum9j/image/upload";
const CLOUDINARY_PRESET =
  process.env.REACT_APP_CLOUDINARY_PRESET || "upload";

const ALLOWED_FILE_TYPES = [
  "image/jpeg", "image/png", "image/webp", "image/gif",
  "image/heic", "image/heif", "image/avif", "image/bmp",
];
const ALLOWED_EXTENSIONS = ["jpg","jpeg","png","gif","webp","heic","heif","avif","bmp"];
const isAllowedImage = (file) => {
  if (file.type && ALLOWED_FILE_TYPES.includes(file.type)) return true;
  const ext = file.name?.split(".").pop()?.toLowerCase();
  return ALLOWED_EXTENSIONS.includes(ext);
};
const MAX_FILE_SIZE_MB = 5;
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MOBILE_REGEX = /^\d{10}$/;

function getFieldError(form) {
  if (!form.name.trim()) return { field: "name", message: "Name is required." };
  if (!form.email.trim()) return { field: "email", message: "Email is required." };
  if (!EMAIL_REGEX.test(form.email)) {
    return { field: "email", message: "Enter a valid email address." };
  }
  if (!form.mobile.trim()) {
    return { field: "mobile", message: "Mobile number is required." };
  }
  if (!MOBILE_REGEX.test(form.mobile)) {
    return { field: "mobile", message: "Mobile number must be exactly 10 digits." };
  }
  if (!form.state) return { field: "state", message: "State is required." };
  if (!form.city) return { field: "city", message: "City is required." };
  if (!form.password) {
    return { field: "password", message: "Password is required." };
  }
  if (form.password.length < 6) {
    return { field: "password", message: "Password must be at least 6 characters." };
  }
  if (!form.confirmPassword) {
    return {
      field: "confirmPassword",
      message: "Please confirm the password.",
    };
  }
  if (form.password !== form.confirmPassword) {
    return {
      field: "confirmPassword",
      message: "Passwords do not match.",
    };
  }
  if (form.file) {
    if (!isAllowedImage(form.file)) {
      return {
        field: "file",
        message: "Only image files (JPEG, PNG, WebP, GIF, HEIC, etc.) are allowed.",
      };
    }
    if (form.file.size > MAX_FILE_SIZE_MB * 1024 * 1024) {
      return {
        field: "file",
        message: `Image must be smaller than ${MAX_FILE_SIZE_MB} MB.`,
      };
    }
  }
  return null;
}

function FormField({
  id,
  label,
  icon,
  error,
  helperText,
  className = "",
  children,
}) {
  return (
    <div className={className}>
      <label
        htmlFor={id}
        className="mb-1.5 flex items-center gap-2 text-sm font-semibold text-slate-700"
      >
        <span className="text-slate-400 flex items-center justify-center">{icon}</span>
        {label}
      </label>
      {children}
      {error || helperText ? (
        <div className="mt-1">
          {error ? (
            <p className="text-xs font-semibold text-red-500">{error}</p>
          ) : (
            <p className="text-xs font-medium text-slate-400">{helperText}</p>
          )}
        </div>
      ) : null}
    </div>
  );
}

function StatChip({ label, value }) {
  return (
    <div className="rounded-2xl border border-slate-100 bg-white px-4 py-2.5 shadow-sm">
      <p className="text-xs font-bold uppercase tracking-wider text-slate-400">{label}</p>
      <p className="mt-0.5 text-sm font-bold text-slate-900">{value}</p>
    </div>
  );
}

const AddUser = () => {
  const navigate = useNavigate();

  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const [form, setForm] = useState({
    name: "",
    email: "",
    state: "",
    city: "",
    mobile: "",
    type: "traveler",
    password: "",
    confirmPassword: "",
    file: null,
  });

  const previewUrl = useMemo(() => {
    if (!form.file) return null;
    return URL.createObjectURL(form.file);
  }, [form.file]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  const inputClass = (hasError) =>
    [
      "w-full rounded-xl border bg-slate-50 px-4 py-2.5 text-sm font-medium text-slate-700 outline-none transition",
      "placeholder:text-slate-400 placeholder:font-normal",
      hasError
        ? "border-red-200 bg-white ring-4 ring-red-50 focus:border-red-400"
        : "border-slate-100 focus:border-brand-300 focus:bg-white focus:ring-4 focus:ring-brand-100",
    ].join(" ");

  const updateField = (key, value) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setErrors((prev) => ({ ...prev, [key]: "" }));
  };

  const showErrorAlert = (message) => {
    showToast.error(message || "Unable to continue");
  };

  const uploadImage = async (imageFile) => {
    const data = new FormData();
    data.append("file", imageFile);
    data.append("upload_preset", CLOUDINARY_PRESET);

    const response = await fetch(CLOUDINARY_URL, {
      method: "POST",
      body: data,
    });

    if (!response.ok) {
      throw new Error("Image upload failed. Please try again.");
    }

    const result = await response.json();
    return result.url;
  };

  const validateAll = () => {
    const error = getFieldError(form);
    if (!error) {
      setErrors({});
      return true;
    }

    setErrors({ [error.field]: error.message });
    return false;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateAll()) return;

    const confirmation = await Swal.fire({
      title: "Create this user account?",
      text: "Please confirm the details before saving.",
      icon: "question",
      showCancelButton: true,
      confirmButtonText: "Create User",
      cancelButtonText: "Cancel",
      reverseButtons: true,
      buttonsStyling: false,
      customClass: {
        popup: "rounded-3xl border border-slate-100 shadow-xl bg-white",
        title: "text-xl font-bold text-slate-800",
        confirmButton: "bg-brand-600 hover:bg-brand-700 text-white rounded-xl px-6 py-2.5 font-bold text-sm transition-colors mx-2",
        cancelButton: "bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl px-6 py-2.5 font-bold text-sm transition-colors mx-2",
      }
    });

    if (!confirmation.isConfirmed) return;

    try {
      setIsLoading(true);

      let imgUrl;
      if (form.file) {
        imgUrl = await uploadImage(form.file);
      }

      await axios.post("/auth/register", {
        name: form.name.trim(),
        email: form.email.trim(),
        mobile: form.mobile.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
        type: form.type,
        password: form.password,
        ...(imgUrl ? { img: imgUrl } : {}),
      });

      await showToast.success("User created", "The account has been registered successfully.");

      navigate("/users");
    } catch (err) {
      const message =
        err?.response?.data?.message ||
        err?.message ||
        "Something went wrong while creating the user.";
      showErrorAlert(message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-white px-6 py-8">
      <div className="mx-auto max-w-4xl">
        {/* Header Section */}
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <p className="text-xs font-bold uppercase tracking-wider text-brand-600">
              User Management
            </p>
            <h1 className="mt-1 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
              Add New User
            </h1>
            <p className="mt-1.5 text-xs font-medium text-slate-500">
              Create a new traveler account with optional profile photo upload.
            </p>
          </div>

          <div className="flex gap-2 sm:w-64">
            <div className="flex-1">
              <StatChip label="User Type" value="Traveler" />
            </div>
            <div className="flex-1">
              <StatChip label="Photo" value="Optional" />
            </div>
          </div>
        </div>

        {/* Form Container */}
        <div className="rounded-3xl border border-slate-100 bg-white p-6 shadow-sm md:p-8">
          <form onSubmit={handleSubmit} noValidate>
            
            {/* Profile Photo Uploader */}
            <div className="flex flex-col items-center gap-2.5 mb-8">
              <div className="relative group h-24 w-24 rounded-full overflow-hidden border-4 border-slate-100 bg-slate-50 shadow-inner">
                {previewUrl ? (
                  <img
                    src={previewUrl}
                    alt="Profile preview"
                    className="h-full w-full object-cover"
                  />
                ) : (
                  <div className="flex h-full w-full items-center justify-center text-2xl font-bold text-slate-300">
                    U
                  </div>
                )}
                <label
                  htmlFor="file"
                  className="absolute inset-0 bg-slate-900/60 flex flex-col items-center justify-center text-[10px] font-bold text-white opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer uppercase tracking-wider"
                >
                  <DriveFolderUploadOutlinedIcon className="mb-0.5 h-4 w-4" />
                  Change
                </label>
              </div>
              
              <input
                id="file"
                name="file"
                type="file"
                accept="image/*,.heic,.heif"
                className="hidden"
                onChange={(e) => updateField("file", e.target.files?.[0] ?? null)}
              />

              <div className="text-center">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  {form.file ? (
                    <span className="text-brand-600 truncate max-w-[220px] block">
                      {form.file.name}
                    </span>
                  ) : (
                    "Upload Photo"
                  )}
                </span>
                {errors.file ? (
                  <p className="mt-1 text-xs font-semibold text-red-500">{errors.file}</p>
                ) : (
                  <p className="mt-0.5 text-[10px] text-slate-400">
                    Square JPEG, PNG, WebP, GIF (Max 5MB)
                  </p>
                )}
              </div>
            </div>

            {/* Form Fields Grid */}
            <div className="grid gap-x-5 gap-y-1.5 md:grid-cols-2">
              <FormField
                id="name"
                label="Full Name *"
                icon={<PersonOutlineOutlinedIcon fontSize="small" />}
                error={errors.name}
              >
                <input
                  id="name"
                  type="text"
                  value={form.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  placeholder="Enter full name"
                  className={inputClass(!!errors.name)}
                />
              </FormField>

              <FormField
                id="email"
                label="Email Address *"
                icon={<EmailOutlinedIcon fontSize="small" />}
                error={errors.email}
              >
                <input
                  id="email"
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="Enter email address"
                  className={inputClass(!!errors.email)}
                />
              </FormField>

              <FormField
                id="state"
                label="State *"
                icon={<PlaceOutlinedIcon fontSize="small" />}
                error={errors.state}
              >
                <select
                  id="state"
                  value={form.state}
                  onChange={(e) => {
                    updateField("state", e.target.value);
                    updateField("city", "");
                  }}
                  className={inputClass(!!errors.state)}
                >
                  <option value="" disabled>
                    Select State
                  </option>
                  {Object.keys(INDIAN_STATES_AND_CITIES).map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField
                id="city"
                label="City *"
                icon={<PlaceOutlinedIcon fontSize="small" />}
                error={errors.city}
              >
                <select
                  id="city"
                  value={form.city}
                  onChange={(e) => updateField("city", e.target.value)}
                  disabled={!form.state}
                  className={inputClass(!!errors.city)}
                >
                  <option value="" disabled>
                    {form.state ? "Select City" : "Select State first"}
                  </option>
                  {form.state &&
                    INDIAN_STATES_AND_CITIES[form.state].map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                </select>
              </FormField>

              <FormField
                id="mobile"
                label="Mobile Number *"
                icon={<PhoneOutlinedIcon fontSize="small" />}
                error={errors.mobile}
                helperText="Exactly 10 digits"
              >
                <input
                  id="mobile"
                  type="tel"
                  inputMode="numeric"
                  maxLength={10}
                  value={form.mobile}
                  onChange={(e) =>
                    updateField("mobile", e.target.value.replace(/\D/g, ""))
                  }
                  placeholder="Enter mobile number"
                  className={inputClass(!!errors.mobile)}
                />
              </FormField>

              {/* Hidden traveler user type input */}
              <input type="hidden" name="type" value="traveler" />

              <div className="hidden md:block" />

              <FormField
                id="password"
                label="Password *"
                icon={<LockOutlinedIcon fontSize="small" />}
                error={errors.password}
                helperText="Minimum 6 characters"
              >
                <input
                  id="password"
                  type="password"
                  value={form.password}
                  onChange={(e) => updateField("password", e.target.value)}
                  placeholder="Enter password"
                  className={inputClass(!!errors.password)}
                />
              </FormField>

              <FormField
                id="confirmPassword"
                label="Confirm Password *"
                icon={<LockOutlinedIcon fontSize="small" />}
                error={errors.confirmPassword}
              >
                <input
                  id="confirmPassword"
                  type="password"
                  value={form.confirmPassword}
                  onChange={(e) =>
                    updateField("confirmPassword", e.target.value)
                  }
                  placeholder="Re-enter password"
                  className={inputClass(!!errors.confirmPassword)}
                />
              </FormField>
            </div>

            {/* Action Buttons */}
            <div className="mt-6 flex flex-col-reverse gap-3 border-t border-slate-100 pt-6 sm:flex-row sm:justify-end">
              <button
                type="button"
                onClick={() => navigate("/users")}
                disabled={isLoading}
                className="inline-flex items-center justify-center rounded-xl border border-slate-200 bg-white px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-60"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={isLoading}
                className="inline-flex min-w-[170px] items-center justify-center rounded-xl bg-brand-600 px-5 py-2.5 text-xs font-bold uppercase tracking-wider text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60 shadow-sm shadow-brand-500/10"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <Spinner />
                    Creating...
                  </span>
                ) : (
                  "Create User"
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AddUser;

