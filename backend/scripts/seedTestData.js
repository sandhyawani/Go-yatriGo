const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const fs = require("fs");
const path = require("path");
require("dotenv").config({ path: path.join(__dirname, "../.env") });

const connectDB = require("../config/db");
const User = require("../models/User");
const Journey = require("../models/Journey");
const TravelGroup = require("../models/TravelGroup");
const ChatRoom = require("../models/ChatRoom");
const JourneyMember = require("../models/JourneyMember");
const JourneyJoinRequest = require("../models/JourneyJoinRequest");
const JourneyInvitation = require("../models/JourneyInvitation");
const Notification = require("../models/Notification");
const Story = require("../models/Story");

const MANIFEST_PATH = path.join(__dirname, "testDataManifest.json");

const loadManifest = () => {
  if (fs.existsSync(MANIFEST_PATH)) {
    try {
      return JSON.parse(fs.readFileSync(MANIFEST_PATH));
    } catch (e) {
      return { users: [], journeys: [], travelGroups: [], joinRequests: [], invitations: [], notifications: [], stories: [], chatRooms: [], journeyMembers: [] };
    }
  }
  return { users: [], journeys: [], travelGroups: [], joinRequests: [], invitations: [], notifications: [], stories: [], chatRooms: [], journeyMembers: [] };
};

const saveManifest = (manifest) => {
  fs.writeFileSync(MANIFEST_PATH, JSON.stringify(manifest, null, 2));
};

// Helper for dates
const addDays = (date, days) => {
  const result = new Date(date);
  result.setDate(result.getDate() + days);
  return result;
};

const runSeed = async () => {
  await connectDB();
  
  if (mongoose.connection.name === "production" || process.env.NODE_ENV === "production") {
    console.error("Safety Abort: Connected to a production database!");
    process.exit(1);
  }
  
  console.log(`Connected to DB: ${mongoose.connection.name}`);
  
  let manifest = loadManifest();
  if (manifest.users && manifest.users.length > 0) {
    console.log("Existing test data detected. Please run 'npm run reset:test' first to prevent duplicates.");
    process.exit(1);
  }

  manifest = { users: [], journeys: [], travelGroups: [], joinRequests: [], invitations: [], notifications: [], stories: [], chatRooms: [], journeyMembers: [] };

  try {
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash("Demo@1234", salt);

    console.log("1. Seeding 15 Demo Users (with followers)...");
    const locations = [
      { city: "Pune", state: "Maharashtra" }, { city: "Pune", state: "Maharashtra" }, { city: "Pune", state: "Maharashtra" },
      { city: "Mumbai", state: "Maharashtra" }, { city: "Mumbai", state: "Maharashtra" }, { city: "Mumbai", state: "Maharashtra" },
      { city: "Nashik", state: "Maharashtra" }, { city: "Nashik", state: "Maharashtra" },
      { city: "Lonavala", state: "Maharashtra" }, { city: "Lonavala", state: "Maharashtra" },
      { city: "Nagpur", state: "Maharashtra" },
      { city: "Bengaluru", state: "Karnataka" }, { city: "Bengaluru", state: "Karnataka" },
      { city: "Hyderabad", state: "Telangana" },
      { city: "Goa", state: "Goa" }
    ];

    const names = [
      "Aarav Sharma", "Aditi Verma", "Rohan Mehta", "Priya Singh", "Karan Desai",
      "Neha Gupta", "Vikram Chawla", "Sneha Patil", "Rahul Joshi", "Meera Nair",
      "Amit Kulkarni", "Pooja Reddy", "Siddharth Rao", "Divya Menon", "Arjun Das"
    ];

    const users = [];
    const cityCount = {};

    const userImages = [
      "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1599566150163-29194dcaad36?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1527980965255-d3b416303d12?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1580489944761-15a19d654956?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1560250097-0b93528c311a?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1554151228-14d9def656e4?auto=format&fit=crop&w=400&q=80",
      "https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?auto=format&fit=crop&w=400&q=80"
    ];

    for (let i = 0; i < 15; i++) {
      const loc = locations[i];
      cityCount[loc.city] = (cityCount[loc.city] || 0) + 1;

      const profileImage = userImages[i];

      const baseUsername = names[i].toLowerCase().replace(/\s+/g, '_');
      const user = new User({
        name: names[i],
        username: baseUsername,
        email: `demo.e2e.${Date.now()}.${i}@example.test`,
        password: passwordHash,
        city: loc.city,
        state: loc.state,
        country: "India",
        type: "traveler",
        pic: profileImage,
        profilePic: profileImage,
        following: [],
        followers: []
      });
      await user.save();
      users.push(user);
      manifest.users.push(user._id.toString());
    }

    // Make users follow each other so Stories feed populates
    for (let i = 0; i < 15; i++) {
      for (let j = 1; j <= 5; j++) {
        const targetIdx = (i + j) % 15;
        users[i].following.push(users[targetIdx]._id);
        users[targetIdx].followers.push(users[i]._id);
      }
      await users[i].save();
    }
    saveManifest(manifest);

    console.log("2. Seeding 20 Demo Journeys & TravelGroups...");
    
    // Assign specific images to specific journey destinations
    const journeyConfigs = [
      // Ongoing (5)
      { title: "Pune to Lonavala Weekend", dest: "Lonavala", status: "Ongoing", daysOffsetStart: -1, daysOffsetEnd: 2, maxMembers: 6, memberCount: 3, hostIdx: 0, memberIdxs: [1, 2], img: "https://images.unsplash.com/photo-1625505826533-5c80aca7d157?auto=format&fit=crop&w=1000&q=80" }, // Mountains
      { title: "Mumbai to Goa Drive", dest: "Goa", status: "Ongoing", daysOffsetStart: -2, daysOffsetEnd: 5, maxMembers: 4, memberCount: 2, hostIdx: 3, memberIdxs: [4], img: "https://images.unsplash.com/photo-1512343879784-a960bf40e7f2?auto=format&fit=crop&w=1000&q=80" }, // Beach
      { title: "Nashik Wine Tasting", dest: "Nashik", status: "Ongoing", daysOffsetStart: 0, daysOffsetEnd: 1, maxMembers: 8, memberCount: 5, hostIdx: 6, memberIdxs: [7, 8, 9, 10], img: "https://images.unsplash.com/photo-1506377247377-2a5b3b417ebb?auto=format&fit=crop&w=1000&q=80" }, // Vineyard
      { title: "Bengaluru to Coorg", dest: "Coorg", status: "Ongoing", daysOffsetStart: -3, daysOffsetEnd: 1, maxMembers: 5, memberCount: 3, hostIdx: 11, memberIdxs: [12, 0], img: "https://images.unsplash.com/photo-1582510003544-4d00b7f74220?auto=format&fit=crop&w=1000&q=80" }, // Nature
      { title: "Hyderabad to Hampi", dest: "Hampi", status: "Ongoing", daysOffsetStart: -1, daysOffsetEnd: 4, maxMembers: 6, memberCount: 4, hostIdx: 13, memberIdxs: [1, 5, 8], img: "https://images.unsplash.com/photo-1600011500021-39641042c070?auto=format&fit=crop&w=1000&q=80" }, // Ruins
      
      // Upcoming (5)
      { title: "Trek to Sinhagad", dest: "Sinhagad", status: "Upcoming", daysOffsetStart: 5, daysOffsetEnd: 6, maxMembers: 10, memberCount: 3, hostIdx: 0, memberIdxs: [2, 10], img: "https://images.unsplash.com/photo-1592592079218-c28ee71da128?auto=format&fit=crop&w=1000&q=80" }, // Fort
      { title: "Alibaug Beach Party", dest: "Alibaug", status: "Upcoming", daysOffsetStart: 10, daysOffsetEnd: 12, maxMembers: 8, memberCount: 4, hostIdx: 4, memberIdxs: [3, 5, 7], img: "https://images.unsplash.com/photo-1518182170546-076616fd63ef?auto=format&fit=crop&w=1000&q=80" }, // Beach
      { title: "Igatpuri Monsoon Trek", dest: "Igatpuri", status: "Upcoming", daysOffsetStart: 15, daysOffsetEnd: 17, maxMembers: 6, memberCount: 2, hostIdx: 7, memberIdxs: [6], img: "https://images.unsplash.com/photo-1629633649692-f047533fffa0?auto=format&fit=crop&w=1000&q=80" }, // Trek/Monsoon
      { title: "Chikmagalur Coffee Tour", dest: "Chikmagalur", status: "Upcoming", daysOffsetStart: 8, daysOffsetEnd: 10, maxMembers: 4, memberCount: 2, hostIdx: 12, memberIdxs: [11], img: "https://images.unsplash.com/photo-1555139045-817de7c234b3?auto=format&fit=crop&w=1000&q=80" }, // Coffee/Nature
      { title: "Matheran Nature Walk", dest: "Matheran", status: "Upcoming", daysOffsetStart: 20, daysOffsetEnd: 21, maxMembers: 5, memberCount: 2, hostIdx: 5, memberIdxs: [3], img: "https://images.unsplash.com/photo-1617462057077-94d3d3b76176?auto=format&fit=crop&w=1000&q=80" }, // Walk in nature
      
      // Planning (4)
      { title: "Rajgad Fort Expedition", dest: "Rajgad", status: "Planning", daysOffsetStart: 30, daysOffsetEnd: 32, maxMembers: 6, memberCount: 1, hostIdx: 1, memberIdxs: [], img: "https://images.unsplash.com/photo-1623871404177-33a7895f543e?auto=format&fit=crop&w=1000&q=80" }, // Fort
      { title: "Gokarna Backpacking", dest: "Gokarna", status: "Planning", daysOffsetStart: 45, daysOffsetEnd: 50, maxMembers: 8, memberCount: 1, hostIdx: 14, memberIdxs: [], img: "https://images.unsplash.com/photo-1568285510619-da23223f6e52?auto=format&fit=crop&w=1000&q=80" }, // Beach
      { title: "Malshej Ghat Trip", dest: "Malshej", status: "Planning", daysOffsetStart: 25, daysOffsetEnd: 27, maxMembers: 4, memberCount: 1, hostIdx: 4, memberIdxs: [], img: "https://images.unsplash.com/photo-1571408899890-a4f6645511b8?auto=format&fit=crop&w=1000&q=80" }, // Waterfall/Ghats
      { title: "Panchgani Retreat", dest: "Panchgani", status: "Planning", daysOffsetStart: 40, daysOffsetEnd: 42, maxMembers: 5, memberCount: 1, hostIdx: 2, memberIdxs: [], img: "https://images.unsplash.com/photo-1601620892224-118e24dc025a?auto=format&fit=crop&w=1000&q=80" }, // Hill station
      
      // Full Capacity (3)
      { title: "Torna Fort Challenge", dest: "Torna", status: "Upcoming", daysOffsetStart: 7, daysOffsetEnd: 8, maxMembers: 4, memberCount: 4, hostIdx: 0, memberIdxs: [1, 2, 3], img: "https://images.unsplash.com/photo-1627916962363-2287f394c86b?auto=format&fit=crop&w=1000&q=80" }, // Mountains
      { title: "Bhandardara Camping", dest: "Bhandardara", status: "Ongoing", daysOffsetStart: -1, daysOffsetEnd: 2, maxMembers: 5, memberCount: 5, hostIdx: 6, memberIdxs: [7, 8, 9, 10], img: "https://images.unsplash.com/photo-1523987355523-c7b5b0dd90a7?auto=format&fit=crop&w=1000&q=80" }, // Camping
      { title: "Khandala Weekend", dest: "Khandala", status: "Upcoming", daysOffsetStart: 12, daysOffsetEnd: 14, maxMembers: 3, memberCount: 3, hostIdx: 8, memberIdxs: [9, 10], img: "https://images.unsplash.com/photo-1563604090288-51e93c2005e8?auto=format&fit=crop&w=1000&q=80" }, // Valley
      
      // Completed (3)
      { title: "Mahabaleshwar Getaway", dest: "Mahabaleshwar", status: "Completed", daysOffsetStart: -20, daysOffsetEnd: -18, maxMembers: 6, memberCount: 4, hostIdx: 0, memberIdxs: [1, 4, 5], img: "https://images.unsplash.com/photo-1569429593410-b498b3fb3387?auto=format&fit=crop&w=1000&q=80" },
      { title: "Harishchandragad Trek", dest: "Harishchandragad", status: "Completed", daysOffsetStart: -30, daysOffsetEnd: -28, maxMembers: 8, memberCount: 6, hostIdx: 2, memberIdxs: [3, 6, 7, 8, 9], img: "https://images.unsplash.com/photo-1601620892224-118e24dc025a?auto=format&fit=crop&w=1000&q=80" },
      { title: "Visapur Fort Climb", dest: "Visapur", status: "Completed", daysOffsetStart: -15, daysOffsetEnd: -14, maxMembers: 5, memberCount: 3, hostIdx: 1, memberIdxs: [0, 2], img: "https://images.unsplash.com/photo-1592592079218-c28ee71da128?auto=format&fit=crop&w=1000&q=80" }
    ];

    const journeys = [];
    const now = new Date();

    const jStatusCounts = { Ongoing: 0, Upcoming: 0, Planning: 0, Completed: 0 };
    let fullCount = 0;

    for (const conf of journeyConfigs) {
      const host = users[conf.hostIdx];
      
      const journeyMembersList = [{ user: host._id, role: "Organizer", joinedAt: now }];
      const tgMembersList = [{ user: host._id, role: "host", joinedAt: now }];
      const chatMemberIds = [host._id];

      for (const mIdx of conf.memberIdxs) {
        journeyMembersList.push({ user: users[mIdx]._id, role: "Member", joinedAt: now });
        tgMembersList.push({ user: users[mIdx]._id, role: "member", joinedAt: now });
        chatMemberIds.push(users[mIdx]._id);
      }

      const isFull = journeyMembersList.length === conf.maxMembers;
      if (isFull) fullCount++;
      jStatusCounts[conf.status] = (jStatusCounts[conf.status] || 0) + 1;

      // 1. Create TravelGroup (for Explore)
      let tgStatus = "open";
      if (conf.status === "Completed") tgStatus = "completed";
      else if (isFull) tgStatus = "full";

      const travelGroup = new TravelGroup({
        host: host._id,
        title: conf.title,
        destination: conf.dest,
        from: host.city || "",
        startDate: addDays(now, conf.daysOffsetStart),
        endDate: addDays(now, conf.daysOffsetEnd),
        maxMembers: conf.maxMembers,
        description: "Seeded test data for UI flows.",
        coverImage: conf.img,
        category: "Adventure",
        isPrivate: false,
        status: tgStatus,
        members: tgMembersList,
        completedAt: conf.status === "Completed" ? addDays(now, conf.daysOffsetEnd) : null
      });
      await travelGroup.save();
      manifest.travelGroups.push(travelGroup._id.toString());

      // 2. Create ChatRoom for TravelGroup
      const tgChatRoom = new ChatRoom({
        name: `${conf.title} - Group Chat`,
        type: "group",
        members: chatMemberIds,
        travelGroupId: travelGroup._id
      });
      await tgChatRoom.save();
      manifest.chatRooms.push(tgChatRoom._id.toString());

      // 3. Create Journey ChatRoom
      const jChatRoom = new ChatRoom({
        name: conf.title,
        type: "group",
        members: chatMemberIds
      });
      await jChatRoom.save();
      manifest.chatRooms.push(jChatRoom._id.toString());

      // 4. Create Journey Workspace
      const journey = new Journey({
        title: conf.title,
        description: "Seeded test data workspace.",
        destination: conf.dest,
        from: host.city || "",
        coverImage: conf.img,
        startDate: addDays(now, conf.daysOffsetStart),
        endDate: addDays(now, conf.daysOffsetEnd),
        status: conf.status,
        creator: host._id,
        members: journeyMembersList,
        maxMembers: conf.maxMembers,
        memberCount: journeyMembersList.length,
        chatRoomId: jChatRoom._id,
        sourceType: "explore",
        sourceId: travelGroup._id,
        createdFrom: "Explore Travel Squad",
        completedAt: conf.status === "Completed" ? addDays(now, conf.daysOffsetEnd) : null
      });
      await journey.save();
      journeys.push(journey);
      manifest.journeys.push(journey._id.toString());

      // Link ChatRoom to Journey
      jChatRoom.journeyId = journey._id;
      await jChatRoom.save();

      // 5. Create JourneyMember records
      for (const m of journeyMembersList) {
        const jm = new JourneyMember({
          journeyId: journey._id,
          userId: m.user,
          role: m.role
        });
        await jm.save();
        manifest.journeyMembers.push(jm._id.toString());
      }
    }
    saveManifest(manifest);

    console.log("3. Seeding Join Requests...");
    const joinReqConfigs = [
      { journey: journeys[1], user: users[5], status: "pending" },
      { journey: journeys[3], user: users[13], status: "pending" },
      { journey: journeys[5], user: users[3], status: "pending" },
      { journey: journeys[6], user: users[8], status: "pending" },
      { journey: journeys[7], user: users[9], status: "pending" },
      { journey: journeys[0], user: users[4], status: "accepted" },
      { journey: journeys[1], user: users[6], status: "accepted" },
      { journey: journeys[2], user: users[11], status: "accepted" },
      { journey: journeys[0], user: users[5], status: "rejected" },
      { journey: journeys[4], user: users[10], status: "rejected" },
      { journey: journeys[5], user: users[1], status: "cancelled" },
      { journey: journeys[6], user: users[2], status: "cancelled" },
      { journey: journeys[14], user: users[12], status: "capacity_full" }
    ];

    for (const conf of joinReqConfigs) {
      if (conf.status === "accepted") {
        const j = await Journey.findById(conf.journey._id);
        if (j.memberCount < j.maxMembers && !j.members.some(m => m.user.toString() === conf.user._id.toString())) {
          j.members.push({ user: conf.user._id, role: "Member" });
          j.memberCount++;
          await j.save();
          
          const jm = new JourneyMember({ journeyId: j._id, userId: conf.user._id, role: "Member" });
          await jm.save();
          manifest.journeyMembers.push(jm._id.toString());
        }
      }

      const req = new JourneyJoinRequest({
        journeyId: conf.journey._id,
        userId: conf.user._id,
        status: conf.status
      });
      await req.save();
      manifest.joinRequests.push(req._id.toString());
    }
    saveManifest(manifest);

    console.log("4. Seeding Invitations...");
    const invConfigs = [
      { journey: journeys[10], inviter: users[1], invitee: users[0], status: "pending" },
      { journey: journeys[11], inviter: users[14], invitee: users[3], status: "pending" },
      { journey: journeys[12], inviter: users[4], invitee: users[5], status: "pending" },
      { journey: journeys[13], inviter: users[2], invitee: users[1], status: "pending" },
      { journey: journeys[10], inviter: users[1], invitee: users[6], status: "accepted" },
      { journey: journeys[11], inviter: users[14], invitee: users[7], status: "accepted" },
      { journey: journeys[12], inviter: users[4], invitee: users[8], status: "rejected" },
      { journey: journeys[13], inviter: users[2], invitee: users[9], status: "cancelled" },
      { journey: journeys[15], inviter: users[6], invitee: users[0], status: "capacity_full" },
      { journey: journeys[17], inviter: users[0], invitee: users[10], status: "expired" }
    ];

    for (const conf of invConfigs) {
      if (conf.status === "accepted") {
        const j = await Journey.findById(conf.journey._id);
        if (j.memberCount < j.maxMembers && !j.members.some(m => m.user.toString() === conf.invitee._id.toString())) {
          j.members.push({ user: conf.invitee._id, role: "Member" });
          j.memberCount++;
          await j.save();
          
          const jm = new JourneyMember({ journeyId: j._id, userId: conf.invitee._id, role: "Member" });
          await jm.save();
          manifest.journeyMembers.push(jm._id.toString());
        }
      }

      const inv = new JourneyInvitation({
        journeyId: conf.journey._id,
        inviterId: conf.inviter._id,
        inviteeId: conf.invitee._id,
        status: conf.status,
        expiresAt: conf.status === "expired" ? addDays(now, -1) : addDays(now, 7)
      });
      await inv.save();
      manifest.invitations.push(inv._id.toString());
    }
    saveManifest(manifest);

    console.log("5. Seeding 20 Stories...");
    const storyThemes = ["Trekking", "Mountains", "Forts", "Beaches", "Road trips", "Camping", "Sunrise", "Sunset", "Food during travel", "Group travel", "Local sightseeing"];
    const storyDistribution = [2, 1, 3, 2, 0, 1, 2, 1, 0, 1, 2, 1, 0, 2, 2];
    
    const storyMediaUrls = [
      "https://images.unsplash.com/photo-1506905925224-b159f8078028?auto=format&fit=crop&w=600&h=800&q=80",
      "https://images.unsplash.com/photo-1533087355953-a4a88874bd4c?auto=format&fit=crop&w=600&h=800&q=80",
      "https://images.unsplash.com/photo-1476514525535-07fb3b4ae5f1?auto=format&fit=crop&w=600&h=800&q=80",
      "https://images.unsplash.com/photo-1501555088652-021faa106b9b?auto=format&fit=crop&w=600&h=800&q=80",
      "https://images.unsplash.com/photo-1454496522488-7a8e488e8606?auto=format&fit=crop&w=600&h=800&q=80"
    ];

    let storyCount = 0;
    for (let uIdx = 0; uIdx < 15; uIdx++) {
      const u = users[uIdx];
      const count = storyDistribution[uIdx];
      for (let s = 0; s < count; s++) {
        const theme = storyThemes[storyCount % storyThemes.length];
        const mediaUrl = storyMediaUrls[storyCount % storyMediaUrls.length];
        const isExpired = storyCount % 5 === 0;

        const story = new Story({
          userId: u._id,
          userName: u.name,
          userPic: u.pic,
          media: mediaUrl,
          mediaType: "image",
          caption: `${theme} vibes!`,
          visibility: "public",
          expiresAt: isExpired ? addDays(now, -1) : addDays(now, 1),
          views: s % 2 === 0 ? [users[0]._id, users[1]._id] : [],
          createdAt: isExpired ? addDays(now, -2) : now
        });
        await story.save();
        manifest.stories.push(story._id.toString());
        storyCount++;
      }
    }
    saveManifest(manifest);

    console.log("6. Seeding 20 Notifications...");
    const notifs = [];
    for(let i=0; i<5; i++) {
      notifs.push({ sender: users[i]._id, receiver: users[(i+1)%15]._id, type: "journey_join_request", message: "New join request received", journey: journeys[0]._id });
    }
    for(let i=5; i<10; i++) {
      notifs.push({ sender: users[i]._id, receiver: users[(i+1)%15]._id, type: "journey_invitation", message: "You are invited to a journey", journey: journeys[1]._id });
    }
    for(let i=10; i<15; i++) {
      notifs.push({ sender: users[i]._id, receiver: users[(i+1)%15]._id, type: "story_like", message: "Liked your story" });
    }
    for(let i=0; i<5; i++) {
      notifs.push({ sender: users[i]._id, receiver: users[(i+2)%15]._id, type: "follow", message: "Started following you" });
    }

    for (const n of notifs) {
      const notif = new Notification(n);
      await notif.save();
      manifest.notifications.push(notif._id.toString());
    }
    saveManifest(manifest);

    console.log("\n==================================================");
    console.log("TEST DATA CREATED");
    console.log(`Users: ${manifest.users.length}`);
    console.log(`Journeys: ${manifest.journeys.length}`);
    console.log(`TravelGroups (Explore): ${manifest.travelGroups.length}`);
    console.log(`Stories: ${manifest.stories.length}`);
    console.log(`Join Requests: ${manifest.joinRequests.length}`);
    console.log(`Invitations: ${manifest.invitations.length}`);
    console.log(`Notifications: ${manifest.notifications.length}`);
    
    console.log("\n--- DEMO LOGIN CREDENTIALS ---");
    console.log(`Password for all demo users: Demo@1234`);
    console.log(`Pune User: ${users[0].email}`);
    console.log(`Mumbai User: ${users[3].email}`);
    console.log(`Nashik User: ${users[6].email}`);
    console.log("==================================================\n");

    process.exit(0);
  } catch (error) {
    console.error("Error seeding test data:", error);
    process.exit(1);
  }
};

runSeed();
