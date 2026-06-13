import { showToast } from "../../utils/showToast";
// import React, { useEffect, useRef, useState } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { X, ArrowLeft, ImagePlus, Loader2, Smile, MapPin, Send, Sparkles } from "lucide-react";
// import axios from "../../api/axios";
// import { showToast } from "../../utils/showToast";
// import Cropper from "react-easy-crop";
// import getCroppedImg from "../../utils/cropImage";
// import EmojiPicker from 'emoji-picker-react';


// const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
// const MAX_VIDEO_SIZE = 25 * 1024 * 1024;

// const CreatePostModal = ({ isOpen, onClose, onSuccess, user }) => {
//   const [file, setFile] = useState(null);
//   const [preview, setPreview] = useState("");
//   const [caption, setCaption] = useState("");
//   const [loading, setLoading] = useState(false);
//   const [isDragging, setIsDragging] = useState(false);
//   const fileInputRef = useRef(null);
//   const [imgError, setImgError] = useState(false);

//   const [mediaType, setMediaType] = useState("image");
//   const [showEmojiPicker, setShowEmojiPicker] = useState(false);
//   const [location, setLocation] = useState("");
//   const [showLocationPicker, setShowLocationPicker] = useState(false);
//   const [locationQuery, setLocationQuery] = useState("");
//   const [locationResults, setLocationResults] = useState([]);
//   const [searchingLocation, setSearchingLocation] = useState(false);


//   const [step, setStep] = useState("upload");
//   const [crop, setCrop] = useState({ x: 0, y: 0 });
//   const [zoom, setZoom] = useState(1);
//   const [aspect, setAspect] = useState(4 / 5);
//   const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
//   const [croppedImage, setCroppedImage] = useState(null);

//   const currentUser =
//     user ||
//     JSON.parse(localStorage.getItem("user") || "null") ||
//     JSON.parse(localStorage.getItem("currentUser") || "null");

//   useEffect(() => {
//     return () => {
//       if (preview) URL.revokeObjectURL(preview);
//     };
//   }, [preview]);

//   const validateFile = (selectedFile) => {
//     if (!selectedFile) return false;
//     if (selectedFile.type.startsWith("video/")) {
//       if (selectedFile.size > MAX_VIDEO_SIZE) {
//         showToast.error("Video size must be less than 25MB.");
//         return false;
//       }
//     } else if (selectedFile.type.startsWith("image/")) {
//       if (selectedFile.size > MAX_IMAGE_SIZE) {
//         showToast.error("Image size must be less than 10MB.");
//         return false;
//       }
//     } else {
//       showToast.error("Only image or video files are allowed.");
//       return false;
//     }
//     return true;
//   };

//   const setSelectedFile = (selectedFile) => {
//     if (!validateFile(selectedFile)) return;
//     if (preview) URL.revokeObjectURL(preview);

//     setFile(selectedFile);
//     setPreview(URL.createObjectURL(selectedFile));
    
//     if (selectedFile.type.startsWith("video/")) {
//       setMediaType("video");
//       setStep("caption");
//     } else {
//       setMediaType("image");
//       setStep("crop");
//     }
//   };

//   const handleFileChange = (e) => {
//     const selectedFile = e.target.files?.[0];
//     setSelectedFile(selectedFile);
//   };

//   const handleDragOver = (e) => {
//     e.preventDefault();
//     setIsDragging(true);
//   };

//   const handleDragLeave = () => {
//     setIsDragging(false);
//   };

//   const handleDrop = (e) => {
//     e.preventDefault();
//     setIsDragging(false);

//     const droppedFile = e.dataTransfer.files?.[0];
//     setSelectedFile(droppedFile);
//   };

//   const resetState = () => {
//     if (preview) URL.revokeObjectURL(preview);
//     setFile(null);
//     setMediaType("image");
//     setShowEmojiPicker(false);
//     setLocation("");
//     setLocationQuery("");
//     setLocationResults([]);
//     setShowLocationPicker(false);
//     setPreview("");
//     setCaption("");
//     setLoading(false);
//     setIsDragging(false);
//     setStep("upload");
//     setCrop({ x: 0, y: 0 });
//     setZoom(1);
//     setAspect(4 / 5);
//     setCroppedAreaPixels(null);
//     setCroppedImage(null);
//   };

//   const handleClose = () => {
//     if (loading) return;
//     resetState();
//     onClose();
//   };


//   const handleLocationSearch = async (query) => {
//     setLocationQuery(query);
//     if (!query.trim()) {
//       setLocationResults([]);
//       return;
//     }
//     setSearchingLocation(true);
//     try {
//       const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}`);
//       const data = await res.json();
//       setLocationResults(data.slice(0, 5));
//     } catch (err) {
//       console.error(err);
//     } finally {
//       setSearchingLocation(false);
//     }
//   };


//   const convertToBase64 = (selectedFile) => {
//     return new Promise((resolve, reject) => {
//       const reader = new FileReader();
//       reader.readAsDataURL(selectedFile);
//       reader.onload = () => resolve(reader.result);
//       reader.onerror = (error) => reject(error);
//     });
//   };

//   const handleSubmit = async () => {
//     if (mediaType === "image" && !croppedImage) {
//       showToast.error("Please add and crop a photo.");
//       return;
//     }

//     if (!caption.trim()) {
//       showToast.error("Please write a caption.");
//       return;
//     }

//     setLoading(true);

//     try {
//       let finalMediaUrl = "";
//       if (mediaType === "video") {
//         const formData = new FormData();
//         formData.append("image", file);
//         const uploadRes = await axios.post("/upload", formData, {
//           withCredentials: true
//         });
//         if (!uploadRes.data.success) throw new Error("Video upload failed");
//         finalMediaUrl = uploadRes.data.url;
//       } else {
//         finalMediaUrl = croppedImage;
//       }

//       const payload = {
//         caption: caption.trim(),
//         image: finalMediaUrl,
//         mediaUrl: finalMediaUrl,
//         mediaType: mediaType,
//         location: location,
//         title: "",
//         tags: [],
//       };

//       const res = await axios.post("/social/memory", payload, {
//         withCredentials: true,
//       });

//       if (res.data?.success) {
//         showToast.success("Memory shared successfully!");
//         onSuccess?.(res.data.post || res.data.memory);
//         handleClose();
//       } else {
//         showToast.error(res.data?.message || "Failed to create post.");
//       }
//     } catch (error) {
//       console.error("Post creation error:", error);
//       showToast.error(error.response?.data?.message || "Failed to create post.");
//     } finally {
//       setLoading(false);
//     }
//   };

//   if (!isOpen) return null;

//   const avatar =
//     currentUser?.profilePic ||
//     currentUser?.img ||
//     currentUser?.avatar ||
//     currentUser?.photo;

//   const username =
//     currentUser?.username ||
//     currentUser?.name ||
//     currentUser?.fullname ||
//     "Traveler";

//   return (
//     <AnimatePresence>
//       <div className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-6">
//         <motion.div
//           initial={{ opacity: 0 }}
//           animate={{ opacity: 1 }}
//           exit={{ opacity: 0 }}
//           onClick={handleClose}
//           className="absolute inset-0 bg-slate-950/45 backdrop-blur-md"
//         />

//         <motion.div
//           initial={{ opacity: 0, y: 20, scale: 0.96 }}
//           animate={{ opacity: 1, y: 0, scale: 1 }}
//           exit={{ opacity: 0, y: 20, scale: 0.96 }}
//           transition={{ duration: 0.25, ease: "easeOut" }}
//           className="relative flex w-full max-w-[900px] max-h-[92vh] min-h-[560px] flex-col overflow-hidden rounded-[32px] border border-white/50 bg-white/95 text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl"
//         >
//           <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/70 px-4">
//             <div className="flex flex-1 justify-start">
//               {step === "crop" ? (
//                 <button
//                   onClick={() => {
//                     setStep("upload");
//                     if (preview) URL.revokeObjectURL(preview);
//                     setPreview("");
//                     setFile(null);
//                   }}
//                   className="rounded-full p-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-violet-600 active:scale-95"
//                   aria-label="Back"
//                 >
//                   <ArrowLeft className="h-5 w-5" />
//                 </button>
//               ) : step === "caption" ? (
//                 <button
//                   onClick={() => setStep("crop")}
//                   className="rounded-full p-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-violet-600 active:scale-95"
//                   aria-label="Back"
//                 >
//                   <ArrowLeft className="h-5 w-5" />
//                 </button>
//               ) : null}
//             </div>

//             <div className="flex-1 text-center">
//               <h3 className="font-[Outfit] text-[15px] font-extrabold text-slate-950">
//                 {step === "upload" && "Create New Post"}
//                 {step === "crop" && "Crop Image"}
//                 {step === "caption" && "New Travel Memory"}
//               </h3>
//             </div>

//             <div className="flex flex-1 justify-end">
//               {step === "crop" ? (
//                 <button
//                   onClick={async () => {
//                     try {
//                       const croppedBase64 = await getCroppedImg(
//                         preview,
//                         croppedAreaPixels
//                       );
//                       setCroppedImage(croppedBase64);
//                       setStep("caption");
//                     } catch (e) {
//                       console.error(e);
//                       showToast.error("Failed to crop image.");
//                     }
//                   }}
//                   className="text-[14px] font-bold text-violet-600 transition-all hover:text-violet-700 active:scale-95"
//                 >
//                   Apply Crop
//                 </button>
//               ) : step === "caption" ? (
//                 <button
//                   onClick={handleSubmit}
//                   disabled={loading}
//                   className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-1.5 text-[13px] font-bold text-white transition-all hover:bg-violet-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
//                 >
//                   {loading ? (
//                     <Loader2 className="h-4 w-4 animate-spin" />
//                   ) : (
//                     "Share"
//                   )}
//                 </button>
//               ) : (
//                 <button
//                   onClick={handleClose}
//                   className="rounded-full p-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
//                   aria-label="Close"
//                 >
//                   <X className="h-5 w-5" />
//                 </button>
//               )}
//             </div>
//           </div>

//           <div
//             className="relative flex flex-1 flex-col overflow-hidden"
//             onDragOver={handleDragOver}
//             onDragLeave={handleDragLeave}
//             onDrop={handleDrop}
//           >
//             {step === "upload" && (
//               <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
//                 <div
//                   className={`flex min-h-[420px] w-full flex-col items-center justify-center rounded-[28px] border-2 border-dashed p-8 text-center transition-all ${
//                     isDragging
//                       ? "border-violet-500 bg-violet-50 shadow-[0_18px_45px_rgba(139,92,246,0.18)]"
//                       : "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-rose-50"
//                   }`}
//                 >
//                   <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[28px] bg-white shadow-xl shadow-violet-500/10">
//                     <ImagePlus className="h-11 w-11 text-violet-600" />
//                   </div>

//                   <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-violet-600 shadow-sm">
//                     <Sparkles className="h-4 w-4" />
//                     Travel Memory
//                   </div>

//                   <h2 className="font-[Outfit] text-2xl font-extrabold text-slate-950 sm:text-3xl">
//                     Share your travel memory
//                   </h2>

//                   <p className="mt-3 max-w-md text-sm font-medium leading-6 text-slate-500">
//                     Upload a photo or video from your latest adventure and inspire other
//                     travelers on Go Go YatriGo.
//                   </p>

//                   <button
//                     onClick={() => fileInputRef.current?.click()}
//                     className="mt-7 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-500/40 active:scale-95"
//                   >
//                     Select Media
//                   </button>

//                   <p className="mt-4 text-xs font-semibold text-slate-400">
//                     Drag & drop • JPG, PNG (10MB) • MP4, WEBM (25MB)
//                   </p>

//                   <input
//                     type="file"
//                     ref={fileInputRef}
//                     className="hidden"
//                     accept="image/*,video/*"
//                     onChange={handleFileChange}
//                   />
//                 </div>
//               </div>
//             )}

//             {step === "crop" && (
//               <div className="flex flex-col flex-1 h-full bg-slate-950">
//                 <div className="relative flex-1 min-h-[300px] md:min-h-[400px]">
//                   <Cropper
//                     image={preview}
//                     crop={crop}
//                     zoom={zoom}
//                     aspect={aspect}
//                     onCropChange={setCrop}
//                     onCropComplete={(croppedArea, croppedAreaPixels) =>
//                       setCroppedAreaPixels(croppedAreaPixels)
//                     }
//                     onZoomChange={setZoom}
//                     style={{
//                       containerStyle: { backgroundColor: "#020617" },
//                     }}
//                   />
//                 </div>
//                 <div className="flex flex-col items-center justify-center p-5 bg-white border-t border-slate-200">
//                   <div className="flex flex-wrap items-center justify-center gap-3 mb-4">
//                     <button
//                       onClick={() => setAspect(4 / 5)}
//                       className={`text-[13px] font-bold px-4 py-2 rounded-full transition-all active:scale-95 ${
//                         aspect === 4 / 5
//                           ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
//                           : "bg-slate-100 text-slate-600 hover:bg-slate-200"
//                       }`}
//                     >
//                       Portrait 4:5
//                     </button>
//                     <button
//                       onClick={() => setAspect(1)}
//                       className={`text-[13px] font-bold px-4 py-2 rounded-full transition-all active:scale-95 ${
//                         aspect === 1
//                           ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
//                           : "bg-slate-100 text-slate-600 hover:bg-slate-200"
//                       }`}
//                     >
//                       Square 1:1
//                     </button>
//                     <button
//                       onClick={() => setAspect(9 / 16)}
//                       className={`text-[13px] font-bold px-4 py-2 rounded-full transition-all active:scale-95 ${
//                         aspect === 9 / 16
//                           ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
//                           : "bg-slate-100 text-slate-600 hover:bg-slate-200"
//                       }`}
//                     >
//                       Story 9:16
//                     </button>
//                     <button
//                       onClick={() => {
//                         setCrop({ x: 0, y: 0 });
//                         setZoom(1);
//                       }}
//                       className="text-[13px] font-bold px-4 py-2 rounded-full bg-slate-100 text-slate-600 hover:bg-slate-200 transition-all active:scale-95"
//                     >
//                       Reset
//                     </button>
//                   </div>
//                   <input
//                     type="range"
//                     value={zoom}
//                     min={1}
//                     max={3}
//                     step={0.1}
//                     onChange={(e) => setZoom(e.target.value)}
//                     className="w-full max-w-sm h-1.5 bg-slate-200 rounded-lg appearance-none cursor-pointer accent-violet-600"
//                   />
//                 </div>
//               </div>
//             )}

//             {step === "caption" && (
//               <div className="grid flex-1 grid-cols-1 overflow-y-auto md:grid-cols-[62%_38%]">
//                 <div className="flex min-h-[300px] items-center justify-center bg-slate-50 md:min-h-[500px]">
//                   {mediaType === "video" ? (
//                     <video 
//                       src={preview} 
//                       controls 
//                       className="max-h-[300px] w-full object-contain md:max-h-[500px] md:h-full bg-black" 
//                     />
//                   ) : (
//                     <img
//                       src={croppedImage || preview}
//                       alt="Preview"
//                       className="max-h-[300px] w-full object-contain md:max-h-[500px] md:h-full"
//                     />
//                   )}
//                 </div>

//                 <div className="flex min-h-[360px] flex-col bg-white p-5 md:p-6 md:pl-5">
//                   <div className="mb-5 flex items-center gap-3">
//                     {avatar && !imgError ? (
//                       <img
//                         src={avatar}
//                         alt={username}
//                         onError={() => setImgError(true)}
//                         className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-violet-100"
//                       />
//                     ) : (
//                       <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-extrabold text-white ring-2 ring-violet-100">
//                         {username?.charAt(0)?.toUpperCase() || "T"}
//                       </div>
//                     )}

//                     <div>
//                       <h4 className="text-sm font-extrabold text-slate-950">
//                         {username}
//                       </h4>
//                       <p className="text-xs font-semibold text-slate-400">
//                         Posting publicly
//                       </p>
//                     </div>
//                   </div>

//                   <div className="flex flex-1 flex-col rounded-3xl border border-slate-200 bg-slate-50 p-4 transition-all focus-within:border-violet-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
//                     <textarea
//                       value={caption}
//                       onChange={(e) => setCaption(e.target.value)}
//                       placeholder="Write a caption about this journey..."
//                       maxLength={2200}
//                       className="min-h-[120px] flex-1 resize-none bg-transparent text-sm font-medium leading-6 text-slate-800 outline-none placeholder:text-slate-400"
//                     />

//                     <div className="mt-3 flex items-center justify-between border-t border-slate-200 pt-3 relative">
//                       <div className="flex items-center gap-2">
//                         <div className="relative">
//                           <button
//                             type="button"
//                             onClick={() => { setShowEmojiPicker(!showEmojiPicker); setShowLocationPicker(false); }}
//                             className={`rounded-full p-2 transition-all ${showEmojiPicker ? "bg-violet-100 text-violet-600" : "text-slate-400 hover:bg-white hover:text-violet-600"}`}
//                           >
//                             <Smile className="h-4 w-4" />
//                           </button>
//                           {showEmojiPicker && (
//                             <div className="absolute bottom-12 left-0 z-50 shadow-2xl rounded-xl overflow-hidden">
//                               <EmojiPicker onEmojiClick={(emojiObj) => { setCaption(c => c + emojiObj.emoji); setShowEmojiPicker(false); }} height={350} />
//                             </div>
//                           )}
//                         </div>
//                         <div className="relative">
//                           <button
//                             type="button"
//                             onClick={() => { setShowLocationPicker(!showLocationPicker); setShowEmojiPicker(false); }}
//                             className={`rounded-full p-2 transition-all ${showLocationPicker ? "bg-violet-100 text-violet-600" : "text-slate-400 hover:bg-white hover:text-violet-600"}`}
//                           >
//                             <MapPin className="h-4 w-4" />
//                           </button>
//                           {showLocationPicker && (
//                             <div className="absolute bottom-12 left-0 z-50 w-72 bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden p-2">
//                               <input 
//                                 type="text" 
//                                 placeholder="Search location..." 
//                                 value={locationQuery}
//                                 onChange={(e) => handleLocationSearch(e.target.value)}
//                                 className="w-full text-sm p-2 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-violet-400 mb-2"
//                               />
//                               <div className="max-h-40 overflow-y-auto">
//                                 {searchingLocation ? (
//                                   <p className="text-xs text-center text-slate-400 py-2">Searching...</p>
//                                 ) : locationResults.map((res, i) => (
//                                   <div 
//                                     key={i} 
//                                     onClick={() => { setLocation(res.display_name); setShowLocationPicker(false); }}
//                                     className="text-xs p-2 hover:bg-violet-50 cursor-pointer rounded-lg border-b border-slate-50 last:border-0 truncate"
//                                   >
//                                     {res.display_name}
//                                   </div>
//                                 ))}
//                                 {!searchingLocation && locationResults.length === 0 && locationQuery && (
//                                   <p className="text-xs text-center text-slate-400 py-2">No results found.</p>
//                                 )}
//                               </div>
//                             </div>
//                           )}
//                         </div>
//                       </div>

//                       <span className="text-xs font-bold text-slate-400">
//                         {caption.length}/2200
//                       </span>
//                     </div>
//                     {location && (
//                       <div className="mt-2 text-[11px] font-bold text-violet-600 flex items-center gap-1 bg-violet-50 px-2 py-1 rounded-lg w-fit">
//                         <MapPin className="w-3 h-3" /> {location.substring(0, 30)}{location.length > 30 ? "..." : ""}
//                         <button onClick={() => setLocation("")} className="ml-1 text-slate-400 hover:text-rose-500"><X className="w-3 h-3" /></button>
//                       </div>
//                     )}
//                   </div>

//                   <div className="mt-4 rounded-2xl bg-violet-50 px-4 py-3 text-xs font-semibold leading-5 text-violet-700">
//                     Tip: Add a short caption, destination name, or travel mood to
//                     make your memory easier to discover.
//                   </div>
//                 </div>
//               </div>
//             )}
//           </div>

//           {loading && (
//             <div className="absolute inset-0 z-20 flex items-center justify-center bg-white/65 backdrop-blur-sm">
//               <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-8 py-6 shadow-2xl">
//                 <Loader2 className="h-9 w-9 animate-spin text-violet-600" />
//                 <p className="text-sm font-extrabold text-slate-700">
//                   Sharing your memory...
//                 </p>
//               </div>
//             </div>
//           )}
//         </motion.div>
//       </div>
//     </AnimatePresence>
//   );
// };

// export default CreatePostModal;


import React, { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  ArrowLeft,
  ImagePlus,
  Loader2,
  Smile,
  MapPin,
  Sparkles,
  Music2,
  Play,
  Pause,
  Compass,
} from "lucide-react";
import axios from "../../api/axios";
import Cropper from "react-easy-crop";
import getCroppedImg from "../../utils/cropImage";
import EmojiPicker from "emoji-picker-react";
import { detectImageMood } from "../../utils/imageMoodDetector";
import AudioManager from "../../utils/AudioManager";

const MAX_IMAGE_SIZE = 10 * 1024 * 1024;
const MAX_VIDEO_SIZE = 25 * 1024 * 1024;

const CreatePostModal = ({ isOpen, onClose, onSuccess, user }) => {
  const [mediaFiles, setMediaFiles] = useState([]); // [{ file, preview, type, crop, zoom, aspect, croppedAreaPixels, croppedImage }]
  const [currentMediaIndex, setCurrentMediaIndex] = useState(0);
  
  const [caption, setCaption] = useState("");
  const [postTitle, setPostTitle] = useState("");
  const [disableComments, setDisableComments] = useState(false);
  const [hideLikes, setHideLikes] = useState(false);
  const [extractedTags, setExtractedTags] = useState([]);
  const [showAdvancedSettings, setShowAdvancedSettings] = useState(false);

  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const fileInputRef = useRef(null);
  const emojiPickerRef = useRef(null);

  const [imgError, setImgError] = useState(false);
  const [mediaType, setMediaType] = useState("image");
  const [showEmojiPicker, setShowEmojiPicker] = useState(false);
  const [location, setLocation] = useState("");
  const [showLocationPicker, setShowLocationPicker] = useState(false);
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [searchingLocation, setSearchingLocation] = useState(false);

  const [showMusicPicker, setShowMusicPicker] = useState(false);
  const [selectedMusic, setSelectedMusic] = useState(null);
  const [musicQuery, setMusicQuery] = useState("");
  const [isPlayingMusic, setIsPlayingMusic] = useState(false);
  const audioRef = useRef(null);
  const [previewTrackId, setPreviewTrackId] = useState(null);

  const [musicResults, setMusicResults] = useState([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [trendingMusic, setTrendingMusic] = useState([]);

  useEffect(() => {
    if (!showMusicPicker) return;

    const query = musicQuery.trim();

    const timeout = setTimeout(async () => {
      try {
        setIsSearchingMusic(true);
        if (!query) {
          const res = await axios.get(`${process.env.REACT_APP_API_URL}/music/trending`);
          const tracks = res.data?.tracks || res.data?.data || [];
          setTrendingMusic(tracks);
          setMusicResults([]);
        } else {
          const res = await axios.get(
            `${process.env.REACT_APP_API_URL}/music/search?q=${encodeURIComponent(query)}`
          );
          const tracks = res.data?.tracks || res.data?.data || [];
          if (tracks.length > 0) {
            setMusicResults(tracks);
          } else {
            setMusicResults([]);
          }
        }
      } catch (err) {
        setMusicResults([]);
      } finally {
        setIsSearchingMusic(false);
      }
    }, 500);

    return () => clearTimeout(timeout);
  }, [musicQuery, showMusicPicker]);

  const toggleMusicPreview = (e) => {
    e.preventDefault();
    e.stopPropagation();
    if (!audioRef.current) return;
    
    if (isPlayingMusic) {
      audioRef.current.pause();
      setIsPlayingMusic(false);
    } else {
      AudioManager.stopAll();
      audioRef.current.currentTime = 0;
      AudioManager.play('post-preview', audioRef.current, { source: 'story' });
      setIsPlayingMusic(true);
    }
  };

  const handlePreviewToggle = (track, e) => {
    e.stopPropagation();
    if (previewTrackId === track.id) {
      if (isPlayingMusic) {
        audioRef.current?.pause();
        setIsPlayingMusic(false);
      } else {
        AudioManager.play('post-preview', audioRef.current, { source: 'story' });
        setIsPlayingMusic(true);
      }
    } else {
      setPreviewTrackId(track.id);
      if (track.previewUrl || track.preview) {
        if (audioRef.current) {
          AudioManager.stopAll();
          audioRef.current.src = track.previewUrl || track.preview;
          AudioManager.play('post-preview', audioRef.current, { source: 'story' });
          setIsPlayingMusic(true);
        }
      } else {
        audioRef.current?.pause();
        setIsPlayingMusic(false);
      }
    }
  };

  const [step, setStep] = useState("upload");
  // Temporary state for the currently active cropped image
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [aspect, setAspect] = useState(4 / 5);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [croppedImage, setCroppedImage] = useState(null);

  // Sync active crop state when switching media
  useEffect(() => {
    if (mediaFiles.length > 0 && mediaFiles[currentMediaIndex]) {
      const activeMedia = mediaFiles[currentMediaIndex];
      setCrop(activeMedia.crop || { x: 0, y: 0 });
      setZoom(activeMedia.zoom || 1);
      setAspect(activeMedia.aspect || 4 / 5);
      setCroppedAreaPixels(activeMedia.croppedAreaPixels || null);
      setCroppedImage(activeMedia.croppedImage || null);
    }
  }, [currentMediaIndex, mediaFiles.length]);

  // Extract Hashtags automatically
  useEffect(() => {
    const tags = caption.match(/#[a-z0-9_]+/gi) || [];
    setExtractedTags(tags.map(tag => tag.replace('#', '').toLowerCase()));
  }, [caption]);

  const currentUser =
    user ||
    JSON.parse(localStorage.getItem("user") || "null") ||
    JSON.parse(localStorage.getItem("currentUser") || "null");

  useEffect(() => {
    return () => {
      mediaFiles.forEach((m) => {
        if (m.preview) URL.revokeObjectURL(m.preview);
      });
    };
  }, [mediaFiles]);

  useEffect(() => {
    if (isOpen) {
      AudioManager.stopAll();
      AudioManager.lock();
    } else {
      AudioManager.stopAll();
      AudioManager.unlock();
    }
    return () => {
      AudioManager.stopAll();
      AudioManager.unlock();
    };
  }, [isOpen]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        emojiPickerRef.current &&
        !emojiPickerRef.current.contains(event.target)
      ) {
        setShowEmojiPicker(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);

    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const validateFile = (selectedFile) => {
    if (!selectedFile) return false;

    if (selectedFile.type.startsWith("video/")) {
      if (selectedFile.size > MAX_VIDEO_SIZE) {
        showToast.error("Video size must be less than 25MB.");
        return false;
      }
    } else if (selectedFile.type.startsWith("image/")) {
      if (selectedFile.size > MAX_IMAGE_SIZE) {
        showToast.error("Image size must be less than 10MB.");
        return false;
      }
    } else {
      showToast.error("Only image or video files are allowed.");
      return false;
    }

    return true;
  };

  const setSelectedFiles = (selectedFiles) => {
    if (!selectedFiles || selectedFiles.length === 0) return;
    
    // Convert FileList to Array and filter out invalid files
    const newFiles = Array.from(selectedFiles).filter(validateFile);
    if (newFiles.length === 0) return;

    if (mediaFiles.length + newFiles.length > 10) {
      showToast.error("You can upload a maximum of 10 media files.");
      return;
    }

    const newMediaObjects = newFiles.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      type: file.type.startsWith("video/") ? "video" : "image",
      crop: { x: 0, y: 0 },
      zoom: 1,
      aspect: 4 / 5,
      croppedAreaPixels: null,
      croppedImage: null
    }));

    setMediaFiles(prev => [...prev, ...newMediaObjects]);
    setCurrentMediaIndex(mediaFiles.length); // Focus on the first newly added image

    // If any new file is a video, or we have mixed, we might skip crop step for videos.
    // For simplicity, we go to crop step if it's an image, else caption if all videos.
    const hasImage = newMediaObjects.some(m => m.type === "image");
    
    if (hasImage) {
      setMediaType(mediaFiles.length > 0 ? "carousel" : "image");
      setStep("crop");
    } else {
      setMediaType(mediaFiles.length > 0 ? "carousel" : "video");
      setStep("caption");
    }
  };

  const handleFileChange = (e) => {
    setSelectedFiles(e.target.files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    setSelectedFiles(e.dataTransfer.files);
  };

  const resetState = () => {
    mediaFiles.forEach((m) => {
      if (m.preview) URL.revokeObjectURL(m.preview);
    });

    setMediaFiles([]);
    setCurrentMediaIndex(0);
    setMediaType("image");
    setShowEmojiPicker(false);
    setLocation("");
    setLocationQuery("");
    setLocationResults([]);
    setShowLocationPicker(false);
    setShowMusicPicker(false);
    setSelectedMusic(null);
    setMusicQuery("");
    setIsPlayingMusic(false);
    setPreviewTrackId(null);
    setMusicResults([]);
    setCaption("");
    setPostTitle("");
    setDisableComments(false);
    setHideLikes(false);
    setExtractedTags([]);
    setShowAdvancedSettings(false);
    setLoading(false);
    setIsDragging(false);
    setStep("upload");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setAspect(4 / 5);
    setCroppedAreaPixels(null);
    setCroppedImage(null);
  };

  const handleClose = () => {
    if (loading) return;
    resetState();
    AudioManager.stopAll();
    onClose();
  };

  const handleLocationSearch = async (query) => {
    setLocationQuery(query);

    if (!query.trim()) {
      setLocationResults([]);
      return;
    }

    setSearchingLocation(true);

    try {
      const res = await fetch(
        `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(
          query
        )}&countrycodes=in`
      );

      const data = await res.json();
      setLocationResults(data.slice(0, 5));
    } catch (err) {
      console.error(err);
      showToast.error("Failed to search location.");
    } finally {
      setSearchingLocation(false);
    }
  };

  const handleSubmit = async () => {
    if (mediaFiles.length === 0) {
      showToast.error("Please add media.");
      return;
    }

    // Check if all images are cropped
    for (let i = 0; i < mediaFiles.length; i++) {
      if (mediaFiles[i].type === "image" && !mediaFiles[i].croppedImage) {
        showToast.error(`Please apply crop to image ${i + 1}.`);
        // Navigate to the uncropped image
        setCurrentMediaIndex(i);
        setStep("crop");
        return;
      }
    }

    if (!caption.trim()) {
      showToast.error("Please write a caption.");
      return;
    }

    setLoading(true);

    try {
      let finalMediaUrls = [];
      
      for (const media of mediaFiles) {
        if (media.type === "video") {
          const formData = new FormData();
          formData.append("image", media.file); // Backend expects 'image' field name

          const uploadRes = await axios.post("/upload", formData, {
            withCredentials: true,
            timeout: 0, // Disable timeout for large uploads
          });

          if (!uploadRes.data.success) throw new Error("Video upload failed");
          finalMediaUrls.push(uploadRes.data.url);
        } else {
          const base64Res = await axios.post("/upload/base64", { data: media.croppedImage, folder: "Go Go YatriGo_uploads" }, {
            withCredentials: true,
            timeout: 0, // Disable timeout for large uploads
          });

          if (!base64Res.data.success) throw new Error("Image upload failed");
          finalMediaUrls.push(base64Res.data.url);
        }
      }

      const isCarousel = finalMediaUrls.length > 1;
      const primaryMediaUrl = finalMediaUrls[0];
      const primaryMediaType = mediaFiles[0].type;

      const payload = {
        caption: caption.trim(),
        image: primaryMediaUrl,
        mediaUrl: primaryMediaUrl,
        mediaUrls: finalMediaUrls,
        mediaType: isCarousel ? "carousel" : primaryMediaType,
        location,
        music: selectedMusic,
        title: postTitle.trim(),
        tags: extractedTags,
        disableComments,
        hideLikes,
      };

      const res = await axios.post("/social/memory", payload, {
        withCredentials: true,
      });

      if (res.data?.success) {
        showToast.success("Memory shared successfully!");
        onSuccess?.(res.data.post || res.data.memory);
        handleClose();
      } else {
        showToast.error(res.data?.message || "Failed to create post.");
      }
    } catch (error) {
      console.error("Post creation error:", error);
      showToast.error(error.response?.data?.message || "Failed to create post.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      AudioManager.stopAll();
    } else {
      AudioManager.stopAll();
    }
    return () => {
      AudioManager.stopAll();
    };
  }, [isOpen]);

  const avatar =
    currentUser?.profilePic ||
    currentUser?.img ||
    currentUser?.avatar ||
    currentUser?.photo;

  const username =
    currentUser?.username ||
    currentUser?.name ||
    currentUser?.fullname ||
    "Traveler";

  return (
    <AnimatePresence>
      {isOpen && (
      <motion.div key="post-modal" className="fixed inset-0 z-[9999] flex items-end lg:items-center justify-center p-0 lg:p-6">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={handleClose}
          className="absolute inset-0 bg-slate-950/45 backdrop-blur-md"
        />

        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 20, scale: 0.96 }}
          transition={{ duration: 0.25, ease: "easeOut" }}
          className="relative flex w-full lg:max-w-[980px] max-h-[90dvh] lg:max-h-[92vh] min-h-[560px] flex-col overflow-y-auto lg:overflow-visible rounded-t-3xl lg:rounded-[32px] border border-white/50 bg-white/95 text-slate-900 shadow-[0_24px_70px_rgba(15,23,42,0.18)] backdrop-blur-xl"
        >
          <div className="flex h-14 shrink-0 items-center justify-between border-b border-slate-200/70 px-4">
            <div className="flex flex-1 justify-start">
              {step === "crop" ? (
                <button
                  onClick={() => {
                    setStep("upload");
                    if (preview) URL.revokeObjectURL(preview);
                    setPreview("");
                    setFile(null);
                  }}
                  className="rounded-full p-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-violet-600 active:scale-95"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              ) : step === "caption" ? (
                <button
                  onClick={() =>
                    mediaType === "image" ? setStep("crop") : setStep("upload")
                  }
                  className="rounded-full p-2 text-slate-600 transition-all hover:bg-slate-100 hover:text-violet-600 active:scale-95"
                  aria-label="Back"
                >
                  <ArrowLeft className="h-5 w-5" />
                </button>
              ) : null}
            </div>

            <div className="flex-1 text-center">
              <h3 className="font-[Outfit] text-[15px] font-extrabold text-slate-950">
                {step === "upload" && "Create New Post"}
                {step === "crop" && "Crop Image"}
                {step === "caption" && "New Travel Memory"}
              </h3>
            </div>

            <div className="flex flex-1 justify-end">
              {step === "crop" ? (
                <button
                  onClick={async () => {
                    try {
                      if (!mediaFiles[currentMediaIndex]) return;
                      const croppedBase64 = await getCroppedImg(
                        mediaFiles[currentMediaIndex].preview,
                        croppedAreaPixels
                      );
                      
                      const updatedMedia = [...mediaFiles];
                      updatedMedia[currentMediaIndex].croppedImage = croppedBase64;
                      updatedMedia[currentMediaIndex].crop = crop;
                      updatedMedia[currentMediaIndex].zoom = zoom;
                      updatedMedia[currentMediaIndex].aspect = aspect;
                      updatedMedia[currentMediaIndex].croppedAreaPixels = croppedAreaPixels;
                      setMediaFiles(updatedMedia);

                      const nextUncroppedIndex = updatedMedia.findIndex(m => m.type === "image" && !m.croppedImage);
                      if (nextUncroppedIndex !== -1) {
                         setCurrentMediaIndex(nextUncroppedIndex);
                      } else {
                         setStep("caption");
                      }
                    } catch (e) {
                      console.error(e);
                      showToast.error("Failed to crop image.");
                    }
                  }}
                  className="text-[14px] font-bold text-violet-600 transition-all hover:text-violet-700 active:scale-95"
                >
                  {mediaFiles.length > 1 && mediaFiles.some(m => m.type === "image" && !m.croppedImage) ? "Next Crop" : "Apply Crop"}
                </button>
              ) : step === "caption" ? (
                <button
                  onClick={handleSubmit}
                  disabled={loading}
                  className="inline-flex items-center gap-1.5 rounded-full bg-violet-600 px-4 py-1.5 text-[13px] font-bold text-white transition-all hover:bg-violet-700 active:scale-95 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Share"}
                </button>
              ) : (
                <button
                  onClick={handleClose}
                  className="rounded-full p-2 text-slate-500 transition-all hover:bg-slate-100 hover:text-slate-900 active:scale-95"
                  aria-label="Close"
                >
                  <X className="h-5 w-5" />
                </button>
              )}
            </div>
          </div>

          <div
            className="relative flex flex-1 flex-col overflow-visible"
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
          >
            {step === "upload" && (
              <div className="flex flex-1 items-center justify-center p-6 sm:p-10">
                <div
                  className={`flex min-h-[420px] w-full flex-col items-center justify-center rounded-[28px] border-2 border-dashed p-8 text-center transition-all ${
                    isDragging
                      ? "border-violet-500 bg-violet-50 shadow-[0_18px_45px_rgba(139,92,246,0.18)]"
                      : "border-violet-200 bg-gradient-to-br from-violet-50 via-white to-rose-50"
                  }`}
                >
                  <div className="mb-6 flex h-24 w-24 items-center justify-center rounded-[28px] bg-white shadow-xl shadow-violet-500/10">
                    <ImagePlus className="h-11 w-11 text-violet-600" />
                  </div>

                  <div className="mb-2 inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-extrabold uppercase tracking-[0.22em] text-violet-600 shadow-sm">
                    <Sparkles className="h-4 w-4" />
                    Travel Memory
                  </div>

                  <h2 className="font-[Outfit] text-2xl font-extrabold text-slate-950 sm:text-3xl">
                    Share your travel memory
                  </h2>

                  <p className="mt-3 max-w-md text-sm font-medium leading-6 text-slate-500">
                    Upload a photo or video from your latest adventure and inspire
                    other travelers on Go Go YatriGo.
                  </p>

                  <button
                    onClick={() => fileInputRef.current?.click()}
                    className="mt-7 rounded-2xl bg-violet-600 px-6 py-3 text-sm font-extrabold text-white shadow-lg shadow-violet-500/25 transition-all hover:-translate-y-0.5 hover:bg-violet-700 hover:shadow-violet-500/40 active:scale-95"
                  >
                    Select Media
                  </button>

                  <p className="mt-4 text-xs font-semibold text-slate-400">
                    Drag & drop • JPG, PNG 10MB • MP4, WEBM 25MB • Up to 10 files
                  </p>

                  <input
                    type="file"
                    ref={fileInputRef}
                    className="hidden"
                    accept="image/*,video/*"
                    multiple
                    onChange={handleFileChange}
                  />
                </div>
              </div>
            )}

            {step === "crop" && mediaFiles[currentMediaIndex] && (
              <div className="flex flex-1 flex-col bg-slate-950">
                <div className="relative min-h-[300px] flex-1 md:min-h-[400px]">
                  <Cropper
                    image={mediaFiles[currentMediaIndex].preview}
                    crop={crop}
                    zoom={zoom}
                    aspect={aspect}
                    onCropChange={setCrop}
                    onCropComplete={(croppedArea, croppedAreaPixels) =>
                      setCroppedAreaPixels(croppedAreaPixels)
                    }
                    onZoomChange={setZoom}
                    style={{
                      containerStyle: { backgroundColor: "#020617" },
                    }}
                  />
                  
                  {mediaFiles.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-10 px-4 overflow-x-auto">
                      {mediaFiles.map((m, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => {
                            // save current crop before switching
                            if (mediaFiles[currentMediaIndex].type === "image") {
                               const updated = [...mediaFiles];
                               updated[currentMediaIndex].crop = crop;
                               updated[currentMediaIndex].zoom = zoom;
                               updated[currentMediaIndex].aspect = aspect;
                               updated[currentMediaIndex].croppedAreaPixels = croppedAreaPixels;
                               setMediaFiles(updated);
                            }
                            setCurrentMediaIndex(idx);
                          }}
                          className={`w-12 h-12 rounded-lg overflow-hidden border-2 cursor-pointer transition-all shrink-0 ${idx === currentMediaIndex ? 'border-violet-500 scale-110 shadow-lg' : 'border-transparent opacity-60 hover:opacity-100'}`}
                        >
                          {m.type === "video" ? (
                            <video src={m.preview} className="w-full h-full object-cover" />
                          ) : (
                            <img src={m.croppedImage || m.preview} className="w-full h-full object-cover" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>

                <div className="flex flex-col items-center justify-center border-t border-slate-200 bg-white px-5 py-4">
                  <div className="flex w-full items-center justify-between max-w-sm mb-3">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Zoom</span>
                    <input
                      type="range"
                      value={zoom}
                      min={1}
                      max={3}
                      step={0.05}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="h-1 flex-1 mx-4 cursor-pointer appearance-none rounded-full bg-slate-200 accent-violet-600"
                    />
                    <span className="text-xs font-bold text-violet-600 min-w-[36px] text-right">{Math.round(zoom * 100)}%</span>
                  </div>

                  <div className="flex w-full items-center justify-center gap-2 mt-1">
                    {[
                      { label: "1:1", value: 1 },
                      { label: "4:5", value: 4 / 5 },
                      { label: "16:9", value: 16 / 9 },
                    ].map((item) => (
                      <button
                        key={item.label}
                        onClick={() => setAspect(item.value)}
                        className={`rounded-xl px-4 py-2 text-xs font-bold transition-all active:scale-95 ${
                          aspect === item.value
                            ? "bg-violet-600 text-white shadow-md shadow-violet-500/25"
                            : "bg-slate-50 text-slate-600 hover:bg-slate-100"
                        }`}
                      >
                        {item.label}
                      </button>
                    ))}
                    
                    <div className="w-px h-6 bg-slate-200 mx-1"></div>

                    <button
                      onClick={() => {
                        setCrop({ x: 0, y: 0 });
                        setZoom(1);
                      }}
                      className="rounded-xl bg-slate-50 px-4 py-2 text-xs font-bold text-rose-500 transition-all hover:bg-rose-50 active:scale-95"
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </div>
            )}

            {step === "caption" && (
              <div className="grid flex-1 grid-cols-1 overflow-visible md:grid-cols-[58%_42%]">
                <div className="relative flex min-h-[300px] items-center justify-center bg-slate-50 md:min-h-[500px]">
                  {mediaFiles.length > 0 && mediaFiles[currentMediaIndex]?.type === "video" ? (
                    <video
                      src={mediaFiles[currentMediaIndex].preview}
                      controls
                      className="max-h-[300px] w-full bg-black object-contain md:h-full md:max-h-[500px]"
                    />
                  ) : mediaFiles.length > 0 ? (
                    <img
                      src={mediaFiles[currentMediaIndex]?.croppedImage || mediaFiles[currentMediaIndex]?.preview}
                      alt="Preview"
                      className="max-h-[300px] w-full object-contain md:h-full md:max-h-[500px]"
                    />
                  ) : null}

                  {mediaFiles.length > 1 && (
                    <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-1.5 z-10">
                      {mediaFiles.map((_, idx) => (
                        <div 
                          key={idx} 
                          onClick={() => setCurrentMediaIndex(idx)}
                          className={`h-2 rounded-full cursor-pointer transition-all ${idx === currentMediaIndex ? 'w-6 bg-violet-600' : 'w-2 bg-slate-300 hover:bg-violet-400'}`}
                        />
                      ))}
                    </div>
                  )}
                </div>

                <div className="relative flex min-h-[360px] flex-col overflow-visible bg-white/95 p-5 backdrop-blur-2xl md:p-6 md:pl-5">
                  <div className="mb-5 flex items-center gap-3">
                    {avatar && !imgError ? (
                      <img
                        src={avatar}
                        alt={username}
                        onError={() => setImgError(true)}
                        className="h-11 w-11 shrink-0 rounded-full object-cover ring-2 ring-violet-100"
                      />
                    ) : (
                      <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-full bg-violet-600 text-sm font-extrabold text-white ring-2 ring-violet-100">
                        {username?.charAt(0)?.toUpperCase() || "T"}
                      </div>
                    )}

                    <div>
                      <h4 className="text-sm font-extrabold text-slate-950">
                        {username}
                      </h4>
                      <p className="text-xs font-semibold text-slate-400">
                        Posting publicly
                      </p>
                    </div>
                  </div>

                  <div className="relative flex flex-1 flex-col rounded-3xl border border-slate-200 bg-slate-50 p-4 transition-all focus-within:border-violet-300 focus-within:bg-white focus-within:ring-4 focus-within:ring-violet-500/10">
                    <input
                      type="text"
                      value={postTitle}
                      onChange={(e) => setPostTitle(e.target.value)}
                      placeholder="Give your memory a title... (optional)"
                      className="w-full bg-transparent text-sm font-bold text-slate-900 outline-none placeholder:text-slate-400 mb-2 border-b border-slate-200/50 pb-2"
                    />
                    <textarea
                      value={caption}
                      onChange={(e) => setCaption(e.target.value)}
                      placeholder="Write a caption about this journey... Use #hashtags to automatically tag it!"
                      maxLength={2200}
                      className="min-h-[90px] flex-1 resize-none bg-transparent text-sm font-medium leading-6 text-slate-800 outline-none placeholder:text-slate-400"
                    />

                    {extractedTags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5 mt-2 mb-1">
                        {extractedTags.map(tag => (
                          <span key={tag} className="text-[10px] font-bold text-violet-600 bg-violet-100 px-2 py-0.5 rounded-full">#{tag}</span>
                        ))}
                      </div>
                    )}

                    <div className="relative mt-3 flex items-center justify-between overflow-visible border-t border-slate-200 pt-3">
                      <div className="flex items-center gap-2">
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setShowEmojiPicker((prev) => !prev);
                              setShowLocationPicker(false);
                              setShowMusicPicker(false);
                            }}
                            className={`rounded-full p-2 transition-all ${
                              showEmojiPicker
                                ? "bg-violet-100 text-violet-600"
                                : "text-slate-400 hover:bg-white hover:text-violet-600"
                            }`}
                          >
                            <Smile className="h-4 w-4" />
                          </button>

                          <AnimatePresence>
                            {showEmojiPicker && (
                              <motion.div
                                ref={emojiPickerRef}
                                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                                transition={{ duration: 0.16 }}
                                className="absolute bottom-full mb-3 left-0 z-[99999] overflow-hidden rounded-3xl border border-white/30 bg-white shadow-[0_25px_70px_rgba(15,23,42,0.25)]"
                              >
                                <EmojiPicker
                                  onEmojiClick={(emojiObj) => {
                                    setCaption((c) => c + emojiObj.emoji);
                                  }}
                                  height={390}
                                  width={320}
                                  theme="light"
                                  previewConfig={{ showPreview: false }}
                                  searchDisabled={false}
                                  skinTonesDisabled
                                />
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>

                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setShowLocationPicker((prev) => !prev);
                              setShowEmojiPicker(false);
                              setShowMusicPicker(false);
                            }}
                            className={`rounded-full p-2 transition-all ${
                              showLocationPicker
                                ? "bg-violet-100 text-violet-600"
                                : "text-slate-400 hover:bg-white hover:text-violet-600"
                            }`}
                          >
                            <MapPin className="h-4 w-4" />
                          </button>

                          <AnimatePresence>
                            {showLocationPicker && (
                              <motion.div
                                initial={{ opacity: 0, y: 10, scale: 0.96 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 10, scale: 0.96 }}
                                transition={{ duration: 0.16 }}
                                className="absolute bottom-14 left-0 z-[99999] w-[320px] overflow-hidden rounded-3xl border border-slate-200 bg-white p-3 shadow-[0_25px_70px_rgba(15,23,42,0.22)]"
                              >
                                <input
                                  type="text"
                                  placeholder="Search location..."
                                  value={locationQuery}
                                  onChange={(e) =>
                                    handleLocationSearch(e.target.value)
                                  }
                                  className="mb-3 w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-sm font-semibold outline-none transition-all focus:border-violet-400 focus:bg-white focus:ring-4 focus:ring-violet-500/10"
                                />

                                <div className="max-h-48 overflow-y-auto pr-1">
                                  {searchingLocation ? (
                                    <div className="flex items-center justify-center gap-2 py-4 text-xs font-bold text-slate-400">
                                      <Loader2 className="h-4 w-4 animate-spin" />
                                      Searching...
                                    </div>
                                  ) : locationResults.length > 0 ? (
                                    locationResults.map((res, i) => (
                                      <button
                                        type="button"
                                        key={`${res.place_id || i}`}
                                        onClick={() => {
                                          setLocation(res.display_name);
                                          setShowLocationPicker(false);
                                          setLocationQuery("");
                                          setLocationResults([]);
                                        }}
                                        className="flex w-full items-start gap-2 rounded-2xl p-3 text-left transition-all hover:bg-violet-50"
                                      >
                                        <MapPin className="mt-0.5 h-4 w-4 shrink-0 text-violet-500" />
                                        <span className="line-clamp-2 text-xs font-semibold leading-5 text-slate-600">
                                          {res.display_name}
                                        </span>
                                      </button>
                                    ))
                                  ) : locationQuery ? (
                                    <p className="py-4 text-center text-xs font-bold text-slate-400">
                                      No results found.
                                    </p>
                                  ) : (
                                    <p className="py-4 text-center text-xs font-bold text-slate-400">
                                      Search your destination.
                                    </p>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                        
                        <div className="relative">
                          <button
                            type="button"
                            onClick={() => {
                              setShowMusicPicker((prev) => !prev);
                              setShowEmojiPicker(false);
                              setShowLocationPicker(false);
                            }}
                            className={`rounded-full p-2 transition-all ${
                              showMusicPicker
                                ? "bg-violet-100 text-violet-600"
                                : "text-slate-400 hover:bg-white hover:text-violet-600"
                            }`}
                          >
                            <Music2 className="h-4 w-4" />
                          </button>

                          <AnimatePresence>
                            {showMusicPicker && (
                              <motion.div
                                initial={{ opacity: 0, y: 20, scale: 0.95 }}
                                animate={{ opacity: 1, y: 0, scale: 1 }}
                                exit={{ opacity: 0, y: 20, scale: 0.95 }}
                                transition={{ duration: 0.2 }}
                                className="absolute bottom-full mb-3 left-0 z-[99999] w-[360px] overflow-hidden rounded-3xl border border-[#6C4DF6]/20 bg-white/95 p-4 shadow-[0_25px_70px_rgba(108,77,246,0.15)] backdrop-blur-xl"
                              >
                                <div className="absolute inset-0 bg-gradient-to-br from-white via-indigo-50/50 to-purple-50/50 pointer-events-none" />
                                <div className="mb-4 text-center">
                                  <h3 className="text-slate-800 font-black text-lg">Add Music to Post</h3>
                                  <p className="text-sm text-slate-500 font-medium mt-1">Search and select a song</p>
                                </div>
                                
                                <div className="relative mb-4">
                                  <input
                                    type="text"
                                    placeholder="Search songs, artists..."
                                    value={musicQuery}
                                    onChange={(e) => setMusicQuery(e.target.value)}
                                    className="w-full rounded-2xl bg-white/80 p-3 text-sm font-semibold text-slate-800 border border-slate-200 outline-none transition-all placeholder:text-slate-400 focus:bg-white focus:ring-2 focus:ring-[#6C4DF6]/30 focus:border-[#6C4DF6]/50 shadow-sm"
                                  />
                                </div>

                                <div className="relative max-h-[260px] overflow-y-auto scrollbar-thin pr-1">
                                  {isSearchingMusic ? (
                                    <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 text-indigo-400 animate-spin" /></div>
                                  ) : (
                                    <>
                                      {!musicQuery.trim() && trendingMusic.length > 0 && (
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">TRENDING SONGS</p>
                                      )}
                                      {musicQuery.trim() && musicResults.length > 0 && (
                                        <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">SEARCH RESULTS</p>
                                      )}
                                      {(musicQuery.trim() ? musicResults : trendingMusic).filter((song, index, self) => index === self.findIndex((s) => s.title?.split('(')[0].trim().toLowerCase() === song.title?.split('(')[0].trim().toLowerCase() && s.artist?.toLowerCase() === song.artist?.toLowerCase())).map((song) => (
                                        <div
                                          key={song.id}
                                          className={`group mb-2 flex w-full items-center justify-between gap-3 h-[62px] rounded-2xl p-2 text-left transition-all cursor-pointer ${selectedMusic?.id === song.id ? 'bg-indigo-50 border border-indigo-100 shadow-sm' : 'bg-white/40 hover:bg-white hover:shadow-sm border border-transparent hover:border-[#6C4DF6]/20'}`}
                                          onClick={() => {
                                            const songData = {
                                              id: song.id,
                                              title: song.title,
                                              artist: song.artist,
                                              cover: song.albumImage,
                                              preview: song.previewUrl
                                            };
                                            setSelectedMusic(songData);
                                            setPreviewTrackId(null);
                                            setShowMusicPicker(false);
                                            setMusicQuery("");
                                            if (song.previewUrl) {
                                              setTimeout(() => {
                                                if (audioRef.current) {
                                                  AudioManager.stopAll();
                                                  audioRef.current.src = song.previewUrl;
                                                  audioRef.current.play().catch(e => console.warn(e));
                                                  setIsPlayingMusic(true);
                                                }
                                              }, 100);
                                            } else {
                                              if (audioRef.current) audioRef.current.pause();
                                              setIsPlayingMusic(false);
                                            }
                                          }}
                                        >
                                          <div className="flex items-center gap-3 min-w-0 flex-1">
                                            <div className="relative w-[46px] h-[46px] shrink-0 overflow-hidden rounded-xl bg-slate-100 border border-slate-200">
                                              <img src={song.albumImage || `https://ui-avatars.com/api/?name=${song.title}`} alt={song.title} className="h-full w-full object-cover transition-transform group-hover:scale-105" />
                                            </div>
                                            <div className="flex-1 min-w-0 pr-2">
                                              <p className="truncate text-xs font-bold text-slate-800">{song.title}</p>
                                              <p className="truncate text-[10px] font-medium text-slate-500">{song.artist}</p>
                                            </div>
                                          </div>
                                          <div className="flex items-center justify-center w-10 h-10 shrink-0">
                                            {previewTrackId === song.id && isPlayingMusic ? (
                                              <button type="button" onClick={(e) => handlePreviewToggle(song, e)} className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-[#6C4DF6] shadow-sm transition-all hover:scale-110">
                                                <div className="flex h-3 items-end gap-[2px]">
                                                  <motion.span animate={{ height: [3, 10, 3] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-[2px] bg-current rounded-full" />
                                                  <motion.span animate={{ height: [5, 12, 5] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-[2px] bg-current rounded-full" />
                                                  <motion.span animate={{ height: [4, 11, 4] }} transition={{ repeat: Infinity, duration: 1.0 }} className="w-[2px] bg-current rounded-full" />
                                                </div>
                                              </button>
                                            ) : (
                                              <button type="button" onClick={(e) => handlePreviewToggle(song, e)} className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-50 text-[#6C4DF6] transition-all hover:bg-[#6C4DF6] hover:text-white hover:scale-110 shadow-sm opacity-0 group-hover:opacity-100">
                                                <Play className="w-3.5 h-3.5 translate-x-[1px]" />
                                              </button>
                                            )}
                                          </div>
                                        </div>
                                      ))}
                                      {(musicQuery.trim() ? musicResults : trendingMusic).length === 0 && !isSearchingMusic && (
                                        <div className="py-10 flex flex-col items-center text-center">
                                          <div className="w-12 h-12 bg-indigo-50 rounded-full flex items-center justify-center mb-3">
                                            <Music2 className="w-6 h-6 text-[#6C4DF6]" />
                                          </div>
                                          <p className="text-xs font-bold text-slate-800">No songs found.</p>
                                        </div>
                                      )}
                                    </>
                                  )}
                                </div>
                              </motion.div>
                            )}
                          </AnimatePresence>
                        </div>
                      </div>

                      <span className="text-xs font-bold text-slate-400">
                        {caption.length}/2200
                      </span>
                    </div>

                    {location && (
                      <div className="mt-3 flex w-fit max-w-full items-center gap-1 rounded-xl bg-violet-50 px-3 py-2 text-[11px] font-bold text-violet-600">
                        <MapPin className="h-3.5 w-3.5 shrink-0" />
                        <span className="truncate">
                          {location.length > 42
                            ? `${location.substring(0, 42)}...`
                            : location}
                        </span>
                        <button
                          onClick={() => setLocation("")}
                          className="ml-1 text-slate-400 transition-all hover:text-rose-500"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    )}

                    {selectedMusic && (
                      <div className="mt-3 flex w-fit max-w-full items-center gap-2 rounded-2xl bg-indigo-50 border border-indigo-100 p-1.5 pr-4 text-[11px] font-bold text-[#6C4DF6] shadow-sm">
                        {selectedMusic.preview ? (
                          <button
                            type="button"
                            onClick={toggleMusicPreview}
                            className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-white border border-indigo-100 text-[#6C4DF6] shadow-sm transition-all hover:bg-indigo-100 hover:scale-105 active:scale-95"
                          >
                            {isPlayingMusic ? (
                              <Pause className="h-3 w-3 fill-current" />
                            ) : (
                              <Play className="h-3 w-3 fill-current ml-[1px]" />
                            )}
                          </button>
                        ) : (
                          <div className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-indigo-100 text-[#6C4DF6]">
                            <Music2 className="h-3 w-3" />
                          </div>
                        )}
                        <div className="flex flex-col overflow-hidden leading-tight">
                          <span className="truncate text-[#6C4DF6] font-extrabold flex items-center gap-1.5">
                            Playing ✨
                            {isPlayingMusic && (
                              <span className="flex h-2 items-end gap-[1px]">
                                <motion.span animate={{ height: [2, 6, 2] }} transition={{ repeat: Infinity, duration: 0.8 }} className="w-[2px] bg-[#6C4DF6] rounded-full" />
                                <motion.span animate={{ height: [4, 8, 4] }} transition={{ repeat: Infinity, duration: 1.2 }} className="w-[2px] bg-[#6C4DF6] rounded-full" />
                                <motion.span animate={{ height: [3, 7, 3] }} transition={{ repeat: Infinity, duration: 1.0 }} className="w-[2px] bg-[#6C4DF6] rounded-full" />
                              </span>
                            )}
                          </span>
                          <span className="truncate text-[10px] font-medium text-slate-500">{selectedMusic.title}</span>
                        </div>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedMusic(null);
                            setIsPlayingMusic(false);
                            if (audioRef.current) audioRef.current.pause();
                          }}
                          className="ml-2 flex h-5 w-5 items-center justify-center rounded-full bg-indigo-100/50 text-indigo-400 transition-all hover:bg-rose-100 hover:text-rose-500"
                        >
                          <X className="h-2.5 w-2.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="mt-4 flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => setShowAdvancedSettings(!showAdvancedSettings)}
                      className="flex items-center justify-between rounded-2xl bg-slate-50 px-4 py-3 text-xs font-bold text-slate-700 transition-all hover:bg-slate-100"
                    >
                      Advanced Settings
                      <span className={`transition-transform ${showAdvancedSettings ? "rotate-180" : ""}`}>▼</span>
                    </button>
                    
                    <AnimatePresence>
                      {showAdvancedSettings && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="overflow-hidden rounded-2xl border border-slate-200 bg-white"
                        >
                          <div className="flex flex-col gap-3 p-4">
                            <label className="flex cursor-pointer items-center justify-between">
                              <span className="text-sm font-semibold text-slate-800">Hide like counts</span>
                              <div className="relative inline-flex items-center">
                                <input
                                  type="checkbox"
                                  checked={hideLikes}
                                  onChange={(e) => setHideLikes(e.target.checked)}
                                  className="peer sr-only"
                                />
                                <div className="h-6 w-11 rounded-full bg-slate-200 after:absolute after:left-[2px] after:top-[2px] after:h-5 after:w-5 after:rounded-full after:border after:border-gray-300 after:bg-white after:transition-all after:content-[''] peer-checked:bg-violet-600 peer-checked:after:translate-x-full peer-checked:after:border-white"></div>
                              </div>
                            </label>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </div>
            )}
          </div>

          {loading && (
            <div className="absolute inset-0 z-[100000] flex items-center justify-center rounded-[32px] bg-white/65 backdrop-blur-sm">
              <div className="flex flex-col items-center gap-3 rounded-3xl bg-white px-8 py-6 shadow-2xl">
                <Loader2 className="h-9 w-9 animate-spin text-violet-600" />
                <p className="text-sm font-extrabold text-slate-700">
                  Sharing your memory...
                </p>
              </div>
            </div>
          )}
          
          <audio
            ref={audioRef}
            className="hidden"
            onEnded={() => setIsPlayingMusic(false)}
            preload="auto"
          />
        </motion.div>
      </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreatePostModal;