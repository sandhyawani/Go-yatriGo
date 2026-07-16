<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&weight=700&size=40&pause=1000&color=FF6B35&center=true&vCenter=true&repeat=false&width=600&height=80&lines=🚀+Go+yatriGo" alt="Go yatriGo" />
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Poppins&weight=500&size=20&pause=1000&color=A8DADC&center=true&vCenter=true&repeat=false&width=700&height=40&lines=Where+Journeys+Begin+and+Stories+Never+End+🌍" alt="Tagline" />
</p>

<p align="center">
  <a href="https://go-yatri-go.vercel.app"><img src="https://img.shields.io/badge/🔴_LIVE-go--yatri--go.vercel.app-FF6B35?style=for-the-badge&labelColor=1D3557" alt="Live Demo"/></a>
  <img src="https://img.shields.io/badge/version-1.0.0-A8DADC?style=for-the-badge&labelColor=1D3557" alt="Version"/>
  <img src="https://img.shields.io/badge/license-MIT-E63946?style=for-the-badge&labelColor=1D3557" alt="License"/>
</p>

<p align="center">
  <img src="https://img.shields.io/badge/React-18.2-61DAFB?style=flat-square&logo=react&logoColor=white" alt="React"/>
  <img src="https://img.shields.io/badge/Node.js-Express-339933?style=flat-square&logo=node.js&logoColor=white" alt="Node.js"/>
  <img src="https://img.shields.io/badge/MongoDB-Mongoose-47A248?style=flat-square&logo=mongodb&logoColor=white" alt="MongoDB"/>
  <img src="https://img.shields.io/badge/Socket.IO-Realtime-010101?style=flat-square&logo=socket.io&logoColor=white" alt="Socket.IO"/>
  <img src="https://img.shields.io/badge/Tailwind_CSS-3.3-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white" alt="Tailwind CSS"/>
  <img src="https://img.shields.io/badge/Cloudinary-CDN-3448C5?style=flat-square&logo=cloudinary&logoColor=white" alt="Cloudinary"/>
  <img src="https://img.shields.io/badge/Vercel-Deployed-000000?style=flat-square&logo=vercel&logoColor=white" alt="Vercel"/>
</p>

---

## 💡 What is Go yatriGo?

**Go yatriGo** is a full-stack social platform built from the ground up — designed for people who believe that every journey is better when shared. It's not just another app; it's a complete ecosystem where you can find journey mates, plan group trips, share your experiences through posts and stories, chat in real-time, and even have an emergency SOS system for safety on the go.

> **"Yatri"** means traveler in Hindi. **Go yatriGo** = Go, Traveler, Go! 🚀

---

## ✨ Feature Highlights

<table>
<tr>
<td width="50%">

### 🤝 Journey Mate Hub
Find and connect with people who share your vibe. Send buddy requests, accept connections, and build your journey squad.

### 💬 Real-Time Chat
Powered by **Socket.IO** — instant messaging with emoji support, read receipts, and group conversations that keep your crew connected.

### 📸 Posts & Stories
Share your memories with photos, captions, and stories. Like, comment, save, and engage with content from fellow explorers.

### 🗺️ Journey Groups
Create themed groups, invite members, set itineraries, and collaborate on trip planning with a built-in workspace.

</td>
<td width="50%">

### 🚨 Emergency SOS
One-tap emergency alert system with saved emergency contacts. Your safety is never an afterthought.

### 👤 Rich Profiles
Detailed profiles with cover photos, bio, preferences, follow/unfollow system, and a personal timeline of all your journeys.

### 🛡️ Safety & Moderation
Block users, report content, admin moderation pipeline, and customizable security preferences to keep the community safe.

### 📊 Admin Dashboard
Full admin panel with user management, content moderation, analytics pie charts, and data grid tables for oversight.

</td>
</tr>
</table>

---

## 🏛️ Architecture

```
Go yatriGo
├── 🎨 Frontend (React 18 + Tailwind CSS)
│   ├── Pages ──────── Home, Login, Register, Profile, Admin, Settings
│   ├── Components ─── Chat, Journey, Post, Story, Social, Navbar, Footer
│   ├── Context ────── Auth Context, Socket Context
│   ├── Hooks ──────── Custom data fetching hooks
│   ├── Services ───── API service layer
│   └── Socket ─────── Real-time connection manager
│
├── ⚙️ Backend (Node.js + Express)
│   ├── Controllers ── Auth, User, Chat, Social, Journey, Post, Emergency
│   ├── Models ─────── 29 Mongoose schemas (User, Journey, Message, Post...)
│   ├── Routes ─────── 17 RESTful route files
│   ├── Middleware ──── JWT auth, token verification, error handling
│   ├── Config ─────── DB connection, JWT setup
│   └── Utils ──────── Cloudinary uploads, email service
│
└── 🗄️ Database (MongoDB)
    └── Collections ── Users, Journeys, Messages, Posts, Stories, Groups...
```

---

## 🔧 Tech Stack

<table>
<tr>
<td align="center" width="14%"><img src="https://skillicons.dev/icons?i=react" width="40"/><br><b>React 18</b></td>
<td align="center" width="14%"><img src="https://skillicons.dev/icons?i=nodejs" width="40"/><br><b>Node.js</b></td>
<td align="center" width="14%"><img src="https://skillicons.dev/icons?i=express" width="40"/><br><b>Express</b></td>
<td align="center" width="14%"><img src="https://skillicons.dev/icons?i=mongodb" width="40"/><br><b>MongoDB</b></td>
<td align="center" width="14%"><img src="https://skillicons.dev/icons?i=tailwind" width="40"/><br><b>Tailwind</b></td>
<td align="center" width="14%"><img src="https://skillicons.dev/icons?i=vercel" width="40"/><br><b>Vercel</b></td>
</tr>
</table>

| Layer | Technologies |
|:------|:------------|
| **Frontend** | React 18, Tailwind CSS, Framer Motion, React Router v6, Axios, Socket.IO Client, Recharts, MUI Data Grid, Formik, SweetAlert2, Lucide Icons |
| **Backend** | Node.js, Express.js, Mongoose, Socket.IO, JWT, Bcrypt.js, Multer, Nodemailer |
| **Database** | MongoDB Atlas |
| **Storage** | Cloudinary CDN (images & media) |
| **Security** | Helmet, CORS, Rate Limiting, XSS Clean, HPP, Mongo Sanitize, Express Mongo Sanitize |
| **Deployment** | Vercel (Frontend), Backend hosted separately |

---

## 📂 Project Structure

<details>
<summary><b>📁 Backend — 15 Controllers · 29 Models · 17 Routes</b> (click to expand)</summary>

```
backend/
├── server.js                    # Entry point + Socket.IO setup
├── config/
│   ├── db.js                    # MongoDB connection
│   └── jwt.js                   # JWT configuration
├── controllers/
│   ├── authController.js        # Login, Register, Password Reset
│   ├── userController.js        # Profile CRUD, Follow/Unfollow
│   ├── chatController.js        # Chat rooms, messages, real-time
│   ├── socialTravelController.js # Groups, buddy matching, social features
│   ├── journeyController.js     # Journey CRUD, workspace, timeline
│   ├── musicController.js       # Background music & playlists
│   ├── emergencyController.js   # SOS & emergency contacts
│   ├── securityController.js    # Privacy & security preferences
│   ├── settingsController.js    # User settings management
│   ├── notificationController.js # Push notifications
│   ├── adminController.js       # Admin operations & moderation
│   ├── contactController.js     # Contact form handling
│   ├── supportController.js     # Help tickets & support
│   ├── legalController.js       # Terms & privacy content
│   └── uploadController.js      # File & image uploads
├── models/                      # 29 Mongoose schemas
│   ├── User.js, Journey.js, Post.js, Story.js, Message.js
│   ├── ChatRoom.js, TravelGroup.js, Comment.js, Follow.js
│   ├── Block.js, Report.js, Notification.js, SavedPost.js
│   ├── EmergencyContact.js, SecurityPreference.js, Session.js
│   ├── JourneyGallery.js, JourneyMemory.js, JourneyTimeline.js
│   ├── JourneyWorkspace.js, JourneyInvitation.js, JourneyMember.js
│   ├── JoinRequest.js, Contact.js, SupportTicket.js
│   ├── FAQ.js, LegalContent.js, ReportProblem.js
│   └── UserSettings.js
├── routes/                      # 17 route files
├── middleware/                   # Auth, token verification, error handling
└── utils/                       # Cloudinary, email service
```

</details>

<details>
<summary><b>📁 Frontend — 16+ Pages · 18 Component Directories</b> (click to expand)</summary>

```
frontend/src/
├── App.js                       # Root component + routing
├── pages/
│   ├── Home.jsx                 # Landing page
│   ├── Login.jsx                # User login
│   ├── Register.jsx             # User registration
│   ├── Profile.jsx              # User profile (104KB+ of features!)
│   ├── Profileupdate.jsx        # Edit profile
│   ├── Admin.jsx                # Admin dashboard
│   ├── ForgotPassword.jsx       # Password recovery
│   ├── ResetPassword.jsx        # Password reset
│   ├── ContactUs.jsx            # Contact form
│   ├── PrivacyPolicy.jsx        # Privacy policy
│   ├── Terms.jsx                # Terms of service
│   └── social/
│       ├── TravelBuddyHub.jsx   # Find journey mates
│       ├── TravelBuddyDetails.jsx # Buddy profile details
│       ├── ChatRoom.jsx         # Real-time messaging
│       ├── MyJourneys.jsx       # Journey management
│       ├── JourneyDetailsPage.jsx # Journey details
│       ├── CreateBuddyTrip.jsx  # Create group journeys
│       ├── FeltVibes.jsx        # Mood & vibes sharing
│       ├── EmergencyContacts.jsx # Emergency contacts
│       ├── Settings.jsx         # User preferences
│       ├── HelpSupport.jsx      # Help & FAQ
│       ├── BlockedUsers.jsx     # Blocked users list
│       └── ReportProblem.jsx    # Report issues
├── components/                  # 18 component directories
│   ├── chat/                    # Chat UI components
│   ├── journey/                 # Journey cards & views
│   ├── post/                    # Post creation & feed
│   ├── story/                   # Story viewer & creator
│   ├── social/                  # Social interaction widgets
│   ├── profile/                 # Profile sections
│   ├── navbar/                  # Navigation bar
│   ├── footer/                  # Footer
│   ├── admin/                   # Admin panel components
│   ├── modals/                  # Modal dialogs
│   ├── settings/                # Settings panels
│   ├── ui/                      # Reusable UI elements
│   ├── common/                  # Shared components
│   ├── home/                    # Homepage sections
│   ├── services/                # Service components
│   ├── datatable/               # Data grid tables
│   ├── spinner/                 # Loading states
│   └── Layout/                  # Page layout wrapper
├── context/                     # React Context providers
├── hooks/                       # Custom React hooks
├── services/                    # API service functions
├── socket/                      # Socket.IO client setup
├── reducers/                    # State reducers
├── router/                      # Route definitions
├── api/                         # Axios configuration
├── constants/                   # App constants
├── utils/                       # Helper utilities
└── assets/images/               # Static images
```

</details>

---

## 🚀 Getting Started

### Prerequisites

```
Node.js  ≥ v14
MongoDB  (local or Atlas)
Git
```

### 1️⃣ Clone & Install

```bash
git clone https://github.com/sandhyawani/Go-yatriGo.git
cd Go-yatriGo
```

### 2️⃣ Backend Setup

```bash
cd backend
npm install
```

Create a `.env` file in `/backend`:

```env
MONGODB_URI=your-mongodb-connection-string
JWT_SECRET=your-jwt-secret
CLOUDINARY_NAME=your-cloudinary-name
CLOUDINARY_API_KEY=your-api-key
CLOUDINARY_API_SECRET=your-api-secret
SMTP_EMAIL=your-email
SMTP_PASSWORD=your-email-password
```

```bash
npm start          # Production
npm run dev        # Development (with nodemon)
```

### 3️⃣ Frontend Setup

```bash
cd frontend
npm install
npm start
```

> App runs at **`http://localhost:3000`**

---

## 🔐 Security

Go yatriGo takes security seriously with multiple layers of protection:

| Feature | Implementation |
|:--------|:--------------|
| Authentication | JWT tokens with secure HTTP-only cookies |
| Password Security | Bcrypt hashing with salt rounds |
| API Protection | Rate limiting, Helmet headers, CORS |
| Data Sanitization | XSS Clean, HPP, Mongo Sanitize |
| User Safety | Block/Report system, Admin moderation |
| Emergency | SOS alerts, Emergency contact management |

---

## 📡 API Endpoints

| Route | Description |
|:------|:-----------|
| `/api/auth` | Login, Register, Password Reset, Token Refresh |
| `/api/users` | Profile CRUD, Follow/Unfollow, Search Users |
| `/api/posts` | Create, Read, Update, Delete Posts & Stories |
| `/api/chat` | Chat Rooms, Messages, Real-time Events |
| `/api/travel` | Groups, Buddy Matching, Social Features |
| `/api/journey` | Journey CRUD, Workspace, Timeline, Gallery |
| `/api/emergency` | SOS Alerts, Emergency Contacts |
| `/api/security` | Privacy Settings, Security Preferences |
| `/api/admin` | User Management, Content Moderation |
| `/api/notifications` | Push Notifications, Read Status |
| `/api/settings` | User Preferences, Account Settings |
| `/api/support` | Help Tickets, FAQ, Contact Requests |

---

## 🔮 What's Next

- [ ] 📍 Location-based recommendations with maps integration
- [ ] 📅 Smart trip planner with AI suggestions
- [ ] 💰 Group budget tracker & expense splitting
- [ ] 🗓️ Shared itinerary builder
- [ ] 📱 Mobile app (React Native)
- [ ] 📊 Advanced analytics & journey insights
- [ ] 🌐 Multi-language support

---

## 🤝 Contributing

Contributions are welcome! Here's how:

```bash
# 1. Fork the repo
# 2. Create a feature branch
git checkout -b feature/YourFeature

# 3. Commit your changes
git commit -m "Add YourFeature"

# 4. Push & open a PR
git push origin feature/YourFeature
```

---

## 📄 License

This project is licensed under the **MIT License** — see the [LICENSE](LICENSE) file for details.

---

<p align="center">
  <b>Built with ❤️ by <a href="https://github.com/sandhyawani">Sandhya Wani</a></b>
</p>

<p align="center">
  <a href="https://github.com/sandhyawani/Go-yatriGo"><img src="https://img.shields.io/badge/⭐_Star_this_repo-FF6B35?style=for-the-badge&labelColor=1D3557" alt="Star"/></a>
  <a href="https://github.com/sandhyawani/Go-yatriGo/issues"><img src="https://img.shields.io/badge/🐛_Report_Bug-E63946?style=for-the-badge&labelColor=1D3557" alt="Bug"/></a>
  <a href="https://github.com/sandhyawani/Go-yatriGo/pulls"><img src="https://img.shields.io/badge/✨_Request_Feature-A8DADC?style=for-the-badge&labelColor=1D3557" alt="Feature"/></a>
</p>

<p align="center">
  <img src="https://readme-typing-svg.demolab.com?font=Fira+Code&size=14&pause=1000&color=A8DADC&center=true&vCenter=true&repeat=false&width=400&lines=Go+yatriGo+—+Because+every+journey+matters." alt="Footer" />
</p>
