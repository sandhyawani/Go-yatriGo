import React, { useState, useContext, useRef } from "react";
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";
import {
  MapPin,
  Calendar,
  Users,
  ArrowLeft,
  Lock,
  Globe,
  Image as ImageIcon,
  X,
  Wallet,
  Tag,
  AlertCircle,
  Camera,
  Map,
  FileText,
} from "lucide-react";
import { showToast } from "../../utils/showToast";
import { toast } from "sonner";
import { AuthContext } from "../../context/authContext";
import { GROUP_CATEGORIES } from "../../constants/groupCategories";
import { motion, AnimatePresence } from "framer-motion";

const CreateBuddyTrip = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const fileInputRef = useRef(null);
  const todayStr = new Date().toISOString().split("T")[0];

  const [formData, setFormData] = useState({
    title: "",
    from: "",
    destination: "",
    startDate: "",
    endDate: "",
    description: "",
    maxMembers: 4,
    category: "Adventure",
    isPrivate: false,
    tags: [],
    budget: "",
    coverImage: "",
  });

  const [errors, setErrors] = useState({});
  const [imagePreview, setImagePreview] = useState("");
  const [file, setFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const categories = GROUP_CATEGORIES;
  const predefinedTags = [
    "luxury",
    "budget",
    "students",
    "family",
    "photography",
    "spiritual",
    "trekking",
    "roadtrip",
    "weekend",
    "foodie",
  ];

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updated = {
        ...prev,
        [name]: val,
      };

      // Automatically sync dates so start date cannot be after end date
      if (
        name === "startDate" &&
        val &&
        updated.endDate &&
        val > updated.endDate
      ) {
        updated.endDate = val;
      }
      if (
        name === "endDate" &&
        val &&
        updated.startDate &&
        val < updated.startDate
      ) {
        updated.startDate = val;
      }

      return updated;
    });

    // Clear error when typing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
    if ((name === "startDate" || name === "endDate") && errors.endDate) {
      setErrors((prev) => ({ ...prev, endDate: "" }));
    }
    if ((name === "startDate" || name === "endDate") && errors.startDate) {
      setErrors((prev) => ({ ...prev, startDate: "" }));
    }
  };

  const handleTagToggle = (tag) => {
    setFormData((prev) => {
      const tags = prev.tags.includes(tag)
        ? prev.tags.filter((t) => t !== tag)
        : [...prev.tags, tag];
      return { ...prev, tags };
    });
  };

  const handleImageChange = (e) => {
    const selectedFile = e.target.files?.[0];
    if (!selectedFile) return;

    if (!selectedFile.type.startsWith("image/")) {
      return showToast.error("Please select an image file");
    }

    if (selectedFile.size > 5 * 1024 * 1024) {
      return showToast.error("Image size should be less than 5MB");
    }

    setFile(selectedFile);
    const reader = new FileReader();
    reader.onloadend = () => setImagePreview(reader.result);
    reader.readAsDataURL(selectedFile);
  };

  const removeImage = () => {
    setImagePreview("");
    setFile(null);
    setFormData((prev) => ({ ...prev, coverImage: "" }));
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.title.trim()) newErrors.title = "Trip title is required";
    if (!formData.from.trim()) newErrors.from = "Starting location is required";
    if (!formData.destination.trim())
      newErrors.destination = "Destination is required";
    if (!formData.startDate) newErrors.startDate = "Start date is required";
    else if (formData.startDate < todayStr)
      newErrors.startDate = "Start date cannot be in the past";

    if (!formData.endDate) newErrors.endDate = "End date is required";
    else if (
      formData.startDate &&
      formData.endDate &&
      formData.startDate > formData.endDate
    ) {
      newErrors.endDate = "End date must be after start date";
    }
    if (!formData.description.trim()) {
      newErrors.description = "Trip description is required";
    } else if (formData.description.trim().length < 20) {
      newErrors.description = "Description should be at least 20 characters";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      showToast.error("Please fix the errors in the form");
      // Scroll to top to see errors
      window.scrollTo({ top: 0, behavior: "smooth" });
      return;
    }

    setIsSubmitting(true);
    let toastId = toast.loading("Creating your amazing trip...");

    try {
      let imageUrl = formData.coverImage;

      if (file) {
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", "upload");

        const uploadRes = await fetch(
          "https://api.cloudinary.com/v1_1/dpgelkpd4/image/upload",
          { method: "POST", body: data },
        ).then((res) => res.json());
        imageUrl = uploadRes.url;
      }

      const payload = {
        ...formData,
        maxCompanions: formData.maxMembers,
        coverImage: imageUrl,
      };
      const res = await axios.post("/social/buddy", payload, {
        withCredentials: true,
      });

      if (res.data.success) {
        toast.success("Travel group created successfully!", { id: toastId });
        navigate("/social/buddy");
      }
    } catch (err) {
      toast.error(err.response?.data?.message || "Failed to create group", {
        id: toastId,
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const ErrorMessage = ({ message }) => (
    <AnimatePresence>
      {message && (
        <motion.div
          initial={{ opacity: 0, height: 0, y: -5 }}
          animate={{ opacity: 1, height: "auto", y: 0 }}
          exit={{ opacity: 0, height: 0 }}
          className="text-rose-500 text-xs font-medium mt-1.5 flex items-center gap-1"
        >
          <AlertCircle className="w-3.5 h-3.5" />
          {message}
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-[#F8FAFC] text-slate-800 font-sans pb-24 selection:bg-brand-100 selection:text-brand-900">
      {/* Header */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-xl border-b border-white/20 shadow-sm supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/social/buddy")}
              className="p-2 -ml-2 rounded-full hover:bg-slate-100 text-slate-600 transition-colors"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-extrabold bg-gradient-to-r from-brand-600 to-brand-600 bg-clip-text text-transparent">
              Create New Trip
            </h1>
          </div>
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="px-6 py-2 bg-gradient-to-r from-brand-600 to-brand-600 hover:from-brand-700 hover:to-brand-700 text-white font-bold text-sm rounded-full transition-all shadow-md shadow-brand-200 disabled:opacity-50 flex items-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg
                  className="animate-spin -ml-1 mr-2 h-4 w-4 text-white"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="none"
                  viewBox="0 0 24 24"
                >
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
                Publishing...
              </>
            ) : (
              "Launch Trip"
            )}
          </motion.button>
        </div>
      </div>

      <main className="max-w-4xl mx-auto px-4 py-8">
        <form
          id="createBuddyTripForm"
          onSubmit={handleSubmit}
          className="space-y-8"
        >
          {/* Banner Upload Section */}
          <motion.section
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative w-full h-48 md:h-64 rounded-3xl overflow-hidden bg-white shadow-sm border border-slate-100 group"
          >
            <div
              className={`absolute inset-0 flex flex-col items-center justify-center cursor-pointer transition-colors ${imagePreview ? "" : "bg-gradient-to-br from-brand-50/50 to-brand-50/50 hover:from-brand-100/50 hover:to-brand-100/50"}`}
              onClick={() => !imagePreview && fileInputRef.current?.click()}
            >
              {imagePreview ? (
                <>
                  <img
                    src={imagePreview}
                    alt="Cover"
                    className="w-full h-full object-cover absolute inset-0"
                  />
                  <div className="absolute inset-0 bg-black/10 group-hover:bg-black/40 transition-colors z-10"></div>
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute inset-0 flex items-center justify-center z-20">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeImage();
                      }}
                      className="px-4 py-2 bg-white/20 hover:bg-white/30 backdrop-blur-md rounded-full text-white font-medium flex items-center gap-2 transition-all shadow-lg"
                    >
                      <X className="w-4 h-4" /> Remove Photo
                    </button>
                  </div>
                </>
              ) : (
                <div className="flex flex-col items-center text-brand-400">
                  <div className="w-14 h-14 bg-white rounded-full flex items-center justify-center shadow-sm mb-3">
                    <Camera className="w-6 h-6 text-brand-500" />
                  </div>
                  <span className="text-sm font-bold text-slate-700 mb-1">
                    Upload Trip Cover
                  </span>
                  <span className="text-xs text-slate-400 font-medium">
                    Recommended: 16:9, Max 5MB
                  </span>
                </div>
              )}
              <input
                type="file"
                ref={fileInputRef}
                onChange={handleImageChange}
                accept="image/*,.heic,.heif"
                className="hidden"
              />
            </div>
          </motion.section>

          {/* Form Cards Container */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Left Column: Main Details */}
            <div className="md:col-span-2 space-y-8">
              {/* Card 1: Trip Basics */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                    <Map className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Trip Basics
                  </h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                      Trip Title
                    </label>
                    <input
                      type="text"
                      name="title"
                      placeholder="e.g. Mystical Manali Weekend"
                      value={formData.title}
                      onChange={handleInputChange}
                      className={`w-full bg-slate-50/50 border ${errors.title ? "border-rose-300 bg-rose-50/30 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20"} rounded-2xl px-4 py-3.5 text-slate-900 font-semibold placeholder:text-slate-400 placeholder:font-medium focus:bg-white outline-none transition-all focus:ring-4`}
                    />
                    <ErrorMessage message={errors.title} />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                        Starting From
                      </label>
                      <div className="relative">
                        <MapPin
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.from ? "text-rose-400" : "text-slate-400"}`}
                        />
                        <input
                          type="text"
                          name="from"
                          placeholder="City or Landmark"
                          value={formData.from}
                          onChange={handleInputChange}
                          className={`w-full bg-slate-50/50 border ${errors.from ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20"} rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold focus:bg-white outline-none transition-all focus:ring-4`}
                        />
                      </div>
                      <ErrorMessage message={errors.from} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                        Destination
                      </label>
                      <div className="relative">
                        <MapPin
                          className={`absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 ${errors.destination ? "text-rose-400" : "text-brand-400"}`}
                        />
                        <input
                          type="text"
                          name="destination"
                          placeholder="Where to?"
                          value={formData.destination}
                          onChange={handleInputChange}
                          className={`w-full bg-slate-50/50 border ${errors.destination ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20"} rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold focus:bg-white outline-none transition-all focus:ring-4`}
                        />
                      </div>
                      <ErrorMessage message={errors.destination} />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                        Start Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          min={todayStr}
                          onChange={handleInputChange}
                          className={`w-full bg-slate-50/50 border ${errors.startDate ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20"} rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-700 focus:bg-white outline-none transition-all focus:ring-4 cursor-pointer`}
                        />
                      </div>
                      <ErrorMessage message={errors.startDate} />
                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                        End Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          min={formData.startDate || todayStr}
                          onChange={handleInputChange}
                          className={`w-full bg-slate-50/50 border ${errors.endDate ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20"} rounded-2xl pl-10 pr-4 py-3 text-sm font-semibold text-slate-700 focus:bg-white outline-none transition-all focus:ring-4 cursor-pointer`}
                        />
                      </div>
                      <ErrorMessage message={errors.endDate} />
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Card 2: Details & Description */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-slate-100"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2.5 bg-brand-50 text-brand-600 rounded-xl">
                    <FileText className="w-5 h-5" />
                  </div>
                  <h2 className="text-lg font-bold text-slate-800">
                    Trip Details
                  </h2>
                </div>

                <div className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                      Description & Itinerary
                    </label>
                    <textarea
                      name="description"
                      rows="5"
                      placeholder="What's the plan? Describe the vibe, places you'll visit, and what kind of travel buddies you're looking for..."
                      value={formData.description}
                      onChange={handleInputChange}
                      className={`w-full bg-slate-50/50 border ${errors.description ? "border-rose-300 focus:border-rose-500 focus:ring-rose-500/20" : "border-slate-200 focus:border-brand-500 focus:ring-brand-500/20"} rounded-2xl px-4 py-3 text-sm font-medium focus:bg-white outline-none transition-all focus:ring-4 resize-none`}
                    />
                    <div className="flex justify-between items-center mt-1.5">
                      <ErrorMessage message={errors.description} />
                      <span
                        className={`text-xs font-medium ml-auto ${formData.description.length < 20 ? "text-rose-400" : "text-emerald-500"}`}
                      >
                        {formData.description.length}/500
                      </span>
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                      Vibe Tags
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {predefinedTags.map((tag) => {
                        const isSelected = formData.tags.includes(tag);
                        return (
                          <motion.button
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                            key={tag}
                            type="button"
                            onClick={() => handleTagToggle(tag)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all border ${
                              isSelected
                                ? "bg-brand-600 text-white border-brand-600 shadow-md shadow-brand-200"
                                : "bg-white text-slate-500 border-slate-200 hover:border-brand-300 hover:text-brand-600"
                            }`}
                          >
                            #{tag}
                          </motion.button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>

            {/* Right Column: Settings & Budget */}
            <div className="space-y-8">
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100"
              >
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                    <Wallet className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    Budget Estimate
                  </h3>
                </div>

                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-semibold text-lg">
                    ₹
                  </span>
                  <input
                    type="number"
                    name="budget"
                    placeholder="0"
                    value={formData.budget}
                    onChange={handleInputChange}
                    min="0"
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl pl-8 pr-4 py-3 text-lg font-bold text-slate-800 focus:bg-white focus:border-emerald-500 outline-none transition-all focus:ring-4 focus:ring-emerald-500/20"
                  />
                </div>
                <p className="text-xs text-slate-500 font-medium mt-2 ml-1">
                  Approximate cost per person
                </p>
              </motion.div>

              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-white p-6 rounded-3xl shadow-sm border border-slate-100 space-y-6"
              >
                <div className="flex items-center gap-3 mb-2">
                  <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
                    <Users className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-slate-800">
                    Group Rules
                  </h3>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2 ml-1">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                      Group Size
                    </label>
                    <span className="text-sm font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                      {formData.maxMembers}
                    </span>
                  </div>
                  <input
                    type="range"
                    min="2"
                    max="500"
                    value={formData.maxMembers}
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        maxMembers: parseInt(e.target.value),
                      }))
                    }
                    className="w-full accent-blue-600 h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase tracking-wider mb-2 ml-1">
                    Category
                  </label>
                  <select
                    name="category"
                    value={formData.category}
                    onChange={handleInputChange}
                    className="w-full bg-slate-50/50 border border-slate-200 rounded-2xl px-4 py-3 text-sm font-semibold text-slate-700 focus:bg-white focus:border-blue-500 outline-none transition-all focus:ring-4 focus:ring-blue-500/20 appearance-none"
                    style={{
                      backgroundImage: `url("data:image/svg+xml,%3csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 20 20'%3e%3cpath stroke='%236b7280' stroke-linecap='round' stroke-linejoin='round' stroke-width='1.5' d='M6 8l4 4 4-4'/%3e%3c/svg%3e")`,
                      backgroundPosition: "right 0.5rem center",
                      backgroundRepeat: "no-repeat",
                      backgroundSize: "1.5em 1.5em",
                    }}
                  >
                    {categories.map((cat) => (
                      <option key={cat} value={cat}>
                        {cat}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <div
                    className="flex items-center justify-between group cursor-pointer"
                    onClick={() =>
                      setFormData((p) => ({ ...p, isPrivate: !p.isPrivate }))
                    }
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className={`p-2 rounded-lg transition-colors ${formData.isPrivate ? "bg-slate-100 text-slate-700" : "bg-emerald-50 text-emerald-600"}`}
                      >
                        {formData.isPrivate ? (
                          <Lock className="w-4 h-4" />
                        ) : (
                          <Globe className="w-4 h-4" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-slate-800">
                          {formData.isPrivate
                            ? "Private Group"
                            : "Public Group"}
                        </p>
                        <p className="text-xs font-medium text-slate-400 mt-0.5">
                          {formData.isPrivate
                            ? "Invite only"
                            : "Anyone can join"}
                        </p>
                      </div>
                    </div>

                    <div
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${formData.isPrivate ? "bg-slate-300" : "bg-emerald-500"}`}
                    >
                      <span
                        className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${formData.isPrivate ? "translate-x-6" : "translate-x-1"}`}
                      />
                    </div>
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateBuddyTrip;

