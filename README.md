# ChatBuzz (TalkTime Modern Rebuild)

A modern, secure, and real-time chat application migrated from a legacy stack (React/Vite, Express, MongoDB, Socket.IO) to a high-performance serverless stack.

## Tech Stack
- **Framework:** Next.js 14+ (App Router, Server Actions, React Server Components)
- **Database:** Supabase PostgreSQL (Fully Normalized Schema)
- **Realtime:** Supabase Realtime Channels (Postgres Changes Replication & Presence Indicators)
- **Storage:** Supabase Storage (Browser-to-Object upload streams)
- **Styling:** Tailwind CSS & Radix UI (Dark-Theme Aesthetics)

## Project Structure
- `/src/app` - App router segments (Authentication routes group `(auth)` & Application routes group `(main)`)
- `/src/actions` - Server Actions managing auth flows, profile changes, and message insertions securely
- `/src/components` - UI blocks, client components (Forms), sidebars, and chat viewport streams
- `/src/types` - Strict database TS definitions matching our PostgreSQL tables
- `/supabase` - Versioned schema migrations SQL directory

## Setup and Getting Started

1. **Install Dependencies:**
   ```bash
   npm install
   ```

2. **Configure Environment Variables:**
   Create a `.env.local` file at the root:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
   NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
   ```

3. **Database Schema Setup:**
   Apply the migrations in `/supabase/migrations/` sequentially to your local or hosted Supabase database.

4. **Launch Dev Server:**
   ```bash
   npm run dev
   ```
   Open [http://localhost:3000](http://localhost:3000) to access the application.
