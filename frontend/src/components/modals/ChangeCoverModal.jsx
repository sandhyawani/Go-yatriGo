import React, { useState, useRef } from "react";
import { createPortal } from "react-dom";
import { motion, AnimatePresence } from "framer-motion";
import { X, Upload, Image as ImageIcon, Loader2, ArrowRight } from "lucide-react";
import axios from "../../api/axios";
import { showToast } from "../../utils/showToast";

export const ChangeCoverModal = ({
  isOpen,
  onClose,
  memory,
  onCoverUpdated,
}) => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef(null);

  if (!isOpen || !memory) return null;

  const memoryId = (memory._id || memory.id)?.toString();
  const currentCover =
    memory.image ||
    memory.mediaUrl ||
    memory.img ||
    (Array.isArray(memory.mediaUrls) && memory.mediaUrls[0]) ||
    "";

  const handleFileSelect = (file) => {
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      showToast.error("Please select a valid image file.");
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      showToast.error("Image size must be under 10MB.");
      return;
    }

    setSelectedFile(file);
    const objectUrl = URL.createObjectURL(file);
    setPreviewUrl(objectUrl);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileSelect(e.dataTransfer.files[0]);
    }
  };

  const handleClose = () => {
    if (isUploading) return;
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setSelectedFile(null);
    setPreviewUrl(null);
    setIsDragging(false);
    onClose();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selectedFile) {
      showToast.error("Please choose a new image first.");
      return;
    }

    setIsUploading(true);
    try {
      // 1. Upload image to backend/Cloudinary
      const formData = new FormData();
      formData.append("image", selectedFile);

      const uploadRes = await axios.post("/upload", formData, {
        withCredentials: true,
        headers: { "Content-Type": "multipart/form-data" },
      });

      const uploadedUrl =
        uploadRes.data?.url ||
        uploadRes.data?.secure_url ||
        uploadRes.data?.mediaUrl;

      if (!uploadedUrl) {
        throw new Error("Failed to upload image.");
      }

      // 2. Update memory cover
      const updateRes = await axios.put(
        `/social/memory/${memoryId}`,
        { coverImage: uploadedUrl },
        { withCredentials: true }
      );

      const updatedMemory =
        updateRes.data?.memory ||
        updateRes.data?.post || {
          ...memory,
          image: uploadedUrl,
          mediaUrl: uploadedUrl,
          mediaUrls: [uploadedUrl, ...(memory.mediaUrls?.slice(1) || [])],
        };

      // 3. Notify parent component immediately
      if (onCoverUpdated) {
        onCoverUpdated(updatedMemory);
      }

      // 4. Auto-dismissing toast
      showToast.success("Cover photo updated successfully!");
      handleClose();
    } catch (err) {
      console.error("Cover update error:", err);
      showToast.error(
        err.response?.data?.message || err.message || "Failed to update cover photo."
      );
    } finally {
      setIsUploading(false);
    }
  };

  return createPortal(
    <AnimatePresence>
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-slate-950/60 backdrop-blur-xs select-none">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0"
          onClick={handleClose}
        />

        <motion.div
          initial={{ scale: 0.95, opacity: 0, y: 12 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 12 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          className="relative w-full max-w-md rounded-2xl sm:rounded-3xl border border-slate-200 bg-white p-5 sm:p-6 shadow-2xl z-10 text-slate-900 overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between pb-4 border-b border-slate-100">
            <div>
              <h3 className="text-base font-bold text-slate-900 font-heading">
                Change Cover Photo
              </h3>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                Update the cover image for this Travel Memory.
              </p>
            </div>
            <button
              type="button"
              onClick={handleClose}
              disabled={isUploading}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-500 hover:bg-slate-200 hover:text-slate-900 transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <form onSubmit={handleSubmit} className="mt-4 space-y-4">
            {/* Comparison / Previews */}
            <div className="grid grid-cols-2 gap-3">
              {/* Current cover preview */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
                  Current Cover
                </span>
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                  {currentCover ? (
                    <img
                      src={currentCover}
                      alt="Current Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 text-xs">
                      No cover
                    </div>
                  )}
                </div>
              </div>

              {/* New Selected cover preview */}
              <div className="space-y-1.5">
                <span className="text-[11px] font-bold text-primary-600 uppercase tracking-wider block">
                  New Preview
                </span>
                <div className="relative aspect-[16/9] rounded-xl overflow-hidden bg-purple-50/50 border border-primary-200 flex items-center justify-center">
                  {previewUrl ? (
                    <img
                      src={previewUrl}
                      alt="New Selected Cover"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-center p-2 text-primary-400 text-xs font-medium flex flex-col items-center gap-1">
                      <ImageIcon className="w-5 h-5 opacity-60" />
                      <span>Select image</span>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Drop Zone */}
            <div
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onClick={() => fileInputRef.current?.click()}
              className={`relative cursor-pointer rounded-2xl border-2 border-dashed p-4 sm:p-5 text-center transition-all ${
                isDragging
                  ? "border-primary-500 bg-primary-50/50 scale-[0.99]"
                  : "border-slate-200 hover:border-primary-300 hover:bg-slate-50"
              }`}
            >
              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileSelect(e.target.files[0]);
                  }
                }}
              />

              <div className="flex flex-col items-center justify-center gap-1.5">
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary-50 text-primary-600">
                  <Upload className="h-5 w-5" />
                </div>
                <p className="text-xs font-bold text-slate-800">
                  {selectedFile ? selectedFile.name : "Choose an image or drag & drop"}
                </p>
                <p className="text-[11px] text-slate-400 font-medium">
                  JPG, PNG, WebP up to 10MB
                </p>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex items-center justify-end gap-2.5 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={handleClose}
                disabled={isUploading}
                className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>

              <button
                type="submit"
                disabled={!selectedFile || isUploading}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-xl bg-primary-600 hover:bg-primary-700 text-white text-xs font-bold shadow-md shadow-primary-600/20 active:scale-95 transition-all disabled:opacity-50 disabled:pointer-events-none"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Replacing Cover...</span>
                  </>
                ) : (
                  <>
                    <span>Replace Cover</span>
                    <ArrowRight className="w-3.5 h-3.5" />
                  </>
                )}
              </button>
            </div>
          </form>
        </motion.div>
      </div>
    </AnimatePresence>,
    document.body
  );
};

export default ChangeCoverModal;
