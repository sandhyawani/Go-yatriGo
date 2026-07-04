import React, { useState } from "react";
import { X, Image, MapPin } from "lucide-react";
import axios from "../../api/axios";
import { showToast } from "../../utils/showToast";
import { toast } from "sonner";

export const CreatePostModal = ({ isOpen, onClose, onPostCreated }) => {
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [title, setTitle] = useState("");
  const [caption, setCaption] = useState("");
  const [destination, setDestination] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleCreatePost = async () => {
    if (!imageFile) {
      showToast.error("Please select a memory image");
      return;
    }
    if (!title.trim()) {
      showToast.error("Please enter a title");
      return;
    }

    setIsSubmitting(true);
    toast.loading("Publishing memory...", { id: "post" });

    try {
      const formData = new FormData();
      formData.append("image", imageFile);
      formData.append("title", title);
      formData.append("caption", caption);
      formData.append("destination", destination);

      const res = await axios.post("/posts", formData, {
        headers: { "Content-Type": "multipart/form-data" },
        withCredentials: true
      });

      if (res.data.success) {
        showToast.success("Memory shared!", { id: "post" });
        if (onPostCreated) onPostCreated();
        onClose();
        // Reset states
        setImageFile(null);
        setImagePreview(null);
        setTitle("");
        setCaption("");
        setDestination("");
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to share memory", { id: "post" });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[2000] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-md rounded-3xl shadow-2xl overflow-hidden flex flex-col border border-slate-150 animate-in fade-in zoom-in-95 duration-200">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800">Post a Memory</h3>
          <button onClick={onClose} className="p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-50">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 flex-1 overflow-y-auto space-y-4 max-h-[75vh]">
          <div className="relative border-2 border-dashed border-slate-200 rounded-2xl p-4 flex flex-col items-center justify-center min-h-[160px] bg-slate-50">
            {imagePreview ? (
              <div className="relative w-full max-h-[200px] rounded-xl overflow-hidden">
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
                <div className="w-10 h-10 rounded-full bg-indigo-50 text-brand-500 flex items-center justify-center">
                  <Image className="w-5 h-5" />
                </div>
                <span className="text-xs font-bold text-slate-700">Choose a travel photo</span>
                <span className="text-[10px] text-slate-400">Up to 10MB</span>
                <input type="file" accept="image/*" className="hidden" onChange={handleImageChange} />
              </label>
            )}
          </div>

          <div className="space-y-3">
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Give this memory a title..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-500"
            />
            <div className="relative">
              <input
                type="text"
                value={destination}
                onChange={(e) => setDestination(e.target.value)}
                placeholder="Where was this? (e.g. Paris, France)"
                className="w-full pl-9 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-500"
              />
              <MapPin className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
            </div>
            <textarea
              value={caption}
              onChange={(e) => setCaption(e.target.value)}
              placeholder="Tell us about your experience..."
              className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs outline-none focus:border-brand-500 resize-none"
              rows={3}
            />
          </div>
        </div>

        <div className="px-5 py-4 bg-slate-50 border-t border-slate-100 flex justify-end gap-2 shrink-0">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-150 rounded-xl transition-colors"
          >
            Cancel
          </button>
          <button
            onClick={handleCreatePost}
            disabled={isSubmitting}
            className="px-4 py-2 bg-brand-500 text-white text-xs font-bold rounded-xl hover:bg-brand-600 active:scale-[0.98] transition-all disabled:opacity-50"
          >
            Publish Memory
          </button>
        </div>
      </div>
    </div>
  );
};
export default CreatePostModal;
