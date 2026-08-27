const Story = require("../models/Story");
const User = require("../models/User");
const Notification = require("../models/Notification");
const ChatRoom = require("../models/ChatRoom");
const Message = require("../models/Message");
const { canInteractWithContent } = require("../utils/privacyHelper");
const { isBlockedPair, getBlockedUserIds } = require("../utils/blockHelper");

const parseJSONField = (field, fallback) => {
  if (!field) return fallback;
  if (typeof field === "object") return field;
  try {
    return JSON.parse(field);
  } catch (e) {
    return fallback;
  }
};

exports.createStory = async (req, res) => {
  try {
    const userId = req.user?._id || req.user?.id;
    if (!userId) {
      return res.status(401).json({
        success: false,
        message: "Not authorized. Please log in to share a Dispatch."
      });
    }

    let user = req.user;
    if (!user || !user.name) {
      user = await User.findById(userId);
    }

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found."
      });
    }

    let mediaUrl = req.body.media || req.body.img || req.body.image || req.body.mediaUrl || "";

    if (req.file) {
      mediaUrl = req.file.path || req.file.secure_url || req.file.url;
    } else if (req.files) {
      const file =
        req.files.media?.[0] ||
        req.files.image?.[0] ||
        req.files.file?.[0] ||
        (Array.isArray(req.files) ? req.files[0] : null);
      if (file) {
        mediaUrl = file.path || file.secure_url || file.url;
      }
    }

    if (!mediaUrl && (req.body.text || req.body.type === "text")) {
      const bgColor = req.body.bgColor || req.body.textBgColor || "#7C3AED";
      const textColor = req.body.textColor || "#FFFFFF";
      const rawText = (req.body.text || req.body.caption || "").trim();
      const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1920" viewBox="0 0 1080 1920"><rect width="100%" height="100%" fill="${bgColor}"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" fill="${textColor}" font-size="48" font-family="system-ui, -apple-system, sans-serif" font-weight="bold">${rawText}</text></svg>`;
      mediaUrl = `data:image/svg+xml;utf8,${encodeURIComponent(svg)}`;
    }

    if (!mediaUrl) {
      return res.status(400).json({
        success: false,
        message: "Media file or URL is required to post a Dispatch"
      });
    }

    const lowerMedia = mediaUrl.toLowerCase();
    const mediaType =
      req.body.mediaType ||
      (lowerMedia.match(/\.(mp4|webm|ogg|mov|avi|flv|mkv|3gp)$/) || lowerMedia.includes("video")
        ? "video"
        : "image");

    const userName = (user.name || user.username || user.fullname || "Traveler").trim();
    const userPic = user.pic || user.avatar || user.profilePic || user.profilePicture || "";

    const caption = req.body.caption || req.body.text || "";
    const captionPosition = ["top", "center", "bottom"].includes(req.body.captionPosition)
      ? req.body.captionPosition
      : "center";
    const captionColor = req.body.captionColor || req.body.textColor || "white";
    const location = (req.body.location || "").trim();
    const visibility = ["public", "private", "friends"].includes(req.body.visibility)
      ? req.body.visibility
      : "public";

    const allowedUsers = parseJSONField(req.body.allowedUsers, []);
    const hiddenFrom = parseJSONField(req.body.hiddenFrom, []);
    const song = parseJSONField(req.body.song, undefined);
    const stickers = parseJSONField(req.body.stickers, []);
    const journeyId = req.body.journeyId || null;
    const duration = Number(req.body.duration) || 24;
    const expiresAt = new Date(Date.now() + duration * 60 * 60 * 1000);

    const story = new Story({
      userId: user._id,
      userName,
      userPic,
      media: mediaUrl,
      mediaType,
      caption,
      captionPosition,
      captionColor,
      visibility,
      journeyId,
      allowedUsers,
      hiddenFrom,
      song,
      location,
      stickers,
      expiresAt
    });

    await story.save();

    const populatedStory = await Story.findById(story._id).populate(
      "userId",
      "name username pic img avatar profilePic profilePicture isVerified"
    );

    res.status(201).json({
      success: true,
      message: "Dispatch created successfully",
      story: populatedStory
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getActiveStories = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const user = await User.findById(userId);

    const { idSet: blockedIdSet } = await getBlockedUserIds(userId);

    let query = {
      expiresAt: { $gt: new Date() }
    };

    if (req.query.userId) {
      const targetUserId = req.query.userId;
      if (blockedIdSet.has(targetUserId.toString())) {
        return res.status(200).json({
          success: true,
          stories: []
        });
      }
      query.userId = targetUserId;
    } else {
      const following = user ? user.following || [] : [];
      const allowedUserIds = [...following, userId].filter(
        (id) => !blockedIdSet.has(id.toString())
      );
      query.userId = { $in: allowedUserIds };
    }

    const rawStories = await Story.find(query)
      .populate("userId", "name username pic img avatar profilePic profilePicture isVerified")
      .sort({ createdAt: -1 });

    const currentUserIdStr = userId.toString();

    const visibleStories = rawStories.filter((story) => {
      const authorId = (story.userId?._id || story.userId)?.toString();
      if (!authorId) return false;
      if (blockedIdSet.has(authorId)) return false;

      if (authorId === currentUserIdStr) return true;

      if (
        story.hiddenFrom &&
        story.hiddenFrom.some((h) => (h?._id || h).toString() === currentUserIdStr)
      ) {
        return false;
      }

      if (story.visibility === "private") {
        return (
          story.allowedUsers &&
          story.allowedUsers.some((u) => (u?._id || u).toString() === currentUserIdStr)
        );
      }

      return true;
    });

    const groupsMap = new Map();

    for (const story of visibleStories) {
      const authorDoc =
        story.userId && typeof story.userId === "object" ? story.userId : null;
      const authorIdStr = (authorDoc?._id || story.userId).toString();

      if (!groupsMap.has(authorIdStr)) {
        const authorName =
          authorDoc?.name || authorDoc?.username || story.userName || "Traveler";
        const authorPic =
          authorDoc?.pic ||
          authorDoc?.avatar ||
          authorDoc?.profilePic ||
          authorDoc?.profilePicture ||
          story.userPic ||
          "";
        const isVerified = Boolean(authorDoc?.isVerified);

        groupsMap.set(authorIdStr, {
          userId: authorDoc?._id || story.userId,
          userName: authorName,
          userPic: authorPic,
          isVerified,
          stories: []
        });
      }

      groupsMap.get(authorIdStr).stories.push(story);
    }

    const groupedStories = Array.from(groupsMap.values());

    const myGroupIndex = groupedStories.findIndex(
      (g) => (g.userId?._id || g.userId).toString() === currentUserIdStr
    );
    if (myGroupIndex > 0) {
      const [myGroup] = groupedStories.splice(myGroupIndex, 1);
      groupedStories.unshift(myGroup);
    }

    res.status(200).json({
      success: true,
      stories: groupedStories
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.getStoryById = async (req, res) => {
  try {
    const story = await Story.findById(req.params.id).populate(
      "userId",
      "name username pic img avatar profilePic profilePicture isVerified"
    );

    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found"
      });
    }

    const canView = await canInteractWithContent(story.userId?._id || story.userId, req.user);
    if (!canView) {
      return res.status(403).json({ success: false, message: "Account is private" });
    }

    res.status(200).json({
      success: true,
      story
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.viewStory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const storyId = req.params.storyId || req.params.id;

    const story = await Story.findById(storyId);
    if (!story) {
      return res.status(404).json({
        success: false,
        message: "Dispatch not found"
      });
    }

    const canView = await canInteractWithContent(story.userId || story.userId?._id, req.user);
    if (!canView) {
      return res.status(403).json({ success: false, message: "Account is private" });
    }

    if (!story.views) story.views = [];
    if (!story.viewers) story.viewers = [];
    if (!story.viewedBy) story.viewedBy = [];

    const alreadyInViews = story.views.some(
      (v) => (v?._id || v?.userId || v).toString() === userId.toString()
    );
    if (!alreadyInViews) {
      story.views.push(userId);
    }

    const alreadyInViewers = story.viewers.some(
      (v) => (v?.userId?._id || v?.userId || v).toString() === userId.toString()
    );
    if (!alreadyInViewers) {
      story.viewers.push({ userId, viewedAt: new Date() });
    }

    const alreadyInViewedBy = story.viewedBy.some(
      (v) => (v?._id || v).toString() === userId.toString()
    );
    if (!alreadyInViewedBy) {
      story.viewedBy.push(userId);
    }

    await story.save();

    res.status(200).json({
      success: true,
      viewsCount: story.views.length,
      story
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.reactToStory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const storyId = req.params.id;
    const { emoji = "❤️" } = req.body;

    const story = await Story.findById(storyId).populate("userId");
    if (!story) {
      return res.status(404).json({ success: false, message: "Dispatch not found" });
    }

    const isAllowed = await canInteractWithContent(story.userId?._id || story.userId, req.user);
    if (!isAllowed) {
      return res.status(403).json({ success: false, message: "Forbidden: Cannot react to this dispatch." });
    }

    if (!story.reactions) story.reactions = [];
    if (!story.storyReactions) story.storyReactions = [];

    const existingReactionIndex = story.storyReactions.findIndex(
      (r) => (r.userId?._id || r.userId).toString() === userId.toString()
    );

    if (existingReactionIndex > -1) {
      story.storyReactions[existingReactionIndex].emoji = emoji;
      story.storyReactions[existingReactionIndex].reactedAt = new Date();
    } else {
      story.storyReactions.push({ userId, emoji, reactedAt: new Date() });
    }

    const existingLegacyIndex = story.reactions.findIndex(
      (r) => (r?._id || r?.userId || r).toString() === userId.toString()
    );
    if (existingLegacyIndex === -1) {
      story.reactions.push(userId);
    }

    await story.save();

    const storyAuthorId = story.userId?._id || story.userId;
    if (storyAuthorId.toString() !== userId.toString()) {
      const currentUser = await User.findById(userId);
      const senderName = currentUser?.name || currentUser?.username || "A traveler";
      await Notification.create({
        sender: userId,
        receiver: storyAuthorId,
        type: "story_reply",
        message: `${senderName} reacted ${emoji} to your Dispatch`
      }).catch(() => {});
    }

    res.status(200).json({
      success: true,
      reactions: story.reactions,
      storyReactions: story.storyReactions,
      story
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.replyToStory = async (req, res) => {
  try {
    const senderId = req.user._id || req.user.id;
    const storyUserId = req.params.storyUserId;
    const { text, storyId } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({ success: false, message: "Reply message cannot be empty" });
    }

    const isBlocked = await isBlockedPair(senderId, storyUserId);
    if (isBlocked) {
      return res.status(403).json({ success: false, message: "Cannot message a blocked user." });
    }

    let room = await ChatRoom.findOne({
      type: "direct",
      members: { $all: [senderId, storyUserId] }
    });

    if (!room) {
      room = new ChatRoom({
        type: "direct",
        members: [senderId, storyUserId],
        requestStatus: "accepted"
      });
      await room.save();
    } else if (room.requestStatus === "blocked") {
      return res.status(403).json({ success: false, message: "Cannot send messages in a blocked chat." });
    }

    const senderUser = await User.findById(senderId);
    const message = new Message({
      roomId: room._id,
      sender: senderId,
      senderName: senderUser?.name || senderUser?.username || "Traveler",
      senderPic: senderUser?.pic || senderUser?.avatar || senderUser?.profilePic || "",
      text: text.trim(),
      storyId: storyId || undefined,
      unreadBy: [storyUserId],
      deliveredTo: [senderId],
      seenBy: [senderId]
    });

    await message.save();

    res.status(201).json({
      success: true,
      message,
      chatMessage: message
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.updateStory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ success: false, message: "Dispatch not found" });
    }

    if ((story.userId?._id || story.userId).toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Not authorized to update this Dispatch" });
    }

    if (req.body.caption !== undefined) story.caption = req.body.caption;
    if (req.body.location !== undefined) story.location = req.body.location;

    await story.save();

    res.status(200).json({
      success: true,
      story
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.deleteStory = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const story = await Story.findById(req.params.id);

    if (!story) {
      return res.status(404).json({ success: false, message: "Dispatch not found" });
    }

    const authorId = (story.userId?._id || story.userId).toString();
    if (authorId !== userId.toString() && !req.user.isAdmin) {
      return res.status(403).json({ success: false, message: "Not authorized to delete this Dispatch" });
    }

    await Story.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Dispatch deleted successfully"
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
