import { showToast } from "../utils/showToast";
import React, {
  useState,
  useEffect,
  useContext,
  useRef,
  useCallback,
  useMemo,
} from "react";
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
  Clock,
} from "lucide-react";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../api/axios";
import { SocketContext } from "../context/SocketContext";
import { SOCKET_EVENTS } from "../constants/socketEvents";
import Swal from "sweetalert2";
import CreateStoryModal from "../components/modals/CreateStoryModal";
import StoryViewer from "../components/story/StoryViewer";
import RightSidebar from "../components/home/RightSidebar";
import LazyImage from "../components/common/LazyImage";
import ReportModal from "../components/modals/ReportModal";
import StoryBar from "../components/home/StoryBar";
import FeedCard from "../components/home/FeedCard";

// Env
const SOCKET_URL =
  process.env.REACT_APP_SOCKET_URL || "http://10.126.5.219:5000";

const formatLocation = (location) => {
  if (!location) return "";
  const parts = location.split(",").map((p) => p.trim());
  const shortLoc = parts.slice(0, 2).join(", ");
  return shortLoc.length > 30 ? shortLoc.slice(0, 27) + "..." : shortLoc;
};

// Skeletons
const PostSkeleton = () => (
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
  </div>
);

const StorySkeleton = () => (
  <div className="w-20 h-28 sm:w-24 sm:h-32 rounded-2xl bg-slate-100 relative overflow-hidden shrink-0 animate-pulse border border-slate-100">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
  </div>
);

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
    (comment) => !comment.hidden && !comment.deleted,
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

// Component
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

  // Avatar fallback
  const handleAvatarError = useCallback((e, name) => {
    e.target.onerror = null;
    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Explorer")}&background=7C3AED&color=fff&bold=true`;
  }, []);

  // State
  const [memories, setMemories] = useState([]);
  const [isBannerDismissed, setIsBannerDismissed] = useState(() => localStorage.getItem("goyatrigo_home_banner_dismissed") === "true");
  
  const handleDismissBanner = () => {
    localStorage.setItem("goyatrigo_home_banner_dismissed", "true");
    setIsBannerDismissed(true);
  };

  const [stories, setStories] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [nearbyTrips, setNearbyTrips] = useState([]);
  const [savedPostIds, setSavedPostIds] = useState(new Set());
  const [loadingMemories, setLoadingMemories] = useState(true);
  const [loadingStories, setLoadingStories] = useState(true);
  const [followLoadingMap, setFollowLoadingMap] = useState({});
  const [saveLoadingMap, setSaveLoadingMap] = useState({});
  const [likeLoadingMap, setLikeLoadingMap] = useState({});
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
    reportedUserId: null,
  });
  const [isSubmittingComment, setIsSubmittingComment] = useState({});

  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [editPostData, setEditPostData] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Audio state
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const audioRefs = useRef({});
  const postRefs = useRef({});

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          const postId = entry.target.getAttribute("data-post-id");
          if (!postId) return;

          const audio = audioRefs.current[postId];
          if (!entry.isIntersecting) {
            if (audio && !audio.paused) {
              AudioManager.pause(postId);
              setPlayingAudioId((prev) => (prev === postId ? null : prev));
            }
          }
        });
      },
      { threshold: 0.6 },
    );

    const currentPostRefs = postRefs.current;
    Object.values(currentPostRefs).forEach((el) => {
      if (el) observer.observe(el);
    });

    return () => {
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

  // Memoised user ID
  const myUserId = useMemo(
    () => (user?._id || user?.id)?.toString(),
    [user?._id, user?.id],
  );

  // Socket setup
  useEffect(() => {
    if (!socket) return;

    const updateStoryViewers = (data) => {
            const patchStory = (st) => {
        if (st._id !== data.storyId) return st;
        const viewers = [...(st.viewers || [])];
        const idx = viewers.findIndex(
          (v) => v.userId?._id === data.viewer.userId?._id,
        );
        if (idx !== -1) viewers[idx] = data.viewer;
        else viewers.push(data.viewer);
        return { ...st, viewers };
      };
      setActiveStoryGroup((prev) =>
        prev ? { ...prev, stories: prev.stories.map(patchStory) } : prev,
      );
      setStories((prev) =>
        prev.map((g) => ({
          ...g,
          stories: g.stories?.map(patchStory) ?? g.stories,
        })),
      );
    };

    const updateStoryReactions = (data) => {
            const patchStory = (st) => {
        if (st._id !== data.storyId) return st;
        const reactions = [...(st.storyReactions || [])];
        const idx = reactions.findIndex(
          (r) => r.userId?._id === data.reaction.userId?._id,
        );
        if (idx !== -1) reactions[idx] = data.reaction;
        else reactions.push(data.reaction);
        return { ...st, storyReactions: reactions };
      };
      setActiveStoryGroup((prev) =>
        prev ? { ...prev, stories: prev.stories.map(patchStory) } : prev,
      );
      setStories((prev) =>
        prev.map((g) => ({
          ...g,
          stories: g.stories?.map(patchStory) ?? g.stories,
        })),
      );
    };

    const handleNewNotification = (notif) => {
            showToast.success(notif.message, {
        icon: notif.type === "story_react" ? "✨" : "💬",
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

  // Data fetching
  const fetchMemories = useCallback(async (pageNum = 1, append = false) => {
    if (pageNum === 1) {
      setLoadingMemories(true);
      setErrorMemories(false);
    } else setLoadingMore(true);

    try {
      const res = await axios.get(`/social/memory?page=${pageNum}&limit=10`, {
        withCredentials: true,
      });
      if (res.data.success) {
        if (append) {
          setMemories((prev) => {
            const existingIds = new Set(prev.map((p) => p._id));
            const newPosts = res.data.memories.filter(
              (p) => !existingIds.has(p._id),
            );
            return [...prev, ...newPosts];
          });
        } else {
          setMemories(res.data.memories);
        }
        if (res.data.memories.length < 10) setHasMore(false);
        else setHasMore(true);
      }
    } catch (err) {
      showToast.error("Failed to load travel feed");
      if (pageNum === 1) setErrorMemories(true);
    } finally {
      if (pageNum === 1) setLoadingMemories(false);
      else setLoadingMore(false);
    }
  }, []);

  const fetchSideData = useCallback(() => {
    setLoadingStories(true);

    Promise.allSettled([
      axios.get("/social/story", { withCredentials: true }),
      axios.get("/users/suggestions", { withCredentials: true }),
      axios.get("/social/buddy", { withCredentials: true }),
      axios.get("/social/memory/save?idsOnly=true", { withCredentials: true }),
    ]).then((results) => {
      if (results[0].status === "fulfilled" && results[0].value.data.success) {
        setStories(results[0].value.data.stories);
      }
      setLoadingStories(false);

      if (results[1].status === "fulfilled" && results[1].value.data.success) {
        const filtered = (results[1].value.data.suggestions || []).filter(
          (s) => s._id?.toString() !== myUserId,
        );
        setSuggestions(filtered);
      }
      if (results[2].status === "fulfilled" && results[2].value.data.success) {
        setNearbyTrips(results[2].value.data.trips || []);
      }
      if (results[3].status === "fulfilled" && results[3].value.data.success) {
        const ids = new Set(
          (results[3].value.data.posts || []).map((p) =>
            (p._id || p.postId?._id)?.toString(),
          ),
        );
        setSavedPostIds(ids);
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
      { rootMargin: "200px" },
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
    if (!post || (post.comments && post.comments.length > 0)) return;

    setCommentsLoadingMap((prev) => ({ ...prev, [postId]: true }));
    try {
      const res = await axios.get(`/social/memory/${postId}/comments`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setMemories((prev) =>
          prev.map((m) =>
            m._id === postId ? { ...m, comments: res.data.comments } : m,
          ),
        );
      }
    } catch {
      showToast.error("Failed to load comments");
    } finally {
      setCommentsLoadingMap((prev) => ({ ...prev, [postId]: false }));
    }
  };

  // Click-outside handlers
  useEffect(() => {
    const handler = (e) => {
      if (searchRef.current && !searchRef.current.contains(e.target))
        setShowSearchDropdown(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Search cleanup
  useEffect(() => {
    return () => clearTimeout(searchDebounceRef.current);
  }, []);

  // Image upload
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
          { withCredentials: true },
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

  // Post submit
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
            image: postImage,
          },
          { withCredentials: true },
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
        showToast.error("Failed to post memory");
      } finally {
        setSubmittingPost(false);
      }
    },
    [postCaption, postImage, postLocation, postTags],
  );

  // Like
  const handleLike = useCallback(
    async (postId) => {
      if (lastTapTime.current[`like_${postId}`]) return;
      lastTapTime.current[`like_${postId}`] = true;

      setLikeLoadingMap((prev) => ({ ...prev, [postId]: true }));

      setMemories((prev) =>
        prev.map((m) => {
          if (m._id === postId) {
            const hasLiked = m.likes?.some(
              (id) => (id?._id || id)?.toString() === myUserId,
            );
            const newLikes = hasLiked
              ? (m.likes || []).filter(
                  (id) => (id?._id || id)?.toString() !== myUserId,
                )
              : [...(m.likes || []), myUserId];
            return { ...m, likes: newLikes };
          }
          return m;
        }),
      );

      try {
        const res = await axios.post(
          `/social/memory/like/${postId}`,
          {},
          { withCredentials: true },
        );
        if (res.data.success) {
          const updatedLikes = res.data.memory?.likes || res.data.post?.likes;
          if (updatedLikes) {
            setMemories((prev) =>
              prev.map((m) =>
                m._id === postId ? { ...m, likes: updatedLikes } : m,
              ),
            );
          }
        }
      } catch (err) {
        showToast.error("Failed to update like");
      } finally {
        setLikeLoadingMap((prev) => ({ ...prev, [postId]: false }));
        lastTapTime.current[`like_${postId}`] = false;
      }
    },
    [myUserId],
  );

  const handleDoubleTapLike = useCallback(
    (postId, likes, tapPoint) => {
      const hasLiked = likes?.some(
        (id) => (id?._id || id)?.toString() === myUserId,
      );
      if (!hasLiked) handleLike(postId);

      setJourneyLikeAnim({
        postId,
        x: tapPoint?.x ?? 50,
        y: tapPoint?.y ?? 50,
        key: Date.now(),
      });

      window.setTimeout(() => setJourneyLikeAnim(null), 1150);
    },
    [myUserId, handleLike],
  );

  const handlePostTap = useCallback(
    (e, postId, likes) => {
      const now = Date.now();
      const lastTap = lastTapTime.current[postId] || 0;

      if (now - lastTap < 300) {
        const rect = e.currentTarget.getBoundingClientRect();
        const tapPoint = {
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        };
        handleDoubleTapLike(postId, likes, tapPoint);
        lastTapTime.current[postId] = 0;
      } else {
        lastTapTime.current[postId] = now;
      }
    },
    [handleDoubleTapLike],
  );

  // Comments
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
          { withCredentials: true },
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
                  commentsCount: res.data.memory.comments.length,
                };
              }
              if (res.data.comment) {
                const visibleComments = getVisibleComments(m);
                const exists = visibleComments.some(
                  (c) => c._id === res.data.comment._id,
                );
                if (exists) return m;
                const newComments = [...visibleComments, res.data.comment];
                return {
                  ...m,
                  comments: newComments,
                  commentsCount: newComments.length,
                };
              }
              return m;
            }),
          );
        }
      } catch {
        showToast.error("Failed to post comment");
      } finally {
        setIsSubmittingComment((prev) => ({ ...prev, [postId]: false }));
      }
    },
    [commentText, isSubmittingComment],
  );

  // Delete comment
  const handleDeleteComment = useCallback(async (postId, commentId) => {
    const { isConfirmed } = await Swal.fire({
      title: "Delete this comment?",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });
    if (!isConfirmed) return;
    try {
      const res = await axios.delete(
        `/social/memory/${postId}/comment/${commentId}`,
        { withCredentials: true },
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
                commentsCount: res.data.memory.comments.length,
              };
            }
            const visibleComments = getVisibleComments(m);
            const newComments = visibleComments.filter(
              (c) => c._id !== commentId,
            );
            return {
              ...m,
              comments: newComments,
              commentsCount: newComments.length,
            };
          }),
        );
      }
    } catch {
      showToast.error("Failed to delete comment");
    }
  }, []);

  // Save toggle
  const handleSaveToggle = useCallback(
    async (postId) => {
      const postIdStr = postId?.toString();
      if (saveLoadingMap[postIdStr]) return;
      setSaveLoadingMap((prev) => ({ ...prev, [postIdStr]: true }));
      const isSaved = savedPostIds.has(postIdStr);
      try {
        const res = isSaved
          ? await axios.delete(`/social/memory/save/${postIdStr}`, {
              withCredentials: true,
            })
          : await axios.post(
              `/social/memory/save/${postIdStr}`,
              {},
              { withCredentials: true },
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
    [saveLoadingMap, savedPostIds],
  );

  // Share
  const handleShare = useCallback(async (postId) => {
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
      /* user cancelled share */
    }
  }, []);

  // Follow / unfollow
  const handleFollowToggle = useCallback(
    async (targetUser) => {
      if (followLoadingMap[targetUser._id]) return;
      setFollowLoadingMap((prev) => ({ ...prev, [targetUser._id]: true }));
      const isFollowing = targetUser.followers?.some(
        (id) => id?.toString() === myUserId,
      );
      const isRequested = targetUser.followRequests?.some(
        (id) => id?.toString() === myUserId,
      );
      try {
        if (isFollowing || isRequested) {
          await axios.post(
            `/users/${targetUser._id}/unfollow`,
            {},
            { withCredentials: true },
          );
          showToast.success(
            isRequested
              ? `Follow request cancelled`
              : `Unfollowed ${targetUser.name}`,
          );
          setSuggestions((prev) =>
            prev.map((s) =>
              s._id === targetUser._id
                ? {
                    ...s,
                    followers: (s.followers || []).filter(
                      (id) => id?.toString() !== myUserId,
                    ),
                    followRequests: (s.followRequests || []).filter(
                      (id) => id?.toString() !== myUserId,
                    ),
                  }
                : s,
            ),
          );
        } else {
          const res = await axios.post(
            `/users/${targetUser._id}/follow`,
            {},
            { withCredentials: true },
          );
          if (res.data.status === "requested") {
            showToast.success(`Follow request sent to ${targetUser.name}!`);
            setSuggestions((prev) =>
              prev.map((s) =>
                s._id === targetUser._id
                  ? {
                      ...s,
                      followRequests: [...(s.followRequests || []), myUserId],
                    }
                  : s,
              ),
            );
          } else {
            showToast.success(`Following ${targetUser.name}! ✈️`);
            setSuggestions((prev) =>
              prev.map((s) =>
                s._id === targetUser._id
                  ? { ...s, followers: [...(s.followers || []), myUserId] }
                  : s,
              ),
            );
          }
        }
      } catch {
        showToast.error("Action failed");
      } finally {
        setFollowLoadingMap((prev) => ({ ...prev, [targetUser._id]: false }));
      }
    },
    [followLoadingMap, myUserId],
  );

  // Edit Post
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
          tags: editPostData.tags,
        },
        { withCredentials: true },
      );
      if (res.data.success) {
        showToast.success("Post updated successfully!");
        setMemories((prev) =>
          prev.map((p) => (p._id === editPostData._id ? res.data.post : p)),
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

  // Delete post
  const handleDeletePost = useCallback(async (postId) => {
    const { isConfirmed } = await Swal.fire({
      title: "Delete this memory post?",
      text: "This action cannot be undone.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#ef4444",
      confirmButtonText: "Delete",
    });
    if (!isConfirmed) return;
    try {
      const res = await axios.delete(`/social/memory/${postId}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        showToast.success("Post deleted");
        setMemories((prev) => prev.filter((m) => m._id !== postId));
      }
    } catch {
      showToast.error("Action failed");
    }
  }, []);

  // Delete story
  const handleDeleteStory = useCallback(
    async (storyId) => {
      const { isConfirmed } = await Swal.fire({
        title: "Delete this story?",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#ef4444",
        confirmButtonText: "Delete",
      });
      if (!isConfirmed) return;
      try {
        const res = await axios.delete(`/social/story/${storyId}`, {
          withCredentials: true,
        });
        if (res.data.success) {
          showToast.success("Story deleted");
          setActiveStoryGroup(null);
          fetchFeedData();
        }
      } catch {
        showToast.error("Failed to delete story");
      }
    },
    [fetchFeedData],
  );

  const handleStoryViewed = useCallback((storyId) => {
    setStories((prev) =>
      prev.map((g) => ({
        ...g,
        stories: g.stories?.map((s) => {
          if (s._id === storyId) {
            const viewedBy = [...(s.viewedBy || [])];
            if (!viewedBy.includes(myUserId)) viewedBy.push(myUserId);
            return { ...s, viewedBy };
          }
          return s;
        }) ?? g.stories,
      })),
    );
  }, [myUserId]);

  // Derived values for stories
  const myStoryGroup = useMemo(
    () => stories.find((g) => (g.userId?._id || g.userId)?.toString() === myUserId),
    [stories, myUserId],
  );
  const otherStories = useMemo(
    () => stories.filter((g) => (g.userId?._id || g.userId)?.toString() !== myUserId),
    [stories, myUserId],
  );
  const sortedStories = useMemo(() => {
    return [...otherStories].sort((a, b) => {
      const aHasUnviewed = a.stories?.some(
        (s) => !s.viewedBy?.includes(myUserId),
      );
      const bHasUnviewed = b.stories?.some(
        (s) => !s.viewedBy?.includes(myUserId),
      );
      if (aHasUnviewed && !bHasUnviewed) return -1;
      if (!aHasUnviewed && bHasUnviewed) return 1;
      const aLatest = Math.max(
        ...(a.stories || []).map((s) => new Date(s.createdAt).getTime()),
      );
      const bLatest = Math.max(
        ...(b.stories || []).map((s) => new Date(s.createdAt).getTime()),
      );
      return bLatest - aLatest;
    });
  }, [otherStories, myUserId]);

  // Story navigation
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
          (g) => (g.userId?._id || g.userId)?.toString() === activeId,
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
          (g) => (g.userId?._id || g.userId)?.toString() === activeId,
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

  // Search
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
          { withCredentials: true },
        );
        if (res.data.success) setSearchResults(res.data);
      } catch {
        /* silent */
      } finally {
        setSearchLoading(false);
      }
    }, 400);
  }, []);

  const isPostCreator = useCallback(
    (post) => (post.userId?._id || post.userId)?.toString() === myUserId,
    [myUserId],
  );

  const scrollStories = useCallback((direction) => {
    if (storyContainerRef.current) {
      const scrollAmount = 300;
      storyContainerRef.current.scrollBy({
        left: direction * scrollAmount,
        behavior: "smooth",
      });
    }
  }, []);

  return (
    <div className="w-full min-h-[100dvh] overflow-x-hidden pb-20 lg:pb-0 relative">
      <div className="max-w-6xl pt-4 px-4 sm:px-6 lg:pl-0 lg:pr-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6 xl:gap-8 items-start">
          {/* main feed */}
          <div className="w-full max-w-[700px] space-y-6 min-w-0">
            {/* Story bar - Compact Horizontal Scroll */}
            <StoryBar
              user={user}
              myUserId={myUserId}
              stories={stories}
              myStoryGroup={myStoryGroup}
              sortedStories={sortedStories}
              loadingStories={loadingStories}
              onlineUsersMap={onlineUsersMap}
              setActiveStoryGroup={setActiveStoryGroup}
              setActiveStoryIndex={setActiveStoryIndex}
              setShowStoryModal={setShowStoryModal}
              handleAvatarError={handleAvatarError}
            />

            {user && !isBannerDismissed && ((user.postsCount || 0) === 0 || memories.filter(m => m.user?._id === myUserId || m.user === myUserId).length === 0) && (
              <div className="bg-gradient-to-r from-brand-600 to-indigo-600 rounded-3xl p-6 text-white shadow-md relative overflow-hidden mb-6 select-none">
                <div className="absolute top-0 right-0 w-[300px] h-[300px] bg-white/10 rounded-full blur-[80px] translate-x-1/3 -translate-y-1/3 pointer-events-none" />
                <button
                  onClick={handleDismissBanner}
                  className="absolute top-4 right-4 p-1.5 bg-white/10 hover:bg-white/20 text-white rounded-full transition-colors"
                  aria-label="Dismiss banner"
                >
                  <X className="w-4 h-4" />
                </button>
                <h2 className="text-xl sm:text-2xl font-black mb-1.5 flex items-center gap-2">
                  ✈️ Welcome to Go YatriGo, {user?.name || "Explorer"}!
                </h2>
                <p className="text-xs sm:text-sm text-white/80 font-medium max-w-lg leading-relaxed">
                  Discover new destinations, connect with nearby travelers, and share your travel memories with the community.
                </p>
              </div>
            )}

            {/* Feed posts */}
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
                  className="btn-primary"
                >
                  Try again
                </button>
              </div>
            ) : memories.length === 0 ? (
              <div className="card p-8 sm:p-16 text-center min-h-[420px] flex flex-col items-center justify-center">
                <div className="w-20 h-20 bg-brand-50 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Compass className="w-10 h-10 text-brand-600 animate-float" />
                </div>
                <h3 className="text-lg font-black text-slate-800">
                  No posts yet
                </h3>
                <p className="text-sm font-medium text-slate-500 mt-2 max-w-[280px] mx-auto">
                  Follow travelers or share your first journey to start building
                  your feed.
                </p>
                <div className="mt-8">
                  <Link
                    to="/social/buddy"
                    className="btn-secondary"
                  >
                    Explore travelers
                  </Link>
                </div>
              </div>
            ) : (
              <div className="space-y-6">
                {memories.map((post) => {
                  const hasLiked = post.likes?.some(
                    (id) => (id?._id || id)?.toString() === myUserId,
                  );
                  const isSaved = savedPostIds.has(post._id?.toString());
                  const isCreator = isPostCreator(post);

                  return (
                    <FeedCard
                      key={post._id}
                      ref={(el) => (postRefs.current[post._id] = el)}
                      post={post}
                      user={user}
                      myUserId={myUserId}
                      hasLiked={hasLiked}
                      isSaved={isSaved}
                      isCreator={isCreator}
                      likeLoadingMap={likeLoadingMap}
                      saveLoadingMap={saveLoadingMap}
                      commentsLoadingMap={commentsLoadingMap}
                      isSubmittingComment={isSubmittingComment}
                      commentText={commentText}
                      activeCommentPost={activeCommentPost}
                      playingAudioId={playingAudioId}
                      journeyLikeAnim={journeyLikeAnim}
                      handleLike={handleLike}
                      handlePostTap={handlePostTap}
                      handleOpenComments={handleOpenComments}
                      handleShare={handleShare}
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
                      audioRefCallback={(el) => (audioRefs.current[post._id] = el)}
                    />
                  );
                })}
                {hasMore && memories.length > 0 && (
                  <div
                    className="flex justify-center mt-6 pb-6"
                    ref={loadMoreRef}
                  >
                    {loadingMore && (
                      <Loader2 className="w-6 h-6 animate-spin text-brand-600" />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* right sidebar */}
          <RightSidebar
            user={user}
            suggestions={suggestions}
            nearbyTrips={nearbyTrips}
            handleFollowToggle={handleFollowToggle}
            followLoadingMap={followLoadingMap}
          />
        </div>

        {/* Story viewer */}
        <AnimatePresence>
          {activeStoryGroup && (
            <StoryViewer
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
              stories={stories}
              onStoryViewed={handleStoryViewed}
            />
          )}
        </AnimatePresence>

        {/* Edit Post Modal */}
        <AnimatePresence>
          {showEditPostModal && editPostData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/20 backdrop-blur-xs"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white rounded-[24px] w-full max-w-md shadow-xl overflow-hidden border border-slate-100"
              >
                <div className="flex items-center justify-between p-5 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">
                    Edit Post
                  </h3>
                  <button
                    onClick={() => {
                      setShowEditPostModal(false);
                      setEditPostData(null);
                    }}
                    className="p-2 text-slate-400 hover:bg-slate-100 rounded-full transition-colors"
                  >
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
                          caption: e.target.value,
                        })
                      }
                      rows="3"
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 outline-none focus:border-brand-500 focus:ring-4 focus:ring-brand-500/10 transition-all resize-none"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold text-slate-500 uppercase tracking-wider pl-1">
                      Location
                    </label>
                    <input
                      type="text"
                      placeholder="Add location"
                      value={editPostData.location || ""}
                      onChange={(e) =>
                        setEditPostData({
                          ...editPostData,
                          location: e.target.value,
                        })
                      }
                      className="w-full bg-slate-50 border border-slate-200 rounded-2xl p-4 text-sm text-slate-700 outline-none focus:border-brand-500/10 focus:ring-4 focus:ring-brand-500/10 transition-all"
                    />
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditPostModal(false);
                        setEditPostData(null);
                      }}
                      className="px-5 py-2.5 text-xs font-bold text-slate-500 hover:bg-slate-100 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="btn-primary px-6 py-2.5"
                    >
                      {isSaving && <Loader2 className="w-4 h-4 animate-spin" />}
                      Save Changes
                    </button>
                  </div>
                </form>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        <CreateStoryModal
          isOpen={showStoryModal}
          onClose={() => setShowStoryModal(false)}
          onSuccess={fetchFeedData}
        />
        {reportModal.isOpen && (
          <ReportModal
            isOpen={reportModal.isOpen}
            onClose={() =>
              setReportModal({
                isOpen: false,
                targetId: null,
                targetType: "post",
                reportedUserId: null,
              })
            }
            targetId={reportModal.targetId}
            targetType={reportModal.targetType}
            reportedUserId={reportModal.reportedUserId}
          />
        )}
      </div>
    </div>
  );
};

export default Home;

