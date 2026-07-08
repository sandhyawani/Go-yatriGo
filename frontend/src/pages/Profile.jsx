import React, { useState, useEffect, useContext, useRef } from "react";
import { useNavigate, Link, useParams, useLocation } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import { SocketContext } from "../context/SocketContext";
import { SOCKET_EVENTS } from "../constants/socketEvents";
import {
  User,
  Mail,
  Phone,
  Globe,
  Calendar,
  Clock,
  Settings,
  History,
  PlusCircle,
  LayoutDashboard,
  LogOut,
  Edit,
  Activity,
  UserPlus,
  UserMinus,
  Ban,
  ShieldAlert,
  Star,
  ShieldCheck,
  Compass,
  Heart,
  Grid,
  MapPin,
  MessageSquare,
  Sparkles,
  ChevronRight,
  MessageCircle,
  Plus,
  Home as HomeIcon,
  User as UserIcon,
  X,
  Award,
  Search,
  MoreVertical,
  Bookmark,
  Music,
  Play,
  Pause,
  Clapperboard,
  Users,
  FileText,
  Video,
  XCircle,
} from "lucide-react";
import moment from "moment";
import { motion, AnimatePresence } from "framer-motion";
import axios from "../api/axios";
import { showToast } from "../utils/showToast";
import AudioManager from "../utils/AudioManager";
import { getAvatarUrl } from "../utils/avatar";
import LazyImage from "../components/common/LazyImage";
import ReportModal from "../components/modals/ReportModal";
import StoryViewer from "../components/story/StoryViewer";
import JourneyStatistics from "../components/journey/JourneyStatistics";
import ProfileHeader from "../components/profile/ProfileHeader";
import ProfileTabs from "../components/profile/ProfileTabs";

const Profile = () => {
  const { id } = useParams();
  const { user: currentUser, logout, dispatch } = useContext(AuthContext);
  const socket = useContext(SocketContext);
  const navigate = useNavigate();

  const [profileUser, setProfileUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratingVal, setRatingVal] = useState(5);
  const [reportReason, setReportReason] = useState("");
  const [showReportModal, setShowReportModal] = useState(false);
  const [showBlockModal, setShowBlockModal] = useState(false);
  const [showRateModal, setShowRateModal] = useState(false);
  const [showProfileMenu, setShowProfileMenu] = useState(false);

  const location = useLocation();
  const isOwnProfile =
    !id ||
    id === currentUser?._id ||
    id === currentUser?.id ||
    id?.toString() === (currentUser?._id || currentUser?.id)?.toString();

  const getInitialTab = () => {
    if (
      location.pathname === "/saved" ||
      new URLSearchParams(location.search).get("tab") === "saved"
    ) {
      return "saved";
    }
    return isOwnProfile ? "posts" : "trips";
  };

  // Profile tabs: "posts", "trips", "reviews", "saved"
  const [activeTab, setActiveTab] = useState(getInitialTab);

  // Update tab when navigating between own profile and others or route changes
  useEffect(() => {
    if (
      location.pathname === "/saved" ||
      new URLSearchParams(location.search).get("tab") === "saved"
    ) {
      setActiveTab("saved");
    } else {
      setActiveTab(isOwnProfile ? "posts" : "trips");
    }
  }, [isOwnProfile, location.pathname, location.search]);

  // Dynamic user data lists
  const [userMemories, setUserMemories] = useState([]);
  const [userTrips, setUserTrips] = useState([]);
  const [joinedTrips, setJoinedTrips] = useState([]);
  const [userStories, setUserStories] = useState([]);
  const [savedPosts, setSavedPosts] = useState([]);
  const [feltPosts, setFeltPosts] = useState([]);
  const [groupFilter, setGroupFilter] = useState("hosted");
  const [postsLoading, setPostsLoading] = useState(false);
  const [tripsLoading, setTripsLoading] = useState(false);
  const [storiesLoading, setStoriesLoading] = useState(false);
  const [savedLoading, setSavedLoading] = useState(false);
  const [feltLoading, setFeltLoading] = useState(false);

  const [postsPage, setPostsPage] = useState(1);
  const [hasMorePosts, setHasMorePosts] = useState(true);
  const [fetchedTabs, setFetchedTabs] = useState({});
  const [showEditPostModal, setShowEditPostModal] = useState(false);
  const [editPostData, setEditPostData] = useState(null);
  const [showDeletePostModal, setShowDeletePostModal] = useState(false);
  const [postToDelete, setPostToDelete] = useState(null);
  const [showEditStoryModal, setShowEditStoryModal] = useState(false);
  const [editStoryData, setEditStoryData] = useState(null);
  const [showDeleteStoryModal, setShowDeleteStoryModal] = useState(false);
  const [storyToDelete, setStoryToDelete] = useState(null);
  const [isSaving, setIsSaving] = useState(false);

  // Story Viewer State
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [isStoryMuted, setIsStoryMuted] = useState(true);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [storyReplyText, setStoryReplyText] = useState("");
  const [replyingToStory, setReplyingToStory] = useState(false);
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
  // Selected memory modal
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const audioRef = useRef(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  const handleLikeMemory = async (postId) => {
    try {
      const res = await axios.post(
        `/social/memory/like/${postId}`,
        {},
        { withCredentials: true },
      );
      if (res.data.success) {
        setUserMemories((prev) =>
          prev.map((m) =>
            m._id === postId ? { ...m, likes: res.data.memory.likes } : m,
          ),
        );
        if (selectedMemory && selectedMemory._id === postId) {
          setSelectedMemory((prev) => ({
            ...prev,
            likes: res.data.memory.likes,
          }));
        }
      }
    } catch {
      showToast.error("Failed to like post");
    }
  };

  useEffect(() => {
    if (selectedMemory && selectedMemory.music?.preview) {
      setTimeout(() => {
        if (audioRef.current) {
          AudioManager.stopAll();
          audioRef.current.src = selectedMemory.music.preview;
          AudioManager.play(selectedMemory._id, audioRef.current, {
            source: "profile",
          });
          setIsPlayingAudio(true);
        }
      }, 100);
    } else {
      if (audioRef.current) {
        AudioManager.pause(selectedMemory?._id);
      }
      setIsPlayingAudio(false);
    }

    return () => {
      AudioManager.stopAll();
    };
  }, [selectedMemory]);

  const toggleAudio = (e) => {
    e.stopPropagation();
    if (!audioRef.current) return;

    if (isPlayingAudio) {
      AudioManager.pause(selectedMemory?._id);
      setIsPlayingAudio(false);
    } else {
      AudioManager.play(selectedMemory?._id, audioRef.current, {
        source: "profile",
      });
      setIsPlayingAudio(true);
    }
  };

  const lastTapTime = useRef(0);
  const handleImageClick = (e) => {
    const now = Date.now();
    if (now - lastTapTime.current < 300) {
      if (selectedMemory) {
        const hasLiked = selectedMemory.likes?.some(
          (id) => (id?._id || id)?.toString() === currentUser?._id,
        );
        if (!hasLiked) {
          handleLikeMemory(selectedMemory._id);
        }
        setLikeAnimation(true);
        setTimeout(() => setLikeAnimation(false), 1150);
      }
    }
    lastTapTime.current = now;
  };

  // Followers/Following relations modal states
  const [showRelationsModal, setShowRelationsModal] = useState(false);
  const [relationsModalType, setRelationsModalType] = useState("followers"); // "followers" or "following"
  const [relationsSearch, setRelationsSearch] = useState("");
  const [relationsList, setRelationsList] = useState([]);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [loadingRelationId, setLoadingRelationId] = useState(null);

  useEffect(() => {
    fetchProfile();
  }, [id, currentUser]);

  const fetchProfile = async () => {
    const targetId = isOwnProfile ? currentUser?._id || currentUser?.id : id;
    if (!targetId) return;

    setLoading(true);

    try {
      const res = await axios.get(`/users/${targetId}`, {
        withCredentials: true,
      });
      const userData = res.data.user || res.data;
      if (isOwnProfile) userData.canViewContent = true;
      setProfileUser(userData);

      if (currentUser?._id) {
        if (isOwnProfile) {
          setCurrentUserData(userData);
        } else {
          try {
            const selfRes = await axios.get(`/users/${currentUser._id}`, {
              withCredentials: true,
            });
            setCurrentUserData(selfRes.data.user || selfRes.data);
          } catch (selfErr) {
            console.warn("Failed to load own relations", selfErr);
          }
        }
      }

      setFetchedTabs({});
      setUserMemories([]);
      setPostsPage(1);
      setHasMorePosts(true);

      fetchTabData(activeTab, targetId, true);
    } catch (err) {
      console.error("fetchProfile error:", err);
      showToast.error(
        err.response?.data?.message || "Failed to load user profile",
      );
      navigate("/social/buddy");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const targetId = isOwnProfile ? currentUser?._id || currentUser?.id : id;
    if (targetId && profileUser) {
      fetchTabData(activeTab, targetId, false);
    }
  }, [activeTab]);

  const fetchProfileSilent = async () => {
    const targetId = isOwnProfile ? currentUser?._id || currentUser?.id : id;
    if (!targetId) return;
    try {
      const res = await axios.get(`/users/${targetId}`, {
        withCredentials: true,
      });
      const userData = res.data.user || res.data;
      if (isOwnProfile) userData.canViewContent = true;
      setProfileUser(userData);

      if (currentUser?._id) {
        if (isOwnProfile) {
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

      return () => {
        socket.off(SOCKET_EVENTS.FOLLOWERS_UPDATED, handleSocketUpdate);
        socket.off(SOCKET_EVENTS.FOLLOWING_UPDATED, handleSocketUpdate);
        socket.off(SOCKET_EVENTS.FOLLOW_REQUEST_RECEIVED, handleSocketUpdate);
        socket.off(SOCKET_EVENTS.FOLLOW_REQUEST_ACCEPTED, handleSocketUpdate);
        socket.off(SOCKET_EVENTS.FOLLOW_REQUEST_REJECTED, handleSocketUpdate);
      };
    }
  }, [socket, id, currentUser]);

  const fetchTabData = async (tab, targetId, force = false) => {
    if (!force && fetchedTabs[tab]) return; // Cache hit

    try {
      if (tab === "posts") {
        setPostsLoading(true);
        const memRes = await axios.get(
          `/social/memory?userId=${targetId}&limit=30&page=1`,
          { withCredentials: true },
        );
        if (memRes.data.success) {
          setUserMemories(memRes.data.memories || []);
          setHasMorePosts(memRes.data.memories.length === 30);
          setPostsPage(1);
        }
      } else if (tab === "trips") {
        setTripsLoading(true);
        const tripRes = await axios.get(
          `/social/buddy?userId=${targetId}&limit=50`,
          { withCredentials: true },
        );
        if (tripRes.data.success) {
          const trips = tripRes.data.trips || [];
          setUserTrips(
            trips.filter(
              (t) =>
                t.userId?._id === targetId ||
                t.userId === targetId ||
                t.host?._id === targetId ||
                t.host === targetId,
            ),
          );
          setJoinedTrips(
            trips.filter((t) =>
              t.companions?.some(
                (c) => (c.userId?._id || c.userId || c._id || c) === targetId,
              ),
            ),
          );
        }
      } else if (tab === "stories" && isOwnProfile) {
        setStoriesLoading(true);
        const storiesRes = await axios.get("/social/story", {
          withCredentials: true,
        });
        if (storiesRes.data.success) {
          const myStoriesGroup = storiesRes.data.stories.find(
            (g) => g.userId === targetId,
          );
          setUserStories(myStoriesGroup ? myStoriesGroup.stories : []);
        }
      } else if (tab === "saved" && isOwnProfile) {
        setSavedLoading(true);
        const savedRes = await axios.get("/social/memory/save", {
          withCredentials: true,
        });
        if (savedRes.data.success) {
          setSavedPosts(savedRes.data.posts || []);
        }
      } else if (tab === "felt") {
        setFeltLoading(true);
        const feltRes = await axios.get(`/social/memory/felt/${targetId}`, {
          withCredentials: true,
        });
        if (feltRes.data.success) {
          setFeltPosts(feltRes.data.memories || []);
        }
      }
      setFetchedTabs((prev) => ({ ...prev, [tab]: true }));
    } catch (err) {
      console.error(`Error loading tab ${tab}:`, err);
    } finally {
      if (tab === "posts") setPostsLoading(false);
      if (tab === "trips") setTripsLoading(false);
      if (tab === "stories") setStoriesLoading(false);
      if (tab === "saved") setSavedLoading(false);
      if (tab === "felt") setFeltLoading(false);
    }
  };

  const loadMorePosts = async () => {
    if (postsLoading || !hasMorePosts) return;
    setPostsLoading(true);
    try {
      const targetId = isOwnProfile ? currentUser?._id || currentUser?.id : id;
      const nextPage = postsPage + 1;
      const memRes = await axios.get(
        `/social/memory?userId=${targetId}&limit=30&page=${nextPage}`,
        { withCredentials: true },
      );
      if (memRes.data.success) {
        setUserMemories((prev) => [...prev, ...(memRes.data.memories || [])]);
        setHasMorePosts(memRes.data.memories.length === 30);
        setPostsPage(nextPage);
      }
    } catch (err) {
      console.error("Failed to load more posts:", err);
    } finally {
      setPostsLoading(false);
    }
  };

  const handleFollowToggle = async () => {
    if (followLoading) return;
    setFollowLoading(true);
    try {
      const isFollowing = profileUser.followers?.some(
        (f) => f._id === currentUser?._id || f === currentUser?._id,
      );
      const isRequested = profileUser.followRequests?.some(
        (f) =>
          (f._id || f) === currentUser?._id || (f._id || f) === currentUser?.id,
      );
      const endpoint =
        isFollowing || isRequested
          ? `/users/${profileUser._id}/unfollow`
          : `/users/${profileUser._id}/follow`;

      const res = await axios.post(endpoint, {}, { withCredentials: true });
      if (res.data.success) {
        showToast.success(res.data.message);
        await fetchProfile();
      }
    } catch (err) {
      showToast.error(
        err.response?.data?.message || "Failed to complete action",
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      const res = await axios.post(
        `/users/${profileUser._id}/follow-request/accept`,
        {},
        { withCredentials: true },
      );
      if (res.data.success) {
        showToast.success("Follow request accepted");

        // Update logged-in user's Redux state immediately so hasPendingRequestForMe
        // flips to false and the Accept/Decline buttons disappear without a flash
        const freshSelf = await axios.get(`/users/${currentUser._id}`, {
          withCredentials: true,
        });
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

        // Re-fetch the viewed profile from the DB to get the real, updated counts
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
        { withCredentials: true },
      );
      if (res.data.success) {
        const freshSelf = await axios.get(`/users/${currentUser._id}`, {
          withCredentials: true,
        });
        const selfData = freshSelf.data.user || freshSelf.data;
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { ...currentUser, followRequests: selfData.followRequests },
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
      const isFollowing = currentUserData?.following?.some(
        (f) => (f._id || f) === targetId,
      );
      const isRequested = targetUser.followRequests?.some(
        (f) =>
          (f._id || f) === currentUser?._id || (f._id || f) === currentUser?.id,
      );
      const endpoint =
        isFollowing || isRequested
          ? `/users/${targetId}/unfollow`
          : `/users/${targetId}/follow`;

      const res = await axios.post(endpoint, {}, { withCredentials: true });
      if (res.data.success) {
        showToast.success(res.data.message);
        await fetchProfile();
      }
    } catch (err) {
      showToast.error(
        err.response?.data?.message || "Failed to complete action",
      );
    } finally {
      setLoadingRelationId(null);
    }
  };

  const openRelationsModal = async (type) => {
    setRelationsModalType(type);
    setShowRelationsModal(true);
    setRelationsSearch("");
    setRelationsLoading(true);
    try {
      const targetId = isOwnProfile ? currentUser?._id || currentUser?.id : id;
      const res = await axios.get(`/users/${targetId}/${type}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        setRelationsList(res.data[type] || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setRelationsLoading(false);
    }
  };

  const handleRateUser = async () => {
    try {
      const res = await axios.post(
        `/users/rate/${profileUser._id}`,
        { rating: ratingVal },
        { withCredentials: true },
      );
      if (res.data.success) {
        showToast.success("Thank you for rating this traveler!");
        fetchProfile();
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Failed to submit rating");
    }
  };

  const handleBlockUser = async () => {
    try {
      const isBlocked = currentUser.blockedUsers?.includes(profileUser._id);
      const endpoint = isBlocked
        ? `/users/unblock/${profileUser._id}`
        : `/users/block/${profileUser._id}`;
      const res = await axios.post(endpoint, {}, { withCredentials: true });
      if (res.data.success) {
        showToast.success(res.data.message);
        // Refresh local auth context user
        const freshSelf = await axios.get(`/users/${currentUser._id}`, {
          withCredentials: true,
        });
        const selfData = freshSelf.data.user || freshSelf.data;
        dispatch({
          type: "LOGIN_SUCCESS",
          payload: { ...currentUser, blockedUsers: selfData.blockedUsers },
        });
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Action failed");
    }
  };

  const handleReportUser = async (e) => {
    e.preventDefault();
    if (!reportReason.trim()) {
      showToast.error("Please enter a reason");
      return;
    }
    try {
      const res = await axios.post(
        `/users/report/${profileUser._id}`,
        { reason: reportReason },
        { withCredentials: true },
      );
      if (res.data.success) {
        showToast.success(
          "User reported successfully. Safety is our priority.",
        );
        setShowReportModal(false);
        setReportReason("");
      }
    } catch (err) {
      showToast.error(err.response?.data?.message || "Report failed");
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
        { withCredentials: true },
      );
      if (res.data.success) {
        showToast.success("Post updated!");
        setUserMemories((prev) =>
          prev.map((p) => (p._id === editPostData._id ? res.data.post : p)),
        );
        setShowEditPostModal(false);
      }
    } catch (err) {
      showToast.error("Failed to update post");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeletePost = async () => {
    setIsSaving(true);
    try {
      const res = await axios.delete(`/social/memory/${postToDelete._id}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        showToast.success("Post deleted!");
        setUserMemories((prev) =>
          prev.filter((p) => p._id !== postToDelete._id),
        );
        setShowDeletePostModal(false);
      }
    } catch (err) {
      showToast.error("Failed to delete post");
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
        { withCredentials: true },
      );
      if (res.data.success) {
        showToast.success("Story updated!");
        setUserStories((prev) =>
          prev.map((s) => (s._id === editStoryData._id ? res.data.story : s)),
        );
        setShowEditStoryModal(false);
      }
    } catch (err) {
      showToast.error("Failed to update story");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDeleteStory = async () => {
    setIsSaving(true);
    try {
      const res = await axios.delete(`/social/story/${storyToDelete._id}`, {
        withCredentials: true,
      });
      if (res.data.success) {
        showToast.success("Story deleted!");
        setUserStories((prev) =>
          prev.filter((s) => s._id !== storyToDelete._id),
        );
        setShowDeleteStoryModal(false);
      }
    } catch (err) {
      showToast.error("Failed to delete story");
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#111827] flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!profileUser) {
    return (
      <div className="min-h-screen bg-[#FAFAFA] text-[#111827] flex items-center justify-center pt-24 pb-24">
        <div className="text-center">
          <h2 className="text-2xl font-black mb-4">Profile Not Found</h2>
          <p className="text-slate-500 mb-6">
            We couldn't find the profile data.
          </p>
          <button
            onClick={() => navigate("/social/buddy")}
            className="bg-primary-600 text-white px-6 py-2 rounded-xl font-bold"
          >
            Go to Explore
          </button>
        </div>
      </div>
    );
  }

  const isFollowing = profileUser?.followers?.some(
    (f) => f._id === currentUser?._id || f === currentUser?._id,
  );
  const isRequested = profileUser?.followRequests?.some(
    (f) => f === currentUser?._id || f._id === currentUser?._id,
  );
  const isBlockedByMe = currentUser?.blockedUsers?.includes(profileUser?._id);
  const hasPendingRequestForMe = currentUser?.followRequests?.some(
    (f) => f === profileUser?._id || f._id === profileUser?._id,
  );

  const createdatnew = profileUser?.createdAt
    ? moment(profileUser.createdAt).format("MMMM YYYY")
    : "Recently";

  return (
    <div className="w-full min-h-[100dvh] overflow-x-hidden pb-20 lg:pb-12 font-sans antialiased relative bg-[#FAFAFA] pt-2 sm:pt-4">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 space-y-6">
        <ProfileHeader
          profileUser={profileUser}
          currentUser={currentUser}
          isOwnProfile={isOwnProfile}
          isFollowing={isFollowing}
          isRequested={isRequested}
          hasPendingRequestForMe={hasPendingRequestForMe}
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
          userTrips={userTrips}
          openRelationsModal={openRelationsModal}
          setActiveTab={setActiveTab}
        />

        {/* Rate Traveler removed to modal */}

        {/* PROFILE FEED TABS NAVIGATION */}
        {!isOwnProfile && profileUser?.canViewContent === false ? (
          <div className="bg-white/50 backdrop-blur-sm border border-slate-200/60 rounded-3xl p-16 text-center select-none shadow-sm mt-8">
            <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 relative">
              <div className="absolute inset-0 bg-slate-300/20 rounded-full blur-xl"></div>
              <ShieldCheck className="w-8 h-8 text-slate-400 relative z-10" />
            </div>
            <h3 className="text-sm font-bold text-slate-900 mb-1">
              This Account is Private
            </h3>
            <p className="text-[13px] text-slate-500 font-medium">
              Follow this account to see their photos and trips.
            </p>
          </div>
        ) : (
          <div className="space-y-6">
            <ProfileTabs
              activeTab={activeTab}
              setActiveTab={setActiveTab}
              isOwnProfile={isOwnProfile}
            />

            {activeTab === "trips" && (
              <div className="flex gap-2 justify-center mb-2 select-none">
                <button
                  onClick={() => setGroupFilter("hosted")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${groupFilter === "hosted" ? "bg-slate-900 text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                >
                  Hosted
                </button>
                <button
                  onClick={() => setGroupFilter("joined")}
                  className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${groupFilter === "joined" ? "bg-slate-900 text-white shadow-md" : "bg-slate-100 text-slate-500 hover:bg-slate-200"}`}
                >
                  Joined
                </button>
              </div>
            )}
            {/* TAB LAYOUTS */}
            <div className="min-h-[200px]">
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.3 }}
              >
                {activeTab === "posts" &&
                  (postsLoading && userMemories.length === 0 ? (
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className="aspect-square bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700"
                        ></div>
                      ))}
                    </div>
                  ) : userMemories.length === 0 ? (
                    <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-16 text-center select-none shadow-sm">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-sm border border-slate-100">
                        <div className="absolute inset-0 bg-primary-600/5 rounded-full blur-xl animate-pulse"></div>
                        <Grid className="w-10 h-10 text-slate-300 relative z-10" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">
                        No Travel Memories
                      </h3>
                      <p className="text-[13px] text-slate-500 font-medium">
                        This traveler has not posted any travel photo updates
                        yet.
                      </p>
                    </div>
                  ) : (
                    <>
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {userMemories?.map((post) => (
                          <div key={post._id} className="relative group">
                            <div
                              className="aspect-square bg-slate-100 rounded-3xl overflow-hidden relative shadow-sm cursor-pointer"
                              onClick={() => setSelectedMemory(post)}
                            >
                              {post.mediaType === "video" ||
                              (
                                post.image ||
                                post.mediaUrl ||
                                post.mediaUrls?.[0] ||
                                ""
                              ).match(/\.(mp4|webm|mov)$/i) ? (
                                <video
                                  src={`${
                                    post.image ||
                                    post.mediaUrl ||
                                    post.mediaUrls?.[0]
                                  }#t=0.1`}
                                  muted
                                  loop
                                  playsInline
                                  preload="metadata"
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                              ) : (
                                <img
                                  src={
                                    post.image ||
                                    post.mediaUrl ||
                                    post.mediaUrls?.[0]
                                  }
                                  alt={post.title}
                                  className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                />
                              )}
                              <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-6 text-white text-sm select-none pointer-events-none backdrop-blur-[2px]">
                                <span className="flex items-center gap-1.5 font-bold">
                                  <span className="text-base leading-none">
                                    ✨
                                  </span>{" "}
                                  {post.likes?.length || 0}
                                </span>
                                <span className="flex items-center gap-1.5 font-bold">
                                  <MessageCircle className="w-5 h-5 fill-white" />{" "}
                                  {post.comments?.length || 0}
                                </span>
                              </div>
                            </div>
                            {isOwnProfile && (
                              <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity dropdown-container z-50">
                                <button
                                  className="p-2 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 shadow-sm transition-colors"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    const el =
                                      e.currentTarget.nextElementSibling;
                                    el.classList.toggle("hidden");
                                  }}
                                >
                                  <MoreVertical className="w-4 h-4" />
                                </button>
                                <div className="hidden absolute right-0 mt-2 w-28 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg border border-slate-100/50 py-1.5 z-50 text-xs font-semibold text-slate-700">
                                  <button
                                    className="w-full text-left px-4 py-2 hover:bg-slate-100/50"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.currentTarget.parentElement.classList.add(
                                        "hidden",
                                      );
                                      setEditPostData(post);
                                      setShowEditPostModal(true);
                                    }}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-500"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      e.currentTarget.parentElement.classList.add(
                                        "hidden",
                                      );
                                      setPostToDelete(post);
                                      setShowDeletePostModal(true);
                                    }}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                      {hasMorePosts && userMemories.length >= 30 && (
                        <div className="mt-8 flex justify-center w-full col-span-3">
                          <button
                            onClick={loadMorePosts}
                            disabled={postsLoading}
                            className="px-6 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-full font-semibold text-sm transition-colors flex items-center gap-2"
                          >
                            {postsLoading ? (
                              <div className="w-4 h-4 border-2 border-slate-400 border-t-transparent rounded-full animate-spin"></div>
                            ) : (
                              "Load More"
                            )}
                          </button>
                        </div>
                      )}
                    </>
                  ))}

                {activeTab === "stories" &&
                  (userStories.length === 0 ? (
                    <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-16 text-center select-none shadow-sm">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-sm border border-slate-100">
                        <div className="absolute inset-0 bg-pink-500/5 rounded-full blur-xl animate-pulse"></div>
                        <Activity className="w-10 h-10 text-slate-300 relative z-10" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">
                        No Stories
                      </h3>
                      <p className="text-[13px] text-slate-500 font-medium">
                        You don't have any active stories.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      {userStories?.map((story, index) => (
                        <div
                          key={story._id}
                          className="relative group cursor-pointer"
                          onClick={() => handleOpenStory(index)}
                        >
                          <div className="aspect-[9/16] bg-slate-100 rounded-3xl overflow-hidden relative shadow-sm">
                            {story.mediaType === "video" ? (
                              <video
                                src={`${story.media}#t=0.1`}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                                muted
                                playsInline
                                preload="metadata"
                              />
                            ) : (
                              <img
                                src={story.media}
                                alt="Story"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-6 text-white text-sm select-none pointer-events-none backdrop-blur-[2px]">
                              <span className="flex items-center gap-1.5 font-bold">
                                <span className="text-[18px]">✨</span>{" "}
                                {story.reactions?.length ||
                                  story.storyReactions?.length ||
                                  0}
                              </span>
                            </div>
                          </div>
                          {isOwnProfile && (
                            <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity dropdown-container z-50">
                              <button
                                className="p-2 bg-black/40 backdrop-blur-md text-white rounded-full hover:bg-black/60 shadow-sm transition-colors"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  const el = e.currentTarget.nextElementSibling;
                                  el.classList.toggle("hidden");
                                }}
                              >
                                <MoreVertical className="w-4 h-4" />
                              </button>
                              <div className="hidden absolute right-0 mt-2 w-28 bg-white/90 backdrop-blur-xl rounded-xl shadow-lg border border-slate-100/50 py-1.5 z-50 text-xs font-semibold text-slate-700">
                                <button
                                  className="w-full text-left px-4 py-2 hover:bg-slate-100/50"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.currentTarget.parentElement.classList.add(
                                      "hidden",
                                    );
                                    setEditStoryData(story);
                                    setShowEditStoryModal(true);
                                  }}
                                >
                                  Edit
                                </button>
                                <button
                                  className="w-full text-left px-4 py-2 hover:bg-rose-50 text-rose-500"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    e.currentTarget.parentElement.classList.add(
                                      "hidden",
                                    );
                                    setStoryToDelete(story);
                                    setShowDeleteStoryModal(true);
                                  }}
                                >
                                  Delete
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ))}

                {activeTab === "felt" &&
                  (feltPosts.length === 0 ? (
                    <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-16 text-center select-none shadow-sm">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-sm border border-slate-100">
                        <div className="absolute inset-0 bg-amber-500/10 rounded-full blur-xl animate-pulse"></div>
                        <Star className="w-10 h-10 text-amber-200 fill-amber-100 relative z-10" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">
                        No felt vibes yet ✨
                      </h3>
                      <p className="text-[13px] text-slate-500 font-medium">
                        No travel memories have been felt yet.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-6">
                      <div className="grid grid-cols-3 gap-2 sm:gap-4">
                        {feltPosts.slice(0, 3).map((post) => {
                          let badgeInfo = {
                            icon: <MapPin className="w-3 h-3" />,
                            label: "Travel Memory",
                            bg: "text-rose-600",
                          };
                          if (post.postType === "story")
                            badgeInfo = {
                              icon: <Clapperboard className="w-3 h-3" />,
                              label: "Story",
                              bg: "text-purple-600",
                            };
                          else if (post.postType === "group")
                            badgeInfo = {
                              icon: <Users className="w-3 h-3" />,
                              label: "Travel Group",
                              bg: "text-blue-600",
                            };
                          else if (post.postType === "document")
                            badgeInfo = {
                              icon: <FileText className="w-3 h-3" />,
                              label: "Document",
                              bg: "text-amber-600",
                            };
                          else if (post.postType === "profile_update")
                            badgeInfo = {
                              icon: <User className="w-3 h-3" />,
                              label: "Profile Update",
                              bg: "text-emerald-600",
                            };
                          else if (post.postType === "travel_video")
                            badgeInfo = {
                              icon: <Video className="w-3 h-3" />,
                              label: "Travel Video",
                              bg: "text-indigo-600",
                            };

                          return (
                            <div
                              key={post._id}
                              onClick={() => setSelectedMemory(post)}
                              className="aspect-[3/4] bg-white/80 backdrop-blur-xl rounded-3xl border border-white/50 overflow-hidden relative cursor-pointer group shadow-[0_8px_30px_rgba(0,0,0,0.06)] hover:shadow-[0_12px_40px_rgba(124,58,237,0.12)] hover:-translate-y-1 transition-all duration-300"
                            >
                              {post.mediaType === "video" ||
                              (
                                post.image ||
                                post.mediaUrl ||
                                post.mediaUrls?.[0] ||
                                ""
                              ).match(/\.(mp4|webm|mov)$/i) ? (
                                <video
                                  src={`${
                                    post.image ||
                                    post.mediaUrl ||
                                    post.mediaUrls?.[0]
                                  }#t=0.1`}
                                  muted
                                  loop
                                  playsInline
                                  preload="metadata"
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              ) : (
                                <img
                                  src={
                                    post.image ||
                                    post.mediaUrl ||
                                    post.mediaUrls?.[0]
                                  }
                                  alt={post.title}
                                  className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                                />
                              )}
                              <div className="absolute top-2 left-2 z-10">
                                <div
                                  className={`flex items-center gap-1 px-2 py-1 rounded-full bg-white/90 backdrop-blur-md ${badgeInfo.bg} text-[9px] sm:text-[10px] font-bold shadow-sm`}
                                >
                                  {badgeInfo.icon}
                                  <span className="hidden sm:inline">
                                    {badgeInfo.label}
                                  </span>
                                </div>
                              </div>
                              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex flex-col justify-end p-3">
                                <div className="transform translate-y-4 group-hover:translate-y-0 transition-transform duration-300">
                                  <div className="flex items-center gap-3 text-white/90 text-xs font-semibold">
                                    <div className="flex items-center gap-1">
                                      <span className="text-xs leading-none">
                                        ✨
                                      </span>{" "}
                                      {post.likes?.length ||
                                        post.likesCount ||
                                        0}
                                    </div>
                                    <div className="flex items-center gap-1">
                                      <MessageCircle className="w-3 h-3" />{" "}
                                      {post.comments?.length ||
                                        post.commentsCount ||
                                        0}
                                    </div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                      {feltPosts.length > 3 && (
                        <button
                          onClick={() => navigate("/felt-vibes")}
                          className="w-full py-4 bg-white/80 backdrop-blur-xl hover:bg-purple-50 text-purple-700 text-sm font-extrabold rounded-3xl transition-all duration-300 border border-purple-100 shadow-[0_4px_20px_rgba(124,58,237,0.05)] hover:shadow-[0_8px_30px_rgba(124,58,237,0.1)] flex items-center justify-center gap-2 group"
                        >
                          View All Felt Vibes
                          <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
                        </button>
                      )}
                    </div>
                  ))}

                {activeTab === "trips" &&
                  ((groupFilter === "hosted" ? userTrips : joinedTrips)
                    .length === 0 ? (
                    <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-16 text-center select-none shadow-sm">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-sm border border-slate-100">
                        <div className="absolute inset-0 bg-indigo-500/5 rounded-full blur-xl animate-pulse"></div>
                        <Compass className="w-10 h-10 text-slate-300 relative z-10" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">
                        {groupFilter === "hosted"
                          ? "No Squads Hosted"
                          : "No Squads Joined"}
                      </h3>
                      <p className="text-[13px] text-slate-500 font-medium">
                        This traveler has not hosted any short-term squad trips
                        yet.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {(groupFilter === "hosted"
                        ? userTrips
                        : joinedTrips
                      )?.map((trip) => {
                        const dateFormatted = new Date(
                          trip.startDate,
                        ).toLocaleDateString(undefined, {
                          month: "short",
                          day: "numeric",
                        });
                        const slots = Math.max(
                          0,
                          trip.maxCompanions - (trip.companions?.length || 0),
                        );
                        return (
                          <div
                            key={trip._id}
                            onClick={() =>
                              navigate(`/social/buddy/${trip._id}`)
                            }
                            className="bg-white border border-slate-100/80 p-5 rounded-3xl hover:shadow-md transition-all duration-300 cursor-pointer space-y-3 shadow-sm hover:-translate-y-1"
                          >
                            <div className="flex justify-between items-center select-none">
                              <span className="bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-wider px-3 py-1 rounded-full">
                                {trip.category}
                              </span>
                              <span className="text-[10px] bg-emerald-50 text-emerald-600 font-bold px-3 py-1 rounded-full">
                                {slots} Slots Left
                              </span>
                            </div>
                            <h4 className="text-sm font-bold text-slate-900 truncate leading-tight mt-1">
                              {trip.title}
                            </h4>
                            <div className="flex justify-between items-center text-[12px] text-slate-500 font-medium select-none border-t border-slate-50 pt-3 mt-1">
                              <span className="flex items-center gap-1.5">
                                <MapPin className="w-4 h-4 text-rose-500" />{" "}
                                {trip.destination}
                              </span>
                              <span className="flex items-center gap-1.5">
                                <Calendar className="w-4 h-4" /> {dateFormatted}
                              </span>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ))}

                {activeTab === "journeys" && (
                  <JourneyStatistics userId={profileUser?._id || id} />
                )}

                {activeTab === "saved" &&
                  (savedLoading && savedPosts.length === 0 ? (
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      {[1, 2, 3, 4, 5, 6].map((i) => (
                        <div
                          key={i}
                          className="aspect-square bg-slate-100 dark:bg-slate-800 animate-pulse rounded-3xl shadow-sm border border-slate-100 dark:border-slate-700"
                        ></div>
                      ))}
                    </div>
                  ) : savedPosts.length === 0 ? (
                    <div className="bg-slate-50/50 border border-slate-100 rounded-3xl p-16 text-center select-none shadow-sm">
                      <div className="w-24 h-24 bg-white rounded-full flex items-center justify-center mx-auto mb-6 relative shadow-sm border border-slate-100">
                        <div className="absolute inset-0 bg-primary-600/5 rounded-full blur-xl animate-pulse"></div>
                        <Bookmark className="w-10 h-10 text-slate-300 relative z-10" />
                      </div>
                      <h3 className="text-sm font-bold text-slate-900 mb-1">
                        No Saved Posts
                      </h3>
                      <p className="text-[13px] text-slate-500 font-medium">
                        When you bookmark memories on the explore feed, they
                        will appear here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-3 gap-2 sm:gap-4">
                      {savedPosts.map((post) => (
                        <div key={post._id} className="relative group">
                          <div
                            className="aspect-square bg-slate-100 rounded-3xl overflow-hidden relative shadow-sm cursor-pointer"
                            onClick={() => setSelectedMemory(post)}
                          >
                            {post.mediaType === "video" ||
                            (
                              post.image ||
                              post.mediaUrl ||
                              post.mediaUrls?.[0] ||
                              ""
                            ).match(/\.(mp4|webm|mov)$/i) ? (
                              <video
                                src={`${
                                  post.image ||
                                  post.mediaUrl ||
                                  post.mediaUrls?.[0]
                                }#t=0.1`}
                                muted
                                loop
                                playsInline
                                preload="metadata"
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            ) : (
                              <img
                                src={
                                  post.image ||
                                  post.mediaUrl ||
                                  post.mediaUrls?.[0]
                                }
                                alt={post.title || "Saved memory"}
                                className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                              />
                            )}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-all duration-300 flex items-center justify-center gap-6 text-white text-sm select-none pointer-events-none backdrop-blur-[2px]">
                              <span className="flex items-center gap-1.5 font-bold">
                                <span className="text-base leading-none">
                                  ✨
                                </span>{" "}
                                {post.likes?.length || 0}
                              </span>
                              <span className="flex items-center gap-1.5 font-bold">
                                <MessageCircle className="w-5 h-5 fill-white" />{" "}
                                {post.comments?.length || 0}
                              </span>
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  ))}
              </motion.div>
            </div>
          </div>
        )}
      </div>

      {/* EDIT POST MODAL */}
      <AnimatePresence>
        {showEditPostModal && editPostData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-xl relative z-10"
            >
              <h3 className="text-sm font-black mb-4">Edit Post</h3>
              <form onSubmit={handleEditPost} className="space-y-3">
                <input
                  type="text"
                  placeholder="Location"
                  value={editPostData.location || ""}
                  onChange={(e) =>
                    setEditPostData({
                      ...editPostData,
                      location: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs outline-none focus:border-primary-600"
                />
                <textarea
                  placeholder="Caption"
                  value={editPostData.caption || ""}
                  onChange={(e) =>
                    setEditPostData({
                      ...editPostData,
                      caption: e.target.value,
                    })
                  }
                  rows="3"
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs outline-none focus:border-primary-600 resize-none"
                />
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditPostModal(false)}
                    className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE POST MODAL */}
      <AnimatePresence>
        {showDeletePostModal && postToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-xl relative z-10 text-center"
            >
              <h3 className="text-sm font-black mb-2 text-rose-600">
                Delete Post?
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Are you sure you want to delete this post? This cannot be
                undone.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setShowDeletePostModal(false)}
                  className="px-6 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeletePost}
                  disabled={isSaving}
                  className="px-6 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
                >
                  {isSaving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* EDIT STORY MODAL */}
      <AnimatePresence>
        {showEditStoryModal && editStoryData && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-xl relative z-10"
            >
              <h3 className="text-sm font-black mb-4">Edit Story</h3>
              <form onSubmit={handleEditStory} className="space-y-3">
                <textarea
                  placeholder="Caption"
                  value={editStoryData.caption || ""}
                  onChange={(e) =>
                    setEditStoryData({
                      ...editStoryData,
                      caption: e.target.value,
                    })
                  }
                  rows="2"
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs outline-none focus:border-primary-600 resize-none"
                />
                <select
                  value={editStoryData.captionPosition || "center"}
                  onChange={(e) =>
                    setEditStoryData({
                      ...editStoryData,
                      captionPosition: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs outline-none focus:border-primary-600"
                >
                  <option value="top">Top</option>
                  <option value="center">Center</option>
                  <option value="bottom">Bottom</option>
                </select>
                <select
                  value={editStoryData.captionColor || "white"}
                  onChange={(e) =>
                    setEditStoryData({
                      ...editStoryData,
                      captionColor: e.target.value,
                    })
                  }
                  className="w-full bg-slate-50 border border-slate-150 rounded-xl p-3 text-xs outline-none focus:border-primary-600"
                >
                  <option value="white">White</option>
                  <option value="black">Black</option>
                  <option value="purple">Purple</option>
                </select>
                <div className="flex gap-2 justify-end pt-2">
                  <button
                    type="button"
                    onClick={() => setShowEditStoryModal(false)}
                    className="px-4 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSaving}
                    className="px-4 py-2 bg-primary-600 text-white rounded-xl text-xs font-bold"
                  >
                    {isSaving ? "Saving..." : "Save"}
                  </button>
                </div>
              </form>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* DELETE STORY MODAL */}
      <AnimatePresence>
        {showDeleteStoryModal && storyToDelete && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-xl relative z-10 text-center"
            >
              <h3 className="text-sm font-black mb-2 text-rose-600">
                Delete Story?
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                Are you sure you want to delete this story? This cannot be
                undone.
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setShowDeleteStoryModal(false)}
                  className="px-6 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={handleDeleteStory}
                  disabled={isSaving}
                  className="px-6 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
                >
                  {isSaving ? "Deleting..." : "Delete"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* BLOCK CONFIRMATION MODAL */}
      <AnimatePresence>
        {showBlockModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white p-6 rounded-3xl w-full max-w-sm shadow-xl relative z-10 text-center"
            >
              <h3 className="text-sm font-black mb-2 text-rose-600">
                {isBlockedByMe ? "Unblock User?" : "Block User?"}
              </h3>
              <p className="text-xs text-slate-500 mb-6">
                {isBlockedByMe
                  ? "They will be able to see your profile and interact with you again."
                  : "They won't be able to find your profile, posts, or story on Go YatriGo. They won't be notified that you blocked them."}
              </p>
              <div className="flex gap-2 justify-center">
                <button
                  type="button"
                  onClick={() => setShowBlockModal(false)}
                  className="px-6 py-2 bg-slate-100 rounded-xl text-xs font-bold"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  onClick={() => {
                    handleBlockUser();
                    setShowBlockModal(false);
                  }}
                  className="px-6 py-2 bg-rose-600 text-white rounded-xl text-xs font-bold"
                >
                  {isBlockedByMe ? "Unblock" : "Block"}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* RATE USER MODAL */}
      <AnimatePresence>
        {showRateModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-100 p-6 rounded-3xl w-full max-w-sm shadow-xl relative z-10"
            >
              <h3 className="text-xs font-black text-[#111827] flex items-center gap-2 mb-2 uppercase tracking-wider">
                <Star className="w-5 h-5 text-amber-500 fill-amber-500" /> Rate
                Companion
              </h3>
              <p className="text-[10px] text-slate-400 mb-6 leading-relaxed font-bold">
                Provide travel feedback based on shared route planning, expenses
                sharing, and reliability.
              </p>

              <div className="flex items-center justify-center gap-2 mb-6">
                {[1, 2, 3, 4, 5].map((star) => (
                  <button
                    key={star}
                    type="button"
                    onClick={() => setRatingVal(star)}
                    className="transition-transform active:scale-90"
                  >
                    <Star
                      className={`w-8 h-8 ${
                        star <= ratingVal
                          ? "fill-amber-400 text-amber-400"
                          : "text-slate-200"
                      }`}
                    />
                  </button>
                ))}
              </div>

              <div className="flex gap-2.5 justify-end pt-2 border-t border-slate-50">
                <button
                  type="button"
                  onClick={() => setShowRateModal(false)}
                  className="px-4 py-2.5 bg-slate-50 border border-slate-100 hover:bg-slate-100 rounded-xl text-slate-500 font-extrabold text-[9px] uppercase tracking-widest transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    handleRateUser();
                    setShowRateModal(false);
                  }}
                  className="px-5 py-2.5 bg-primary-600 hover:bg-primary-700 text-white rounded-xl font-extrabold text-[9px] uppercase tracking-widest transition-colors shadow-sm active:scale-95"
                >
                  Submit Rating
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* REPORT SAFETY DIALOG MODAL */}
      <AnimatePresence>
        {showReportModal && (
          <ReportModal
            isOpen={showReportModal}
            onClose={() => setShowReportModal(false)}
            targetId={profileUser?._id}
            targetType="user"
            reportedUserId={profileUser?._id}
          />
        )}
      </AnimatePresence>

      {/* SELECTED POST DETAIL OVERLAY MODAL */}
      <AnimatePresence>
        {selectedMemory && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/90 backdrop-blur-md select-none">
            <button
              onClick={() => setSelectedMemory(null)}
              className="absolute top-6 right-6 p-2 text-white/70 hover:text-white transition-colors z-50 bg-black/20 rounded-full cursor-pointer"
            >
              <X className="w-8 h-8" />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="relative max-w-4xl max-h-[85vh] flex items-center justify-center rounded-2xl overflow-hidden shadow-2xl cursor-pointer"
              onClick={handleImageClick}
            >
              {selectedMemory.mediaType === "video" ||
              (
                selectedMemory.image ||
                selectedMemory.mediaUrl ||
                selectedMemory.mediaUrls?.[0] ||
                ""
              ).match(/\.(mp4|webm|mov)$/i) ? (
                <video
                  src={
                    selectedMemory.image ||
                    selectedMemory.mediaUrl ||
                    selectedMemory.mediaUrls?.[0]
                  }
                  controls
                  autoPlay
                  loop
                  playsInline
                  className="max-w-full max-h-[85vh] object-contain rounded-2xl"
                />
              ) : (
                <img
                  src={
                    selectedMemory.image ||
                    selectedMemory.mediaUrl ||
                    selectedMemory.mediaUrls?.[0]
                  }
                  alt={selectedMemory.title}
                  className="max-w-full max-h-[85vh] object-contain rounded-2xl"
                />
              )}

              <AnimatePresence>
                {likeAnimation && (
                  <motion.div
                    initial={{ opacity: 0, scale: 0.8 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none z-50"
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

              <div className="absolute top-4 left-4 right-16">
                {selectedMemory.music && selectedMemory.music.title && (
                  <div
                    className="flex items-center gap-3 rounded-2xl border border-white/20 bg-black/40 p-2 pr-4 backdrop-blur-md shadow-sm max-w-sm cursor-pointer hover:bg-black/50 transition-colors"
                    onClick={toggleAudio}
                  >
                    <div className="relative h-10 w-10 shrink-0 overflow-hidden rounded-xl">
                      <img
                        loading="lazy"
                        src={selectedMemory.music.cover}
                        alt={selectedMemory.music.title}
                        className={`h-full w-full object-cover ${isPlayingAudio ? "animate-[spin_4s_linear_infinite]" : ""}`}
                      />
                      <div className="absolute inset-0 flex items-center justify-center bg-black/20">
                        <Music className="h-4 w-4 text-white drop-shadow-md" />
                      </div>
                    </div>
                    <div className="flex flex-col overflow-hidden text-white flex-1 min-w-0">
                      <span className="truncate text-xs font-extrabold flex items-center gap-2">
                        {selectedMemory.music.title}
                        {isPlayingAudio && (
                          <div className="music-bars text-white scale-[0.6] transform origin-left">
                            <span></span>
                            <span></span>
                            <span></span>
                          </div>
                        )}
                      </span>
                      <span className="truncate text-[10px] font-semibold text-white/70">
                        {selectedMemory.music.artist}
                      </span>
                    </div>
                    {selectedMemory.music.preview && (
                      <button
                        onClick={toggleAudio}
                        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white text-black shadow-md transition-all hover:scale-105 active:scale-95"
                      >
                        {isPlayingAudio ? (
                          <Pause className="h-4 w-4 fill-current" />
                        ) : (
                          <Play className="h-4 w-4 fill-current ml-0.5" />
                        )}
                      </button>
                    )}
                  </div>
                )}
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  handleLikeMemory(selectedMemory._id);
                  setLikeAnimation(true);
                  setTimeout(() => setLikeAnimation(false), 1150);
                }}
                className="absolute bottom-4 left-4 bg-black/60 hover:bg-black/80 transition-all backdrop-blur-md px-4 py-2 rounded-full flex items-center gap-2 text-white shadow-sm border border-white/20 cursor-pointer active:scale-95"
              >
                <span className="text-[18px] drop-shadow-[0_0_8px_rgba(250,204,21,0.8)] scale-110 transition-transform">
                  ✨
                </span>
                <span className="text-sm font-bold bg-gradient-to-r from-amber-400 to-amber-600 bg-clip-text text-transparent">
                  {selectedMemory.likes?.length || 0} Felt This
                </span>
              </button>
              <audio
                ref={audioRef}
                onEnded={() => setIsPlayingAudio(false)}
                className="hidden"
              />
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* FOLLOWERS / FOLLOWING RELATIONS MODAL */}
      <AnimatePresence>
        {showRelationsModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs select-none">
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-white border border-slate-100 rounded-3xl w-full max-w-md shadow-2xl relative overflow-hidden flex flex-col h-[70vh] max-h-[500px]"
            >
              {/* Header */}
              <div className="flex justify-between items-center px-6 py-4 border-b border-slate-50">
                <h3 className="text-xs font-black text-[#111827] uppercase tracking-wider">
                  {relationsModalType === "followers"
                    ? "Followers"
                    : "Following"}
                </h3>
                <button
                  onClick={() => {
                    setShowRelationsModal(false);
                    setRelationsSearch("");
                  }}
                  className="p-1 hover:bg-slate-50 rounded-full transition-colors text-slate-400 hover:text-[#111827]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {/* Search Bar */}
              <div className="px-6 py-3 border-b border-slate-50">
                <div className="relative flex items-center">
                  <Search className="absolute left-3 w-4 h-4 text-slate-400" />
                  <input
                    type="text"
                    placeholder="Search traveler..."
                    value={relationsSearch}
                    onChange={(e) => setRelationsSearch(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-150 rounded-xl pl-9 pr-4 py-2 text-slate-855 text-xs outline-none focus:border-primary-600 focus:bg-white transition-all shadow-inner font-bold"
                  />
                </div>
              </div>

              {/* List Area */}
              <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar">
                {(() => {
                  if (relationsLoading) {
                    return (
                      <div className="flex justify-center items-center py-12">
                        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary-600"></div>
                      </div>
                    );
                  }

                  const list = relationsList;

                  const filteredList = list.filter(
                    (u) =>
                      (u.name || "")
                        .toLowerCase()
                        .includes(relationsSearch.toLowerCase()) ||
                      (u.username || "")
                        .toLowerCase()
                        .includes(relationsSearch.toLowerCase()),
                  );

                  if (filteredList.length === 0) {
                    return (
                      <div className="text-center py-12">
                        <UserIcon className="w-10 h-10 text-slate-350 mx-auto mb-2" />
                        <p className="text-xs font-black text-slate-400 uppercase tracking-wider">
                          No Travelers Found
                        </p>
                        <p className="text-[10px] text-slate-550 mt-1 font-bold">
                          Try adjusting your search query.
                        </p>
                      </div>
                    );
                  }

                  return filteredList?.map((u) => {
                    const isSelf = u._id === currentUser?._id;
                    const isFollowedByMe = currentUserData?.following?.some(
                      (f) => (f._id || f) === u._id,
                    );

                    return (
                      <div
                        key={u._id}
                        className="flex items-center justify-between gap-4"
                      >
                        <Link
                          to={`/profile/${u._id}`}
                          onClick={() => {
                            setShowRelationsModal(false);
                            setRelationsSearch("");
                          }}
                          className="flex items-center gap-3 min-w-0 flex-1 group"
                        >
                          <img
                            src={getAvatarUrl(u, u.img, u.name)}
                            alt={u.name || "Traveler"}
                            className="w-9 h-9 rounded-full object-cover border border-slate-100 group-hover:scale-102 transition-transform shadow-sm"
                            onError={(e) => {
                              e.target.onerror = null;
                              e.target.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "Explorer")}&background=6C4DF6&color=fff&bold=true`;
                            }}
                          />
                          <div className="min-w-0">
                            <span className="text-[11px] font-black text-[#111827] block leading-none truncate group-hover:text-primary-600 transition-colors flex items-center gap-1">
                              {u.name || "Explorer"}
                            </span>
                            <span className="text-[9px] text-slate-400 font-bold block mt-1 tracking-wider">
                              @{u.username || "explorer"}
                            </span>
                          </div>
                        </Link>

                        {!isSelf && (
                          <button
                            onClick={() => handleFollowToggleForUser(u)}
                            disabled={loadingRelationId === u._id}
                            className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all shadow-sm ${
                              loadingRelationId === u._id
                                ? "opacity-50 cursor-not-allowed"
                                : ""
                            } ${
                              isFollowedByMe
                                ? "border border-primary-600 text-primary-600 bg-transparent hover:bg-primary-600/5"
                                : "bg-primary-600 hover:bg-primary-700 text-white"
                            }`}
                          >
                            {loadingRelationId === u._id
                              ? "..."
                              : isFollowedByMe
                                ? "Unfollow"
                                : "Follow"}
                          </button>
                        )}
                      </div>
                    );
                  });
                })()}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* MOBILE BOTTOM NAVIGATION BAR removed because global Navbar handles it */}

      {/* STORY VIEWER */}
      <AnimatePresence>
        {activeStoryGroup && (
          <StoryViewer
            activeStoryGroup={activeStoryGroup}
            activeStoryIndex={activeStoryIndex}
            myUserId={currentUser?._id}
            isStoryMuted={isStoryMuted}
            setIsStoryMuted={setIsStoryMuted}
            handleDeleteStory={handleDeleteStory}
            setShowViewersList={setShowViewersList}
            isStoryPaused={isStoryPaused}
            setIsStoryPaused={setIsStoryPaused}
            closeStoryViewer={() => setActiveStoryGroup(null)}
            nextStory={nextStory}
            prevStory={prevStory}
            stories={[activeStoryGroup]}
            fetchFeedData={() => {}}
          />
        )}
      </AnimatePresence>

    </div>
  );
};

export default Profile;
