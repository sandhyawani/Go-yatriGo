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
        const socketIds = onlineUsers.get(m.toString());
        if (socketIds) {
          if (socketIds instanceof Set) {
            socketIds.forEach(socketId => {
              io.to(socketId).emit("request_status_updated", payload);
            });
          } else {
            io.to(socketIds).emit("request_status_updated", payload);
          }
        }
      });
    }
  }
};

// Create a direct chat room or return existing room
exports.getOrCreateDirectRoom = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const targetUserId = req.params.targetUserId;
    
    if (userId.toString() === targetUserId.toString()) {
      return res.status(400).json({ success: false, message: "You cannot chat with yourself" });
    }

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

// Get All Chat Rooms for User (Optimized using Bulk aggregation stages)
exports.getUserRooms = async (req, res) => {
  try {
    const userId = req.user._id || req.user.id;
    const userObjectId = new (require("mongoose").Types.ObjectId)(userId);

    const activeGroups = await TravelGroup.find({
      $or: [{ host: userId }, { "members.user": userId }]
    });

    if (activeGroups && activeGroups.length > 0) {
      const activeGroupIds = activeGroups.map(g => g._id);
      await ChatRoom.updateMany(
        { travelGroupId: { $in: activeGroupIds } },
        {
          $addToSet: { members: userId },
          $pull: { hiddenFor: userId }
        }
      );
    }

    // High performance bulk computation of latest message context and counters
    const roomsWithDetails = await ChatRoom.aggregate([
      { $match: { members: userObjectId, hiddenFor: { $ne: userObjectId } } },
      { $sort: { updatedAt: -1 } },
      // Populate Members
      {
        $lookup: {
          from: "users",
          localField: "members",
          foreignField: "_id",
          as: "members"
        }
      },
      // Populate Travel Groups
      {
        $lookup: {
          from: "travelgroups",
          localField: "travelGroupId",
          foreignField: "_id",
          as: "travelGroupId"
        }
      },
      {
        $unwind: { path: "$travelGroupId", preserveNullAndEmptyArrays: true }
      },
      // Fetch newest single message referencing room execution bounds
      {
        $lookup: {
          from: "messages",
          let: { roomId: "$_id" },
          pipeline: [
            { $match: { $expr: { $eq: ["$roomId", "$$roomId"] } } },
            { $sort: { createdAt: -1, _id: -1 } },
            { $limit: 1 }
          ],
          as: "latestMessage"
        }
      },
      {
        $unwind: { path: "$latestMessage", preserveNullAndEmptyArrays: true }
      },
      // Calculate dynamic accurate unread totals on the fly safely
      {
        $lookup: {
          from: "messages",
          let: { roomId: "$_id" },
          pipeline: [
            { $match: { $expr: { $and: [{ $eq: ["$roomId", "$$roomId"] }, { $in: [userObjectId, "$unreadBy"] }] } } },
            { $count: "count" }
          ],
          as: "unreadData"
        }
      },
      {
        $addFields: {
          unreadCount: { $ifNull: [{ $arrayElemAt: ["$unreadData.count", 0] }, 0] }
        }
      },
      { $project: { unreadData: 0 } }
    ]);

    // Format final fields correctly without mutating schema records directly
    const sanitizedRooms = roomsWithDetails.map(room => {
      if (room.type === "direct") {
        const otherMember = room.members.find(m => m._id.toString() !== userId.toString());
        room.name = otherMember ? otherMember.name : "Traveler";
        room.pic = otherMember ? otherMember.pic || otherMember.img : "";
      } else if (room.travelGroupId) {
        room.name = room.travelGroupId.title;
        room.pic = room.travelGroupId.coverImage || "";
      }
      return room;
    });

    res.status(200).json({ success: true, rooms: sanitizedRooms });
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
      .sort({ createdAt: -1, _id: -1 })
      .skip(skip)
      .limit(limit);

    messages.reverse();

    if (page === 1) {
      const updateSeenResult = await Message.updateMany(
        { roomId, unreadBy: userId },
        { 
          $pull: { unreadBy: userId },
          $addToSet: { seenBy: userId, deliveredTo: userId },
          $set: { seenAt: new Date() }
        }
      );

      if (updateSeenResult.modifiedCount > 0) {
        const io = req.app.get("io");
        if (io) {
          io.to(roomId.toString()).emit("messages_read", { roomId: roomId.toString(), userId: userId.toString() });
          io.to(roomId.toString()).emit("messages_seen", { roomId: roomId.toString(), userId: userId.toString() });
        }
      }
    }

    const updateDeliveredResult = await Message.updateMany(
      { roomId, sender: { $ne: userId }, deliveredTo: { $ne: userId } },
      { 
        $addToSet: { deliveredTo: userId },
        $set: { deliveredAt: new Date() }
      }
    );

    if (updateDeliveredResult.modifiedCount > 0) {
      const io = req.app.get("io");
      if (io) {
        io.to(roomId.toString()).emit("message_delivered_update", {
          roomId: roomId.toString(),
          userId: userId.toString()
        });
      }
    }

    res.status(200).json({ success: true, messages, page, hasMore: messages.length === limit });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Send Message
exports.sendMessage = async (req, res) => {
  try {
    const roomId = req.params.roomId;
    const userId = req.user._id || req.user.id;
    const { text, content, media, replyTo } = req.body;

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

    if (room.type === "direct") {
      if (room.requestStatus === "blocked") return res.status(403).json({ success: false, message: "Cannot send messages to this user." });
      if (room.requestStatus === "declined") return res.status(403).json({ success: false, message: "Message request was declined." });
      if (room.requestStatus === "pending") {
        if (room.requestedBy.toString() !== userId.toString()) {
          return res.status(403).json({ success: false, message: "You must accept the request first." });
        }
        const previousMessages = await Message.countDocuments({ roomId });
        if (previousMessages >= 1) { 
           return res.status(403).json({ success: false, message: "Waiting for user to accept your request." });
        }
      }
    }

    const senderUser = await User.findById(userId);
    const unreadMembers = room.members.filter(m => m.toString() !== userId.toString());

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

    // Capture members who had hidden the chat before resetting the array below
    const previouslyHiddenFor = [...(room.hiddenFor || [])];

    room.updatedAt = new Date();
    room.hiddenFor = [];
    await room.save();

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
      seenBy: [userId],
      replyTo: replyTo || undefined
    });
    await message.save();

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "-password")
      .populate("storyId", "media mediaType caption")
      .lean();

    if (req.body.clientMsgId) {
      populatedMessage.clientMsgId = req.body.clientMsgId;
    }

    const io = req.app.get("io");
    if (io) {
      const socketPayload = {
        ...populatedMessage,
        _id: populatedMessage._id.toString(),
        roomId: populatedMessage.roomId.toString(),
      };

      // Unhide chat stream dynamically across active subscriber views
      previouslyHiddenFor.forEach(hiddenUserId => {
        io.to(hiddenUserId.toString()).emit("chat_unhidden", { roomId: roomId.toString() });
      });

      (room.members || []).forEach(memberId => {
        io.to(memberId.toString()).emit("receive_chat_message", socketPayload);
      });

      io.to(userId.toString()).emit("message_sent", {
        roomId: roomId.toString(),
        messageId: socketPayload._id,
        clientMsgId: socketPayload.clientMsgId,
        message: socketPayload
      });
    }

    res.status(201).json({ success: true, message: populatedMessage });
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
    const { messageIds } = req.body;

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
    
    await Message.updateMany(
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

    const room = await ChatRoom.findById(roomId);
    if (!room) {
      return res.status(404).json({ success: false, message: "Chat room not found" });
    }

    if (room.type === "group" && room.travelGroupId) {
      const group = await TravelGroup.findById(room.travelGroupId);
      if (group) {
        if (group.host.toString() === userId.toString()) {
          return res.status(400).json({
            success: false,
            message: "Hosts cannot leave their own travel group. Please complete or cancel the trip first.",
          });
        }

        group.members = group.members.filter(
          (member) => member.user && member.user.toString() !== userId.toString()
        );

        if (group.status === "full" && group.members.length < group.maxMembers) {
          group.status = "open";
        }

        if (!group.activityLogs) group.activityLogs = [];
        group.activityLogs.push({
          action: "Left the group via chat deletion",
          user: userId,
          performedBy: userId,
        });

        await group.save();

        const JoinRequest = require("../models/JoinRequest");
        await JoinRequest.deleteOne({ groupId: group._id, userId });

        const Notification = require("../models/Notification");
        const leavingUser = await User.findById(userId);
        if (Notification && leavingUser) {
          await Notification.create({
            sender: userId,
            receiver: group.host,
            type: "group_left",
            group: group._id,
            message: `${leavingUser.name} left your travel group "${group.title}" by deleting the chat.`,
          });
        }
      }

      await ChatRoom.findByIdAndUpdate(roomId, {
        $pull: { members: userId },
        $addToSet: { hiddenFor: userId }
      });
    } else {
      await ChatRoom.findByIdAndUpdate(roomId, {
        $addToSet: { hiddenFor: userId }
      });
    }

    await Message.updateMany(
      { roomId, deletedFor: { $ne: userId } },
      { $push: { deletedFor: userId } }
    );

    res.status(200).json({ success: true, message: "Chat deleted and exited successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};