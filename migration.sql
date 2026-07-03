-- Clean Wipe Previous Deployments
DROP TABLE IF EXISTS messages CASCADE;
DROP TABLE IF EXISTS channels CASCADE;
DROP TABLE IF EXISTS workspaces CASCADE;
DROP TABLE IF EXISTS profiles CASCADE;
DROP TABLE IF EXISTS friends CASCADE;
DROP TABLE IF EXISTS group_members CASCADE;
DROP TABLE IF EXISTS groups CASCADE;
DROP TABLE IF EXISTS feedback CASCADE;
DROP TABLE IF EXISTS reactions CASCADE;
DROP TYPE IF EXISTS presence_status CASCADE;

CREATE TYPE presence_status AS ENUM ('online', 'offline', 'away', 'typing');

-- High-Fidelity Profiles Table
CREATE TABLE profiles (
  id UUID REFERENCES auth.users ON DELETE CASCADE PRIMARY KEY,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
  username TEXT UNIQUE NOT NULL,
  user_tag TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  bio TEXT,
  status presence_status DEFAULT 'offline'::presence_status,
  custom_status_text TEXT,
  last_seen TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Advanced Workspace / Channel Infrastructure (Discord-Inspired)
CREATE TABLE workspaces (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  slug TEXT UNIQUE NOT NULL,
  owner_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL
);

CREATE TABLE channels (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  is_private BOOLEAN DEFAULT false NOT NULL,
  allowed_roles TEXT[] DEFAULT ARRAY['member', 'admin', 'owner']
);

-- Advanced Cross-Functional Message Fabric
CREATE TABLE messages (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  channel_id UUID REFERENCES channels(id) ON DELETE CASCADE,
  sender_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  attachments JSONB DEFAULT '[]'::jsonb, -- Array of structured attachment objects (name, size, url, mime_type)
  metadata JSONB DEFAULT '{}'::jsonb,      -- Rich text markup, embeds, reactions, voice waves
  is_ephemeral BOOLEAN DEFAULT false,      -- Snapchat integration flag
  expires_at TIMESTAMP WITH TIME ZONE,     -- TTL timestamp
  created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL
);

-- RLS Enablement
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE channels ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Profiles Policies
CREATE POLICY "Profiles are viewable by everyone" ON profiles FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Users can insert their own profile" ON profiles FOR INSERT WITH CHECK (auth.uid() = id);

-- Workspaces Policies
CREATE POLICY "Workspaces are viewable by everyone" ON workspaces FOR SELECT USING (true);
CREATE POLICY "Workspace owner can manage workspaces" ON workspaces FOR ALL USING (auth.uid() = owner_id);
CREATE POLICY "Authenticated users can create workspaces" ON workspaces FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Channels Policies
CREATE POLICY "Channels are viewable by anyone" ON channels FOR SELECT USING (true);
CREATE POLICY "Workspace owners can manage channels" ON channels FOR ALL USING (
  EXISTS (
    SELECT 1 FROM workspaces 
    WHERE workspaces.id = channels.workspace_id 
    AND workspaces.owner_id = auth.uid()
  )
);

-- Messages Policies
CREATE POLICY "Messages are viewable by anyone" ON messages FOR SELECT USING (true);
CREATE POLICY "Authenticated users can insert messages" ON messages FOR INSERT WITH CHECK (auth.uid() = sender_id);
CREATE POLICY "Users can delete their own messages" ON messages FOR DELETE USING (auth.uid() = sender_id);

-- Storage Buckets Configuration (Re-insuring)
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('avatars', 'avatars', true, 10485760, ARRAY['image/jpeg', 'image/png', 'image/gif', 'image/webp']),
  ('chat-files', 'chat-files', true, 524288000, NULL)
ON CONFLICT (id) DO NOTHING;

-- Function to generate unique user tag
CREATE OR REPLACE FUNCTION generate_user_tag()
RETURNS TEXT AS $$
DECLARE
  new_tag TEXT;
  tag_exists BOOLEAN;
BEGIN
  LOOP
    new_tag := LPAD(FLOOR(RANDOM() * 10000)::TEXT, 4, '0');
    SELECT EXISTS(SELECT 1 FROM public.profiles WHERE user_tag = new_tag) INTO tag_exists;
    EXIT WHEN NOT tag_exists;
  END LOOP;
  RETURN new_tag;
END;
$$ LANGUAGE plpgsql;

-- Function to handle new user creation automatically
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, username, user_tag, status)
  VALUES (
    NEW.id,
    COALESCE(NEW.raw_user_meta_data->>'username', SPLIT_PART(NEW.email, '@', 1)),
    generate_user_tag(),
    'offline'::presence_status
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Trigger to create profile on user signup
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Trigger to update profiles updated_at
CREATE OR REPLACE FUNCTION public.handle_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS handle_profiles_updated_at ON public.profiles;
CREATE TRIGGER handle_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.handle_updated_at();

-- Create Reactions Table
CREATE TABLE reactions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  message_id UUID REFERENCES messages(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES profiles(id) ON DELETE CASCADE NOT NULL,
  emoji TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  UNIQUE(message_id, user_id, emoji)
);

ALTER TABLE reactions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Reactions are viewable by anyone" ON reactions FOR SELECT USING (true);
CREATE POLICY "Authenticated users can post reactions" ON reactions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can remove their own reactions" ON reactions FOR DELETE USING (auth.uid() = user_id);

-- Realtime Database Replication Enablement
ALTER PUBLICATION supabase_realtime ADD TABLE profiles;
ALTER PUBLICATION supabase_realtime ADD TABLE workspaces;
ALTER PUBLICATION supabase_realtime ADD TABLE channels;
ALTER PUBLICATION supabase_realtime ADD TABLE messages;
ALTER PUBLICATION supabase_realtime ADD TABLE reactions;
