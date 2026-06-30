const ChatRoom = require("../models/ChatRoom");
const Message = require("../models/Message");
const User = require("../models/User");
const TravelGroup = require("../models/TravelGroup");

const emitRequestStatusUpdate = (req, room, userId) => {
  const io = req.app.get("io");
  const onlineUsers = req.app.get("onlineUsers");
  if (io && room) {
    const payload = {
      roomId: room._id,
      requestStatus: room.requestStatus,
      room,
      updatedBy: userId,
      updatedAt: new Date()
    };
    io.to(room._id.toString()).emit("request_status_updated", payload);
    if (onlineUsers && room.members) {
      room.members.forEach(m => {
        const socketId = onlineUsers.get(m.toString());
        if (socketId) io.to(socketId).emit("request_status_updated", payload);
      });
    }
  }
};

// Create a direct chat room or return existing room
exports.getOrCreateDirectRoom = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const targetUserId = req.params.targetUserId;
    
 // Prevent users from chatting with themselves
    if (userId.toString() === targetUserId.toString()) {
      return res.status(400).json({ success: false, message: "You cannot chat with yourself" });
    }

    // Check if room already exists between these 2 users
    let room = await ChatRoom.findOne({
      type: "direct",
      members: { $all: [userId, targetUserId] }
    });

    if (!room) {
      const targetUser = await User.findById(targetUserId);
      if (!targetUser) {
        return res.status(404).json({ success: false, message: "User not found" });
      }

      const isSenderFollowingTarget = targetUser.followers.includes(userId);
      const isTargetFollowingSender = targetUser.following.includes(userId);
      
      let initialStatus = "pending";

      if (targetUser.privateAccount) {
        if (!isSenderFollowingTarget) {
          return res.status(403).json({ success: false, message: "Only approved followers can message this private account." });
        }
        initialStatus = "accepted";
      } else {
        if (isSenderFollowingTarget || isTargetFollowingSender) {
          initialStatus = "accepted";
        } else {
          initialStatus = "pending";
          if (!targetUser.messageRequests.includes(userId)) {
            targetUser.messageRequests.push(userId);
            await targetUser.save();
          }
        }
      }

      room = new ChatRoom({
        name: `${targetUser.name}`,
        type: "direct",
        members: [userId, targetUserId],
        requestStatus: initialStatus,
        requestedBy: initialStatus === "pending" ? userId : null
      });
      await room.save();
    }

    res.status(200).json({ success: true, room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get All Chat Rooms for User
exports.getUserRooms = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;

    // Find rooms containing the user (and not hidden by them)
    const rooms = await ChatRoom.find({ members: userId, hiddenFor: { $ne: userId } })
      .populate("members", "name username pic img")
      .populate("travelGroupId", "title destination coverImage status")
      .sort({ updatedAt: -1 });

    const roomsWithDetails = await Promise.all(rooms.map(async (room) => {
      const latestMessage = await Message.findOne({ roomId: room._id })
        .populate("storyId", "media mediaType caption")
        .sort({ createdAt: -1 });

      const unreadCount = await Message.countDocuments({
        roomId: room._id,
        unreadBy: userId
      });

      const roomObj = room.toObject();
      roomObj.latestMessage = latestMessage;
      roomObj.unreadCount = unreadCount;

      // Adjust room name for direct chats
      if (room.type === "direct") {
        const otherMember = room.members.find(m => m._id.toString() !== userId.toString());
        roomObj.name = otherMember ? otherMember.name : "Traveler";
        roomObj.pic = otherMember ? otherMember.pic || otherMember.img : "";
      } else if (room.travelGroupId) {
        roomObj.name = room.travelGroupId.title;
        roomObj.pic = room.travelGroupId.coverImage || "";
      }

      return roomObj;
    }));

    res.status(200).json({ success: true, rooms: roomsWithDetails });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get Messages for Room (Paginated)
exports.getRoomMessages = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.user._id || req.user.id;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 50;
    const skip = (page - 1) * limit;

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: "Chat room not found" });
    }

    if (!room.members.some(m => m.toString() === userId.toString())) {
      return res.status(403).json({ success: false, message: "You are not a member of this chat room" });
    }

    const messages = await Message.find({ roomId, deletedFor: { $ne: userId } })
      .populate("storyId", "media mediaType caption")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    // We sort by -1 for pagination, but UI needs them in chronological order
    messages.reverse();

    // Mark older unread messages as well.
    if (page === 1) {
      await Message.updateMany(
        { roomId, unreadBy: userId },
        { 
          $pull: { unreadBy: userId },
          $addToSet: { seenBy: userId } 
        }
      );
    }

    res.status(200).json({ success: true, messages, page, hasMore: messages.length === limit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send Message (HTTP API fallback / manual send)
exports.sendMessage = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.user._id || req.user.id;
    const { text, content, media } = req.body;

    if (!text && !content && !media) {
      return res.status(400).json({ success: false, message: "Message content or media required" });
    }

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: "Chat room not found" });
    }

    if (!room.members.some(m => m.toString() === userId.toString())) {
      return res.status(403).json({ success: false, message: "You are not a member of this chat room" });
    }

    // Message Request Rules
    if (room.type === "direct") {
      if (room.requestStatus === "blocked") {
        return res.status(403).json({ success: false, message: "Cannot send messages to this user." });
      }
      if (room.requestStatus === "declined") {
        return res.status(403).json({ success: false, message: "Message request was declined." });
      }
      if (room.requestStatus === "pending") {
        if (room.requestedBy.toString() !== userId.toString()) {
          return res.status(403).json({ success: false, message: "You must accept the request first." });
        }
        // Sender can only send the first message, unless we allow multiple while pending.
        const previousMessages = await Message.countDocuments({ roomId });
        if (previousMessages >= 1) { 
           return res.status(403).json({ success: false, message: "Waiting for user to accept your request." });
        }
      }
    }

    const senderUser = await User.findById(userId);
    const unreadMembers = room.members.filter(m => m.toString() !== userId.toString());

    // Validate block status for direct chats
    if (room.type === "direct") {
      const targetUserId = room.members.find(m => m.toString() !== userId.toString());
      if (targetUserId) {
        const targetUser = await User.findById(targetUserId);
        if (targetUser) {
          if (senderUser.blockedUsers?.includes(targetUserId)) {
            return res.status(403).json({ success: false, message: "You blocked this user. Unblock to send messages." });
          }
          if (targetUser.blockedUsers?.includes(userId)) {
            return res.status(403).json({ success: false, message: "You cannot message this user." });
          }
        }
      }
    }

    // Send notification if it's the very first message and it's a pending request
    if (room.type === "direct" && room.requestStatus === "pending") {
      const previousMessagesCount = await Message.countDocuments({ roomId });
      if (previousMessagesCount === 0) {
        const targetUserId = room.members.find(m => m.toString() !== userId.toString());
        const Notification = require("../models/Notification");
        await Notification.create({
          sender: userId,
          receiver: targetUserId,
          type: "message_request",
          room: roomId,
          message: `${senderUser.name} sent you a message request.`
        });
      }
    }

    const message = new Message({
      roomId,
      sender: userId,
      senderName: senderUser.name,
      senderPic: senderUser.pic,
      text: text || "",
      content: content || text || "",
      media: media || null,
      unreadBy: unreadMembers,
      deliveredTo: [userId],
      seenBy: [userId]
    });

    await message.save();

    // Update room updatedAt and unhide for all members
    room.updatedAt = new Date();
    room.hiddenFor = [];
    await room.save();

    res.status(201).json({ success: true, message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.acceptMessageRequest = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.user._id || req.user.id;
    const room = await ChatRoom.findById(roomId);
    if (!room || room.type !== "direct") return res.status(404).json({ success: false, message: "Room not found" });
    if (!room.members.some(m => m.toString() === userId.toString())) return res.status(403).json({ success: false, message: "Unauthorized" });
    if (room.requestedBy && room.requestedBy.toString() === userId.toString()) return res.status(400).json({ success: false, message: "You cannot accept your own request" });

    room.requestStatus = "accepted";
    room.acceptedAt = new Date();
    await room.save();

    // Remove from message requests
    const currentUser = await User.findById(userId);
    if (currentUser) {
      currentUser.messageRequests = currentUser.messageRequests.filter(id => id.toString() !== room.requestedBy.toString());
      await currentUser.save();
    }

    emitRequestStatusUpdate(req, room, userId);
    res.status(200).json({ success: true, message: "Request accepted", room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.declineMessageRequest = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.user._id || req.user.id;
    const room = await ChatRoom.findById(roomId);
    if (!room || room.type !== "direct") return res.status(404).json({ success: false, message: "Room not found" });
    if (!room.members.some(m => m.toString() === userId.toString())) return res.status(403).json({ success: false, message: "Unauthorized" });
    if (room.requestedBy && room.requestedBy.toString() === userId.toString()) return res.status(400).json({ success: false, message: "You cannot decline your own request" });

    room.requestStatus = "declined";
    await room.save();

    // Remove from message requests
    const currentUser = await User.findById(userId);
    if (currentUser) {
      currentUser.messageRequests = currentUser.messageRequests.filter(id => id.toString() !== room.requestedBy.toString());
      await currentUser.save();
    }

    emitRequestStatusUpdate(req, room, userId);
    res.status(200).json({ success: true, message: "Request declined", room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.blockMessageRequest = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.user._id || req.user.id;
    const room = await ChatRoom.findById(roomId);
    if (!room || room.type !== "direct") return res.status(404).json({ success: false, message: "Room not found" });
    if (!room.members.some(m => m.toString() === userId.toString())) return res.status(403).json({ success: false, message: "Unauthorized" });

    room.requestStatus = "blocked";
    await room.save();
    emitRequestStatusUpdate(req, room, userId);
    res.status(200).json({ success: true, message: "User blocked", room });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.markMessagesSeen = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.user._id || req.user.id;
    const { messageIds } = req.body; // Optional array to mark specific, else marks all unread in room

    const query = { roomId, seenBy: { $ne: userId } };
    if (messageIds && messageIds.length > 0) {
      query._id = { $in: messageIds };
    }

    const result = await Message.updateMany(
      query,
      { 
        $addToSet: { seenBy: userId },
        $pull: { unreadBy: userId }
      }
    );

    res.status(200).json({ success: true, modifiedCount: result.modifiedCount });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteMessageForMe = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const userId = req.user._id || req.user.id;

    const message = await Message.findOne({ _id: messageId, roomId });
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (!message.deletedFor.includes(userId)) {
      message.deletedFor.push(userId);
      await message.save();
    }

    res.status(200).json({ success: true, message: "Message deleted for you" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.unsendMessage = async (req, res) => {
  try {
    const { roomId, messageId } = req.params;
    const userId = req.user._id || req.user.id;

    const message = await Message.findOne({ _id: messageId, roomId });
    if (!message) {
      return res.status(404).json({ success: false, message: "Message not found" });
    }

    if (message.sender.toString() !== userId.toString()) {
      return res.status(403).json({ success: false, message: "Only the sender can unsend this message" });
    }

    const diff = Date.now() - new Date(message.createdAt).getTime();
    if (diff > 15 * 60 * 1000) {
      return res.status(400).json({ success: false, message: "Messages can only be unsent within 15 minutes of sending" });
    }

    message.isUnsent = true;
    message.unsentAt = new Date();
    await message.save();

    const io = req.app.get("io");
    if (io) {
      io.to(roomId).emit("message:unsent", { roomId, messageId });
    }

    res.status(200).json({ success: true, message: "Message unsent successfully", data: message });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearChatForMe = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id || req.user.id;
    
    await require('../models/Message').updateMany(
      { roomId, deletedFor: { $ne: userId } },
      { $push: { deletedFor: userId } }
    );
    
    res.status(200).json({ success: true, message: "Chat cleared for you" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.deleteChatForMe = async (req, res) => {
  try {
    const { roomId } = req.params;
    const userId = req.user._id || req.user.id;
    
    await require('../models/Message').updateMany(
      { roomId, deletedFor: { $ne: userId } },
      { $push: { deletedFor: userId } }
    );
    
    await ChatRoom.findByIdAndUpdate(roomId, {
      $addToSet: { hiddenFor: userId }
    });
    
    res.status(200).json({ success: true, message: "Chat deleted" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
