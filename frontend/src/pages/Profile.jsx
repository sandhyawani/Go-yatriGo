import React, { useState, useEffect, useContext, useRef, useMemo, useCallback } from "react";
import { useNavigate, useParams, useLocation } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import { SocketContext } from "../context/SocketContext";
import { SOCKET_EVENTS } from "../constants/socketEvents";
import { Compass, ShieldCheck, Ban } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../api/axios";
import { showToast } from "../utils/showToast";
import AudioManager from "../utils/AudioManager";
import {
  resolveRelationship,
  resolveReviewEligibility,
} from "../utils/relationshipResolver";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileTabs from "../components/profile/ProfileTabs";
import RelationsModal from "../components/profile/RelationsModal";
import TripMatesModal from "../components/profile/TripMatesModal";
import FollowersModal from "../components/profile/FollowersModal";
import FollowingModal from "../components/profile/FollowingModal";
import ActionModals from "../components/profile/ActionModals";
import MemoryDetailModal from "../components/profile/MemoryDetailModal";
import PostsTab from "../components/profile/Grids/PostsTab";
import TripsTab from "../components/profile/Grids/TripsTab";
import StoriesTab from "../components/profile/Grids/StoriesTab";
import SavedTab from "../components/profile/Grids/SavedTab";
import FeltTab from "../components/profile/Grids/FeltTab";
import JourneyStatistics from "../components/journey/JourneyStatistics";
import CreateTravelMemoryModal from "../components/modals/CreateTravelMemoryModal";
import CreateDispatchModal from "../components/modals/CreateDispatchModal";
import DispatchViewer from "../components/story/DispatchViewer";
import ReportModal from "../components/modals/ReportModal";

const isCanceledRequest = (err) => {
  if (!err) return false;
  return (
    err.name === "CanceledError" ||
    err.name === "AbortError" ||
    err.code === "ERR_CANCELED" ||
    (typeof axios?.isCancel === "function" && axios.isCancel(err))
  );
};

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser, dispatch } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();
  const location = useLocation();

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratingVal, setRatingVal] = useState(5);
  const [reportReason, setReportReason] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);
  const [tripMateStates, setTripMateStates] = useState({});

  const currentUserId = currentUser?._id || currentUser?.id;
  const myUserId = currentUserId?.toString();
  const targetId = id || currentUserId;
  const profileUserId = profileUser?._id || profileUser?.id || targetId;

  const isOwnProfile = Boolean(
    currentUserId &&
    profileUserId &&
    String(currentUserId) === String(profileUserId)
  );

  const profileRelationship = useMemo(() => {
    if (!currentUser || !profileUser) return null;

    return resolveRelationship(
      currentUser,
      profileUser,
      tripMateStates?.[String(profileUserId)]
    );
  }, [currentUser, profileUser, tripMateStates, profileUserId]);

  const getInitialTab = () => {
    if (
      location.pathname === "/saved" ||
      new URLSearchParams(location.search).get("tab") === "saved"
    ) {
      return "saved";
    }

    return isOwnProfile ? "posts" : "trips";
  };

  const [activeTab, setActiveTab] = useState(getInitialTab);

  useEffect(() => {
    const params = new URLSearchParams(location.search);

    if (
      location.pathname === "/saved" ||
      params.get("tab") === "saved"
    ) {
      setActiveTab("saved");
    } else if (params.get("postId")) {
      setActiveTab("posts");
    } else {
      setActiveTab(isOwnProfile ? "posts" : "trips");
    }
  }, [isOwnProfile, location.pathname, location.search]);
  const [userMemories, setUserMemories] = useState([]);
  const [userMemoriesTotal, setUserMemoriesTotal] = useState(0);
  const [userTrips, setUserTrips] = useState([]);
  const [joinedTrips, setJoinedTrips] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [reviewCandidateJourneys, setReviewCandidateJourneys] = useState([]);
  const [journeyStats, setJourneyStats] = useState(null);
  const [savedPosts, setSavedPosts] = useState([]);
  const [feltPosts, setFeltPosts] = useState([]);
  const [groupFilter, setGroupFilter] = useState("hosted");
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsError, setPostsError] = useState("");
  const [tripsLoading, setTripsLoading] = useState(false);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);
  const [feltLoading, setFeltLoading] = useState(false);
  const [postsPage, setPostsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [fetchedTabs, setFetchedTabs] = useState({});
  const [savedPostIds, setSavedPostIds] = useState(new Set());
  const [saveLoadingMap, setSaveLoadingMap] = useState({});
  const [feltLoadingMap, setFeltLoadingMap] = useState({});
  const [commentsLoadingMap, setCommentsLoadingMap] = useState({});
  const [isSubmittingComment, setIsSubmittingComment] = useState({});
  const [commentText, setCommentText] = useState({});
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [journeyLikeAnim, setJourneyLikeAnim] = useState(null);
  const [playingAudioId, setPlayingAudioId] = useState(null);
  const [reportModal, setReportModal] = useState({
    isOpen: false,
    targetId: null,
    targetType: "post",
    reportedUserId: null,
  });
  const audioRefs = useRef({});
  const lastTapTime = useRef({});
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [editPostData, setEditPostData] = useState(null);
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [showEditStoryModal, setShowEditStoryModal] = useState(false);
  const [editStoryData, setEditStoryData] = useState(null);
  const [showDeleteStoryModal, setShowDeleteStoryModal] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showCreatePostModal, setShowCreatePostModal] = useState(false);
  const [showCreateStoryModal, setShowCreateStoryModal] = useState(false);
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [isStoryMuted, setIsStoryMuted] = useState(true);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [showViewersList, setShowViewersList] = useState(false);

  const handleOpenStory = (index) => {
    if (!userStories || userStories.length === 0) return;

    setActiveStoryGroup({
      userId: profileUser._id,
      userName: profileUser.name,
      userPic: profileUser.pic,
      stories: userStories,
    });

    setActiveStoryIndex(index);
  };

  const nextStory = () => {
    if (activeStoryIndex < userStories.length - 1) {
      setActiveStoryIndex((prev) => prev + 1);
    } else {
      setActiveStoryGroup(null);
    }
  };

  const prevStory = () => {
    if (activeStoryIndex > 0) {
      setActiveStoryIndex((prev) => prev - 1);
    } else {
      setActiveStoryGroup(null);
    }
  };
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const audioRef = useRef(null);
  const relationsRequestRef = useRef(0);
  const tabFetchRequestRef = useRef(0);
  const abortControllerRef = useRef(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleAvatarError = useCallback((e, name) => {
    e.target.onerror = null;
    e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(
      name || "Explorer"
    )}&background=7C3AED&color=fff&bold=true`;
  }, []);

  const toggleAudio = useCallback(
    (postId) => {
      if (AudioManager.isLocked()) return;
      const audio = audioRefs.current[postId];
      if (!audio) return;

      if (playingAudioId === postId) {
        AudioManager.pause(postId);
        setPlayingAudioId(null);
      } else {
        AudioManager.play(postId, audio, { source: "profile" });
        setPlayingAudioId(postId);
      }
    },
    [playingAudioId]
  );

  const handleFelt = useCallback(
    async (postId) => {
      const cleanPostId = (postId?._id || postId?.id || postId)?.toString();
      if (!cleanPostId) return;
      if (feltLoadingMap[cleanPostId] || lastTapTime.current[`like_${cleanPostId}`]) return;
      lastTapTime.current[`like_${cleanPostId}`] = true;

      setFeltLoadingMap((prev) => ({ ...prev, [cleanPostId]: true }));

      let prevUserMemoriesSnapshot = [];
      let prevSelectedMemorySnapshot = null;
      let prevFeltPostsSnapshot = [];
      let prevSavedPostsSnapshot = [];

      const toggleLikesForPost = (postItem) => {
        if (!postItem) return postItem;
        const mId = (postItem._id || postItem.id)?.toString();
        if (mId === cleanPostId) {
          const hasFelt = postItem.likes?.some(
            (id) => (id?._id || id)?.toString() === myUserId?.toString()
          );
          const newLikes = hasFelt
            ? (postItem.likes || []).filter(
                (id) => (id?._id || id)?.toString() !== myUserId?.toString()
              )
            : [...(postItem.likes || []), myUserId];
          return { ...postItem, likes: newLikes, likesCount: newLikes.length };
        }
        return postItem;
      };

      setUserMemories((prev) => {
        prevUserMemoriesSnapshot = prev;
        return prev.map(toggleLikesForPost);
      });

      setSelectedMemory((prev) => {
        prevSelectedMemorySnapshot = prev;
        const selId = (prev?._id || prev?.id)?.toString();
        if (selId === cleanPostId) {
          return toggleLikesForPost(prev);
        }
        return prev;
      });

      setFeltPosts((prev) => {
        prevFeltPostsSnapshot = prev;
        return prev.map(toggleLikesForPost);
      });

      setSavedPosts((prev) => {
        prevSavedPostsSnapshot = prev;
        return prev.map(toggleLikesForPost);
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
            const applyServerLikes = (postItem) => {
              if (!postItem) return postItem;
              const mId = (postItem._id || postItem.id)?.toString();
              if (mId === cleanPostId) {
                return {
                  ...postItem,
                  likes: updatedLikes,
                  likesCount: updatedLikes.length,
                };
              }
              return postItem;
            };

            setUserMemories((prev) => prev.map(applyServerLikes));
            setSelectedMemory((prev) => {
              const selId = (prev?._id || prev?.id)?.toString();
              return selId === cleanPostId ? applyServerLikes(prev) : prev;
            });
            setFeltPosts((prev) => prev.map(applyServerLikes));
            setSavedPosts((prev) => prev.map(applyServerLikes));
          }
        }
      } catch (err) {
        setUserMemories(prevUserMemoriesSnapshot);
        setSelectedMemory(prevSelectedMemorySnapshot);
        setFeltPosts(prevFeltPostsSnapshot);
        setSavedPosts(prevSavedPostsSnapshot);
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
      const cleanPostId = (postId?._id || postId?.id || postId)?.toString();
      const hasFelt = likes?.some(
        (id) => (id?._id || id)?.toString() === myUserId?.toString()
      );
      if (!hasFelt && cleanPostId) handleFelt(cleanPostId);

      setJourneyLikeAnim({
        postId: cleanPostId,
        x: tapPoint?.x ?? 50,
        y: tapPoint?.y ?? 50,
        key: Date.now(),
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
          x: ((e.clientX - rect.left) / rect.width) * 100,
          y: ((e.clientY - rect.top) / rect.height) * 100,
        };
        handleDoubleTapLike(postId, likes, tapPoint);
        lastTapTime.current[postId] = 0;
      } else {
        lastTapTime.current[postId] = now;
      }
    },
    [handleDoubleTapLike]
  );

  const handleOpenComments = useCallback(
    async (postId) => {
      if (!postId) return;

      if (activeCommentPost === postId) {
        setActiveCommentPost(null);
        return;
      }

      setActiveCommentPost(postId);

      const post =
        userMemories.find((m) => (m._id || m.id) === postId) ||
        ((selectedMemory?._id || selectedMemory?.id) === postId
          ? selectedMemory
          : null);

      if (!post) return;

      // Check if comments are already populated objects with text
      const hasPopulatedComments =
        Array.isArray(post.comments) &&
        post.comments.length > 0 &&
        post.comments.every(
          (c) =>
            typeof c === "object" &&
            c !== null &&
            typeof c.text === "string"
        );

      if (hasPopulatedComments) {
        return;
      }

      // If commentsCount is explicitly 0 and comments array is empty, no need to fetch
      if (
        post.commentsCount === 0 &&
        (!Array.isArray(post.comments) || post.comments.length === 0)
      ) {
        return;
      }

      setCommentsLoadingMap((prev) => ({ ...prev, [postId]: true }));
      try {
        const res = await axios.get(`/social/memory/${postId}/comments`, {
          withCredentials: true,
        });

        if (res.data?.success && Array.isArray(res.data.comments)) {
          const fetchedComments = res.data.comments;

          setUserMemories((prev) =>
            prev.map((m) =>
              (m._id || m.id) === postId
                ? {
                    ...m,
                    comments: fetchedComments,
                    commentsCount: fetchedComments.length,
                  }
                : m
            )
          );

          if (
            selectedMemory &&
            (selectedMemory._id || selectedMemory.id) === postId
          ) {
            setSelectedMemory((prev) =>
              prev
                ? {
                    ...prev,
                    comments: fetchedComments,
                    commentsCount: fetchedComments.length,
                  }
                : prev
            );
          }
        }
      } catch (err) {
        showToast.error("Failed to load comments");
      } finally {
        setCommentsLoadingMap((prev) => ({ ...prev, [postId]: false }));
      }
    },
    [activeCommentPost, userMemories, selectedMemory]
  );

  const handleCommentSubmit = useCallback(
    async (e, postId) => {
      e.preventDefault();
      if (!postId || isSubmittingComment[postId]) return;
      const text = commentText[postId];
      if (!text?.trim()) return;

      setIsSubmittingComment((prev) => ({ ...prev, [postId]: true }));
      try {
        const res = await axios.post(
          `/social/memory/comment/${postId}`,
          { text: text.trim() },
          { withCredentials: true }
        );

        if (res.data?.success) {
          setCommentText((prev) => ({ ...prev, [postId]: "" }));
          setActiveCommentPost(postId);

          const newComment = res.data.comment;

          setUserMemories((prev) =>
            prev.map((m) => {
              if ((m._id || m.id) !== postId) return m;

              if (res.data.memory?.comments) {
                return {
                  ...m,
                  comments: res.data.memory.comments,
                  commentsCount: res.data.memory.comments.length,
                };
              }

              if (newComment) {
                const currentComments = Array.isArray(m.comments)
                  ? m.comments.filter(
                      (c) =>
                        typeof c === "object" &&
                        c !== null &&
                        typeof c.text === "string"
                    )
                  : [];

                const alreadyExists = currentComments.some(
                  (c) => (c._id || c.id) === (newComment._id || newComment.id)
                );

                const updated = alreadyExists
                  ? currentComments
                  : [...currentComments, newComment];

                return {
                  ...m,
                  comments: updated,
                  commentsCount: updated.length,
                };
              }

              return m;
            })
          );

          if (
            selectedMemory &&
            (selectedMemory._id || selectedMemory.id) === postId
          ) {
            setSelectedMemory((prev) => {
              if (!prev) return prev;

              if (res.data.memory?.comments) {
                return {
                  ...prev,
                  comments: res.data.memory.comments,
                  commentsCount: res.data.memory.comments.length,
                };
              }

              if (newComment) {
                const currentComments = Array.isArray(prev.comments)
                  ? prev.comments.filter(
                      (c) =>
                        typeof c === "object" &&
                        c !== null &&
                        typeof c.text === "string"
                    )
                  : [];

                const alreadyExists = currentComments.some(
                  (c) => (c._id || c.id) === (newComment._id || newComment.id)
                );

                const updated = alreadyExists
                  ? currentComments
                  : [...currentComments, newComment];

                return {
                  ...prev,
                  comments: updated,
                  commentsCount: updated.length,
                };
              }

              return prev;
            });
          }
        }
      } catch {
        showToast.error("Failed to post comment");
      } finally {
        setIsSubmittingComment((prev) => ({ ...prev, [postId]: false }));
      }
    },
    [commentText, isSubmittingComment, selectedMemory]
  );

  const handleDeleteComment = useCallback(
    async (postId, commentId) => {
      try {
        const res = await axios.delete(
          `/social/memory/${postId}/comment/${commentId}`,
          { withCredentials: true }
        );

        if (res.data?.success) {
          showToast.success("Comment deleted");

          setUserMemories((prev) =>
            prev.map((m) => {
              if ((m._id || m.id) !== postId) return m;

              const currentComments = Array.isArray(m.comments)
                ? m.comments.filter(
                    (c) =>
                      typeof c === "object" &&
                      c !== null &&
                      (c._id || c.id) !== commentId
                  )
                : [];

              return {
                ...m,
                comments: currentComments,
                commentsCount: currentComments.length,
              };
            })
          );

          if (
            selectedMemory &&
            (selectedMemory._id || selectedMemory.id) === postId
          ) {
            setSelectedMemory((prev) => {
              if (!prev) return prev;

              const currentComments = Array.isArray(prev.comments)
                ? prev.comments.filter(
                    (c) =>
                      typeof c === "object" &&
                      c !== null &&
                      (c._id || c.id) !== commentId
                  )
                : [];

              return {
                ...prev,
                comments: currentComments,
                commentsCount: currentComments.length,
              };
            });
          }
        }
      } catch {
        showToast.error("Failed to delete comment");
      }
    },
    [selectedMemory]
  );

  const handleSaveToggle = useCallback(
    async (postId) => {
      const postIdStr = postId?.toString();
      if (!postIdStr || saveLoadingMap[postIdStr]) return;

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
        await navigator.share({
          title: "Check out this travel memory!",
          url,
        });
        showToast.success("Link shared!");
      } else {
        await navigator.clipboard.writeText(url);
        showToast.success("Link copied to clipboard!");
      }
    } catch (err) {
      if (err.name !== "AbortError") {
        console.error("Failed to share:", err);
      }
    }
  }, []);
  const [showRelationsModal, setShowRelationsModal] = useState(false);
  const [relationsModalType, setRelationsModalType] = useState("followers");
  const [relationsSearch, setRelationsSearch] = useState("");
  const [relationsList, setRelationsList] = useState([]);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [relationsError, setRelationsError] = useState(null);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [loadingRelationId, setLoadingRelationId] = useState(null);

  useEffect(() => {
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [id, currentUser?._id]);

  const fetchProfile = async () => {
    const effectiveId = id || currentUser?._id || currentUser?.id;
    if (!effectiveId) return;

    // Abort previous in-flight profile and tab requests when switching profile
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
    abortControllerRef.current = new AbortController();
    const currentSignal = abortControllerRef.current.signal;

    const currentRequestId = Date.now();
    tabFetchRequestRef.current = currentRequestId;

    const isOwn = Boolean(
      currentUser &&
      (currentUser._id || currentUser.id) &&
      String(currentUser._id || currentUser.id) === String(effectiveId)
    );

    // Reset tab data immediately to avoid stale data flashes
    setFetchedTabs({});
    setUserMemories([]);
    setUserMemoriesTotal(0);
    setPostsPage(1);
    setHasMorePosts(true);
    setPostsError("");
    setUserTrips([]);
    setJoinedTrips([]);
    setUserStories([]);
    setSavedPosts([]);
    setFeltPosts([]);

    setLoading(true);

    // Determine target initial tab
    const initialTab =
      location.pathname === "/saved" ||
        new URLSearchParams(location.search).get("tab") === "saved"
        ? "saved"
        : isOwn
          ? "posts"
          : "trips";

    // Fetch tab data in parallel with profile fetch
    fetchTabData(initialTab, effectiveId, true, currentSignal, currentRequestId);

    try {
      const res = await axios.get(`/users/${effectiveId}`, {
        withCredentials: true,
        signal: currentSignal,
      });

      if (tabFetchRequestRef.current !== currentRequestId) return;

      const userData = res.data.user || res.data;
      if (isOwn) userData.canViewContent = true;
      setProfileUser(userData);

      if (currentUser?._id) {
        if (isOwn) {
          setCurrentUserData(userData);
          dispatch({
            type: "LOGIN_SUCCESS",
            payload: {
              ...currentUser,
              followRequests: userData.followRequests,
              followers: userData.followers,
              following: userData.following,
            },
          });
        } else {
          // Asynchronously fetch self relations without blocking main flow
          axios
            .get(`/users/${currentUser._id}`, {
              withCredentials: true,
              signal: currentSignal,
            })
            .then((selfRes) => {
              if (tabFetchRequestRef.current === currentRequestId) {
                const selfData = selfRes.data.user || selfRes.data;
                setCurrentUserData(selfData);
                dispatch({
                  type: "LOGIN_SUCCESS",
                  payload: {
                    ...currentUser,
                    followRequests: selfData.followRequests,
                    followers: selfData.followers,
                    following: selfData.following,
                  },
                });
              }
            })
            .catch((selfErr) => {
              if (!isCanceledRequest(selfErr)) {
                console.warn("Failed to load own relations", selfErr);
              }
            });
        }
      }

      if (!isOwn) {
        // Asynchronously fetch review candidate journeys without blocking main flow
        axios
          .get(`/social/buddy?userId=${effectiveId}&limit=50`, {
            withCredentials: true,
            signal: currentSignal,
          })
          .then((tripRes) => {
            if (
              tripRes.data?.success &&
              tabFetchRequestRef.current === currentRequestId
            ) {
              setReviewCandidateJourneys(tripRes.data.trips || []);
            }
          })
          .catch((tripErr) => {
            if (!isCanceledRequest(tripErr)) {
              console.warn("Failed to load candidate trips:", tripErr);
            }
          });
      }
    } catch (err) {
      if (isCanceledRequest(err)) {
        return;
      }

      console.error("fetchProfile error:", err);
      showToast.error(
        err.response?.data?.message || "Failed to load user profile"
      );
      navigate("/social/buddy");
    } finally {
      if (tabFetchRequestRef.current === currentRequestId) {
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    const targetId = id || currentUser?._id || currentUser?.id;

    if (targetId && profileUser && !fetchedTabs[activeTab]) {
      fetchTabData(activeTab, targetId, false);
    }
  }, [activeTab]);

  // Deep Link Handling
  useEffect(() => {
    const handleDeepLink = async () => {
      if (location.state?.selectedMemory) {
        setSelectedMemory(location.state.selectedMemory);
        setActiveTab("posts");

        navigate(location.pathname, { replace: true });
        return;
      }

      const params = new URLSearchParams(location.search);
      const postId = params.get("postId");

      if (postId) {
        setActiveTab("posts");

        const matched =
          userMemories.find((m) => m._id === postId) ||
          savedPosts.find((m) => m._id === postId) ||
          feltPosts.find((m) => m._id === postId);

        if (matched) {
          setSelectedMemory(matched);
          navigate(location.pathname, { replace: true });
        } else {
          try {
            const res = await axios.get(`/social/memory/${postId}`, {
              withCredentials: true,
            });

            if (res.data?.success && res.data.memory) {
              setSelectedMemory(res.data.memory);
            }
          } catch (err) {
            console.error(
              "Error fetching single memory for deep link:",
              err
            );
          } finally {
            navigate(location.pathname, { replace: true });
          }
        }
      }
    };

    handleDeepLink();
  }, [
    location.state,
    location.search,
    userMemories,
    savedPosts,
    feltPosts,
    navigate,
  ]);

  const fetchProfileSilent = async () => {
    const effectiveId = id || currentUser?._id || currentUser?.id;
    if (!effectiveId) return;

    const isOwn = Boolean(
      currentUser &&
      (currentUser._id || currentUser.id) &&
      String(currentUser._id || currentUser.id) === String(effectiveId)
    );

    try {
      const res = await axios.get(`/users/${effectiveId}`, {
        withCredentials: true,
      });

      const userData = res.data.user || res.data;

      if (isOwn) userData.canViewContent = true;

      setProfileUser(userData);

      if (currentUser?._id) {
        if (isOwn) {
          setCurrentUserData(userData);

          dispatch({
            type: "LOGIN_SUCCESS",
            payload: {
              ...currentUser,
              followRequests: userData.followRequests,
              followers: userData.followers,
              following: userData.following,
            },
          });
        } else {
          try {
            const selfRes = await axios.get(`/users/${currentUser._id}`, {
              withCredentials: true,
            });

            const selfData = selfRes.data.user || selfRes.data;

            setCurrentUserData(selfData);

            dispatch({
              type: "LOGIN_SUCCESS",
              payload: {
                ...currentUser,
                followRequests: selfData.followRequests,
                followers: selfData.followers,
                following: selfData.following,
              },
            });
          } catch (selfErr) {
            console.warn("Failed to load own relations", selfErr);
          }
        }
      }
    } catch (err) {
      console.warn("fetchProfileSilent error:", err);
    }
  };

  useEffect(() => {
    if (socket) {
      const handleSocketUpdate = () => {
        fetchProfileSilent();
      };

      socket.on(SOCKET_EVENTS.FOLLOWERS_UPDATED, handleSocketUpdate);
      socket.on(SOCKET_EVENTS.FOLLOWING_UPDATED, handleSocketUpdate);
      socket.on(SOCKET_EVENTS.FOLLOW_REQUEST_RECEIVED, handleSocketUpdate);
      socket.on(SOCKET_EVENTS.FOLLOW_REQUEST_ACCEPTED, handleSocketUpdate);
      socket.on(SOCKET_EVENTS.FOLLOW_REQUEST_REJECTED, handleSocketUpdate);
      socket.on(SOCKET_EVENTS.USER_BLOCKED, handleSocketUpdate);
      socket.on(SOCKET_EVENTS.USER_UNBLOCKED, handleSocketUpdate);

      return () => {
        socket.off(SOCKET_EVENTS.FOLLOWERS_UPDATED, handleSocketUpdate);
        socket.off(SOCKET_EVENTS.FOLLOWING_UPDATED, handleSocketUpdate);
        socket.off(
          SOCKET_EVENTS.FOLLOW_REQUEST_RECEIVED,
          handleSocketUpdate
        );
        socket.off(
          SOCKET_EVENTS.FOLLOW_REQUEST_ACCEPTED,
          handleSocketUpdate
        );
        socket.off(
          SOCKET_EVENTS.FOLLOW_REQUEST_REJECTED,
          handleSocketUpdate
        );
        socket.off(SOCKET_EVENTS.USER_BLOCKED, handleSocketUpdate);
        socket.off(SOCKET_EVENTS.USER_UNBLOCKED, handleSocketUpdate);
      };
    }
  }, [socket, id, currentUser]);

  const fetchTabData = async (
    tab,
    targetId,
    force = false,
    customSignal = null,
    requestId = null
  ) => {
    if (!force && fetchedTabs[tab]) return;

    const currentRequestId = requestId || Date.now();
    if (!requestId) {
      tabFetchRequestRef.current = currentRequestId;
    }

    const signal =
      customSignal ||
      (abortControllerRef.current ? abortControllerRef.current.signal : undefined);

    try {
      if (tab === "posts") {
        setPostsLoading(true);
        setPostsError("");

        const memRes = await axios.get(
          `/social/memory?userId=${targetId}&limit=12&page=1`,
          {
            withCredentials: true,
            signal,
          }
        );

        if (tabFetchRequestRef.current !== currentRequestId) return;

        if (memRes.data?.success) {
          const memories = Array.isArray(memRes.data.memories)
            ? memRes.data.memories
            : [];
          setUserMemories(memories);
          setUserMemoriesTotal(
            typeof memRes.data.totalMemories === "number"
              ? memRes.data.totalMemories
              : (memRes.data.pagination?.total ?? memories.length)
          );
          setHasMorePosts(
            typeof memRes.data.hasMore === "boolean"
              ? memRes.data.hasMore
              : (memRes.data.pagination?.hasMore ?? memories.length === 12)
          );
          setPostsPage(1);
          setFetchedTabs((prev) => ({ ...prev, posts: true }));
        } else {
          setPostsError(
            memRes.data?.message || "Failed to load travel memories."
          );
        }

        // Fetch journey stats in background without blocking memory render
        axios
          .get(`/journeys/stats/user/${targetId}`, {
            withCredentials: true,
            signal,
          })
          .then((statsRes) => {
            if (
              statsRes.data?.success &&
              statsRes.data.stats &&
              tabFetchRequestRef.current === currentRequestId
            ) {
              setJourneyStats(statsRes.data.stats);
            }
          })
          .catch((statsErr) => {
            if (!isCanceledRequest(statsErr)) {
              console.error("Failed to fetch journey stats", statsErr);
            }
          });
      } else if (tab === "trips") {
        setTripsLoading(true);

        const tripRes = await axios.get(
          `/social/buddy?userId=${targetId}&limit=50`,
          { withCredentials: true, signal }
        );

        if (tabFetchRequestRef.current !== currentRequestId) return;

        if (tripRes.data?.success) {
          const trips = tripRes.data.trips || [];

          setUserTrips(
            trips.filter(
              (t) =>
                t.userId?._id === targetId ||
                t.userId === targetId ||
                t.host?._id === targetId ||
                t.host === targetId
            )
          );

          setJoinedTrips(
            trips.filter((t) =>
              t.companions?.some(
                (c) =>
                  (c.userId?._id ||
                    c.userId ||
                    c._id ||
                    c) === targetId
              )
            )
          );
          setFetchedTabs((prev) => ({ ...prev, trips: true }));
        }
      } else if (tab === "stories" && isOwnProfile) {
        setStoriesLoading(true);

        const storiesRes = await axios.get("/social/story", {
          withCredentials: true,
          signal,
        });

        if (tabFetchRequestRef.current !== currentRequestId) return;

        if (storiesRes.data?.success) {
          const myStoriesGroup = (storiesRes.data.stories || []).find(
            (g) => g.userId === targetId
          );

          setUserStories(
            myStoriesGroup ? myStoriesGroup.stories : []
          );
          setFetchedTabs((prev) => ({ ...prev, stories: true }));
        }
      } else if (tab === "saved" && isOwnProfile) {
        setSavedLoading(true);

        const savedRes = await axios.get("/social/memory/save", {
          withCredentials: true,
          signal,
        });

        if (tabFetchRequestRef.current !== currentRequestId) return;

        if (savedRes.data?.success) {
          setSavedPosts(savedRes.data.posts || []);
          setFetchedTabs((prev) => ({ ...prev, saved: true }));
        }
      } else if (tab === "felt") {
        if (!targetId || targetId === "undefined") {
          setFeltLoading(false);
          return;
        }
        setFeltLoading(true);

        const feltRes = await axios.get(
          `/social/memory/felt/${targetId}`,
          { withCredentials: true, signal }
        );

        if (tabFetchRequestRef.current !== currentRequestId) return;

        if (feltRes.data?.success) {
          const posts = feltRes.data.posts || feltRes.data.memories || [];
          setFeltPosts(posts);
          setFetchedTabs((prev) => ({ ...prev, felt: true }));
        }
      }
    } catch (err) {
      if (isCanceledRequest(err)) {
        return;
      }
      console.error(`Error loading tab ${tab}:`, err);
      if (tab === "posts") {
        setPostsError(
          err.response?.status === 401
            ? "Your session has expired. Please sign in again."
            : err.response?.data?.message ||
            "Travel memories could not be loaded. Please try again."
        );
      }
    } finally {
      if (tabFetchRequestRef.current === currentRequestId) {
        if (tab === "posts") setPostsLoading(false);
        if (tab === "trips") setTripsLoading(false);
        if (tab === "stories") setStoriesLoading(false);
        if (tab === "saved") setSavedLoading(false);
        if (tab === "felt") setFeltLoading(false);
      }
    }
  };

  const loadMorePosts = async () => {
    if (postsLoading || !hasMorePosts) return;

    setPostsLoading(true);

    try {
      const targetId = id || currentUser?._id || currentUser?.id;
      const nextPage = postsPage + 1;

      const memRes = await axios.get(
        `/social/memory?userId=${targetId}&limit=12&page=${nextPage}`,
        { withCredentials: true }
      );

      if (memRes.data?.success) {
        const newMemories = Array.isArray(memRes.data.memories)
          ? memRes.data.memories
          : [];

        setUserMemories((prev) => {
          const existingIds = new Set(
            prev.map((p) => (p._id || p.id)?.toString())
          );
          const filtered = newMemories.filter(
            (m) =>
              m &&
              (m._id || m.id) &&
              !existingIds.has((m._id || m.id).toString())
          );
          return [...prev, ...filtered];
        });

        if (typeof memRes.data.totalMemories === "number") {
          setUserMemoriesTotal(memRes.data.totalMemories);
        } else if (typeof memRes.data.pagination?.total === "number") {
          setUserMemoriesTotal(memRes.data.pagination.total);
        }

        setHasMorePosts(
          typeof memRes.data.hasMore === "boolean"
            ? memRes.data.hasMore
            : (memRes.data.pagination?.hasMore ?? newMemories.length === 12)
        );

        setPostsPage(nextPage);
      } else {
        showToast.error(
          memRes.data?.message || "Failed to load more memories"
        );
      }
    } catch (err) {
      console.error("Failed to load more posts:", err);
      showToast.error(
        err.response?.data?.message || "Failed to load more memories"
      );
    } finally {
      setPostsLoading(false);
    }
  };
  const handleFollowToggle = async () => {
    if (followLoading || !profileRelationship || !profileUser) return;

    if (
      profileRelationship.socialState === "incoming_request" ||
      profileRelationship.socialState === "self"
    ) {
      return;
    }

    setFollowLoading(true);

    try {
      const endpoint = profileRelationship.isFollowing
        ? `/users/${profileUser._id}/unfollow`
        : profileRelationship.requestSent
          ? `/users/follow-requests/${profileUser._id}`
          : `/users/${profileUser._id}/follow`;

      const method = profileRelationship.requestSent
        ? "delete"
        : "post";

      const res = await axios[method](
        endpoint,
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        showToast.success(res.data.message);
        await fetchProfileSilent();

        if (showRelationsModal) {
          openRelationsModal(relationsModalType, true);
        }
      }
    } catch (err) {
      const errorMsg =
        err.response?.data?.message ||
        "Failed to complete action";

      showToast.error(errorMsg);

      if (
        errorMsg.toLowerCase().includes("already sent") ||
        errorMsg.toLowerCase().includes("already requested")
      ) {
        setProfileUser((prev) => {
          if (!prev) return prev;

          const currentIdStr = String(
            currentUser?._id || currentUser?.id || ""
          );

          const existing = (prev.followRequests || []).map(
            (id) => String(id?._id || id)
          );

          if (!existing.includes(currentIdStr)) {
            return {
              ...prev,
              followRequests: [...existing, currentIdStr],
            };
          }

          return prev;
        });

        fetchProfileSilent();
      }
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      const res = await axios.post(
        `/users/${profileUser._id}/follow-request/accept`,
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        showToast.success("Follow request accepted");

        const freshSelf = await axios.get(
          `/users/${currentUser._id}`,
          { withCredentials: true }
        );

        const selfData = freshSelf.data.user || freshSelf.data;

        dispatch({
          type: "LOGIN_SUCCESS",
          payload: {
            ...currentUser,
            followRequests: selfData.followRequests,
            followers: selfData.followers,
            following: selfData.following,
          },
        });

        fetchProfile();
      }
    } catch (err) {
      showToast.error("Failed to accept request");
    }
  };

  const handleDeclineRequest = async () => {
    try {
      const res = await axios.post(
        `/users/${profileUser._id}/follow-request/reject`,
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        const freshSelf = await axios.get(
          `/users/${currentUser._id}`,
          { withCredentials: true }
        );

        const selfData = freshSelf.data.user || freshSelf.data;

        dispatch({
          type: "LOGIN_SUCCESS",
          payload: {
            ...currentUser,
            followRequests: selfData.followRequests,
          },
        });

        fetchProfile();
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleFollowToggleForUser = async (targetUser) => {
    if (loadingRelationId === targetUser._id) return;

    setLoadingRelationId(targetUser._id);

    try {
      const targetId = targetUser._id;

      const rel = resolveRelationship(
        currentUser,
        targetUser,
        tripMateStates?.[String(targetId)]
      );

      const endpoint = rel.isFollowing
        ? `/users/${targetId}/unfollow`
        : rel.requestSent
          ? `/users/follow-requests/${targetId}`
          : `/users/${targetId}/follow`;

      const method = rel.requestSent ? "delete" : "post";

      const res = await axios[method](
        endpoint,
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        showToast.success(res.data.message);
        await fetchProfileSilent();

        if (showRelationsModal) {
          openRelationsModal(relationsModalType, true);
        }
      }
    } catch (err) {
      showToast.error(
        err.response?.data?.message ||
        "Failed to complete action"
      );
    } finally {
      setLoadingRelationId(null);
    }
  };

  const handleRemoveFollower = async (targetUser) => {
    if (loadingRelationId === targetUser._id) return;

    setLoadingRelationId(targetUser._id);

    try {
      const res = await axios.delete(
        `/users/me/followers/${targetUser._id}`,
        { withCredentials: true }
      );

      if (res.data.success) {
        showToast.success(res.data.message);

        setRelationsList((prev) =>
          prev.filter(
            (u) => String(u._id) !== String(targetUser._id)
          )
        );

        if (profileUser) {
          setProfileUser((prev) => ({
            ...prev,
            followers: prev.followers
              ? prev.followers.filter(
                (id) =>
                  String(id._id || id) !==
                  String(targetUser._id)
              )
              : [],
          }));
        }
      }
    } catch (err) {
      showToast.error(
        err.response?.data?.message ||
        "Failed to remove follower"
      );
    } finally {
      setLoadingRelationId(null);
    }
  };
  const openRelationsModal = async (type, silent = false) => {
    setRelationsModalType(type);

    if (!silent) {
      setShowRelationsModal(true);
      setRelationsSearch("");
      setRelationsLoading(true);
    }

    setRelationsError(null);

    const currentRequestId = Date.now();
    relationsRequestRef.current = currentRequestId;

    try {
      const targetId =
        id || currentUser?._id || currentUser?.id;

      let finalUsers = [];

      if (type === "mutuals") {
        const followingRes = await axios.get(
          `/users/${targetId}/following`,
          { withCredentials: true }
        );

        const followersRes = await axios.get(
          `/users/${targetId}/followers`,
          { withCredentials: true }
        );

        if (
          followingRes.data.success &&
          followersRes.data.success
        ) {
          const following = followingRes.data.following || [];
          const followers = followersRes.data.followers || [];

          const followingMap = new Map();

          following.forEach((item) => {
            if (item && item._id) {
              followingMap.set(item._id.toString(), item);
            }
          });

          finalUsers = followers.filter(
            (item) =>
              item &&
              item._id &&
              followingMap.has(item._id.toString())
          );
        }
      } else if (type === "trip_mates") {
        const res = await axios.get(
          `/trip-mates/${targetId}`,
          { withCredentials: true }
        );

        if (res.data.success) {
          const dataList = res.data.trip_mates || [];
          const uniqueMap = new Map();

          dataList.forEach((item) => {
            if (item && item._id) {
              uniqueMap.set(item._id.toString(), item);
            }
          });

          finalUsers = Array.from(uniqueMap.values());
        }
      } else {
        const res = await axios.get(
          `/users/${targetId}/${type}`,
          { withCredentials: true }
        );

        if (res.data.success) {
          const dataList = res.data[type] || [];
          const uniqueMap = new Map();

          dataList.forEach((item) => {
            if (item && item._id) {
              uniqueMap.set(item._id.toString(), item);
            }
          });

          finalUsers = Array.from(uniqueMap.values());
        }
      }

      // Merge travel history if available
      try {
        const compRes = await axios.get(
          `/journeys/previous-companions?userId=${targetId}`,
          { withCredentials: true }
        );

        if (compRes.data.success) {
          const companions = compRes.data.companions || [];
          const compMap = new Map();

          companions.forEach((c) => {
            if (c._id) {
              compMap.set(c._id.toString(), c);
            }
          });

          finalUsers = finalUsers.map((u) => {
            const compData = compMap.get(
              u._id.toString()
            );

            if (compData) {
              return {
                ...u,
                tripsCount: compData.tripsCount,
                lastJourney: compData.lastJourney,
              };
            }

            return u;
          });
        }
      } catch (e) {
        // Travel history is optional; keep the main relations list if it fails.
      }

      // Fetch my connections so UI can resolve trip mate status
      try {
        if (currentUser) {
          const myConnections = await axios.get(
            `/trip-mates/connections`,
            { withCredentials: true }
          );

          if (myConnections.data.success) {
            setTripMateStates(
              myConnections.data.connectionStates || {}
            );
          }
        }
      } catch (e) {
        console.error(
          "Failed to load trip mate connections:",
          e
        );
      }

      if (
        relationsRequestRef.current === currentRequestId
      ) {
        setRelationsList(finalUsers);
      }
    } catch (err) {
      console.error(err);

      if (
        relationsRequestRef.current === currentRequestId
      ) {
        setRelationsError(err);
      }
    } finally {
      if (
        relationsRequestRef.current === currentRequestId
      ) {
        setRelationsLoading(false);
      }
    }
  };

  const handleRateUser = async () => {
    try {
      const res = await axios.post(
        `/users/rate/${profileUser._id}`,
        { rating: ratingVal },
        { withCredentials: true }
      );

      if (res.data.success) {
        showToast.success(
          "Thank you for rating this traveler!"
        );

        fetchProfile();
      }
    } catch (err) {
      showToast.error(
        err.response?.data?.message ||
        "Failed to submit rating"
      );
    }
  };

  const handleBlockUser = async () => {
    try {
      const isCurrentlyBlocked = Boolean(
        profileUser?.isBlockedByMe ||
        currentUser?.blockedUsers?.some(
          (id) => (id._id || id)?.toString() === profileUser?._id?.toString()
        )
      );

      const endpoint = isCurrentlyBlocked
        ? `/users/unblock/${profileUser._id}`
        : `/users/block/${profileUser._id}`;

      const res = await axios.post(
        endpoint,
        {},
        { withCredentials: true }
      );

      if (res.data.success) {
        showToast.success(res.data.message);
        setShowBlockModal(false);

        const targetIdStr = profileUser._id.toString();

        if (isCurrentlyBlocked) {
          const updatedBlocked = (currentUser.blockedUsers || []).filter(
            (id) => (id._id || id)?.toString() !== targetIdStr
          );

          dispatch({
            type: "LOGIN_SUCCESS",
            payload: {
              ...currentUser,
              blockedUsers: updatedBlocked,
            },
          });

          setProfileUser((prev) => ({
            ...prev,
            isBlockedByMe: false,
            isBlocked: false,
            canViewContent: !prev.privateAccount,
          }));

          fetchProfile();
        } else {
          setProfileUser((prev) => ({
            ...prev,
            isBlockedByMe: true,
            isBlocked: true,
            canViewContent: false,
            followers: [],
            following: [],
            followersCount: 0,
            followingCount: 0,
            mutualsCount: 0,
          }));

          setUserMemories([]);
          setUserTrips([]);
          setUserStories([]);

          const updatedFollowing = (currentUser.following || []).filter(
            (id) => (id._id || id)?.toString() !== targetIdStr
          );
          const updatedFollowers = (currentUser.followers || []).filter(
            (id) => (id._id || id)?.toString() !== targetIdStr
          );

          const newBlocked = [
            ...(currentUser.blockedUsers || []).filter(
              (id) => (id._id || id)?.toString() !== targetIdStr
            ),
            targetIdStr,
          ];

          dispatch({
            type: "LOGIN_SUCCESS",
            payload: {
              ...currentUser,
              following: updatedFollowing,
              followers: updatedFollowers,
              blockedUsers: newBlocked,
            },
          });
        }
      }
    } catch (err) {
      showToast.error(
        err.response?.data?.message || "Action failed"
      );
    }
  };

  const handleEditPost = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await axios.put(
        `/social/memory/${editPostData._id}`,
        {
          caption: editPostData.caption,
          location: editPostData.location,
          tags: editPostData.tags,
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        showToast.success("Travel Memory updated successfully!");
        const updatedMemory = res.data.post || res.data.memory;

        setUserMemories((prev) =>
          prev.map((p) =>
            p._id === editPostData._id
              ? { ...p, ...updatedMemory }
              : p
          )
        );

        setSelectedMemory((prev) =>
          prev && prev._id === editPostData._id
            ? { ...prev, ...updatedMemory }
            : prev
        );

        setShowEditPostModal(false);
      }
    } catch (err) {
      showToast.error("Failed to update Travel Memory.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async () => {
    setIsSaving(true);

    try {
      const res = await axios.delete(
        `/social/memory/${postToDelete._id}`,
        { withCredentials: true }
      );

      if (res.data.success) {
        showToast.success("Travel Memory deleted successfully!");

        setUserMemories((prev) =>
          prev.filter(
            (p) => p._id !== postToDelete._id
          )
        );

        setUserMemoriesTotal((prev) =>
          Math.max(0, prev - 1)
        );

        setShowDeletePostModal(false);
      }
    } catch (err) {
      showToast.error("Failed to delete Travel Memory.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleEditStory = async (e) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      const res = await axios.put(
        `/social/story/${editStoryData._id}`,
        {
          caption: editStoryData.caption,
          captionPosition: editStoryData.captionPosition,
          captionColor: editStoryData.captionColor,
          song: editStoryData.song,
        },
        { withCredentials: true }
      );

      if (res.data.success) {
        showToast.success("Dispatch updated successfully!");

        setUserStories((prev) =>
          prev.map((s) =>
            s._id === editStoryData._id
              ? res.data.story
              : s
          )
        );

        setShowEditStoryModal(false);
      }
    } catch (err) {
      showToast.error("Failed to update Dispatch.");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStory = async (storyIdOrEvent) => {
    if (typeof storyIdOrEvent === "string") {
      setUserStories((prev) =>
        prev.filter((s) => s._id !== storyIdOrEvent)
      );

      setActiveStoryGroup(null);
      return;
    }

    if (!storyToDelete) return;

    setIsSaving(true);

    try {
      const res = await axios.delete(
        `/social/story/${storyToDelete._id}`,
        { withCredentials: true }
      );

      if (res.data.success) {
        showToast.success("Dispatch deleted successfully!");

        setUserStories((prev) =>
          prev.filter(
            (s) => s._id !== storyToDelete._id
          )
        );

        setShowDeleteStoryModal(false);
        setStoryToDelete(null);
      }
    } catch (err) {
      showToast.error("Failed to delete Dispatch.");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background text-dark flex items-center justify-center">
        <div className="animate-spin rounded-full h-9 w-9 border-t-2 border-b-2 border-primary-600" />
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-background text-dark flex items-center justify-center pt-24 pb-24">
        <div className="text-center px-4">
          <h2 className="text-2xl font-bold mb-3">
            Profile Unavailable
          </h2>

          <p className="text-xs sm:text-[13px] text-muted font-medium max-w-xs mx-auto mb-5">
            This traveler's profile is currently unavailable.
          </p>

          <button
            onClick={() => navigate("/social/buddy")}
            className="bg-primary-600 hover:bg-primary-700 text-white px-6 py-2.5 rounded-xl font-bold text-sm shadow-soft transition-all"
          >
            Explore Travelers
          </button>
        </div>
      </div>
    );
  }

  const isBlockedByMe = Boolean(
    profileUser?.isBlockedByMe ||
    currentUser?.blockedUsers?.some(
      (b) => (b._id || b).toString() === profileUser?._id?.toString()
    )
  );
  const canWriteReview = isOwnProfile || isBlockedByMe
    ? false
    : resolveReviewEligibility(
      currentUser,
      profileUser,
      [
        ...(reviewCandidateJourneys || []),
        ...(userTrips || []),
        ...(joinedTrips || []),
      ]
    );

  const targetUserId = profileUser?._id || id;

  return (
    <div className="w-full overflow-x-hidden pb-20 lg:pb-12 font-sans antialiased relative bg-background pt-2 sm:pt-4">
      <div className="max-w-[1100px] mx-auto px-3 sm:px-4 lg:px-8 relative z-10 space-y-4">

        {/* ─── 1. PROFILE HEADER ─────────────────────────────── */}
        <ProfileHeader
          profileUser={profileUser}
          currentUser={currentUser}
          isOwnProfile={isOwnProfile}
          relationship={profileRelationship}
          followLoading={followLoading}
          isBlockedByMe={isBlockedByMe}
          showProfileMenu={showProfileMenu}
          setShowProfileMenu={setShowProfileMenu}
          handleFollowToggle={handleFollowToggle}
          handleAcceptRequest={handleAcceptRequest}
          handleDeclineRequest={handleDeclineRequest}
          setShowReportModal={setShowReportModal}
          setShowBlockModal={setShowBlockModal}
          setShowRateModal={setShowRateModal}
          navigate={navigate}
          userMemories={userMemories}
          userMemoriesTotal={userMemoriesTotal}
          userTrips={userTrips}
          openRelationsModal={openRelationsModal}
          canWriteReview={canWriteReview}
          userStories={userStories}
          handleOpenStory={handleOpenStory}
          journeyStats={journeyStats}
          setActiveTab={setActiveTab}
          onProfileUpdate={(updatedUserData) => {
            setProfileUser((prev) => ({ ...prev, ...updatedUserData }));
            if (isOwnProfile) {
              dispatch({
                type: "UPDATE_USER",
                payload: updatedUserData,
              });
            }
          }}
        />

        {/* ─── 2. BLOCKED ACCOUNT ─────────────────────────────── */}
        {!isOwnProfile && isBlockedByMe ? (
          <div className="bg-surface/70 backdrop-blur-sm border border-red-200 rounded-3xl p-12 sm:p-16 text-center select-none shadow-soft mt-8">
            <div className="w-20 h-20 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-5 relative">
              <Ban className="w-9 h-9 relative z-10" />
            </div>

            <h3 className="text-base font-bold text-dark mb-1">
              You Have Blocked This Traveler
            </h3>

            <p className="text-xs sm:text-[13px] text-muted font-medium max-w-xs mx-auto mb-5">
              Unblock this traveler to view their trips, travel memories, and interact with them again.
            </p>

            <button
              onClick={() => setShowBlockModal(true)}
              className="px-6 py-2.5 bg-red-600 hover:bg-red-700 text-white rounded-full text-xs font-bold transition-all shadow-md shadow-red-600/20 active:scale-95"
            >
              Unblock Traveler
            </button>
          </div>
        ) : !isOwnProfile &&
          profileUser?.canViewContent === false ? (
          <div className="bg-surface/70 backdrop-blur-sm border border-border rounded-3xl p-12 sm:p-16 text-center select-none shadow-soft mt-8">
            <div className="w-20 h-20 bg-secondary-100 rounded-full flex items-center justify-center mx-auto mb-5 relative">
              <div className="absolute inset-0 bg-secondary-300/20 rounded-full blur-xl" />
              <ShieldCheck className="w-9 h-9 text-muted relative z-10" />
            </div>

            <h3 className="text-base font-bold text-dark mb-1">
              This Account is Private
            </h3>

            <p className="text-xs sm:text-[13px] text-muted font-medium max-w-xs mx-auto">
              Follow this account to see their travel
              memories, stories, and trips.
            </p>
          </div>
        ) : (
          <div className="space-y-4">

            {/* ─── 3. ONBOARDING CHECKLIST ─────────────── */}
            {isOwnProfile &&
              userMemories?.length === 0 &&
              (profileUser?.postsCount || 0) === 0 &&
              (profileUser?.following?.length || 0) === 0 &&
              (profileUser?.followers?.length || 0) === 0 && (
                <div className="bg-gradient-to-r from-primary-50 via-purple-50 to-primary-50 border border-primary-100 rounded-3xl p-5 sm:p-6 shadow-soft">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 select-none">
                    <div>
                      <h3 className="text-sm sm:text-base font-bold text-dark flex items-center gap-2">
                        <Compass className="w-5 h-5 text-primary-600" />
                        Welcome to your Travel Onboarding Checklist
                      </h3>

                      <p className="text-xs text-muted font-medium mt-0.5">
                        Complete these quick steps to set up
                        your profile and explore Go YatriGo.
                      </p>
                    </div>

                    <span className="text-xs font-bold bg-primary-600 text-white px-3 py-1 rounded-full shadow-sm self-start sm:self-center">
                      {[
                        !!profileUser?.city,
                        !!(
                          profileUser?.pic &&
                          !profileUser?.pic.includes(
                            "no-image-icon"
                          )
                        ),
                        userMemories?.length > 0,
                        (profileUser?.following?.length || 0) >=
                        5,
                        joinedTrips?.length > 0,
                      ].filter(Boolean).length}
                      /5 Completed
                    </span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">

                    {/* Item 1 */}
                    <div className="flex items-center justify-between bg-surface border border-border p-3.5 rounded-xl shadow-soft">
                      <div className="flex items-center gap-3">
                        <span>
                          {profileUser?.city ? "✅" : "⬜"}
                        </span>

                        <div>
                          <p
                            className={`text-xs font-semibold ${profileUser?.city
                              ? "text-secondary-400 line-through"
                              : "text-dark"
                              }`}
                          >
                            Add your city & state
                          </p>

                          <p className="text-[10px] text-muted">
                            To connect with nearby travelers.
                          </p>
                        </div>
                      </div>

                      {!profileUser?.city && (
                        <button
                          onClick={() =>
                            navigate("/updateProfile", {
                              state: profileUser,
                            })
                          }
                          className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-2.5 py-1 text-[10px] font-semibold"
                        >
                          Add
                        </button>
                      )}
                    </div>

                    {/* Item 2 */}
                    <div className="flex items-center justify-between bg-surface border border-border p-3.5 rounded-xl shadow-soft">
                      <div className="flex items-center gap-3">
                        <span>
                          {profileUser?.pic &&
                            !profileUser?.pic.includes(
                              "no-image-icon"
                            )
                            ? "✅"
                            : "⬜"}
                        </span>

                        <div>
                          <p
                            className={`text-xs font-semibold ${profileUser?.pic &&
                              !profileUser?.pic.includes(
                                "no-image-icon"
                              )
                              ? "text-secondary-400 line-through"
                              : "text-dark"
                              }`}
                          >
                            Upload profile picture
                          </p>

                          <p className="text-[10px] text-muted">
                            Let other explorers recognize you.
                          </p>
                        </div>
                      </div>

                      {!(
                        profileUser?.pic &&
                        !profileUser?.pic.includes(
                          "no-image-icon"
                        )
                      ) && (
                          <button
                            onClick={() =>
                              navigate("/updateProfile", {
                                state: profileUser,
                              })
                            }
                            className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-2.5 py-1 text-[10px] font-semibold"
                          >
                            Upload
                          </button>
                        )}
                    </div>

                    {/* Item 3 */}
                    <div className="flex items-center justify-between bg-surface border border-border p-3.5 rounded-xl shadow-soft">
                      <div className="flex items-center gap-3">
                        <span>
                          {userMemories?.length > 0
                            ? "✅"
                            : "⬜"}
                        </span>

                        <div>
                          <p
                            className={`text-xs font-semibold ${userMemories?.length > 0
                              ? "text-secondary-400 line-through"
                              : "text-dark"
                              }`}
                          >
                            Share your first memory
                          </p>

                          <p className="text-[10px] text-muted">
                            Publish a photo of your travels.
                          </p>
                        </div>
                      </div>

                      {userMemories?.length === 0 && (
                        <button
                          onClick={() =>
                            setShowCreatePostModal(true)
                          }
                          className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-2.5 py-1 text-[10px] font-semibold"
                        >
                          Post
                        </button>
                      )}
                    </div>

                    {/* Item 4 */}
                    <div className="flex items-center justify-between bg-surface border border-border p-3.5 rounded-xl shadow-soft">
                      <div className="flex items-center gap-3">
                        <span>
                          {(profileUser?.following?.length ||
                            0) >= 5
                            ? "✅"
                            : "⬜"}
                        </span>

                        <div>
                          <p
                            className={`text-xs font-semibold ${(profileUser?.following?.length ||
                              0) >= 5
                              ? "text-secondary-400 line-through"
                              : "text-dark"
                              }`}
                          >
                            Follow 5 travelers (
                            {profileUser?.following?.length ||
                              0}
                            /5)
                          </p>

                          <p className="text-[10px] text-muted">
                            Build your travel network.
                          </p>
                        </div>
                      </div>

                      {(profileUser?.following?.length ||
                        0) < 5 && (
                          <button
                            onClick={() => navigate("/")}
                            className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-2.5 py-1 text-[10px] font-semibold"
                          >
                            Explore
                          </button>
                        )}
                    </div>

                    {/* Item 5 */}
                    <div className="flex items-center justify-between bg-surface border border-border p-3.5 rounded-xl shadow-soft sm:col-span-2">
                      <div className="flex items-center gap-3">
                        <span>
                          {joinedTrips?.length > 0
                            ? "✅"
                            : "⬜"}
                        </span>

                        <div>
                          <p
                            className={`text-xs font-semibold ${joinedTrips?.length > 0
                              ? "text-secondary-400 line-through"
                              : "text-dark"
                              }`}
                          >
                            Join a travel group (squad)
                          </p>

                          <p className="text-[10px] text-muted">
                            Find companions to travel together.
                          </p>
                        </div>
                      </div>

                      {joinedTrips?.length === 0 && (
                        <button
                          onClick={() =>
                            navigate("/social/buddy")
                          }
                          className="bg-primary-600 hover:bg-primary-700 text-white rounded-lg px-2.5 py-1 text-[10px] font-semibold"
                        >
                          Join
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

            {/* ─── 4. PROFILE NAVIGATION TABS ─────────────── */}
            <ProfileTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isOwnProfile={isOwnProfile}
              memoriesCount={userMemoriesTotal || userMemories?.length || 0}
              tripsCount={userTrips?.length || 0}
              savedCount={savedPosts?.length || 0}
            />

            {/* ─── 5. ACTIVE TAB CONTENT ───────────────────── */}
            <div>
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.2 }}
              >
                {activeTab === "posts" && (
                  <PostsTab
                    postsLoading={postsLoading}
                    postsError={postsError}
                    userMemories={userMemories}
                    setSelectedMemory={setSelectedMemory}
                    isOwnProfile={isOwnProfile}
                    setShowCreatePostModal={setShowCreatePostModal}
                    setEditPostData={setEditPostData}
                    setShowEditPostModal={setShowEditPostModal}
                    setPostToDelete={setPostToDelete}
                    setShowDeletePostModal={setShowDeletePostModal}
                    hasMorePosts={hasMorePosts}
                    loadMorePosts={loadMorePosts}
                    retryPosts={() => fetchTabData("posts", targetId, true)}
                    currentUser={currentUser}
                    profileUser={profileUser}
                    handleFelt={handleFelt}
                    handleLikeMemory={handleFelt}
                    savedPostIds={savedPostIds}
                    saveLoadingMap={saveLoadingMap}
                    feltLoadingMap={feltLoadingMap}
                    commentsLoadingMap={commentsLoadingMap}
                    isSubmittingComment={isSubmittingComment}
                    commentText={commentText}
                    setCommentText={setCommentText}
                    activeCommentPost={activeCommentPost}
                    playingAudioId={playingAudioId}
                    journeyLikeAnim={journeyLikeAnim}
                    handlePostTap={handlePostTap}
                    handleOpenComments={handleOpenComments}
                    handleDispatch={handleDispatch}
                    handleSaveToggle={handleSaveToggle}
                    handleDeleteComment={handleDeleteComment}
                    handleCommentSubmit={handleCommentSubmit}
                    toggleAudio={toggleAudio}
                    setReportModal={setReportModal}
                    handleDeletePost={(post) => {
                      setPostToDelete(post);
                      setShowDeletePostModal(true);
                    }}
                    handleAvatarError={handleAvatarError}
                    audioRefs={audioRefs}
                  />
                )}

                {activeTab === "trips" && (
                  <TripsTab
                    userTrips={userTrips}
                    joinedTrips={joinedTrips}
                    groupFilter={groupFilter}
                    setGroupFilter={setGroupFilter}
                    tripsLoading={tripsLoading}
                    isOwnProfile={isOwnProfile}
                  />
                )}

                {activeTab === "journeys" && (
                  <JourneyStatistics userId={profileUserId || targetId} />
                )}

                {activeTab === "stories" &&
                  isOwnProfile && (
                    <StoriesTab
                      userStories={userStories}
                      handleOpenStory={handleOpenStory}
                      isOwnProfile={isOwnProfile}
                      storiesLoading={storiesLoading}
                      setShowDeleteStoryModal={
                        setShowDeleteStoryModal
                      }
                      setStoryToDelete={setStoryToDelete}
                    />
                  )}

                {activeTab === "saved" &&
                  isOwnProfile && (
                    <SavedTab
                      savedPosts={savedPosts}
                      savedLoading={savedLoading}
                      setSelectedMemory={setSelectedMemory}
                    />
                  )}

                {activeTab === "felt" && (
                  <FeltTab
                    feltPosts={feltPosts}
                    setSelectedMemory={setSelectedMemory}
                    navigate={navigate}
                    feltLoading={feltLoading}
                  />
                )}
              </motion.div>
            </div>
          </div>
        )}

        {/* ─── 6. ACTION & CONFIRMATION MODALS ───────────── */}
        <ActionModals
          showBlockModal={showBlockModal}
          setShowBlockModal={setShowBlockModal}
          isBlockedByMe={isBlockedByMe}
          handleBlockUser={handleBlockUser}
          showRateModal={showRateModal}
          setShowRateModal={setShowRateModal}
          ratingVal={ratingVal}
          setRatingVal={setRatingVal}
          handleRateUser={handleRateUser}
          showReportModal={showReportModal}
          setShowReportModal={setShowReportModal}
          profileUser={profileUser}
          showEditPostModal={showEditPostModal}
          setShowEditPostModal={setShowEditPostModal}
          editPostData={editPostData}
          setEditPostData={setEditPostData}
          handleEditPost={handleEditPost}
          showDeletePostModal={showDeletePostModal}
          setShowDeletePostModal={
            setShowDeletePostModal
          }
          postToDelete={postToDelete}
          handleDeletePost={handleDeletePost}
          showEditStoryModal={showEditStoryModal}
          setShowEditStoryModal={
            setShowEditStoryModal
          }
          editStoryData={editStoryData}
          setEditStoryData={setEditStoryData}
          handleEditStory={handleEditStory}
          showDeleteStoryModal={
            showDeleteStoryModal
          }
          setShowDeleteStoryModal={
            setShowDeleteStoryModal
          }
          storyToDelete={storyToDelete}
          handleDeleteStory={handleDeleteStory}
          isSaving={isSaving}
        />

        {/* ─── 7. MEMORY DETAIL MODAL ───────────────────── */}
        <MemoryDetailModal
          selectedMemory={selectedMemory}
          setSelectedMemory={setSelectedMemory}
          currentUser={currentUser}
          profileUser={profileUser}
          savedPostIds={savedPostIds}
          saveLoadingMap={saveLoadingMap}
          feltLoadingMap={feltLoadingMap}
          commentsLoadingMap={commentsLoadingMap}
          isSubmittingComment={isSubmittingComment}
          commentText={commentText}
          setCommentText={setCommentText}
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
          toggleAudio={toggleAudio}
          setReportModal={setReportModal}
          setEditPostData={setEditPostData}
          setShowEditPostModal={setShowEditPostModal}
          handleDeletePost={(post) => {
            setPostToDelete(post || selectedMemory);
            setShowDeletePostModal(true);
          }}
          handleAvatarError={handleAvatarError}
          audioRefs={audioRefs}
        />

        {/* ─── 8. RELATIONS MODALS ───────────────────────── */}
        {relationsModalType === "trip_mates" ? (
          <TripMatesModal
            showRelationsModal={showRelationsModal}
            setShowRelationsModal={
              setShowRelationsModal
            }
            relationsModalType={relationsModalType}
            relationsSearch={relationsSearch}
            setRelationsSearch={setRelationsSearch}
            relationsLoading={relationsLoading}
            relationsList={relationsList}
            tripMateStates={tripMateStates}
            currentUser={currentUser}
            currentUserData={currentUserData}
            profileUser={profileUser}
            isOwnProfile={isOwnProfile}
            handleFollowToggleForUser={
              handleFollowToggleForUser
            }
            loadingRelationId={loadingRelationId}
            openRelationsModal={openRelationsModal}
            relationsError={relationsError}
          />
        ) : relationsModalType === "followers" ? (
          <FollowersModal
            showRelationsModal={showRelationsModal}
            setShowRelationsModal={
              setShowRelationsModal
            }
            relationsModalType={relationsModalType}
            relationsSearch={relationsSearch}
            setRelationsSearch={setRelationsSearch}
            relationsLoading={relationsLoading}
            relationsList={relationsList}
            tripMateStates={tripMateStates}
            currentUser={currentUser}
            currentUserData={currentUserData}
            profileUser={profileUser}
            isOwnProfile={isOwnProfile}
            handleFollowToggleForUser={
              handleFollowToggleForUser
            }
            handleRemoveFollower={
              handleRemoveFollower
            }
            loadingRelationId={loadingRelationId}
            openRelationsModal={openRelationsModal}
            relationsError={relationsError}
          />
        ) : relationsModalType === "following" ? (
          <FollowingModal
            showRelationsModal={showRelationsModal}
            setShowRelationsModal={
              setShowRelationsModal
            }
            relationsModalType={relationsModalType}
            relationsSearch={relationsSearch}
            setRelationsSearch={setRelationsSearch}
            relationsLoading={relationsLoading}
            relationsList={relationsList}
            tripMateStates={tripMateStates}
            currentUser={currentUser}
            currentUserData={currentUserData}
            profileUser={profileUser}
            isOwnProfile={isOwnProfile}
            handleFollowToggleForUser={
              handleFollowToggleForUser
            }
            loadingRelationId={loadingRelationId}
            openRelationsModal={openRelationsModal}
            relationsError={relationsError}
          />
        ) : (
          <RelationsModal
            showRelationsModal={showRelationsModal}
            setShowRelationsModal={
              setShowRelationsModal
            }
            relationsModalType={relationsModalType}
            relationsSearch={relationsSearch}
            setRelationsSearch={setRelationsSearch}
            relationsLoading={relationsLoading}
            relationsList={relationsList}
            tripMateStates={tripMateStates}
            currentUser={currentUser}
            currentUserData={currentUserData}
            profileUser={profileUser}
            isOwnProfile={isOwnProfile}
            handleFollowToggleForUser={
              handleFollowToggleForUser
            }
            loadingRelationId={loadingRelationId}
            openRelationsModal={openRelationsModal}
            relationsError={relationsError}
          />
        )}

        {/* ─── 9. STORY VIEWER ──────────────────────────── */}
        <AnimatePresence>
          {activeStoryGroup && (
            <DispatchViewer
              activeStoryGroup={activeStoryGroup}
              activeStoryIndex={activeStoryIndex}
              myUserId={currentUser?._id}
              isStoryMuted={isStoryMuted}
              setIsStoryMuted={setIsStoryMuted}
              handleDeleteStory={handleDeleteStory}
              setShowViewersList={
                setShowViewersList
              }
              isStoryPaused={isStoryPaused}
              setIsStoryPaused={setIsStoryPaused}
              closeStoryViewer={() =>
                setActiveStoryGroup(null)
              }
              nextStory={nextStory}
              prevStory={prevStory}
              dispatches={[activeStoryGroup]}
              fetchFeedData={() => { }}
            />
          )}
        </AnimatePresence>

        {/* ─── 10. CREATION MODALS ───────────────────────── */}
        <CreateTravelMemoryModal
          isOpen={showCreatePostModal}
          onClose={() =>
            setShowCreatePostModal(false)
          }
          onSuccess={() => {
            setShowCreatePostModal(false);
            fetchProfile();
          }}
          user={currentUser}
        />

        <CreateDispatchModal
          isOpen={showCreateStoryModal}
          onClose={() =>
            setShowCreateStoryModal(false)
          }
          onSuccess={() => {
            setShowCreateStoryModal(false);
            fetchProfile();
          }}
        />

        {/* ─── 11. REPORT MODAL ──────────────────────────── */}
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
      </div>
    </div>
  );
};

export default Profile;