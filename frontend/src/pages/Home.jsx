/* eslint-disable */
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
import Swal from "sweetalert2";
import CreateStoryModal from "../components/modals/CreateStoryModal";
import StoryViewer from "../components/story/StoryViewer";
import RightSidebar from "../components/home/RightSidebar";
import LazyImage from "../components/common/LazyImage";
import ReportModal from "../components/modals/ReportModal";

// Env
// Use CRA (REACT_APP_) env variable convention
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
  <div className="bg-white dark:bg-slate-800 rounded-3xl overflow-hidden border border-[#8b5cf614] dark:border-slate-700 shadow-[0_8px_30px_rgba(0,0,0,0.06)] dark:shadow-none animate-pulse transition-colors duration-300">
    <div className="p-4 flex items-center gap-3">
      <div className="w-10 h-10 rounded-full bg-slate-200" />
      <div className="space-y-2 flex-1">
        <div className="h-3 bg-slate-200 rounded w-32" />
        <div className="h-2 bg-slate-100 rounded w-20" />
      </div>
    </div>
    <div className="w-full h-[420px] max-h-[450px] object-cover object-center bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800" />
    <div className="p-4 space-y-3">
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
  <div className="w-[70px] h-[100px] sm:w-[84px] sm:h-[120px] rounded-2xl bg-gradient-to-br from-slate-200 to-slate-100 dark:from-slate-700 dark:to-slate-800 relative overflow-hidden shrink-0 animate-pulse border border-slate-100 dark:border-slate-600/50">
    <div className="absolute inset-0 -translate-x-full animate-[shimmer_2s_infinite] bg-gradient-to-r from-transparent via-white/50 dark:via-white/10 to-transparent" />
  </div>
);

const notifIcon = (type) => {
  if (type === "post_like")
    return <span className="text-sm leading-none">✨</span>;
  if (type === "post_comment")
    return <MessageSquare className="w-3.5 h-3.5 text-[#6C4DF6]" />;
  if (type === "follow" || type === "new_follower")
    return <UserPlus className="w-3.5 h-3.5 text-emerald-500" />;
  if (type === "story_reply")
    return <Sparkles className="w-3.5 h-3.5 text-amber-500" />;
  return <Bell className="w-3.5 h-3.5 text-slate-500" />;
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
    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(name || "Explorer")}&background=6C4DF6&color=fff&bold=true`;
  }, []);

  // State
  const [memories, setMemories] = useState([]);
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
          if (entry.isIntersecting) {
            // Autoplay disabled: post songs should only play after user manually clicks play.
          } else {
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
      Object.values(currentPostRefs).forEach((el) => {
        if (el) observer.unobserve(el);
      });
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

  const [storyReplyText, setStoryReplyText] = useState("");
  const [replyingToStory, setReplyingToStory] = useState(false);

  const socket = useContext(SocketContext);
  const [onlineUsersMap, setOnlineUsersMap] = useState({});
  const lastTapTime = useRef({});

  // Memoised user ID — avoids recalculating on every render
  const myUserId = useMemo(
    () => (user?._id || user?.id)?.toString(),
    [user?._id, user?.id],
  );

  // Socket setup
  useEffect(() => {
    if (!socket) return;

    const onConnect = () => {
      if (myUserId) socket.emit("go_online", myUserId);
    };

    // If socket is already connected when component mounts
    if (socket.connected) {
      onConnect();
    }

    socket.on("connect", onConnect);

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

    socket.on("story_viewer_update", updateStoryViewers);
    socket.on("story_reaction_update", updateStoryReactions);
    socket.on("new_notification", handleNewNotification);
    socket.on("user_presence", handleUserPresence);

    return () => {
      socket.off("connect", onConnect);
      socket.off("story_viewer_update", updateStoryViewers);
      socket.off("story_reaction_update", updateStoryReactions);
      socket.off("new_notification", handleNewNotification);
      socket.off("user_presence", handleUserPresence);
    };
  }, [socket, myUserId]);

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
          // Optimistically prepend to memories
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

      // Optimistic Update
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

      // Unique GoYatri interaction: a soft travel-ripple starts from the tap point.
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
              // Backend returns the fully populated and filtered post with comments
              if (res.data.memory?.comments) {
                return {
                  ...m,
                  comments: res.data.memory.comments,
                  commentsCount: res.data.memory.comments.length,
                };
              }
              // Fallback: if backend returns just the comment, add it to the array
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

  // Delete comment — use Swal instead of window.confirm
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
            // Backend now returns the fully populated and filtered post with updated comments
            if (res.data.memory?.comments) {
              return {
                ...m,
                comments: res.data.memory.comments,
                commentsCount: res.data.memory.comments.length,
              };
            }
            // Fallback: filter out the deleted comment from the current array
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

  // Story reply
  const handleStoryReply = useCallback(async () => {
    if (!storyReplyText.trim() || !activeStoryGroup) return;
    setReplyingToStory(true);
    try {
      const currentStory = activeStoryGroup.stories[activeStoryIndex];
      const res = await axios.post(
        `/social/story/reply/${activeStoryGroup.userId}`,
        { text: storyReplyText, storyId: currentStory?._id },
        { withCredentials: true },
      );
      if (res.data.success) {
        showToast.success(
          `Reply sent to ${activeStoryGroup.userName.split(" ")[0]}! 💬`,
        );
        setStoryReplyText("");
      }
    } catch {
      showToast.error("Failed to send reply");
    } finally {
      setReplyingToStory(false);
    }
  }, [storyReplyText, activeStoryGroup, activeStoryIndex]);

  // Story reaction
  const handleStoryReaction = useCallback(
    async (emoji) => {
      if (!activeStoryGroup) return;
      try {
        const currentStory = activeStoryGroup.stories[activeStoryIndex];
        const res = await axios.post(
          `/social/story/${currentStory?._id}/react`,
          { emoji },
          { withCredentials: true },
        );
        if (res.data.success) {
          showToast.success(`${emoji} Sent!`);
          fetchFeedData();
        }
      } catch {
        showToast.error("Failed to send reaction");
      }
    },
    [activeStoryGroup, activeStoryIndex, fetchFeedData],
  );

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

  // Delete post — use Swal instead of window.confirm
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

  // Delete story — use Swal instead of window.confirm
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

  // Story navigation
  const nextStory = useCallback(() => {
    if (!activeStoryGroup) return;
    if (activeStoryIndex < activeStoryGroup.stories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
    } else {
      const groupIdx = stories.findIndex(
        (g) => g.userId === activeStoryGroup.userId,
      );
      if (groupIdx < stories.length - 1) {
        setActiveStoryGroup(stories[groupIdx + 1]);
        setActiveStoryIndex(0);
      } else {
        setActiveStoryGroup(null);
      }
    }
  }, [activeStoryGroup, activeStoryIndex, stories]);

  const prevStory = useCallback(() => {
    if (!activeStoryGroup) return;
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
    } else {
      const groupIdx = stories.findIndex(
        (g) => g.userId === activeStoryGroup.userId,
      );
      if (groupIdx > 0) {
        const prevGroup = stories[groupIdx - 1];
        setActiveStoryGroup(prevGroup);
        setActiveStoryIndex(prevGroup.stories.length - 1);
      } else {
        setActiveStoryGroup(null);
      }
    }
  }, [activeStoryGroup, activeStoryIndex, stories]);

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

  // Derived values
  const myStoryGroup = useMemo(
    () => stories.find((g) => g.userId?.toString() === myUserId),
    [stories, myUserId],
  );
  const otherStories = useMemo(
    () => stories.filter((g) => g.userId?.toString() !== myUserId),
    [stories, myUserId],
  );
  const isPostCreator = useCallback(
    (post) => (post.userId?._id || post.userId)?.toString() === myUserId,
    [myUserId],
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
    <div className="w-full min-h-[100dvh] overflow-x-hidden pb-20 lg:pb-0 font-sans antialiased relative">
      {/* Soft Layered Background */}
      <div className="fixed inset-0 pointer-events-none z-[-1] bg-gradient-to-br from-purple-50/50 via-white to-slate-50 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950"></div>
      <div className="fixed top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-purple-300/10 blur-[100px] pointer-events-none z-[-1]"></div>
      <div className="fixed bottom-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-indigo-300/10 blur-[100px] pointer-events-none z-[-1]"></div>

      <div className="max-w-7xl mx-auto pt-2 sm:pt-3 px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_330px] gap-6 xl:gap-8">
          {/* ── Center Feed ── */}
          <div className="w-full max-w-2xl mx-auto space-y-5 min-w-0">
            {/* Story bar - Compact Horizontal Scroll */}
            <div className="relative group/storybar w-full max-w-full min-w-0">
              <button
                aria-label="Scroll left"
                onClick={() => scrollStories(-1)}
                className="absolute left-0 top-1/2 -translate-y-1/2 -ml-4 w-8 h-8 bg-white dark:bg-slate-800 rounded-full shadow-md z-10 hidden lg:group-hover/storybar:flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button
                aria-label="Scroll right"
                onClick={() => scrollStories(1)}
                className="absolute right-0 top-1/2 -translate-y-1/2 -mr-4 w-8 h-8 bg-white dark:bg-slate-800 rounded-full shadow-md z-10 hidden lg:group-hover/storybar:flex items-center justify-center text-slate-500 hover:text-slate-800 transition-colors"
              >
                <ChevronRight className="w-5 h-5" />
              </button>

              <div
                ref={storyContainerRef}
                className="w-full max-w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl border border-white/40 dark:border-slate-700/50 rounded-3xl py-2.5 px-3 sm:py-3 sm:px-4 shadow-[0_8px_30px_rgba(0,0,0,0.04)] dark:shadow-none flex items-center gap-2 sm:gap-3 overflow-x-auto scrollbar-none snap-x snap-mandatory select-none transition-colors duration-300 scroll-smooth"
              >
                {/* My story */}
                <div className="flex flex-col shrink-0">
                  {myStoryGroup ? (
                    <div
                      onClick={() => {
                        setActiveStoryGroup(myStoryGroup);
                        setActiveStoryIndex(0);
                      }}
                      className="w-[70px] h-[100px] sm:w-[84px] sm:h-[120px] rounded-2xl overflow-hidden relative cursor-pointer hover:scale-105 transition-all duration-300 shadow-sm group"
                    >
                      {myStoryGroup.stories[0]?.mediaType === "video" ? (
                        <video
                          src={myStoryGroup.stories[0]?.media}
                          className="w-full h-full object-cover"
                        />
                      ) : (
                        <img
                          loading="lazy"
                          src={
                            myStoryGroup.stories[0]?.media ||
                            myStoryGroup.stories[0]?.mediaUrl ||
                            myStoryGroup.stories[0]?.image ||
                            getAvatarUrl(user, user?.name)
                          }
                          alt="Your story"
                          className="w-full h-full object-cover"
                          onError={(e) => handleAvatarError(e, user?.name)}
                        />
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                      <div className="absolute top-2 left-2 w-8 h-8 rounded-full p-[2px] bg-gradient-to-tr from-pink-500 to-purple-500">
                        <img
                          loading="lazy"
                          src={getAvatarUrl(user, user?.name)}
                          className="w-full h-full rounded-full object-cover border-2 border-white"
                          onError={(e) => handleAvatarError(e, user?.name)}
                          alt=""
                        />
                      </div>
                      <div
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowStoryModal(true);
                        }}
                        className="absolute bottom-2 left-2 right-2 flex justify-between items-end"
                      >
                        <span className="text-[10px] font-bold text-white truncate drop-shadow-md">
                          My Story
                        </span>
                        <div className="w-5 h-5 bg-[#6C4DF6] rounded-full flex items-center justify-center border-2 border-white shadow-lg hover:bg-[#5b3ee0] transition-colors shrink-0">
                          <Plus className="w-3 h-3 text-white" />
                        </div>
                      </div>
                    </div>
                  ) : (
                    <div
                      onClick={() => setShowStoryModal(true)}
                      className="w-[70px] h-[100px] sm:w-[84px] sm:h-[120px] rounded-2xl overflow-hidden relative cursor-pointer hover:scale-105 transition-all duration-300 shadow-sm group shrink-0"
                    >
                      <img
                        loading="lazy"
                        src={getAvatarUrl(user, user?.name)}
                        alt="Your story"
                        className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity"
                        onError={(e) => handleAvatarError(e, user?.name)}
                      />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

                      <div className="absolute bottom-3 left-0 right-0 flex flex-col items-center justify-center gap-1.5">
                        <div className="w-7 h-7 bg-[#6C4DF6] rounded-full flex items-center justify-center border-[2px] border-white shadow-lg group-hover:scale-110 transition-transform">
                          <Plus className="w-4 h-4 text-white" />
                        </div>
                        <span className="text-[10px] font-bold text-white drop-shadow-md">
                          My Story
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Others' stories */}
                {loadingStories
                  ? [1, 2, 3].map((i) => <StorySkeleton key={i} />)
                  : sortedStories.map((group) => {
                      const hasUnviewed = group.stories?.some(
                        (s) => !s.viewedBy?.includes(myUserId),
                      );
                      return (
                        <div
                          key={group.userId}
                          onClick={() => {
                            setActiveStoryGroup(group);
                            setActiveStoryIndex(0);
                          }}
                          className="w-[70px] h-[100px] sm:w-[84px] sm:h-[120px] rounded-2xl overflow-hidden relative cursor-pointer hover:scale-105 transition-all duration-300 shadow-sm group shrink-0"
                        >
                          {group.stories[0]?.media ||
                          group.stories[0]?.mediaUrl ||
                          group.stories[0]?.image ? (
                            group.stories[0]?.mediaType === "video" ? (
                              <video
                                src={group.stories[0]?.media}
                                className="w-full h-full object-cover"
                              />
                            ) : (
                              <img
                                loading="lazy"
                                src={
                                  group.stories[0].media ||
                                  group.stories[0].mediaUrl ||
                                  group.stories[0].image
                                }
                                alt={group.userName}
                                className="w-full h-full object-cover"
                                onError={(e) => {
                                  e.target.onerror = null;
                                  e.target.style.display = "none";
                                }}
                              />
                            )
                          ) : (
                            <div className="w-full h-full bg-gradient-to-br from-[#6C4DF6]/80 to-purple-400" />
                          )}
                          <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-transparent to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />

                          <div
                            className={`absolute top-2 left-2 w-8 h-8 rounded-full p-[2px] ${hasUnviewed ? "bg-gradient-to-tr from-pink-500 to-purple-500" : "bg-slate-300"}`}
                          >
                            <img
                              loading="lazy"
                              src={getAvatarUrl(
                                group.userPic,
                                group.userImg,
                                group.userName,
                              )}
                              alt={group.userName}
                              className="w-full h-full rounded-full object-cover border-2 border-white"
                              onError={(e) =>
                                handleAvatarError(e, group.userName)
                              }
                            />
                          </div>
                          {onlineUsersMap[group.userId] && (
                            <div
                              className="absolute top-2 right-2 w-3 h-3 bg-emerald-500 rounded-full border-2 border-white shadow-sm"
                              title="Online"
                            />
                          )}
                          <span className="absolute bottom-2 left-2 right-2 text-[10px] font-bold text-white truncate drop-shadow-md">
                            {group.userName.split(" ")[0]}
                          </span>
                        </div>
                      );
                    })}
              </div>
            </div>

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
              <div className="bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-3xl p-8 sm:p-16 text-center shadow-[0_10px_30px_rgba(15,23,42,0.05)] dark:shadow-none min-h-[300px] flex flex-col items-center justify-center transition-colors duration-300">
                <div className="w-16 h-16 bg-rose-100 dark:bg-rose-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <ShieldAlert className="w-8 h-8 text-rose-500" />
                </div>
                <h3 className="text-xl font-black text-slate-800 dark:text-white">
                  Oops, something went wrong!
                </h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 mb-6 max-w-[280px] mx-auto">
                  We couldn't load the feed right now. Please check your
                  connection and try again.
                </p>
                <button
                  onClick={() => fetchMemories(1)}
                  className="inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#6C4DF6] text-white font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-[#5b3ee0] shadow-[0_4px_12px_rgba(108,77,246,0.3)] transition-all"
                >
                  Try again
                </button>
              </div>
            ) : memories.length === 0 ? (
              <div className="bg-white dark:bg-slate-800 border border-[#8b5cf614] dark:border-slate-700 rounded-3xl p-8 sm:p-16 text-center shadow-[0_10px_30px_rgba(15,23,42,0.05)] dark:shadow-none min-h-[420px] flex flex-col items-center justify-center transition-colors duration-300">
                <div className="w-20 h-20 bg-[#6C4DF6]/10 dark:bg-[#6C4DF6]/20 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Compass className="w-10 h-10 text-[#6C4DF6] animate-float" />
                </div>
                <h3 className="text-xl font-black text-[#111827] dark:text-white transition-colors duration-300">
                  No posts yet
                </h3>
                <p className="text-sm font-medium text-slate-500 dark:text-slate-400 mt-2 max-w-[280px] mx-auto transition-colors duration-300">
                  Follow travelers or share your first journey to start building
                  your feed.
                </p>
                <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-4">
                  <Link
                    to="/social/buddy"
                    className="w-full sm:w-auto inline-flex items-center justify-center gap-2 px-6 py-3 bg-[#6C4DF6]/10 dark:bg-[#6C4DF6]/20 text-[#6C4DF6] font-extrabold text-xs uppercase tracking-widest rounded-xl hover:bg-[#6C4DF6]/20 dark:hover:bg-[#6C4DF6]/30 hover:shadow-purple-200 dark:hover:shadow-purple-900/50 hover:shadow-[0_0_15px] transition-all"
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

                  // Comment counts: total for icon, visible for "View all X" text
                  const totalCommentsCount = getTotalCommentCount(post);
                  const visibleComments = getVisibleComments(post);
                  const previewComments = getPreviewComments(post);
                  const visibleCommentsCount = getVisibleCommentCount(post);

                  const likesCount = post.likes?.length ?? 0;

                  return (
                    <motion.div
                      layout
                      key={post._id}
                      ref={(el) => (postRefs.current[post._id] = el)}
                      data-post-id={post._id}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                        mass: 0.8,
                      }}
                      className="bg-white/80 dark:bg-slate-800/80 backdrop-blur-md rounded-3xl overflow-hidden border border-slate-100 dark:border-slate-700 shadow-[0_10px_40px_rgba(0,0,0,0.03)] hover:shadow-[0_15px_50px_rgba(0,0,0,0.06)] transition-all duration-500 hover:-translate-y-0.5 group"
                    >
                      {/* Post header */}
                      <div className="flex items-center justify-between px-5 py-3 border-b border-slate-100 dark:border-slate-700/50">
                        <div className="flex items-center gap-3 min-w-0">
                          <Link
                            to={`/profile/${post.userId?._id || post.userId}`}
                            className="shrink-0"
                          >
                            <Avatar
                              user={post.userId}
                              pic={post.userId?.pic}
                              img={post.userId?.img || post.userPic}
                              name={post.userId?.name || post.userName}
                              className="h-11 w-11 rounded-full object-cover ring-2 ring-purple-100 shadow-sm"
                            />
                          </Link>

                          <div className="min-w-0 flex flex-col justify-center">
                            <div className="flex items-center gap-2">
                              <Link
                                to={`/profile/${post.userId?._id || post.userId}`}
                              >
                                <h4 className="text-sm font-semibold text-slate-900 dark:text-white hover:text-[#6C4DF6] transition-colors truncate">
                                  {post.userName}
                                </h4>
                              </Link>
                              {(post.userId?.isVerified || post.isVerified) && (
                                <span
                                  className="bg-blue-500 text-white p-[2px] rounded-full flex items-center justify-center shrink-0"
                                  title="Verified Traveler"
                                >
                                  <svg
                                    className="w-2.5 h-2.5"
                                    fill="none"
                                    viewBox="0 0 24 24"
                                    stroke="currentColor"
                                    strokeWidth={3}
                                  >
                                    <path
                                      strokeLinecap="round"
                                      strokeLinejoin="round"
                                      d="M5 13l4 4L19 7"
                                    />
                                  </svg>
                                </span>
                              )}
                            </div>

                            <div className="mt-1 flex items-center gap-1.5 text-xs text-slate-500 min-w-0">
                              {post.location && (
                                <>
                                  <MapPin className="h-3.5 w-3.5 shrink-0 text-purple-400" />
                                  <span className="truncate max-w-[260px]">
                                    {formatLocation(post.location)}
                                  </span>
                                  <span className="shrink-0 text-slate-300">
                                    •
                                  </span>
                                </>
                              )}
                              <span className="shrink-0">
                                {moment(post.createdAt).fromNow()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="ml-auto relative group/menu flex items-center justify-center shrink-0">
                          <button
                            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-50 dark:hover:bg-slate-800 rounded-full transition-colors focus:outline-none"
                            aria-label="More options"
                          >
                            <MoreHorizontal className="w-5 h-5" />
                          </button>

                          <div className="absolute right-0 top-full mt-1 opacity-0 invisible group-hover/menu:opacity-100 group-hover/menu:visible transition-all duration-200 z-50 bg-white dark:bg-slate-800 rounded-xl shadow-[0_8px_30px_rgba(0,0,0,0.12)] border border-slate-100 dark:border-slate-700 py-1.5 min-w-[140px]">
                            {!isCreator && (
                              <button
                                onClick={() =>
                                  setReportModal({
                                    isOpen: true,
                                    targetId: post._id,
                                    targetType: "post",
                                    reportedUserId:
                                      post.userId?._id || post.userId,
                                  })
                                }
                                className="w-full px-4 py-2 text-left text-sm font-medium text-amber-600 hover:bg-amber-50 dark:hover:bg-amber-500/10 flex items-center gap-2.5 transition-colors"
                              >
                                <ShieldAlert className="w-4 h-4" /> Report
                              </button>
                            )}
                            {(isCreator || user?.isAdmin) && (
                              <>
                                {isCreator && (
                                  <button
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.currentTarget
                                        .closest(".group\\/menu")
                                        .querySelector(".absolute")
                                        .classList.remove(
                                          "opacity-100",
                                          "visible",
                                        );
                                      setEditPostData(post);
                                      setShowEditPostModal(true);
                                    }}
                                    className="w-full px-4 py-2 text-left text-sm font-medium text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 flex items-center gap-2.5 transition-colors"
                                  >
                                    <Edit2 className="w-4 h-4" /> Edit
                                  </button>
                                )}
                                <button
                                  onClick={() => handleDeletePost(post._id)}
                                  className="w-full px-4 py-2 text-left text-sm font-medium text-rose-600 hover:bg-rose-50 dark:hover:bg-rose-500/10 flex items-center gap-2.5 transition-colors"
                                >
                                  <Trash2 className="w-4 h-4" /> Delete
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Post image */}
                      <div
                        onClick={(e) => handlePostTap(e, post._id, post.likes)}
                        style={{ touchAction: "manipulation" }}
                        className="relative w-full bg-slate-100 select-none overflow-hidden cursor-pointer flex items-center justify-center"
                      >
                        {post.mediaType === "video" ? (
                          <video
                            src={post.mediaUrl || post.image}
                            controls
                            controlsList="nodownload"
                            playsInline
                            className="w-full h-[420px] max-h-[450px] object-cover object-center bg-black"
                          />
                        ) : (
                          <LazyImage
                            src={post.mediaUrl || post.image}
                            alt={post.location || post.caption || "Post image"}
                            className="w-full h-[420px] max-h-[450px] object-cover object-center hover:scale-[1.01] transition-all duration-500"
                          />
                        )}
                        {post.tags?.length > 0 && (
                          <div className="absolute top-3 left-3 flex flex-wrap gap-1 z-10 pointer-events-none">
                            {post.tags.slice(0, 3).map((tag, i) => (
                              <span
                                key={i}
                                className="bg-black/50 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full pointer-events-auto"
                              >
                                #{tag}
                              </span>
                            ))}
                          </div>
                        )}
                        {post.music && post.music.title && (
                          <div
                            className="absolute bottom-3 left-3 flex items-center gap-2 bg-white/85 dark:bg-slate-800/85 backdrop-blur-md rounded-full shadow-lg px-3 py-1.5 z-10"
                            onClick={(e) => e.stopPropagation()}
                          >
                            <Music2 className="h-3.5 w-3.5 text-[#6C4DF6] shrink-0" />
                            <div className="flex flex-col max-w-[120px] sm:max-w-[150px]">
                              <span className="truncate text-[11px] font-bold text-slate-800 dark:text-white leading-tight">
                                {post.music.title}
                              </span>
                              <span className="truncate text-[9px] text-slate-500 font-medium leading-tight">
                                {post.music.artist}
                              </span>
                            </div>
                            {post.music.preview && (
                              <button
                                onClick={(e) => {
                                  e.stopPropagation();
                                  toggleAudio(post._id);
                                }}
                                className="ml-1 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#6C4DF6] text-white shadow-md transition-all hover:scale-105 active:scale-95"
                              >
                                {playingAudioId === post._id ? (
                                  <Pause className="h-3 w-3 fill-current" />
                                ) : (
                                  <Play className="h-3 w-3 fill-current ml-0.5" />
                                )}
                              </button>
                            )}
                            {post.music.preview && (
                              <audio
                                ref={(el) => (audioRefs.current[post._id] = el)}
                                src={post.music.preview}
                                onEnded={() => setPlayingAudioId(null)}
                              />
                            )}
                          </div>
                        )}
                        <AnimatePresence>
                          {journeyLikeAnim?.postId === post._id && (
                            <motion.div
                              key={journeyLikeAnim.key}
                              className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50"
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              exit={{ opacity: 0, scale: 0.9 }}
                              transition={{ duration: 0.3, ease: "easeOut" }}
                            >
                              <span className="text-6xl drop-shadow-[0_0_15px_rgba(250,204,21,0.6)]">
                                ✨
                              </span>
                              <motion.div
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: 0.1 }}
                                className="mt-3 bg-black/50 backdrop-blur-xl border border-white/10 text-white text-[10px] font-black uppercase tracking-[0.2em] px-4 py-1.5 rounded-full shadow-[0_4px_12px_rgba(0,0,0,0.1)]"
                              >
                                Journey Felt
                              </motion.div>
                            </motion.div>
                          )}
                        </AnimatePresence>
                      </div>

                      {/* Post actions & comments */}
                      <div className="px-4 pt-3 pb-1">
                        <div className="flex items-center justify-between w-full bg-white/60 dark:bg-slate-800/60 backdrop-blur-xl px-4 py-2 rounded-[20px] border border-white/80 dark:border-slate-700 shadow-sm transition-colors duration-300">
                          <div className="flex items-center gap-6 shrink-0 overflow-hidden">
                            <button
                              onClick={() => handleLike(post._id)}
                              disabled={likeLoadingMap[post._id]}
                              aria-label={
                                hasLiked
                                  ? "Remove Felt This reaction"
                                  : "Felt This post"
                              }
                              className={`flex items-center gap-1.5 group transition-all duration-300 active:scale-90 hover:bg-black/5 py-1 rounded-xl whitespace-nowrap ${likeLoadingMap[post._id] ? "opacity-50 cursor-not-allowed" : ""}`}
                            >
                              <span
                                className={`text-[15px] transition-all duration-300 ${hasLiked ? "drop-shadow-[0_0_8px_rgba(250,204,21,0.7)] scale-110" : "opacity-75 group-hover:drop-shadow-[0_0_4px_rgba(250,204,21,0.4)] group-hover:scale-110 group-hover:opacity-100"} leading-none`}
                              >
                                ✨
                              </span>
                              <span
                                className={`text-[12px] font-bold transition-colors duration-300 ${hasLiked ? "bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent" : "text-slate-600 group-hover:text-amber-500"}`}
                              >
                                {likesCount > 0 ? `${likesCount}` : "0"}
                              </span>
                            </button>
                            <button
                              onClick={() => handleOpenComments(post._id)}
                              aria-label="Open Thoughts"
                              className="flex items-center gap-1.5 group transition-all duration-300 active:scale-90 hover:bg-black/5 py-1 rounded-xl whitespace-nowrap"
                            >
                              <span className="text-[15px] opacity-75 group-hover:opacity-100 transition-opacity leading-none">
                                💭
                              </span>
                              <span className="text-[12px] font-bold text-slate-600 group-hover:text-slate-800 transition-colors">
                                {totalCommentsCount > 0
                                  ? `${totalCommentsCount}`
                                  : "0"}
                              </span>
                            </button>
                            <button
                              onClick={() => handleShare(post._id)}
                              aria-label="Spread Vibes"
                              className="flex items-center gap-1.5 group transition-all duration-300 active:scale-90 hover:bg-black/5 py-1 rounded-xl whitespace-nowrap hidden sm:flex"
                            >
                              <span className="text-[15px] opacity-75 group-hover:opacity-100 transition-all group-hover:-rotate-12 leading-none">
                                🌍
                              </span>
                              <span className="text-[12px] font-bold text-slate-600 group-hover:text-blue-500 transition-colors">
                                Share
                              </span>
                            </button>
                          </div>
                          <button
                            onClick={() => handleSaveToggle(post._id)}
                            disabled={saveLoadingMap[post._id?.toString()]}
                            aria-label={
                              isSaved ? "Remove saved post" : "Save post"
                            }
                            className="group transition-all duration-200 active:scale-95 hover:scale-110 disabled:opacity-50 shrink-0 ml-2 p-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-700/50"
                          >
                            <Bookmark
                              className={`w-5 h-5 ${isSaved ? "text-[#6C4DF6] fill-[#6C4DF6]" : "text-slate-500 group-hover:text-[#6C4DF6]"} transition-colors`}
                            />
                          </button>
                        </div>

                        {/* Caption Section */}
                        <div className="pt-1">
                          <div className="text-base px-2 pb-1 leading-snug">
                            <span className="font-bold text-slate-900">
                              {post.userName}
                            </span>
                            <span className="ml-2 text-slate-800">
                              {post.caption || post.title}
                            </span>
                          </div>
                        </div>

                        {(activeCommentPost === post._id
                          ? visibleComments
                          : previewComments
                        ).length > 0 && (
                          <>
                            {/* Divider */}
                            <div className="mt-3 border-t border-slate-100" />

                            {/* Comments Section */}
                            <div className="mt-3 space-y-2 pl-1">
                              {(activeCommentPost === post._id
                                ? visibleComments
                                : previewComments
                              ).map((comment) => (
                                <div
                                  key={comment._id}
                                  className="text-[14px] group relative pr-6 leading-tight"
                                >
                                  <span className="font-semibold text-slate-800 mr-1.5">
                                    {comment.userName}
                                  </span>
                                  <span className="text-slate-600 break-words">
                                    {comment.text}
                                  </span>
                                  {((
                                    comment.userId?._id || comment.userId
                                  )?.toString() === myUserId ||
                                    isCreator) && (
                                    <button
                                      onClick={() =>
                                        handleDeleteComment(
                                          post._id,
                                          comment._id,
                                        )
                                      }
                                      className="opacity-0 group-hover:opacity-100 p-1 text-slate-400 hover:text-rose-500 transition-opacity absolute right-0 top-0 -mt-1"
                                    >
                                      <Trash2 className="w-3 h-3" />
                                    </button>
                                  )}
                                </div>
                              ))}
                            </div>
                          </>
                        )}
                        {commentsLoadingMap[post._id] && (
                          <div className="flex justify-center my-2">
                            <Loader2 className="w-4 h-4 text-[#6C4DF6] animate-spin" />
                          </div>
                        )}
                        {visibleCommentsCount > previewComments.length &&
                          activeCommentPost !== post._id &&
                          !commentsLoadingMap[post._id] && (
                            <button
                              onClick={() => handleOpenComments(post._id)}
                              className="text-sm font-semibold text-slate-400 hover:text-[#6C4DF6] mt-2 pl-1 block transition-colors"
                            >
                              View all {visibleCommentsCount} Thoughts
                            </button>
                          )}

                        {/* Comment input */}
                        <form
                          onSubmit={(e) => handleCommentSubmit(e, post._id)}
                          className="flex items-center gap-2.5 pt-3 mt-3 border-t border-[#94a3b81f]"
                        >
                          <img
                            loading="lazy"
                            src={getAvatarUrl(user, user?.name)}
                            alt="Your avatar"
                            className="w-7 h-7 rounded-full object-cover shrink-0"
                            onError={(e) => handleAvatarError(e, user?.name)}
                          />
                          <div className="flex-1 relative flex items-center">
                            <input
                              type="text"
                              value={commentText[post._id] || ""}
                              onChange={(e) =>
                                setCommentText((prev) => ({
                                  ...prev,
                                  [post._id]: e.target.value,
                                }))
                              }
                              placeholder="Share your thoughts..."
                              maxLength={500}
                              className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-700 rounded-full pl-4 pr-10 py-2 text-xs text-[#111827] dark:text-white placeholder:text-slate-400 outline-none focus:border-[#6C4DF6]/50 focus:bg-white dark:focus:bg-slate-800 focus:shadow-sm transition-all"
                            />
                            <button
                              type="submit"
                              disabled={
                                isSubmittingComment[post._id] ||
                                !commentText[post._id]?.trim()
                              }
                              aria-label="Post comment"
                              className="absolute right-1 p-1.5 bg-gradient-to-r from-violet-500 to-[#6C4DF6] text-white rounded-full active:scale-90 transition-all disabled:opacity-0 disabled:scale-75 disabled:pointer-events-none shadow-sm"
                            >
                              {isSubmittingComment[post._id] ? (
                                <Loader2 className="w-3 h-3 animate-spin" />
                              ) : (
                                <Send className="w-3 h-3 -ml-0.5 mt-0.5" />
                              )}
                            </button>
                          </div>
                        </form>
                      </div>
                    </motion.div>
                  );
                })}
                {hasMore && memories.length > 0 && (
                  <div
                    className="flex justify-center mt-6 pb-6"
                    ref={(el) => {
                      if (el) {
                        const observer = new IntersectionObserver(
                          (entries) => {
                            if (entries[0].isIntersecting && !loadingMore) {
                              loadMorePosts();
                            }
                          },
                          { rootMargin: "200px" },
                        );
                        observer.observe(el);
                      }
                    }}
                  >
                    {loadingMore && (
                      <Loader2 className="w-6 h-6 animate-spin text-[#6C4DF6]" />
                    )}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* ── Right sidebar ── */}
          <RightSidebar
            user={user}
            suggestions={suggestions}
            nearbyTrips={nearbyTrips}
            handleFollowToggle={handleFollowToggle}
            followLoadingMap={followLoadingMap}
          />
        </div>

        {/* 🎬 Story viewer 🎬 */}
        <AnimatePresence>
          {activeStoryGroup && (
            <StoryViewer
              activeStoryGroup={activeStoryGroup}
              activeStoryIndex={activeStoryIndex}
              myUserId={myUserId}
              storyReplyText={storyReplyText}
              setStoryReplyText={setStoryReplyText}
              replyingToStory={replyingToStory}
              isStoryMuted={isStoryMuted}
              setIsStoryMuted={setIsStoryMuted}
              handleStoryReaction={handleStoryReaction}
              handleStoryReply={handleStoryReply}
              handleDeleteStory={handleDeleteStory}
              setShowViewersList={setShowViewersList}
              isStoryPaused={isStoryPaused}
              setIsStoryPaused={setIsStoryPaused}
              closeStoryViewer={() => setActiveStoryGroup(null)}
              nextStory={nextStory}
              prevStory={prevStory}
              stories={stories}
              fetchFeedData={fetchFeedData}
            />
          )}
        </AnimatePresence>

        {/* ── Viewers bottom sheet ── */}
        <AnimatePresence>
          {showViewersList &&
            activeStoryGroup &&
            activeStoryGroup.userId?.toString() === myUserId && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 z-[100000] bg-black/40"
                  onClick={() => {
                    setShowViewersList(false);
                    setIsStoryPaused(false);
                  }}
                />
                <motion.div
                  initial={{ y: "100%" }}
                  animate={{ y: 0 }}
                  exit={{ y: "100%" }}
                  transition={{ type: "spring", damping: 25, stiffness: 200 }}
                  className="fixed bottom-0 inset-x-0 sm:max-w-[400px] sm:mx-auto h-auto max-h-[60vh] min-h-[220px] bg-white/95 dark:bg-slate-800/95 backdrop-blur-xl rounded-t-[32px] z-[100001] shadow-[0_-10px_40px_rgba(0,0,0,0.15)] flex flex-col overflow-hidden border-t border-white/20 dark:border-white/5"
                >
                  {/* Handle bar */}
                  <div className="w-full flex justify-center pt-3 pb-1 shrink-0">
                    <div className="w-12 h-1.5 bg-slate-300/50 dark:bg-slate-600/50 rounded-full" />
                  </div>

                  <div className="px-5 pb-3 pt-1 border-b border-slate-200/30 dark:border-slate-700/30 flex items-center justify-between shrink-0">
                    <h3 className="font-black text-slate-800 dark:text-white text-lg flex items-center gap-2">
                      <span className="text-xl">👁</span> Viewers
                      <span className="text-xs bg-slate-100/80 dark:bg-slate-700/80 text-slate-500 dark:text-slate-300 px-2 py-0.5 rounded-full font-bold">
                        {activeStoryGroup.stories[activeStoryIndex]?.viewers
                          ?.length ?? 0}
                      </span>
                    </h3>
                    <button
                      onClick={() => {
                        setShowViewersList(false);
                        setIsStoryPaused(false);
                      }}
                      aria-label="Close viewers"
                      className="p-2 bg-slate-100/80 hover:bg-slate-200/80 dark:bg-slate-700/80 dark:hover:bg-slate-600/80 rounded-full text-slate-500 dark:text-slate-300 transition-colors"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>

                  <div className="flex-1 overflow-y-auto p-2 scrollbar-none">
                    {!activeStoryGroup.stories[activeStoryIndex]?.viewers
                      ?.length ? (
                      <div className="flex flex-col items-center justify-center h-full min-h-[140px] text-slate-500 dark:text-slate-400">
                        <div className="w-12 h-12 rounded-full bg-slate-100/50 dark:bg-slate-800/50 flex items-center justify-center mb-3">
                          <svg
                            className="w-5 h-5 text-slate-400"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                            />
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                            />
                          </svg>
                        </div>
                        <p className="font-bold text-[15px] text-slate-700 dark:text-slate-300">
                          No viewers yet
                        </p>
                        <p className="text-xs text-center mt-1 px-4 opacity-80 leading-relaxed">
                          When someone views your story,
                          <br />
                          they'll appear here.
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-1 p-2">
                        {activeStoryGroup.stories[activeStoryIndex].viewers.map(
                          (v) => {
                            const reaction = activeStoryGroup.stories[
                              activeStoryIndex
                            ].storyReactions?.find(
                              (r) =>
                                r.userId?._id === v.userId?._id ||
                                r.userId === v.userId?._id,
                            );
                            return (
                              <div
                                key={v._id || v.userId?._id}
                                className="flex items-center justify-between p-2.5 hover:bg-slate-100/50 dark:hover:bg-slate-700/50 rounded-2xl transition-colors group"
                              >
                                <div className="flex items-center gap-3">
                                  <img
                                    loading="lazy"
                                    src={getAvatarUrl(
                                      v.userId?.pic,
                                      v.userId?.img,
                                      v.userId?.name,
                                    )}
                                    alt={v.userId?.name}
                                    className="w-11 h-11 rounded-full object-cover border border-slate-200/50 dark:border-slate-700/50 shadow-sm"
                                    onError={(e) =>
                                      handleAvatarError(e, v.userId?.name)
                                    }
                                  />
                                  <div>
                                    <p className="text-[14px] font-bold text-slate-800 dark:text-white group-hover:text-[#6C4DF6] transition-colors">
                                      {v.userId?.name}
                                    </p>
                                    <p className="text-[11px] text-slate-500 dark:text-slate-400 font-medium mt-0.5">
                                      Viewed {moment(v.viewedAt).fromNow()}
                                    </p>
                                  </div>
                                </div>
                                {reaction && (
                                  <div className="text-2xl animate-bounce drop-shadow-sm">
                                    {reaction.emoji}
                                  </div>
                                )}
                              </div>
                            );
                          },
                        )}
                      </div>
                    )}
                  </div>
                </motion.div>
              </>
            )}
        </AnimatePresence>

        {/* Edit Post Modal */}
        <AnimatePresence>
          {showEditPostModal && editPostData && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
            >
              <motion.div
                initial={{ scale: 0.95, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.95, y: 20 }}
                className="bg-white dark:bg-slate-800 rounded-[24px] w-full max-w-md shadow-2xl overflow-hidden"
              >
                <div className="flex items-center justify-between p-5 border-b border-slate-100 dark:border-slate-700">
                  <h3 className="text-lg font-black text-slate-900 dark:text-white">
                    Edit Post
                  </h3>
                  <button
                    onClick={() => {
                      setShowEditPostModal(false);
                      setEditPostData(null);
                    }}
                    className="p-2 text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-full transition-colors"
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
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-[#6C4DF6] focus:ring-4 focus:ring-[#6C4DF6]/10 transition-all resize-none"
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
                      className="w-full bg-slate-50 dark:bg-slate-900/50 border border-slate-200 dark:border-slate-700 rounded-2xl p-4 text-sm text-slate-700 dark:text-slate-300 outline-none focus:border-[#6C4DF6] focus:ring-4 focus:ring-[#6C4DF6]/10 transition-all"
                    />
                  </div>
                  <div className="pt-2 flex items-center justify-end gap-3">
                    <button
                      type="button"
                      onClick={() => {
                        setShowEditPostModal(false);
                        setEditPostData(null);
                      }}
                      className="px-5 py-2.5 text-sm font-bold text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-xl transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="px-6 py-2.5 bg-[#111827] dark:bg-[#6C4DF6] text-white text-sm font-bold rounded-xl hover:bg-black dark:hover:bg-[#5b3ce0] transition-colors shadow-md hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
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
