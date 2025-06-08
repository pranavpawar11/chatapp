# 💬 ChatApp - Real-Time MERN Stack Chat Application

A modern, feature-rich real-time messaging application built with the **MERN Stack** (MongoDB, Express.js, React.js, Node.js), featuring group chats, private messaging, media sharing, and a beautiful responsive UI with dark mode support - designed to provide a WhatsApp-like experience.

## ✨ Features

### 💬 Real-Time Messaging
- Built using **Socket.io** for instant communication
- Real-time message updates with **timestamps**, **sender info**, and **message status indicators**
- **Typing indicators** to show when users are composing messages
- **Message status tracking** with single/double tick indicators (delivered/seen)

### 🏠 Dual Chat System
- **Group Chat Rooms**: Create and join public/private group conversations
- **Private Messaging**: Direct one-on-one conversations between users
- Share room IDs to invite others to group chats
- Seamless switching between group and private chats

### 📱 Media & Communication
- **Media Sharing**: Send images, videos, and files in chats
- **Emoji Support**: Built-in emoji picker for expressive messaging
- **Profile Customization**: Upload profile pictures and set bio/status
- **Message Formatting**: Rich text support with timestamps

### 👥 User Management
- **Online Status**: Real-time display of active users
- **User Profiles**: View and edit user profiles with bio and avatar
- **Authentication System**: Secure login and signup with JWT tokens
- **Profile Settings**: Update personal information and preferences

### 🌓 Modern UI/UX
- **Light & Dark Mode**: Toggle between themes with persistent preference
- **Responsive Design**: Optimized for desktop, tablet, and mobile devices
- **WhatsApp-like Interface**: Familiar chat experience with modern aesthetics
- **Smooth Animations**: Fluid transitions and loading states
- **Collapsible Sidebar**: Space-efficient navigation on smaller screens

### 🔐 Security & Performance
- **JWT Authentication**: Secure token-based user authentication
- **File Upload Security**: Safe media handling with file type validation
- **Error Handling**: Comprehensive error management and user feedback
- **Connection Resilience**: Auto-reconnection for network interruptions

### 💾 Data Persistence
- **MongoDB Integration**: Reliable message and user data storage
- **Chat History**: Complete conversation history across sessions
- **Media Storage**: Secure file upload and retrieval system

---

## 🛠️ Technology Stack

### Frontend
- **React.js** (Functional Components & Hooks)
- **React Router DOM** - Client-side routing
- **Socket.io Client** - Real-time communication
- **Tailwind CSS** - Modern styling and responsive design
- **Context API** - State management for auth, socket, and theme

### Backend
- **Node.js** - Server runtime environment
- **Express.js** - Web application framework
- **Socket.io** - WebSocket implementation for real-time features
- **MongoDB** - NoSQL database for data persistence
- **Mongoose** - MongoDB object modeling
- **JWT** - JSON Web Tokens for authentication
- **Multer** - File upload middleware
- **bcryptjs** - Password hashing

---

## 📁 Project Structure

```
ChatApp/
├── 📂 chat-app/                           # React Frontend
│   ├── 📂 src/
│   │   ├── 📂 components/
│   │   │   ├── 📂 auth/
│   │   │   │   ├── 📄 Login.jsx           # User login component
│   │   │   │   └── 📄 Signup.jsx          # User registration component
│   │   │   └── 📂 Dashboard/
│   │   │       ├── 📄 ChatArea.jsx        # Main chat interface
│   │   │       ├── 📄 CreateRoomModal.jsx # Room creation modal
│   │   │       ├── 📄 Dashboard.jsx       # Main dashboard component
│   │   │       ├── 📄 EmojiPicker.jsx     # Emoji selection component
│   │   │       ├── 📄 Message.jsx         # Individual message component
│   │   │       ├── 📄 ProfileSettings.jsx # User profile management
│   │   │       ├── 📄 RoomItem.jsx        # Room list item component
│   │   │       ├── 📄 RoomList.jsx        # Room listing component
│   │   │       ├── 📄 Sidebar.jsx         # Navigation sidebar
│   │   │       ├── 📄 UserItem.jsx        # User list item component
│   │   │       └── 📄 UserList.jsx        # Online users component
│   │   ├── 📂 Context/
│   │   │   ├── 📄 AuthContext.js          # Authentication state management
│   │   │   ├── 📄 SocketContext.js        # Socket connection management
│   │   │   └── 📄 ThemeContext.js         # Theme state management
│   │   ├── 📄 App.js                      # Main application component
│   │   └── 📄 index.js                    # React entry point
│   └── 📄 package.json
├── 📂 server/                             # Node.js Backend
│   ├── 📂 config/
│   │   ├── 📄 db.js                       # MongoDB connection setup
│   │   ├── 📄 multer.js                   # File upload configuration
│   │   └── 📄 socket.js                   # Socket.io configuration
│   ├── 📂 controllers/
│   │   ├── 📄 authController.js           # Authentication logic
│   │   ├── 📄 chatController.js           # Chat operations
│   │   ├── 📄 messageController.js        # Message handling
│   │   ├── 📄 roomController.js           # Room management
│   │   ├── 📄 uploadController.js         # File upload handling
│   │   └── 📄 userController.js           # User operations
│   ├── 📂 middleware/
│   │   ├── 📄 auth.js                     # JWT verification
│   │   ├── 📄 authMiddleware.js           # Authentication middleware
│   │   └── 📄 errorHandler.js             # Global error handling
│   ├── 📂 models/
│   │   ├── 📄 Message.js                  # Message schema
│   │   ├── 📄 Room.js                     # Room schema
│   │   └── 📄 User.js                     # User schema
│   ├── 📂 routes/
│   │   ├── 📄 authRoutes.js               # Authentication endpoints
│   │   ├── 📄 chatRoutes.js               # Chat-related endpoints
│   │   ├── 📄 messageRoutes.js            # Message endpoints
│   │   ├── 📄 roomRoutes.js               # Room management endpoints
│   │   ├── 📄 uploadRoutes.js             # File upload endpoints
│   │   └── 📄 userRoutes.js               # User management endpoints
│   ├── 📂 socket/
│   │   └── 📄 socketHandler.js            # Socket event handling
│   ├── 📂 uploads/                        # Media file storage
│   │   ├── 📂 profiles/                   # Profile pictures
│   │   └── 📂 chat-media/                 # Chat media files
│   ├── 📄 app.js                          # Express app configuration
│   ├── 📄 index.js                        # Server startup
│   └── 📄 package.json
└── 📄 README.md
```

---

## 🚀 Setup Instructions

### Prerequisites
- **Node.js** (v16 or higher)
- **MongoDB** (local installation or MongoDB Atlas)
- **npm** or **yarn** package manager

### 1. Clone the Repository
```bash
git clone https://github.com/pranavpawar11/ChatApp.git
cd ChatApp
```

### 2. Database Setup
**Option A: Local MongoDB**
```bash
# Install MongoDB locally and start the service
mongod
```

**Option B: MongoDB Atlas (Cloud)**
1. Create account at [MongoDB Atlas](https://www.mongodb.com/atlas)
2. Create a new cluster and get connection string
3. Add your IP to whitelist

### 3. Backend Setup
```bash
cd server
npm install

# Create environment file
touch .env
```

**Add the following to `.env`:**
```env
# Database
MONGODB_URI=mongodb://localhost:27017/chatapp
# Or for MongoDB Atlas:
# MONGODB_URI=mongodb+srv://username:password@cluster.mongodb.net/chatapp

# JWT Secret
JWT_SECRET=your_super_secret_jwt_key_here

# Server Configuration
PORT=5000
NODE_ENV=development

# Client URL (for CORS)
CLIENT_URL=http://localhost:3000

# File Upload
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

**Start the backend server:**
```bash
npm run dev
# or
npm start
```

### 4. Frontend Setup
```bash
cd chat-app
npm install

# Create environment file (optional)
touch .env
```

**Add the following to `.env` (optional):**
```env
REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

**Start the React application:**
```bash
npm start
```

### 5. Access the Application
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:5000
- **Socket.io**: Connected automatically to backend

---

## 🔧 Environment Variables

### Server (.env)
```env
MONGODB_URI=mongodb://localhost:27017/chatapp
JWT_SECRET=your_jwt_secret_key
PORT=5000
CLIENT_URL=http://localhost:3000
NODE_ENV=development
MAX_FILE_SIZE=10485760
UPLOAD_PATH=./uploads
```

### Client (.env) - Optional
```env
REACT_APP_SERVER_URL=http://localhost:5000
REACT_APP_SOCKET_URL=http://localhost:5000
```

---

## 📱 Key Features Showcase

### 🔐 Authentication System
- **Secure Registration**: Email-based signup with password validation
- **JWT Login**: Token-based authentication with persistent sessions
- **Profile Management**: Update avatar, bio, and personal information

### 💬 Advanced Messaging
- **Real-time Delivery**: Instant message transmission using Socket.io
- **Message Status**: Visual indicators for sent, delivered, and read messages
- **Typing Indicators**: See when other users are composing messages
- **Media Support**: Share images, videos, and files seamlessly

### 🏠 Flexible Chat Options
- **Group Rooms**: Create public or private group conversations
- **Direct Messages**: Private one-on-one conversations
- **Room Management**: Admin controls for group settings
- **User Presence**: Real-time online/offline status

### 🎨 Modern Interface
- **Responsive Design**: Optimized for all device sizes
- **Dark/Light Themes**: User preference with system detection
- **WhatsApp-inspired UI**: Familiar and intuitive user experience
- **Smooth Animations**: Polished interactions and transitions

---

## 🔐 API Endpoints

### Authentication
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login
- `GET /api/auth/verify` - Verify JWT token

### Users
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `POST /api/users/avatar` - Upload profile picture

### Rooms
- `GET /api/rooms` - Get user's rooms
- `POST /api/rooms` - Create new room
- `GET /api/rooms/:id` - Get room details
- `PUT /api/rooms/:id` - Update room
- `DELETE /api/rooms/:id` - Delete room

### Messages
- `GET /api/messages/:roomId` - Get room messages
- `POST /api/messages` - Send new message
- `PUT /api/messages/:id/read` - Mark message as read

### File Upload
- `POST /api/upload/chat` - Upload chat media
- `POST /api/upload/profile` - Upload profile picture

---

## 🎯 Technical Implementation Highlights

### Frontend Architecture
- **React Hooks**: Modern functional components with useState, useEffect, useContext
- **Context API**: Global state management for authentication, socket, and theme
- **Component Reusability**: Modular design with props and event handling
- **Responsive Design**: Mobile-first approach with Tailwind CSS

### Backend Architecture
- **RESTful API**: Clean endpoint structure following REST principles
- **Middleware Pipeline**: Authentication, error handling, and file upload middleware
- **Database Modeling**: Efficient MongoDB schemas with Mongoose
- **Socket.io Integration**: Real-time event handling and room management

### Real-Time Features
- **Socket.io Events**: Custom events for messaging, typing, and user presence
- **Room Management**: Dynamic room joining/leaving with user tracking
- **Message Broadcasting**: Efficient message distribution to room participants
- **Connection Handling**: Graceful disconnection and reconnection logic

### Security Implementation
- **JWT Authentication**: Secure token-based user sessions
- **Password Hashing**: bcryptjs for secure password storage
- **File Validation**: Multer configuration for safe file uploads
- **CORS Configuration**: Proper cross-origin resource sharing setup

---

## 📸 Screenshots and Demo

### 🔐 Authentication – Sign Up & Login  
![Sign Up Screen](screenshots/Signup.png)  
*Modern, responsive sign-up screen with user-friendly design and validation*  

![Login Screen](screenshots/login.png)  
*Sleek login interface with dark mode support and secure authentication*  

---

### 🏠 Homepage  
![Homepage](screenshots/Homepage.png)  
*Central hub showing recent chats, contacts, and quick navigation to personal or group conversations*

---

### 💬 1-on-1 Chat  
![1-on-1 Chat](screenshots/Chat.png)  
*Private chat window with real-time messaging, emoji picker, file sharing, and read receipts*

---

### 👥 Group Chat  
![Group Chat](screenshots/GroupChat.png)  
*Group chat interface supporting multiple users, media sharing, message reactions, and mentions*

---

### ➕ Create Room  
![Create Room](screenshots/CreateRoom.png)  
*Simple UI to create new chat rooms or group chats with custom names and member selection*

---

### 👤 Profile Settings  
![Profile Settings](screenshots/Profile.png)  
*User profile management page with avatar upload, name editing, and status customization*

---

### 🌞 Light Mode  
![Light Mode](screenshots/Lightmode.png)  
*Clean and minimal light theme offering excellent readability and visual comfort*

---

### 🎥 ChatApp Demo Video  
📺 **Watch the full walkthrough of the ChatApp experience:**  
👉 [Click here to watch the demo video](screenshots/Chat-Demo.mp4)

---

## 🤝 Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/AmazingFeature`)
3. Commit your changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 👨‍💻 Developer

**Pranav Pawar**
- GitHub: [@pranavpawar11](https://github.com/pranavpawar11)
- LinkedIn: [Pranav Pawar](https://www.linkedin.com/in/pranav-pawar-4a37092b7/)
- Portfolio: [Pranav Pawar](https://6828739229acb1ade3de3e02--pranavpawar745.netlify.app/)
- Email: pranavpawar745@gmail.com


⭐ **If you found this project helpful, please give it a star!** ⭐
