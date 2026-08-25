const mongoose = require("mongoose");
const Post = require("../models/Post");
const User = require("../models/User");
const Comment = require("../models/Comment");
const SavedPost = require("../models/SavedPost");
const Notification = require("../models/Notification");
const TravelGroup = require("../models/TravelGroup");
const Journey = require("../models/Journey");
const Story = require("../models/Story");
const { canInteractWithContent } = require("../utils/privacyHelper");
const {
  isBlockedPair,
  getBlockedUserIds,
  getBlockFilter
} = require("../utils/blockHelper");

exports.createMemory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const {
      caption,
      img,
      image,
      mediaUrl,
      mediaUrls,
      mediaType,
      location,
      tags,
      journeyId,
      title,
      music,
      disableComments,
      hideLikes
    } = req.body;

    const primaryMediaUrl = mediaUrl || image || img || "";
    const normalizedMediaUrls = Array.isArray(mediaUrls) && mediaUrls.length > 0 ?
      mediaUrls :
      primaryMediaUrl ? [primaryMediaUrl] :
      [];
    const userName = req.user.name || req.user.username || "Traveler";
    const userPic =
      req.user.profilePic ||
      req.user.pic ||
      req.user.img ||
      req.user.avatar ||
      "";

    if (!primaryMediaUrl && !caption) {
      return res.status(400).json({
        success: false,
        message: "Caption or image is required"
      });
    }

    const post = new Post({
      userId,
      userName,
      userPic,
      caption: caption || "",
      title: title || "",
      image: primaryMediaUrl,
      mediaUrl: primaryMediaUrl,
      mediaUrls: normalizedMediaUrls,
      mediaType: mediaType || "image",
      music: music || undefined,
      location: typeof location === "string" ? location.trim() : "",
      tags: Array.isArray(tags) ? tags : [],
      journeyId: journeyId || null,
      disableComments: Boolean(disableComments),
      hideLikes: Boolean(hideLikes)
    });

    await post.save();

    const populatedPost = await Post.findById(post._id).populate(
      "userId",
      "name username pic img avatar"
    );

    res.status(201).json({
      success: true,
      memory: populatedPost,
      post: populatedPost
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getAllMemories = async (req, res) => {
  const reqStartTime = Date.now();
  try {
    res.set("Cache-Control", "no-store");
    const authUserId = req.user ? (req.user._id || req.user.id) : null;
    const {
      userId: filterUserId,
      page = 1,
      limit = 12
    } = req.query;

    const pageNum = Math.max(1, parseInt(page, 10) || 1);
    const pageLimit = Math.max(1, Math.min(100, parseInt(limit, 10) || 12));
    const skip = (pageNum - 1) * pageLimit;

    let query = {};
    let authCheckDuration = 0;

    if (filterUserId) {
      if (!mongoose.Types.ObjectId.isValid(filterUserId)) {
        return res.status(400).json({
          success: false,
          message: "Invalid user ID"
        });
      }

      const isSelf = authUserId && authUserId.toString() === filterUserId.toString();

      if (isSelf) {
        // Direct query for own profile without redundant block/privacy DB roundtrips
        query.userId = new mongoose.Types.ObjectId(filterUserId);
      } else {
        const authCheckStart = Date.now();
        const isBlocked = authUserId ? await isBlockedPair(authUserId, filterUserId) : false;
        if (isBlocked) {
          return res.status(200).json({
            success: true,
            memories: [],
            totalMemories: 0,
            hasMore: false,
            pagination: {
              total: 0,
              page: pageNum,
              limit: pageLimit,
              hasMore: false
            }
          });
        }

        const targetUser = await User.findById(filterUserId)
          .lean()
          .select("privateAccount isPrivate followers");

        if (!targetUser) {
          return res.status(404).json({
            success: false,
            message: "User not found"
          });
        }

        const isFollower =
          authUserId &&
          Array.isArray(targetUser.followers) &&
          targetUser.followers.some(
            (f) => f.toString() === authUserId.toString()
          );

        const isPrivate = targetUser.privateAccount || targetUser.isPrivate;
        if (isPrivate && !isFollower && (!req.user || !req.user.isAdmin)) {
          return res.status(200).json({
            success: true,
            memories: [],
            totalMemories: 0,
            hasMore: false,
            pagination: {
              total: 0,
              page: pageNum,
              limit: pageLimit,
              hasMore: false
            }
          });
        }
        authCheckDuration = Date.now() - authCheckStart;
        query.userId = new mongoose.Types.ObjectId(filterUserId);
      }
    } else if (authUserId) {
      const feedStart = Date.now();
      const user = await User.findById(authUserId)
        .lean()
        .select("following blockedUsers");

      const followingList =
        user && Array.isArray(user.following) ? user.following : [];

      const validFollowing = followingList
        .filter((id) => mongoose.Types.ObjectId.isValid(id))
        .map((id) => new mongoose.Types.ObjectId(id));

      const { objectIds: allBlockedIds } = await getBlockedUserIds(authUserId);

      query = {
        userId: {
          $in: [...validFollowing, new mongoose.Types.ObjectId(authUserId)],
          $nin: allBlockedIds
        }
      };
      authCheckDuration = Date.now() - feedStart;
    }

    const queryStartTime = Date.now();
    const [totalMemoryCount, posts] = await Promise.all([
      Post.countDocuments(query),
      Post.find(query)
        .select("_id userId userName userPic title caption location tags image mediaUrl mediaUrls mediaType music likes comments createdAt")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(pageLimit)
        .populate("userId", "name username pic avatar isVerified")
        .lean()
    ]);
    const queryDuration = Date.now() - queryStartTime;

    const formattedPosts = posts.map((post) => ({
      ...post,
      likes: Array.isArray(post.likes) ? post.likes : [],
      likesCount: Array.isArray(post.likes) ? post.likes.length : (post.likesCount || 0),
      comments: Array.isArray(post.comments) ? post.comments : [],
      commentsCount: Array.isArray(post.comments) ? post.comments.length : (post.commentsCount || 0)
    }));

    const hasMore = skip + formattedPosts.length < totalMemoryCount;

    return res.status(200).json({
      success: true,
      memories: formattedPosts,
      totalMemories: totalMemoryCount,
      hasMore,
      pagination: {
        total: totalMemoryCount,
        page: pageNum,
        limit: pageLimit,
        hasMore
      }
    });
  } catch (error) {
    console.error("getAllMemories error:", error);
    return res.status(500).json({
      success: false,
      message: error.message || "Failed to retrieve memories"
    });
  }
};

exports.getMemoryById = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id)
      .populate("userId", "name username pic img avatar isVerified")
      .populate({
        path: "comments",
        populate: { path: "userId", select: "name username pic img avatar" }
      });

    if (!post) {
      return res.status(404).json({ success: false, message: "Memory not found" });
    }

    const isAllowed = await canInteractWithContent(post.userId, req.user);
    if (!isAllowed) {
      return res.status(403).json({ success: false, message: "Forbidden: Access denied to private content." });
    }

    res.status(200).json({
      success: true,
      memory: post,
      post
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.toggleLikeMemory = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
      return res.status(400).json({ success: false, message: "Invalid ID format" });
    }

    let post = await Post.findById(req.params.id);

    // Fallback: in case a TravelGroup or Journey ID was passed to memory like
    if (!post) {
      let trip = await TravelGroup.findById(req.params.id);
      if (!trip) {
        trip = await Journey.findById(req.params.id);
      }
      if (trip) {
        if (!Array.isArray(trip.likes)) {
          trip.likes = [];
        }
        const hasLiked = trip.likes.some(
          (id) => (id?._id || id)?.toString() === userId
        );
        if (hasLiked) {
          trip.likes = trip.likes.filter(
            (id) => (id?._id || id)?.toString() !== userId
          );
        } else {
          trip.likes.push(new mongoose.Types.ObjectId(userId));
        }
        await trip.save();
        return res.status(200).json({
          success: true,
          isLiked: !hasLiked,
          likesCount: trip.likes.length,
          likes: trip.likes,
          memory: trip,
          post: trip
        });
      }
    }

    if (!post) {
      return res.status(404).json({ success: false, message: "Memory not found" });
    }

    const isAllowed = await canInteractWithContent(post.userId, req.user);
    if (!isAllowed) {
      return res.status(403).json({ success: false, message: "Forbidden: Cannot interact with this content." });
    }

    if (!Array.isArray(post.likes)) {
      post.likes = [];
    }

    const hasLiked = post.likes.some(
      (id) => (id?._id || id)?.toString() === userId
    );

    if (hasLiked) {
      post.likes = post.likes.filter(
        (id) => (id?._id || id)?.toString() !== userId
      );
    } else {
      post.likes.push(new mongoose.Types.ObjectId(userId));
    }

    await post.save();

    if (!hasLiked && post.userId.toString() !== userId) {
      const senderUser = await User.findById(userId);
      if (senderUser) {
        await Notification.create({
          sender: userId,
          receiver: post.userId,
          type: "post_like",
          post: post._id,
          message: `${senderUser.name || senderUser.username || "Someone"} liked your Travel Memory`
        }).catch((err) => console.error("Notification creation error:", err));
      }
    }

    res.status(200).json({
      success: true,
      isLiked: !hasLiked,
      likesCount: post.likes.length,
      likes: post.likes,
      memory: post,
      post
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.commentOnMemory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Comment text cannot be empty" });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({ success: false, message: "Memory not found" });
    }

    const isAllowed = await canInteractWithContent(post.userId, req.user);
    if (!isAllowed) {
      return res.status(403).json({ success: false, message: "Forbidden: Cannot interact with this content." });
    }

    const currentUser = await User.findById(userId);

    const comment = new Comment({
      postId: post._id,
      userId,
      userName: currentUser.name,
      userPic: currentUser.pic || currentUser.avatar || "",
      text: text.trim()
    });

    await comment.save();

    post.comments.push(comment._id);
    await post.save();

    if (post.userId.toString() !== userId.toString()) {
      await Notification.create({
        sender: userId,
        receiver: post.userId,
        type: "post_comment",
        post: post._id,
        message: `${currentUser.name || currentUser.username} commented on your Travel Memory`
      });
    }

    res.status(201).json({
      success: true,
      comment: {
        ...comment.toObject(),
        userId: { name: currentUser.name, pic: currentUser.pic || currentUser.avatar }
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteComment = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const { postId, commentId } = req.params;

    const comment = await Comment.findById(commentId);
    if (!comment) {
      return res.status(404).json({ success: false, message: "Comment not found" });
    }

    const post = await Post.findById(postId);

    const isCommentAuthor = comment.userId.toString() === userId;
    const isPostOwner = post && post.userId.toString() === userId;

    if (!isCommentAuthor && !isPostOwner && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this comment" });
    }

    await Comment.findByIdAndDelete(commentId);

    if (post) {
      post.comments = post.comments.filter((cId) => cId.toString() !== commentId.toString());
      await post.save();
    }

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.savePost = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const postId = req.params.id;

    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({ success: false, message: "Memory not found" });
    }

    let saved = await SavedPost.findOne({ userId, postId });
    if (!saved) {
      saved = new SavedPost({ userId, postId });
      await saved.save();
    }

    res.status(200).json({
      success: true,
      message: "Post saved successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.unsavePost = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const postId = req.params.id;

    await SavedPost.deleteOne({ userId, postId });

    res.status(200).json({
      success: true,
      message: "Post removed from saved"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getSavedPosts = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const savedDocs = await SavedPost.find({ userId }).populate({
      path: "postId",
      populate: { path: "userId", select: "name username pic img avatar" }
    });

    const posts = savedDocs.map((doc) => doc.postId).filter(Boolean);

    res.status(200).json({
      success: true,
      posts,
      memories: posts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMemory = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Memory not found" });
    }

    if (post.userId.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this memory" });
    }

    await Post.findByIdAndDelete(req.params.id);
    await Comment.deleteMany({ postId: req.params.id });
    await SavedPost.deleteMany({ postId: req.params.id });

    res.status(200).json({
      success: true,
      message: "Memory deleted successfully"
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateMemory = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({ success: false, message: "Memory not found" });
    }

    if (post.userId.toString() !== userId && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to update this memory" });
    }

    if (req.body.caption !== undefined) post.caption = req.body.caption;
    if (req.body.location !== undefined) post.location = typeof req.body.location === "string" ? req.body.location.trim() : "";
    if (req.body.title !== undefined) post.title = req.body.title;
    if (req.body.tags !== undefined && Array.isArray(req.body.tags)) post.tags = req.body.tags;

    // Normalize cover/image fields
    const newCoverUrl = req.body.coverImage || req.body.image || req.body.mediaUrl || req.body.img;
    if (newCoverUrl) {
      post.image = newCoverUrl;
      post.mediaUrl = newCoverUrl;
      post.img = newCoverUrl;

      if (Array.isArray(post.mediaUrls) && post.mediaUrls.length > 0) {
        post.mediaUrls[0] = newCoverUrl;
      } else {
        post.mediaUrls = [newCoverUrl];
      }
    }

    if (req.body.mediaUrls !== undefined && Array.isArray(req.body.mediaUrls)) {
      post.mediaUrls = req.body.mediaUrls;
      if (req.body.mediaUrls.length > 0) {
        post.image = req.body.mediaUrls[0];
        post.mediaUrl = req.body.mediaUrls[0];
        post.img = req.body.mediaUrls[0];
      }
    }

    await post.save();

    const populatedPost = await Post.findById(post._id)
      .populate("userId", "name username pic img avatar isVerified")
      .populate({
        path: "comments",
        populate: { path: "userId", select: "name username pic img avatar" }
      })
      .lean();

    const normalizedPost = {
      ...populatedPost,
      image: populatedPost.image || populatedPost.mediaUrl || (populatedPost.mediaUrls?.[0]) || "",
      mediaUrl: populatedPost.mediaUrl || populatedPost.image || (populatedPost.mediaUrls?.[0]) || "",
      mediaUrls: populatedPost.mediaUrls?.length > 0 ? populatedPost.mediaUrls : [populatedPost.image || populatedPost.mediaUrl].filter(Boolean),
      likes: Array.isArray(populatedPost.likes) ? populatedPost.likes : [],
      likesCount: Array.isArray(populatedPost.likes) ? populatedPost.likes.length : (populatedPost.likesCount || 0),
      comments: Array.isArray(populatedPost.comments) ? populatedPost.comments : [],
      commentsCount: Array.isArray(populatedPost.comments) ? populatedPost.comments.length : (populatedPost.commentsCount || 0)
    };

    res.status(200).json({
      success: true,
      memory: normalizedPost,
      post: normalizedPost
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getLikedPosts = async (req, res) => {
  try {
    const userId = (req.user._id || req.user.id).toString();
    const { idSet: blockedIdSet } = await getBlockedUserIds(userId);

    const posts = await Post.find({
      likes: userId,
      ...(blockedIdSet.size > 0 ? { userId: { $nin: Array.from(blockedIdSet).map(id => new mongoose.Types.ObjectId(id)) } } : {})
    }).populate(
      "userId",
      "name username pic img avatar"
    );

    res.status(200).json({
      success: true,
      posts,
      memories: posts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getMemoryComments = async (req, res) => {
  try {
    const comments = await Comment.find({ postId: req.params.id })
      .populate("userId", "name username pic img avatar")
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      comments
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFeltVibesCollection = async (req, res) => {
  try {
    const authUserId = (req.user._id || req.user.id).toString();
    const { idSet: blockedIdSet } = await getBlockedUserIds(authUserId);
    const blockedObjectIds = Array.from(blockedIdSet).map(id => new mongoose.Types.ObjectId(id));

    const [likedPosts, likedGroups, likedJourneys, reactedStories] = await Promise.all([
      Post.find({
        likes: authUserId,
        ...(blockedObjectIds.length > 0 ? { userId: { $nin: blockedObjectIds } } : {})
      })
        .populate("userId", "name username pic img avatar privateAccount isPrivate followers")
        .sort({ createdAt: -1 })
        .lean(),
      TravelGroup.find({
        likes: authUserId,
        ...(blockedObjectIds.length > 0 ? { host: { $nin: blockedObjectIds } } : {})
      })
        .populate("host", "name username pic img avatar isVerified")
        .sort({ createdAt: -1 })
        .lean(),
      Journey.find({
        likes: authUserId,
        ...(blockedObjectIds.length > 0 ? { creator: { $nin: blockedObjectIds } } : {})
      })
        .populate("creator", "name username pic img avatar isVerified")
        .sort({ createdAt: -1 })
        .lean(),
      Story.find({
        $or: [
          { "reactions.user": authUserId },
          { views: authUserId },
          { likes: authUserId }
        ],
        ...(blockedObjectIds.length > 0 ? { user: { $nin: blockedObjectIds } } : {})
      })
        .populate("user", "name username pic img avatar isVerified")
        .sort({ createdAt: -1 })
        .lean()
    ]);

    const formattedPosts = (likedPosts || []).map(p => ({
      _id: p._id,
      title: p.title || p.caption?.substring(0, 50) || "Travel Memory",
      caption: p.caption || "",
      location: p.location || "",
      mediaUrl: p.mediaUrl || p.image || (Array.isArray(p.mediaUrls) ? p.mediaUrls[0] : "") || "",
      mediaUrls: p.mediaUrls && p.mediaUrls.length > 0 ? p.mediaUrls : (p.mediaUrl || p.image ? [p.mediaUrl || p.image] : []),
      mediaType: p.mediaType || "image",
      postType: p.postType || "travel_memory",
      type: "memory",
      likesCount: Array.isArray(p.likes) ? p.likes.length : 0,
      commentsCount: Array.isArray(p.comments) ? p.comments.length : 0,
      author: p.userId || { name: p.userName || "Traveler", pic: p.userPic || "" },
      createdAt: p.createdAt
    }));

    const formattedGroups = (likedGroups || []).map(g => ({
      _id: g._id,
      title: g.title || "Travel Group",
      caption: g.description || "",
      location: g.destination || g.from || "",
      mediaUrl: g.coverImage || "",
      mediaUrls: g.coverImage ? [g.coverImage] : [],
      mediaType: "image",
      postType: "group",
      type: "group",
      likesCount: Array.isArray(g.likes) ? g.likes.length : 0,
      commentsCount: 0,
      author: g.host || { name: "Host", pic: "" },
      createdAt: g.createdAt
    }));

    const formattedJourneys = (likedJourneys || []).map(j => ({
      _id: j._id,
      title: j.title || "Journey",
      caption: j.description || "",
      location: j.destination || j.from || "",
      mediaUrl: j.coverImage || "",
      mediaUrls: j.coverImage ? [j.coverImage] : [],
      mediaType: "image",
      postType: "group",
      type: "group",
      likesCount: Array.isArray(j.likes) ? j.likes.length : 0,
      commentsCount: 0,
      author: j.creator || { name: "Creator", pic: "" },
      createdAt: j.createdAt
    }));

    const formattedStories = (reactedStories || []).map(s => ({
      _id: s._id,
      title: s.title || s.caption || "Dispatch Story",
      caption: s.caption || "",
      location: s.location || "",
      mediaUrl: s.mediaUrl || s.image || "",
      mediaUrls: s.mediaUrl || s.image ? [s.mediaUrl || s.image] : [],
      mediaType: s.mediaType || "image",
      postType: "story",
      type: "story",
      likesCount: Array.isArray(s.likes) ? s.likes.length : (Array.isArray(s.reactions) ? s.reactions.length : 0),
      commentsCount: 0,
      author: s.user || { name: "Traveler", pic: "" },
      createdAt: s.createdAt
    }));

    const combined = [
      ...formattedPosts,
      ...formattedGroups,
      ...formattedJourneys,
      ...formattedStories
    ].sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));

    res.status(200).json({
      success: true,
      feltVibes: combined,
      collection: combined,
      posts: combined
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.getFeltPostsByUserId = async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const authUserId = req.user._id || req.user.id;

    if (!targetUserId || targetUserId === "undefined" || !mongoose.Types.ObjectId.isValid(targetUserId)) {
      return res.status(200).json({ success: true, posts: [], memories: [] });
    }

    const isBlocked = await isBlockedPair(authUserId, targetUserId);
    if (isBlocked) {
      return res.status(200).json({ success: true, posts: [], memories: [] });
    }

    const targetUser = await User.findById(targetUserId).lean();
    if (!targetUser) {
      return res.status(404).json({ success: false, message: "User not found", posts: [], memories: [] });
    }

    const isSelf = authUserId.toString() === targetUserId.toString();
    const isFollower = Array.isArray(targetUser.followers) &&
      targetUser.followers.some((f) => f.toString() === authUserId.toString());
    const isPrivate = targetUser.privateAccount || targetUser.isPrivate;

    if (!isSelf && !isFollower && isPrivate && !req.user.isAdmin) {
      return res.status(200).json({ success: true, posts: [], memories: [] });
    }

    const posts = await Post.find({ likes: targetUserId })
      .populate("userId", "name username pic img avatar isVerified")
      .sort({ createdAt: -1 })
      .lean();

    const formattedPosts = (posts || []).map((post) => ({
      ...post,
      likes: Array.isArray(post.likes) ? post.likes : [],
      likesCount: Array.isArray(post.likes) ? post.likes.length : (post.likesCount || 0),
      comments: Array.isArray(post.comments) ? post.comments : [],
      commentsCount: Array.isArray(post.comments) ? post.comments.length : (post.commentsCount || 0)
    }));

    res.status(200).json({
      success: true,
      posts: formattedPosts,
      memories: formattedPosts
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message, posts: [], memories: [] });
  }
};
