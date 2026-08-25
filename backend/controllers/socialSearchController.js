const User = require("../models/User");
const TravelGroup = require("../models/TravelGroup");
const Post = require("../models/Post");
const { getBlockedUserIds } = require("../utils/blockHelper");

const THIRTY_DAYS_MS = 30 * 24 * 60 * 60 * 1000;
const escapeRegex = (str) => String(str || "").replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

exports.getExploreMetadata = async (req, res) => {
  try {
    const now = new Date();
    const archiveDate = new Date(Date.now() - THIRTY_DAYS_MS);

    const categoriesData = await TravelGroup.aggregate([
      {
        $match: {
          status: { $ne: "cancelled" },
          endDate: { $gte: archiveDate }
        }
      },
      {
        $group: {
          _id: "$category",
          count: { $sum: 1 }
        }
      },
      {
        $sort: { count: -1 }
      }
    ]);

    const categories = categoriesData.map((item) => ({
      name: item._id || "Other",
      count: item.count
    }));

    const totalGroups = await TravelGroup.countDocuments({
      endDate: { $gte: archiveDate }
    });

    const upcomingGroups = await TravelGroup.countDocuments({
      status: { $ne: "cancelled" },
      startDate: { $gt: now }
    });

    const activeGroups = await TravelGroup.countDocuments({
      status: { $ne: "cancelled" },
      startDate: { $lte: now },
      endDate: { $gte: now }
    });

    const completedGroups = await TravelGroup.countDocuments({
      status: { $ne: "cancelled" },
      endDate: { $lt: now, $gte: archiveDate }
    });

    const cancelledGroups = await TravelGroup.countDocuments({
      status: "cancelled",
      endDate: { $gte: archiveDate }
    });

    const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000);

    const activeTravelers = await User.countDocuments({
      updatedAt: { $gte: thirtyMinutesAgo }
    });

    res.status(200).json({
      success: true,
      categories,
      counts: {
        total: totalGroups,
        upcoming: upcomingGroups,
        active: activeGroups,
        completed: completedGroups,
        cancelled: cancelledGroups
      },
      onlineTravelers: activeTravelers
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

exports.globalSocialSearch = async (req, res) => {
  try {
    const q = req.query.q || "";
    const currentUserId = req.user._id || req.user.id;

    if (!q.trim()) {
      return res.status(200).json({
        success: true,
        travelers: [],
        trips: [],
        memories: []
      });
    }

    const safePattern = escapeRegex(q.trim());
    const regex = new RegExp(safePattern, "i");

    const { objectIds: blockedObjectIds } = await getBlockedUserIds(currentUserId);
    const blockedQuery = blockedObjectIds && blockedObjectIds.length > 0 ? { $nin: blockedObjectIds } : null;

    const [travelers, groups, posts] = await Promise.all([
      User.find({
        _id: { $ne: currentUserId, ...(blockedQuery ? { $nin: [currentUserId, ...blockedObjectIds] } : {}) },
        type: { $in: ["traveler", "Traveler"] },
        $or: [
          { name: regex },
          { username: regex },
          { city: regex },
          { state: regex },
          { interests: regex }
        ]
      })
        .select("name username pic img avatar profilePic profilePicture userPic type isVerified rating completedTrips interests city state")
        .limit(10),

      TravelGroup.find({
        ...(blockedQuery ? { host: blockedQuery } : {}),
        $or: [
          { destination: regex },
          { title: regex },
          { category: regex }
        ]
      })
        .populate("host", "name username pic img avatar isVerified")
        .limit(10),

      Post.find({
        ...(blockedQuery ? { userId: blockedQuery } : {}),
        $or: [
          { caption: regex },
          { location: regex },
          { tags: regex }
        ]
      })
        .populate("userId", "name username pic img avatar isVerified")
        .limit(10)
    ]);

    const trips = groups.map((group) => {
      const gObj = group.toObject ? group.toObject() : group;
      return {
        ...gObj,
        creator: gObj.host || gObj.creator
      };
    });

    res.status(200).json({
      success: true,
      travelers,
      trips,
      memories: posts
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
