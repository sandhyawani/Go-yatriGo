import React, { useState, useEffect } from "react";
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
Link2,
Check } from
"lucide-react";
import axiosInstance from "../../api/axios";
import MemberSelector from "./MemberSelector";
import CustomSelect from "../ui/CustomSelect";


const DEFAULT_COVER =
"https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1000&q=80";

const CreateJourneyModal = ({
  isOpen,
  onClose,
  onCreated,
  sourceType = "manual",
  sourceId = null
}) => {
  const navigate = useNavigate();
  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open-hide-nav");
    } else {
      document.body.classList.remove("modal-open-hide-nav");
    }
    return () => {
      document.body.classList.remove("modal-open-hide-nav");
    };
  }, [isOpen]);
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    title: "",
    from: "",
    destination: "",
    startDate: "",
    endDate: "",
    privacy: "Private",
    journeyType: "Connections",
    coverImage:
    "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1000&q=80",
    description: ""
  });
  const [invitedUserIds, setInvitedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [coverCategory, setCoverCategory] = useState("🏔️ Mountains & Treks");
  const [createdJourney, setCreatedJourney] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split("T")[0];

  const allPresets = [

  {
    category: "🏔️ Mountains & Treks",
    label: "Swiss Alps",
    url: "https://images.unsplash.com/photo-1530122037265-a5f1f91d3b99?auto=format&fit=crop&w=1000&q=80"
  },
  {
    category: "🏔️ Mountains & Treks",
    label: "Misty Peaks",
    url: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?auto=format&fit=crop&w=1000&q=80"
  },
  {
    category: "🏔️ Mountains & Treks",
    label: "Snow Ridge",
    url: "https://images.unsplash.com/photo-1486870591958-9b9d0d1dda99?auto=format&fit=crop&w=1000&q=80"
  },


  {
    category: "🏖️ Beach & Islands",
    label: "Santorini Sea",
    url: "https://images.unsplash.com/photo-1570077188670-e3a8d69ac5ff?auto=format&fit=crop&w=1000&q=80"
  },
  {
    category: "🏖️ Beach & Islands",
    label: "Tropical Bali",
    url: "https://images.unsplash.com/photo-1537996194471-e657df975ab4?auto=format&fit=crop&w=1000&q=80"
  },
  {
    category: "🏖️ Beach & Islands",
    label: "Crystal Cove",
    url: "https://images.unsplash.com/photo-1507525428034-b723cf961d3e?auto=format&fit=crop&w=1000&q=80"
  },


  {
    category: "🚗 Road Trip & Highways",
    label: "Pacific Route",
    url: "https://images.unsplash.com/photo-1502877338535-766e1452684a?auto=format&fit=crop&w=1000&q=80"
  },
  {
    category: "🚗 Road Trip & Highways",
    label: "Mountain Pass",
    url: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=1000&q=80"
  },
  {
    category: "🚗 Road Trip & Highways",
    label: "Valley Drive",
    url: "https://images.unsplash.com/photo-1449965408869-eaa3f722e40d?auto=format&fit=crop&w=1000&q=80"
  },


  {
    category: "⛺ Camping & Nature",
    label: "Aurora Nights",
    url: "https://images.unsplash.com/photo-1531366936337-7c912a4589a7?auto=format&fit=crop&w=1000&q=80"
  },
  {
    category: "⛺ Camping & Nature",
    label: "Starlit Camp",
    url: "https://images.unsplash.com/photo-1504280390367-361c6d9f38f4?auto=format&fit=crop&w=1000&q=80"
  },
  {
    category: "⛺ Camping & Nature",
    label: "Forest Pines",
    url: "https://images.unsplash.com/photo-1510312305653-8ed496efae75?auto=format&fit=crop&w=1000&q=80"
  },


  {
    category: "🏛️ Culture & Heritage",
    label: "Kyoto Temple",
    url: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?auto=format&fit=crop&w=1000&q=80"
  },
  {
    category: "🏛️ Culture & Heritage",
    label: "Sahara Dunes",
    url: "https://images.unsplash.com/photo-1509316975850-ff9c5deb0cd9?auto=format&fit=crop&w=1000&q=80"
  },
  {
    category: "🏛️ Culture & Heritage",
    label: "Ancient Palaces",
    url: "https://images.unsplash.com/photo-1548013146-72479768bada?auto=format&fit=crop&w=1000&q=80"
  },


  {
    category: "🏙️ City & Luxury",
    label: "Neon Skyline",
    url: "https://images.unsplash.com/photo-1514565131-fce0801e5785?auto=format&fit=crop&w=1000&q=80"
  },
  {
    category: "🏙️ City & Luxury",
    label: "Luxury Resort",
    url: "https://images.unsplash.com/photo-1566073771259-6a8506099945?auto=format&fit=crop&w=1000&q=80"
  },
  {
    category: "🏙️ City & Luxury",
    label: "Evening Streets",
    url: "https://images.unsplash.com/photo-1508739773434-c26b3d09e071?auto=format&fit=crop&w=1000&q=80"
  }];


  const categories = [
  "🏔️ Mountains & Treks",
  "🏖️ Beach & Islands",
  "🚗 Road Trip & Highways",
  "⛺ Camping & Nature",
  "🏛️ Culture & Heritage",
  "🏙️ City & Luxury"];

  const displayedPresets = allPresets.filter(
  (p) => p.category === coverCategory
  );

  const getDurationDays = () => {
    if (!formData.startDate || !formData.endDate) return null;
    const s = new Date(formData.startDate);
    const e = new Date(formData.endDate);
    const diff = Math.ceil((e - s) / (1000 * 60 * 60 * 24)) + 1;
    return diff > 0 ? `${diff} Day${diff > 1 ? "s" : ""}` : null;
  };

  const handleCopyPrivateLink = () => {
    if (!createdJourney?._id) return;
    const inviteUrl = `${window.location.origin}/social/journeys/${createdJourney._id}?inviteCode=${createdJourney._id}`;
    navigator.clipboard.writeText(inviteUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
  };

  const handleCloseModal = () => {
    setCreatedJourney(null);
    setStep(1);
    setInvitedUserIds([]);
    onClose();
  };

  const handleChange = (field, val) => {
    if (field === "startDate") {
      setFormData((prev) => ({
        ...prev,
        startDate: val,
        endDate: prev.endDate && prev.endDate < val ? val : prev.endDate
      }));
      return;
    }
    if (field === "endDate") {
      setFormData((prev) => ({
        ...prev,
        endDate: prev.startDate && val < prev.startDate ? prev.startDate : val
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
    !formData.endDate)
    {
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
    formData.journeyType === "Solo" ||
    formData.journeyType === "Solo Expedition")
    {
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
        coverImage: formData.coverImage?.trim() || DEFAULT_COVER,
        sourceType,
        sourceId,
        journeyType: formData.journeyType === "Connections" ? "Friends" : formData.journeyType,
        invitedUserIds:
        formData.journeyType === "Solo Journey" || formData.journeyType === "Solo" || formData.journeyType === "Solo Expedition" ? [] : invitedUserIds
      };
      const res = await axiosInstance.post("/journeys", payload);
      if (res.data?.success) {
        const newJ = res.data.journey;
        setCreatedJourney(newJ);
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
        {}
        <div className="bg-white dark:bg-slate-900 px-4 py-4 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-[#7C3AED] rounded-xl shadow-md shadow-[#7C3AED]/20">
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
          className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 transition-colors">

            <X className="w-5 h-5" />
          </button>
        </div>

        {}
        <div className="flex items-center px-6 py-3 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 select-none">
          <div
          className={`flex items-center gap-1.5 text-xs font-bold ${step >= 1 ? "text-[#7C3AED]" : "text-slate-400"}`}>

            <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 1 ? "bg-[#7C3AED] text-white" : "bg-slate-200 text-slate-600"}`}>

              1
            </span>
            <span>Details</span>
          </div>
          <div
          className={`flex-1 h-0.5 mx-3 rounded-full ${step >= 2 ? "bg-[#7C3AED]" : "bg-slate-200 dark:bg-slate-800"}`} />

          <div
          className={`flex items-center gap-1.5 text-xs font-bold ${step >= 2 ? "text-[#7C3AED]" : "text-slate-400"}`}>

            <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 2 ? "bg-[#7C3AED] text-white" : "bg-slate-200 text-slate-600"}`}>

              2
            </span>
            <span>Travel Group</span>
          </div>
          <div
          className={`flex-1 h-0.5 mx-3 rounded-full ${step >= 3 ? "bg-[#7C3AED]" : "bg-slate-200 dark:bg-slate-800"}`} />

          <div
          className={`flex items-center gap-1.5 text-xs font-bold ${step >= 3 ? "text-[#7C3AED]" : "text-slate-400"}`}>

            <span
            className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${step >= 3 ? "bg-[#7C3AED] text-white" : "bg-slate-200 text-slate-600"}`}>

              3
            </span>
            <span>Review</span>
          </div>
        </div>


        <div className="p-4 sm:p-6 overflow-y-auto flex-1 custom-scrollbar">
          {createdJourney ?

          <div className="py-6 px-4 text-center space-y-6 animate-fade-in">
              <div className="w-16 h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-3xl mx-auto border border-emerald-500/20 shadow-xs">
                🎉
              </div>
              <div>
                <h2 className="text-xl font-black text-slate-900 dark:text-white">
                  Journey Created!
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  {invitedUserIds.length > 0 ?
                `Invitations sent to ${invitedUserIds.length} ${invitedUserIds.length === 1 ? "person" : "people"}.` :
                "Your journey has been launched successfully."}
                </p>
              </div>

              <div className="space-y-3 pt-2 max-w-sm mx-auto">
                <button
              type="button"
              onClick={handleCopyPrivateLink}
              className={`w-full py-3 px-4 rounded-2xl text-xs font-black transition-all border flex items-center justify-center gap-2 ${
              linkCopied ?
              "bg-emerald-500 text-white border-emerald-500 shadow-xs" :
              "bg-white dark:bg-slate-900 text-[#7C3AED] hover:bg-brand-50 border-brand-200 dark:border-brand-800 shadow-2xs active:scale-95"
              }`}>

                  {linkCopied ?
                <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Private Link Copied!</span>
                    </> :

                <>
                      <Link2 className="w-4 h-4 text-[#7C3AED]" />
                      <span>Copy Private Invite Link</span>
                    </>}

                </button>

                <button
              type="button"
              onClick={() => {
                const j = createdJourney;
                if (onCreated) onCreated(j);
                handleCloseModal();
                navigate(`/social/journeys/${j._id}?welcome=true`);
              }}
              className="w-full py-3.5 px-4 rounded-2xl bg-[#7C3AED] hover:bg-[#7c3aed] text-white text-xs font-extrabold shadow-lg shadow-[#7C3AED]/30 transition-all active:scale-95 flex items-center justify-center gap-2">

                  <span>Open Journey</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div> :

          <>
              {}
              {step === 1 &&
            <form id="step1Form" onSubmit={handleNextStep1} className="space-y-5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Journey Title *
                    </label>
                    <input
                type="text"
                required
                value={formData.title}
                onChange={(e) => handleChange("title", e.target.value)}
                placeholder="e.g. Ratnagiri Beach Getaway, Leh Expedition"
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-[#7C3AED]" />

                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Starting From (Optional)
                      </label>
                      <input
                  type="text"
                  value={formData.from}
                  onChange={(e) => handleChange("from", e.target.value)}
                  placeholder="e.g. Pune, Mumbai"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-[#7C3AED]" />

                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Destination *
                      </label>
                      <input
                  type="text"
                  required
                  value={formData.destination}
                  onChange={(e) => handleChange("destination", e.target.value)}
                  placeholder="e.g. Ganpatipule, Kokan Beach"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-[#7C3AED]" />

                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Start Date *
                      </label>
                      <input
                  type="date"
                  required
                  min={todayStr}
                  value={formData.startDate}
                  onChange={(e) => handleChange("startDate", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-[#7C3AED]" />

                    </div>
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        End Date *
                      </label>
                      <input
                  type="date"
                  required
                  min={formData.startDate || todayStr}
                  value={formData.endDate}
                  onChange={(e) => handleChange("endDate", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-[#7C3AED]" />

                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Journey Type
                      </label>
                      <CustomSelect
                  value={formData.journeyType}
                  onChange={(e) => handleChange("journeyType", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-[#7C3AED]"
                  options={[
                    { label: "👥 Journey with Trip Mates", value: "Connections" },
                    { label: "👤 Solo Expedition", value: "Solo" }
                  ]}
                />
                    </div>

                    <div>
                      <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Journey Visibility
                      </label>
                      <CustomSelect
                  value={formData.privacy}
                  onChange={(e) => handleChange("privacy", e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-[#7C3AED]"
                  options={[
                    { label: "🔒 Private Journey", value: "Private" },
                    { label: "🌍 Public Explorer", value: "Public" }
                  ]}
                />
                      <p className="mt-2 text-[11px] text-slate-500 font-medium">
                        {formData.privacy === "Public" ?
                    <span><strong>Public:</strong> Your journey can be discovered by other explorers in Explore.</span> :
                    <span><strong>Private:</strong> Only invited members can view this journey.</span>}
                      </p>
                    </div>
                  </div>

                  {}
                  <div>
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-2">
                      Cover Image Gallery
                    </label>
                    <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-none">
                      {[
                  "🏔️ Mountains & Treks",
                  "🏖️ Beach & Islands",
                  "🚗 Road Trip & Highways",
                  "⛺ Camping & Nature",
                  "🏛️ Culture & Heritage",
                  "🏙️ City & Luxury"].
                  map((cat) =>
                  <button
                  key={cat}
                  type="button"
                  onClick={() => setCoverCategory(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all ${
                  coverCategory === cat ?
                  "bg-[#7C3AED] text-white shadow-sm" :
                  "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
                  }`}>

                          {cat}
                        </button>
                  )}
                    </div>

                    <div className="grid grid-cols-3 gap-2.5 mt-2">
                      {displayedPresets.map((preset, idx) => {
                    const isSelected = formData.coverImage === preset.url;
                    return (
                      <button
                      key={idx}
                      type="button"
                      onClick={() => handleChange("coverImage", preset.url)}
                      className={`relative h-20 rounded-2xl overflow-hidden border-2 transition-all group ${
                      isSelected ?
                      "border-[#7C3AED] ring-2 ring-[#7C3AED]/30 shadow-md scale-[1.02]" :
                      "border-slate-200 dark:border-slate-800 opacity-75 hover:opacity-100"
                      }`}>

                            <img
                        src={preset.url}
                        alt={preset.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform" />

                            <div className="absolute inset-0 bg-slate-950/30 flex items-end p-1.5">
                              <span className="text-[10px] font-bold text-white truncate">
                                {preset.label}
                              </span>
                            </div>
                            {isSelected &&
                        <div className="absolute top-1 right-1 w-5 h-5 rounded-full bg-[#7C3AED] text-white flex items-center justify-center shadow-sm">
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              </div>}

                          </button>);

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
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-sm outline-none focus:border-[#7C3AED]" />

                  </div>
                </form>}


              {}
              {step === 2 &&
            <div>
                  <div className="mb-4 bg-brand-50 dark:bg-brand-900/40 p-4 rounded-2xl border border-brand-200 dark:border-brand-800/60 flex items-start gap-3">
                    <Users className="w-5 h-5 text-[#7C3AED] shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="text-slate-800 dark:text-slate-200 font-bold block">
                        Invite Your Squad
                      </strong>
                      <span className="text-slate-600 dark:text-slate-400 text-[11px]">
                        Choose who you'd like to travel with. Invitations will be sent when you launch the journey.
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between px-1 mb-2">
                    <span className="text-xs font-black text-slate-700 dark:text-slate-200">
                      {invitedUserIds.length > 0 ?
                  `${invitedUserIds.length} ${invitedUserIds.length === 1 ? "person" : "people"} selected` :
                  "No one selected (you can invite people later)"}
                    </span>
                  </div>

                  <MemberSelector
              selectedIds={invitedUserIds}
              onChange={setInvitedUserIds} />

                </div>}


              {}
              {step === 3 &&
            <div className="space-y-6 animate-fade-in">
                  {}
                  <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-md">
                    <div className="relative h-44">
                      <img
                  src={formData.coverImage}
                  alt="Cover"
                  className="w-full h-full object-cover" />

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-5 text-white">
                        <div className="flex items-center gap-2 mb-1.5">
                          <span className="text-[10px] font-extrabold bg-[#7C3AED] px-2.5 py-1 rounded-lg self-start uppercase tracking-wider shadow-sm">
                            {formData.journeyType === "Solo Expedition" || formData.journeyType === "Solo" || formData.journeyType === "Solo Journey" ?
                        "SOLO TRIP" :
                        "TRIP MATES"}
                          </span>
                        </div>
                        <h3 className="text-2xl font-black tracking-tight">
                          {formData.title}
                        </h3>
                        <p className="text-xs text-slate-200 flex items-center gap-1.5 mt-1 font-semibold">
                          <MapPin className="w-3.5 h-3.5 text-rose-400" />{" "}
                          {formData.from ? `${formData.from} ` : ""}
                          {formData.from && <span className="opacity-60">→</span>}
                          {` ${formData.destination}`}
                        </p>
                      </div>
                    </div>

                    <div className="p-4 grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Duration
                        </span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 block">
                          {getDurationDays() || "3 Days"}
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
                          Invited
                        </span>
                        <span className="font-extrabold text-[#7C3AED] mt-0.5 block">
                          {invitedUserIds.length > 0 ?
                      `${invitedUserIds.length} ${invitedUserIds.length === 1 ? "person" : "people"}` :
                      "No one yet"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[10px] font-bold text-slate-400 uppercase block">
                          Status
                        </span>
                        <span className="font-extrabold text-amber-500 mt-0.5 block">
                          ⏳ Upcoming
                        </span>
                      </div>
                    </div>
                  </div>

                  {}
                  <div className="bg-brand-50/70 dark:bg-brand-950/40 p-5 rounded-3xl border border-brand-200/80 dark:border-brand-900/60 space-y-3">
                    <h4 className="text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-4 h-4 text-[#7C3AED]" /> Ready to launch?
                    </h4>
                    <div className="space-y-2 text-xs text-slate-700 dark:text-slate-300 font-semibold">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>Trip details added</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>
                          {invitedUserIds.length > 0 ?
                      `${invitedUserIds.length} ${invitedUserIds.length === 1 ? "person" : "people"} selected to receive invitations` :
                      "Solo trip configured (no invitations will be sent)"}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-4 h-4 text-emerald-500 shrink-0" />
                        <span>You can invite more people or share a private link anytime later</span>
                      </div>
                    </div>
                  </div>
                </div>}

            </>}

        </div>

        {}
        {!createdJourney &&
        <div className="px-4 py-3 border-t border-slate-100 dark:border-slate-800 flex justify-between gap-3 bg-slate-50 dark:bg-slate-950">
            {step > 1 ?
          <button
          type="button"
          onClick={() =>
          setStep(
          formData.journeyType === "Solo Expedition" ||
          formData.journeyType === "Solo" ||
          formData.journeyType === "Solo Journey" ?
          1 :
          step - 1
          )}

          className="flex items-center gap-1 px-4 py-3 rounded-2xl text-xs font-bold text-slate-600 hover:bg-slate-200 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors">

                <ArrowLeft className="w-4 h-4" /> Back
              </button> :

          <button
          type="button"
          onClick={onClose}
          className="px-4 py-3 rounded-2xl text-xs font-bold text-slate-500 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors">

                Cancel
              </button>}


            {step === 1 &&
          <button
          form="step1Form"
          type="submit"
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-6 py-3 rounded-2xl bg-[#7C3AED] hover:bg-[#7c3aed] text-white text-xs font-bold shadow-lg shadow-[#7C3AED]/30 transition-all active:scale-95">

                {formData.journeyType === "Solo Expedition" || formData.journeyType === "Solo" || formData.journeyType === "Solo Journey" ?
            "Next: Review" :
            "Next: Invite Squad"}{" "}
                <ArrowRight className="w-4 h-4" />
              </button>}


            {step === 2 &&
          <button
          type="button"
          onClick={handleNextStep2}
          className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-6 py-3 rounded-2xl bg-[#7C3AED] hover:bg-[#7c3aed] text-white text-xs font-bold shadow-lg shadow-[#7C3AED]/30 transition-all active:scale-95">

                {invitedUserIds.length === 0 ? "Skip for now" : "Next: Review"}{" "}
                <ArrowRight className="w-4 h-4" />
              </button>}


            {step === 3 &&
          <button
          type="button"
          onClick={handleSubmit}
          disabled={loading}
          className="flex-1 flex items-center justify-center gap-2 px-8 py-3 rounded-2xl bg-[#7C3AED] hover:bg-[#7c3aed] text-white text-xs font-black shadow-xl shadow-[#7C3AED]/40 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap">

                {loading ? "Launching..." : "🚀 Launch Journey"}
              </button>}

          </div>}

      </div>
    </div>);

};

export default CreateJourneyModal;