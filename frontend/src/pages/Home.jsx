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
import { getAvatarUrl } from "../utils/avatar";
import Avatar from "../components/common/Avatar";
import AudioManager from "../utils/AudioManager";
import {
Heart,
MessageSquare,
Trash2,
Send,
Plus,
X,
MapPin,
Compass,
UserPlus,
Sparkles,
Bookmark,
Share2,
Search,
Bell,
Loader2,
ShieldAlert,
Music2,
Play,
Pause,
ChevronLeft,
ChevronRight,
Edit2,
MoreHorizontal,
Clock } from
"lucide-react";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../api/axios";
import { SocketContext } from "../context/SocketContext";
import { SOCKET_EVENTS } from "../constants/socketEvents";
import Swal from "sweetalert2";
import CreateDispatchModal from "../components/modals/CreateDispatchModal";
import DispatchViewer from "../components/story/DispatchViewer";
import RightSidebar from "../components/home/RightSidebar";
import LazyImage from "../components/common/LazyImage";
import JourneyMatesSuggestions from "../components/social/JourneyMatesSuggestions";
import ReportModal from "../components/modals/ReportModal";
import DispatchBar from "../components/home/DispatchBar";
import FeedCard from "../components/home/FeedCard";
import JourneyStatusWidget from "../components/home/JourneyStatusWidget";
import ExplorerDashboardWidget from "../components/home/ExplorerDashboardWidget";
import TravelWeatherWidget from "../components/home/TravelWeatherWidget";


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
      <div className="w-10 h-10 rounded-full bg-slate-200" />
      <div className="space-y-2 flex-1">
        <div className="h-3 bg-slate-200 rounded w-32" />
        <div className="h-2 bg-slate-100 rounded w-20" />
      </div>
    </div>
    <div className="w-full h-[380px] object-cover bg-slate-100" />
    <div className="p-5 space-y-4">
      <div className="flex gap-4">
        <div className="w-6 h-6 rounded bg-slate-200" />
        <div className="w-6 h-6 rounded bg-slate-200" />
        <div className="w-6 h-6 rounded bg-slate-200" />
      </div>
      <div className="space-y-2">
        <div className="h-3 bg-slate-200 rounded w-3/4" />
        <div className="h-3 bg-slate-200 rounded w-1/2" />
      </div>
    </div>
  </div>;


const StorySkeleton = () =>
<div className="w-20 h-28 sm:w-24 sm:h-32 rounded-2xl bg-slate-100 relative overflow-hidden shrink-0 animate-pulse border border-slate-100">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
  </div>;


const notifIcon = (type) => {
  if (type === "post_like")
  return <span className="text-sm leading-none">✨</span>;
  if (type === "post_comment")
  return <MessageSquare className="w-3.5 h-3.5 text-brand-600" />;
  if (type === "follow" || type === "new_follower")
  return <UserPlus className="w-3.5 h-3.5 text-success" />;
  if (type === "story_reply")
  return <Sparkles className="w-3.5 h-3.5 text-warning" />;
  return <Bell className="w-3.5 h-3.5 text-slate-400" />;
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
    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Explorer")}&background=7C3AED&color=fff&bold=true`;
  }, []);


  const [memories, setMemories] = useState([]);
  const [activeJourneys, setActiveJourneys] = useState([]);
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => localStorage.getItem("goyatrigo_home_banner_dismissed") === "true");

  const handleDismissBanner = () => {
    localStorage.setItem("goyatrigo_home_banner_dismissed", "true");
    setIsBannerDismissed(true);
  };

  const [dispatches, setStories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [nearbyTrips, setNearbyTrips] = useState([]);
  const [savedPostIds, setSavedPostIds] = useState(new Set());
  const [loadingMemories, setLoadingMemories] = useState(true);
  const [loadingStories, setLoadingStories] = useState(true);
  const [followLoadingMap, setFollowLoadingMap] = useState({});
  const [saveLoadingMap, setSaveLoadingMap] = useState({});
  const [feltLoadingMap, setFeltLoadingMap] = useState({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [errorMemories, setErrorMemories] = useState(false);
  const [commentsLoadingMap, setCommentsLoadingMap] = useState({});
  const [showMobileGroups, setShowMobileGroups] = useState(false);
  const storyContainerRef = useRef(null);
  const loadMoreRef = useRef(null);

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


  const myUserId = useMemo(
  () => (user?._id || user?.id)?.toString(),
  [user?._id, user?.id]
  );


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


  const fetchMemories = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setLoadingMemories(true);
      setErrorMemories(false);
    } else setLoadingMore(true);

    try {
      const res = await axios.get(`/social/memory?page=${pageNum}&limit=10`, {
        withCredentials: true
      });
      if (res.data.success) {
        if (append) {
          setMemories((prev) => {
            const existingIds = new Set(prev.map((p) => p._id));
            const newPosts = res.data.memories.filter(
            (p) => !existingIds.has(p._id)
            );
            return [...prev, ...newPosts];
          });
        } else {
          setMemories(res.data.memories);
        }
        if (res.data.memories.length < 10) setHasMore(false);else
        setHasMore(true);
      }
    } catch (err) {
      showToast.error("Failed to load travel feed");
      if (pageNum === 1) setErrorMemories(true);
    } finally {
      if (pageNum === 1) setLoadingMemories(false);else
      setLoadingMore(false);
    }
  }, []);

  const fetchSideData = useCallback(() => {
    setLoadingStories(true);

    Promise.allSettled([
    axios.get("/social/story", { withCredentials: true }),
    axios.get("/users/suggestions", { withCredentials: true }),
    axios.get("/social/buddy", { withCredentials: true }),
    axios.get("/social/memory/save?idsOnly=true", { withCredentials: true }),
    axios.get("/journeys/my", { withCredentials: true })]
    ).then((results) => {
      if (results[0].status === "fulfilled" && results[0].value.data.success) {
        setStories(results[0].value.data.stories);
      }
      setLoadingStories(false);

      if (results[1].status === "fulfilled" && results[1].value.data.success) {
        const filtered = (results[1].value.data.suggestions || []).filter(
        (s) => s._id?.toString() !== myUserId
        );
        setSuggestions(filtered);
      }
      let buddyActives = [];
      if (results[2].status === "fulfilled" && results[2].value.data.success) {
        const trips = results[2].value.data.trips || [];
        setNearbyTrips(trips);
        const todayBuddy = new Date();todayBuddy.setHours(0, 0, 0, 0);
        buddyActives = trips.
        filter((trip) => {
          const isJoined = trip.members?.some((m) => (m.user?._id || m.user)?.toString() === myUserId) ||
          (trip.userId?._id || trip.userId || trip.host?._id || trip.host)?.toString() === myUserId;
          if (!isJoined || trip.status === "cancelled") return false;

          if (trip.endDate && new Date(trip.endDate) < todayBuddy) return false;
          return true;
        }).
        map((trip) => ({
          ...trip,
          isBuddyTrip: true,
          status: trip.status === "active" || trip.status === "active now" ? "Ongoing" : trip.status === "upcoming" ? "Upcoming" : "Planning"
        }));
      }
      if (results[3].status === "fulfilled" && results[3].value.data.success) {
        const ids = new Set(
        (results[3].value.data.posts || []).map((p) =>
        (p._id || p.postId?._id)?.toString()
        )
        );
        setSavedPostIds(ids);
      }
      if (results[4].status === "fulfilled" && results[4].value.data.success) {
        const userJourneys = results[4].value.data.journeys || [];
        const todayJourney = new Date();todayJourney.setHours(0, 0, 0, 0);
        const actives = userJourneys.filter((j) => {

          if (["Completed", "completed", "Cancelled", "cancelled", "Scrapbook", "scrapbook"].includes(j.status)) return false;

          if (j.endDate && new Date(j.endDate) < todayJourney) return false;
          return j.status === "Ongoing" || j.status === "Planning" || j.status === "Upcoming";
        });

        // Deduplicate buddy trips that are already imported as personal journeys,
        // and also ensure no duplicate IDs are pushed into activeJourneys.
        const activeIds = new Set(actives.map(j => (j._id || j.id)?.toString()));
        const activeSourceIds = new Set(
          actives
            .filter((j) => j.sourceType === "explore" && j.sourceId)
            .map((j) => j.sourceId.toString())
        );
        
        const filteredBuddyActives = buddyActives.filter(
          (trip) => {
            const tripId = (trip._id || trip.id)?.toString();
            return !activeSourceIds.has(tripId) && !activeIds.has(tripId);
          }
        );

        const combinedActives = [...actives, ...filteredBuddyActives];
          
        const now = moment();
        combinedActives.sort((a, b) => {
          const aHappening = a.startDate && moment(a.startDate).isSameOrBefore(now, 'day') && (!a.endDate || moment(a.endDate).isSameOrAfter(now, 'day'));
          const bHappening = b.startDate && moment(b.startDate).isSameOrBefore(now, 'day') && (!b.endDate || moment(b.endDate).isSameOrAfter(now, 'day'));
          
          if (aHappening && !bHappening) return -1;
          if (!aHappening && bHappening) return 1;
          
          const dateA = a.startDate ? new Date(a.startDate).getTime() : 0;
          const dateB = b.startDate ? new Date(b.startDate).getTime() : 0;
          return dateA - dateB;
        });

        setActiveJourneys(combinedActives);
      }
    });
  }, [myUserId]);

  const fetchFeedData = useCallback(() => {
    fetchMemories(1, false);
    fetchSideData();
  }, [fetchMemories, fetchSideData]);

  useEffect(() => {
    fetchFeedData();
  }, [fetchFeedData]);

  const loadMorePosts = useCallback(() => {
    if (!loadingMore && hasMore) {
      const nextPage = page + 1;
      setPage(nextPage);
      fetchMemories(nextPage, true);
    }
  }, [loadingMore, hasMore, page, fetchMemories]);

  useEffect(() => {
    if (!loadMoreRef.current) return;
    const observer = new IntersectionObserver(
    (entries) => {
      if (entries[0].isIntersecting && !loadingMore && hasMore) {
        loadMorePosts();
      }
    },
    { rootMargin: "200px" }
    );
    observer.observe(loadMoreRef.current);
    return () => {
      observer.disconnect();
    };
  }, [loadMorePosts, loadingMore, hasMore]);

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
        setMemories((prev) =>
        prev.map((m) =>
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
      const tagsArray = postTags.
      split(",").
      map((t) => t.trim().replace(/^#/, "")).
      filter(Boolean);
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
        showToast.success("Travel memory shared! 🌍");
        setPostCaption("");
        setPostLocation("");
        setPostTags("");
        setPostImage("");
        setMemories((prev) => [res.data.post, ...prev]);
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
    if (lastTapTime.current[`like_${postId}`]) return;
    lastTapTime.current[`like_${postId}`] = true;

    setFeltLoadingMap((prev) => ({ ...prev, [postId]: true }));

    setMemories((prev) =>
    prev.map((m) => {
      if (m._id === postId) {
        const hasFelt = m.likes?.some(
        (id) => (id?._id || id)?.toString() === myUserId
        );
        const newLikes = hasFelt ?
        (m.likes || []).filter(
        (id) => (id?._id || id)?.toString() !== myUserId
        ) :
        [...(m.likes || []), myUserId];
        return { ...m, likes: newLikes };
      }
      return m;
    })
    );

    try {
      const res = await axios.post(
      `/social/memory/like/${postId}`,
      {},
      { withCredentials: true }
      );
      if (res.data.success) {
        const updatedLikes = res.data.memory?.likes || res.data.post?.likes;
        if (updatedLikes) {
          setMemories((prev) =>
          prev.map((m) =>
          m._id === postId ? { ...m, likes: updatedLikes } : m
          )
          );
        }
      }
    } catch (err) {
      showToast.error("Failed to update like");
    } finally {
      setFeltLoadingMap((prev) => ({ ...prev, [postId]: false }));
      lastTapTime.current[`like_${postId}`] = false;
    }
  },
  [myUserId]
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
        setMemories((prev) =>
        prev.map((m) => {
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
      showToast.error("Failed to post comment");
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
        setMemories((prev) =>
        prev.map((m) => {
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
            showToast.success("Post saved");
          } else {
            next.delete(postIdStr);
            showToast.success("Removed from saved");
          }
          return next;
        });
      }
    } catch {
      showToast.error("Failed to save post");
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
        showToast.success("Link copied!");
      }
    } catch {

    }
  }, []);

  const handleFollowToggle = useCallback(
  async (targetUser) => {
    if (followLoadingMap[targetUser._id]) return;
    setFollowLoadingMap((prev) => ({ ...prev, [targetUser._id]: true }));
    const isFollowing = targetUser.followers?.some(
    (id) => id?.toString() === myUserId
    );
    const isRequested = targetUser.followRequests?.some(
    (id) => id?.toString() === myUserId
    );
    try {
      if (isFollowing || isRequested) {
        await axios.post(
        `/users/${targetUser._id}/unfollow`,
        {},
        { withCredentials: true }
        );
        showToast.success(
        isRequested ?
        `Trip Mate request cancelled` :
        `Removed ${targetUser.name} from My Trip Mates`
        );
        setSuggestions((prev) =>
        prev.map((s) =>
        s._id === targetUser._id ?
        {
          ...s,
          followers: (s.followers || []).filter(
          (id) => id?.toString() !== myUserId
          ),
          followRequests: (s.followRequests || []).filter(
          (id) => id?.toString() !== myUserId
          )
        } :
        s
        )
        );
      } else {
        const res = await axios.post(
        `/users/${targetUser._id}/follow`,
        {},
        { withCredentials: true }
        );
        if (res.data.status === "requested") {
          showToast.success(`Trip Mate request sent to ${targetUser.name}!`);
          setSuggestions((prev) =>
          prev.map((s) =>
          s._id === targetUser._id ?
          {
            ...s,
            followRequests: [...(s.followRequests || []), myUserId]
          } :
          s
          )
          );
        } else {
          showToast.success(`You are now Trip Mates with ${targetUser.name}! ✈️`);
          setSuggestions((prev) =>
          prev.map((s) =>
          s._id === targetUser._id ?
          { ...s, followers: [...(s.followers || []), myUserId] } :
          s
          )
          );
        }
      }
    } catch {
      showToast.error("Action failed");
    } finally {
      setFollowLoadingMap((prev) => ({ ...prev, [targetUser._id]: false }));
    }
  },
  [followLoadingMap, myUserId]
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
        showToast.success("Post updated successfully!");
        setMemories((prev) =>
        prev.map((p) => p._id === editPostData._id ? res.data.post : p)
        );
        setShowEditPostModal(false);
        setEditPostData(null);
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to update post");
    } finally {
      setIsSaving(false);
    }
  };


  const handleDeletePost = useCallback(async (postId) => {
    const { isConfirmed } = await Swal.fire({
      title: "Delete this memory post?",
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
        showToast.success("Post deleted");
        setMemories((prev) => prev.filter((m) => m._id !== postId));
      }
    } catch {
      showToast.error("Action failed");
    }
  }, []);


  const handleDeleteStory = useCallback(
  (dispatchId) => {
    setActiveStoryGroup(null);
    fetchFeedData();
  },
  [fetchFeedData]
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
    <div className="w-full min-h-[100dvh] overflow-x-hidden pb-20 lg:pb-0 relative bg-[#FAFAFA]">
      {}
      {}
      <div
      className="absolute inset-0 pointer-events-none opacity-[0.02] mix-blend-multiply"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='100' height='100' viewBox='0 0 100 100' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z' fill='%237C3AED' fill-opacity='1' fill-rule='evenodd'/%3E%3C/svg%3E")`
      }} />

      {}
      <svg className="absolute inset-0 w-full h-full pointer-events-none opacity-[0.03]" xmlns="http://www.w3.org/2000/svg">
        <path d="M-100,200 Q200,300 500,100 T1200,400" fill="none" stroke="#7C3AED" strokeWidth="4" strokeDasharray="12 12" />
        <path d="M-50,600 Q300,500 600,700 T1300,500" fill="none" stroke="#7C3AED" strokeWidth="3" strokeDasharray="8 12" />
      </svg>
      {}
      <div className="absolute right-[-10%] bottom-[-5%] pointer-events-none opacity-[0.02]">
        <Compass className="w-[800px] h-[800px] text-[#7C3AED]" strokeWidth={0.5} />
      </div>
      <div className="w-full pt-4 px-4 sm:px-6 lg:pl-0 lg:pr-0 relative z-10">
        <div className="grid grid-cols-1 lg:grid-cols-[minmax(0,1fr)_320px] xl:grid-cols-[minmax(0,1fr)_360px] 2xl:grid-cols-[minmax(0,1fr)_380px] gap-6 xl:gap-8 items-start">
          {}
          <div className="w-full space-y-4 min-w-0">

            {}
            <ExplorerDashboardWidget
            user={user}
            memoriesCount={memories.filter((m) => (m.userId?._id || m.userId)?.toString() === myUserId).length}
            activeJourneysCount={activeJourneys.length} />


            {}
            {(() => {
              const hasOngoing = activeJourneys.some((j) => {
                const s = j.status?.toLowerCase();
                if (s === "cancelled") return false;
                if (s === "ongoing" || s === "active" || s === "active now") return true;
                return j.startDate && moment(j.startDate).isSameOrBefore(moment(), 'day') && (!j.endDate || moment(j.endDate).isSameOrAfter(moment(), 'day'));
              });
              const headerLabel = hasOngoing ?
              "CURRENT JOURNEY" :
              activeJourneys.length > 0 ?
              "UPCOMING JOURNEY" :
              "JOURNEY HEADQUARTERS";

              return (
                <div className="bg-white dark:bg-slate-900 border border-slate-150 dark:border-slate-800 rounded-3xl p-4 shadow-sm space-y-2">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-extrabold text-[#71717A] dark:text-slate-400 uppercase tracking-wider flex items-center gap-2">
                      <span
                      className={`w-2 h-2 rounded-full ${
                      hasOngoing ?
                      "bg-emerald-500 animate-pulse" :
                      activeJourneys.length > 0 ?
                      "bg-sky-500" :
                      "bg-slate-300"
                      }`} />

                      {headerLabel}
                    </h3>
                  </div>

                  {activeJourneys.length > 0 ?
                  <div className="space-y-4">
                        {activeJourneys.map((j) => {
                          const isOngoingStatus = j.status === "ongoing" || j.status === "active" || j.status === "active now" || j.status === "Ongoing";
                          const isHappeningNow = j.startDate && moment(j.startDate).isSameOrBefore(moment(), 'day') && (!j.endDate || moment(j.endDate).isSameOrAfter(moment(), 'day'));
                          const s = j.status?.toLowerCase();
                          const isCancelled = s === "cancelled";
                          const showWeather = (isOngoingStatus || isHappeningNow) && !isCancelled;
                          
                          return (
                            <React.Fragment key={j._id}>
                              <JourneyStatusWidget journey={j} user={user} />
                              {showWeather ? <TravelWeatherWidget destination={j.destination} /> : null}
                            </React.Fragment>
                          );
                        })}
                      </div> :

                  <div className="bg-[#F8FAFC] border border-[#E5E7EB] rounded-2xl p-6 text-center space-y-3">
                      <div className="w-12 h-12 bg-[#F3E8FF] rounded-full flex items-center justify-center mx-auto text-[#7C3AED] shadow-sm">
                        <Compass className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="text-[11px] font-black text-[#64748B] uppercase tracking-[0.15em]">
                          No active or upcoming journey
                        </h4>
                        <p className="text-sm font-bold text-[#1E293B] mt-1">
                          Plan your next expedition today
                        </p>
                      </div>
                      <div className="flex items-center justify-center gap-3 pt-2">
                        <Link
                      to="/social/buddy"
                      className="px-4 py-2.5 bg-[#F3E8FF] hover:bg-[#E9D5FF] text-[#7C3AED] text-xs font-bold rounded-xl transition-all duration-200">

                          Find Trip Mates
                        </Link>
                        <Link
                      to="/social/journeys"
                      className="px-4 py-2.5 bg-[#7C3AED] hover:bg-[#6D28D9] text-white text-xs font-bold rounded-xl transition-all duration-200 shadow-md">

                          + Launch Journey
                        </Link>
                      </div>
                    </div>}

                </div>);

            })()}

            {}
            <div className="space-y-3">
               <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-2 flex items-center gap-1.5">
                  <MapPin className="w-3.5 h-3.5" /> Travel Dispatches
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

            {}
            <div className="space-y-4">
              <h3 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.15em] pl-2 flex items-center gap-1.5">
                <Compass className="w-3.5 h-3.5" /> Explorer Logbook
              </h3>
              {loadingMemories ?
              <AnimatePresence>
                  <div className="space-y-6">
                    {[1, 2].map((i) =>
                  <motion.div
                  key={i}
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}>

                        <PostSkeleton />
                      </motion.div>
                  )}
                  </div>
                </AnimatePresence> :
              errorMemories ?
              <div className="card p-8 sm:p-16 text-center min-h-[300px] flex flex-col items-center justify-center">
                  <div className="w-16 h-16 bg-rose-50 rounded-full flex items-center justify-center mx-auto mb-4">
                    <ShieldAlert className="w-8 h-8 text-rose-500" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">
                    Oops, something went wrong!
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mt-2 mb-6 max-w-[280px] mx-auto">
                    We couldn't load the feed right now. Please check your
                    connection and try again.
                  </p>
                  <button
                onClick={() => fetchMemories(1)}
                className="btn-primary">

                    Try again
                  </button>
                </div> :
              memories.length === 0 ?
              <div className="card p-8 sm:p-16 text-center min-h-[420px] flex flex-col items-center justify-center">
                  <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
                    <Compass className="w-10 h-10 text-brand-600 animate-float" />
                  </div>
                  <h3 className="text-lg font-black text-slate-800">
                    No Travel Memories yet
                  </h3>
                  <p className="text-sm font-medium text-slate-500 mt-2 max-w-[280px] mx-auto">
                    Follow travelers or share your first journey to start building
                    your feed.
                  </p>
                  <div className="mt-8">
                    <Link
                  to="/social/buddy"
                  className="btn-secondary">

                      Explore travelers
                    </Link>
                  </div>
                </div> :

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
                    audioRefCallback={(el) => audioRefs.current[post._id] = el} />);


                })}
                  {hasMore && memories.length > 0 &&
                <div
                className="flex justify-center mt-6 pb-6"
                ref={loadMoreRef}>

                      {loadingMore &&
                  <Loader2 className="w-6 h-6 animate-spin text-brand-650" />}

                    </div>}

                </div>}

            </div>

            {}
            <div className="block lg:hidden mt-4">
              <JourneyMatesSuggestions
              currentUserId={myUserId}
              initialSuggestions={suggestions} />

            </div>

            {}
            {(() => {
              const displayTrips = (() => {
                const myUserId = user?._id?.toString() || user?.id?.toString();

                const notJoinedTrips = nearbyTrips.filter((t) => {
                  const isJoined = t.members?.some((m) => (m.user?._id || m.user)?.toString() === myUserId) ||
                  (t.userId?._id || t.userId || t.host?._id || t.host)?.toString() === myUserId;
                  return !isJoined;
                });

                if (!user?.state && !user?.city) return notJoinedTrips.slice(0, 5);

                const userCity = (user?.city || "").toLowerCase();
                const userState = (user?.state || "").toLowerCase();


                const sortedTrips = [...notJoinedTrips].sort((a, b) => {
                  const aFrom = (a.from || "").toLowerCase();
                  const aDest = (a.destination || "").toLowerCase();
                  const bFrom = (b.from || "").toLowerCase();
                  const bDest = (b.destination || "").toLowerCase();

                  const getScore = (fromStr, destStr) => {
                    if (userCity && (fromStr.includes(userCity) || destStr.includes(userCity))) return 2;
                    if (userState && (fromStr.includes(userState) || destStr.includes(userState))) return 1;
                    return 0;
                  };

                  return getScore(bFrom, bDest) - getScore(aFrom, aDest);
                });

                return sortedTrips.slice(0, 5);
              })();

              const activeGroupsTitle = (() => {
                if (!user?.state) return "Active Travel Groups";
                const hasLocal = nearbyTrips.some((t) =>
                t.destination?.toLowerCase().includes(user.state.toLowerCase()) ||
                t.from?.toLowerCase().includes(user.state.toLowerCase())
                );
                return hasLocal ? `Active Groups in ${user.state}` : "Active Travel Groups";
              })();

              if (!displayTrips?.length) return null;

              return (
                <div className="block lg:hidden bg-white border border-slate-100 rounded-2xl p-4 shadow-sm space-y-3">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                      {activeGroupsTitle}
                    </h3>
                    <Link to="/social/buddy" className="text-xs font-bold text-brand-600 hover:underline">
                      See All
                    </Link>
                  </div>
                  <div className="flex gap-4 overflow-x-auto pb-2 scrollbar-none snap-x">
                    {displayTrips.map((trip) => {
                      const isJoined = trip.members?.some(
                      (m) => (m.user?._id || m.user)?.toString() === myUserId
                      ) || (trip.userId?._id || trip.userId || trip.host?._id || trip.host)?.toString() === myUserId;

                      return (
                        <div
                        key={trip._id}
                        onClick={() => navigate(`/social/buddy/${trip._id}`)}
                        className="w-[240px] shrink-0 bg-slate-50/50 border border-slate-100 rounded-xl p-3 space-y-2.5 cursor-pointer hover:border-brand-200 transition-all snap-start">

                        <div className="flex justify-between items-start gap-2">
                          <h4 className="text-xs font-bold text-slate-800 line-clamp-1 flex-1">{trip.title}</h4>
                          <span className="text-[9px] bg-brand-50 text-brand-700 font-extrabold px-1.5 py-0.5 rounded-md shrink-0">
                            {Math.max(0, trip.maxMembers - (trip.members?.length || 0))} slots open
                          </span>
                        </div>
                        <p className="text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                          <MapPin className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                          <span className="truncate">{trip.destination}</span>
                        </p>
                        <div className="flex items-center justify-between pt-1 border-t border-slate-100/50">
                          <span className="text-[9px] text-slate-400 font-bold">
                            By {(trip.userId?.name || trip.host?.name || "Traveler").split(" ")[0]}
                          </span>
                          {isJoined ?
                            <span className="text-[10px] text-emerald-600 font-black flex items-center gap-0.5">
                              Joined ✓
                            </span> :

                            <span className="text-[10px] text-brand-600 font-black flex items-center gap-0.5">
                              Join <ChevronRight className="w-3 h-3" />
                            </span>}

                        </div>
                      </div>);

                    })}
                </div>
                </div>);

            })()}
          </div>

          {}
          <RightSidebar
          user={user}
          suggestions={suggestions}
          nearbyTrips={nearbyTrips}
          handleFollowToggle={handleFollowToggle}
          followLoadingMap={followLoadingMap} />

        </div>

        {}
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

        {}
        <AnimatePresence>
          {showEditPostModal && editPostData &&
          <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-xs">

              <motion.div
            initial={{ scale: 0.95, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.95, y: 20 }}
            className="bg-white rounded-[24px] w-full max-w-md shadow-xl overflow-hidden border border-slate-100">

                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Travel Memory
                  </h3>
                  <button
                onClick={() => {
                  setShowEditPostModal(false);
                  setEditPostData(null);
                }}
                className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors">

                    <X className="w-5 h-5" />
                  </button>
                </div>
                <form onSubmit={handleEditPostSubmit} className="p-5 space-y-4">
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
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
                  className="w-full bg-white border border-[#E5E7EB] rounded-xl p-4 text-sm text-[#1E293B] outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10 transition-all duration-200 resize-none" />

                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-[#64748B] uppercase tracking-wider pl-1">
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

                  className="w-full bg-white border border-[#E5E7EB] rounded-xl p-4 text-sm text-[#1E293B] outline-none focus:border-[#7C3AED] focus:ring-4 focus:ring-[#7C3AED]/10 transition-all duration-200" />

                  </div>
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                  type="button"
                  onClick={() => {
                    setShowEditPostModal(false);
                    setEditPostData(null);
                  }}
                  className="px-5 py-2.5 text-sm font-semibold text-[#64748B] hover:bg-slate-50 border border-[#E5E7EB] rounded-xl transition-all duration-200">

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
        onSuccess={fetchFeedData} />

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