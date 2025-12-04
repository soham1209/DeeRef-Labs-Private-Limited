# TeamSync – Real-Time Team Chat (MERN + Socket.io)

TeamSync is a Slack-style team communication app built with the **MERN stack** and **Socket.io**.  
It supports workspaces, public and private channels, real-time messaging, typing indicators, and online presence.

---

## ✨ Features

- **Authentication**
  - Signup & Login with JWT
  - Protected REST APIs using `Authorization: Bearer <token>`
- **Channels**
  - List all public channels + private channels you’re a member of
  - Create channels with **name + description**
  - **Private channels** (visible only to members)
  - Join / Leave channels (only public channels can be joined directly)
- **Messaging**
  - Send messages in channels (stored in MongoDB)
  - Load messages with pagination (`limit` + `before` cursor)
  - Real-time message updates across browsers using **Socket.io**
- **Realtime UX**
  - **Online users** list in the right sidebar (per channel)
  - **Typing indicators** (“X is typing…”) across users in the same channel
- **UI**
  - Modern Slack-like UI with React + Vite + Tailwind-style utility classes
  - Left sidebar for channels, center chat area, right sidebar for channel info & members

---

## 🧰 Tech Stack

**Frontend**

- React (Vite)
- Axios
- Socket.io Client
- Tailwind-style utility CSS (via your chosen setup)
- Lucide React icons

**Backend**

- Node.js + Express
- MongoDB + Mongoose
- JSON Web Tokens (JWT) for auth
- bcryptjs for hashing passwords
- Socket.io for realtime communication
- dotenv, cors

---

## 📁 Project Structure

Approximate structure (you may adjust names):

```
project-root/
  backend/
    src/
      server.js
      config/
        db.js
      models/
        User.js
        Channel.js
        Message.js
      controllers/
        authController.js
        channelController.js
        messageController.js
      routes/
        authRoutes.js
        channelRoutes.js
        messageRoutes.js
      middleware/
        authMiddleware.js
      utils/
        generateToken.js
    package.json
    .env

  frontend/
    index.html
    vite.config.js
    package.json
    .env
    src/
      main.jsx
      App.jsx
      api/
        axiosClient.js
        authApi.js
        channelApi.js
        messageApi.js
      realtime/
        socketClient.js
      components/
        auth/
          AuthScreen.jsx
        chat/
          ChatArea.jsx
        layout/
          Sidebar.jsx
          RightSidebar.jsx
        ui/
          Button.jsx
          Input.jsx
          Avatar.jsx
          Modal.jsx
      data/
        mockData.js   # for static avatars etc.
  ```
⚙️ Backend Setup
----------------

### 1\. Install dependencies

From backend/:

```   cd backend  npm install   ```

Typical dependencies used:

*   express
    
*   mongoose
    
*   bcryptjs
    
*   jsonwebtoken
    
*   cors
    
*   dotenv
    
*   socket.io
    
*   dev: nodemon
    

### 2\. Environment variables (backend/.env)

```
   PORT=5000  
   MONGO_URI=mongodb://127.0.0.1:27017/teamsync  
   JWT_SECRET=supersecretjwtkeyhere  
   JWT_EXPIRES_IN=7d  
   CLIENT_URL=http://localhost:5173  
   
```

### 3\. Database connection

src/config/db.js connects to MongoDB using MONGO\_URI.

### 4\. Run backend

In backend/package.json you’ll have something like:

`   "scripts": {    "dev": "nodemon src/server.js"  }   `

Run:

`   npm run dev   `

API will be available at http://localhost:5000.

⚙️ Frontend Setup
-----------------

### 1\. Install dependencies

From frontend/:

`   cd frontend  npm install   `

Typical dependencies used:

*   react, react-dom
    
*   axios
    
*   socket.io-client
    
*   lucide-react
    
*   Tailwind and related plugins (depending on your setup)
    

### 2\. Environment variables (frontend/.env)

`   VITE_API_BASE_URL=http://localhost:5000   `

### 3\. Axios client

src/api/axiosClient.js configures a base Axios instance:

*   baseURL = VITE\_API\_BASE\_URL
    
*   Reads JWT from localStorage key teamsync\_token
    
*   Attaches Authorization: Bearer to every request
    

### 4\. Run frontend

From frontend/:

`   npm run dev   `

Default Vite URL: http://localhost:5173

🔐 Authentication Flow
----------------------

### Backend

*   POST /api/auth/signup
    
    *   Body: { name, email, password }
        
    *   Creates user, hashes password with bcrypt, returns { user, token }
        
*   POST /api/auth/login
    
    *   Body: { email, password }
        
    *   Validates credentials, returns { user, token }
        
*   GET /api/auth/me
    
    *   Requires Authorization: Bearer
        
    *   Returns current { user }
        

Passwords are stored hashed; the authMiddleware verifies the token and attaches req.user.

### Frontend

*   AuthScreen.jsx toggles Login / Signup
    
*   On successful signup/login:
    
    *   Stores token in localStorage as teamsync\_token
        
    *   Calls onLogin(user) to set user in App.jsx
        
*   On app load:
    
    *   If token exists → call /api/auth/me to auto-login
        
    *   On failure → clears token and shows Auth screen
        

🧵 Channels & Private Channels
------------------------------

### Data model (Channel.js)
```   
{    
  name: String,            // unique, lowercase    
  description: String,    
  isPrivate: Boolean,      // public vs private    
  members: [ObjectId],    
  createdBy: ObjectId 
}   
```

### API

*   GET /api/channels
    
    *   Returns channels visible to the user:
        
        *   All **public** channels
            
        *   Private channels where the user is a **member**
            
*   POST /api/channels
    
    *   Body: { name, description, isPrivate }
        
    *   Creator is automatically added to members
        
*   GET /api/channels/:id
    
    *   403 if channel is private and user is not a member
        
*   POST /api/channels/:id/join
    
    *   Can join **only public** channels
        
    *   Private channels require an invite (not auto-join)
        
*   POST /api/channels/:id/leave
    
    *   Removes the user from members
        

### Frontend

*   Sidebar lists channels from /api/channels
    
    *   Public channels: #general
        
    *   Private channels: lock icon (🔒)
        
*   Create Channel modal:
    
    *   Name
        
    *   Description
        
    *   “Make private” checkbox (isPrivate)
        

💬 Messages
-----------

### Data model (Message.js)
```   
{    
  channel: ObjectId,
  sender: ObjectId,
  text: String,    
  createdAt: Date
}
  ```

### API

*   GET /api/channels/:channelId/messages?limit=20&before=
    
    *   Returns { messages, hasMore, nextCursor }
        
    *   before = oldest timestamp cursor for pagination
        
*   POST /api/channels/:channelId/messages
    
    *   Body: { text }
        
    *   Requires user to be a channel member
        
    *   Returns { message }
        

### Frontend

*   messagesByChannel\[channelId\] holds list of messages
    
*   loadMessagesForChannel(channelId) uses fetchChannelMessages:
    
    *   First load → replace list
        
    *   Scroll to top → calls onLoadOlder → prepends older messages
        
*   handleSendMessage(text):
    
    1.  Calls sendChannelMessage(channelId, text) (REST, save in DB)
        
    2.  Appends returned message to messagesByChannel\[channelId\]
        
    3.  Emits a Socket.io sendMessage event to notify other clients
        

⚡ Realtime with Socket.io
-------------------------

### Connection

Backend (server.js):

*   Creates HTTP server from Express
    
*   Attaches Socket.io with CORS configured to CLIENT\_URL
    
*   Socket middleware verifies JWT from:
    
    *   socket.handshake.auth.token or socket.handshake.query.token
        
*   Maintains an onlineUsers map: userId → { sockets, user }
    

Frontend (socketClient.js):

```   
io(API_BASE_URL, 
{    
  auth: {
   token
  },
  transports: ['websocket'],
});   `
```
### Rooms & Events

**Rooms**

*   On channel change, frontend emits:
    
    *   joinChannel with channelId
        
    *   leaveChannel when switching away (cleanup)
        

**Events**

From **server → client**:

*   onlineUsers
    
    *   List of online users { id, name, avatar, status }
        
    *   Used in RightSidebar
        
*   newMessage
    
    *   { channelId, message }
        
    *   Appends message for everyone in that channel
        
*   userTyping
    
    *   { channelId, user }
        
    *   Used for typing indicators
        
*   userStopTyping
    
    *   { channelId, userId }
        
    *   Removes user from typing list
        

From **client → server**:

*   typing – user started typing in a channel
    
*   stopTyping – user stopped typing
    
*   sendMessage – after REST save, broadcast message:
    
    *   { channelId, message }
        

Messages are **saved via REST**, then **broadcast via socket**, with frontend de-duping by message id.

👀 Typing Indicators
--------------------

*   When user types in the textarea:
    
    *   Frontend emits typing with channelId
        
    *   After 2s of no keypress, emits stopTyping
        
*   Backend:
    
    *   On typing → broadcasts userTyping to other clients in the room
        
    *   On stopTyping → broadcasts userStopTyping
        
*   Frontend:
    
    *   Maintains typingUsersByChannel\[channelId\] = \[users...\]
        
    *   ChatArea shows:
        
        *   X is typing…
            
        *   X and Y are typing…
            
        *   Several people are typing…
            

👥 Channel Info & Online Users
------------------------------

Right sidebar shows:

*   Channel name
    
*   Channel description
    
*   Total members
    
*   “Online — N” for users who:
    
    *   Are online (from socket onlineUsers)
        
    *   Are members of the active channel
        

🚀 How to Run (Summary)
-----------------------

1.  Start MongoDB locally (or use Atlas).
    
2.  cd backendnpm run dev
    
3.  cd frontendnpm run dev
    
4.  Open http://localhost:5173 in the browser:
    
    *   Sign up as a user
        
    *   Create channels (public or private)
        
    *   Open a second browser / incognito with another account to test:
        
        *   Real-time messages
            
        *   Typing indicators
            
        *   Online users
            

✅ Possible Future Improvements
------------------------------

*   Message editing & deletion
    
*   Message search (by text, user, date)
    
*   User profile panel
    
*   File uploads (images/docs)
    
*   Per-channel notifications & mentions
```txt
