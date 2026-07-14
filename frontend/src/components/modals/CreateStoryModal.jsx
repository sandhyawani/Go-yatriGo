import React, { useState, useCallback, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  X,
  Upload,
  Image as ImageIcon,
  Music,
  Type,
  Check,
  Crop,
  Play,
  Pause,
  Send,
  Loader2,
  Sparkles,
  Music2,
  Compass,
  ImagePlus,
  MapPin,
  Smile,
  AlignLeft,
  AlignCenter,
  AlignRight,
  Palette,
  Globe,
  Users,
  Lock,
  ArrowLeft,
} from "lucide-react";
import Cropper from "react-easy-crop";
import axios from "../../api/axios";
import { showToast } from "../../utils/showToast";
import { Search } from "lucide-react";
import { useAuth } from "../../context/authContext";
import { detectImageMood } from "../../utils/imageMoodDetector";
import AudioManager from "../../utils/AudioManager";
import StorySticker from "../story/StorySticker";
import Avatar from "../common/Avatar";

const travelEmojis = [
  "ðŸŒ„",
  "ðŸ•ï¸",
  "ðŸš—",
  "âœˆï¸",
  "ðŸŒ",
  "â˜•",
  "â›°ï¸",
  "ðŸŒ…",
  "ðŸ“",
  "ðŸŒ´",
  "ðŸŒŠ",
  "ðŸŽ’",
  "ðŸ›µ",
  "ðŸš‚",
];
const fonts = [
  { name: "Clean", family: "Inter, sans-serif" },
  { name: "Bold", family: "Montserrat, sans-serif" },
  { name: "Travel", family: '"Playfair Display", serif' },
  { name: "Handwritten", family: '"Caveat", cursive' },
];

const textColors = [
  "#ffffff",
  "#000000",
  "#7c3aed",
  "#F43F5E",
  "#F59E0B",
  "#10B981",
];

const popularLanguages = [
  { label: "ðŸ”¥ All Languages", value: "" },
  { label: "ðŸ‡®ðŸ‡³ Hindi", value: "Hindi" },
  { label: "ðŸ‡®ðŸ‡³ Telugu", value: "Telugu" },
  { label: "ðŸ‡®ðŸ‡³ Tamil", value: "Tamil" },
  { label: "ðŸ‡®ðŸ‡³ Punjabi", value: "Punjabi" },
  { label: "ðŸ‡®ðŸ‡³ Malayalam", value: "Malayalam" },
  { label: "ðŸ‡®ðŸ‡³ Kannada", value: "Kannada" },
  { label: "ðŸ‡®ðŸ‡³ Marathi", value: "Marathi" },
  { label: "ðŸŽ§ English Pop", value: "English" },
  { label: "ðŸŒ¸ K-Pop", value: "K-Pop" },
  { label: "ðŸ’ƒ Spanish", value: "Spanish" },
];

const popularDestinations = [
  { label: "ðŸ–ï¸ Goa", value: "Goa" },
  { label: "ðŸ”ï¸ Manali", value: "Manali" },
  { label: "ðŸ° Jaipur", value: "Jaipur" },
  { label: "ðŸï¸ Ladakh", value: "Ladakh" },
  { label: "ðŸŒ´ Kerala", value: "Kerala" },
  { label: "ðŸŒƒ Mumbai", value: "Mumbai" },
  { label: "ðŸ§˜ Rishikesh", value: "Rishikesh" },
  { label: "ðŸ° Udaipur", value: "Udaipur" },
  { label: "ðŸ›• Varanasi", value: "Varanasi" },
  { label: "â˜• Coorg", value: "Coorg" },
];

const CreateStoryModal = ({ isOpen, onClose, onSuccess }) => {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const cameraInputRef = useRef(null);
  const audioRef = useRef(null);
  const previewRef = useRef(null);

  const [step, setStep] = useState(1);
  const [activeOverlay, setActiveOverlay] = useState(null);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
      document.body.classList.add("modal-open-hide-nav");
    } else {
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open-hide-nav");
    }
    return () => {
      document.body.style.overflow = "";
      document.body.classList.remove("modal-open-hide-nav");
    };
  }, [isOpen]);

  const [mediaFile, setMediaFile] = useState(null);
  const [mediaUrl, setMediaUrl] = useState("");
  const [mediaType, setMediaType] = useState("image");

  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [showZoomIndicator, setShowZoomIndicator] = useState(false);
  const zoomTimeoutRef = useRef(null);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const [stickers, setStickers] = useState([]);

  const addSticker = (type, data) => {
    setStickers((prev) => [
      ...prev,
      {
        id: Date.now().toString() + Math.random(),
        type,
        xPercent: 50,
        yPercent: 50,
        scale: 1,
        ...data,
      },
    ]);
  };

  const removeSticker = (id) => {
    setStickers((prev) => prev.filter((s) => s.id !== id));
  };

  const updateSticker = (id, updates) => {
    setStickers((prev) =>
      prev.map((s) => (s.id === id ? { ...s, ...updates } : s)),
    );
  };

  // Text Editor State
  const [textInput, setTextInput] = useState("");
  const [textStyle, setTextStyle] = useState({
    font: fonts[0].family,
    color: textColors[0],
    bg: "none",
    align: "center",
  });
  const [editingStickerId, setEditingStickerId] = useState(null);

  const [activeMenu, setActiveMenu] = useState(null);

  const handleTextClick = useCallback((sticker) => {
    setTextInput(sticker.text);
    setTextStyle(
      sticker.style || {
        font: fonts[0].family,
        color: textColors[0],
        bg: "none",
        align: "center",
      },
    );
    setEditingStickerId(sticker.id);
    setActiveOverlay("caption");
  }, []);

  const handleLocationClick = useCallback((sticker) => {
    setLocationQuery(sticker.text || "");
    setEditingStickerId(sticker.id);
    setActiveOverlay("location");
  }, []);

  const handleSaveLocation = useCallback(
    (text) => {
      if (editingStickerId) {
        updateSticker(editingStickerId, { text });
      } else {
        addSticker("location", { text });
      }
      setLocationQuery("");
      setLocationResults([]);
      setActiveOverlay(null);
      setEditingStickerId(null);
    },
    [editingStickerId, updateSticker, addSticker],
  );

  // Location Editor State
  const [locationQuery, setLocationQuery] = useState("");
  const [locationResults, setLocationResults] = useState([]);
  const [isSearchingLocation, setIsSearchingLocation] = useState(false);

  const [selectedSong, setSelectedSong] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [previewTrackId, setPreviewTrackId] = useState(null);

  const [visibility, setVisibility] = useState("public");
  const [allowedUsers, setAllowedUsers] = useState([]);
  const [isSelectingUsers, setIsSelectingUsers] = useState(false);
  const [hiddenUsers, setHiddenUsers] = useState([]);
  const [isSelectingHiddenUsers, setIsSelectingHiddenUsers] = useState(false);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [userSearchResults, setUserSearchResults] = useState([]);
  const [isSearchingUsers, setIsSearchingUsers] = useState(false);

  useEffect(() => {
    if (activeOverlay === "crop") {
      setShowZoomIndicator(true);
      if (zoomTimeoutRef.current) clearTimeout(zoomTimeoutRef.current);
      zoomTimeoutRef.current = setTimeout(() => {
        setShowZoomIndicator(false);
      }, 1000);
    }
  }, [zoom, activeOverlay]);

  useEffect(() => {
    const query = userSearchQuery.trim();
    if (query.length < 2) {
      if ((isSelectingUsers || isSelectingHiddenUsers) && user?._id) {
        const fetchFollowing = async () => {
          try {
            setIsSearchingUsers(true);
            const res = await axios.get(
              `/users/${user._id}/following`
            );
            if (res.data?.following) {
              setUserSearchResults(res.data.following);
            }
          } catch (err) {
            console.error(err);
          } finally {
            setIsSearchingUsers(false);
          }
        };
        fetchFollowing();
      } else {
        setUserSearchResults([]);
      }
      return;
    }
    const timeout = setTimeout(async () => {
      try {
        setIsSearchingUsers(true);
        const res = await axios.get(
          `/users/search?q=${encodeURIComponent(query)}`,
        );
        if (res.data?.users) {
          setUserSearchResults(res.data.users);
        }
      } catch (err) {
        console.error("Error creating/updating story:", err);
      } finally {
        setIsSearchingUsers(false);
      }
    }, 500);
    return () => clearTimeout(timeout);
  }, [userSearchQuery, isSelectingUsers, isSelectingHiddenUsers, user]);

  const [musicSearchQuery, setMusicSearchQuery] = useState("");
  const [spotifyResults, setSpotifyResults] = useState([]);
  const [isSearchingMusic, setIsSearchingMusic] = useState(false);
  const [spotifyError, setSpotifyError] = useState(null);
  const [trendingSongs, setTrendingSongs] = useState([]);
  const [selectedMusicLang, setSelectedMusicLang] = useState("");

  useEffect(() => {
    if (activeOverlay !== "location") return;
    const query = locationQuery.trim();
    if (!query) {
      setLocationResults([]);
      return;
    }
    let isCancelled = false;
    const timeout = setTimeout(async () => {
      setIsSearchingLocation(true);
      let results = [];
      try {
        const res = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&countrycodes=in&q=${encodeURIComponent(query)}`,
        );
        if (res.ok) {
          const data = await res.json();
          if (Array.isArray(data)) {
            results = data.slice(0, 5);
          }
        }
      } catch (err) {
        console.warn("Nominatim search failed:", err);
      }

      if (results.length === 0 && !isCancelled) {
        try {
          const photonRes = await fetch(
            `https://photon.komoot.io/api/?q=${encodeURIComponent(query)}&limit=5`,
          );
          if (photonRes.ok) {
            const photonData = await photonRes.json();
            if (photonData?.features) {
              results = photonData.features.map((f) => {
                const props = f.properties || {};
                const parts = [
                  props.name,
                  props.city || props.state,
                  props.country,
                ].filter(Boolean);
                return { display_name: parts.join(", ") || query };
              });
            }
          }
        } catch (err) {
          console.error("Photon search failed:", err);
        }
      }

      if (!isCancelled) {
        setLocationResults(results);
        setIsSearchingLocation(false);
      }
    }, 600);
    return () => {
      isCancelled = true;
      clearTimeout(timeout);
    };
  }, [locationQuery, activeOverlay]);

  useEffect(() => {
    if (activeOverlay !== "music") return;
    const query = musicSearchQuery.trim();
    setIsSearchingMusic(true);
    setSpotifyError(null);
    const delay = query ? 500 : 50;
    const timeout = setTimeout(async () => {
      try {
        if (!query) {
          const res = await axios.get(
            `/music/trending${selectedMusicLang ? `?language=${encodeURIComponent(selectedMusicLang)}` : ""}`,
          );
          setTrendingSongs(res.data?.tracks || res.data?.data || []);
          setSpotifyResults([]);
        } else {
          const res = await axios.get(
            `/music/search?q=${encodeURIComponent(query)}`,
          );
          const tracks = res.data?.tracks || res.data?.data || [];
          if (tracks.length > 0) {
            setSpotifyResults(tracks);
          } else {
            setSpotifyResults([]);
            setSpotifyError("No songs found");
          }
        }
      } catch (err) {
        setSpotifyResults([]);
        setSpotifyError("Spotify search unavailable");
      } finally {
        setIsSearchingMusic(false);
      }
    }, delay);
    return () => clearTimeout(timeout);
  }, [musicSearchQuery, activeOverlay, selectedMusicLang]);

  // Note: We intentionally do NOT auto-click the file input or auto-close
  // on window focus. On iOS/Android the native file picker fires a window
  // 'focus' event on close (even after a successful pick), which would kill
  // the modal before the file is processed. The step-1 UI has a full-screen
  // tap target and a "Choose Media" button for the user to open the picker.

  const resetState = () => {
    setStep(1);
    setActiveOverlay(null);
    setMediaFile(null);
    setMediaUrl("");
    setMediaType("image");
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setCroppedAreaPixels(null);
    setStickers([]);
    setTextInput("");
    setEditingStickerId(null);
    setLocationQuery("");
    setVisibility("public");
    setAllowedUsers([]);
    setIsSelectingUsers(false);
    setHiddenUsers([]);
    setIsSelectingHiddenUsers(false);
    setSelectedSong(null);
    setIsPlaying(false);
    if (audioRef.current) {
      audioRef.current.pause();
    }
    AudioManager.stopAll();
  };

  const handleClose = () => {
    resetState();
    onClose();
  };

  const onCropComplete = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  // Helper: detect image by MIME type OR file extension (needed for iOS HEIC files
  // which often report file.type as "" in mobile browsers)
  const isImageFile = (file) => {
    if (file.type && file.type.startsWith("image/")) return true;
    const ext = file.name?.split(".").pop()?.toLowerCase();
    return ["jpg","jpeg","png","gif","webp","heic","heif","avif","bmp","tiff","tif"].includes(ext);
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    if (file.type.startsWith("video/")) {
      if (file.size > 50 * 1024 * 1024)
        return showToast.error("Video must be under 50MB");

      const videoElem = document.createElement("video");
      videoElem.preload = "metadata";
      videoElem.onloadedmetadata = () => {
        window.URL.revokeObjectURL(videoElem.src);
        if (videoElem.duration > 61) {
          return showToast.error("Story video duration cannot exceed 1 minute (60 seconds)!");
        }
        setMediaType("video");
        setMediaUrl(URL.createObjectURL(file));
        setMediaFile(file);
        setStep(2);
        setActiveOverlay(null);
      };
      videoElem.onerror = () => {
        showToast.error("Failed to load video metadata");
      };
      videoElem.src = URL.createObjectURL(file);
    } else if (isImageFile(file)) {
      if (file.size > 10 * 1024 * 1024)
        return showToast.error("Image must be under 10MB");
      // Use FileReader instead of createObjectURL â€” prevents black preview
      // on mobile Safari where blob URL decoding can be deferred/fail.
      // Also works for HEIC files which may not have a recognised MIME type.
      const reader = new FileReader();
      reader.onload = (ev) => {
        setMediaType("image");
        setMediaUrl(ev.target.result); // data:image/... URL â€” always works on mobile
        setMediaFile(file);
        setStep(2);
        setActiveOverlay(null);
      };
      reader.onerror = () => showToast.error("Failed to read image file");
      reader.readAsDataURL(file);
    } else {
      showToast.error("Unsupported file type");
    }
  };

  // Read EXIF orientation tag from a JPEG blob (first 64KB is enough)
  const getExifOrientation = (file) =>
    new Promise((resolve) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        const view = new DataView(e.target.result);
        if (view.getUint16(0, false) !== 0xffd8) return resolve(1); // not JPEG
        let offset = 2;
        while (offset < view.byteLength) {
          const marker = view.getUint16(offset, false);
          offset += 2;
          if (marker === 0xffe1) {
            if (view.getUint32((offset += 2), false) !== 0x45786966)
              return resolve(1);
            const little = view.getUint16((offset += 6), false) === 0x4949;
            offset += view.getUint32(offset + 4, little);
            const tags = view.getUint16(offset, little);
            offset += 2;
            for (let i = 0; i < tags; i++) {
              if (view.getUint16(offset + i * 12, little) === 0x0112)
                return resolve(view.getUint16(offset + i * 12 + 8, little));
            }
          } else if ((marker & 0xff00) !== 0xff00) {
            break;
          } else {
            offset += view.getUint16(offset, false);
          }
        }
        resolve(1);
      };
      reader.readAsArrayBuffer(file.slice(0, 65536));
    });

  const getCroppedImg = (imageSrc, pixelCrop, sourceFile) => {
    return new Promise((resolve, reject) => {
      const image = new Image();
      // Allow cross-origin blob URLs on mobile
      image.crossOrigin = "anonymous";
      image.onload = async () => {
        // Read EXIF orientation if we have the source file (JPEG from camera)
        let orientation = 1;
        if (
          sourceFile &&
          (sourceFile.type === "image/jpeg" ||
            sourceFile.type === "image/jpg")
        ) {
          try {
            orientation = await getExifOrientation(sourceFile);
          } catch {}
        }

        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        
        const swapped = orientation >= 5 && orientation <= 8;
        canvas.width = swapped ? pixelCrop.height : pixelCrop.width;
        canvas.height = swapped ? pixelCrop.width : pixelCrop.height;

        ctx.save();
        // Apply EXIF orientation transform
        switch (orientation) {
          case 2: ctx.transform(-1, 0, 0, 1, canvas.width, 0); break;
          case 3: ctx.transform(-1, 0, 0, -1, canvas.width, canvas.height); break;
          case 4: ctx.transform(1, 0, 0, -1, 0, canvas.height); break;
          case 5: ctx.transform(0, 1, 1, 0, 0, 0); break;
          case 6: ctx.transform(0, 1, -1, 0, canvas.height, 0); break;
          case 7: ctx.transform(0, -1, -1, 0, canvas.height, canvas.width); break;
          case 8: ctx.transform(0, -1, 1, 0, 0, canvas.width); break;
          default: break; // orientation 1 â€” no transform needed
        }

        ctx.drawImage(
          image,
          pixelCrop.x,
          pixelCrop.y,
          pixelCrop.width,
          pixelCrop.height,
          0,
          0,
          pixelCrop.width,
          pixelCrop.height,
        );
        ctx.restore();
        resolve(canvas.toDataURL("image/jpeg", 0.92));
      };
      image.onerror = (err) => reject(err);
      image.src = imageSrc;
    });
  };

  const handleApplyCrop = async () => {
    try {
      const croppedBase64 = await getCroppedImg(mediaUrl, croppedAreaPixels, mediaFile);
      setMediaUrl(croppedBase64);
      setActiveOverlay(null);
    } catch (e) {
      showToast.error("Failed to crop image");
    }
  };

  const handleSelectAndClose = (track) => {
    const songData = {
      songTitle: track.title,
      artistName: track.artist,
      audioUrl: track.previewUrl,
      albumImage: track.albumImage,
      spotifyUrl: track.spotifyUrl,
      startTime: 0,
      duration: 15,
    };
    setSelectedSong(songData);
    setPreviewTrackId(null);

    setStickers((prev) => prev.filter((s) => s.type !== "music"));
    addSticker("music", { data: songData });

    if (track.previewUrl) {
      setTimeout(() => {
        if (audioRef.current) {
          AudioManager.stopAll();
          audioRef.current.src = track.previewUrl;
          AudioManager.play("story-preview", audioRef.current, {
            source: "story",
          });
          setIsPlaying(true);
        }
      }, 100);
    } else {
      if (audioRef.current) audioRef.current.pause();
      setIsPlaying(false);
    }
    setActiveOverlay(null);
  };

  const handlePreviewToggle = (track, e) => {
    e.stopPropagation();
    if (previewTrackId === track.id) {
      if (isPlaying) {
        audioRef.current?.pause();
        setIsPlaying(false);
      } else {
        AudioManager.play("story-preview", audioRef.current, {
          source: "story",
        });
        setIsPlaying(true);
      }
    } else {
      setPreviewTrackId(track.id);
      if (track.previewUrl) {
        if (audioRef.current) {
          AudioManager.stopAll();
          audioRef.current.src = track.previewUrl;
          AudioManager.play("story-preview", audioRef.current, {
            source: "story",
          });
          setIsPlaying(true);
        }
      } else {
        audioRef.current?.pause();
        setIsPlaying(false);
      }
    }
  };

  const handlePublish = async () => {
    setIsSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("mediaType", mediaType);

      const textStickers = stickers.filter((s) => s.type === "text");
      const locationSticker = stickers.find((s) => s.type === "location");
      const songSticker = stickers.find((s) => s.type === "music");

      const combinedCaption = textStickers.map((s) => s.text).join("\n\n");
      formData.append("caption", combinedCaption);
      formData.append("location", locationSticker ? locationSticker.text : "");
      formData.append("captionPosition", "center");
      formData.append(
        "captionColor",
        textStickers.length > 0 ? textStickers[0].style.color : "white",
      );

      if (visibility === "private" && allowedUsers.length === 0) {
        showToast.error("Please select at least one user for a private story");
        setIsSubmitting(false);
        return;
      }

      formData.append("visibility", visibility);
      if (visibility === "private")
        formData.append("allowedUsers", JSON.stringify(allowedUsers));
      if (hiddenUsers.length > 0)
        formData.append("hiddenFrom", JSON.stringify(hiddenUsers));

      if (songSticker) {
        formData.append(
          "song",
          JSON.stringify({
            ...songSticker.data,
            stickerPosition: { x: songSticker.xPercent || 50, y: songSticker.yPercent || 50 },
            stickerStyle: "minimal",
          }),
        );
      }

      const responsiveStickers = stickers.map((s) => {
        return {
          ...s,
          xPercent: typeof s.xPercent === "number" ? s.xPercent : 50,
          yPercent: typeof s.yPercent === "number" ? s.yPercent : 50,
        };
      });

      formData.append("stickers", JSON.stringify(responsiveStickers));

      if (mediaType === "video" && mediaFile) {
        formData.append("media", mediaFile);
      } else {
        const fetchRes = await fetch(mediaUrl);
        const blob = await fetchRes.blob();
        formData.append("media", blob, "story_image.jpg");
      }

      const res = await axios.post(
        `/social/story`,
        formData,
        {
          withCredentials: true,
          timeout: 0,
        },
      );

      if (res.data.success) {
        showToast.success("Story published!");
        onSuccess();
        handleClose();
      }
    } catch (err) {
      console.error("Story publish error:", err);
      showToast.error(err.response?.data?.message || "Failed to publish story");
    } finally {
      setIsSubmitting(false);
    }
  };

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

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className={`fixed inset-0 z-[100000] flex items-center justify-center sm:p-4 transition-colors duration-300 ${step === 1 ? "bg-slate-900/60 backdrop-blur-sm" : "bg-black"}`}
        >
          {/* Gallery file input â€” all media */}
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*,video/*,.heic,.heif"
            className="hidden"
            onChange={handleFileChange}
          />
          {/* Camera input â€” direct camera capture on mobile */}
          <input
            type="file"
            ref={cameraInputRef}
            accept="image/*,video/*"
            capture="environment"
            className="hidden"
            onChange={handleFileChange}
          />

          {step === 1 && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="w-full max-w-[400px] bg-white rounded-3xl shadow-2xl flex flex-col p-6 m-4"
              onDragOver={(e) => {
                e.preventDefault();
              }}
              onDrop={(e) => {
                e.preventDefault();
                if (e.dataTransfer.files?.length > 0)
                  handleFileChange({
                    target: { files: [e.dataTransfer.files[0]] },
                  });
              }}
            >
              {/* Tap-to-select area */}
              <div
                className="flex-1 border-2 border-dashed border-brand-200 rounded-2xl flex flex-col items-center justify-center p-8 text-center hover:bg-brand-50/50 hover:border-brand-300 transition-all cursor-pointer group min-h-[220px] active:bg-brand-50"
                onClick={() => fileInputRef.current?.click()}
              >
                <div className="w-16 h-16 bg-brand-100 rounded-full flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-200">
                  <ImagePlus className="w-8 h-8 text-brand-600" />
                </div>
                <h3 className="text-xl font-bold text-slate-800 mb-2">
                  Share Your Journey
                </h3>
                <p className="text-sm text-slate-500 mb-4">
                  Tap to pick from gallery, or use the buttons below.
                </p>
                <div className="text-[11px] font-bold text-slate-400 bg-slate-100 px-4 py-1.5 rounded-full uppercase tracking-wider">
                  JPG Â· PNG Â· MP4 (MAX 1 MIN)
                </div>
              </div>

              {/* Action buttons â€” three options on mobile */}
              <div className="mt-5 flex gap-2 shrink-0">
                <button
                  onClick={handleClose}
                  className="py-3.5 px-4 rounded-xl font-bold text-slate-600 bg-slate-100 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                {/* Camera button â€” opens native camera directly on mobile */}
                <button
                  onClick={() => cameraInputRef.current?.click()}
                  className="flex-1 py-3.5 rounded-xl font-bold text-primary-600 border-2 border-primary-600/30 bg-primary-600/5 hover:bg-primary-600/10 transition-all flex items-center justify-center gap-2"
                >
                  ðŸ“· Camera
                </button>
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="flex-1 py-3.5 rounded-xl font-bold text-white bg-gradient-to-r from-brand-600 to-brand-600 shadow-md hover:-translate-y-0.5 transition-all"
                >
                  Gallery
                </button>
              </div>
            </motion.div>
          )}

          {step === 2 && (
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="relative w-full h-full max-w-[430px] mx-auto sm:h-[95vh] sm:rounded-[36px] overflow-hidden bg-black shadow-2xl flex flex-col"
              ref={previewRef}
            >
              <div className="absolute inset-0 z-0 bg-black flex items-center justify-center">
                {mediaType === "video" ? (
                  <video
                    src={mediaUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-contain bg-black"
                  />
                ) : (
                  <img
                    src={mediaUrl}
                    alt="Preview"
                    className="w-full h-full object-contain bg-black"
                  />
                )}
              </div>

              {/* Stickers Layer */}
              <div className="absolute inset-0 z-10 pointer-events-none overflow-hidden">
                {stickers.map((sticker) => {
                  if (activeOverlay && sticker.id === editingStickerId)
                    return null;
                  return (
                    <StorySticker
                      key={sticker.id}
                      sticker={sticker}
                      mode="edit"
                      previewRef={previewRef}
                      onRemove={removeSticker}
                      onUpdate={updateSticker}
                      onLocationClick={() => handleLocationClick(sticker)}
                      onMusicClick={() => setActiveOverlay("music")}
                      onTextClick={() => handleTextClick(sticker)}
                      isPlaying={isPlaying}
                      onPlayToggle={() => {
                        if (isPlaying) {
                          audioRef.current?.pause();
                          setIsPlaying(false);
                        } else {
                          AudioManager.play("story-preview", audioRef.current, {
                            source: "story",
                          });
                          setIsPlaying(true);
                        }
                      }}
                    />
                  );
                })}
              </div>

              <div className="absolute top-4 right-4 z-20">
                <button
                  onClick={handleClose}
                  className="p-2 bg-black/40 hover:bg-black/60 backdrop-blur-md rounded-full text-white transition-all shadow-sm"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {!activeOverlay && (
                <motion.div
                  initial={{ y: 50, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  className="absolute bottom-0 inset-x-0 z-20"
                >
                  <div className="absolute right-6 -top-10">
                    <div
                      className="bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-full flex items-center gap-1.5 text-white shadow-xl border border-white/10 drop-shadow-md cursor-pointer hover:bg-black/80 transition-all"
                      onClick={() => setActiveOverlay("privacy")}
                    >
                      {visibility === "public" && (
                        <>
                          <Globe className="w-3.5 h-3.5" />{" "}
                          <span className="text-xs font-bold tracking-wide">
                            Public
                          </span>
                        </>
                      )}
                      {visibility === "friends" && (
                        <>
                          <Users className="w-3.5 h-3.5" />{" "}
                          <span className="text-xs font-bold tracking-wide">
                            Friends
                          </span>
                        </>
                      )}
                      {visibility === "private" && (
                        <>
                          <Lock className="w-3.5 h-3.5" />{" "}
                          <span className="text-xs font-bold tracking-wide">
                            Private ({allowedUsers.length} people)
                          </span>
                        </>
                      )}
                    </div>
                  </div>

                  <div className="bg-white/95 backdrop-blur-xl border border-slate-200/50 rounded-[2rem] h-[72px] flex items-center justify-between shadow-2xl px-2 mb-4 mx-3 relative">
                    <div className="flex gap-1">
                      <button
                        onClick={() => {
                          setTextInput("");
                          setEditingStickerId(null);
                          setActiveOverlay("caption");
                        }}
                        className="w-11 h-11 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-full transition-all hover:scale-105 active:scale-95 shrink-0"
                        aria-label="Text"
                      >
                        <Type className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => setActiveOverlay("music")}
                        className="w-11 h-11 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-full transition-all hover:scale-105 active:scale-95 shrink-0"
                        aria-label="Music"
                      >
                        <Music className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => {
                          setLocationQuery("");
                          setEditingStickerId(null);
                          setActiveOverlay("location");
                        }}
                        className="w-11 h-11 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-full transition-all hover:scale-105 active:scale-95 shrink-0"
                        aria-label="Location"
                      >
                        <MapPin className="w-6 h-6" />
                      </button>
                      <button
                        onClick={() => setActiveOverlay("emoji")}
                        className="w-11 h-11 flex items-center justify-center text-slate-700 hover:bg-slate-100 rounded-full transition-all hover:scale-105 active:scale-95 shrink-0"
                        aria-label="Emoji"
                      >
                        <Smile className="w-6 h-6" />
                      </button>
                    </div>

                    <div className="flex items-center gap-2 pr-1 shrink-0">
                      <button
                        onClick={() => setActiveOverlay("privacy")}
                        className="h-11 px-3 bg-slate-100 hover:bg-slate-200 rounded-full text-slate-700 flex items-center justify-center gap-1.5 transition-all hover:scale-105 active:scale-95 shadow-sm shrink-0"
                        aria-label="Audience"
                      >
                        <Users className="w-5 h-5" />
                        <span className="text-sm font-bold">Audience</span>
                      </button>
                      <button
                        onClick={handlePublish}
                        disabled={isSubmitting}
                        className="bg-gradient-to-r from-brand-600 to-brand-600 text-white w-12 h-12 rounded-full flex items-center justify-center hover:scale-105 active:scale-95 transition-all shadow-lg disabled:opacity-50 shrink-0"
                      >
                        {isSubmitting ? (
                          <Loader2 className="w-5 h-5 animate-spin" />
                        ) : (
                          <Send className="w-5 h-5 ml-0.5" />
                        )}
                      </button>
                    </div>
                  </div>
                </motion.div>
              )}

              {/* OVERLAYS */}
              <AnimatePresence>
                {/* TEXT EDITOR OVERLAY */}
                {activeOverlay === "caption" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-30 bg-black/75 backdrop-blur-md flex flex-col transition-colors duration-300"
                  >
                    <div className="flex justify-between items-center p-4 pt-6 z-40">
                      <button
                        onClick={() => {
                          setTextInput("");
                          setActiveOverlay(null);
                          setActiveMenu(null);
                          setEditingStickerId(null);
                        }}
                        className="text-white bg-white/20 hover:bg-white/30 backdrop-blur-md font-bold text-sm px-5 py-2 rounded-full shadow-lg hover:scale-105 transition-all border border-white/10"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => {
                          if (textInput.trim()) {
                            if (editingStickerId) {
                              updateSticker(editingStickerId, {
                                text: textInput,
                                style: { ...textStyle, align: "center" },
                              });
                            } else {
                              addSticker("text", {
                                text: textInput,
                                style: { ...textStyle, align: "center" },
                              });
                            }
                          }
                          setTextInput("");
                          setActiveOverlay(null);
                          setActiveMenu(null);
                          setEditingStickerId(null);
                        }}
                        className="text-slate-900 bg-white font-bold text-sm px-5 py-2 rounded-full shadow-lg hover:scale-105 transition-all"
                      >
                        Done
                      </button>
                    </div>

                    <div className="flex-1 flex flex-col justify-center items-center px-4 relative">
                      <div
                        className={`relative transition-all duration-300 inline-grid max-w-full ${textStyle.bg === "glass" ? "bg-black/40 backdrop-blur-md px-4 py-1.5 rounded-2xl" : textStyle.bg === "solid" ? "bg-white text-slate-900 px-4 py-1.5 rounded-2xl shadow-xl" : "px-2 py-0.5"}`}
                      >
                        <div
                          className="invisible whitespace-pre-wrap text-4xl font-bold text-center drop-shadow-xl leading-tight p-0 m-0 break-words min-w-[2ch]"
                          style={{
                            fontFamily: textStyle.font,
                            gridArea: "1 / 1 / 2 / 2",
                          }}
                        >
                          {textInput ? textInput + " " : "Type something..."}
                        </div>
                        <textarea
                          autoFocus
                          value={textInput}
                          onChange={(e) => setTextInput(e.target.value)}
                          placeholder="Type something..."
                          className="w-full h-full bg-transparent border-none outline-none focus:outline-none focus:ring-0 resize-none text-4xl font-bold text-center placeholder:text-white/40 drop-shadow-xl leading-tight overflow-hidden caret-current p-0 m-0 break-words"
                          style={{
                            color:
                              textStyle.bg === "solid" &&
                              textStyle.color === "#ffffff"
                                ? "#000000"
                                : textStyle.color,
                            fontFamily: textStyle.font,
                            gridArea: "1 / 1 / 2 / 2",
                          }}
                        />
                      </div>
                    </div>

                    {/* Compact Bottom Controls */}
                    <div className="flex flex-col items-center gap-4 pb-8 pt-6 relative z-20">
                      <AnimatePresence>
                        {activeMenu === "color" && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="flex gap-3 p-3 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-2 shadow-xl"
                          >
                            {textColors.map((c) => (
                              <button
                                key={c}
                                onClick={() =>
                                  setTextStyle((s) => ({ ...s, color: c }))
                                }
                                className={`w-8 h-8 rounded-full border-2 transition-transform ${textStyle.color === c ? "border-white scale-110" : "border-transparent"}`}
                                style={{ backgroundColor: c }}
                              />
                            ))}
                          </motion.div>
                        )}
                        {activeMenu === "font" && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: 20 }}
                            className="flex overflow-x-auto gap-2 p-2 bg-white/10 backdrop-blur-md rounded-full border border-white/20 mb-2 shadow-xl scrollbar-none max-w-[90vw]"
                          >
                            {fonts.map((f) => (
                              <button
                                key={f.name}
                                onClick={() =>
                                  setTextStyle((s) => ({
                                    ...s,
                                    font: f.family,
                                  }))
                                }
                                className={`px-4 py-2 rounded-full whitespace-nowrap text-sm font-bold transition-all ${textStyle.font === f.family ? "bg-white text-slate-900 shadow-md" : "text-white hover:bg-white/20"}`}
                                style={{ fontFamily: f.family }}
                              >
                                {f.name}
                              </button>
                            ))}
                          </motion.div>
                        )}
                      </AnimatePresence>

                      <div className="flex justify-center items-center gap-3">
                        <button
                          onClick={() =>
                            setTextStyle((s) => ({
                              ...s,
                              bg:
                                s.bg === "none"
                                  ? "glass"
                                  : s.bg === "glass"
                                    ? "solid"
                                    : "none",
                            }))
                          }
                          className="w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center transition-all hover:bg-white/30 shadow-sm border border-white/10"
                          aria-label="Toggle Background"
                        >
                          <Palette className="w-5 h-5" />
                        </button>

                        <button
                          onClick={() =>
                            setActiveMenu(
                              activeMenu === "color" ? null : "color",
                            )
                          }
                          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${activeMenu === "color" ? "bg-white text-slate-900 border-white shadow-md" : "bg-white/20 text-white border-white/10 backdrop-blur-md hover:bg-white/30"}`}
                        >
                          Color
                        </button>

                        <button
                          onClick={() =>
                            setActiveMenu(activeMenu === "font" ? null : "font")
                          }
                          className={`px-5 py-2.5 rounded-full text-sm font-bold transition-all border ${activeMenu === "font" ? "bg-white text-slate-900 border-white shadow-md" : "bg-white/20 text-white border-white/10 backdrop-blur-md hover:bg-white/30"}`}
                        >
                          Font
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* LOCATION SEARCH OVERLAY */}
                {activeOverlay === "location" && (
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute bottom-0 inset-x-0 h-[75vh] bg-white/98 backdrop-blur-2xl rounded-t-[32px] z-50 flex flex-col shadow-2xl p-5 md:p-6 overflow-hidden"
                  >
                    <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-3 shrink-0" />

                    <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4 shrink-0">
                      <div className="flex items-center gap-3">
                        <button
                          type="button"
                          onClick={() => {
                            setLocationQuery("");
                            setEditingStickerId(null);
                            setActiveOverlay(null);
                          }}
                          className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-brand-600 transition-all hover:bg-brand-100"
                        >
                          <ArrowLeft className="h-4 w-4" />
                        </button>
                        <div>
                          <h3 className="text-base font-extrabold text-slate-900 leading-tight">
                            Add Location
                          </h3>
                          <p className="text-[11px] font-semibold text-slate-400 leading-tight">
                            Tag where this story happened
                          </p>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={() => {
                          setLocationQuery("");
                          setEditingStickerId(null);
                          setActiveOverlay(null);
                        }}
                        className="rounded-full p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600"
                      >
                        <X className="h-4 w-4" />
                      </button>
                    </div>

                    <div className="relative mb-3 shrink-0">
                      <MapPin className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-brand-500" />
                      <input
                        autoFocus
                        type="text"
                        placeholder="Search city, state, or landmark..."
                        value={locationQuery}
                        onChange={(e) => setLocationQuery(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && locationQuery.trim()) {
                            handleSaveLocation(locationQuery.trim());
                          }
                        }}
                        className="w-full rounded-2xl border border-slate-200 bg-slate-50 py-2.5 pl-10 pr-9 text-xs font-bold text-slate-800 outline-none transition-all placeholder:text-slate-400 focus:border-brand-500 focus:bg-white focus:ring-4 focus:ring-brand-500/10 shadow-2xs"
                      />
                      {locationQuery && (
                        <button
                          type="button"
                          onClick={() => setLocationQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 rounded-full p-1 text-slate-400 hover:bg-slate-200 hover:text-slate-600"
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin">
                      {isSearchingLocation ? (
                        <div className="flex h-40 flex-col items-center justify-center gap-2.5 text-brand-600">
                          <Loader2 className="h-6 w-6 animate-spin" />
                          <span className="text-xs font-bold text-slate-500">
                            Searching destinations...
                          </span>
                        </div>
                      ) : (
                        <>
                          {!locationQuery.trim() && (
                            <div className="mb-2">
                              <p className="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                ðŸ”¥ Popular Destinations
                              </p>
                              <div className="flex flex-col gap-1.5">
                                {popularDestinations.map((dest) => (
                                  <button
                                    key={dest.value}
                                    type="button"
                                    onClick={() =>
                                      handleSaveLocation(dest.value)
                                    }
                                    className="group flex w-full items-center gap-3 rounded-2xl border border-transparent bg-slate-50/80 p-2.5 text-left transition-all hover:border-brand-200 hover:bg-brand-50/60 hover:shadow-2xs active:scale-[0.99]"
                                  >
                                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-base shadow-2xs group-hover:scale-110 transition-transform">
                                      {dest.label.split(" ")[0]}
                                    </div>
                                    <span className="min-w-0 flex-1 truncate text-xs font-bold text-slate-800 group-hover:text-brand-900">
                                      {dest.label.split(" ").slice(1).join(" ")}
                                    </span>
                                  </button>
                                ))}
                              </div>
                            </div>
                          )}

                          {locationQuery.trim() &&
                            locationResults.length > 0 && (
                              <div className="flex flex-col gap-1.5">
                                <p className="mb-2 px-1 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
                                  SEARCH RESULTS
                                </p>
                                {locationResults.map((res, i) => {
                                  const placeName = res.display_name
                                    .split(",")[0]
                                    .trim();
                                  const secondaryText = res.display_name
                                    .split(",")
                                    .slice(1)
                                    .join(", ")
                                    .trim();

                                  return (
                                    <button
                                      type="button"
                                      key={`${res.place_id || i}`}
                                      onClick={() =>
                                        handleSaveLocation(placeName)
                                      }
                                      className="group flex w-full items-center gap-3 rounded-2xl border border-slate-100 bg-slate-50/80 p-2.5 text-left transition-all hover:border-brand-200 hover:bg-brand-50/70 hover:shadow-2xs active:scale-[0.99]"
                                    >
                                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-brand-100 text-brand-600 transition-transform group-hover:scale-105 group-hover:bg-brand-600 group-hover:text-white">
                                        <MapPin className="h-4 w-4" />
                                      </div>
                                      <span className="min-w-0 flex-1">
                                        <span className="block truncate text-xs font-bold text-slate-900 group-hover:text-brand-900">
                                          {placeName}
                                        </span>
                                        <span className="mt-0.5 block truncate text-[11px] font-medium text-slate-500">
                                          {secondaryText || res.display_name}
                                        </span>
                                      </span>
                                    </button>
                                  );
                                })}
                              </div>
                            )}

                          {locationQuery.trim() &&
                            locationResults.length === 0 &&
                            !isSearchingLocation && (
                              <div className="flex flex-col gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    handleSaveLocation(locationQuery.trim())
                                  }
                                  className="group flex w-full items-center gap-3 rounded-2xl border border-brand-200 bg-brand-50 p-3 text-left transition-all hover:bg-brand-100 shadow-2xs active:scale-[0.99]"
                                >
                                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-brand-600 text-white shadow-2xs">
                                    <MapPin className="h-5 w-5" />
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <p className="truncate text-xs font-bold text-brand-900">
                                      Use "{locationQuery}"
                                    </p>
                                    <p className="text-[11px] font-semibold text-brand-600">
                                      Tap to add custom location sticker
                                    </p>
                                  </div>
                                </button>
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* EMOJI PICKER OVERLAY */}
                {activeOverlay === "emoji" && (
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute bottom-0 inset-x-0 bg-white/95 backdrop-blur-xl rounded-t-[32px] z-40 flex flex-col shadow-2xl p-6 pb-12"
                  >
                    <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto mb-4" />
                    <div className="flex justify-between items-center mb-6">
                      <h3 className="text-slate-800 font-black text-lg">
                        Travel Emojis
                      </h3>
                      <button
                        onClick={() => setActiveOverlay(null)}
                        className="text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1.5"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="flex flex-wrap justify-center gap-4">
                      {travelEmojis.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => {
                            addSticker("emoji", { emoji });
                            setActiveOverlay(null);
                          }}
                          className="text-4xl hover:scale-110 hover:-translate-y-1 transition-all drop-shadow-sm"
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  </motion.div>
                )}

                {/* MUSIC SEARCH */}
                {activeOverlay === "music" && (
                  <motion.div
                    initial={{ y: "100%" }}
                    animate={{ y: 0 }}
                    exit={{ y: "100%" }}
                    transition={{ type: "spring", damping: 25, stiffness: 200 }}
                    className="absolute bottom-0 inset-x-0 h-[70vh] bg-white rounded-t-[32px] z-40 flex flex-col shadow-2xl"
                  >
                    <div className="p-4 border-b border-slate-100 flex items-center justify-between relative">
                      <div className="w-12 h-1 bg-slate-200 rounded-full mx-auto absolute top-2 left-1/2 -translate-x-1/2" />
                      <h3 className="text-slate-800 font-black text-lg mt-2">
                        Add Music
                      </h3>
                      <button
                        onClick={() => setActiveOverlay(null)}
                        className="mt-2 text-slate-400 hover:text-slate-600 bg-slate-100 rounded-full p-1.5"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                    <div className="p-4 pb-2">
                      <div className="relative mb-3">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                        <input
                          type="text"
                          value={musicSearchQuery}
                          onChange={(e) => setMusicSearchQuery(e.target.value)}
                          placeholder="Search new movie songs, hits..."
                          className="w-full bg-slate-50 border border-slate-200 text-slate-800 placeholder:text-slate-400 px-11 py-3 rounded-2xl outline-none focus:ring-2 focus:ring-primary-600/30 font-semibold text-sm"
                        />
                      </div>
                      {!musicSearchQuery.trim() && (
                        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
                          {popularLanguages.map((lang) => (
                            <button
                              key={lang.value}
                              type="button"
                              onClick={() => setSelectedMusicLang(lang.value)}
                              className={`px-3 py-1.5 rounded-full text-xs font-bold whitespace-nowrap shrink-0 transition-all ${selectedMusicLang === lang.value ? "bg-primary-600 text-white shadow-md" : "bg-slate-100 text-slate-600 hover:bg-slate-200"}`}
                            >
                              {lang.label}
                            </button>
                          ))}
                        </div>
                      )}
                    </div>

                    <div className="flex-1 overflow-y-auto px-4 py-2 space-y-2">
                      {isSearchingMusic ? (
                        <div className="py-12 flex justify-center">
                          <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
                        </div>
                      ) : (
                        <>
                          {!musicSearchQuery.trim() &&
                            trendingSongs.length > 0 && (
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                                TRENDING SONGS
                              </p>
                            )}
                          {musicSearchQuery.trim() &&
                            spotifyResults.length > 0 && (
                              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 px-2">
                                SEARCH RESULTS
                              </p>
                            )}
                          {(musicSearchQuery.trim()
                            ? spotifyResults
                            : trendingSongs
                          )
                            .filter(
                              (track, index, self) =>
                                index ===
                                self.findIndex(
                                  (t) =>
                                    (t?.title
                                      ? String(t.title)
                                          .split("(")[0]
                                          .trim()
                                          .toLowerCase()
                                      : "") ===
                                      (track?.title
                                        ? String(track.title)
                                            .split("(")[0]
                                            .trim()
                                            .toLowerCase()
                                        : "") &&
                                    (t?.artist || "").toLowerCase() ===
                                      (track?.artist || "").toLowerCase(),
                                ),
                            )
                            .map((track) => (
                              <div
                                key={track.id}
                                className={`group flex items-center justify-between p-2 h-[62px] rounded-2xl transition-all cursor-pointer ${selectedSong?.songTitle === track.title ? "bg-brand-50 border border-brand-100" : "bg-white hover:bg-slate-50 border border-transparent"}`}
                                onClick={() => handleSelectAndClose(track)}
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  <div className="relative w-[46px] h-[46px] shrink-0 rounded-xl overflow-hidden bg-slate-100 border border-slate-200">
                                    {track.albumImage ? (
                                      <img
                                        src={track.albumImage}
                                        alt="Art"
                                        className="w-full h-full object-cover"
                                      />
                                    ) : (
                                      <div className="w-full h-full flex items-center justify-center">
                                        <Music className="w-5 h-5 text-slate-300" />
                                      </div>
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1 pr-2">
                                    <p className="text-sm font-black text-slate-800 truncate">
                                      {track.title}
                                    </p>
                                    <p className="text-xs font-medium text-slate-500 truncate">
                                      {track.artist}
                                    </p>
                                  </div>
                                </div>
                                <div className="flex items-center justify-center w-10 h-10 shrink-0">
                                  {previewTrackId === track.id && isPlaying ? (
                                    <button
                                      onClick={(e) =>
                                        handlePreviewToggle(track, e)
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-full bg-white text-primary-600 shadow-sm"
                                    >
                                      <Pause className="w-3.5 h-3.5" />
                                    </button>
                                  ) : (
                                    <button
                                      onClick={(e) =>
                                        handlePreviewToggle(track, e)
                                      }
                                      className="flex h-8 w-8 items-center justify-center rounded-full bg-brand-50 text-primary-600 transition-all hover:bg-primary-600 hover:text-white"
                                    >
                                      <Play className="w-3.5 h-3.5 translate-x-[1px]" />
                                    </button>
                                  )}
                                </div>
                              </div>
                            ))}
                          {(musicSearchQuery.trim()
                            ? spotifyResults
                            : trendingSongs
                          ).length === 0 &&
                            !isSearchingMusic && (
                              <div className="py-12 text-center">
                                {spotifyError ? (
                                  <p className="text-sm text-rose-500 font-bold">
                                    {spotifyError}
                                  </p>
                                ) : (
                                  <p className="text-xs font-bold text-slate-500">
                                    No songs found.
                                  </p>
                                )}
                              </div>
                            )}
                        </>
                      )}
                    </div>
                  </motion.div>
                )}

                {/* PRIVACY OVERLAY */}
                {activeOverlay === "privacy" && (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 z-40 bg-slate-900/40 backdrop-blur-md flex flex-col items-center justify-center p-6"
                  >
                    <div className="bg-white w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl border border-slate-100 flex flex-col max-h-[80vh]">
                      <div className="p-4 border-b border-slate-100 flex items-center justify-between shrink-0">
                        <h3 className="text-slate-800 font-black text-lg">
                          {isSelectingUsers ? "Select Users" : "Story Privacy"}
                        </h3>
                        <button
                          onClick={() => {
                            if (isSelectingUsers) {
                              setIsSelectingUsers(false);
                            } else {
                              setActiveOverlay(null);
                            }
                          }}
                          className="text-slate-400 hover:text-slate-600 p-1 bg-slate-100 rounded-full"
                        >
                          {isSelectingUsers ? (
                            <ArrowLeft className="w-4 h-4" />
                          ) : (
                            <X className="w-4 h-4" />
                          )}
                        </button>
                      </div>

                      {!isSelectingUsers ? (
                        <>
                          <div className="p-2 overflow-y-auto">
                            {[
                              {
                                id: "public",
                                label: "Public",
                                icon: (
                                  <Globe className="w-5 h-5 text-slate-600" />
                                ),
                                desc: "Anyone can view",
                              },
                              {
                                id: "friends",
                                label: "Friends",
                                icon: (
                                  <Users className="w-5 h-5 text-slate-600" />
                                ),
                                desc: "Only connected travel friends",
                              },
                              {
                                id: "private",
                                label: "Private",
                                icon: (
                                  <Lock className="w-5 h-5 text-slate-600" />
                                ),
                                desc: "Choose specific people",
                              },
                            ].map((opt) => (
                              <div
                                key={opt.id}
                                onClick={() => {
                                  setVisibility(opt.id);
                                  if (opt.id === "private")
                                    setIsSelectingUsers(true);
                                }}
                                className={`flex items-center gap-4 p-4 rounded-2xl cursor-pointer transition-all ${visibility === opt.id ? "bg-slate-50 ring-1 ring-slate-200" : "hover:bg-slate-50"}`}
                              >
                                <div className="w-10 h-10 rounded-full bg-slate-100 flex items-center justify-center text-lg shadow-inner border border-slate-200">
                                  {opt.icon}
                                </div>
                                <div className="flex-1">
                                  <p className="text-sm font-bold text-slate-800">
                                    {opt.label}
                                  </p>
                                  <p className="text-xs text-slate-500">
                                    {opt.desc}
                                  </p>
                                </div>
                                <div
                                  className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${visibility === opt.id ? "border-primary-600 bg-primary-600" : "border-slate-300"}`}
                                >
                                  {visibility === opt.id && (
                                    <Check className="w-3 h-3 text-white" />
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                          <div className="p-4 pt-2 shrink-0">
                            <button
                              onClick={() => setActiveOverlay(null)}
                              className="w-full bg-[#111827] text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition shadow-md"
                            >
                              Done
                            </button>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="p-4 border-b border-slate-100 shrink-0">
                            <div className="relative">
                              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                              <input
                                type="text"
                                value={userSearchQuery}
                                onChange={(e) =>
                                  setUserSearchQuery(e.target.value)
                                }
                                placeholder="Search users..."
                                className="w-full bg-slate-50 border border-slate-200 rounded-xl py-2 pl-9 pr-3 text-sm focus:outline-none focus:ring-2 focus:ring-primary-600/30"
                              />
                            </div>
                          </div>
                          <div className="p-2 overflow-y-auto flex-1 min-h-[200px]">
                            {isSearchingUsers ? (
                              <div className="py-8 flex justify-center">
                                <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                              </div>
                            ) : userSearchResults.length > 0 ? (
                              userSearchResults.map((u) => (
                                <div
                                  key={u._id}
                                  onClick={() => {
                                    setAllowedUsers((prev) =>
                                      prev.includes(u._id)
                                        ? prev.filter((id) => id !== u._id)
                                        : [...prev, u._id],
                                    );
                                  }}
                                  className="flex items-center gap-3 p-3 rounded-xl hover:bg-slate-50 cursor-pointer"
                                >
                                  <div className="w-10 h-10 rounded-full overflow-hidden shrink-0">
                                    <Avatar
                                      user={u}
                                      className="w-full h-full object-cover"
                                    />
                                  </div>
                                  <div className="flex-1 min-w-0">
                                    <p className="text-sm font-bold text-slate-800 truncate">
                                      {u.username}
                                    </p>
                                    <p className="text-xs text-slate-500 truncate">
                                      {u.name}
                                    </p>
                                  </div>
                                  <div
                                    className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${allowedUsers.includes(u._id) ? "border-primary-600 bg-primary-600" : "border-slate-300"}`}
                                  >
                                    {allowedUsers.includes(u._id) && (
                                      <Check className="w-3 h-3 text-white" />
                                    )}
                                  </div>
                                </div>
                              ))
                            ) : (
                              <div className="py-8 text-center text-slate-500 text-sm">
                                No users found
                              </div>
                            )}
                          </div>
                          <div className="p-4 pt-2 border-t border-slate-100 shrink-0">
                            <button
                              onClick={() => setIsSelectingUsers(false)}
                              className="w-full bg-[#111827] text-white py-3 rounded-xl font-bold text-sm hover:bg-black transition shadow-md"
                            >
                              Confirm Users ({allowedUsers.length})
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          <audio
            ref={audioRef}
            loop
            className="hidden"
            onEnded={() => setIsPlaying(false)}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
};

export default CreateStoryModal;

