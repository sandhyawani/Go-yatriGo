# Go YatriGo

## Overview
Go YatriGo is a modern, full-featured social travel platform designed to connect travelers, organize collaborative group journeys, discover travel buddies, share travel memories, and manage trip logistics with real-time communication and safety features.

## Features
- **Authentication & Security**: Secure user registration, login, password recovery, JWT-based authentication, rate limiting, and HTTP-only cookie sessions.
- **Social Networking & Community**: User profiles, follow/unfollow mechanisms, follow requests for private profiles, bidirectional blocking/safety controls, user reviews, and verification badges.
- **Travel Memories & Dispatches**: Create and share photo memories and ephemeral travel dispatches (stories) with stickers, music, captions, location tagging, likes ("felt vibes"), and comments.
- **Journey Hub & Trip Squads**: Create, discover, and organize journeys with custom dates, destinations, companion limits, membership requests, co-organizer delegation, and host ownership transfers.
- **Real-Time Interactive Chat**: Direct 1-on-1 messaging, group chats for journeys, live online presence, typing indicators, read receipts, unsending, and media sharing powered by Socket.IO.
- **Journey Timeline & Safety SOS**: Sequential milestone progression, safe check-in confirmations, automated conflict detection for overlapping dates, and urgent SOS alerts.
- **Media Management**: High-performance image and media uploads integrated with Cloudinary and automatic destination cover photo matching.

## Tech Stack
### Frontend
- **Core**: React 18, React Router DOM v6
- **Styling & UI**: Tailwind CSS, Headless UI, Material Tailwind, Framer Motion
- **Icons**: Lucide React, FontAwesome, Material Icons
- **Real-time & Network**: Socket.IO Client, Axios
- **Utilities**: Moment.js, React Datepicker, Browser Image Compression, Sonner & SweetAlert2

### Backend
- **Core**: Node.js, Express.js
- **Database**: MongoDB with Mongoose ODM
- **Real-time Engine**: Socket.IO
- **Authentication**: JSON Web Tokens (JWT), BcryptJS
- **Media**: Cloudinary SDK, Multer, Multer Storage Cloudinary
- **Security & Logging**: Helmet, Express Mongo Sanitize, HPP, XSS-Clean, Winston Logger, Morgan

## Architecture & Project Structure
```
Go yatriGo/
├── backend/
│   ├── config/          # DB, JWT, and environment configurations
│   ├── controllers/     # API request handlers and business logic
│   ├── middleware/      # Auth verification, error handling, rate limiting
│   ├── models/          # Mongoose database schemas
│   ├── routes/          # Express route definitions
│   ├── services/        # Business logic services (eligibility, etc.)
│   ├── utils/           # Helper utilities (notifications, media, blocking)
│   ├── server.js        # Express app and Socket.IO server entrypoint
│   └── package.json
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
│   │   ├── App.js       # Root application component
│   │   └── index.js     # React entrypoint
│   └── package.json
└── README.md
```

## Environment Variables
Environment variable templates are provided in both `backend/.env.example` and `frontend/.env.example`. Copy them to create your local `.env` files.

### Backend (`backend/.env`)
- `PORT`: Port for the backend server (e.g. `5000`)
- `NODE_ENV`: Application environment (`development` or `production`)
- `CLIENT_URL`: URL of the client application (e.g. `http://localhost:3000`)
- `MONGO_URI`: MongoDB connection string
- `MONGO_DB_NAME`: Database name (e.g. `goyatrigo`)
- `JWT_SECRET`: Secret key for signing JWT tokens
- `JWT_EXPIRES_IN`: Token validity duration (e.g. `30d`)
- `CLOUDINARY_CLOUD_NAME`: Cloudinary account name
- `CLOUDINARY_API_KEY`: Cloudinary API key
- `CLOUDINARY_API_SECRET`: Cloudinary API secret
- `EMAIL_USER`: SMTP user for email notifications / password resets
- `EMAIL_PASS`: SMTP password
- `FROM_NAME`: Sender display name
- `IMAGE_PROVIDER_API_KEY`: Optional API key for automatic cover image lookup

### Frontend (`frontend/.env`)
- `REACT_APP_API_URL`: Backend API base URL (e.g. `http://localhost:5000/api`)
- `REACT_APP_SOCKET_URL`: Socket.IO backend URL (e.g. `http://localhost:5000`)
- `REACT_APP_CLOUDINARY_CLOUD`: Cloudinary account name
- `REACT_APP_CLOUDINARY_PRESET`: Cloudinary upload preset
- `REACT_APP_CLOUDINARY_URL`: Cloudinary direct upload URL

## Local Setup

### 1. Prerequisites
- Node.js (v18 or higher recommended)
- MongoDB instance (local or MongoDB Atlas)
- Cloudinary account

### 2. Running Backend
```bash
cd backend
npm install
npm run dev
# Or for production:
# npm start
```

### 3. Running Frontend
```bash
cd frontend
npm install
npm start
```

### 4. Production Build
```bash
cd frontend
npm run build
```
