import React, { useState, useContext, useRef, useEffect } from "react";
import axios from "../../api/axios";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/authContext";
import { GROUP_CATEGORIES } from "../../constants/groupCategories";
import CustomSelect from "../../components/ui/CustomSelect";
import { MapPin, Calendar, Users, ArrowLeft, Globe, ShieldCheck, Camera, Check, Circle } from "lucide-react";
import { showToast } from "../../utils/showToast";
import { toast } from "sonner";
import moment from "moment";
import { isActuallyVerified } from "../../utils/verification";
import VerificationRequiredModal from "../../components/modals/VerificationRequiredModal";

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
    coverImage: ""
  });

  const [imagePreview, setImagePreview] = useState("");
  const [file, setFile] = useState(null);
  const [autoCoverOptions, setAutoCoverOptions] = useState([]);
  const [selectedAutoCoverIndex, setSelectedAutoCoverIndex] = useState(0);
  const [isFetchingAutoCover, setIsFetchingAutoCover] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeSection, setActiveSection] = useState("basics");
  const [showVerificationModal, setShowVerificationModal] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("createTripDraft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData((prev) => ({
          ...prev,
          ...parsed,
          description: parsed.description !== undefined && parsed.description !== null ? parsed.description : ""
        }));
        if (parsed.coverImage && !parsed.coverImage.startsWith("blob:")) {
            setImagePreview(parsed.coverImage);
        }
      } catch (e) {}
    }
  }, []);

  useEffect(() => {
    const timeout = setTimeout(() => {
      const toSave = { ...formData, coverImage: file ? "" : formData.coverImage };
      localStorage.setItem("createTripDraft", JSON.stringify(toSave));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [formData, file]);

  useEffect(() => {
    if (!formData.destination || file) {
      setAutoCoverOptions([]);
      return;
    }
    const timeoutId = setTimeout(async () => {
      setIsFetchingAutoCover(true);
      try {
        const res = await axios.get(`/journeys/auto-cover-preview?destination=${encodeURIComponent(formData.destination)}&category=${encodeURIComponent(formData.category)}`);
        if (res.data?.success) {
          setAutoCoverOptions(res.data.urls || (res.data.url ? [res.data.url] : []));
          setSelectedAutoCoverIndex(0);
        }
      } catch (err) {
        console.error("Failed to fetch auto cover preview", err);
      } finally {
        setIsFetchingAutoCover(false);
      }
    }, 1500);
    return () => clearTimeout(timeoutId);
  }, [formData.destination, formData.category, file]);

  useEffect(() => {
    const handleScroll = () => {
      const sections = ["basics", "plan", "rules"];
      let current = "basics";
      for (const section of sections) {
        const el = document.getElementById(section);
        if (el) {
          const rect = el.getBoundingClientRect();
          if (rect.top <= window.innerHeight / 2.5) {
            current = section;
          }
        }
      }
      setActiveSection(current);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const isFormValid =
    Boolean(formData.title?.trim()) &&
    Boolean(formData.from?.trim()) &&
    Boolean(formData.destination?.trim()) &&
    Boolean(formData.startDate) &&
    Boolean(formData.endDate) &&
    formData.startDate <= formData.endDate &&
    (!formData.description || formData.description.length <= 500);

  const predefinedTags = [
    "luxury", "budget", "students", "family", "photography",
    "spiritual", "trekking", "roadtrip", "weekend", "foodie"
  ];

  const tagIcons = {
    luxury: "✨", budget: "💰", students: "🎓", family: "👨‍👩‍👧", photography: "📸",
    spiritual: "🧘", trekking: "🏔️", roadtrip: "🚗", weekend: "🌅", foodie: "🍜"
  };

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    const val = type === "checkbox" ? checked : value;

    setFormData((prev) => {
      const updated = { ...prev, [name]: val };
      if (name === "startDate" && val && updated.endDate && val > updated.endDate) {
        updated.endDate = val;
      }
      if (name === "endDate" && val && updated.startDate && val < updated.startDate) {
        updated.startDate = val;
      }
      return updated;
    });
  };

  const handleTagToggle = (tag) => {
    setFormData((prev) => {
      if (prev.tags.includes(tag)) {
        return { ...prev, tags: prev.tags.filter((t) => t !== tag) };
      }
      if (prev.tags.length >= 8) return prev;
      return { ...prev, tags: [...prev.tags, tag] };
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

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!isFormValid) {
      showToast.error("Please complete all required fields");
      return;
    }

    setIsSubmitting(true);
    let toastId = toast.loading("Creating your adventure...");

    try {
      let imageUrl = formData.coverImage;
      if (!file && !imageUrl && autoCoverOptions.length > 0) {
        imageUrl = autoCoverOptions[selectedAutoCoverIndex];
      }

      if (file) {
        const cloudName = process.env.REACT_APP_CLOUDINARY_CLOUD || "ddgjxum9j";
        const preset = process.env.REACT_APP_CLOUDINARY_PRESET || "upload";
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", preset);

        const uploadRes = await fetch(
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`,
          { method: "POST", body: data }
        ).then((res) => res.json());
        imageUrl = (uploadRes.secure_url || uploadRes.url || "").replace(/^http:\/\//i, "https://");
      }

      const payload = {
        title: formData.title,
        destination: formData.destination,
        from: formData.from,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: typeof formData.description === "string" ? formData.description.trim() : (formData.description || ""),
        coverImage: imageUrl,
        journeyType: "Group",
        privacy: formData.isPrivate ? "Private" : "Public",
        maxMembers: formData.maxMembers,
        sourceType: "explore",
        category: formData.category,
        budget: formData.budget,
        isExplorePrivate: formData.isPrivate,
        tags: formData.tags
      };

      const res = await axios.post("/journeys", payload, {
        withCredentials: true
      });

      if (res.data.success) {
        localStorage.removeItem("createTripDraft");
        toast.success("Trip created successfully!", { id: toastId });
        navigate("/social/buddy");
      }
    } catch (err) {
      if (err.response?.status === 403 && err.response?.data?.code === "VERIFICATION_REQUIRED") {
        setShowVerificationModal(true);
      } else {
        toast.error(err.response?.data?.message || "Failed to create trip", {
          id: toastId
        });
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  const getDurationString = () => {
    if (formData.startDate && formData.endDate) {
      const start = moment(formData.startDate);
      const end = moment(formData.endDate);
      if (start.isValid() && end.isValid() && start.isSameOrBefore(end)) {
        const days = end.diff(start, 'days') + 1;
        return `${days} day${days > 1 ? 's' : ''} · ${start.format('MMM D')}–${end.format('MMM D')}`;
      }
    }
    return "Select valid dates";
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: 'smooth' });
  };

  if (!isActuallyVerified(user)) {
    return (
      <VerificationRequiredModal
        isOpen={true}
        onClose={() => {
          if (window.history.length > 1) {
            navigate(-1);
          } else {
            navigate("/social/buddy");
          }
        }}
        actionName="Host Trips"
        verificationStatus={user?.verificationStatus || "unverified"}
        rejectionReason={user?.verificationNote || ""}
      />
    );
  }

  return (
    <div className="min-h-screen bg-background text-text-primary font-sans pb-28 lg:pb-12 selection:bg-primary-100 selection:text-primary-900 relative">
      <div className="absolute top-0 left-0 right-0 h-48 bg-gradient-to-b from-primary-50/70 to-transparent pointer-events-none z-0" />

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/90 backdrop-blur-xl border-b border-slate-200/70 shadow-2xs">
        <div className="max-w-[1100px] mx-auto px-3 sm:px-4 h-13 sm:h-15 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate("/social/buddy");
                }
              }}
              className="p-1.5 sm:p-2 -ml-1 rounded-xl hover:bg-slate-100 text-text-primary transition-colors shrink-0 cursor-pointer"
              title="Go back"
            >
              <ArrowLeft className="w-4.5 h-4.5 sm:w-5 sm:h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-base font-bold text-text-primary tracking-tight truncate font-heading">
                Create New Trip
              </h1>
              <p className="text-[11px] font-medium text-text-muted hidden sm:block">
                Plan your adventure & find travel buddies
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <span className="text-[10px] font-semibold uppercase tracking-wider text-text-muted hidden md:inline-block bg-slate-100 px-2 py-1 rounded-md">
              Draft Auto-Saved
            </span>
            <button
              disabled={!isFormValid || isSubmitting}
              onClick={handleSubmit}
              className={`px-3.5 sm:px-4.5 py-1.5 sm:py-2 rounded-xl text-xs sm:text-[13px] font-bold transition-all flex items-center gap-1.5 ${
                isFormValid && !isSubmitting
                  ? "bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-primary-600/25 active:scale-95 cursor-pointer"
                  : "bg-slate-100 text-text-muted cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "Launching..." : "Launch Trip →"}
            </button>
          </div>
        </div>

        {/* Multi-step Header */}
        <div className="max-w-[1100px] mx-auto px-3 sm:px-4 h-10 flex items-center gap-1 sm:gap-3 overflow-x-auto no-scrollbar border-t border-slate-100">
          {[
            { id: "basics", num: "01", label: "Trip Details" },
            { id: "plan", num: "02", label: "Dates & Description" },
            { id: "rules", num: "03", label: "Who’s Joining?" }
          ].map((step, idx, arr) => (
            <div key={step.id} className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => scrollToSection(step.id)}
                className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-[11px] font-bold tracking-wide transition-all cursor-pointer ${
                  activeSection === step.id
                    ? "text-primary-700 bg-primary-50 font-extrabold"
                    : "text-text-muted hover:text-text-secondary"
                }`}
              >
                <span>{step.num}</span> <span>{step.label}</span>
              </button>
              {idx < arr.length - 1 && <span className="text-slate-300 mx-1">→</span>}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-[1100px] mx-auto px-3 sm:px-4 py-4 sm:py-6 relative z-10">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-5 sm:gap-6 items-start">
          
          <div className="lg:col-span-8 space-y-5 sm:space-y-6">
            
            {/* Step 1: Trip Details */}
            <section id="basics" className="scroll-mt-24 space-y-2.5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight font-heading">
                  Trip Details
                </h2>
                <p className="text-xs text-text-muted font-medium">
                  Name your trip and set your departure & destination points.
                </p>
              </div>

              <div className="bg-surface rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-4">
                
                {/* Cover Image */}
                <div className="w-full">
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                    Cover Image <span className="text-[10px] font-normal normal-case text-text-muted">(Optional)</span>
                  </label>
                  <div 
                    className={`relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-xl sm:rounded-2xl border border-slate-200/80 overflow-hidden group bg-slate-50/50 flex flex-col items-center justify-center transition-all shadow-2xs ${!file && autoCoverOptions.length === 0 ? "border-dashed hover:border-brand/40 hover:bg-brand/5 cursor-pointer" : ""}`}
                    onClick={() => !file && autoCoverOptions.length === 0 && fileInputRef.current?.click()}
                  >
                    {file && imagePreview ? (
                      <>
                        <img src={imagePreview} alt="User Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="bg-white text-text-primary hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-transform hover:scale-105 cursor-pointer"
                          >
                            Change Photo
                          </button>
                        </div>
                        <div className="absolute top-3 left-3 bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-0.5 rounded-full flex items-center gap-1.5 group-hover:opacity-0 transition-opacity">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400"></span>
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Your Photo</span>
                        </div>
                      </>
                    ) : autoCoverOptions.length > 0 ? (
                      <>
                        <img src={autoCoverOptions[selectedAutoCoverIndex]} alt="Auto Cover" className="w-full h-full object-cover" />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <button
                            type="button"
                            onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                            className="bg-white text-text-primary hover:bg-slate-100 px-4 py-2 rounded-xl text-xs font-bold shadow-md transition-transform hover:scale-105 cursor-pointer"
                          >
                            Upload Custom Photo
                          </button>
                        </div>
                        <div className="absolute top-3 left-3 bg-white/15 backdrop-blur-md border border-white/20 px-2.5 py-0.5 rounded-full flex items-center gap-1 group-hover:opacity-0 transition-opacity">
                          <span className="text-xs leading-none">✨</span>
                          <span className="text-[10px] font-bold text-white uppercase tracking-wider">Auto Cover</span>
                        </div>
                      </>
                    ) : (
                      <div className="flex flex-col items-center justify-center p-4 text-center">
                        <div className="w-10 h-10 rounded-xl bg-white shadow-2xs border border-slate-100 flex items-center justify-center mb-2.5 group-hover:scale-105 transition-transform">
                          <Camera className="w-4.5 h-4.5 text-text-muted group-hover:text-brand" />
                        </div>
                        <h3 className="text-xs font-bold text-text-primary mb-0.5">Add Trip Cover</h3>
                        <p className="text-[11px] text-text-muted mb-3">
                          Upload a photo or we'll choose one for you automatically.
                        </p>
                        <button
                          type="button"
                          onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }}
                          className="bg-white border border-slate-200 text-text-secondary hover:text-text-primary shadow-2xs px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer"
                        >
                          + Upload Photo
                        </button>
                      </div>
                    )}
                    
                    <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                  </div>

                  {!file && autoCoverOptions.length > 1 && (
                    <div className="mt-2.5 overflow-x-auto no-scrollbar flex gap-2 pb-1">
                      {autoCoverOptions.map((url, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setSelectedAutoCoverIndex(idx)}
                          className={`flex-shrink-0 w-20 h-13 rounded-lg overflow-hidden cursor-pointer border-2 transition-all ${
                            selectedAutoCoverIndex === idx ? "border-brand scale-102 shadow-xs" : "border-transparent opacity-70 hover:opacity-100"
                          }`}
                        >
                          <img src={url} alt={`Option ${idx + 1}`} className="w-full h-full object-cover" />
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="w-full">
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                    Trip Title
                  </label>
                  <input
                    name="title"
                    value={formData.title}
                    onChange={handleInputChange}
                    placeholder="e.g. Weekend Escape to Manali"
                    className="input-field"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                      Starting from
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                      <input
                        name="from"
                        value={formData.from}
                        onChange={handleInputChange}
                        placeholder="Departure city"
                        className="input-field !pl-10"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                      Going to
                    </label>
                    <div className="relative">
                      <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                      <input
                        name="destination"
                        value={formData.destination}
                        onChange={handleInputChange}
                        placeholder="Destination city"
                        className="input-field !pl-10"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 2: Dates & Description */}
            <section id="plan" className="scroll-mt-24 space-y-2.5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight font-heading">
                  Dates & Description
                </h2>
                <p className="text-xs text-text-muted font-medium">
                  Set your travel dates, trip itinerary, and vibe tags.
                </p>
              </div>

              <div className="bg-surface rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-4">
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                    <div>
                      <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                        Start Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          min={todayStr}
                          onChange={handleInputChange}
                          className="input-field !pl-10"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                        End Date
                      </label>
                      <div className="relative">
                        <Calendar className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-text-muted pointer-events-none" />
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          min={formData.startDate || todayStr}
                          onChange={handleInputChange}
                          className="input-field !pl-10"
                        />
                      </div>
                    </div>
                  </div>
                  {formData.startDate && formData.endDate && (
                    <p className="text-[11px] font-bold text-primary-600 mt-2.5 inline-block px-2.5 py-1 rounded-lg bg-primary-50 border border-primary-100">
                      {getDurationString()}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                    Trip Description <span className="text-[10px] font-normal normal-case text-text-muted">(Optional)</span>
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    maxLength={500}
                    rows="3"
                    placeholder="Describe planned activities, places to explore, and ideal travel companions..."
                    className="input-field resize-none"
                  />
                  <div className="flex justify-end items-center mt-1.5">
                    <span className={`text-[11px] font-semibold ${(formData.description?.length || 0) > 500 ? "text-rose-500" : "text-text-muted"}`}>
                      {formData.description?.length || 0}/500
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                    Trip Type <span className="text-[10px] font-normal normal-case text-text-muted">(Optional · Pick up to 8)</span>
                  </label>
                  <div className="flex flex-wrap gap-2 pt-0.5">
                    {predefinedTags.map((tag) => {
                      const isSelected = formData.tags?.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border flex items-center gap-1.5 cursor-pointer ${
                            isSelected
                              ? "bg-primary-50 text-primary-700 border-primary-300 shadow-2xs"
                              : "bg-white text-text-secondary border-slate-200 hover:border-primary-200 hover:bg-slate-50"
                          }`}
                        >
                          <span>{tagIcons[tag] || "🏷️"}</span>
                          <span className="capitalize">{tag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* Step 3: Who's Joining? */}
            <section id="rules" className="scroll-mt-24 space-y-2.5">
              <div>
                <h2 className="text-base sm:text-lg font-bold text-text-primary tracking-tight font-heading">
                  Who’s Joining?
                </h2>
                <p className="text-xs text-text-muted font-medium">
                  Set maximum travelers and privacy permissions.
                </p>
              </div>

              <div className="bg-surface rounded-2xl p-4 sm:p-5 shadow-xs border border-slate-200/80 space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5">
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                      Group Size
                    </label>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, maxMembers: Math.max(2, p.maxMembers - 1) }))}
                        className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-text-secondary font-bold transition-colors cursor-pointer"
                      >
                        −
                      </button>
                      <div className="text-sm font-bold text-text-primary w-20 text-center">
                        {formData.maxMembers} travelers
                      </div>
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, maxMembers: Math.min(500, p.maxMembers + 1) }))}
                        className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-text-secondary font-bold transition-colors cursor-pointer"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-1.5">
                      Category
                    </label>
                    <CustomSelect
                      id="category"
                      name="category"
                      value={formData.category}
                      onChange={handleInputChange}
                      options={GROUP_CATEGORIES}
                      placeholder="Select category"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-text-muted uppercase tracking-wider mb-2">
                    Joining Method
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div
                      onClick={() => setFormData((p) => ({ ...p, isPrivate: false }))}
                      className={`p-3.5 sm:p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        !formData.isPrivate ? "border-primary-500 bg-primary-50/30 shadow-2xs" : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <Globe className={`w-4 h-4 ${!formData.isPrivate ? "text-primary-600" : "text-text-muted"}`} />
                          <h3 className={`text-sm font-bold ${!formData.isPrivate ? "text-primary-900" : "text-text-primary"}`}>
                            Open Group
                          </h3>
                        </div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${!formData.isPrivate ? "bg-primary-500 text-white" : "border border-slate-300"}`}>
                          {!formData.isPrivate && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-xs text-text-muted">Anyone can join before trip starts.</p>
                    </div>

                    <div
                      onClick={() => setFormData((p) => ({ ...p, isPrivate: true }))}
                      className={`p-3.5 sm:p-4 rounded-xl border-2 transition-all cursor-pointer ${
                        formData.isPrivate ? "border-primary-500 bg-primary-50/30 shadow-2xs" : "border-slate-200 bg-white hover:border-slate-300"
                      }`}
                    >
                      <div className="flex justify-between items-center mb-1.5">
                        <div className="flex items-center gap-2">
                          <ShieldCheck className={`w-4 h-4 ${formData.isPrivate ? "text-primary-600" : "text-text-muted"}`} />
                          <h3 className={`text-sm font-bold ${formData.isPrivate ? "text-primary-900" : "text-text-primary"}`}>
                            Approval Required
                          </h3>
                        </div>
                        <div className={`w-5 h-5 rounded-full flex items-center justify-center ${formData.isPrivate ? "bg-primary-500 text-white" : "border border-slate-300"}`}>
                          {formData.isPrivate && <Check className="w-3 h-3 stroke-[3]" />}
                        </div>
                      </div>
                      <p className="text-xs text-text-muted">Travelers must request to join.</p>
                    </div>
                  </div>

                  <div className="mt-3 flex items-center gap-2 p-2.5 rounded-xl bg-slate-50 border border-slate-200/70 text-text-muted text-xs font-medium">
                    <span>🔒</span>
                    <span>Roster locks when journey starts. No new travelers can join after departure.</span>
                  </div>
                </div>
              </div>
            </section>

            {/* Mobile Bottom Sticky Action Bar */}
            <div className="lg:hidden fixed bottom-0 left-0 right-0 z-40 px-3.5 py-2.5 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg flex items-center justify-between gap-3">
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-text-primary truncate">
                  {formData.title?.trim() || "New Trip"}
                </p>
                <p className="text-[11px] text-text-muted truncate">
                  {formData.destination?.trim() ? `📍 ${formData.destination}` : "Fill required fields"}
                </p>
              </div>
              <button
                type="button"
                disabled={!isFormValid || isSubmitting}
                onClick={handleSubmit}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shrink-0 ${
                  isFormValid && !isSubmitting
                    ? "bg-primary-600 hover:bg-primary-700 text-white shadow-sm shadow-primary-600/25 active:scale-95 cursor-pointer"
                    : "bg-slate-100 text-text-muted cursor-not-allowed"
                }`}
              >
                {isSubmitting ? "Launching..." : "Launch Trip →"}
              </button>
            </div>
          </div>

          {/* Desktop Sidebar Summary */}
          <div className="hidden lg:block lg:col-span-4 lg:sticky lg:top-[110px] order-last">
            <div className="bg-surface rounded-2xl p-5 shadow-xs border border-slate-200/80 flex flex-col">
              <h3 className="text-[11px] font-bold text-text-muted uppercase tracking-wider mb-4">
                Trip Preview
              </h3>
              
              <div className="space-y-3.5 mb-5">
                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg bg-primary-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-primary-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Destination</p>
                    <p className={`text-sm ${formData.destination?.trim() ? "text-text-primary font-bold" : "text-slate-300 font-medium"}`}>
                      {formData.destination?.trim() ? formData.destination : "Add destination"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Dates</p>
                    <p className={`text-sm ${formData.startDate && formData.endDate ? "text-text-primary font-bold" : "text-slate-300 font-medium"}`}>
                      {formData.startDate && formData.endDate ? `${moment(formData.startDate).format('MMM D')}–${moment(formData.endDate).format('MMM D')}` : "Add dates"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-3 items-start">
                  <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-brand" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[10px] font-bold text-text-muted uppercase tracking-wider">Group</p>
                    <p className="text-sm font-bold text-text-primary">Up to {formData.maxMembers} travelers</p>
                    <p className="text-[11px] text-text-muted">{formData.category} · {!formData.isPrivate ? "Open Group" : "Approval Required"}</p>
                  </div>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <h4 className="text-xs font-bold text-text-primary mb-2">Checklist</h4>
                <ul className="space-y-1.5 text-xs">
                  <li className={`flex items-center gap-2 ${formData.title?.trim() ? "text-emerald-600 font-semibold" : "text-text-muted"}`}>
                    {formData.title?.trim() ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />} Trip title
                  </li>
                  <li className={`flex items-center gap-2 ${formData.destination?.trim() ? "text-emerald-600 font-semibold" : "text-text-muted"}`}>
                    {formData.destination?.trim() ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />} Destination
                  </li>
                  <li className={`flex items-center gap-2 ${formData.startDate && formData.endDate && formData.startDate <= formData.endDate ? "text-emerald-600 font-semibold" : "text-text-muted"}`}>
                    {formData.startDate && formData.endDate && formData.startDate <= formData.endDate ? <Check className="w-3.5 h-3.5" /> : <Circle className="w-3.5 h-3.5 text-slate-300" />} Dates
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </main>

      {showVerificationModal && (
        <VerificationRequiredModal
          isOpen={showVerificationModal}
          onClose={() => setShowVerificationModal(false)}
          actionName="Host Trips"
          verificationStatus={user?.verificationStatus || "unverified"}
          rejectionReason={user?.verificationNote || ""}
        />
      )}
    </div>
  );
};

export default CreateBuddyTrip;