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

  // Load draft from localStorage on mount
  useEffect(() => {
    const saved = localStorage.getItem("createTripDraft");
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        setFormData(parsed);
        if (parsed.coverImage && !parsed.coverImage.startsWith("blob:")) {
            // Restore preview if it was a URL
            setImagePreview(parsed.coverImage);
        }
      } catch (e) {}
    }
  }, []);

  // Autosave to localStorage
  useEffect(() => {
    const timeout = setTimeout(() => {
      // Don't save the file blob URL to localstorage as it will break
      const toSave = { ...formData, coverImage: file ? "" : formData.coverImage };
      localStorage.setItem("createTripDraft", JSON.stringify(toSave));
    }, 1000);
    return () => clearTimeout(timeout);
  }, [formData, file]);

  // Fetch Auto Cover Preview
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

  // ScrollSpy for Progress Indicator
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
    (formData.description?.trim().length || 0) >= 20;

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
        const data = new FormData();
        data.append("file", file);
        data.append("upload_preset", "upload");

        const uploadRes = await fetch(
          "https://api.cloudinary.com/v1_1/dpgelkpd4/image/upload",
          { method: "POST", body: data }
        ).then((res) => res.json());
        imageUrl = uploadRes.url;
      }

      const payload = {
        title: formData.title,
        destination: formData.destination,
        from: formData.from,
        startDate: formData.startDate,
        endDate: formData.endDate,
        description: formData.description,
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
      toast.error(err.response?.data?.message || "Failed to create trip", {
        id: toastId
      });
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

  return (
    <div className="min-h-screen bg-[#FDFCFE] text-slate-800 font-sans pb-12 selection:bg-purple-100 selection:text-purple-900 relative">
      {/* Decorative gradient top background */}
      <div className="absolute top-0 left-0 right-0 h-64 bg-gradient-to-b from-purple-50/80 to-transparent pointer-events-none z-0" />

      {/* Sticky Header */}
      <div className="sticky top-0 z-50 bg-white/80 backdrop-blur-xl border-b border-slate-200/60 shadow-sm supports-[backdrop-filter]:bg-white/60">
        <div className="max-w-[1100px] mx-auto px-3 sm:px-4 h-14 sm:h-16 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2 sm:gap-5 min-w-0">
            <button
              onClick={() => {
                if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate("/social/buddy");
                }
              }}
              className="p-1.5 sm:p-2 -ml-1 rounded-xl hover:bg-slate-100 text-slate-700 transition-colors shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <h1 className="text-sm sm:text-[17px] font-bold text-slate-900 tracking-tight truncate font-heading">Create New Trip</h1>
              <p className="text-[11px] font-normal sm:font-medium text-slate-500 hidden sm:block font-sans">Plan your next adventure with the right travel buddies.</p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4 shrink-0 font-sans">
            <span className="text-[10px] font-semibold uppercase tracking-[0.08em] text-slate-400 hidden md:inline-block bg-slate-100 px-2 py-1 rounded-md">Draft Auto-Saved</span>
            <button
              disabled={!isFormValid || isSubmitting}
              onClick={handleSubmit}
              className={`px-3.5 sm:px-5 py-2 sm:py-2.5 rounded-xl text-xs sm:text-[13px] font-semibold transition-all flex items-center gap-1.5 sm:gap-2 ${
                isFormValid && !isSubmitting
                  ? "bg-purple-600 hover:bg-purple-700 text-white shadow-[0_4px_14px_rgba(124,58,237,0.25)] active:scale-95"
                  : "bg-slate-100 text-slate-400 cursor-not-allowed"
              }`}
            >
              {isSubmitting ? "Launching..." : "Launch Trip →"}
            </button>
          </div>
        </div>

        {/* Lightweight Progress Indicator */}
        <div className="max-w-[1100px] mx-auto px-4 h-11 flex items-center gap-1 sm:gap-4 overflow-x-auto no-scrollbar border-t border-slate-100">
          {[
            { id: "basics", num: "01", label: "Basics" },
            { id: "plan", num: "02", label: "Trip Plan" },
            { id: "rules", num: "03", label: "Crew & Rules" }
          ].map((step, idx, arr) => (
            <div key={step.id} className="flex items-center shrink-0">
              <button
                type="button"
                onClick={() => scrollToSection(step.id)}
                className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] font-extrabold tracking-wide transition-all ${
                  activeSection === step.id ? "text-purple-700 bg-purple-50" : "text-slate-400 hover:text-slate-600 hover:bg-slate-50"
                }`}
              >
                <span>{step.num}</span> <span>{step.label}</span>
              </button>
              {idx < arr.length - 1 && <span className="text-slate-300 mx-1 sm:mx-2">→</span>}
            </div>
          ))}
        </div>
      </div>

      <main className="max-w-[1100px] mx-auto px-4 py-6 relative z-10">
        <form onSubmit={handleSubmit} className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          
          {/* Left Column: Form Fields */}
          <div className="lg:col-span-8 space-y-8 pb-8">
            
            {/* Step 1: Basics */}
            <section id="basics" className="scroll-mt-28 space-y-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Let’s start with the basics</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Give your trip a name and tell travelers where you're headed.</p>
              </div>

              <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-slate-200/60 space-y-5">
                
                <div className="w-full">
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Cover Image</label>
                    <div 
                      className={`relative w-full aspect-[16/9] sm:aspect-[21/9] rounded-2xl sm:rounded-[24px] border border-slate-200/80 overflow-hidden group bg-slate-50/50 flex flex-col items-center justify-center transition-all shadow-sm ${!file && autoCoverOptions.length === 0 ? "border-dashed hover:border-[#7C3AED]/40 hover:bg-[#7C3AED]/5 cursor-pointer" : ""}`}
                      onClick={() => !file && autoCoverOptions.length === 0 && fileInputRef.current?.click()}
                    >
                      {file && imagePreview ? (
                        <>
                          <img src={imagePreview} alt="User Cover" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-black/40 flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <div className="bg-white/10 backdrop-blur-md border border-white/20 px-4 py-1.5 rounded-full mb-3 flex items-center gap-2">
                              <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                              <span className="text-xs font-bold text-white tracking-wide uppercase">Your uploaded cover</span>
                            </div>
                            <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="bg-white text-slate-800 hover:bg-slate-100 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-transform hover:scale-105">
                              Change
                            </button>
                          </div>
                          {/* Always visible badge when not hovered */}
                          <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full flex items-center gap-2 group-hover:opacity-0 transition-opacity">
                            <span className="w-2 h-2 rounded-full bg-emerald-400 shadow-[0_0_8px_rgba(52,211,153,0.8)]"></span>
                            <span className="text-[10px] font-bold text-white tracking-wide uppercase">Your Cover</span>
                          </div>
                        </>
                      ) : autoCoverOptions.length > 0 ? (
                        <>
                          <img src={autoCoverOptions[selectedAutoCoverIndex]} alt="Auto Cover" className="w-full h-full object-cover" />
                          <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent flex flex-col items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                            <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="bg-white text-slate-800 hover:bg-slate-100 px-6 py-2.5 rounded-xl text-sm font-bold shadow-lg transition-transform hover:scale-105">
                              Upload your own
                            </button>
                          </div>
                          {/* Always visible badge when not hovered */}
                          <div className="absolute top-4 left-4 bg-white/10 backdrop-blur-md border border-white/20 px-3 py-1 rounded-full flex items-center gap-1.5 group-hover:opacity-0 transition-opacity">
                            <span className="text-sm leading-none">✨</span>
                            <span className="text-[10px] font-bold text-white tracking-wide uppercase">Auto Cover</span>
                          </div>
                        </>
                      ) : (
                        <div className="flex flex-col items-center justify-center p-6 text-center">
                           <div className="w-12 h-12 rounded-full bg-white shadow-sm border border-slate-100 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                              <Camera className="w-5 h-5 text-slate-400 group-hover:text-[#7C3AED]" />
                           </div>
                           <h3 className="text-sm font-bold text-slate-700 mb-1">Add a trip cover</h3>
                           <p className="text-xs text-slate-500 max-w-[260px] mb-5">
                             Upload your own photo or let Go YatriGo choose one for you.
                           </p>
                           <button type="button" onClick={(e) => { e.stopPropagation(); fileInputRef.current?.click(); }} className="bg-white border border-slate-200 text-slate-600 hover:text-slate-800 hover:border-slate-300 shadow-sm px-5 py-2 rounded-xl text-xs font-bold transition-all mb-3">
                             + Upload photo
                           </button>
                           <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wider">JPG / PNG · Max 5 MB</p>
                        </div>
                      )}
                      
                      <input type="file" ref={fileInputRef} onChange={handleImageChange} accept="image/*" className="hidden" />
                    </div>

                    {!file && autoCoverOptions.length > 1 && (
                      <div className="mt-4 overflow-x-auto no-scrollbar flex gap-2.5 pb-2 px-1">
                        {autoCoverOptions.map((url, idx) => (
                          <div 
                            key={idx} 
                            onClick={() => setSelectedAutoCoverIndex(idx)}
                            className={`flex-shrink-0 w-24 h-16 rounded-xl overflow-hidden cursor-pointer border-2 transition-all ${selectedAutoCoverIndex === idx ? "border-[#7C3AED] scale-105 shadow-md" : "border-transparent hover:border-slate-300 opacity-70 hover:opacity-100"}`}
                          >
                            <img src={url} alt={`Option ${idx + 1}`} className="w-full h-full object-cover" />
                          </div>
                        ))}
                      </div>
                    )}
                    
                  </div>

                  <div className="w-full">
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Trip Title</label>
                    <input
                      name="title"
                      value={formData.title}
                      onChange={handleInputChange}
                      placeholder="e.g. Weekend Escape to Manali"
                      className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-2xl px-5 py-4 text-[15px] font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-semibold outline-none transition-all"
                    />
                  </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Starting from</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        name="from"
                        value={formData.from}
                        onChange={handleInputChange}
                        placeholder="City or landmark"
                        className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-semibold outline-none transition-all"
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Going to</label>
                    <div className="relative">
                      <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                      <input
                        name="destination"
                        value={formData.destination}
                        onChange={handleInputChange}
                        placeholder="Where are you headed?"
                        className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-900 placeholder:text-slate-400 placeholder:font-semibold outline-none transition-all"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            {/* Step 2: Trip Plan */}
            <section id="plan" className="scroll-mt-28 space-y-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Plan the details</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">When are you going, and what will the experience be like?</p>
              </div>

              <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-slate-200/60 space-y-5">
                {/* Dates */}
                <div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Start date</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="date"
                          name="startDate"
                          value={formData.startDate}
                          min={todayStr}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all cursor-pointer"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">End date</label>
                      <div className="relative">
                        <Calendar className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400 pointer-events-none" />
                        <input
                          type="date"
                          name="endDate"
                          value={formData.endDate}
                          min={formData.startDate || todayStr}
                          onChange={handleInputChange}
                          className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-2xl pl-11 pr-4 py-3.5 text-sm font-bold text-slate-900 outline-none transition-all cursor-pointer"
                        />
                      </div>
                    </div>
                  </div>
                  <p className="text-[11px] font-extrabold text-purple-600 mt-3 inline-block px-3 py-1.5 rounded-lg bg-purple-50 border border-purple-100">
                    {getDurationString()}
                  </p>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-[15px] font-extrabold text-slate-900 mb-1">Tell travelers about the trip</label>
                  <p className="text-[13px] text-slate-500 font-medium mb-4">What will you do, where will you go, and what kind of travel buddies are you looking for?</p>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    rows="4"
                    placeholder="“Exploring waterfalls, local food and forts around…”"
                    className="w-full bg-slate-50/50 border border-slate-200 focus:bg-white focus:border-purple-500 focus:ring-4 focus:ring-purple-500/10 rounded-2xl px-5 py-4 text-[14px] font-medium text-slate-900 placeholder:text-slate-400 outline-none transition-all resize-none leading-relaxed"
                  />
                  <div className="flex justify-between items-center mt-2.5">
                    <p className="text-[11px] text-slate-400 font-bold">Tip: A clear itinerary helps you attract the right travel buddies.</p>
                    <span className={`text-[11px] font-bold ${(formData.description?.trim().length || 0) < 20 ? "text-rose-400" : "text-emerald-500"}`}>
                      {formData.description?.trim().length || 0}/500
                    </span>
                  </div>
                </div>

                {/* Vibe Tags */}
                <div>
                  <label className="block text-[15px] font-extrabold text-slate-900 mb-1">What’s the vibe?</label>
                  <p className="text-[13px] text-slate-500 font-medium mb-4">Pick up to 8 · Tip: Choose tags that describe the actual experience.</p>
                  <div className="flex flex-wrap gap-2.5">
                    {predefinedTags.map((tag) => {
                      const isSelected = formData.tags?.includes(tag);
                      return (
                        <button
                          key={tag}
                          type="button"
                          onClick={() => handleTagToggle(tag)}
                          className={`px-3 py-1.5 rounded-full text-[13px] font-bold transition-all border flex items-center gap-1.5 ${
                            isSelected
                              ? "bg-purple-100 text-purple-700 border-purple-200 shadow-[0_2px_8px_rgba(124,58,237,0.15)]"
                              : "bg-white text-slate-600 border-slate-200 hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50"
                          }`}
                        >
                          <span>{tagIcons[tag] || "🏷️"}</span> <span className="capitalize">{tag}</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            </section>

            {/* Step 3: Group & Rules */}
            <section id="rules" className="scroll-mt-28 space-y-3">
              <div>
                <h2 className="text-2xl font-extrabold text-slate-900 tracking-tight">Choose your crew</h2>
                <p className="text-sm text-slate-500 font-medium mt-1">Decide who can join and how they get in.</p>
              </div>

              <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-[0_2px_12px_rgb(0,0,0,0.03)] border border-slate-200/60 space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Group Size</label>
                    <div className="flex items-center gap-4">
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, maxMembers: Math.max(2, p.maxMembers - 1) }))}
                        className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600 font-bold transition-colors"
                      >
                        −
                      </button>
                      <div className="text-[15px] font-extrabold text-slate-900 w-24 text-center">{formData.maxMembers} travelers</div>
                      <button
                        type="button"
                        onClick={() => setFormData((p) => ({ ...p, maxMembers: Math.min(500, p.maxMembers + 1) }))}
                        className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-200 flex items-center justify-center hover:bg-slate-100 text-slate-600 font-bold transition-colors"
                      >
                        +
                      </button>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-2">Category</label>
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
                  <label className="block text-[11px] font-bold text-slate-500 uppercase tracking-wider mb-3">Joining Method</label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div
                      onClick={() => setFormData((p) => ({ ...p, isPrivate: false }))}
                      className={`p-5 rounded-[20px] border-2 transition-all cursor-pointer ${
                        !formData.isPrivate ? "border-purple-500 bg-purple-50/30 shadow-[0_4px_16px_rgba(124,58,237,0.06)]" : "border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <Globe className={`w-5 h-5 ${!formData.isPrivate ? "text-purple-600" : "text-slate-400"}`} />
                        <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center transition-colors ${!formData.isPrivate ? "bg-purple-500" : "border-2 border-slate-200"}`}>
                          {!formData.isPrivate && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </div>
                      </div>
                      <h3 className={`text-[15px] font-extrabold ${!formData.isPrivate ? "text-purple-900" : "text-slate-700"}`}>Open Group</h3>
                      <p className="text-[12px] font-semibold text-slate-500 mt-1 leading-relaxed">Anyone can join before the journey starts.</p>
                    </div>

                    <div
                      onClick={() => setFormData((p) => ({ ...p, isPrivate: true }))}
                      className={`p-5 rounded-[20px] border-2 transition-all cursor-pointer ${
                        formData.isPrivate ? "border-purple-500 bg-purple-50/30 shadow-[0_4px_16px_rgba(124,58,237,0.06)]" : "border-slate-200 bg-white hover:border-purple-200 hover:bg-slate-50/50"
                      }`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <ShieldCheck className={`w-5 h-5 ${formData.isPrivate ? "text-purple-600" : "text-slate-400"}`} />
                        <div className={`w-[22px] h-[22px] rounded-full flex items-center justify-center transition-colors ${formData.isPrivate ? "bg-purple-500" : "border-2 border-slate-200"}`}>
                          {formData.isPrivate && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                        </div>
                      </div>
                      <h3 className={`text-[15px] font-extrabold ${formData.isPrivate ? "text-purple-900" : "text-slate-700"}`}>Approval Required</h3>
                      <p className="text-[12px] font-semibold text-slate-500 mt-1 leading-relaxed">Travelers can request to join before the journey starts. You approve them.</p>
                    </div>
                  </div>

                  <div className="mt-4 flex items-start gap-2.5 p-3.5 rounded-xl bg-slate-50 border border-slate-200/70 text-slate-600">
                    <span className="text-sm shrink-0">🔒</span>
                    <p className="text-[12px] font-medium text-slate-600 leading-relaxed">
                      <strong className="font-semibold text-slate-800">Roster locks when the journey starts.</strong> No new travelers can join after that.
                    </p>
                  </div>
                </div>
              </div>
            </section>
          </div>

          {/* Right Column: Sticky Summary */}
          <div className="lg:col-span-4 lg:sticky lg:top-[100px] order-last">
            <div className="bg-white rounded-[24px] p-5 sm:p-6 shadow-[0_4px_24px_rgb(0,0,0,0.03)] border border-slate-200/60 flex flex-col h-full">
              <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-6">Your Trip</h3>
              
              <div className="space-y-4 mb-6 flex-1">
                <div className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-full bg-purple-50 flex items-center justify-center shrink-0">
                    <MapPin className="w-4 h-4 text-purple-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Destination</p>
                    <p className={`text-[15px] ${formData.destination?.trim() ? "text-slate-900 font-extrabold" : "text-slate-300 font-semibold"}`}>
                      {formData.destination?.trim() ? formData.destination : "Add destination"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <Calendar className="w-4 h-4 text-emerald-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Dates</p>
                    <p className={`text-[15px] ${formData.startDate && formData.endDate ? "text-slate-900 font-extrabold" : "text-slate-300 font-semibold"}`}>
                      {formData.startDate && formData.endDate ? `${moment(formData.startDate).format('MMM D')}–${moment(formData.endDate).format('MMM D')}` : "Add dates"}
                    </p>
                  </div>
                </div>

                <div className="flex gap-4 items-start">
                  <div className="w-9 h-9 rounded-full bg-brand-50 flex items-center justify-center shrink-0">
                    <Users className="w-4 h-4 text-brand-600" />
                  </div>
                  <div>
                    <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Group & Rules</p>
                    <p className="text-[15px] font-extrabold text-slate-900">Up to {formData.maxMembers} travelers</p>
                    <p className="text-[12px] font-bold text-slate-500 mt-0.5">{formData.category} · {!formData.isPrivate ? "Open Group" : "Approval Required"}</p>
                  </div>
                </div>
              </div>

              <div className="pt-6 border-t border-slate-100">
                <h4 className="text-[12px] font-extrabold text-slate-900 mb-3">Ready to launch?</h4>
                <ul className="space-y-2.5 text-[12px] font-bold">
                  <li className={`flex items-center gap-2.5 ${formData.title?.trim() ? "text-emerald-600" : "text-slate-400"}`}>
                    {formData.title?.trim() ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4 text-slate-300" />} Trip title
                  </li>
                  <li className={`flex items-center gap-2.5 ${formData.destination?.trim() ? "text-emerald-600" : "text-slate-400"}`}>
                    {formData.destination?.trim() ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4 text-slate-300" />} Destination
                  </li>
                  <li className={`flex items-center gap-2.5 ${formData.startDate && formData.endDate && formData.startDate <= formData.endDate ? "text-emerald-600" : "text-slate-400"}`}>
                    {formData.startDate && formData.endDate && formData.startDate <= formData.endDate ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4 text-slate-300" />} Dates
                  </li>
                  <li className={`flex items-center gap-2.5 ${(formData.description?.trim().length || 0) >= 20 ? "text-emerald-600" : "text-slate-400"}`}>
                    {(formData.description?.trim().length || 0) >= 20 ? <Check className="w-4 h-4" /> : <Circle className="w-4 h-4 text-slate-300" />} Itinerary
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </form>
      </main>
    </div>
  );
};

export default CreateBuddyTrip;