import { useState, useEffect, useContext, useRef, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/authContext";
import { profileService } from "../services/profileService";
import { showToast } from "../utils/showToast";
import AudioManager from "../utils/AudioManager";

export const useProfile = () => {
  const { id } = useParams();
  const { user: currentUser, logout, dispatch } = useContext(AuthContext);
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

  const isOwnProfile = useMemo(() => {
    return (
      !id ||
      id === currentUser?._id ||
      id === currentUser?.id ||
      id?.toString() === (currentUser?._id || currentUser?.id)?.toString()
    );
  }, [id, currentUser?._id, currentUser?.id]);

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

  // Update tab when route/params change
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

  // Lists & Loaders
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

  // Story Viewer
  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);
  const [isStoryMuted, setIsStoryMuted] = useState(true);
  const [isStoryPaused, setIsStoryPaused] = useState(false);
  const [storyReplyText, setStoryReplyText] = useState("");
  const [replyingToStory, setReplyingToStory] = useState(false);
  const [showViewersList, setShowViewersList] = useState(false);

  // Selection Detail
  const [selectedMemory, setSelectedMemory] = useState(null);
  const [likeAnimation, setLikeAnimation] = useState(false);
  const audioRef = useRef(null);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Relations
  const [relationsModalType, setRelationsModalType] = useState("followers");
  const [showRelationsModal, setShowRelationsModal] = useState(false);
  const [relationsSearch, setRelationsSearch] = useState("");
  const [relationsList, setRelationsList] = useState([]);
  const [relationsLoading, setRelationsLoading] = useState(false);
  const [currentUserData, setCurrentUserData] = useState(null);
  const [followLoading, setFollowLoading] = useState(false);
  const [loadingRelationId, setLoadingRelationId] = useState(null);

  const fetchProfile = async () => {
    const targetId = isOwnProfile ? currentUser?._id || currentUser?.id : id;
    if (!targetId) return;

    setLoading(true);
    try {
      const res = await profileService.getProfile(targetId);
      const userData = res.data.user || res.data;
      if (isOwnProfile) userData.canViewContent = true;
      setProfileUser(userData);

      if (currentUser?._id) {
        if (isOwnProfile) {
          setCurrentUserData(userData);
        } else {
          try {
            const selfRes = await profileService.getSelfProfile(currentUser._id);
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
        err.response?.data?.message || "Failed to load user profile"
      );
      navigate("/social/buddy");
    } finally {
      setLoading(false);
    }
  };

  const fetchTabData = async (tab, targetId, force = false) => {
    if (!force && fetchedTabs[tab]) return;

    try {
      if (tab === "posts") {
        setPostsLoading(true);
        const memRes = await profileService.getUserMemories(targetId, 1, 30);
        if (memRes.data.success) {
          setUserMemories(memRes.data.memories || []);
          setHasMorePosts(memRes.data.memories.length === 30);
          setPostsPage(1);
        }
      } else if (tab === "trips") {
        setTripsLoading(true);
        const tripRes = await profileService.getUserTrips(targetId, 50);
        if (tripRes.data.success) {
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
                (c) => (c.userId?._id || c.userId || c._id || c) === targetId
              )
            )
          );
        }
      } else if (tab === "stories" && isOwnProfile) {
        setStoriesLoading(true);
        const storiesRes = await profileService.getUserStories();
        if (storiesRes.data.success) {
          const myStoriesGroup = storiesRes.data.stories.find(
            (g) => g.userId === targetId
          );
          setUserStories(myStoriesGroup ? myStoriesGroup.stories : []);
        }
      } else if (tab === "saved" && isOwnProfile) {
        setSavedLoading(true);
        const savedRes = await profileService.getSavedMemories();
        if (savedRes.data.success) {
          setSavedPosts(savedRes.data.posts || []);
        }
      } else if (tab === "felt") {
        setFeltLoading(true);
        const feltRes = await profileService.getFeltMemories(targetId);
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
      const memRes = await profileService.getUserMemories(targetId, nextPage, 30);
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
        (f) => f._id === currentUser?._id || f === currentUser?._id
      );
      const isRequested = profileUser.followRequests?.some(
        (f) => (f._id || f) === currentUser?._id || (f._id || f) === currentUser?.id
      );
      const endpoint =
        isFollowing || isRequested
          ? `/users/${profileUser._id}/unfollow`
          : `/users/${profileUser._id}/follow`;

      const res = await profileService.followToggle(endpoint);
      if (res.data.success) {
        showToast.success(res.data.message);
        await fetchProfile();
      }
    } catch (err) {
      showToast.error(
        err.response?.data?.message || "Failed to complete action"
      );
    } finally {
      setFollowLoading(false);
    }
  };

  const handleAcceptRequest = async () => {
    try {
      const res = await profileService.acceptFollowRequest(profileUser._id);
      if (res.data.success) {
        showToast.success("Follow request accepted");
        const freshSelf = await profileService.getSelfProfile(currentUser._id);
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
      const res = await profileService.rejectFollowRequest(profileUser._id);
      if (res.data.success) {
        const freshSelf = await profileService.getSelfProfile(currentUser._id);
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
        (f) => (f._id || f) === targetId
      );
      const isRequested = targetUser.followRequests?.some(
        (f) => (f._id || f) === currentUser?._id || (f._id || f) === currentUser?.id
      );
      const endpoint =
        isFollowing || isRequested
          ? `/users/${targetId}/unfollow`
          : `/users/${targetId}/follow`;

      const res = await profileService.followToggle(endpoint);
      if (res.data.success) {
        showToast.success(res.data.message);
        await fetchProfile();
      }
    } catch (err) {
      showToast.error(
        err.response?.data?.message || "Failed to complete action"
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
      const res = await profileService.getRelations(targetId, type);
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
      const res = await profileService.rateUser(profileUser._id, ratingVal);
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
      const res = await profileService.blockToggle(endpoint);
      if (res.data.success) {
        showToast.success(res.data.message);
        const freshSelf = await profileService.getSelfProfile(currentUser._id);
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

  const handleLikeMemory = async (postId) => {
    try {
      const res = await profileService.likeMemory(postId);
      if (res.data.success) {
        setUserMemories((prev) =>
          prev.map((m) =>
            m._id === postId ? { ...m, likes: res.data.memory.likes } : m
          )
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

  const handleEditPost = async (e) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const res = await profileService.editMemory(editPostData._id, {
        caption: editPostData.caption,
        location: editPostData.location,
        tags: editPostData.tags,
      });
      if (res.data.success) {
        showToast.success("Post updated!");
        setUserMemories((prev) =>
          prev.map((p) => (p._id === editPostData._id ? res.data.post : p))
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
      const res = await profileService.deleteMemory(postToDelete._id);
      if (res.data.success) {
        showToast.success("Post deleted!");
        setUserMemories((prev) =>
          prev.filter((p) => p._id !== postToDelete._id)
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
      const res = await profileService.editStory(editStoryData._id, {
        caption: editStoryData.caption,
        captionPosition: editStoryData.captionPosition,
        captionColor: editStoryData.captionColor,
        song: editStoryData.song,
      });
      if (res.data.success) {
        showToast.success("Story updated!");
        setUserStories((prev) =>
          prev.map((s) => (s._id === editStoryData._id ? res.data.story : s))
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
      const res = await profileService.deleteStory(storyToDelete._id);
      if (res.data.success) {
        showToast.success("Story deleted!");
        setUserStories((prev) =>
          prev.filter((s) => s._id !== storyToDelete._id)
        );
        setShowDeleteStoryModal(false);
      }
    } catch (err) {
      showToast.error("Failed to delete story");
    } finally {
      setIsSaving(false);
    }
  };

  // Sync Audio Preview
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
    if (!selectedMemory?.music?.preview) return;
    if (isPlayingAudio) {
      AudioManager.pause(selectedMemory._id);
      setIsPlayingAudio(false);
    } else {
      if (audioRef.current) {
        AudioManager.play(selectedMemory._id, audioRef.current, {
          source: "profile",
        });
        setIsPlayingAudio(true);
      }
    }
  };

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

  useEffect(() => {
    fetchProfile();
  }, [id, currentUser]);

  useEffect(() => {
    const targetId = isOwnProfile ? currentUser?._id || currentUser?.id : id;
    if (targetId && profileUser) {
      fetchTabData(activeTab, targetId, false);
    }
  }, [activeTab]);

  return {
    id,
    currentUser,
    logout,
    navigate,
    isOwnProfile,
    profileUser,
    loading,
    ratingVal,
    setRatingVal,
    reportReason,
    setReportReason,
    showReportModal,
    setShowReportModal,
    showBlockModal,
    setShowBlockModal,
    showRateModal,
    setShowRateModal,
    showProfileMenu,
    setShowProfileMenu,
    activeTab,
    setActiveTab,
    userMemories,
    userTrips,
    joinedTrips,
    userStories,
    savedPosts,
    feltPosts,
    groupFilter,
    setGroupFilter,
    postsLoading,
    tripsLoading,
    storiesLoading,
    savedLoading,
    feltLoading,
    postsPage,
    hasMorePosts,
    showEditPostModal,
    setShowEditPostModal,
    editPostData,
    setEditPostData,
    showDeletePostModal,
    setShowDeletePostModal,
    postToDelete,
    setPostToDelete,
    showEditStoryModal,
    setShowEditStoryModal,
    editStoryData,
    setEditStoryData,
    showDeleteStoryModal,
    setShowDeleteStoryModal,
    storyToDelete,
    setStoryToDelete,
    isSaving,
    activeStoryGroup,
    setActiveStoryGroup,
    activeStoryIndex,
    setActiveStoryIndex,
    isStoryMuted,
    setIsStoryMuted,
    isStoryPaused,
    setIsStoryPaused,
    storyReplyText,
    setStoryReplyText,
    replyingToStory,
    setReplyingToStory,
    showViewersList,
    setShowViewersList,
    selectedMemory,
    setSelectedMemory,
    likeAnimation,
    setLikeAnimation,
    isPlayingAudio,
    setIsPlayingAudio,
    relationsModalType,
    showRelationsModal,
    setShowRelationsModal,
    relationsSearch,
    setRelationsSearch,
    relationsLoading,
    relationsList,
    loadingRelationId,
    currentUserData,
    followLoading,
    audioRef,
    // Methods
    fetchProfile,
    loadMorePosts,
    handleFollowToggle,
    handleAcceptRequest,
    handleDeclineRequest,
    handleFollowToggleForUser,
    openRelationsModal,
    handleRateUser,
    handleBlockUser,
    handleLikeMemory,
    handleEditPost,
    handleDeletePost,
    handleEditStory,
    handleDeleteStory,
    toggleAudio,
    handleOpenStory,
    nextStory,
    prevStory,
  };
};

export default useProfile;
