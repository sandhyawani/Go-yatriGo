import React, { useState, useEffect, useContext } from "react";
import {
Globe,
Sparkles,
Heart,
MessageSquare,
Bookmark,
Share2,
Compass,
MapPin,
Plus,
BookOpen,
Calendar,
Users,
HelpCircle,
ChevronRight,
Eye,
Award,
FileText,
Loader2,
TrendingUp,
MessageCircle,
ThumbsUp } from
"lucide-react";
import { AuthContext } from "../../context/authContext";
import axios from "../../api/axios";
import { showToast } from "../../utils/showToast";
import Avatar from "../../components/common/Avatar";
import CreateTravelMemoryModal from "../../components/modals/CreateTravelMemoryModal";
import CreateDispatchModal from "../../components/modals/CreateDispatchModal";
import { AnimatePresence } from "framer-motion";
import DispatchViewer from "../../components/story/DispatchViewer";
import { getAvatarUrl } from "../../utils/avatar";
import JourneyMatesSuggestions from "../../components/social/JourneyMatesSuggestions";
import RightSidebar from "../../components/home/RightSidebar";

const Community = () => {
  const { user } = useContext(AuthContext);
  const myUserId = user?._id || user?.id;


  const [activeTab, setActiveTab] = useState("posts");


  const [isPostModalOpen, setIsPostModalOpen] = useState(false);
  const [isStoryModalOpen, setIsStoryModalOpen] = useState(false);
  const [showCreateDropdown, setShowCreateDropdown] = useState(false);


  const [activeStoryGroup, setActiveStoryGroup] = useState(null);
  const [activeStoryIndex, setActiveStoryIndex] = useState(0);


  const [dispatches, setStories] = useState([]);
  const [travelMemories, setTravelMemories] = useState([]);
  const [memories, setMemories] = useState([]);
  const [loading, setLoading] = useState(false);


  const [likedPosts, setLikedPosts] = useState({});
  const [bookmarkedPosts, setBookmarkedPosts] = useState({});
  const [postComments, setPostComments] = useState({});
  const [activeCommentPost, setActiveCommentPost] = useState(null);
  const [newCommentText, setNewCommentText] = useState("");


  const [discussionVotes, setDiscussionVotes] = useState({});


  const mockStories = [
  {
    userId: "user-1",
    userName: "Aiko Tanaka",
    userPic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150",
    stories: [
    {
      _id: "story-1",
      media: "https://images.unsplash.com/photo-1493976040374-85c8e12f0c0e?w=800",
      mediaType: "image",
      caption: "Morning light over Kyoto's golden pagoda! 🌸"
    }]

  },
  {
    userId: "user-2",
    userName: "Carlos Santos",
    userPic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150",
    stories: [
    {
      _id: "story-2",
      media: "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?w=800",
      mediaType: "image",
      caption: "Kayaking down the glacial lakes in Patagonia. Pure heaven."
    }]

  },
  {
    userId: "user-3",
    userName: "Elena Petrova",
    userPic: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150",
    stories: [
    {
      _id: "story-3",
      media: "https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?w=800",
      mediaType: "image",
      caption: "Sunset at Santorini, Greece 🌅"
    }]

  }];


  const mockPosts = [
  {
    _id: "post-101",
    userId: {
      _id: "user-1",
      name: "Aiko Tanaka",
      pic: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=150"
    },
    image: "https://images.unsplash.com/photo-1503899036084-c55cdd92da26?w=1000",
    caption: "Stumbling upon hidden temples in Kyoto during the autumn leaf peak. Travel tip: arrive before 7 AM to beat the crowds!",
    destination: "Kyoto, Japan",
    journeyTag: "Kyoto Autumn Expedition",
    likes: ["user-2"],
    commentsCount: 3,
    createdAt: new Date(Date.now() - 3600000 * 2).toISOString()
  },
  {
    _id: "post-102",
    userId: {
      _id: "user-2",
      name: "Carlos Santos",
      pic: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150"
    },
    image: "https://images.unsplash.com/photo-1502784444187-359ac186c5bb?w=1000",
    caption: "Splitting costs makes backpacking across southern Italy so much more viable. Our travel squad just finalized expenses for Amalfi Coast!",
    destination: "Amalfi Coast, Italy",
    journeyTag: "Amalfi Coastal Walk",
    likes: [],
    commentsCount: 1,
    createdAt: new Date(Date.now() - 3600000 * 12).toISOString()
  }];


  const mockMemories = [
  {
    _id: "mem-1",
    title: "Alpine Crossing Completed",
    destination: "Zermatt, Switzerland",
    coverImage: "https://images.unsplash.com/photo-1464822759023-fed622ff2c3b?w=800",
    diarySummary: "A grueling 5-day trekking journey across Switzerland's iconic peaks with a squad of 6 explorers. We successfully split all supplies, checked in safely twice a day, and recorded 48 kilometers of pure wilderness.",
    host: "Marc Dubois",
    companions: 6,
    distance: "48 km",
    rating: 5,
    date: "June 2026"
  },
  {
    _id: "mem-2",
    title: "Spiti Valley Jeep Expedition",
    destination: "Himachal Pradesh, India",
    coverImage: "https://images.unsplash.com/photo-1589308078059-be1415eab4c3?w=800",
    diarySummary: "Successfully navigated the rugged passes of Spiti with our yatri group. The road conditions were challenging, but shared planning in our collaborative workspace got us through perfectly.",
    host: "Aditi Sharma",
    companions: 4,
    distance: "320 km",
    rating: 4.9,
    date: "July 2026"
  }];


  const travelTips = [
  {
    id: "tip-1",
    category: "Cost & Budgeting",
    title: "How to split group expenses without awkwardness",
    content: "Always set a pre-trip deposit budget! Before hitting the road, have every squad member pool ₹5,000 into a shared digital wallet or designate a group treasurer. In Go YatriGo's Journeys workspace, use the shared Expenses Ledger to log costs in real-time. This keeps accounting transparent and hassle-free."
  },
  {
    id: "tip-2",
    category: "Safety Protocols",
    title: "Check-in signals in low network areas",
    content: "When traveling to remote regions like Spiti or Ladakh, cellular network can be sparse. Establish a rule: whenever the squad gains reception, send a check-in ping via Go YatriGo's SOS checklist. It alerts emergency contacts with coordinate updates automatically."
  },
  {
    id: "tip-3",
    category: "Packing Essentials",
    title: "Optimizing backpack weight for squad shares",
    content: "Don't duplicate heavy gears! Before departure, coordinate in the Journeys Checklist tab to allocate group assets. Only one person needs to carry a camping stove, water filters, or first aid kits. It shaves off up to 3kg per person."
  }];


  const discussions = [
  {
    id: "disc-1",
    question: "What is the best trek difficulty for first-time backpackers in Himachal?",
    user: "Rohan Kapoor",
    replies: 12,
    upvotes: 45,
    tags: ["Himachal", "Trekking", "Beginner"]
  },
  {
    id: "disc-2",
    question: "Are international credit cards widely accepted in Kyoto bus transit?",
    user: "Sarah Jenkins",
    replies: 8,
    upvotes: 19,
    tags: ["Kyoto", "Transit", "Solo Travel"]
  },
  {
    id: "disc-3",
    question: "What are the latest road conditions for driving to Leh via Manali highway?",
    user: "Kabir Singh",
    replies: 27,
    upvotes: 83,
    tags: ["Leh Ladakh", "Road Trip", "Safety"]
  }];



  useEffect(() => {
    fetchCommunityFeeds();
  }, []);

  const fetchCommunityFeeds = async () => {
    setLoading(true);
    try {

      const storiesRes = await axios.get("/stories/feed", { withCredentials: true }).catch(() => null);
      if (storiesRes?.data?.success) {
        setStories(storiesRes.data.stories || []);
      } else {
        setStories(mockStories);
      }


      const postsRes = await axios.get("/posts/feed", { withCredentials: true }).catch(() => null);
      if (postsRes?.data?.success) {
        setTravelMemories(postsRes.data.posts || []);
      } else {
        setTravelMemories(mockPosts);
      }


      const journeysRes = await axios.get("/journeys/my", { withCredentials: true }).catch(() => null);
      if (journeysRes?.data?.success) {
        const completed = (journeysRes.data.journeys || []).filter((j) => j.status === "Completed");
        setMemories(completed.length > 0 ? completed : mockMemories);
      } else {
        setMemories(mockMemories);
      }
    } catch (err) {
      console.warn("Failed to load community feeds, serving fallbacks.");
      setStories(mockStories);
      setTravelMemories(mockPosts);
      setMemories(mockMemories);
    } finally {
      setLoading(false);
    }
  };


  const handleLikePost = async (postId) => {
    setLikedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId]
    }));
    showToast.success("Post bookmarked!");
    try {
      await axios.post(`/api/posts/like/${postId}`, {}, { withCredentials: true });
    } catch (e) {

    }
  };


  const handleBookmarkPost = (postId) => {
    setBookmarkedPosts((prev) => ({
      ...prev,
      [postId]: !prev[postId]
    }));
    showToast.success(bookmarkedPosts[postId] ? "Removed from bucket list!" : "Added to travel wishlist!");
  };


  const handleAddComment = (postId) => {
    if (!newCommentText.trim()) return;
    const commentObj = {
      user: user?.name || "You",
      text: newCommentText,
      date: "Just now"
    };
    setPostComments((prev) => ({
      ...prev,
      [postId]: [...(prev[postId] || []), commentObj]
    }));
    setNewCommentText("");
    showToast.success("Comment added!");
  };


  const handleVote = (discId) => {
    setDiscussionVotes((prev) => ({
      ...prev,
      [discId]: (prev[discId] || 0) + 1
    }));
  };


  const handleHighlightClick = (postId) => {
    setActiveTab("posts");
    setTimeout(() => {
      const element = document.getElementById(`post-${postId}`);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
      }
    }, 150);
  };

  return (
    <div className="w-full min-h-[100dvh] bg-[#fafafa] pb-24 lg:pb-8 pt-4">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        
        {}
        <div className="mb-6 flex items-center justify-end gap-4">

          {}
          <div className="relative">
            <button
            onClick={() => setShowCreateDropdown(!showCreateDropdown)}
            className="px-5 py-2.5 bg-brand-600 hover:bg-brand-700 text-white rounded-xl text-xs font-black uppercase tracking-wider transition-all shadow-md shadow-brand-600/10 flex items-center gap-1.5 active:scale-95 duration-200">

              <Plus className="w-4 h-4" /> Create
            </button>

            {showCreateDropdown &&
            <>
                <div
              className="fixed inset-0 z-10"
              onClick={() => setShowCreateDropdown(false)} />

                <div className="absolute right-0 mt-2 w-64 bg-white border border-slate-150 rounded-2xl shadow-xl z-20 focus:outline-none p-2 animate-fade-in origin-top-right">
                  <div className="space-y-1">
                    <button
                  onClick={() => {
                    setShowCreateDropdown(false);
                    setIsStoryModalOpen(true);
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all duration-200">

                      <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center text-emerald-500 shrink-0">
                        <Sparkles className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">📸 Story</p>
                        <p className="text-[10px] text-slate-400 font-medium">Share moments for 24h</p>
                      </div>
                    </button>

                    <button
                  onClick={() => {
                    setShowCreateDropdown(false);
                    setIsPostModalOpen(true);
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all duration-200">

                      <div className="w-8 h-8 rounded-lg bg-brand-50 flex items-center justify-center text-brand-600 shrink-0">
                        <BookOpen className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">📝 Post</p>
                        <p className="text-[10px] text-slate-400 font-medium">Share photos and destinations</p>
                      </div>
                    </button>

                    <button
                  onClick={() => {
                    setShowCreateDropdown(false);
                    showToast.info("Journey Memories are generated automatically when a journey completes. Navigate to your active trip workspace in Journeys to wrap up planning and generate memories!");
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all duration-200">

                      <div className="w-8 h-8 rounded-lg bg-indigo-50 flex items-center justify-center text-indigo-650 shrink-0">
                        <Calendar className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">📖 Journey Memory</p>
                        <p className="text-[10px] text-slate-450 font-medium">Auto-generated from completed trips</p>
                      </div>
                    </button>

                    <button
                  onClick={() => {
                    setShowCreateDropdown(false);
                    showToast.success("Travel Tip shared successfully!");
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all duration-200">

                      <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-amber-500 shrink-0">
                        <FileText className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">💡 Travel Tip</p>
                        <p className="text-[10px] text-slate-400 font-medium">Share budget, gear or safety hacks</p>
                      </div>
                    </button>

                    <button
                  onClick={() => {
                    setShowCreateDropdown(false);
                    showToast.success("Discussion thread opened!");
                  }}
                  className="w-full text-left flex items-center gap-3 px-3 py-2.5 rounded-xl hover:bg-slate-50 transition-all duration-200">

                      <div className="w-8 h-8 rounded-lg bg-rose-50 flex items-center justify-center text-rose-500 shrink-0">
                        <MessageCircle className="w-4 h-4" />
                      </div>
                      <div>
                        <p className="text-xs font-bold text-slate-800">❓ Ask the Community</p>
                        <p className="text-[10px] text-slate-400 font-medium">Start a destination discussion</p>
                      </div>
                    </button>
                  </div>
                </div>
              </>}

          </div>
        </div>

        {}
        <div className="bg-white border border-slate-200/80 rounded-2xl p-1.5 shadow-sm mb-6 flex overflow-x-auto scrollbar-none gap-1">
          {[
          { id: "stories", label: "Dispatches", icon: Sparkles },
          { id: "posts", label: "Travel Posts", icon: BookOpen },
          { id: "memories", label: "Journey Memories", icon: Calendar },
          { id: "tips", label: "Travel Tips", icon: FileText },
          { id: "discussions", label: "Discussions", icon: MessageCircle }].
          map((tab) =>
          <button
          key={tab.id}
          onClick={() => {
            setActiveTab(tab.id);
            setActiveCommentPost(null);
          }}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all shrink-0 ${
          activeTab === tab.id ?
          "bg-brand-50 text-brand-700 shadow-sm" :
          "text-slate-500 hover:text-slate-800 hover:bg-slate-50"
          }`}>

              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? "text-brand-600" : "text-slate-400"}`} />
              {tab.label}
            </button>
          )}
        </div>

        {}
        {loading ?
        <div className="flex justify-center items-center py-32">
            <Loader2 className="w-8 h-8 animate-spin text-brand-600" />
          </div> :

        <div className="space-y-6">
            
            {}
            {activeTab === "stories" &&
          <div className="space-y-6">
                <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-black text-slate-400 uppercase tracking-widest">Active Traveler Stories</h3>
                    <span className="text-[10px] bg-slate-50 border border-slate-100 text-slate-500 px-2 py-0.5 rounded-lg font-bold">24h Expiry</span>
                  </div>
                  
                  {dispatches.length === 0 ?
              <div className="py-12 text-center">
                      <p className="text-sm text-slate-400 font-semibold">No stories uploaded in the last 24 hours.</p>
                      <button
                onClick={() => setIsStoryModalOpen(true)}
                className="mt-4 px-4 py-2 bg-brand-50 hover:bg-brand-100 text-brand-600 text-xs font-bold rounded-lg transition-all">

                        Publish the first story
                      </button>
                    </div> :

              <div className="flex items-center gap-4 overflow-x-auto py-2 scrollbar-none">
                      {dispatches.map((group, idx) =>
                <div
                key={idx}
                onClick={() => {
                  setActiveStoryGroup(group);
                  setActiveStoryIndex(0);
                }}
                className="flex flex-col items-center gap-2 cursor-pointer group shrink-0">

                          <div className="relative w-16 h-16 rounded-full p-[2.5px] bg-gradient-to-tr from-brand-500 to-indigo-500 shadow-sm hover:scale-105 transition-all">
                            <img
                    src={group.userPic || getAvatarUrl(group.userName)}
                    alt={group.userName}
                    className="w-full h-full rounded-full object-cover border-2 border-white bg-slate-50" />

                            <div className="absolute -bottom-1 -right-1 w-5 h-5 bg-brand-600 rounded-full border-2 border-white flex items-center justify-center text-[10px] text-white">
                              ✨
                            </div>
                          </div>
                          <span className="text-[11px] font-bold text-slate-700 group-hover:text-brand-600 transition-colors">
                            {group.userName.split(" ")[0]}
                          </span>
                        </div>
                )}
                    </div>}

                </div>
              </div>}


            {}
            {activeTab === "posts" &&
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_300px] gap-8 items-start">
                
                {}
                <div className="space-y-6">
                  {travelMemories.map((post) => {
                const isLiked = likedPosts[post._id];
                const isBookmarked = bookmarkedPosts[post._id];
                const commentsList = postComments[post._id] || [];

                return (
                  <div key={post._id} id={`post-${post._id}`} className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-card hover:shadow-md transition-all duration-300">
                        {}
                        <div className="p-4 flex items-center justify-between border-b border-slate-100">
                          <div className="flex items-center gap-3">
                            <Avatar src={post.userId?.pic} name={post.userId?.name} size="md" />
                            <div>
                              <span className="text-xs font-black text-slate-800 block hover:underline cursor-pointer">
                                {post.userId?.name}
                              </span>
                              {post.destination &&
                          <span className="text-[10px] text-slate-400 font-semibold flex items-center gap-0.5">
                                  <MapPin className="w-3 h-3 text-slate-350 shrink-0" />
                                  {post.destination}
                                </span>}

                            </div>
                          </div>
                          
                          {}
                          {post.journeyTag &&
                      <span className="bg-brand-50 border border-brand-100 text-brand-700 text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-lg">
                              🎒 {post.journeyTag}
                            </span>}

                        </div>

                        {}
                        <div className="relative aspect-video w-full bg-slate-50 overflow-hidden">
                          <img
                      src={post.image}
                      alt="Post Media"
                      className="w-full h-full object-cover" />

                        </div>

                        {}
                        <div className="px-4 py-3 flex items-center justify-between border-b border-slate-150 bg-slate-50/50">
                          <div className="flex items-center gap-4">
                            <button
                        onClick={() => handleLikePost(post._id)}
                        className={`flex items-center gap-1.5 text-xs font-bold transition-all ${
                        isLiked ? "text-rose-600 scale-105" : "text-slate-500 hover:text-rose-650"
                        }`}>

                              <Heart className={`w-5 h-5 ${isLiked ? "fill-current" : ""}`} />
                              <span>{post.likes.length + (isLiked ? 1 : 0)}</span>
                            </button>
                            
                            <button
                        onClick={() => setActiveCommentPost(activeCommentPost === post._id ? null : post._id)}
                        className="flex items-center gap-1.5 text-xs font-bold text-slate-500 hover:text-brand-600 transition-colors">

                              <MessageSquare className="w-5 h-5" />
                              <span>{post.commentsCount + commentsList.length}</span>
                            </button>
                          </div>

                          <div className="flex items-center gap-3">
                            <button
                        onClick={() => handleBookmarkPost(post._id)}
                        className={`text-slate-500 hover:text-brand-650 transition-colors ${
                        isBookmarked ? "text-brand-600 scale-105" : ""
                        }`}
                        title="Add to Travel Bucket List">

                              <Bookmark className={`w-5 h-5 ${isBookmarked ? "fill-current" : ""}`} />
                            </button>
                            <button className="text-slate-500 hover:text-brand-650 transition-colors" title="Share with external networks">
                              <Share2 className="w-5 h-5" />
                            </button>
                          </div>
                        </div>

                        {}
                        <div className="p-4 space-y-3">
                          <p className="text-xs text-slate-600 font-medium leading-relaxed">
                            <span className="font-extrabold text-slate-900 mr-2">{post.userId?.name}</span>
                            {post.caption}
                          </p>

                          {}
                          {activeCommentPost === post._id &&
                      <div className="border-t border-slate-100 pt-3 space-y-2">
                              <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Comments</span>
                              
                              <div className="space-y-1.5 max-h-36 overflow-y-auto">
                                <div className="text-[11px] text-slate-500">
                                  <span className="font-bold text-slate-700 mr-1.5">Carlos:</span>
                                  Incredible shot! Added this temple to our Kyoto checklist.
                                </div>
                                {commentsList.map((c, i) =>
                          <div key={i} className="text-[11px] text-slate-500">
                                    <span className="font-bold text-slate-700 mr-1.5">{c.user}:</span>
                                    {c.text}
                                  </div>
                          )}
                              </div>

                              {}
                              <div className="flex items-center gap-2 pt-2">
                                <input
                          type="text"
                          placeholder="Write a comment..."
                          value={newCommentText}
                          onChange={(e) => setNewCommentText(e.target.value)}
                          className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3 py-1.5 text-xs font-semibold focus:outline-none focus:border-brand-500 focus:bg-white" />

                                <button
                          onClick={() => handleAddComment(post._id)}
                          className="px-3 py-1.5 bg-brand-50 hover:bg-brand-100 text-brand-600 text-xs font-bold rounded-xl transition-all shrink-0">
                            Travel Memories</button>
                              </div>
                            </div>}

                        </div>
                      </div>);

              })}
                </div>

                {}
                <RightSidebar
            user={user}
            travelMemories={travelMemories}
            onHighlightClick={handleHighlightClick}
            className="space-y-4 lg:sticky lg:top-4" />

              </div>}


            {}
            {activeTab === "memories" &&
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {memories.map((mem) =>
            <div key={mem._id} className="bg-white border border-slate-200/80 rounded-3xl overflow-hidden shadow-card flex flex-col h-full hover:shadow-md transition-all duration-300">
                    <div className="h-48 w-full bg-slate-50 relative shrink-0">
                      <img src={mem.coverImage} alt={mem.title} className="w-full h-full object-cover" />
                      <div className="absolute inset-0 bg-gradient-to-t from-black/45 via-transparent to-transparent"></div>
                      <div className="absolute bottom-4 left-4 text-white">
                        <span className="bg-emerald-500 text-white text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-md">
                          Completed Journey
                        </span>
                        <h3 className="text-base font-extrabold mt-1">{mem.title}</h3>
                        <p className="text-[10px] text-slate-200 font-semibold">{mem.destination}</p>
                      </div>
                    </div>

                    <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                      <p className="text-xs text-slate-500 font-medium leading-relaxed">
                        {mem.diarySummary}
                      </p>

                      <div className="grid grid-cols-3 gap-2 bg-slate-50 border border-slate-100 rounded-xl p-2.5 text-center shrink-0">
                        <div>
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Host</span>
                          <span className="text-[10px] font-bold text-slate-800 block mt-0.5">{mem.host}</span>
                        </div>
                        <div className="border-l border-slate-200">
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Companions</span>
                          <span className="text-[10px] font-bold text-slate-800 block mt-0.5">{mem.companions} travelers</span>
                        </div>
                        <div className="border-l border-slate-200">
                          <span className="text-[9px] text-slate-400 font-black uppercase tracking-wider block">Logged</span>
                          <span className="text-[10px] font-bold text-slate-800 block mt-0.5">{mem.distance || "N/A"}</span>
                        </div>
                      </div>

                      <div className="flex items-center justify-between border-t border-slate-100 pt-3 text-[11px] font-bold">
                        <span className="text-slate-400">Traveled: {mem.date}</span>
                        <span className="text-amber-500">★ {mem.rating}</span>
                      </div>
                    </div>
                  </div>
            )}
              </div>}


            {}
            {activeTab === "tips" &&
          <div className="space-y-4 max-w-3xl mx-auto">
                {travelTips.map((tip) =>
            <div key={tip.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card hover:border-brand-300 transition-colors">
                    <span className="text-[9px] bg-brand-50 border border-brand-100 text-brand-650 font-black uppercase tracking-widest px-2.5 py-1 rounded-md">
                      {tip.category}
                    </span>
                    <h3 className="text-base font-extrabold text-slate-900 mt-2.5">{tip.title}</h3>
                    <p className="text-xs text-slate-500 font-medium mt-2 leading-relaxed">
                      {tip.content}
                    </p>
                  </div>
            )}
              </div>}


            {}
            {activeTab === "discussions" &&
          <div className="space-y-4 max-w-3xl mx-auto">
                {discussions.map((disc) => {
              const votes = discussionVotes[disc.id] || disc.upvotes;
              return (
                <div key={disc.id} className="bg-white border border-slate-200/80 rounded-2xl p-5 shadow-card flex items-start gap-4">
                      {}
                      <button
                  onClick={() => handleVote(disc.id)}
                  className="flex flex-col items-center bg-slate-50 hover:bg-brand-50 border border-slate-150 hover:border-brand-200 px-2.5 py-2 rounded-xl transition-all shrink-0">

                        <ThumbsUp className="w-3.5 h-3.5 text-slate-500 hover:text-brand-600" />
                        <span className="text-xs font-black text-slate-800 mt-1">{votes}</span>
                      </button>

                      {}
                      <div className="flex-1 space-y-1">
                        <h3 className="text-sm font-extrabold text-slate-850 hover:text-brand-600 cursor-pointer transition-colors">
                          {disc.question}
                        </h3>
                        <p className="text-[10px] text-slate-400 font-bold">
                          Asked by <span className="text-slate-655 font-black">{disc.user}</span> • {disc.replies} replies
                        </p>
                        
                        {}
                        <div className="flex flex-wrap gap-1.5 pt-1.5">
                          {disc.tags.map((tag, idx) =>
                      <span key={idx} className="bg-slate-50 border border-slate-100 text-[9px] font-bold text-slate-500 px-2 py-0.5 rounded">
                              {tag}
                            </span>
                      )}
                        </div>
                      </div>
                    </div>);

            })}
              </div>}


          </div>}


      </div>

      {}
      <AnimatePresence>
        {activeStoryGroup &&
        <DispatchViewer
        activeStoryGroup={activeStoryGroup}
        activeStoryIndex={activeStoryIndex}
        myUserId={myUserId}
        isStoryMuted={false}
        setIsStoryMuted={() => {}}
        handleDeleteStory={() => {}}
        setShowViewersList={() => {}}
        isStoryPaused={false}
        setIsStoryPaused={() => {}}
        closeStoryViewer={() => setActiveStoryGroup(null)}
        nextStory={() => {
          if (activeStoryIndex < activeStoryGroup.stories.length - 1) {
            setActiveStoryIndex((prev) => prev + 1);
          } else {
            setActiveStoryGroup(null);
          }
        }}
        prevStory={() => {
          if (activeStoryIndex > 0) {
            setActiveStoryIndex((prev) => prev - 1);
          }
        }}
        dispatches={[activeStoryGroup]}
        fetchFeedData={fetchCommunityFeeds} />}


      </AnimatePresence>

      {}
      <CreateTravelMemoryModal
      isOpen={isPostModalOpen}
      onClose={() => setIsPostModalOpen(false)}
      onSuccess={fetchCommunityFeeds}
      user={user} />

      
      <CreateDispatchModal
      isOpen={isStoryModalOpen}
      onClose={() => setIsStoryModalOpen(false)}
      onSuccess={fetchCommunityFeeds}
      user={user} />


    </div>);

};

export default Community;