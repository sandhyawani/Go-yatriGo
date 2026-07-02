import React, { useState } from "react";
import { X, Image, FileText } from "lucide-react";
import axios from "../../api/axios";
import { showToast } from "../../utils/showToast";
import { toast } from "sonner";

export const CreateStoryModal = ({ isOpen, onClose, onStoryCreated, onSuccess }) => {
  const [storyType, setStoryType] = useState("image"); // image | text
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [caption, setCaption] = useState("");
  const [textContent, setTextContent] = useState("");
  const [textBgColor, setTextBgColor] = useState("#6C4DF6");
  const [textColor, setTextColor] = useState("#FFFFFF");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreateStory = async () => {
    if (storyType === "image" && !imageFile) {
      showToast.error("Please select an image");
      return;
    }
    if (storyType === "text" && !textContent.trim()) {
      showToast.error("Please enter some text");
      return;
    }

    setIsSubmitting(true);
    toast.loading("Uploading story...", { id: "story" });

    try {
      const formData = new FormData();
      formData.append("type", storyType);
      
      if (storyType === "image") {
        formData.append("image", imageFile);
        formData.append("caption", caption);
      } else {
        formData.append("text", textContent);
        formData.append("bgColor", textBgColor);
        formData.append("textColor", textColor);
      }

      const res = await axios.post("/stories", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
      });

      if (res.data.success) {
        showToast.success("Story shared!", { id: "story" });
        if (onStoryCreated) onStoryCreated();
        if (onSuccess) onSuccess();
        onClose();
        // Reset states
        setImageFile(null);
        setImagePreview(null);
        setCaption("");
        setTextContent("");
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to share story", { id: "story" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-150 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Share a Story</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4 max-h-[75vh]">
          {/* Story Type Tabs */}
          <div className="flex bg-slate-100 p-0.5 rounded-xl">
            <button
              onClick={() => setStoryType("image")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                storyType === "image" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
              }`}
            >
              <Image className="w-3.5 h-3.5" /> Photo Story
            </button>
            <button
              onClick={() => setStoryType("text")}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all flex items-center justify-center gap-1.5 ${
                storyType === "text" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500"
              }`}
            >
              <FileText className="w-3.5 h-3.5" /> Text Story
            </button>
          </div>

          {storyType === "image" ? (
            <div className="space-y-4">
              <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[160px] bg-slate-50">
                {imagePreview ? (
                  <div className="relative w-full max-h-[180px] rounded-xl overflow-hidden">
                    <img src={imagePreview} alt="Preview" className="w-full h-full object-cover mx-auto" />
                    <button
                      onClick={() => {
                        setImageFile(null);
                        setImagePreview(null);
                      }}
                      className="absolute top-2 right-2 p-1.5 bg-black/50 text-white rounded-full hover:bg-black/70"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ) : (
                  <label className="cursor-pointer flex flex-col items-center gap-1.5">
                    <div className="w-10 h-10 rounded-full bg-indigo-50 text-[#6C4DF6] flex items-center justify-center">
                      <Image className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-700">Choose a photo</span>
                    <span className="text-[10px] text-slate-400">Up to 10MB</span>
                    <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
                  </label>
                )}
              </div>
              <input
                type="text"
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Add a caption..."
                className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-[#6C4DF6]"
              />
            </div>
          ) : (
            <div className="space-y-4">
              <div
                className="rounded-2xl p-6 min-h-[160px] flex items-center justify-center text-center shadow-inner relative"
                style={{ backgroundColor: textBgColor }}
              >
                <textarea
                  value={textContent}
                  onChange={(e) => setTextContent(e.target.value)}
                  placeholder="Type your story..."
                  className="bg-transparent border-none text-center outline-none w-full text-lg font-bold resize-none placeholder-white/60 cs max-h-[120px]"
                  style={{ color: textColor }}
                  rows={3}
                />
              </div>

              {/* Color selectors */}
              <div className="flex items-center gap-2 overflow-x-auto py-1">
                {["#6C4DF6", "#10B981", "#3B82F6", "#EF4444", "#F59E0B", "#EC4899", "#111827"].map((color) => (
                  <button
                    key={color}
                    onClick={() => setTextBgColor(color)}
                    className={`w-6 h-6 rounded-full shrink-0 border-2 transition-all ${
                      textBgColor === color ? "border-slate-800 scale-110" : "border-transparent"
                    }`}
                    style={{ backgroundColor: color }}
                  />
                ))}
              </div>
            </div>
          )}
        </div>

        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-150 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreateStory}
            disabled={isSubmitting}
            className="px-4 py-2 bg-[#6C4DF6] text-white text-xs font-bold rounded-xl hover:bg-[#5b3ee0] active:scale-[0.98] transition-all disabled:opacity-50"
          >
            Share Story
          </button>
        </div>
      </div>
    </div>
  );
};
export default CreateStoryModal;
