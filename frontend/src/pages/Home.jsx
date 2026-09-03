import { showToast } from "../utils/showToast";
import React, {
useState,
useEffect,
useContext,
useRef,
useCallback,
useMemo } from
"react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/authContext";

import AudioManager from "../utils/AudioManager";
import { MessageSquare, X, MapPin, Compass, UserPlus, Sparkles, Bell, Loader2, ShieldAlert, Camera } from "lucide-react";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../api/axios";
import { SocketContext } from "../context/SocketContext";
import { SOCKET_EVENTS } from "../constants/socketEvents";
import Swal from "sweetalert2";
import CreateDispatchModal from "../components/modals/CreateDispatchModal";
import DispatchViewer from "../components/story/DispatchViewer";
import RightSidebar from "../components/home/RightSidebar";
import Card from "../components/common/Card";
import ReportModal from "../components/modals/ReportModal";
import DispatchBar from "../components/home/DispatchBar";
import FeedCard from "../components/home/FeedCard";
import JourneyStatusWidget from "../components/home/JourneyStatusWidget";
import ExplorerDashboardWidget from "../components/home/ExplorerDashboardWidget";
import TravelWeatherWidget from "../components/home/TravelWeatherWidget";
import UpcomingTripsWidget from "../components/home/UpcomingTripsWidget";
import { resolveRelationship } from "../utils/relationshipResolver";
import { useTripMates } from "../hooks/useTripMates";
import { normalizeJourneyStatus } from "../utils/journeyLifecycle";
import { useQueryClient } from "@tanstack/react-query";
import { useRecentMemoriesQuery, useHomeSideDataQuery } from "../hooks/queries/useHomeData";
import { useScrollRestoration } from "../hooks/useScrollRestoration";

const SOCKET_URL =
process.env.REACT_APP_SOCKET_URL || "http://10.126.5.219:5000";

const formatLocation = (location) => {
  if (!location) return "";
  const parts = location.split(",").map((p) => p.trim());
  const shortLoc = parts.slice(0, 2).join(", ");
  return shortLoc.length > 30 ? shortLoc.slice(0, 27) + "..." : shortLoc;
};


const PostSkeleton = () =>
<div className="card overflow-hidden animate-pulse">
    <div className="p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-secondary-200" />
      <div className="space-y-2 flex-1">
        <div className="h-3 bg-secondary-200 rounded w-32" />
        <div className="h-2 bg-background rounded w-20" />
      </div>
    </div>
    <div className="w-full h-[380px] object-cover bg-background" />
    <div className="p-5 space-y-4">
      <div className="flex gap-4">
        <div className="w-6 h-6 rounded bg-secondary-200" />
        <div className="w-6 h-6 rounded bg-secondary-200" />
        <div className="w-6 h-6 rounded bg-secondary-200" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-secondary-200 rounded w-3/4" />
        <div className="h-3 bg-secondary-200 rounded w-1/2" />
      </div>
    </div>
  </div>;


const StorySkeleton = () =>
<div className="w-20 h-28 sm:w-24 sm:h-32 rounded-2xl bg-background relative overflow-hidden shrink-0 animate-pulse border border-border">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
  </div>;


const notifIcon = (type) => {
  if (type === "post_like")
  return <span className="text-sm leading-none">✨</span>;
  if (type === "post_comment")
  return <MessageSquare className="w-3.5 h-3.5 text-brand" />;
  if (type === "follow" || type === "new_follower")
  return <UserPlus className="w-3.5 h-3.5 text-success" />;
  if (type === "story_reply")
  return <Sparkles className="w-3.5 h-3.5 text-warning" />;
  return <Bell className="w-3.5 h-3.5 text-text-muted" />;
};

const getAllComments = (post) => {
  return Array.isArray(post?.comments) ? post.comments : [];
};

const getVisibleComments = (post) => {
  return getAllComments(post).filter(
  (comment) => !comment.hidden && !comment.deleted
  );
};

const getPreviewComments = (post) => {
  return getVisibleComments(post).slice(-3);
};

const getTotalCommentCount = (post) => {
  if (post.commentsCount !== undefined) return post.commentsCount;
  return getAllComments(post).filter((comment) => !comment.deleted).length;
};

const getVisibleCommentCount = (post) => {
  return getVisibleComments(post).length;
};


const Home = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const updateMemoriesCache = useCallback((updater) => {
    queryClient.setQueryData(['recentMemories'], (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        memories: typeof updater === 'function' ? updater(oldData.memories || []) : updater
      };
    });
  }, [queryClient]);

  const addMemoryToCache = useCallback((newPost) => {
    queryClient.setQueryData(['recentMemories'], (oldData) => {
      if (!oldData) return oldData;
      const currentList = oldData.memories || [];
      return {
        ...oldData,
        memories: [newPost, ...currentList].slice(0, 5)
      };
    });
  }, [queryClient]);
  const myUserIdStr = (user?._id || user?.id)?.toString();

  const updateStoriesCache = useCallback((updater) => {
    queryClient.setQueryData(['homeSideData', myUserIdStr], (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        stories: typeof updater === 'function' ? updater(oldData.stories || []) : updater
      };
    });
  }, [queryClient, myUserIdStr]);
  const setStories = updateStoriesCache;

  const updateSuggestionsCache = useCallback((updater) => {
    queryClient.setQueryData(['homeSideData', myUserIdStr], (oldData) => {
      if (!oldData) return oldData;
      return {
        ...oldData,
        suggestions: typeof updater === 'function' ? updater(oldData.suggestions || []) : updater
      };
    });
  }, [queryClient, myUserIdStr]);
  const setSuggestions = updateSuggestionsCache;

  const location = useLocation();

  useEffect(() => {
    AudioManager.stopAll();
    setPlayingAudioId(null);
  }, [location.pathname]);

  useEffect(() => {
    return () => {
      AudioManager.stopAll();
    };
  }, []);


  const handleAvatarError = useCallback((e, name) => {
    e.target.onerror = null;
    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Explorer")}&background=0284c7&color=fff&bold=true`;
  }, []);

  const [showAllMemories, setShowAllMemories] = useState(false);

  const {
    data: memoriesData,
    isLoading: loadingMemories,
    isError: errorMemories,
    refetch: refetchMemories
  } = useRecentMemoriesQuery(showAllMemories ? 50 : 5);
  
  const memories = useMemo(() => {
    return memoriesData?.memories || [];
  }, [memoriesData]);

  const {
    data: sideData,
    isLoading: loadingStories
  } = useHomeSideDataQuery(myUserIdStr);

  const activeJourneys = sideData?.activeJourneys || [];

  const upcomingTripsRef = useRef(null);

  const upcomingTripsList = useMemo(() => {
    return activeJourneys
      .filter((journey) => normalizeJourneyStatus(journey) === "upcoming")
      .sort((a, b) => {
        const aStart = a?.startDate ? new Date(a.startDate).getTime() : Infinity;
        const bStart = b?.startDate ? new Date(b.startDate).getTime() : Infinity;
        return aStart - bStart;
      });
  }, [activeJourneys]);

  const ongoingJourney = useMemo(() => {
    return activeJourneys.find(
      (journey) => normalizeJourneyStatus(journey) === "active"
    ) || null;
  }, [activeJourneys]);

  const dashboardJourney = useMemo(() => {
    if (ongoingJourney) return ongoingJourney;
    return upcomingTripsList[0] || null;
  }, [ongoingJourney, upcomingTripsList]);

  const handleScrollToUpcoming = useCallback(() => {
    if (upcomingTripsRef.current) {
      upcomingTripsRef.current.scrollIntoView({ behavior: "smooth", block: "start" });
    } else {
      navigate("/social/journeys");
    }
  }, [navigate]);

  const [isBannerDismissed, setIsBannerDismissed] = useState(() => localStorage.getItem("goyatrigo_home_banner_dismissed") === "true");

  const handleDismissBanner = () => {
    localStorage.setItem("goyatrigo_home_banner_dismissed", "true");
    setIsBannerDismissed(true);
  };

  const dispatches = sideData?.stories || [];
  const suggestions = sideData?.suggestions || [];
  const nearbyTrips = sideData?.nearbyTrips || [];
  const [savedPostIds, setSavedPostIds] = useState(new Set());
  const [followLoadingMap, setFollowLoadingMap] = useState({});
  const [saveLoadingMap, setSaveLoadingMap] = useState({});
  const [feltLoadingMap, setFeltLoadingMap] = useState({});
  useEffect(() => {
    if (sideData?.savedPostIds) {
      setSavedPostIds(new Set(sideData.savedPostIds));
    }
  }, [sideData?.savedPostIds]);
  const [commentsLoadingMap, setCommentsLoadingMap] = useState({});
  const [showMobileGroups, setShowMobileGroups] = useState(false);
  const storyContainerRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef(null);
  const searchDebounceRef = useRef(null);

  const [showStoryModal, setShowStoryModal] = useState(false);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [isStoryMuted, setIsStoryMuted] = useState(true);
  const [showViewersList, setShowViewersList] = useState(false);
  const [isStoryPaused, setIsStoryPaused] = useState(false);

  const [postCaption, setPostCaption] = useState("");
  const [postLocation, setPostLocation] = useState("");
  const [postTags, setPostTags] = useState("");
  const [postImage, setPostImage] = useState("");
  const [submittingPost, setSubmittingPost] = useState(false);
  const [uploadingImage, setUploadingImage] = useState(false);

  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [commentText, setCommentText] = useState({});
  const [journeyLikeAnim, setJourneyLikeAnim] = useState(null);
  const [reportModal, setReportModal] = useState({
    isOpen: false,
    targetId: null,
    targetType: "post",
    reportedUserId: null
  });
  const [isSubmittingComment, setIsSubmittingComment] = useState({});

  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [editPostData, setEditPostData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);


  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRefs = useRef({});
  const postRefs = useRef({});

  useEffect(() => {
    const pauseTimeouts = {};
    const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const postId = entry.target.getAttribute("data-post-id");
        if (!postId) return;

        const audio = audioRefs.current[postId];
        if (!entry.isIntersecting) {
          if (audio && !audio.paused) {
            pauseTimeouts[postId] = setTimeout(() => {
              AudioManager.pause(postId);
              setPlayingAudioId((prev) => prev === postId ? null : prev);
            }, 300);
          }
        } else {
          if (pauseTimeouts[postId]) {
            clearTimeout(pauseTimeouts[postId]);
            delete pauseTimeouts[postId];
          }
        }
      });
    },
    { threshold: 0.1 }
    );

    const currentPostRefs = postRefs.current;
    Object.values(currentPostRefs).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
      Object.values(pauseTimeouts).forEach(clearTimeout);
      observer.disconnect();
    };
  }, [memories]);

  const toggleAudio = (postId) => {
    if (AudioManager.isLocked()) return;
    const audio = audioRefs.current[postId];
    if (!audio) return;

    if (playingAudioId === postId) {
      AudioManager.pause(postId);
      setPlayingAudioId(null);
    } else {
      AudioManager.play(postId, audio);
      setPlayingAudioId(postId);
    }
  };

  const socket = useContext(SocketContext);
  const [onlineUsersMap, setOnlineUsersMap] = useState({});
  const lastTapTime = useRef({});

  useScrollRestoration(
    !loadingMemories && memories.length > 0,
    typeof window !== 'undefined' && window.innerWidth >= 1024
      ? '#home-feed-scroll-container'
      : '#main-scroll-container'
  );
  
  const myUserId = useMemo(
  () => (user?._id || user?.id)?.toString(),
  [user?._id, user?.id]
  );

  const { connectionStates: tripMateStates = {} } = useTripMates(myUserId);


  useEffect(() => {
    if (!socket) return;

    const updateStoryViewers = (data) => {
      const patchStory = (st) => {
        if (st._id !== data.storyId) return st;
        const viewers = [...(st.viewers || [])];
        const idx = viewers.findIndex(
        (v) => v.userId?._id === data.viewer.userId?._id
        );
        if (idx !== -1) viewers[idx] = data.viewer;else
        viewers.push(data.viewer);
        return { ...st, viewers };
      };
      setActiveStoryGroup((prev) =>
      prev ? { ...prev, stories: prev.stories.map(patchStory) } : prev
      );
      setStories((prev) =>
      prev.map((g) => ({
        ...g,
        stories: g.stories?.map(patchStory) ?? g.stories
      }))
      );
    };

    const updateStoryReactions = (data) => {
      const patchStory = (st) => {
        if (st._id !== data.storyId) return st;
        const reactions = [...(st.storyReactions || [])];
        const idx = reactions.findIndex(
        (r) => r.userId?._id === data.reaction.userId?._id
        );
        if (idx !== -1) reactions[idx] = data.reaction;else
        reactions.push(data.reaction);
        return { ...st, storyReactions: reactions };
      };
      setActiveStoryGroup((prev) =>
      prev ? { ...prev, stories: prev.stories.map(patchStory) } : prev
      );
      setStories((prev) =>
      prev.map((g) => ({
        ...g,
        stories: g.stories?.map(patchStory) ?? g.stories
      }))
      );
    };

    const handleNewNotification = (notif) => {
      showToast.success(notif.message, {
        icon: notif.type === "story_react" ? "✨" : "💬"
      });
    };

    const handleUserPresence = ({ userId, status }) => {
      setOnlineUsersMap((prev) => ({ ...prev, [userId]: status === "online" }));
    };

    const handleInitialOnlineUsers = (userIds) => {
      setOnlineUsersMap((prev) => {
        const next = { ...prev };
        userIds.forEach((id) => {
          next[id] = true;
        });
        return next;
      });
    };

    socket.on(SOCKET_EVENTS.STORY_VIEWER_UPDATE, updateStoryViewers);
    socket.on(SOCKET_EVENTS.STORY_REACTION_UPDATE, updateStoryReactions);
    socket.on(SOCKET_EVENTS.NEW_NOTIFICATION, handleNewNotification);
    socket.on(SOCKET_EVENTS.USER_PRESENCE, handleUserPresence);
    socket.on(SOCKET_EVENTS.INITIAL_ONLINE_USERS, handleInitialOnlineUsers);

    return () => {
      socket.off(SOCKET_EVENTS.STORY_VIEWER_UPDATE, updateStoryViewers);
      socket.off(SOCKET_EVENTS.STORY_REACTION_UPDATE, updateStoryReactions);
      socket.off(SOCKET_EVENTS.NEW_NOTIFICATION, handleNewNotification);
      socket.off(SOCKET_EVENTS.USER_PRESENCE, handleUserPresence);
      socket.off(SOCKET_EVENTS.INITIAL_ONLINE_USERS, handleInitialOnlineUsers);
    };
  }, [socket]);


  

  

  



  

  const handleOpenComments = async (postId) => {
    if (activeCommentPost === postId) {
      setActiveCommentPost(null);
      return;
    }
    setActiveCommentPost(postId);
    const post = memories.find((m) => m._id === postId);
    if (!post || post.comments && post.comments.length > 0) return;

    setCommentsLoadingMap((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await axios.get(`/social/memory/${postId}/comments`, {
        withCredentials: true
      });
      if (res.data.success) {
        updateMemoriesCache((prev) => prev.map((m) =>
        m._id === postId ? { ...m, comments: res.data.comments } : m
        )
        );
      }
    } catch {
      showToast.error("Failed to load comments");
    } finally {
      setCommentsLoadingMap((prev) => ({ ...prev, [postId]: false }));
    }
  };


  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
      setShowSearchDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);


  useEffect(() => {
    return () => clearTimeout(searchDebounceRef.current);
  }, []);


  const uploadToCloudinary = useCallback(async (file) => {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) {
      showToast.error("File too large. Max 10 MB.");
      return;
    }
    const reader = new FileReader();
    reader.onloadend = async () => {
      setUploadingImage(true);
      try {
        const res = await axios.post(
        "/upload/base64",
        { data: reader.result, folder: "GoGo YatriGo_uploads" },
        { withCredentials: true }
        );
        if (res.data.success) {
          setPostImage(res.data.url);
          showToast.success("Image uploaded!");
        }
      } catch {
        showToast.error("Upload failed.");
      } finally {
        setUploadingImage(false);
      }
    };
    reader.readAsDataURL(file);
  }, []);


  const handlePostSubmit = useCallback(
  async (e) => {
    e.preventDefault();
    if (!postCaption.trim() || !postImage) {
      showToast.error("Caption and image are required!");
      return;
    }
    setSubmittingPost(true);
    try {
      const tagsArray = postTags
      .split(",")
      .map((t) => t.trim().replace(/^#/, ""))
      .filter(Boolean);
      const res = await axios.post(
      "/social/memory",
      {
        caption: postCaption,
        location: postLocation,
        tags: tagsArray,
        image: postImage
      },
      { withCredentials: true }
      );
      if (res.data.success) {
        showToast.success("Travel Memory created successfully!");
        setPostCaption("");
        setPostLocation("");
        setPostTags("");
        setPostImage("");
        addMemoryToCache(res.data.post);
      }
    } catch {
      showToast.error("Failed to share travel memory");
    } finally {
      setSubmittingPost(false);
    }
  },
  [postCaption, postImage, postLocation, postTags]
  );


  const handleFelt = useCallback(
    async (postId) => {
      const cleanPostId = (postId?._id || postId?.id || postId)?.toString();
      if (!cleanPostId) return;
      if (feltLoadingMap[cleanPostId] || lastTapTime.current[`like_${cleanPostId}`]) return;
      lastTapTime.current[`like_${cleanPostId}`] = true;

      setFeltLoadingMap((prev) => ({ ...prev, [cleanPostId]: true }));

      const previousQueryData = queryClient.getQueryData(['recentMemories']);
      updateMemoriesCache((prev) => { return prev.map((m) => {
          const mId = (m._id || m.id)?.toString();
          if (mId === cleanPostId) {
            const hasFelt = m.likes?.some(
              (id) => (id?._id || id)?.toString() === myUserId?.toString()
            );
            const newLikes = hasFelt
              ? (m.likes || []).filter(
                  (id) => (id?._id || id)?.toString() !== myUserId?.toString()
                )
              : [...(m.likes || []), myUserId];
            return { ...m, likes: newLikes, likesCount: newLikes.length };
          }
          return m;
        });
      });

      try {
        const res = await axios.post(
          `/social/memory/like/${cleanPostId}`,
          {},
          { withCredentials: true }
        );
        if (res.data && res.data.success) {
          const updatedLikes =
            res.data.likes || res.data.memory?.likes || res.data.post?.likes;
          if (Array.isArray(updatedLikes)) {
            updateMemoriesCache((prev) => prev.map((m) =>
                (m._id || m.id)?.toString() === cleanPostId
                  ? { ...m, likes: updatedLikes, likesCount: updatedLikes.length }
                  : m
              )
            );
          }
        }
      } catch (err) {
        queryClient.setQueryData(['recentMemories'], previousQueryData);
        showToast.error(err.response?.data?.message || "Failed to update reaction");
      } finally {
        setFeltLoadingMap((prev) => ({ ...prev, [cleanPostId]: false }));
        lastTapTime.current[`like_${cleanPostId}`] = false;
      }
    },
    [myUserId, feltLoadingMap]
  );

  const handleDoubleTapLike = useCallback(
  (postId, likes, tapPoint) => {
    const hasFelt = likes?.some(
    (id) => (id?._id || id)?.toString() === myUserId
    );
    if (!hasFelt) handleFelt(postId);

    setJourneyLikeAnim({
      postId,
      x: tapPoint?.x ?? 50,
      y: tapPoint?.y ?? 50,
      key: Date.now()
    });

    window.setTimeout(() => setJourneyLikeAnim(null), 1150);
  },
  [myUserId, handleFelt]
  );

  const handlePostTap = useCallback(
  (e, postId, likes) => {
    const now = Date.now();
    const lastTap = lastTapTime.current[postId] || 0;

    if (now - lastTap < 300) {
      const rect = e.currentTarget.getBoundingClientRect();
      const tapPoint = {
        x: (e.clientX - rect.left) / rect.width * 100,
        y: (e.clientY - rect.top) / rect.height * 100
      };
      handleDoubleTapLike(postId, likes, tapPoint);
      lastTapTime.current[postId] = 0;
    } else {
      lastTapTime.current[postId] = now;
    }
  },
  [handleDoubleTapLike]
  );


  const handleCommentSubmit = useCallback(
  async (e, postId) => {
    e.preventDefault();
    if (isSubmittingComment[postId]) return;
    const text = commentText[postId];
    if (!text?.trim()) return;
    setIsSubmittingComment((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await axios.post(
      `/social/memory/comment/${postId}`,
      { text },
      { withCredentials: true }
      );
      if (res.data.success) {
        setCommentText((prev) => ({ ...prev, [postId]: "" }));
        updateMemoriesCache((prev) => prev.map((m) => {
          if (m._id !== postId) return m;
          if (res.data.memory?.comments) {
            return {
              ...m,
              comments: res.data.memory.comments,
              commentsCount: res.data.memory.comments.length
            };
          }
          if (res.data.comment) {
            const visibleComments = getVisibleComments(m);
            const exists = visibleComments.some(
            (c) => c._id === res.data.comment._id
            );
            if (exists) return m;
            const newComments = [...visibleComments, res.data.comment];
            return {
              ...m,
              comments: newComments,
              commentsCount: newComments.length
            };
          }
          return m;
        })
        );
      }
    } catch {
      showToast.error("Failed to add comment");
    } finally {
      setIsSubmittingComment((prev) => ({ ...prev, [postId]: false }));
    }
  },
  [commentText, isSubmittingComment]
  );


  const handleDeleteComment = useCallback(async (postId, commentId) => {
    const { isConfirmed } = await Swal.fire({
      title: "Delete this comment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete"
    });
    if (!isConfirmed) return;
    try {
      const res = await axios.delete(
      `/social/memory/${postId}/comment/${commentId}`,
      { withCredentials: true }
      );
      if (res.data.success) {
        showToast.success("Comment deleted");
        updateMemoriesCache((prev) => prev.map((m) => {
          if (m._id !== postId) return m;
          if (res.data.memory?.comments) {
            return {
              ...m,
              comments: res.data.memory.comments,
              commentsCount: res.data.memory.comments.length
            };
          }
          const visibleComments = getVisibleComments(m);
          const newComments = visibleComments.filter(
          (c) => c._id !== commentId
          );
          return {
            ...m,
            comments: newComments,
            commentsCount: newComments.length
          };
        })
        );
      }
    } catch {
      showToast.error("Failed to delete comment");
    }
  }, []);


  const handleSaveToggle = useCallback(
  async (postId) => {
    const postIdStr = postId?.toString();
    if (saveLoadingMap[postIdStr]) return;
    setSaveLoadingMap((prev) => ({ ...prev, [postIdStr]: true }));
    const isSaved = savedPostIds.has(postIdStr);
    try {
      const res = isSaved ?
      await axios.delete(`/social/memory/save/${postIdStr}`, {
        withCredentials: true
      }) :
      await axios.post(
      `/social/memory/save/${postIdStr}`,
      {},
      { withCredentials: true }
      );
      if (res.data.success) {
        setSavedPostIds((prev) => {
          const next = new Set(prev);
          if (!isSaved) {
            next.add(postIdStr);
            showToast.success("Travel Memory saved!");
          } else {
            next.delete(postIdStr);
            showToast.success("Removed from saved");
          }
          return next;
        });
      }
    } catch {
      showToast.error("Failed to save Travel Memory.");
    } finally {
      setSaveLoadingMap((prev) => ({ ...prev, [postIdStr]: false }));
    }
  },
  [saveLoadingMap, savedPostIds]
  );


  const handleDispatch = useCallback(async (postId) => {
    const url = `${window.location.origin}/post/${postId}`;
    try {
      if (navigator.share) {
        await navigator.share({ title: "Check out this travel memory!", url });
        showToast.success("Link shared!");
      } else {
        await navigator.clipboard.writeText(url);
        showToast.success("Link copied to clipboard!");
      }
    } catch (err) {
      console.error("Failed to share:", err);
    }
  }, []);

  const handleFollowToggle = useCallback(
    async (targetUser) => {
      const targetId = String(targetUser._id || targetUser.id || "");
      if (!targetId || followLoadingMap[targetId]) return;

      const tripMateStatus = tripMateStates[targetId] || "not_connected";
      const rel = resolveRelationship(user, targetUser, tripMateStatus);
      if (rel.isSelf || rel.socialState === "self") {
        return;
      }

      const isCurrentlyFollowing =
        rel.socialState === "following" ||
        rel.socialState === "mutual" ||
        Boolean(targetUser.isFollowing) ||
        Boolean(targetUser.followers?.some((f) => String(f?._id || f?.id || f) === String(myUserId)));

      const isCurrentlyRequested =
        rel.socialState === "requested" ||
        Boolean(targetUser.isRequested) ||
        Boolean(targetUser.followRequests?.some((r) => String(r?._id || r?.id || r) === String(myUserId)));

      setFollowLoadingMap((prev) => ({ ...prev, [targetId]: true }));

      setSuggestions((prev) =>
        prev.map((s) => {
          const sId = String(s._id || s.id || "");
          if (sId !== targetId) return s;

          if (isCurrentlyFollowing) {
            return {
              ...s,
              isFollowing: false,
              followers: (s.followers || []).filter(
                (id) => String(id?._id || id?.id || id) !== String(myUserId)
              ),
            };
          } else if (isCurrentlyRequested) {
            return {
              ...s,
              isRequested: false,
              followRequests: (s.followRequests || []).filter(
                (id) => String(id?._id || id?.id || id) !== String(myUserId)
              ),
            };
          } else {
            if (s.privateAccount) {
              const reqs = (s.followRequests || []).map((id) => String(id?._id || id?.id || id));
              if (!reqs.includes(String(myUserId))) reqs.push(String(myUserId));
              return { ...s, isRequested: true, followRequests: reqs };
            } else {
              const flws = (s.followers || []).map((id) => String(id?._id || id?.id || id));
              if (!flws.includes(String(myUserId))) flws.push(String(myUserId));
              return { ...s, isFollowing: true, followers: flws };
            }
          }
        })
      );

      try {
        if (isCurrentlyFollowing) {
          await axios.post(`/users/${targetId}/unfollow`, {}, { withCredentials: true });
          showToast.success(`Unfollowed ${targetUser.name || "traveler"}`);
        } else if (isCurrentlyRequested) {
          await axios.delete(`/users/follow-requests/${targetId}`, { withCredentials: true });
          showToast.success(`Follow request cancelled`);
        } else {
          const res = await axios.post(`/users/${targetId}/follow`, {}, { withCredentials: true });
          if (res.data?.status === "requested" || targetUser.privateAccount) {
            showToast.success(`Follow request sent!`);
          } else {
            showToast.success(`Following ${targetUser.name || "traveler"}`);
          }
        }
      } catch (err) {
        const errMsg = err.response?.data?.message || "";
        if (errMsg.includes("already follow") || errMsg.includes("already following")) {
          showToast.success(`Following ${targetUser.name || "traveler"}`);
          setSuggestions((prev) =>
            prev.map((s) => {
              if (String(s._id || s.id) !== targetId) return s;
              const flws = (s.followers || []).map((id) => String(id?._id || id?.id || id));
              if (!flws.includes(String(myUserId))) flws.push(String(myUserId));
              return { ...s, isFollowing: true, followers: flws };
            })
          );
        } else if (errMsg.includes("already sent")) {
          showToast.success(`Follow request pending`);
          setSuggestions((prev) =>
            prev.map((s) => {
              if (String(s._id || s.id) !== targetId) return s;
              const reqs = (s.followRequests || []).map((id) => String(id?._id || id?.id || id));
              if (!reqs.includes(String(myUserId))) reqs.push(String(myUserId));
              return { ...s, isRequested: true, followRequests: reqs };
            })
          );
        } else {
          showToast.error(errMsg || "Action failed");
        }
      } finally {
        setFollowLoadingMap((prev) => ({ ...prev, [targetId]: false }));
      }
    },
    [myUserId, user, tripMateStates, followLoadingMap]
  );


  const handleEditPostSubmit = async (e) => {
    e.preventDefault();
    if (!editPostData) return;
    setIsSaving(true);
    try {
      const res = await axios.put(
        `/social/memory/${editPostData._id}`,
        {
          caption: editPostData.caption,
          location: editPostData.location,
          tags: editPostData.tags
        },
        { withCredentials: true }
      );
      if (res.data.success) {
        showToast.success("Travel Memory updated successfully!");
        const updatedMemory = res.data.post || res.data.memory;
        updateMemoriesCache((prev) => prev.map((p) => (p._id === editPostData._id ? { ...p, ...updatedMemory } : p))
        );
        setShowEditPostModal(false);
        setEditPostData(null);
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to update Travel Memory.");
    } finally {
      setIsSaving(false);
    }
  };


  const handleDeletePost = useCallback(async (postId) => {
    const { isConfirmed } = await Swal.fire({
      title: "Delete this travel memory?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete"
    });
    if (!isConfirmed) return;
    try {
      const res = await axios.delete(`/social/memory/${postId}`, {
        withCredentials: true
      });
      if (res.data.success) {
        showToast.success("Travel Memory deleted successfully!");
        updateMemoriesCache((prev) => prev.filter((m) => m._id !== postId));
      }
    } catch {
      showToast.error("Action failed");
    }
  }, []);


  const handleDeleteStory = useCallback(
  (dispatchId) => {
    setActiveStoryGroup(null);
    
  },
  []
  );

  const handleStoryViewed = useCallback((dispatchId) => {
    setStories((prev) =>
    prev.map((g) => ({
      ...g,
      stories: g.stories?.map((s) => {
        if (s._id === dispatchId) {
          const viewedBy = [...(s.viewedBy || [])];
          if (!viewedBy.includes(myUserId)) viewedBy.push(myUserId);
          return { ...s, viewedBy };
        }
        return s;
      }) ?? g.stories
    }))
    );
  }, [myUserId]);


  const myStoryGroup = useMemo(
  () => dispatches.find((g) => (g.userId?._id || g.userId)?.toString() === myUserId),
  [dispatches, myUserId]
  );
  const otherStories = useMemo(
  () => dispatches.filter((g) => (g.userId?._id || g.userId)?.toString() !== myUserId),
  [dispatches, myUserId]
  );
  const sortedStories = useMemo(() => {
    return [...otherStories].sort((a, b) => {
      const aHasUnviewed = a.stories?.some(
      (s) => !s.viewedBy?.includes(myUserId)
      );
      const bHasUnviewed = b.stories?.some(
      (s) => !s.viewedBy?.includes(myUserId)
      );
      if (aHasUnviewed && !bHasUnviewed) return -1;
      if (!aHasUnviewed && bHasUnviewed) return 1;
      const aLatest = Math.max(
      ...(a.stories || []).map((s) => new Date(s.createdAt).getTime())
      );
      const bLatest = Math.max(
      ...(b.stories || []).map((s) => new Date(s.createdAt).getTime())
      );
      return bLatest - aLatest;
    });
  }, [otherStories, myUserId]);

  useEffect(() => {
    const dispatchId = location.state?.dispatchId;
    if (!dispatchId || dispatches.length === 0) return;

    const group = dispatches.find((candidate) =>
      candidate.stories?.some((dispatch) => String(dispatch._id) === String(dispatchId))
    );
    const index = group?.stories?.findIndex(
      (dispatch) => String(dispatch._id) === String(dispatchId)
    );

    if (group && index >= 0) {
      setActiveStoryGroup(group);
      setActiveStoryIndex(index);
      navigate(location.pathname, { replace: true, state: null });
    }
  }, [dispatches, location.pathname, location.state, navigate]);


  const nextStory = useCallback(() => {
    if (!activeStoryGroup) return;
    if (activeStoryIndex < activeStoryGroup.stories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
    } else {
      const activeId = (activeStoryGroup.userId?._id || activeStoryGroup.userId)?.toString();
      if (activeId === myUserId) {
        setActiveStoryGroup(null);
      } else {
        const groupIdx = sortedStories.findIndex(
        (g) => (g.userId?._id || g.userId)?.toString() === activeId
        );
        if (groupIdx !== -1 && groupIdx < sortedStories.length - 1) {
          setActiveStoryGroup(sortedStories[groupIdx + 1]);
          setActiveStoryIndex(0);
        } else {
          setActiveStoryGroup(null);
        }
      }
    }
  }, [activeStoryGroup, activeStoryIndex, sortedStories, myUserId]);

  const prevStory = useCallback(() => {
    if (!activeStoryGroup) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
    } else {
      const activeId = (activeStoryGroup.userId?._id || activeStoryGroup.userId)?.toString();
      if (activeId === myUserId) {
        setActiveStoryGroup(null);
      } else {
        const groupIdx = sortedStories.findIndex(
        (g) => (g.userId?._id || g.userId)?.toString() === activeId
        );
        if (groupIdx > 0) {
          const prevGroup = sortedStories[groupIdx - 1];
          setActiveStoryGroup(prevGroup);
          setActiveStoryIndex(prevGroup.stories.length - 1);
        } else {
          setActiveStoryGroup(null);
        }
      }
    }
  }, [activeStoryGroup, activeStoryIndex, sortedStories, myUserId]);


  const handleSearchInput = useCallback((e) => {
    const q = e.target.value;
    setSearchQuery(q);
    if (!q.trim()) {
      setSearchResults(null);
      setShowSearchDropdown(false);
      return;
    }
    setShowSearchDropdown(true);
    clearTimeout(searchDebounceRef.current);
    searchDebounceRef.current = setTimeout(async () => {
      setSearchLoading(true);
      try {
        const res = await axios.get(
        `/social/search?q=${encodeURIComponent(q)}`,
        { withCredentials: true }
        );
        if (res.data.success) setSearchResults(res.data);
      } catch {

      } finally {
        setSearchLoading(false);
      }
    }, 400);
  }, []);

  const isPostCreator = useCallback(
  (post) => (post.userId?._id || post.userId)?.toString() === myUserId,
  [myUserId]
  );

  const scrollStories = useCallback((direction) => {
    if (storyContainerRef.current) {
      const scrollAmount = 300;
      storyContainerRef.current.scrollBy({
        left: direction * scrollAmount,
        behavior: "smooth"
      });
    }
  }, []);

  const whatsHappeningItems = useMemo(() => {
    const items = [];


    if (dispatches && dispatches.length > 0) {
      dispatches.slice(0, 2).forEach((group) => {
        items.push({
          id: `story-${group.userId || group.userName}`,
          icon: "📖",
          text: `${group.userName.split(" ")[0]} shared a story`,
          type: "story"
        });
      });
    }


    if (nearbyTrips && nearbyTrips.length > 0) {
      nearbyTrips.slice(0, 2).forEach((trip) => {
        const hostName = (trip.userId?.name || "A traveler").split(" ")[0];
        const dest = (trip.destination || "destination").split(",")[0].trim();
        items.push({
          id: `trip-${trip._id}`,
          icon: "🏔",
          text: `${hostName} created a ${dest} group`,
          type: "group"
        });
      });
    }


    if (memories && memories.length > 0) {
      memories.slice(0, 2).forEach((post) => {
        const firstName = (post.userName || post.userId?.name || "Someone").split(" ")[0];
        if (post.location) {
          const loc = formatLocation(post.location).split(",")[0].trim();
          items.push({
            id: `post-${post._id}`,
            icon: "📍",
            text: `${firstName} checked in at ${loc}`,
            type: "post"
          });
        } else {
          items.push({
            id: `post-${post._id}`,
            icon: "📷",
            text: `${firstName} shared a travel memory`,
            type: "post"
          });
        }
      });
    }

    const mixed = [];
    const seenTypes = new Set();
    const seenTexts = new Set();


    items.forEach((item) => {
      if (!seenTypes.has(item.type) && !seenTexts.has(item.text) && mixed.length < 4) {
        mixed.push(item);
        seenTypes.add(item.type);
        seenTexts.add(item.text);
      }
    });

    items.forEach((item) => {
      if (mixed.length < 4 && !seenTexts.has(item.text) && !mixed.some((m) => m.id === item.id)) {
        mixed.push(item);
        seenTexts.add(item.text);
      }
    });

    return mixed;
  }, [dispatches, nearbyTrips, memories]);

  return (
    <div className="w-full min-h-[100dvh] lg:min-h-0 lg:h-full overflow-x-hidden lg:overflow-hidden pb-20 lg:pb-0 relative bg-background flex flex-col">
      {/* Background Ambience */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.02] text-brand" xmlns="http://www.w3.org/2000/svg">
        <path d="M-100,200 Q200,300 500,100 T1200,400" fill="none" stroke="currentColor" strokeWidth="4" strokeDasharray="12 12" />
        <path d="M-50,600 Q300,500 600,700 T1300,500" fill="none" stroke="currentColor" strokeWidth="3" strokeDasharray="8 12" />
      </svg>
      <div className="absolute right-[-10%] bottom-[-5%] pointer-events-none opacity-[0.015]">
        <Compass className="w-[800px] h-[800px] text-brand" strokeWidth={0.5} />
      </div>
      <div className="w-full pt-1.5 lg:pt-0 px-3 sm:px-4 lg:px-4 xl:px-6 relative z-10 flex-1 min-h-0 lg:h-full lg:overflow-hidden">
        <div className="w-full h-full min-h-0 flex flex-col lg:flex-row gap-5 xl:gap-6 items-stretch lg:overflow-hidden">
          <div id="home-feed-scroll-container" className="flex-1 min-w-0 space-y-4 lg:h-full lg:min-h-0 lg:overflow-y-auto lg:pr-1 pt-1 pb-4 scrollbar-none hide-scrollbar no-scrollbar overscroll-contain">

            <ExplorerDashboardWidget
              user={user}
              memoriesCount={memories.filter((m) => (m.userId?._id || m.userId)?.toString() === myUserId).length}
              activeJourneysCount={activeJourneys.length}
              onUpcomingClick={handleScrollToUpcoming}
            />


            {/* Current Ongoing Journey OR Featured Next Upcoming Trip */}
            {dashboardJourney ? (
              <div className="space-y-3">
                <JourneyStatusWidget journey={dashboardJourney} user={user} />
              </div>
            ) : (
              <div className="bg-surface border border-border-default shadow-xs text-center space-y-3 p-5 sm:p-6 rounded-2xl">
                <div className="w-12 h-12 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto text-brand shadow-2xs border border-brand-100">
                  <Compass className="w-6 h-6" />
                </div>
                <div>
                  <h4 className="text-[11px] font-black text-text-muted uppercase tracking-widest">
                    NO ACTIVE JOURNEY
                  </h4>
                  <p className="text-sm sm:text-base font-bold text-text-primary font-heading mt-0.5">
                    Plan your next journey or join an existing trip
                  </p>
                </div>
                <div className="flex flex-wrap items-center justify-center gap-2.5 pt-1">
                  <Link
                    to="/social/buddy"
                    className="bg-brand-500 hover:bg-brand-600 text-slate-950 py-2 px-4 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <Compass className="w-3.5 h-3.5 text-slate-950" />
                    <span>Explore & Join Trips</span>
                  </Link>
                  <Link
                    to="/social/journeys"
                    className="bg-surface hover:bg-slate-100 text-text-primary border border-border-default py-2 px-4 text-xs font-bold rounded-xl shadow-xs transition-all active:scale-95 inline-flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Plan Journey</span>
                  </Link>
                </div>
              </div>
            )}

            {/* Upcoming Trips Section on Dashboard — show only the nearest 1 */}
            {ongoingJourney && upcomingTripsList.length > 0 ? (
              <div ref={upcomingTripsRef}>
                <UpcomingTripsWidget upcomingTrips={upcomingTripsList.slice(0, 1)} title="Upcoming Trip" />
              </div>
            ) : !ongoingJourney && upcomingTripsList.length > 1 ? (
              <div ref={upcomingTripsRef}>
                <UpcomingTripsWidget upcomingTrips={upcomingTripsList.slice(1, 2)} title="Next Upcoming Trip" />
              </div>
            ) : (
              <div ref={upcomingTripsRef} />
            )}


            {/* 7. Trip Moments */}
            <div className="space-y-2.5">
               <h3 className="text-xs font-bold text-text-primary pl-1 flex items-center gap-1.5 font-heading">
                  <Sparkles className="w-3.5 h-3.5 text-brand" /> Trip Moments
               </h3>
               <DispatchBar
                user={user}
                myUserId={myUserId}
                dispatches={dispatches}
                myStoryGroup={myStoryGroup}
                sortedStories={sortedStories}
                loadingStories={loadingStories}
                onlineUsersMap={onlineUsersMap}
                setActiveStoryGroup={setActiveStoryGroup}
                setActiveStoryIndex={setActiveStoryIndex}
                setShowStoryModal={setShowStoryModal}
                handleAvatarError={handleAvatarError} />
            </div>

            {/* 8. Recent Travel Memories */}
            <div className="space-y-3">
              <div className="flex items-center justify-between pl-1 pr-1">
                <h3 className="text-xs font-bold text-text-primary flex items-center gap-1.5 font-heading">
                  <Camera className="w-3.5 h-3.5 text-brand" /> Recent Travel Memories
                </h3>
                {memories.length > 0 && (
                  <button
                    onClick={() => setShowAllMemories(!showAllMemories)}
                    className="text-xs font-semibold text-brand hover:text-brand-dark transition-colors flex items-center gap-1"
                  >
                    <span>{showAllMemories ? 'Show less' : 'View all'}</span>
                    <span aria-hidden="true" className={showAllMemories ? '-scale-y-100 transform' : ''}>&rarr;</span>
                  </button>
                )}
              </div>
              {loadingMemories ? (
                <AnimatePresence>
                  <div className="space-y-6">
                    {[1, 2].map((i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                      >
                        <PostSkeleton />
                      </motion.div>
                    ))}
                  </div>
                </AnimatePresence>
              ) : errorMemories ? (
                <Card variant="default" padding="lg" className="p-8 sm:p-14 text-center min-h-[280px] flex flex-col items-center justify-center border-slate-200/80 shadow-xs">
                  <div className="w-14 h-14 bg-rose-50 rounded-2xl flex items-center justify-center mx-auto mb-3 border border-rose-100">
                    <ShieldAlert className="w-7 h-7 text-rose-500" />
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-text-primary font-heading">
                    Oops, something went wrong!
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-text-muted mt-1 mb-5 max-w-[280px] mx-auto">
                    We couldn't load the feed right now. Please check your connection and try again.
                  </p>
                  <button
                    onClick={() => refetchMemories()}
                    className="btn-primary !py-2 !px-5 text-xs font-bold"
                  >
                    Try again
                  </button>
                </Card>
              ) : memories.length === 0 ? (
                <Card variant="default" padding="lg" className="p-8 sm:p-14 text-center min-h-[340px] flex flex-col items-center justify-center border-slate-200/80 shadow-xs">
                  <div className="w-16 h-16 bg-brand-50 rounded-2xl flex items-center justify-center mx-auto mb-4 border border-brand-100/70">
                    <Camera className="w-8 h-8 text-brand animate-float" />
                  </div>
                  <h3 className="text-base sm:text-lg font-extrabold text-text-primary font-heading">
                    No Travel Memories yet
                  </h3>
                  <p className="text-xs sm:text-sm font-medium text-text-muted mt-1 max-w-[280px] mx-auto">
                    Follow travelers or share your first journey to start building your feed.
                  </p>
                  <div className="mt-6">
                    <Link
                      to="/social/explore"
                      className="btn-secondary !py-2 !px-4 text-xs font-bold"
                    >
                      Explore travelers
                    </Link>
                  </div>
                </Card>
              ) : (
                <div className="space-y-6">
                  {memories.map((post) => {
                    const hasFelt = post.likes?.some(
                      (id) => (id?._id || id)?.toString() === myUserId
                    );
                    const isSaved = savedPostIds.has(post._id?.toString());
                    const isCreator = isPostCreator(post);

                    return (
                      <FeedCard
                        key={post._id}
                        ref={(el) => postRefs.current[post._id] = el}
                        post={post}
                        user={user}
                        myUserId={myUserId}
                        hasFelt={hasFelt}
                        isSaved={isSaved}
                        isCreator={isCreator}
                        feltLoadingMap={feltLoadingMap}
                        saveLoadingMap={saveLoadingMap}
                        commentsLoadingMap={commentsLoadingMap}
                        isSubmittingComment={isSubmittingComment}
                        commentText={commentText}
                        activeCommentPost={activeCommentPost}
                        playingAudioId={playingAudioId}
                        journeyLikeAnim={journeyLikeAnim}
                        handleFelt={handleFelt}
                        handlePostTap={handlePostTap}
                        handleOpenComments={handleOpenComments}
                        handleDispatch={handleDispatch}
                        handleSaveToggle={handleSaveToggle}
                        handleDeleteComment={handleDeleteComment}
                        handleCommentSubmit={handleCommentSubmit}
                        setCommentText={setCommentText}
                        toggleAudio={toggleAudio}
                        setReportModal={setReportModal}
                        setEditPostData={setEditPostData}
                        setShowEditPostModal={setShowEditPostModal}
                        handleDeletePost={handleDeletePost}
                        handleAvatarError={handleAvatarError}
                        audioRefCallback={(el) => audioRefs.current[post._id] = el}
                      />
                    );
                  })}
                  {memories.length > 0 && (
                    <div className="pt-2 pb-2 text-center">
                      <button
                        onClick={() => {
                          const willCollapse = showAllMemories;
                          setShowAllMemories(!showAllMemories);
                          if (willCollapse) {
                            const container = document.getElementById('home-feed-scroll-container');
                            if (container) {
                              container.scrollTo({ top: 0, behavior: 'smooth' });
                            } else {
                              window.scrollTo({ top: 0, behavior: 'smooth' });
                            }
                          }
                        }}
                        className="inline-flex items-center justify-center gap-2 px-5 py-2.5 bg-surface hover:bg-slate-100 text-text-primary border border-border-default rounded-xl text-xs font-bold shadow-xs transition-all active:scale-95"
                      >
                        <Sparkles className="w-3.5 h-3.5 text-brand" />
                        <span>{showAllMemories ? 'Show Fewer Memories' : 'View All Community Memories'}</span>
                      </button>
                    </div>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* Desktop Right Sidebar (Travelers for You, Active Groups, Trends & Insights) */}
          <div className="hidden lg:block w-[280px] xl:w-[310px] 2xl:w-[340px] shrink-0 lg:h-full lg:min-h-0 lg:overflow-y-auto pt-1 pb-4 scrollbar-none hide-scrollbar no-scrollbar overscroll-contain">
            <RightSidebar
              className="min-w-0 w-full flex flex-col gap-4 shrink-0"
              user={user}
              suggestions={suggestions}
              nearbyTrips={nearbyTrips}
              handleFollowToggle={handleFollowToggle}
              followLoadingMap={followLoadingMap}
              tripMateStates={tripMateStates}
            />
          </div>

        </div>

        <AnimatePresence>
          {activeStoryGroup &&
          <DispatchViewer
          activeStoryGroup={activeStoryGroup}
          activeStoryIndex={activeStoryIndex}
          myUserId={myUserId}
          isStoryMuted={isStoryMuted}
          setIsStoryMuted={setIsStoryMuted}
          handleDeleteStory={handleDeleteStory}
          setShowViewersList={setShowViewersList}
          isStoryPaused={isStoryPaused}
          setIsStoryPaused={setIsStoryPaused}
          closeStoryViewer={() => setActiveStoryGroup(null)}
          nextStory={nextStory}
          prevStory={prevStory}
          dispatches={dispatches}
          onStoryViewed={handleStoryViewed} />}


        </AnimatePresence>

        <AnimatePresence>
          {showEditPostModal && editPostData &&
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-brand/20 backdrop-blur-xs">

              <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-surface rounded-[var(--radius-card)] w-full max-w-md shadow-xl overflow-hidden border border-border">

                <div className="flex items-center justify-between p-5 border-b border-border">
                  <h3 className="text-base font-bold text-text-primary">
                    Edit Travel Memory
                  </h3>
                  <button
                onClick={() => {
                  setShowEditPostModal(false);
                  setEditPostData(null);
                }}
                className="p-2 text-text-muted hover:bg-background rounded-full transition-colors">

                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleEditPostSubmit} className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider pl-1">
                      Caption
                    </label>
                    <textarea
                  placeholder="Write a caption..."
                  value={editPostData.caption || ""}
                  onChange={(e) =>
                  setEditPostData({
                    ...editPostData,
                    caption: e.target.value
                  })}

                  rows="3"
                  className="w-full bg-white border border-border-default rounded-xl p-4 text-sm text-text-primary outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all duration-200 resize-none" />

                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-text-muted uppercase tracking-wider pl-1">
                      Location
                    </label>
                    <input
                  type="text"
                  placeholder="Add location"
                  value={editPostData.location || ""}
                  onChange={(e) =>
                  setEditPostData({
                    ...editPostData,
                    location: e.target.value
                  })}

                  className="w-full bg-white border border-border-default rounded-xl p-4 text-sm text-text-primary outline-none focus:border-brand focus:ring-4 focus:ring-brand/10 transition-all duration-200" />

                  </div>
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                  type="button"
                  onClick={() => {
                    setShowEditPostModal(false);
                    setEditPostData(null);
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-text-muted hover border border-border-default rounded-xl transition-all duration-200">

                      Cancel
                    </button>
                    <button
                  type="submit"
                  disabled={isSaving}
                  className="btn-primary">

                      {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>}

        </AnimatePresence>

        <CreateDispatchModal
        isOpen={showStoryModal}
        onClose={() => setShowStoryModal(false)}
        onSuccess={() => queryClient.invalidateQueries(['homeSideData'])} />

        {reportModal.isOpen &&
        <ReportModal
        isOpen={reportModal.isOpen}
        onClose={() =>
        setReportModal({
          isOpen: false,
          targetId: null,
          targetType: "post",
          reportedUserId: null
        })}

        targetId={reportModal.targetId}
        targetType={reportModal.targetType}
        reportedUserId={reportModal.reportedUserId} />}


      </div>
    </div>);

};

export default Home;