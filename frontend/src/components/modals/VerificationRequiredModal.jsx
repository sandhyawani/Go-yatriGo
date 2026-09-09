import React, { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  X,
  UploadCloud,
  FileText,
  Lock,
  AlertCircle,
  Loader2,
  CheckCircle2,
  ChevronDown
} from "lucide-react";
import axios from "../../api/axios";
import { useAuth } from "../../context/authContext";
import { showToast } from "../../utils/showToast";

const VALID_DOC_TYPES = [
  "Aadhaar Card",
  "PAN Card",
  "Passport",
  "Driving License"
];

const ALLOWED_MIME_TYPES = ["image/jpeg", "image/png", "application/pdf"];
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5 MB

const formatFileSize = (bytes) => {
  if (!bytes && bytes !== 0) return "";
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

/**
 * Production-ready Identity Verification Modal for Go YatriGo.
 * Provides direct, in-modal Government ID upload flow for unverified/rejected users,
 * and clear status tracking for pending users.
 */
const VerificationRequiredModal = ({
  isOpen,
  onClose,
  actionName = "Host Trips",
  actionType,
  verificationStatus,
  userStatus,
  rejectionReason = ""
}) => {
  const { user, updateUser } = useAuth();

  // Internal verification status tracking
  const initialStatus = useMemo(() => {
    return (
      verificationStatus ||
      userStatus ||
      user?.verificationStatus ||
      "unverified"
    );
  }, [verificationStatus, userStatus, user?.verificationStatus]);

  const [currentStatus, setCurrentStatus] = useState(initialStatus);
  const [govIdType, setGovIdType] = useState(user?.govIdType || "");
  const [selectedFile, setSelectedFile] = useState(null);
  const [filePreview, setFilePreview] = useState(null);
  const previewUrlRef = useRef(null);

  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const fileInputRef = useRef(null);
  const modalRef = useRef(null);
  const previouslyFocusedElementRef = useRef(null);

  // Sync internal status when external prop changes
  useEffect(() => {
    setCurrentStatus(initialStatus);
  }, [initialStatus]);

  // Cleanup object URL on unmount or file clear
  useEffect(() => {
    return () => {
      if (previewUrlRef.current) {
        URL.revokeObjectURL(previewUrlRef.current);
      }
    };
  }, []);

  // Manage focus trap & restore focus
  useEffect(() => {
    if (isOpen) {
      previouslyFocusedElementRef.current = document.activeElement;
      document.body.style.overflow = "hidden";

      const handleKeyDown = (e) => {
        if (e.key === "Escape") {
          e.preventDefault();
          if (!isSubmitting) onClose?.();
        }
        if (e.key === "Tab" && modalRef.current) {
          const focusable = modalRef.current.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          );
          if (focusable.length === 0) return;
          const first = focusable[0];
          const last = focusable[focusable.length - 1];

          if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
          } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
          }
        }
      };

      window.addEventListener("keydown", handleKeyDown);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        document.body.style.overflow = "";
        if (previouslyFocusedElementRef.current && typeof previouslyFocusedElementRef.current.focus === "function") {
          previouslyFocusedElementRef.current.focus();
        }
      };
    }
  }, [isOpen, isSubmitting, onClose]);

  const clearFile = useCallback(() => {
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }
    setSelectedFile(null);
    setFilePreview(null);
    setErrorMessage("");
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, []);

  const validateAndSetFile = useCallback((file) => {
    setErrorMessage("");
    if (!file) return;

    if (!ALLOWED_MIME_TYPES.includes(file.type)) {
      const err = "Invalid file type. Only JPG, PNG, and PDF files are allowed.";
      setErrorMessage(err);
      showToast.error("Invalid file format", err);
      return;
    }

    if (file.size > MAX_FILE_SIZE) {
      const err = "File size exceeds 5MB limit. Please upload a smaller file.";
      setErrorMessage(err);
      showToast.error("File too large", err);
      return;
    }

    // Generate preview for image files
    if (previewUrlRef.current) {
      URL.revokeObjectURL(previewUrlRef.current);
      previewUrlRef.current = null;
    }

    if (file.type.startsWith("image/")) {
      const url = URL.createObjectURL(file);
      previewUrlRef.current = url;
      setFilePreview(url);
    } else {
      setFilePreview(null);
    }

    setSelectedFile(file);
  }, []);

  const handleFileInputChange = (e) => {
    const file = e.target.files?.[0];
    validateAndSetFile(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!isSubmitting) setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    if (isSubmitting) return;

    const file = e.dataTransfer.files?.[0];
    validateAndSetFile(file);
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    if (isSubmitting) return;

    if (!govIdType) {
      setErrorMessage("Please choose your Government ID document type.");
      showToast.error("Document Type Required", "Select Aadhaar Card, PAN Card, Passport, or Driving License.");
      return;
    }

    if (!selectedFile) {
      setErrorMessage("Please select a government ID document to upload.");
      showToast.error("Document File Required", "Please choose a JPG, PNG, or PDF file under 5MB.");
      return;
    }

    setIsSubmitting(true);
    setUploadProgress(0);
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("document", selectedFile);
      formData.append("govIdType", govIdType);

      const response = await axios.post(
        "/users/profile/verification",
        formData,
        {
          withCredentials: true,
          headers: {
            "Content-Type": "multipart/form-data"
          },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded * 100) / progressEvent.total
              );
              setUploadProgress(percent);
            }
          }
        }
      );

      if (response.data && response.data.success) {
        // Update user state in AuthContext
        if (typeof updateUser === "function") {
          updateUser({
            ...user,
            verificationStatus: "pending",
            isVerified: false,
            govIdType,
            hasSubmittedDocument: true,
            ...(response.data?.user || {})
          });
        }

        // Transition modal to pending review state
        setCurrentStatus("pending");
        clearFile();
        showToast.success(
          "Verification Submitted",
          "Your government ID has been submitted and is currently under review."
        );
      } else {
        throw new Error(response.data?.message || "Failed to submit verification.");
      }
    } catch (err) {
      console.error("Verification upload error:", err);
      const serverMsg =
        err.response?.data?.message ||
        err.message ||
        "Upload failed. Please check your internet connection and try again.";
      setErrorMessage(serverMsg);
      showToast.error("Submission Failed", serverMsg);
    } finally {
      setIsSubmitting(false);
      setUploadProgress(0);
    }
  };

  if (!isOpen) return null;

  const resolvedActionName =
    actionName !== "Access This Feature"
      ? actionName
      : actionType === "chat"
      ? "Send Messages"
      : actionType === "join"
      ? "Join Journeys"
      : "Host Trips";

  const isPending = currentStatus === "pending";
  const isRejected = currentStatus === "rejected";
  const note = rejectionReason || user?.verificationNote || "";

  return createPortal(
    <AnimatePresence>
      <div
        className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto"
        role="dialog"
        aria-modal="true"
        aria-labelledby="verification-modal-title"
      >
        {/* Modal Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={() => {
            if (!isSubmitting) onClose?.();
          }}
          className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          aria-hidden="true"
        />

        {/* Modal Dialog Window */}
        <motion.div
          ref={modalRef}
          initial={{ scale: 0.96, opacity: 0, y: 16 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.96, opacity: 0, y: 16 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden z-10 my-auto flex flex-col max-h-[92vh]"
        >
          {/* Top Bar / Header */}
          <div className="relative px-6 pt-6 pb-5 border-b border-slate-100 text-center bg-white shrink-0">
            <button
              type="button"
              onClick={onClose}
              disabled={isSubmitting}
              className="absolute top-5 right-5 p-2 rounded-full text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors cursor-pointer disabled:opacity-50"
              aria-label="Close modal"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl mb-3 shadow-xs border transition-colors">
              {isPending ? (
                <div className="w-full h-full flex items-center justify-center rounded-2xl bg-amber-50 text-amber-600 border border-amber-200/60">
                  <Clock className="w-7 h-7" />
                </div>
              ) : isRejected ? (
                <div className="w-full h-full flex items-center justify-center rounded-2xl bg-red-50 text-red-600 border border-red-200/60">
                  <AlertTriangle className="w-7 h-7" />
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center rounded-2xl bg-brand-50 text-brand border border-brand-200/60">
                  <ShieldCheck className="w-7 h-7" />
                </div>
              )}
            </div>

            <h2
              id="verification-modal-title"
              className="text-xl font-bold text-slate-900 tracking-tight"
            >
              {isPending
                ? "Verification Pending"
                : isRejected
                ? "Verification Required"
                : "Identity Verification Required"}
            </h2>
            <p className="mt-1.5 text-xs text-slate-500 max-w-md mx-auto leading-relaxed">
              To keep our travel community safe and reliable, you must be a{" "}
              <span className="font-semibold text-slate-800">Verified Traveler</span> to {resolvedActionName.toLowerCase()}.
            </p>
            {!isPending && (
              <p className="mt-1 text-xs text-brand font-medium">
                Upload a valid government ID to complete verification.
              </p>
            )}
          </div>

          {/* Scrollable Modal Body */}
          <div className="p-5 sm:p-6 overflow-y-auto space-y-5 bg-white text-left">
            {/* 1. Pending Status Review Card */}
            {isPending ? (
              <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-5 space-y-3">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 rounded-lg bg-amber-100 text-amber-700">
                    <Clock className="w-4 h-4" />
                  </div>
                  <div>
                    <h4 className="text-xs font-bold text-amber-900">
                      Your document is under review
                    </h4>
                    <p className="text-[11px] text-amber-700">
                      Usually verified within 24 hours
                    </p>
                  </div>
                </div>

                <p className="text-xs text-amber-800 leading-relaxed bg-white/70 p-3 rounded-xl border border-amber-200/50">
                  Our moderation team is reviewing your uploaded Government ID. You will receive an immediate notification as soon as your account is approved.
                </p>

                {(govIdType || user?.govIdType) && (
                  <div className="flex items-center justify-between px-3.5 py-2 bg-white rounded-xl border border-amber-200/70 text-xs">
                    <span className="text-slate-500 font-medium text-[11px] flex items-center gap-1.5">
                      <FileText className="w-3.5 h-3.5 text-amber-600" /> Submitted ID:
                    </span>
                    <span className="font-bold text-slate-800 text-[11px]">
                      {govIdType || user?.govIdType}
                    </span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-[11px] text-amber-800/90 pt-1">
                  <span className="w-2 h-2 rounded-full bg-amber-500 animate-pulse shrink-0" />
                  <span>Trip creation will be unlocked once verification is complete.</span>
                </div>
              </div>
            ) : (
              <>
                {/* Rejection Alert if previous submission was rejected */}
                {isRejected && (
                  <div className="bg-red-50 border border-red-200 rounded-2xl p-4 text-left">
                    <div className="flex items-center gap-2 mb-1.5">
                      <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                      <h4 className="text-xs font-bold text-red-900">
                        Previous submission was unsuccessful
                      </h4>
                    </div>
                    <p className="text-xs text-red-700 leading-relaxed pl-6">
                      {note || "Please upload a clear, authentic Government ID to verify your profile."}
                    </p>
                  </div>
                )}

                {/* 2. Trust & Privacy Information Cards */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div className="flex items-start gap-3 p-3.5 bg-brand-50/40 rounded-2xl border border-brand-100 shadow-2xs">
                    <div className="p-2 rounded-xl bg-white text-emerald-600 shadow-2xs border border-brand-100 shrink-0">
                      <CheckCircle2 className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Build Trust</h4>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        Verified travelers are 3x more likely to find travel mates and receive positive confirmations.
                      </p>
                    </div>
                  </div>

                  <div className="flex items-start gap-3 p-3.5 bg-brand-50/40 rounded-2xl border border-brand-100 shadow-2xs">
                    <div className="p-2 rounded-xl bg-white text-brand shadow-2xs border border-brand-100 shrink-0">
                      <Lock className="w-4 h-4" />
                    </div>
                    <div>
                      <h4 className="text-xs font-bold text-slate-900">Fast & Private</h4>
                      <p className="text-[11px] text-slate-500 leading-snug mt-0.5">
                        Government ID is stored privately and is never displayed publicly or shared with others.
                      </p>
                    </div>
                  </div>
                </div>

                {/* 3. Government ID Upload — MAIN ACTION */}
                <div className="space-y-3.5 pt-1">
                  <div>
                    <h3 className="text-sm font-bold text-slate-900">
                      Upload Your Government ID
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Choose one of the following: Aadhaar Card, PAN Card, Passport, or Driving License.
                    </p>
                  </div>

                  {/* Document Type Selector */}
                  <div className="relative">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Select Document Type <span className="text-red-500">*</span>
                    </label>
                    <button
                      type="button"
                      onClick={() => !isSubmitting && setIsDropdownOpen(!isDropdownOpen)}
                      disabled={isSubmitting}
                      className={`w-full flex items-center justify-between px-4 py-2.5 bg-white border ${
                        isDropdownOpen
                          ? "border-brand ring-2 ring-brand/20"
                          : "border-slate-200"
                      } rounded-xl text-slate-900 text-xs font-semibold outline-none transition-all shadow-2xs hover:border-brand/50 disabled:opacity-50 cursor-pointer`}
                      aria-haspopup="listbox"
                      aria-expanded={isDropdownOpen}
                    >
                      <span className={govIdType ? "text-slate-900 font-bold" : "text-slate-400 font-normal"}>
                        {govIdType || "Choose document type..."}
                      </span>
                      <ChevronDown
                        className={`w-4 h-4 text-slate-400 transition-transform ${
                          isDropdownOpen ? "rotate-180" : ""
                        }`}
                      />
                    </button>

                    <AnimatePresence>
                      {isDropdownOpen && (
                        <motion.div
                          initial={{ opacity: 0, y: -6 }}
                          animate={{ opacity: 1, y: 0 }}
                          exit={{ opacity: 0, y: -6 }}
                          className="absolute top-full left-0 right-0 mt-1.5 bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden z-20 py-1"
                        >
                          {VALID_DOC_TYPES.map((type) => (
                            <button
                              key={type}
                              type="button"
                              onClick={() => {
                                setGovIdType(type);
                                setIsDropdownOpen(false);
                                setErrorMessage("");
                              }}
                              className={`w-full text-left px-4 py-2.5 text-xs font-semibold transition-colors flex items-center justify-between ${
                                govIdType === type
                                  ? "bg-brand-50 text-brand"
                                  : "text-slate-700 hover:bg-slate-50"
                              }`}
                            >
                              <span>{type}</span>
                              {govIdType === type && (
                                <CheckCircle2 className="w-3.5 h-3.5 text-brand" />
                              )}
                            </button>
                          ))}
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>

                  {/* Drag & Drop Upload Zone */}
                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 mb-1.5">
                      Upload Document File <span className="text-red-500">*</span>
                    </label>

                    {!selectedFile ? (
                      /* Empty Upload Dropzone State */
                      <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={() => fileInputRef.current?.click()}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            fileInputRef.current?.click();
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-label="Upload document file dropzone. Drag and drop file or click to select"
                        className={`relative w-full border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all duration-200 outline-none ${
                          isDragging
                            ? "border-brand bg-brand-50/80 scale-[0.99]"
                            : "border-brand-300 bg-brand-50/30 hover:border-brand hover:bg-brand-50/60 focus:ring-2 focus:ring-brand/30"
                        }`}
                      >
                        <div className="mx-auto flex h-11 w-11 items-center justify-center rounded-full bg-white text-brand shadow-xs border border-brand-100 mb-2.5">
                          <UploadCloud className="w-5 h-5" />
                        </div>
                        <p className="text-xs font-bold text-slate-800">
                          Drag &amp; drop your document here
                        </p>
                        <p className="text-[11px] text-slate-400 my-1">or</p>
                        <span className="inline-flex items-center gap-1 px-3 py-1 bg-white text-brand text-xs font-bold rounded-lg border border-brand-200 shadow-2xs hover:bg-brand-50 transition-colors">
                          Choose File
                        </span>
                        <p className="text-[10px] text-slate-400 font-medium mt-2.5">
                          Supported formats: JPG, PNG, PDF (Max 5 MB)
                        </p>
                      </div>
                    ) : (
                      /* Selected File Preview / Status Row */
                      <div className="p-4 bg-brand-50/40 rounded-2xl border border-brand-200 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                          {filePreview ? (
                            <img
                              src={filePreview}
                              alt="ID Thumbnail"
                              className="h-12 w-12 object-cover rounded-xl border border-slate-200 shrink-0 bg-white"
                            />
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-white border border-brand-200 flex items-center justify-center text-brand shrink-0">
                              <FileText className="w-6 h-6" />
                            </div>
                          )}
                          <div className="min-w-0">
                            <p className="text-xs font-bold text-slate-900 truncate">
                              {selectedFile.name}
                            </p>
                            <p className="text-[11px] text-slate-500">
                              {formatFileSize(selectedFile.size)}
                            </p>
                            <span className="inline-flex items-center gap-1 text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md mt-1 border border-emerald-200/60">
                              <CheckCircle2 className="w-3 h-3" /> Ready for upload
                            </span>
                          </div>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <button
                            type="button"
                            onClick={() => fileInputRef.current?.click()}
                            disabled={isSubmitting}
                            className="px-2.5 py-1.5 text-xs font-semibold text-brand hover:bg-white rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                          >
                            Change
                          </button>
                          <button
                            type="button"
                            onClick={clearFile}
                            disabled={isSubmitting}
                            className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
                            aria-label="Remove selected document"
                          >
                            <X className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Hidden Accessible File Input */}
                    <input
                      ref={fileInputRef}
                      type="file"
                      id="govIdFileInput"
                      accept="image/jpeg,image/png,application/pdf"
                      onChange={handleFileInputChange}
                      disabled={isSubmitting}
                      className="hidden"
                      tabIndex={-1}
                    />
                  </div>

                  {/* 4. Compact Upload Tips */}
                  <div className="p-3.5 bg-slate-50/80 rounded-xl border border-slate-200/80 text-[11px] text-slate-600">
                    <p className="font-bold text-slate-800 mb-1.5 flex items-center gap-1.5">
                      <span>💡</span> Tips for a successful upload:
                    </p>
                    <ul className="grid grid-cols-1 sm:grid-cols-2 gap-1 text-[11px] text-slate-500 pl-1 list-disc list-inside">
                      <li>Upload a clear, readable document</li>
                      <li>Ensure all details &amp; photo are visible</li>
                      <li>Avoid glare, reflections, or blur</li>
                      <li>Accepted format: JPG, PNG, or PDF</li>
                    </ul>
                  </div>

                  {/* Inline Error Message if any */}
                  {errorMessage && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 text-red-600 shrink-0 mt-0.5" />
                      <span>{errorMessage}</span>
                    </div>
                  )}

                  {/* Upload Progress Bar */}
                  {isSubmitting && uploadProgress > 0 && uploadProgress < 100 && (
                    <div className="space-y-1">
                      <div className="h-1.5 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand transition-all duration-200"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-[10px] font-bold text-brand text-right">
                        Uploading... {uploadProgress}%
                      </p>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>

          {/* Security Reassurance & Footer Actions */}
          <div className="p-5 border-t border-slate-100 bg-white shrink-0 space-y-3">
            {!isPending && (
              <p className="text-[11px] text-slate-400 text-center flex items-center justify-center gap-1.5">
                <Lock className="w-3 h-3 text-slate-400" />
                <span>Your information is secure — ID documents are encrypted in private storage.</span>
              </p>
            )}

            <div className="flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2.5 text-xs font-semibold text-slate-500 hover:text-slate-800 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isPending ? "Close" : "Not Now"}
              </button>

              {isPending ? (
                <button
                  type="button"
                  onClick={onClose}
                  className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all cursor-pointer inline-flex items-center gap-1.5"
                >
                  <span>Got It</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={handleSubmit}
                  disabled={isSubmitting || !selectedFile || !govIdType}
                  className="px-5 py-2.5 bg-brand hover:bg-brand-dark text-white text-xs font-bold rounded-xl shadow-xs hover:shadow transition-all cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed inline-flex items-center gap-1.5"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <span>{isRejected ? "Resubmit for Verification →" : "Submit for Verification →"}</span>
                    </>
                  )}
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default VerificationRequiredModal;
