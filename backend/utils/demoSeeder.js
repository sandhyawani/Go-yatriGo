const bcrypt = require("bcryptjs");
const User = require("../models/User");
const Journey = require("../models/Journey");
const JourneyWorkspace = require("../models/JourneyWorkspace");
const JourneyTimeline = require("../models/JourneyTimeline");
const ChatRoom = require("../models/ChatRoom");
const Message = require("../models/Message");
const logger = require("./logger");

const seedDemoData = async () => {
  const DEMO_EMAIL = "guest.explorer@goyatrigo.com";
  logger.info(`[Demo Sandbox] Initializing data reset for: ${DEMO_EMAIL}`);

  try {
    const existingGuest = await User.findOne({ email: DEMO_EMAIL });
    if (existingGuest) {
      const guestId = existingGuest._id;

      const guestJourneys = await Journey.find({ creator: guestId }).select("_id");
      const journeyIds = guestJourneys.map((j) => j._id);

      await Promise.all([
      Journey.deleteMany({ creator: guestId }),
      JourneyWorkspace.deleteMany({ journeyId: { $in: journeyIds } }),
      JourneyTimeline.deleteMany({ journeyId: { $in: journeyIds } }),
      ChatRoom.deleteMany({ journeyId: { $in: journeyIds } }),
      Message.deleteMany({ roomId: { $in: journeyIds } }),
      User.deleteOne({ _id: guestId })]
      );
      logger.info(`[Demo Sandbox] Successfully purged existing demo data.`);
    }

    const hashedPassword = await bcrypt.hash("demopassword123", 10);
    const guestUser = await User.create({
      name: "Demo Explorer",
      email: DEMO_EMAIL,
      username: "demo_explorer",
      password: hashedPassword,
      isVerified: true,
      img: "https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=500&auto=format&fit=crop&q=60",
      emergencyContacts: [
      { name: "Sarah Connor", relation: "Sister", phone: "+15550199", isPrimary: true },
      { name: "John Connor", relation: "Brother", phone: "+15550198", isPrimary: false }]

    });

    const companionA = await User.create({
      name: "Rohan Das",
      email: `rohan.companion.${Date.now()}@goyatrigo.com`,
      username: `rohan_explorer_${Date.now()}`,
      password: hashedPassword,
      img: "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=500&auto=format&fit=crop&q=60"
    });

    const companionB = await User.create({
      name: "Anjali Mehta",
      email: `anjali.companion.${Date.now()}@goyatrigo.com`,
      username: `anjali_explorer_${Date.now()}`,
      password: hashedPassword,
      img: "https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=500&auto=format&fit=crop&q=60"
    });

    const journey = await Journey.create({
      title: "Spiti Valley Expedition",
      description: "A 7-day collaborative road trip through Kaza, Tabo, and Key Monastery. Focus is on altitude safety, budget coordination, and exploring ancient monasteries.",
      destination: "Spiti Valley, India",
      coverImage: "https://images.unsplash.com/photo-1605649487212-47bdab064df7?w=800&auto=format&fit=crop&q=80",
      startDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
      endDate: new Date(Date.now() + 9 * 24 * 60 * 60 * 1000),
      privacy: "Private",
      journeyType: "Shared Journey",
      status: "Upcoming",
      sourceType: "manual",
      creator: guestUser._id,
      members: [
      { user: guestUser._id, role: "Organizer" },
      { user: companionA._id, role: "Co-Organizer" },
      { user: companionB._id, role: "Member" }],

      stats: {
        postsCount: 0,
        storiesCount: 0,
        photosCount: 2,
        videosCount: 0,
        checkInsCount: 2
      }
    });

    const chatRoom = await ChatRoom.create({
      name: "Spiti Expedition Crew",
      type: "group",
      journeyId: journey._id,
      members: [guestUser._id, companionA._id, companionB._id]
    });

    journey.chatRoomId = chatRoom._id;
    await journey.save();

    await Promise.all([
    JourneyWorkspace.create({
      journeyId: journey._id,
      creatorId: guestUser._id,
      creatorName: guestUser.name,
      creatorPic: guestUser.img,
      category: "Packing List",
      title: "Cold Weather Essentials",
      items: [
      { text: "Thermal wear (2 pairs)", isCompleted: true },
      { text: "Windproof heavy jacket", isCompleted: true },
      { text: "Altitudes / diamox pills", isCompleted: false },
      { text: "UV polarized sunglasses", isCompleted: false }]

    }),
    JourneyWorkspace.create({
      journeyId: journey._id,
      creatorId: companionA._id,
      creatorName: companionA.name,
      creatorPic: companionA.img,
      category: "Important Notes",
      title: "Acclimatization & Inner Line Permits",
      content: "Inner line permits are mandatory for foreign nationals in certain border regions of Spiti. We will stop at Kaza SDM office to submit forms. Acclimatization is key: we will spend 48 hours in Manali before crossing Rohtang Pass to avoid altitude sickness (AMS)."
    })]
    );

    await Promise.all([
    JourneyTimeline.create({
      journeyId: journey._id,
      userId: guestUser._id,
      userName: guestUser.name,
      userPic: guestUser.img,
      eventType: "journey_created",
      title: "Expedition Initialized",
      description: "Demo Explorer created the collaborative journey workspace."
    }),
    JourneyTimeline.create({
      journeyId: journey._id,
      userId: companionA._id,
      userName: companionA.name,
      userPic: companionA.img,
      eventType: "member_joined",
      title: "Rohan Das Joined",
      description: "Rohan accepted the invitation to co-organize the Spiti expedition."
    }),
    JourneyTimeline.create({
      journeyId: journey._id,
      userId: guestUser._id,
      userName: guestUser.name,
      userPic: guestUser.img,
      eventType: "safe_checkin",
      title: "Pre-trip Check-in: Delhi",
      description: "Gear verify complete. Departed overnight Volvo bus to Himachal Pradesh.",
      checkInType: "Started Journey"
    })]
    );

    await Promise.all([
    Message.create({
      roomId: chatRoom._id,
      sender: companionA._id,
      senderName: companionA.name,
      senderPic: companionA.img,
      content: "Hey team! I've loaded the acclimatization notes into the workspace. Please review."
    }),
    Message.create({
      roomId: chatRoom._id,
      sender: guestUser._id,
      senderName: guestUser.name,
      senderPic: guestUser.img,
      content: "Thanks Rohan. I just marked thermals and jackets as packed in the Packing List."
    }),
    Message.create({
      roomId: chatRoom._id,
      sender: companionB._id,
      senderName: companionB.name,
      senderPic: companionB.img,
      content: "Perfect, I'll grab some altitude sickness pills from the pharmacy today!"
    })]
    );

    logger.info(`[Demo Sandbox] Successfully generated fresh demo environment for ${DEMO_EMAIL}`);
    return guestUser;
  } catch (error) {
    logger.error(`[Demo Sandbox Error] Failed to seed demo database: ${error.message}`);
    throw error;
  }
};

module.exports = seedDemoData;