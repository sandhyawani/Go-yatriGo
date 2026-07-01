import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Compass,
  Calendar,
  MapPin,
  Users,
  X,
  Sparkles,
  Image as ImageIcon,
  ArrowRight,
  ArrowLeft,
  CheckCircle2,
} from "lucide-react";
import axiosInstance from "../../api/axios";
import MemberSelector from "./MemberSelector";

const CreateJourneyModal = ({
  isOpen,
  onClose,
  onCreated,
  sourceType = "manual",
  sourceId = null,
}) => {
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: Details, 2: Select Members, 3: Review
  const [formData, setFormData] = useState({
    title: "",
    destination: "",
    destinationType: "🏔️ Mountain / Station",
    startDate: "",
    endDate: "",
    privacy: "Private",
    journeyType: "Shared Journey",
    coverImage:
      "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1000&q=80",
    description: "",
  });
  const [invitedUserIds, setInvitedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coverCategory, setCoverCategory] = useState("🏔️ Mountains & Treks");

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split("T")[0];

  const allPresets = [
    // Mountains & Treks
    {
      category: "🏔️ Mountains & Treks",
      label: "Swiss Alps",
      url: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1000&q=80",
    },
    {
      category: "🏔️ Mountains & Treks",
      label: "Misty Peaks",
      url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80",
    },
    {
      category: "🏔️ Mountains & Treks",
      label: "Snow Ridge",
      url: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1000&q=80",
    },

    // Beach & Islands
    {
      category: "🏖️ Beach & Islands",
      label: "Santorini Sea",
      url: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1000&q=80",
    },
    {
      category: "🏖️ Beach & Islands",
      label: "Tropical Bali",
      url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80",
    },
    {
      category: "🏖️ Beach & Islands",
      label: "Crystal Cove",
      url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80",
    },

    // Road Trip & Highways
    {
      category: "🚗 Road Trip & Highways",
      label: "Pacific Route",
      url: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1000&q=80",
    },
    {
      category: "🚗 Road Trip & Highways",
      label: "Mountain Pass",
      url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1000&q=80",
    },
    {
      category: "🚗 Road Trip & Highways",
      label: "Valley Drive",
      url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1000&q=80",
    },

    // Camping & Nature
    {
      category: "⛺ Camping & Nature",
      label: "Aurora Nights",
      url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1000&q=80",
    },
    {
      category: "⛺ Camping & Nature",
      label: "Starlit Camp",
      url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1000&q=80",
    },
    {
      category: "⛺ Camping & Nature",
      label: "Forest Pines",
      url: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1000&q=80",
    },

    // Culture & Heritage
    {
      category: "🏛️ Culture & Heritage",
      label: "Kyoto Temple",
      url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1000&q=80",
    },
    {
      category: "🏛️ Culture & Heritage",
      label: "Sahara Dunes",
      url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80",
    },
    {
      category: "🏛️ Culture & Heritage",
      label: "Ancient Palaces",
      url: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1000&q=80",
    },

    // City & Luxury
    {
      category: "🏙️ City & Luxury",
      label: "Neon Skyline",
      url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1000&q=80",
    },
    {
      category: "🏙️ City & Luxury",
      label: "Luxury Resort",
      url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80",
    },
    {
      category: "🏙️ City & Luxury",
      label: "Evening Streets",
      url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1000&q=80",
    },
  ];

  const categories = [
    "🏔️ Mountains & Treks",
    "🏖️ Beach & Islands",
    "🚗 Road Trip & Highways",
    "⛺ Camping & Nature",
    "🏛️ Culture & Heritage",
    "🏙️ City & Luxury",
  ];
  const displayedPresets = allPresets.filter(
    (p) => p.category === coverCategory,
  );

  const getDurationDays = () => {
    if (!formData.startDate || !formData.endDate) return null;
    const s = new Date(formData.startDate);
    const e = new Date(formData.endDate);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? `${diff} Day${diff > 1 ? "s" : ""} Journey` : null;
  };

  const handleChange = (field, val) => {
    if (field === "startDate") {
      setFormData((prev) => ({
        ...prev,
        startDate: val,
        endDate: prev.endDate && prev.endDate < val ? val : prev.endDate,
      }));
      return;
    }
    if (field === "endDate") {
      setFormData((prev) => ({
        ...prev,
        endDate: prev.startDate && val < prev.startDate ? prev.startDate : val,
      }));
      return;
    }
    setFormData((prev) => ({ ...prev, [field]: val }));
  };

  const handleNextStep1 = (e) => {
    e.preventDefault();
    if (
      !formData.title ||
      !formData.destination ||
      !formData.startDate ||
      !formData.endDate
    ) {
      alert("Please fill in the title, destination, start date, and end date!");
      return;
    }
    if (formData.startDate < todayStr) {
      alert("Start date cannot be in the past!");
      return;
    }
    if (formData.endDate < formData.startDate) {
      alert("End date cannot be before start date!");
      return;
    }
    if (
      formData.journeyType === "Solo Journey" ||
      formData.journeyType === "Solo"
    ) {
      setStep(3);
    } else {
      setStep(2);
    }
  };

  const handleNextStep2 = () => {
    setStep(3);
  };

  const handleSubmit = async () => {
    setLoading(true);
    try {
      const payload = {
        ...formData,
        privacy: "Private",
        sourceType,
        sourceId,
        invitedUserIds:
          formData.journeyType === "Solo Journey" ? [] : invitedUserIds,
      };
      const res = await axiosInstance.post("/journeys", payload);
      if (res.data?.success) {
        const newJ = res.data.journey;
        if (onCreated) onCreated(newJ);
        setStep(1);
        setInvitedUserIds([]);
        onClose();
        navigate(`/social/journeys/${newJ._id}?welcome=true`);
      }
    } catch (err) {
      console.error("Error creating journey:", err);
      alert(err.response?.data?.message || "Failed to create journey");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full sm:max-w-xl bg-white dark:bg-slate-900 sm:rounded-3xl rounded-t-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[95dvh] sm:max-h-[92vh]">
        {/* Header */}
        <div className="bg-white dark:bg-slate-900 px-4 py-4 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#6C4DF6] rounded-xl shadow-md shadow-[#6C4DF6]/20">
              <Compass className="w-5 h-5 text-white animate-spin-slow" />
            </div>
            <div>
              <h2 className="text-sm font-extrabold flex items-center gap-1.5">
                Launch Journey <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </h2>
              <p className="text-[11px] text-slate-500">
                {step === 1 && "Step 1: Define your getaway"}
                {step === 2 && "Step 2: Invite your squad"}
                {step === 3 && "Step 3: Review & launch"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Indicators */}
        <div className="flex items-center px-6 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 select-none">
          <div
            className={`flex items-center gap-1.5 text-xs font-bold ${step >= 1 ? "text-[#6C4DF6]" : "text-slate-400"}`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? "bg-[#6C4DF6] text-white" : "bg-slate-200 text-slate-600"}`}
            >
              1
            </span>
            <span>Details</span>
          </div>
          <div
            className={`flex-1 h-0.5 mx-3 rounded-full ${step >= 2 ? "bg-[#6C4DF6]" : "bg-slate-200 dark:bg-slate-800"}`}
          />
          <div
            className={`flex items-center gap-1.5 text-xs font-bold ${step >= 2 ? "text-[#6C4DF6]" : "text-slate-400"}`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? "bg-[#6C4DF6] text-white" : "bg-slate-200 text-slate-600"}`}
            >
              2
            </span>
            <span>Squad</span>
          </div>
          <div
            className={`flex-1 h-0.5 mx-3 rounded-full ${step >= 3 ? "bg-[#6C4DF6]" : "bg-slate-200 dark:bg-slate-800"}`}
          />
          <div
            className={`flex items-center gap-1.5 text-xs font-bold ${step >= 3 ? "text-[#6C4DF6]" : "text-slate-400"}`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? "bg-[#6C4DF6] text-white" : "bg-slate-200 text-slate-600"}`}
            >
              3
            </span>
            <span>Review</span>
          </div>
        </div>

        {/* Modal Body */}
        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar space-y-5">
          {/* Journey details */}
          {step === 1 && (
            <form
              id="step1Form"
              onSubmit={handleNextStep1}
              className="space-y-4"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Journey Title *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) => handleChange("title", e.target.value)}
                    placeholder="e.g. Summer EuroTrip 2026..."
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm font-semibold outline-none focus:border-[#6C4DF6] transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Journey Type *
                  </label>
                  <select
                    value={formData.journeyType}
                    onChange={(e) =>
                      handleChange("journeyType", e.target.value)
                    }
                    className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm font-semibold outline-none focus:border-[#6C4DF6] transition-colors cursor-pointer"
                  >
                    <option value="Shared Journey">👥 Shared Journey</option>
                    <option value="Solo Journey">👤 Solo Journey</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Destination *
                  </label>
                  <div className="relative">
                    <MapPin className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      value={formData.destination}
                      onChange={(e) =>
                        handleChange("destination", e.target.value)
                      }
                      placeholder="Where are you heading?"
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm font-semibold outline-none focus:border-[#6C4DF6] transition-colors"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Destination Type
                  </label>
                  <div className="relative">
                    <Compass className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5 pointer-events-none" />
                    <select
                      value={formData.destinationType}
                      onChange={(e) =>
                        handleChange("destinationType", e.target.value)
                      }
                      className="w-full pl-10 pr-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm font-semibold outline-none focus:border-[#6C4DF6] transition-colors cursor-pointer appearance-none"
                    >
                      <option value="🏔️ Mountain / Station">🏔️ Mountain / Station</option>
                      <option value="🏖️ Beach / Coastal">🏖️ Beach / Coastal</option>
                      <option value="🏙️ City / Metropolitan">🏙️ City / Metropolitan</option>
                      <option value="🌿 Wildlife / Nature">🌿 Wildlife / Nature</option>
                      <option value="🏛️ Heritage / Historical">🏛️ Heritage / Historical</option>
                      <option value="🏜️ Desert / Dunes">🏜️ Desert / Dunes</option>
                      <option value="🏞️ Countryside / Rural">🏞️ Countryside / Rural</option>
                      <option value="⛺ Adventure Camp">⛺ Adventure Camp</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    Start Date
                  </label>
                  <input
                    type="date"
                    required
                    min={todayStr}
                    value={formData.startDate}
                    onChange={(e) => handleChange("startDate", e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-[#6C4DF6]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                    End Date
                  </label>
                  <input
                    type="date"
                    required
                    min={formData.startDate || todayStr}
                    value={formData.endDate}
                    onChange={(e) => handleChange("endDate", e.target.value)}
                    className="w-full px-3 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-[#6C4DF6]"
                  />
                </div>
              </div>

              {getDurationDays() && (
                <div className="bg-purple-50 dark:bg-purple-950/30 p-3 rounded-2xl border border-purple-200 dark:border-purple-800/50 flex items-center gap-2 text-purple-800 dark:text-purple-300 animate-fade-in">
                  <Calendar className="w-4 h-4 text-[#6C4DF6] shrink-0" />
                  <div>
                    <span className="text-[10px] font-extrabold uppercase block text-purple-500">
                      Estimated Duration
                    </span>
                    <span className="text-xs font-black">
                      {getDurationDays()}
                    </span>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-black text-slate-800 dark:text-slate-200 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <ImageIcon className="w-4 h-4 text-[#6C4DF6]" /> Choose Trip
                  Style Cover
                </label>

                {/* Category Pills */}
                <div className="flex items-center gap-1.5 overflow-x-auto pb-2 no-scrollbar mb-2">
                  {categories.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setCoverCategory(cat)}
                      className={`px-2.5 py-1 rounded-xl text-[11px] font-extrabold whitespace-nowrap transition-all ${
                        coverCategory === cat
                          ? "bg-[#6C4DF6] text-white shadow-sm shadow-[#6C4DF6]/20 scale-105"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200 dark:hover:bg-slate-700"
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>

                {/* Cover Grid */}
                <div className="grid grid-cols-3 gap-2.5 mb-2">
                  {displayedPresets.map((p) => {
                    const isSelected = formData.coverImage === p.url;
                    return (
                      <button
                        key={p.label}
                        type="button"
                        onClick={() => handleChange("coverImage", p.url)}
                        className={`relative h-16 rounded-2xl overflow-hidden border-2 transition-all group ${
                          isSelected
                            ? "border-[#6C4DF6] ring-2 ring-[#6C4DF6]/30 shadow-md scale-[0.98]"
                            : "border-transparent opacity-85 hover:opacity-100 hover:scale-[1.02]"
                        }`}
                      >
                        <img
                          src={p.url}
                          alt={p.label}
                          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-slate-950/30 to-transparent flex items-end p-2">
                          <span className="text-[11px] font-black text-white leading-tight truncate w-full text-left">
                            {p.label}
                          </span>
                        </div>
                        {isSelected && (
                          <div className="absolute top-1.5 right-1.5 w-5 h-5 rounded-full bg-[#6C4DF6] text-white flex items-center justify-center shadow-sm">
                            <CheckCircle2 className="w-3.5 h-3.5 stroke-[3]" />
                          </div>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                  Notes & Goals
                </label>
                <textarea
                  rows="3"
                  value={formData.description}
                  onChange={(e) => handleChange("description", e.target.value)}
                  placeholder="What is this getaway all about? Add fun goals or squad vibes..."
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-[#6C4DF6]"
                />
              </div>
            </form>
          )}

          {/* Members */}
          {step === 2 && (
            <div>
              <div className="mb-4 bg-purple-50 dark:bg-purple-950/40 p-4 rounded-2xl border border-purple-200 dark:border-purple-800/60 flex items-start gap-3">
                <Users className="w-5 h-5 text-[#6C4DF6] shrink-0 mt-0.5" />
                <div className="text-xs">
                  <strong className="text-slate-800 dark:text-slate-200 font-bold block">
                    Invite Your Squad
                  </strong>
                  <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                    Choose the people who will collaborate in this journey.
                    Invitations are delivered through Notifications.
                  </span>
                </div>
              </div>

              <MemberSelector
                selectedIds={invitedUserIds}
                onChange={setInvitedUserIds}
              />
            </div>
          )}

          {/* Review */}
          {step === 3 && (
            <div className="space-y-6 animate-fade-in">
              {/* Summary */}
              <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
                <div className="relative h-44">
                  <img
                    src={formData.coverImage}
                    alt="Cover"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-5 text-white">
                    <div className="flex items-center gap-2 mb-1.5">
                      <span className="text-[10px] font-extrabold bg-[#6C4DF6] px-2.5 py-1 rounded-lg self-start uppercase tracking-wider shadow-sm">
                        {formData.journeyType}
                      </span>
                      {formData.destinationType && (
                        <span className="text-[10px] font-extrabold bg-white/20 backdrop-blur-md px-2.5 py-1 rounded-lg self-start tracking-wider shadow-sm">
                          {formData.destinationType}
                        </span>
                      )}
                    </div>
                    <h3 className="text-2xl font-black tracking-tight">
                      {formData.title}
                    </h3>
                    <p className="text-xs text-slate-200 flex items-center gap-1.5 mt-1 font-semibold">
                      <MapPin className="w-3.5 h-3.5 text-rose-400" />{" "}
                      {formData.destination}
                    </p>
                  </div>
                </div>

                <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 text-xs">
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Duration
                    </span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 block">
                      {getDurationDays() || "N/A"}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Organizer
                    </span>
                    <span className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 block">
                      You
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Invited Squad
                    </span>
                    <span className="font-extrabold text-[#6C4DF6] mt-0.5 block">
                      {formData.journeyType === "Solo Journey"
                        ? "Solo (0 Invited)"
                        : `${invitedUserIds.length} Buddies`}
                    </span>
                  </div>
                  <div>
                    <span className="text-[10px] font-bold text-slate-400 uppercase block">
                      Initial Status
                    </span>
                    <span className="font-extrabold text-amber-500 mt-0.5 block">
                      ⏳ Upcoming
                    </span>
                  </div>
                </div>
              </div>

              {/* Journey Lifecycle Preview */}
              <div className="bg-slate-50 dark:bg-slate-950 p-4 rounded-2xl border border-slate-200/80 dark:border-slate-800">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider block mb-3 text-center">
                  Journey Lifecycle Preview
                </span>
                <div className="flex flex-wrap items-center justify-center gap-1.5 sm:gap-2 text-[11px] font-bold text-slate-700 dark:text-slate-300">
                  <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-lg border border-amber-500/20">
                    ⏳ Upcoming
                  </span>
                  <span className="text-slate-400">➔</span>
                  <span className="px-2.5 py-1 bg-purple-500/10 text-purple-600 dark:text-purple-400 rounded-lg border border-purple-500/20">
                    📋 Planning
                  </span>
                  <span className="text-slate-400">➔</span>
                  <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 rounded-lg border border-emerald-500/20">
                    🚀 Ongoing
                  </span>
                  <span className="text-slate-400">➔</span>
                  <span className="px-2.5 py-1 bg-violet-500/10 text-violet-600 dark:text-violet-400 rounded-lg border border-violet-500/20">
                    ✅ Completed
                  </span>
                  <span className="text-slate-400">➔</span>
                  <span className="px-2.5 py-1 bg-rose-500/10 text-rose-600 dark:text-rose-400 rounded-lg border border-rose-500/20">
                    🏆 Scrapbook
                  </span>
                </div>
              </div>

              {/* Information Panel Box */}
              <div className="bg-purple-50/70 dark:bg-purple-950/40 p-5 rounded-3xl border border-purple-200/80 dark:border-purple-800/60 space-y-3">
                <h4 className="text-xs font-black text-purple-900 dark:text-purple-200 uppercase tracking-wider flex items-center gap-1.5">
                  <Sparkles className="w-4 h-4 text-[#6C4DF6]" /> Creating this
                  Headquarters will:
                </h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 text-xs text-purple-900 dark:text-purple-200 font-medium">
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#6C4DF6] shrink-0" />{" "}
                    Journey Headquarters created
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#6C4DF6] shrink-0" />{" "}
                    Dedicated Squad Chat created
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#6C4DF6] shrink-0" />{" "}
                    Invitations delivered
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#6C4DF6] shrink-0" />{" "}
                    Collaborative Workspace enabled
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#6C4DF6] shrink-0" />{" "}
                    Timeline activated
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#6C4DF6] shrink-0" />{" "}
                    Media Gallery ready
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#6C4DF6] shrink-0" />{" "}
                    Safety Check-ins enabled
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#6C4DF6] shrink-0" />{" "}
                    SOS activated
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle2 className="w-4 h-4 text-[#6C4DF6] shrink-0" />{" "}
                    Scrapbook prepared
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-3 bg-slate-50 dark:bg-slate-950">
          {step > 1 ? (
            <button
              type="button"
              onClick={() =>
                setStep(
                  formData.journeyType === "Solo Journey" ||
                    formData.journeyType === "Solo"
                    ? 1
                    : step - 1,
                )
              }
              className="flex items-center gap-1 px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-4 h-4" /> Back
            </button>
          ) : (
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-3 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              Cancel
            </button>
          )}

          {step === 1 && (
            <button
              form="step1Form"
              type="submit"
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-6 py-3 rounded-2xl bg-[#6C4DF6] hover:bg-[#5b3ee0] text-white text-xs font-bold shadow-lg shadow-[#6C4DF6]/30 transition-all active:scale-95"
            >
              {formData.journeyType === "Solo Journey"
                ? "Next: Review"
                : "Next: Invite Squad"}{" "}
              <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 2 && (
            <button
              type="button"
              onClick={handleNextStep2}
              className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-6 py-3 rounded-2xl bg-[#6C4DF6] hover:bg-[#5b3ee0] text-white text-xs font-bold shadow-lg shadow-[#6C4DF6]/30 transition-all active:scale-95"
            >
              Next: Review <ArrowRight className="w-4 h-4" />
            </button>
          )}

          {step === 3 && (
            <button
              type="button"
              onClick={handleSubmit}
              disabled={loading}
              className="flex-1 flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-[#6C4DF6] hover:bg-[#5b3ee0] text-white text-xs font-black shadow-xl shadow-[#6C4DF6]/40 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap"
            >
              {loading ? "Launching..." : "🚀 Launch Journey"}
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CreateJourneyModal;
