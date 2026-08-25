import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
Compass,
MapPin,
Users,
X,
Sparkles,
ArrowRight,
ArrowLeft,
CheckCircle2,
Link2,
Check } from
"lucide-react";
import axiosInstance from "../../api/axios";
import MemberSelector from "./MemberSelector";
import CustomSelect from "../ui/CustomSelect";
import { Camera } from "lucide-react";
import { showToast } from "../../utils/showToast";

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
  const generateIdempotencyKey = () => {
    return [...Array(24)].map(() => Math.floor(Math.random() * 16).toString(16)).join('');
  };

  const [idempotencyKey, setIdempotencyKey] = useState("");

  useEffect(() => {
    if (isOpen) {
      document.body.classList.add("modal-open-hide-nav");
      setIdempotencyKey(generateIdempotencyKey());
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
    coverImage: "",
    description: ""
  });
  const fileInputRef = React.useRef(null);
  const [imagePreview, setImagePreview] = useState("");
  const [file, setFile] = useState(null);
  const [invitedUserIds, setInvitedUserIds] = useState([]);
  const [loading, setLoading] = useState(false);
  const [createdJourney, setCreatedJourney] = useState(null);
  const [linkCopied, setLinkCopied] = useState(false);

  if (!isOpen) return null;

  const todayStr = new Date().toISOString().split("T")[0];

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
    setImagePreview("");
    setFile(null);
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
      showToast.error("Please fill in the title, destination, start date, and end date!");
      return;
    }
    if (formData.startDate < todayStr) {
      showToast.error("Start date cannot be in the past!");
      return;
    }
    if (formData.endDate < formData.startDate) {
      showToast.error("End date cannot be before start date!");
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
      let imageUrl = formData.coverImage?.trim();

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
        ...formData,
        coverImage: imageUrl,
        sourceType,
        sourceId,
        idempotencyKey,
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
      showToast.error(err.response?.data?.message || "Failed to create journey");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-slate-900/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full sm:max-w-xl bg-white dark:bg-slate-900 rounded-t-3xl sm:rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 overflow-hidden flex flex-col max-h-[92dvh] sm:max-h-[88vh]">
        {/* Mobile touch indicator bar */}
        <div className="pt-2.5 pb-1 flex justify-center sm:hidden">
          <div className="w-10 h-1 rounded-full bg-slate-300 dark:bg-slate-700" />
        </div>

        {/* Modal Header */}
        <div className="bg-white dark:bg-slate-900 px-4 sm:px-5 py-3 sm:py-4 border-b border-slate-100 dark:border-slate-800 text-slate-900 dark:text-white flex items-center justify-between">
          <div className="flex items-center gap-2.5 sm:gap-3">
            <div className="p-2 bg-[#7C3AED] rounded-xl shadow-md shadow-[#7C3AED]/20 shrink-0">
              <Compass className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <div>
              <h2 className="text-sm sm:text-base font-extrabold flex items-center gap-1.5 leading-tight">
                Launch Journey <Sparkles className="w-3.5 h-3.5 text-amber-500" />
              </h2>
              <p className="text-[10.5px] sm:text-[11px] text-slate-500 font-medium">
                {step === 1 && "Step 1: Define your getaway"}
                {step === 2 && "Step 2: Invite your travel group"}
                {step === 3 && "Step 3: Review & launch"}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 sm:p-2 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 text-slate-400 hover:text-slate-700 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Step Progress Bar */}
        <div className="flex items-center px-4 sm:px-6 py-2.5 bg-slate-50 dark:bg-slate-950 border-b border-slate-100 dark:border-slate-800 select-none">
          <div
            className={`flex items-center gap-1.5 text-xs font-bold ${step >= 1 ? "text-[#7C3AED]" : "text-slate-400"}`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step >= 1 ? "bg-[#7C3AED] text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              1
            </span>
            <span className="hidden xs:inline">Details</span>
          </div>
          <div
            className={`flex-1 h-0.5 mx-2 sm:mx-3 rounded-full ${step >= 2 ? "bg-[#7C3AED]" : "bg-slate-200 dark:bg-slate-800"}`}
          />

          <div
            className={`flex items-center gap-1.5 text-xs font-bold ${step >= 2 ? "text-[#7C3AED]" : "text-slate-400"}`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step >= 2 ? "bg-[#7C3AED] text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              2
            </span>
            <span className="hidden xs:inline">Group</span>
          </div>
          <div
            className={`flex-1 h-0.5 mx-2 sm:mx-3 rounded-full ${step >= 3 ? "bg-[#7C3AED]" : "bg-slate-200 dark:bg-slate-800"}`}
          />

          <div
            className={`flex items-center gap-1.5 text-xs font-bold ${step >= 3 ? "text-[#7C3AED]" : "text-slate-400"}`}
          >
            <span
              className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black ${
                step >= 3 ? "bg-[#7C3AED] text-white" : "bg-slate-200 dark:bg-slate-800 text-slate-600 dark:text-slate-400"
              }`}
            >
              3
            </span>
            <span className="hidden xs:inline">Review</span>
          </div>
        </div>

        {/* Scrollable Form Content */}
        <div className="p-4 sm:p-5 overflow-y-auto flex-1 custom-scrollbar space-y-4">
          {createdJourney ? (
            <div className="py-6 px-3 text-center space-y-5 animate-fade-in">
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-3xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center text-3xl mx-auto border border-emerald-500/20 shadow-xs">
                🎉
              </div>
              <div>
                <h2 className="text-lg sm:text-xl font-black text-slate-900 dark:text-white">
                  Journey Created!
                </h2>
                <p className="text-xs text-slate-500 dark:text-slate-400 mt-1 max-w-xs mx-auto">
                  {invitedUserIds.length > 0
                    ? `Invitations sent to ${invitedUserIds.length} ${invitedUserIds.length === 1 ? "person" : "people"}.`
                    : "Your journey has been launched successfully."}
                </p>
              </div>

              <div className="space-y-2.5 pt-2 max-w-sm mx-auto">
                <button
                  type="button"
                  onClick={handleCopyPrivateLink}
                  className={`w-full py-2.5 px-4 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
                    linkCopied
                      ? "bg-emerald-500 text-white border-emerald-500 shadow-xs"
                      : "bg-white dark:bg-slate-900 text-[#7C3AED] hover:bg-brand-50 border-brand-200 dark:border-brand-800 shadow-xs active:scale-95"
                  }`}
                >
                  {linkCopied ? (
                    <>
                      <Check className="w-4 h-4 stroke-[3]" />
                      <span>Private Link Copied!</span>
                    </>
                  ) : (
                    <>
                      <Link2 className="w-4 h-4 text-[#7C3AED]" />
                      <span>Copy Private Invite Link</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => {
                    const j = createdJourney;
                    if (onCreated) onCreated(j);
                    handleCloseModal();
                    navigate(`/social/journeys/${j._id}`);
                  }}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white text-xs font-extrabold shadow-md shadow-[#7C3AED]/25 transition-all active:scale-95 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Open Journey</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* Step 1: Trip Details */}
              {step === 1 && (
                <form id="step1Form" onSubmit={handleNextStep1} className="space-y-4">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Journey Title *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.title}
                      onChange={(e) => handleChange("title", e.target.value)}
                      placeholder="e.g. Ratnagiri Beach Getaway, Leh Expedition"
                      className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
                    />
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Starting From (Optional)
                      </label>
                      <input
                        type="text"
                        value={formData.from}
                        onChange={(e) => handleChange("from", e.target.value)}
                        placeholder="e.g. Pune, Mumbai"
                        className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Destination *
                      </label>
                      <input
                        type="text"
                        required
                        value={formData.destination}
                        onChange={(e) => handleChange("destination", e.target.value)}
                        placeholder="e.g. Ganpatipule, Manali"
                        className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Start Date *
                      </label>
                      <input
                        type="date"
                        required
                        min={todayStr}
                        value={formData.startDate}
                        onChange={(e) => handleChange("startDate", e.target.value)}
                        className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
                      />
                    </div>
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        End Date *
                      </label>
                      <input
                        type="date"
                        required
                        min={formData.startDate || todayStr}
                        value={formData.endDate}
                        onChange={(e) => handleChange("endDate", e.target.value)}
                        className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-xs sm:text-sm outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] transition-all"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Journey Type
                      </label>
                      <CustomSelect
                        value={formData.journeyType}
                        onChange={(e) => handleChange("journeyType", e.target.value)}
                        className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 text-xs sm:text-sm outline-none focus:border-[#7C3AED]"
                        options={[
                          { label: "👥 Journey with Trip Mates", value: "Connections" },
                          { label: "👤 Solo Expedition", value: "Solo" }
                        ]}
                      />
                    </div>

                    <div>
                      <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                        Journey Visibility
                      </label>
                      <div className="w-full px-3.5 py-2.5 sm:py-3 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-100 dark:bg-slate-800 flex items-center gap-2 text-xs sm:text-sm font-bold text-slate-600 dark:text-slate-300">
                        🔒 Private Journey
                      </div>
                      <p className="mt-1 text-[10.5px] text-slate-500 font-medium">
                        Only invited members can view this workspace.
                      </p>
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1.5">
                      Cover Image
                    </label>
                    <div className="flex flex-col gap-2">
                      <div
                        onClick={() => !imagePreview && fileInputRef.current?.click()}
                        className={`relative w-full rounded-2xl bg-[#7C3AED]/5 border-2 border-slate-200 dark:border-slate-700 flex flex-col items-center justify-center overflow-hidden transition-all group ${
                          !imagePreview
                            ? "min-h-[130px] sm:min-h-[160px] border-dashed hover:border-[#7C3AED]/40 cursor-pointer py-4 px-3 text-center"
                            : "h-28 sm:h-36"
                        }`}
                      >
                        {imagePreview ? (
                          <>
                            <img src={imagePreview} alt="Cover" className="w-full h-full object-cover" />
                            <div
                              className="absolute inset-0 bg-black/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center cursor-pointer"
                              onClick={() => fileInputRef.current?.click()}
                            >
                              <Camera className="w-7 h-7 text-white" />
                            </div>
                          </>
                        ) : (
                          <div className="flex flex-col items-center gap-1">
                            <span className="text-2xl">✨</span>
                            <span className="text-xs sm:text-sm font-bold text-[#7C3AED]">Auto Cover</span>
                            <div className="text-[11px] text-slate-500 text-center max-w-[260px]">
                              Automatically generates a cover image based on destination.
                            </div>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                fileInputRef.current?.click();
                              }}
                              className="text-[10.5px] font-bold text-[#7C3AED] hover:text-[#6d28d9] bg-[#7C3AED]/10 hover:bg-[#7C3AED]/20 px-3.5 py-1.5 rounded-xl transition-colors mt-1 cursor-pointer"
                            >
                              + Upload image
                            </button>
                          </div>
                        )}
                        <input
                          type="file"
                          ref={fileInputRef}
                          onChange={handleImageChange}
                          accept="image/*"
                          className="hidden"
                        />
                      </div>

                      {imagePreview && (
                        <div className="flex justify-end">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            className="text-[10.5px] font-bold text-slate-500 hover:text-slate-700 dark:hover:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 px-3 py-1 rounded-xl transition-colors cursor-pointer"
                          >
                            Change image
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 dark:text-slate-300 uppercase tracking-wider mb-1">
                      Notes & Goals (Optional)
                    </label>
                    <textarea
                      rows="2"
                      value={formData.description}
                      onChange={(e) => handleChange("description", e.target.value)}
                      placeholder="What is this getaway all about? Add notes or travel vibes..."
                      className="w-full px-3.5 py-2.5 rounded-xl sm:rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50 dark:bg-slate-800/50 text-slate-800 dark:text-slate-100 placeholder-slate-400 text-xs outline-none focus:ring-2 focus:ring-[#7C3AED]/20 focus:border-[#7C3AED] min-h-[70px] resize-none transition-all"
                    />
                  </div>
                </form>
              )}


              {/* Step 2: Invite Group */}
              {step === 2 && (
                <div>
                  <div className="mb-4 bg-brand-50 dark:bg-brand-900/40 p-4 rounded-2xl border border-brand-200 dark:border-brand-800/60 flex items-start gap-3">
                    <Users className="w-5 h-5 text-[#7C3AED] shrink-0 mt-0.5" />
                    <div className="text-xs">
                      <strong className="text-slate-800 dark:text-slate-200 font-bold block">
                        Invite Your Travel Group
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
                    onChange={setInvitedUserIds}
                  />
                </div>
              )}
              {step === 3 && (
                <div className="space-y-4 sm:space-y-5 animate-fade-in">
                  <div className="bg-white dark:bg-slate-900 rounded-2xl sm:rounded-3xl border border-slate-200 dark:border-slate-800 overflow-hidden shadow-sm">
                    <div className="relative h-36 sm:h-44 bg-slate-200 dark:bg-slate-800 flex items-center justify-center overflow-hidden">
                      {formData.coverImage || imagePreview ? (
                        <img
                          src={imagePreview || formData.coverImage}
                          alt="Cover"
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <div className="flex flex-col items-center justify-center text-slate-400 opacity-80">
                          <span className="text-2xl sm:text-3xl mb-1 sm:mb-2">✨</span>
                          <span className="text-xs sm:text-sm font-bold">Auto Cover Selected</span>
                        </div>
                      )}

                      <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent flex flex-col justify-end p-3.5 sm:p-5 text-white">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-[9.5px] sm:text-[10px] font-extrabold bg-[#7C3AED] px-2 py-0.5 rounded-md self-start uppercase tracking-wider shadow-sm">
                            {formData.journeyType === "Solo Expedition" || formData.journeyType === "Solo" || formData.journeyType === "Solo Journey"
                              ? "SOLO TRIP"
                              : "TRIP MATES"}
                          </span>
                        </div>
                        <h3 className="text-base sm:text-xl font-black tracking-tight leading-tight">
                          {formData.title}
                        </h3>
                        <p className="text-[11px] sm:text-xs text-slate-200 flex items-center gap-1 mt-0.5 font-semibold">
                          <MapPin className="w-3 h-3 text-rose-400 shrink-0" />
                          <span>{formData.from ? `${formData.from} → ` : ""}{formData.destination}</span>
                        </p>
                      </div>
                    </div>

                    <div className="p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 bg-slate-50/50 dark:bg-slate-950/50 border-t border-slate-100 dark:border-slate-800 text-xs">
                      <div>
                        <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase block">
                          Duration
                        </span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 block text-xs">
                          {getDurationDays() || "3 Days"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase block">
                          Host
                        </span>
                        <span className="font-extrabold text-slate-800 dark:text-slate-100 mt-0.5 block text-xs">
                          You
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase block">
                          Invited
                        </span>
                        <span className="font-extrabold text-[#7C3AED] mt-0.5 block text-xs">
                          {invitedUserIds.length > 0
                            ? `${invitedUserIds.length} ${invitedUserIds.length === 1 ? "person" : "people"}`
                            : "None"}
                        </span>
                      </div>
                      <div>
                        <span className="text-[9.5px] sm:text-[10px] font-bold text-slate-400 uppercase block">
                          Status
                        </span>
                        <span className="font-extrabold text-amber-500 mt-0.5 block text-xs">
                          ⏳ Upcoming
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="bg-brand-50/70 dark:bg-brand-950/40 p-3.5 sm:p-4 rounded-2xl border border-brand-200/80 dark:border-brand-900/60 space-y-2">
                    <h4 className="text-[11px] sm:text-xs font-black text-slate-800 dark:text-slate-100 uppercase tracking-wider flex items-center gap-1.5">
                      <Sparkles className="w-3.5 h-3.5 text-[#7C3AED]" /> Ready to launch?
                    </h4>
                    <div className="space-y-1.5 text-[11px] sm:text-xs text-slate-700 dark:text-slate-300 font-semibold">
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>Trip details and dates configured</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                        <span>
                          {invitedUserIds.length > 0
                            ? `${invitedUserIds.length} travel group members will receive invites`
                            : "Solo journey workspace ready to launch"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* Modal Action Footer */}
        {!createdJourney && (
          <div className="px-4 py-3 pb-[max(env(safe-area-inset-bottom,0px),0.75rem)] border-t border-slate-100 dark:border-slate-800 flex items-center justify-between gap-2.5 bg-white dark:bg-slate-900">
            {step > 1 ? (
              <button
                type="button"
                onClick={() =>
                  setStep(
                    formData.journeyType === "Solo Expedition" ||
                    formData.journeyType === "Solo" ||
                    formData.journeyType === "Solo Journey"
                      ? 1
                      : step - 1
                  )
                }
                className="flex items-center gap-1 px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold text-slate-600 hover:bg-slate-100 dark:text-slate-300 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                <ArrowLeft className="w-4 h-4" /> Back
              </button>
            ) : (
              <button
                type="button"
                onClick={onClose}
                className="px-3 sm:px-4 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors cursor-pointer"
              >
                Cancel
              </button>
            )}

            {step === 1 && (
              <button
                form="step1Form"
                type="submit"
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white text-xs font-extrabold shadow-md shadow-[#7C3AED]/25 transition-all active:scale-95 cursor-pointer"
              >
                <span>
                  {formData.journeyType === "Solo Expedition" || formData.journeyType === "Solo" || formData.journeyType === "Solo Journey"
                    ? "Next: Review"
                    : "Next: Group"}
                </span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 2 && (
              <button
                type="button"
                onClick={handleNextStep2}
                className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-5 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white text-xs font-extrabold shadow-md shadow-[#7C3AED]/25 transition-all active:scale-95 cursor-pointer"
              >
                <span>{invitedUserIds.length === 0 ? "Skip for now" : "Next: Review"}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            )}

            {step === 3 && (
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="flex-1 sm:flex-none flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl bg-gradient-to-r from-[#7C3AED] to-[#6D28D9] hover:from-[#6D28D9] hover:to-[#5B21B6] text-white text-xs font-black shadow-lg shadow-[#7C3AED]/30 transition-all active:scale-95 disabled:opacity-50 whitespace-nowrap cursor-pointer"
              >
                {loading ? "Launching..." : "🚀 Launch Journey"}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default CreateJourneyModal;