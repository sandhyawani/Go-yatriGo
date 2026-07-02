import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  Upload,
  X,
  Camera,
  Film,
  Sparkles,
  Check,
  FileText,
} from "lucide-react";
import axiosInstance from "../../api/axios";

const JourneyGalleryView = ({ journeyId }) => {
  const [gallery, setGallery] = useState([]);
  const [filter, setFilter] = useState("all"); // all, photo, video
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Upload modal state
  const [selectedFile, setSelectedFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [detectedType, setDetectedType] = useState("image"); // 'image' or 'video'
  const [caption, setCaption] = useState("");
  const [isDragging, setIsDragging] = useState(false);
  const [loading, setLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [uploadSuccess, setUploadSuccess] = useState(false);

  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);

  const fetchGallery = useCallback(() => {
    if (!journeyId) return;
    axiosInstance
      .get(`/journeys/${journeyId}/gallery`)
      .then((res) => {
        if (res.data?.success) setGallery(res.data.gallery);
      })
      .catch((err) => console.error("Error fetching gallery:", err));
  }, [journeyId]);

  useEffect(() => {
    fetchGallery();
  }, [fetchGallery]);

  const resetForm = () => {
    setSelectedFile(null);
    setPreviewUrl("");
    setDetectedType("image");
    setCaption("");
    setLoading(false);
    setUploadProgress(0);
    setUploadSuccess(false);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleFileSelect = (file) => {
    if (!file) return;

    if (file.size > 25 * 1024 * 1024) {
      alert("File size exceeds 25 MB limit.");
      return;
    }

    const isVideo =
      file.type?.startsWith("video/") ||
      file.name?.toLowerCase().match(/\.(mp4|mov|avi|mkv|webm|flv)$/i);
    const type = isVideo ? "video" : "image";

    setSelectedFile(file);
    setDetectedType(type);

    if (isVideo) {
      // Videos render fine with blob URLs since <video> doesn't rely on canvas decoding
      setPreviewUrl(URL.createObjectURL(file));
    } else {
      // Use FileReader instead of createObjectURL — blob URLs for images can
      // fail to decode/show on mobile browsers, leaving a blank preview
      const reader = new FileReader();
      reader.onload = (ev) => setPreviewUrl(ev.target.result);
      reader.onerror = () => setPreviewUrl(URL.createObjectURL(file)); // fallback
      reader.readAsDataURL(file);
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes === 0) return "0 Bytes";
    const k = 1024;
    const sizes = ["Bytes", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + " " + sizes[i];
  };

  const handleUpload = async (e) => {
    if (e) e.preventDefault();
    if (!selectedFile) return;
    setLoading(true);
    setUploadProgress(10);

    try {
      let uploadedUrl = "";
      if (detectedType === "video") {
        const formData = new FormData();
        formData.append("image", selectedFile);
        const uploadRes = await axiosInstance.post("/upload", formData, {
          headers: { "Content-Type": "multipart/form-data" },
          onUploadProgress: (progressEvent) => {
            if (progressEvent.total) {
              const percent = Math.round(
                (progressEvent.loaded * 70) / progressEvent.total,
              );
              setUploadProgress(percent);
            }
          },
        });
        if (!uploadRes.data?.success) throw new Error("Video upload failed");
        uploadedUrl = uploadRes.data.url;
      } else {
        const base64Data = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = reject;
          reader.readAsDataURL(selectedFile);
        });
        setUploadProgress(40);
        const uploadRes = await axiosInstance.post(
          "/upload/base64",
          {
            data: base64Data,
            folder: "Go YatriGo_uploads",
          },
          {
            onUploadProgress: (progressEvent) => {
              if (progressEvent.total) {
                const percent =
                  40 +
                  Math.round((progressEvent.loaded * 40) / progressEvent.total);
                setUploadProgress(percent);
              }
            },
          },
        );
        if (!uploadRes.data?.success) throw new Error("Image upload failed");
        uploadedUrl = uploadRes.data.url;
      }

      setUploadProgress(85);

      const res = await axiosInstance.post(`/journeys/${journeyId}/gallery`, {
        mediaUrl: uploadedUrl,
        mediaType: detectedType,
        itemType: detectedType === "video" ? "video" : "photo",
        caption: caption.trim(),
      });

      if (res.data?.success) {
        setUploadProgress(100);
        setUploadSuccess(true);
        setGallery((prev) => [res.data.item, ...prev]);

        setTimeout(() => {
          setIsModalOpen(false);
          resetForm();
        }, 1000);
      }
    } catch (err) {
      console.error("Upload error:", err);
      alert(
        err.response?.data?.message || err.message || "Failed to upload memory",
      );
      setLoading(false);
      setUploadProgress(0);
    }
  };

  const filteredItems =
    filter === "all"
      ? gallery
      : gallery.filter(
          (item) => item.itemType === filter || item.mediaType === filter,
        );

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Top Filter & Upload Bar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white dark:bg-slate-900 p-6 rounded-3xl border border-slate-200 dark:border-slate-800 shadow-sm">
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0 no-scrollbar">
          {["all", "photo", "video"].map((tab) => (
            <button
              key={tab}
              onClick={() => setFilter(tab)}
              className={`px-4 py-2 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                filter === tab
                  ? "bg-[#6C4DF6] text-white shadow-md shadow-[#6C4DF6]/30/20"
                  : "bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-400 hover:bg-slate-200"
              }`}
            >
              {tab === "all" ? `🖼️ All Media (${gallery.length})` : tab}
            </button>
          ))}
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 px-5 py-2.5 rounded-2xl bg-[#6C4DF6] hover:bg-[#5b3ee0] text-white text-xs font-bold shadow-md shadow-[#6C4DF6]/25 transition-all active:scale-95 whitespace-nowrap"
        >
          <Upload className="w-4 h-4" /> Direct Memory Upload
        </button>
      </div>

      {/* Gallery Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
        {filteredItems.length === 0 ? (
          <div className="col-span-full py-20 text-center bg-white dark:bg-slate-900 rounded-3xl border border-slate-200 dark:border-slate-800">
            <Camera className="w-12 h-12 mx-auto mb-3 text-slate-300 dark:text-slate-700" />
            <h4 className="text-base font-bold text-slate-600 dark:text-slate-300">
              No media captured yet
            </h4>
            <p className="text-xs text-slate-400 mt-1">
              Photos and videos shared in this journey will appear here.
            </p>
          </div>
        ) : (
          filteredItems.map((item) => (
            <div
              key={item._id}
              className="group relative aspect-square rounded-3xl overflow-hidden bg-slate-100 dark:bg-slate-800 border border-slate-200 dark:border-slate-800 shadow-sm hover:shadow-xl transition-all duration-300"
            >
              {item.mediaType === "video" ? (
                <div className="w-full h-full relative flex items-center justify-center bg-[#5b3ee0]">
                  <video
                    src={item.mediaUrl}
                    className="w-full h-full object-cover opacity-80"
                    muted
                    playsInline
                  />
                  <Film className="w-8 h-8 text-white absolute" />
                </div>
              ) : (
                <img
                  src={item.mediaUrl}
                  alt={item.caption || "Gallery item"}
                  className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                />
              )}

              {/* Hover Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-slate-950/90 via-slate-950/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 p-4 flex flex-col justify-end">
                <span className="text-[10px] uppercase font-black px-2 py-0.5 rounded bg-[#6C4DF6] text-white w-max mb-1.5">
                  {item.itemType}
                </span>
                <p className="text-xs font-bold text-white line-clamp-2">
                  {item.caption || "Shared Memory Capture"}
                </p>
                <div className="flex items-center justify-between text-[10px] text-slate-300 mt-2 pt-2 border-t border-white/10">
                  <span>By {item.uploaderName}</span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* Sleek WOW Upload Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/70 backdrop-blur-md animate-fade-in">
          <div className="w-full max-w-lg bg-white dark:bg-slate-900 rounded-3xl shadow-2xl border border-slate-200/80 dark:border-slate-800 overflow-hidden transform transition-all max-h-[90vh] flex flex-col">
            {/* Header Banner */}
            <div className="relative bg-purple-50 dark:bg-purple-950/40 p-5 border-b border-purple-100 dark:border-purple-900/50 flex items-center justify-between shrink-0">
              <div className="flex items-center gap-3.5">
                <div className="w-10 h-10 rounded-2xl bg-[#6C4DF6] text-white flex items-center justify-center shadow-lg shadow-[#6C4DF6]/30">
                  <Sparkles className="w-5 h-5 animate-pulse" />
                </div>
                <div>
                  <h3 className="text-base font-black text-slate-900 dark:text-white tracking-tight">
                    Add Trip Memory
                  </h3>
                  <p className="text-xs font-medium text-slate-500 dark:text-slate-400">
                    Upload direct captures to your shared journey gallery
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsModalOpen(false);
                  resetForm();
                }}
                className="w-8 h-8 rounded-full bg-white/80 dark:bg-slate-800/80 hover:bg-white dark:hover:bg-slate-700 text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 flex items-center justify-center transition-all shadow-xs"
              >
                <X className="w-4 h-4 stroke-[2.5]" />
              </button>
            </div>

            <form
              onSubmit={handleUpload}
              className="flex flex-col flex-1 overflow-hidden min-h-0"
            >
              <div className="p-5 space-y-4 overflow-y-auto flex-1 no-scrollbar">
                {/* Upload Zone / Live Preview */}
                {!selectedFile ? (
                  <div
                    onDragOver={(e) => {
                      e.preventDefault();
                      setIsDragging(true);
                    }}
                    onDragLeave={() => setIsDragging(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setIsDragging(false);
                      const droppedFile = e.dataTransfer.files?.[0];
                      if (droppedFile) handleFileSelect(droppedFile);
                    }}
                    onClick={() => fileInputRef.current?.click()}
                    className={`group relative w-full py-8 px-5 border-2 border-dashed rounded-2xl cursor-pointer flex flex-col items-center justify-center text-center transition-all duration-300 ${
                      isDragging
                        ? "border-[#6C4DF6] bg-purple-50 dark:bg-purple-950/30 scale-[0.99]"
                        : "border-slate-200 dark:border-slate-800 hover:border-[#6C4DF6]/60 hover:bg-purple-50/20 dark:hover:bg-slate-800/50"
                    }`}
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*,video/*,.heic,.heif"
                      onChange={(e) => handleFileSelect(e.target.files?.[0])}
                      className="hidden"
                    />
                    {/* Camera input — direct camera capture on mobile */}
                    <input
                      ref={cameraInputRef}
                      type="file"
                      accept="image/*,video/*"
                      capture="environment"
                      onChange={(e) => handleFileSelect(e.target.files?.[0])}
                      className="hidden"
                    />
                    <div className="w-14 h-14 rounded-2xl bg-purple-100 dark:bg-purple-900/40 text-[#6C4DF6] group-hover:scale-110 transition-transform duration-300 flex items-center justify-center mb-3 shadow-xs">
                      <Upload className="w-7 h-7" />
                    </div>
                    <h4 className="text-sm font-extrabold text-slate-800 dark:text-white mb-1">
                      Upload Photo or Video
                    </h4>
                    <p className="text-xs text-slate-500 dark:text-slate-400 mb-3.5">
                      Drag & Drop your media here or{" "}
                      <span className="text-[#6C4DF6] font-bold underline decoration-dotted underline-offset-4">
                        browse device
                      </span>
                    </p>
                    <div className="inline-flex items-center gap-2 px-3 py-1 rounded-lg bg-slate-100 dark:bg-slate-800 text-[10px] font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider">
                      <span>JPG • PNG • HEIC • WEBP • MP4</span>
                      <span>•</span>
                      <span>Max 25 MB</span>
                    </div>

                    {/* Camera and Gallery buttons for mobile */}
                    <div className="mt-4 flex gap-3 w-full sm:hidden">
                      <button
                        type="button"
                        onClick={() => cameraInputRef.current?.click()}
                        className="flex-1 py-3 px-4 rounded-xl font-bold text-[#6C4DF6] border-2 border-[#6C4DF6]/30 bg-[#6C4DF6]/5 hover:bg-[#6C4DF6]/10 transition-all flex items-center justify-center gap-2"
                      >
                        📷 Camera
                      </button>
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        className="flex-1 py-3 px-4 rounded-xl font-bold text-white bg-gradient-to-r from-violet-600 to-purple-600 shadow-md hover:-translate-y-0.5 transition-all"
                      >
                        🖼️ Gallery
                      </button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {/* Large Preview */}
                    <div className="relative w-full rounded-2xl overflow-hidden bg-slate-900 border border-slate-200 dark:border-slate-700" style={{ minHeight: "220px" }}>
                      {detectedType === "video" ? (
                        <video
                          key={previewUrl}
                          src={previewUrl}
                          controls
                          autoPlay
                          muted
                          playsInline
                          className="w-full max-h-[280px] object-contain bg-black"
                          style={{ minHeight: "200px" }}
                        />
                      ) : (
                        <img
                          src={previewUrl}
                          alt="Preview"
                          className="w-full object-contain max-h-[280px] bg-slate-100"
                          style={{ minHeight: "200px", display: "block" }}
                        />
                      )}
                      {/* Remove button overlay */}
                      {!loading && !uploadSuccess && (
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedFile(null);
                            setPreviewUrl("");
                          }}
                          className="absolute top-2 right-2 w-8 h-8 rounded-full bg-black/60 hover:bg-red-600 text-white flex items-center justify-center transition-all"
                          title="Remove file"
                        >
                          <X className="w-4 h-4" />
                        </button>
                      )}
                    </div>

                    {/* File info row */}
                    <div className="flex items-center gap-2 px-3 py-2 bg-slate-50 dark:bg-slate-800/60 rounded-xl border border-slate-200 dark:border-slate-700">
                      <span className="text-base">{detectedType === "video" ? "🎥" : "📷"}</span>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-slate-800 dark:text-white truncate">{selectedFile.name}</p>
                        <p className="text-[11px] text-[#6C4DF6] font-semibold">
                          {formatFileSize(selectedFile.size)} · {detectedType === "video" ? "Video Clip" : "Photo"}
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Caption Input */}
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="block text-xs font-bold text-slate-700 dark:text-slate-300">
                      Memory Caption{" "}
                      <span className="text-slate-400 font-normal">
                        (Optional)
                      </span>
                    </label>
                    <span
                      className={`text-[11px] font-bold ${caption.length > 250 ? "text-amber-500" : "text-slate-400"}`}
                    >
                      {caption.length} / 300
                    </span>
                  </div>
                  <div className="relative">
                    <div className="absolute top-3 left-3.5 pointer-events-none text-slate-400">
                      <FileText className="w-4 h-4" />
                    </div>
                    <textarea
                      rows={2}
                      maxLength={300}
                      disabled={loading || uploadSuccess}
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Share the story or feeling behind this memory..."
                      className="w-full pl-10 pr-4 py-2.5 rounded-2xl border border-slate-200 dark:border-slate-800 bg-slate-50/50 dark:bg-slate-800/50 focus:bg-white dark:focus:bg-slate-900 text-xs font-medium text-slate-800 dark:text-slate-100 outline-none focus:border-[#6C4DF6] focus:ring-2 focus:ring-[#6C4DF6]/20 transition-all resize-none"
                    />
                  </div>
                </div>

                {/* Upload Progress */}
                {loading && (
                  <div className="p-4 bg-purple-50 dark:bg-purple-950/20 rounded-2xl border border-purple-200/50 dark:border-purple-800/30 space-y-2 animate-fade-in">
                    <div className="flex items-center justify-between text-xs font-extrabold text-[#6C4DF6]">
                      <span>Uploading...</span>
                      <span>{uploadProgress}%</span>
                    </div>
                    <div className="w-full h-2 bg-purple-100 dark:bg-purple-900/50 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-[#6C4DF6] transition-all duration-300 rounded-full"
                        style={{ width: `${uploadProgress}%` }}
                      />
                    </div>
                  </div>
                )}

                {/* Success State */}
                {uploadSuccess && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/30 rounded-2xl border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center gap-2.5 text-emerald-600 dark:text-emerald-400 text-xs font-black animate-scale-in">
                    <Check className="w-5 h-5 stroke-[3]" />
                    <span>✅ Memory uploaded successfully!</span>
                  </div>
                )}
              </div>

              {/* Sticky Modal Actions Footer */}
              <div className="p-4 px-5 bg-slate-50/80 dark:bg-slate-900/80 backdrop-blur-md border-t border-slate-100 dark:border-slate-800 flex items-center justify-end gap-3 shrink-0">
                <button
                  type="button"
                  disabled={loading || uploadSuccess}
                  onClick={() => {
                    setIsModalOpen(false);
                    resetForm();
                  }}
                  className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-400 hover:bg-slate-200/60 dark:hover:bg-slate-800 disabled:opacity-50 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!selectedFile || loading || uploadSuccess}
                  className="flex items-center gap-2 px-6 py-2.5 rounded-xl bg-[#6C4DF6] hover:bg-[#5b3ee0] disabled:opacity-50 text-white text-xs font-extrabold shadow-md shadow-[#6C4DF6]/25 transition-all active:scale-95 cursor-pointer disabled:cursor-not-allowed"
                >
                  {loading ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-4 h-4 stroke-[2.5]" />
                      <span>📤 Upload Memory</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default JourneyGalleryView;