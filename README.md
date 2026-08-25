<div align="center">

# 🌍 Go YatriGo
### *Connect. Travel Together. Share the Journey.*

An advanced, full-stack social travel platform built to connect solo travelers, coordinate group journeys, share real-time travel memories, and ensure safety on the road.

---

[![React](https://img.shields.io/badge/React_18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Node.js](https://img.shields.io/badge/Node.js-43853D?style=for-the-badge&logo=node.js&logoColor=white)](https://nodejs.org/)
[![Express.js](https://img.shields.io/badge/Express.js-404D59?style=for-the-badge)](https://expressjs.com/)
[![MongoDB](https://img.shields.io/badge/MongoDB-4EA94B?style=for-the-badge&logo=mongodb&logoColor=white)](https://www.mongodb.com/)
[![Socket.io](https://img.shields.io/badge/Socket.io-010101?style=for-the-badge&logo=socket.io&logoColor=white)](https://socket.io/)
[![Cloudinary](https://img.shields.io/badge/Cloudinary-3448C5?style=for-the-badge&logo=cloudinary&logoColor=white)](https://cloudinary.com/)

</div>

---

## 🚀 Live Demo & Deployment

Experience Go YatriGo live in action:

| Environment | Link | Status |
| :--- | :--- | :--- |
| **🌐 Live Web App** | [go-yatri-go.vercel.app](https://go-yatri-go.vercel.app/) | ![Deployment](https://img.shields.io/badge/Status-Active-brightgreen?style=flat-square) |
| **📁 GitHub Repository** | [github.com/sandhyawani/Go-yatriGo](https://github.com/sandhyawani/Go-yatriGo) | ![GitHub Stars](https://img.shields.io/github/stars/sandhyawani/Go-yatriGo?style=social) |

> 💡 **Explore**: Register a new account or explore public journeys, travel memories, and travel buddy squads directly from the live platform.

---

## ✨ Key Features

- 🎒 **Journey Hub & Group Squads**: Create, discover, and organize trips with custom dates, destinations, companion limits, approval workflows, and host management.
- 💬 **Real-Time Interactive Chat**: 1-on-1 private messaging and journey group rooms with live online presence, typing indicators, read receipts, and media attachments.
- 📸 **Travel Memories & Dispatches**: Share photos, ephemeral stories with background music & stickers, and react with likes (*"Felt vibes"*) and comments.
- 🛡️ **Safety SOS & Journey Timeline**: Real-time milestone check-ins, automated conflict alerts for overlapping trips, and instant SOS emergency broadcasting.
- 👥 **Social Network & Community**: User profiles, follow/unfollow mechanisms, verification badges, private account requests, and safety blocking.
- 🗺️ **Location Exploration**: Discover active journeys and travelers filtered by city, state, or nationwide radius.

---

## 🛠️ Technology Stack

<div align="center">

### 🎨 Frontend Ecosystem

| Technology | Purpose | Description |
| :--- | :--- | :--- |
| **React 18** | UI Framework | Component-based interactive user interface |
| **React Router v6** | Navigation & Routing | Client-side page navigation with protected route guards |
| **Tailwind CSS** | Styling Engine | Utility-first responsive design and styling |
| **Framer Motion** | Animations | Smooth page transitions, modals, and interactive UI micro-animations |
| **Headless UI & Material Tailwind** | UI Components | Accessible dropdowns, dialogs, drawers, and tabs |
| **Socket.IO Client** | Real-Time Transport | Websocket connection for live chat, presence, and alerts |
| **Axios** | HTTP Client | Promise-based API requests with credentials and interceptors |
| **Lucide & FontAwesome** | Iconography | Modern, consistent iconography across all screens |

<br />

### ⚙️ Backend & Database Architecture

| Technology | Purpose | Description |
| :--- | :--- | :--- |
| **Node.js & Express.js** | Server Runtime | RESTful API server, middleware pipeline, and WebSocket gateway |
| **MongoDB & Mongoose** | Database & ODM | Scalable document storage with schemas, indexes, and aggregation |
| **Socket.IO Server** | Real-Time Engine | Bidirectional event-driven communication for live chat and notifications |
| **JWT (JSON Web Tokens)** | Authentication | Stateless secure user sessions and authorization |
| **BcryptJS** | Security | Cryptographic password hashing |
| **Cloudinary SDK & Multer** | Media Management | Cloud image and media storage with direct uploads |
| **Helmet & Security Suite** | Protection | HTTP header security, rate limiting, and NoSQL injection sanitization |
| **Winston & Morgan** | Observability | Structured HTTP request and server error logging |

</div>

---

## 🏗️ Architecture & Project Structure

```
Go yatriGo/
├── backend/
│   ├── config/          # DB connection, JWT, and environment validators
│   ├── controllers/     # API request handlers and business logic
│   ├── middleware/      # Auth verification, rate limiting, security guards
│   ├── models/          # Mongoose database schemas
│   ├── routes/          # Express REST endpoint routes
│   ├── services/        # Domain logic services (eligibility, etc.)
│   ├── utils/           # Helper utilities (notifications, media, blocking)
│   ├── server.js        # Express application and Socket.IO entrypoint
│   └── package.json
│
├── frontend/
│   ├── public/          # Static assets and index.html
│   ├── src/
│   │   ├── api/         # Axios instance and API interceptors
│   │   ├── components/  # Reusable UI components, modals, and widgets
│   │   ├── context/     # React Context providers (Auth, Socket, Notifications)
│   │   ├── hooks/       # Custom React hooks
│   │   ├── pages/       # Application views and routes
│   │   ├── services/    # Frontend API services
│   │   ├── utils/       # Frontend helper functions and utilities
│   │   ├── App.js       # Root application router
│   │   └── index.js     # React client entrypoint
│   └── package.json
│
├── README.md            # Project documentation
└── .gitignore           # Git ignore rules
```

---

## ⚙️ Environment Configuration

Copy the provided example files to create your local `.env` configurations:

### 1. Backend (`backend/.env`)
```env
PORT=5000
NODE_ENV=development
CLIENT_URL=http://localhost:3000
MONGO_URI=mongodb://localhost:27017
MONGO_DB_NAME=goyatrigo
JWT_SECRET=your_super_secret_jwt_key
JWT_EXPIRES_IN=30d
CLOUDINARY_CLOUD_NAME=your_cloudinary_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret
EMAIL_USER=your_email@gmail.com
EMAIL_PASS=your_email_app_password
FROM_NAME="Go YatriGo"
IMAGE_PROVIDER_API_KEY=your_optional_image_api_key
```

### 2. Frontend (`frontend/.env`)
```env
REACT_APP_API_URL=http://localhost:5000/api
REACT_APP_SOCKET_URL=http://localhost:5000
REACT_APP_CLOUDINARY_CLOUD=your_cloudinary_name
REACT_APP_CLOUDINARY_PRESET=your_upload_preset
REACT_APP_CLOUDINARY_URL=https://api.cloudinary.com/v1_1/your_cloudinary_name/image/upload
```

---

## 🏁 Getting Started Locally

### Prerequisites
- [Node.js](https://nodejs.org/) (v18 or higher recommended)
- [MongoDB](https://www.mongodb.com/) (Local instance or MongoDB Atlas cluster)
- [Cloudinary](https://cloudinary.com/) free tier account for media uploads

### 1. Clone the Repository
```bash
git clone https://github.com/sandhyawani/Go-yatriGo.git
cd Go-yatriGo
```

### 2. Start Backend Server
```bash
cd backend
npm install
npm run dev
```
> Server will start on `http://localhost:5000`

### 3. Start Frontend Application
```bash
cd ../frontend
npm install
npm start
```
> Frontend will launch automatically on `http://localhost:3000`

### 4. Build for Production
```bash
cd frontend
npm run build
```

---

## 📄 License
This project is open-source and available under the [MIT License](LICENSE).

<div align="center">
  <sub>Built with ❤️ for passionate travelers worldwide.</sub>
</div>
