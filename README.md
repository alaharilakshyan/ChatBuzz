# ChatBuzz (TalkTime Modern Rebuild)

A modern, secure, and real-time chat application built with a Next.js frontend and a self-hosted Express/MongoDB backend.

## Tech Stack
- **Frontend:** Next.js (App Router, Server Actions, React Server Components)
- **Backend:** Node.js, Express, Socket.io (Realtime chat, Presence, and WebRTC signalling)
- **Database:** MongoDB (via Mongoose ODM)
- **Storage:** Cloudinary (Media upload streams for avatar, banner, and chat attachments)
- **Styling:** Tailwind CSS & Radix UI (Dark-Theme Aesthetics)

## Project Structure
- `/src` - Next.js client-side application segments, actions, and custom hooks.
- `/server` - Express backend server containing schema models, socket controllers, services, and middleware.

## Setup and Getting Started

### 1. Backend Server Setup
Navigate into the `/server` directory:
1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Configure Environment Variables:**
   Create a `.env` file at the `/server` root directory:
   ```env
   PORT=4000
   NODE_ENV=development
   MONGODB_URI=mongodb+srv://alaharilakshyan_db_user:<db_password>@cluster0.vyqpvcc.mongodb.net/
   CLIENT_URL=http://localhost:3000
   JWT_SECRET=your_jwt_access_secret
   REFRESH_TOKEN_SECRET=your_jwt_refresh_secret
   CLOUDINARY_CLOUD_NAME=your_cloudinary_cloud_name
   CLOUDINARY_API_KEY=your_cloudinary_api_key
   CLOUDINARY_API_SECRET=your_cloudinary_api_secret
   ```
3. **Launch Server:**
   - Development Mode (with ts-node-dev):
     ```bash
     npm run dev
     ```
   - Production Mode (compilation build):
     ```bash
     npm run build
     npm start
     ```

### 2. Frontend Application Setup
Return to the project root directory:
1. **Install Dependencies:**
   ```bash
   npm install
   ```
2. **Configure Environment Variables:**
   Ensure `.env.local` contains correct backend targets:
   ```env
   NEXT_PUBLIC_EXPRESS_API_URL=http://localhost:4000/api/v1
   NEXT_PUBLIC_SOCKET_SERVER_URL=http://localhost:4000
   ```
3. **Launch Application:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to access the application.
