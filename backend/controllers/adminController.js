const User = require("../models/User");
const Post = require("../models/Post");
const Story = require("../models/Story");
const TravelGroup = require("../models/TravelGroup");
const Report = require("../models/Report");
const Notification = require("../models/Notification");
const Session = require("../models/Session");

const PLATFORM_TIME_ZONE = "Asia/Kolkata";
const ACTIVE_WINDOW_MS = 30 * 60 * 1000;
const PENDING_REPORT_STATUSES = ["pending", "Pending"];

const getPlatformDayKey = (date) => {
  const parts = new Intl.DateTimeFormat("en-US", {
    timeZone: PLATFORM_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).formatToParts(date);

  const value = (type) => parts.find((part) => part.type === type)?.value;
  return `${value("year")}-${value("month")}-${value("day")}`;
};

const getTrendDays = () => {
  const platformToday = getPlatformDayKey(new Date());
  const neutralToday = new Date(`${platformToday}T00:00:00.000Z`);

  return Array.from({ length: 7 }, (_, index) => {
    const date = new Date(neutralToday);
    date.setUTCDate(neutralToday.getUTCDate() - (6 - index));
    return date.toISOString().slice(0, 10);
  });
};

// Get social network moderation stats
const getStats = async (req, res) => {
  try {
    const trendDays = getTrendDays();
    const todayStart = new Date(`${trendDays[6]}T00:00:00.000+05:30`);
    const trendStart = new Date(`${trendDays[0]}T00:00:00.000+05:30`);
    const activeSince = new Date(Date.now() - ACTIVE_WINDOW_MS);
    const userScope = { isDeleted: { $ne: true } };

    const [
      totalUsers,
      activeUserSessions,
      postCount,
      storyCount,
      groupCount,
      reportsPending,
      suspendedUsers,
      newPostsToday,
      recentReports,
      priorityReports,
      postTrend,
      reportTrend,
      reportStatusDistribution
    ] = await Promise.all([
      User.countDocuments(userScope),
      Session.aggregate([
        { $match: { status: "active", lastActive: { $gte: activeSince } } },
        { $group: { _id: "$user" } },
        {
          $lookup: {
            from: User.collection.name,
            localField: "_id",
            foreignField: "_id",
            as: "user"
          }
        },
        { $unwind: "$user" },
        { $match: { "user.isDeleted": { $ne: true } } },
        { $count: "value" }
      ]),
      Post.countDocuments(),
      Story.countDocuments(),
      TravelGroup.countDocuments(),
      Report.countDocuments({ status: { $in: PENDING_REPORT_STATUSES } }),
      User.countDocuments({ ...userScope, isSuspended: true }),
      Post.countDocuments({ createdAt: { $gte: todayStart } }),
      Report.find()
        .populate("reporter", "name username pic img")
        .populate("reportedUser", "name username pic img")
        .sort({ createdAt: -1 })
        .limit(6),
      Report.find({ status: { $in: PENDING_REPORT_STATUSES } })
        .populate("reporter", "name username pic img")
        .populate("reportedUser", "name username pic img")
        .sort({ createdAt: -1 })
        .limit(4),
      Post.aggregate([
        { $match: { createdAt: { $gte: trendStart } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: PLATFORM_TIME_ZONE
              }
            },
            value: { $sum: 1 }
          }
        }
      ]),
      Report.aggregate([
        { $match: { createdAt: { $gte: trendStart } } },
        {
          $group: {
            _id: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$createdAt",
                timezone: PLATFORM_TIME_ZONE
              }
            },
            value: { $sum: 1 }
          }
        }
      ]),
      Report.aggregate([
        {
          $group: {
            _id: { $toLower: "$status" },
            value: { $sum: 1 }
          }
        }
      ])
    ]);

    const indexByDay = (items) =>
      items.reduce((lookup, item) => {
        lookup[item._id] = item.value;
        return lookup;
      }, {});

    const postsByDay = indexByDay(postTrend);
    const reportsByDay = indexByDay(reportTrend);
    const activeUsers = activeUserSessions[0]?.value || 0;
    const activityTrend = trendDays.map((date) => ({
      date,
      posts: postsByDay[date] || 0,
      reports: reportsByDay[date] || 0
    }));

    res.status(200).json({
      metrics: {
        totalUsers,
        activeUsers,
        reportsPending,
        suspendedUsers,
        newPostsToday
      },
      counts: {
        users: totalUsers,
        posts: postCount,
        stories: storyCount,
        groups: groupCount,
        reports: reportsPending
      },
      distribution: [
        { name: "Travelers", value: totalUsers },
        { name: "Posts", value: postCount },
        { name: "Stories", value: storyCount },
        { name: "Groups", value: groupCount }
      ],
      activityTrend,
      reportStatusDistribution: reportStatusDistribution.map((status) => ({
        name: status._id || "unknown",
        value: status.value
      })),
      priorityReports,
      recentReports,
      totalUsers,
      activeUsers,
      reports: reportsPending,
      suspendedUsers,
      newPostsToday
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all reports
const getAllReports = async (req, res) => {
  try {
    const reports = await Report.find()
      .populate("reporter", "name username pic img")
      .populate("reportedUser", "name username pic img")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, reports });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Resolve a report
const resolveReport = async (req, res) => {
  try {
    const reportId = req.params.id;
    const { status, adminNote } = req.body;

    const report = await Report.findById(reportId);
    if (!report) {
      return res.status(404).json({ message: "Report not found" });
    }

    if (status) report.status = status;
    if (adminNote) report.adminNote = adminNote;
    
    await report.save();

    res.status(200).json({ success: true, message: `Report marked as ${status || report.status}`, report });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Moderation: Admin Delete Post
const deleteReportedPost = async (req, res) => {
  try {
    const postId = req.params.postId;
    await Post.findByIdAndDelete(postId);
    res.status(200).json({ success: true, message: "Post deleted by admin moderation" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Moderation: Admin Delete Group
const deleteReportedGroup = async (req, res) => {
  try {
    const groupId = req.params.groupId;
    await TravelGroup.findByIdAndDelete(groupId);
    res.status(200).json({ success: true, message: "Travel group deleted by admin moderation" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Moderation: Suspend User
const suspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });
    
    user.isSuspended = true;
    await user.save();
    
    res.status(200).json({ success: true, message: "User suspended successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Moderation: Unsuspend User
const unsuspendUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isSuspended = false;
    await user.save();
    
    res.status(200).json({ success: true, message: "User unsuspended successfully" });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Moderation: Get pending verifications
const getPendingVerifications = async (req, res) => {
  try {
    const pendingUsers = await User.find({ verificationStatus: "pending" })
      .select("-password")
      .sort({ updatedAt: -1 }); // Sorted by recent updates to reflect user changes faster
    res.status(200).json(pendingUsers);
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Moderation: Approve Verification
const approveVerification = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isVerified = true;
    user.verificationStatus = 'verified';
    user.verificationNote = "";
    await user.save();
    
    // Create verification notification safely using optional fallback sender keys
    const adminSenderId = req.user?._id || req.user?.id || user._id;

    await Notification.create({
      sender: adminSenderId,
      receiver: user._id,
      type: "admin_warning", 
      message: "Congratulations! Your Government ID has been approved and you are now a Verified Traveler."
    });

    res.status(200).json({ success: true, message: `User verified successfully`, user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Moderation: Reject Verification
const rejectVerification = async (req, res) => {
  try {
    const { reason } = req.body;
    const user = await User.findById(req.params.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isVerified = false;
    user.verificationStatus = 'rejected';
    user.verificationNote = reason || "Your ID could not be verified.";
    await user.save();
    
    const adminSenderId = req.user?._id || req.user?.id || user._id;

    await Notification.create({
      sender: adminSenderId,
      receiver: user._id,
      type: "admin_warning", 
      message: `Your Government ID verification was rejected. Reason: ${user.verificationNote}. You can upload a new ID in your profile settings.`
    });

    res.status(200).json({ success: true, message: `User verification rejected`, user });
  } catch (err) {
    res.status(500).json({ message: "Server error", error: err.message });
  }
};

// Moderation: Warn User
const warnUser = async (req, res) => {
  try {
    const { message } = req.body;
    const targetUserId = req.params.id;
    
    if (!message) return res.status(400).json({ message: "Warning message is required" });
    
    const user = await User.findById(targetUserId);
    if (!user) return res.status(404).json({ message: "User not found" });

    const adminSenderId = req.user?._id || req.user?.id || user._id;

    await Notification.create({
      sender: adminSenderId,
      receiver: targetUserId,
      type: "admin_warning",
      message: message
    });

    res.status(200).json({ success: true, message: "Warning sent successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

module.exports = {
  getStats,
  getAllReports,
  resolveReport,
  deleteReportedPost,
  deleteReportedGroup,
  suspendUser,
  unsuspendUser,
  warnUser,
  getPendingVerifications,
  approveVerification,
  rejectVerification,
};