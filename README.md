# Go yatriGo - Travel Companion Application

A full-stack MERN (MongoDB, Express, React, Node.js) application designed to connect travelers and create a vibrant travel community. Go yatriGo enables users to find travel buddies, share experiences, and explore the world together.

## 📱 Features

### User Management
- User authentication and registration with JWT tokens
- Profile creation and updates
- User preferences and settings
- Security and privacy controls

### Social Travel Features
- **Travel Buddy Hub**: Find and connect with other travelers
- **Travel Groups**: Create or join travel groups with specific interests
- **Social Timeline**: Share travel posts, stories, and memories
- **Chat & Messaging**: Real-time communication with other travelers via WebSockets
- **Follow System**: Follow other users to stay updated on their travels

### Travel Safety
- **Emergency SOS**: Quick access to emergency contacts
- **Emergency Contacts**: Save and manage emergency contact information
- **Safety Guidelines**: Travel safety tips and best practices
- **Security Preferences**: Customize privacy and security settings

### Content Management
- **Posts & Stories**: Share travel experiences with photos and descriptions
- **Comments & Engagement**: Interact with other travelers' content
- **Saved Posts**: Bookmark interesting travel posts for later
- **Block & Report**: Safety features to block users or report inappropriate content

### Support System
- **Help & Support**: User support tickets and FAQs
- **Contact Requests**: Accept or decline travel buddy requests
- **Moderation Pipeline**: Admin moderation for content safety

## 🏗️ Project Structure

### Backend (`/backend`)
Built with Express.js and Node.js

**Controllers:**
- `authController.js` - Authentication and user registration
- `userController.js` - User profile and settings management
- `chatController.js` - Real-time chat functionality
- `socialTravelController.js` - Travel groups and buddy connections
- `postController.js` - Post and story management
- `securityController.js` - Security and privacy features
- `emergencyController.js` - Emergency contact management
- `notificationController.js` - User notifications
- `adminController.js` - Admin operations and moderation
- `uploadController.js` - File upload and image management

**Models:**
- `User.js` - User data model
- `TravelGroup.js` - Travel group model
- `ChatRoom.js` - Chat room and messaging model
- `Message.js` - Message model
- `Post.js` - Travel post model
- `Story.js` - User story model
- `Comment.js` - Comment model
- `Follow.js` - User follow relationship
- `Block.js` - User block relationship
- `EmergencyContact.js` - Emergency contact information
- `SecurityPreference.js` - User security settings
- `JoinRequest.js` - Travel group join requests
- `Notification.js` - User notifications
- `SavedPost.js` - Saved posts
- And more...

**Middleware:**
- `authMiddleware.js` - JWT authentication
- `verifyToken.js` - Token verification
- `error.js` - Error handling

**Config:**
- `db.js` - MongoDB connection
- `jwt.js` - JWT configuration
- `nodeCompatibility.js` - Node.js compatibility settings

**Utils:**
- `cloudinary.js` - Image upload to Cloudinary CDN
- `sendEmail.js` - Email notifications

### Frontend (`/frontend`)
Built with React and Tailwind CSS

**Key Components:**
- `/components` - Reusable React components
  - Chat components for real-time messaging
  - Admin components for moderation
  - Social components for travel features
  - UI components for consistent design
  - Modals for user interactions

**Pages:**
- User authentication (login, register, password reset)
- User profile and dashboard
- Travel buddy hub
- Travel group creation and management
- Chat interface
- Admin panel
- Settings and preferences
- Help & support

**Utilities:**
- `axios.js` - API client configuration
- Custom hooks for data fetching
- Image handling and cropping utilities
- Audio management for notifications

**Styling:**
- Tailwind CSS for responsive design
- PostCSS for CSS processing
- Component-specific SCSS files

## 🔧 Technology Stack

### Backend
- **Runtime**: Node.js
- **Framework**: Express.js
- **Database**: MongoDB
- **Authentication**: JWT (JSON Web Tokens)
- **Real-time Communication**: Socket.IO
- **File Storage**: Cloudinary
- **Email**: Nodemailer

### Frontend
- **Library**: React
- **Styling**: Tailwind CSS, PostCSS
- **Data Grid**: @mui/x-data-grid
- **Real-time**: Socket.IO Client
- **HTTP Client**: Axios
- **Build Tool**: Create React App (CRA)

## 🚀 Getting Started

### Prerequisites
- Node.js (v14 or higher)
- MongoDB instance
- Git

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/sandhyawani/Go-yatriGo.git
   cd Go-yatriGo
   ```

2. **Backend Setup**
   ```bash
   cd backend
   npm install
   ```
   
   Create a `.env` file:
   ```
   MONGODB_URI=<your-mongodb-connection-string>
   JWT_SECRET=<your-jwt-secret>
   CLOUDINARY_NAME=<your-cloudinary-name>
   CLOUDINARY_API_KEY=<your-api-key>
   CLOUDINARY_API_SECRET=<your-api-secret>
   SMTP_EMAIL=<your-email>
   SMTP_PASSWORD=<your-password>
   ```
   
   Start the server:
   ```bash
   npm start
   ```

3. **Frontend Setup**
   ```bash
   cd frontend
   npm install
   npm start
   ```
   
   The app will open at `http://localhost:3000`

## 📋 Environment Variables

### Backend
- `MONGODB_URI` - MongoDB connection string
- `JWT_SECRET` - Secret key for JWT signing
- `CLOUDINARY_NAME` - Cloudinary cloud name
- `CLOUDINARY_API_KEY` - Cloudinary API key
- `CLOUDINARY_API_SECRET` - Cloudinary API secret
- `SMTP_EMAIL` - Email for notifications
- `SMTP_PASSWORD` - Email password

## 🔐 Security Features
- JWT-based authentication
- Password hashing
- User privacy controls
- Content moderation system
- Emergency contact protection
- Block and report functionality

## 📝 API Documentation
API endpoints follow RESTful conventions and are organized by feature:
- `/api/auth` - Authentication
- `/api/users` - User management
- `/api/posts` - Post management
- `/api/chat` - Messaging
- `/api/travel` - Travel features
- `/api/emergency` - Emergency features
- `/api/security` - Security settings

## 🤝 Contributing
1. Fork the repository
2. Create a feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

## 📄 License
This project is licensed under the MIT License - see the LICENSE file for details.

## 👤 Author
- **Sandhya Wani** - [@sandhyawani](https://github.com/sandhyawani)

## 🔗 Links
- **Repository**: https://github.com/sandhyawani/Go-yatriGo
- **Issues**: https://github.com/sandhyawani/Go-yatriGo/issues
- **Pull Requests**: https://github.com/sandhyawani/Go-yatriGo/pulls

## 💡 Future Enhancements
- Location-based recommendations
- Trip planning tools
- Budget tracking for group trips
- Travel itinerary sharing
- Integration with maps and travel APIs
- Mobile app development
- Advanced analytics and insights

---

**Happy Traveling! 🌍✈️**
