import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { encryptMessage } from '@/utils/encryption';
import { WorkspaceSidebar, Workspace } from './WorkspaceSidebar';
import { ChannelsList, Channel } from './ChannelsList';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { EmptyChat } from './EmptyChat';
import { UserProfileDialog } from './UserProfileDialog';
import { CallDialog } from './CallDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, UserPlus, Hash, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import gsap from 'gsap';

interface Message {
  id: string;
  sender_id: string;
  channel_id?: string | null;
  content: string;
  file_url?: string | null;
  file_name?: string | null;
  attachments?: any;
  metadata?: any;
  is_ephemeral?: boolean;
  expires_at?: string | null;
  is_deleted?: boolean | null;
  created_at: string;
  sender?: {
    username: string;
    avatar_url: string | null;
  };
}

interface Profile {
  id: string;
  username: string;
  user_tag: string;
  avatar_url: string | null;
  bio: string | null;
  isOnline?: boolean;
}

export const ChatInterface = () => {
  const { user } = useAuth();
  const { toast: uiToast } = useToast();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null); // null is DMs
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  
  // DM candidate list
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());

  // Message states
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEphemeral, setIsEphemeral] = useState(false);
  
  // Search & Dialog states
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [callUser, setCallUser] = useState<Profile | null>(null);
  const [isVideoCall, setIsVideoCall] = useState(false);

  // Layout transition container ref
  const panelRef = useRef<HTMLDivElement>(null);

  // Typing indicators
  const activeUserOrChannelId = activeWorkspaceId === null ? selectedFriendId : activeChannelId;
  const isChannelType = activeWorkspaceId !== null;
  const { typingUsers, handleTyping, stopTyping } = useTypingIndicator(user?.id, activeUserOrChannelId, isChannelType);

  // Active workspace object
  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const activeChannel = channels.find(c => c.id === activeChannelId);
  const selectedFriend = allProfiles.find(p => p.id === selectedFriendId);

  // Stagger entry animations when active workspace switches
  useEffect(() => {
    if (panelRef.current) {
      gsap.fromTo(
        panelRef.current.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }
      );
    }
  }, [activeWorkspaceId]);

  // Fetch profiles & workspaces on load
  useEffect(() => {
    if (!user) return;
    fetchWorkspaces();
    fetchAllProfiles();

    // Track online user presence
    const presenceChannel = supabase.channel('online-users');
    presenceChannel
      .on('presence', { event: 'sync' }, () => {
        const state = presenceChannel.presenceState();
        const online = new Set(
          Object.keys(state)
            .flatMap(k => state[k])
            .map((presence: any) => presence.user_id)
            .filter(Boolean)
        );
        setOnlineUsers(online);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await presenceChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
        }
      });

    return () => {
      supabase.removeChannel(presenceChannel);
    };
  }, [user]);

  // Fetch channels when active workspace changes
  useEffect(() => {
    if (!user) return;
    if (activeWorkspaceId) {
      fetchChannels(activeWorkspaceId);
    } else {
      setChannels([]);
      setActiveChannelId(null);
    }
  }, [activeWorkspaceId, user]);

  // Fetch messages when active channel changes
  useEffect(() => {
    if (!activeChannelId) {
      setMessages([]);
      return;
    }

    fetchMessages(activeChannelId);

    // Subscribe to messages in this channel
    const channelSubscription = supabase
      .channel(`room-${activeChannelId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'messages',
          filter: `channel_id=eq.${activeChannelId}`
        },
        (payload: any) => {
          if (payload.eventType === 'INSERT') {
            // Check if already in state
            setMessages(prev => {
              if (prev.some(m => m.id === payload.new.id)) return prev;
              
              // Load sender profile if missing
              const msgWithSender = { ...payload.new };
              if (payload.new.sender_id !== user?.id) {
                const profile = allProfiles.find(p => p.id === payload.new.sender_id);
                if (profile) {
                  msgWithSender.sender = {
                    username: profile.username,
                    avatar_url: profile.avatar_url
                  };
                }
              }
              return [...prev, msgWithSender];
            });
          } else if (payload.eventType === 'UPDATE') {
            setMessages(prev => prev.map(m => m.id === payload.new.id ? { ...m, ...payload.new } : m));
          } else if (payload.eventType === 'DELETE') {
            setMessages(prev => prev.filter(m => m.id !== payload.old.id));
          }
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channelSubscription);
    };
  }, [activeChannelId, allProfiles, user]);

  const fetchWorkspaces = async () => {
    const { data, error } = await supabase.from('workspaces').select('*');
    if (!error) {
      setWorkspaces(data || []);
      
      // Auto-create a default workspace if empty
      if (data && data.length === 0 && user) {
        createDefaultWorkspace();
      }
    }
  };

  const createDefaultWorkspace = async () => {
    const defaultName = "Main Workspace";
    const slug = "main-" + Math.floor(1000 + Math.random() * 9000);
    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name: defaultName, slug, owner_id: user?.id })
      .select('*')
      .single();

    if (!error && data) {
      setWorkspaces([data]);
      // Create a default general channel
      await supabase
        .from('channels')
        .insert({ workspace_id: data.id, name: 'general', is_private: false });
    }
  };

  const fetchChannels = async (workspaceId: string) => {
    const { data, error } = await supabase
      .from('channels')
      .select('*')
      .eq('workspace_id', workspaceId);
    
    if (!error && data) {
      setChannels(data);
      // Auto select first channel if none is selected
      if (data.length > 0) {
        setActiveChannelId(data[0].id);
      } else {
        setActiveChannelId(null);
      }
    }
  };

  const fetchAllProfiles = async () => {
    const { data, error } = await supabase
      .from('profiles')
      .select('*');
    if (!error && data) {
      // Exclude self from contact list
      const filtered = data.filter((p: any) => p.id !== user?.id);
      setAllProfiles(filtered);
    }
  };

  const fetchMessages = async (channelId: string) => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select('*')
      .eq('channel_id', channelId)
      .order('created_at', { ascending: true });

    if (!error && data) {
      // Map sender profile details
      const mapped = data.map((msg: any) => {
        const profile = allProfiles.find(p => p.id === msg.sender_id);
        return {
          ...msg,
          sender: profile ? {
            username: profile.username,
            avatar_url: profile.avatar_url
          } : undefined
        };
      });
      setMessages(mapped);
    }
    setIsLoading(false);
  };

  const handleCreateWorkspace = async () => {
    if (!newWorkspaceName.trim() || !user) return;
    const slug = newWorkspaceName.trim().toLowerCase().replace(/\s+/g, '-') + '-' + Math.floor(1000 + Math.random() * 9000);
    const { data, error } = await supabase
      .from('workspaces')
      .insert({ name: newWorkspaceName.trim(), slug, owner_id: user.id })
      .select('*')
      .single();

    if (!error && data) {
      setWorkspaces(prev => [...prev, data]);
      setWorkspaceDialogOpen(false);
      setNewWorkspaceName('');
      toast.success("Workspace created!");
      
      // Auto create general channel
      const { data: chan } = await supabase
        .from('channels')
        .insert({ workspace_id: data.id, name: 'general', is_private: false })
        .select('*')
        .single();
      
      setActiveWorkspaceId(data.id);
      if (chan) {
        setChannels([chan]);
        setActiveChannelId(chan.id);
      }
    } else {
      toast.error("Failed to create workspace");
    }
  };

  const handleCreateChannel = async (name: string, isPrivate: boolean) => {
    if (!activeWorkspaceId) return;
    const { data, error } = await supabase
      .from('channels')
      .insert({
        workspace_id: activeWorkspaceId,
        name,
        is_private: isPrivate,
        allowed_roles: isPrivate ? ['owner', 'admin'] : ['owner', 'admin', 'member']
      })
      .select('*')
      .single();

    if (!error && data) {
      setChannels(prev => [...prev, data]);
      setActiveChannelId(data.id);
      toast.success(`Channel #${name} created!`);
    } else {
      toast.error("Failed to create channel");
    }
  };

  // Find or create DM channel
  const handleSelectFriend = async (friendId: string) => {
    setSelectedFriendId(friendId);
    
    // Check if we have a direct messages workspace
    let dmWorkspace = workspaces.find(w => w.slug === 'direct-messages');
    if (!dmWorkspace) {
      const { data } = await supabase
        .from('workspaces')
        .select('*')
        .eq('slug', 'direct-messages')
        .maybeSingle();
      dmWorkspace = data || undefined;
    }

    if (!dmWorkspace && user) {
      // Create DMs workspace
      const { data } = await supabase
        .from('workspaces')
        .insert({ name: "Direct Messages", slug: "direct-messages", owner_id: user.id })
        .select('*')
        .single();
      if (data) {
        dmWorkspace = data;
        setWorkspaces(prev => [...prev, data]);
      }
    }

    if (dmWorkspace && user) {
      const dmChannelSlug = `dm-${[user.id, friendId].sort().join('-')}`;
      
      // Look for channel in DM workspace
      let { data: chan, error } = await supabase
        .from('channels')
        .select('*')
        .eq('workspace_id', dmWorkspace.id)
        .eq('name', dmChannelSlug)
        .maybeSingle();

      if (!chan) {
        // Create new DM channel
        const { data: newChan } = await supabase
          .from('channels')
          .insert({
            workspace_id: dmWorkspace.id,
            name: dmChannelSlug,
            is_private: true,
            allowed_roles: ['member', 'owner', 'admin']
          })
          .select('*')
          .single();
        chan = newChan;
      }

      if (chan) {
        setActiveChannelId(chan.id);
      }
    }
  };

  const handleMessageChange = (value: string) => {
    setNewMessage(value);
    if (user) {
      handleTyping(user.username);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !activeChannelId || (!newMessage.trim() && !selectedFile) || isSending) return;

    setIsSending(true);
    setUploading(true);
    stopTyping(user.username);

    let fileUrl = null;
    let fileName = null;
    let fileSize = null;
    let messageContent = newMessage.trim();

    if (selectedFile) {
      const fileExt = selectedFile.name.split('.').pop();
      const filePath = `${user.id}/${Date.now()}.${fileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('chat-files')
        .upload(filePath, selectedFile);

      if (uploadError) {
        toast.error("Failed to upload attachment");
        setIsSending(false);
        setUploading(false);
        return;
      }

      const { data: urlData } = supabase.storage
        .from('chat-files')
        .getPublicUrl(filePath);

      fileUrl = urlData.publicUrl;
      fileName = selectedFile.name;
      fileSize = selectedFile.size;
      
      if (selectedFile.type.startsWith('audio/') && !messageContent) {
        messageContent = '[Voice message]';
      } else if (!messageContent) {
        messageContent = 'Sent a file';
      }
    }

    const encryptedContent = await encryptMessage(messageContent, user.id, activeChannelId);

    // Build attachment object structure
    const attachmentsPayload = fileUrl ? [{
      name: fileName,
      size: fileSize,
      url: fileUrl,
      mime_type: selectedFile?.type
    }] : [];

    // Build metadata payload
    const metadataPayload = {
      is_one_time_view: false,
      has_card: messageContent.toLowerCase().includes("townhouse")
    };

    const { error } = await supabase
      .from('messages')
      .insert({
        channel_id: activeChannelId,
        sender_id: user.id,
        content: encryptedContent,
        attachments: attachmentsPayload,
        metadata: metadataPayload,
        is_ephemeral: isEphemeral,
        expires_at: null // Calculated post-read for recipient
      });

    if (error) {
      toast.error("Failed to send message");
    } else {
      setNewMessage('');
      setSelectedFile(null);
      setIsEphemeral(false);
    }

    setIsSending(false);
    setUploading(false);
  };

  const handleVoiceRecording = (file: File) => {
    setSelectedFile(file);
    setTimeout(() => handleSendMessage(), 100);
  };

  if (!user) return null;

  const friendsWithStatus = allProfiles.map(p => ({
    ...p,
    isOnline: onlineUsers.has(p.id)
  }));

  const filteredFriends = friendsWithStatus.filter(f => 
    f.username.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  const isTyping = typingUsers.size > 0;
  const typingListText = Array.from(typingUsers).join(', ');

  return (
    <div className="h-[calc(100vh-4rem)] flex max-w-7xl mx-auto p-4 md:p-6 pb-20 md:pb-6 relative gap-4 bg-gradient-to-br from-[#F4F7F6] to-[#E9EFEF]">
      
      {/* 1. Left Vertical Workspaces Sidebar */}
      <WorkspaceSidebar
        workspaces={workspaces.filter(w => w.slug !== 'direct-messages')}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={(id) => {
          setActiveWorkspaceId(id);
          setSelectedFriendId(null);
        }}
        onCreateWorkspace={() => setWorkspaceDialogOpen(true)}
        user={user}
      />

      {/* 2. Middle Collapsible Sidebar (Channels or Direct Messages) */}
      <div ref={panelRef} className="flex gap-4 flex-1 md:flex-none">
        
        {/* Workspace views */}
        {activeWorkspaceId ? (
          <div className="w-64 flex-shrink-0 h-full">
            <ChannelsList
              channels={channels}
              activeChannelId={activeChannelId}
              onSelectChannel={setActiveChannelId}
              onCreateChannel={handleCreateChannel}
              isOwner={activeWorkspace?.owner_id === user.id}
            />
          </div>
        ) : (
          /* DMs contact list panel */
          <div className="w-64 flex flex-col h-full bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden flex-shrink-0">
            {/* Search */}
            <div className="p-4 border-b border-[#1A2421]/10">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#1A2421]/45" />
                <Input
                  placeholder="Search contacts..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="pl-9 bg-white border-[#1A2421]/10 focus-visible:ring-[#0C1412] h-10 rounded-xl"
                />
              </div>
            </div>
            
            {/* Contact list */}
            <div className="p-3 border-b border-[#1A2421]/15">
              <span className="text-[10px] uppercase font-bold tracking-wider text-[#1A2421]/50 px-2">Messages</span>
            </div>

            <ScrollArea className="flex-1 p-2">
              <div className="space-y-0.5">
                {filteredFriends.map((friend) => {
                  const isSelected = selectedFriendId === friend.id;
                  
                  return (
                    <button
                      key={friend.id}
                      onClick={() => handleSelectFriend(friend.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2 rounded-xl text-left transition-all duration-200 ${
                        isSelected
                          ? "bg-[#0C1412] text-white shadow-sm"
                          : "text-[#1A2421]/75 hover:bg-[#0C1412]/5 hover:text-[#0C1412]"
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="h-9 w-9 rounded-xl border border-[#1A2421]/5">
                          <AvatarImage src={friend.avatar_url || ''} />
                          <AvatarFallback className={isSelected ? "bg-white/20 text-white" : "bg-[#0C1412] text-white"}>
                            {friend.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {friend.isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-[#4EAB77] border-2 border-white rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-bold truncate">{friend.username}</p>
                        <p className="text-[10px] opacity-60 truncate mt-0.5">
                          {friend.isOnline ? "Online" : "Offline"}
                        </p>
                      </div>
                    </button>
                  );
                })}
                {filteredFriends.length === 0 && (
                  <p className="text-xs text-muted-foreground/60 text-center py-6">No users found</p>
                )}
              </div>
            </ScrollArea>
          </div>
        )}

        {/* 3. Main Conversational Panel */}
        <div 
          className="flex-1 bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.03)] relative min-w-[320px] md:w-[480px] lg:w-[600px] xl:w-[700px]"
        >
          {activeChannelId ? (
            <>
              {/* Header */}
              <ChatHeader
                selectedUser={activeWorkspaceId === null ? selectedFriend || { username: 'Chat Hub', avatar_url: null, id: '' } as any : { username: `#${activeChannel?.name || 'room'}`, avatar_url: null, id: '' } as any}
                isOnline={activeWorkspaceId === null ? (selectedFriend ? onlineUsers.has(selectedFriend.id) : false) : true}
                isTyping={isTyping}
                isConnected={true}
                onRefresh={() => fetchMessages(activeChannelId)}
                isRefreshing={isLoading}
                onUserClick={() => setProfileDialogOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onVoiceCall={() => {
                  if (selectedFriend) {
                    setCallUser(selectedFriend);
                    setIsVideoCall(false);
                  }
                }}
                onVideoCall={() => {
                  if (selectedFriend) {
                    setCallUser(selectedFriend);
                    setIsVideoCall(true);
                  }
                }}
                onBack={() => {
                  setActiveChannelId(null);
                  setSelectedFriendId(null);
                }}
              />
              
              {/* Messages feed */}
              <ChatMessages
                messages={messages.filter(msg => 
                  searchQuery ? msg.content.toLowerCase().includes(searchQuery.toLowerCase()) : true
                )}
                currentUserId={user.id}
                otherUserId={activeChannelId}
                isLoading={isLoading}
                onDelete={(id) => setMessages(prev => prev.filter(m => m.id !== id))}
              />

              {/* Typing indicators status message */}
              {isTyping && (
                <div className="px-6 py-1 bg-white/40">
                  <span className="text-[10px] font-bold text-[#4EAB77] animate-pulse">
                    ● {typingListText} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              )}

              {/* Chat Input area */}
              <ChatInput
                value={newMessage}
                onChange={handleMessageChange}
                onSend={handleSendMessage}
                isDisabled={isSending || uploading}
                onFileSelect={setSelectedFile}
                selectedFile={selectedFile}
                onClearFile={() => setSelectedFile(null)}
                onVoiceRecordingComplete={handleVoiceRecording}
                isEphemeral={isEphemeral}
                onEphemeralToggle={setIsEphemeral}
              />
            </>
          ) : (
            <EmptyChat />
          )}
        </div>
      </div>

      {/* Dialog for Creating Workspaces */}
      <Dialog open={workspaceDialogOpen} onOpenChange={setWorkspaceDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-3xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-[#0C1412] flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-amber-500 animate-pulse" />
              Create Workspace
            </DialogTitle>
            <DialogDescription>
              Name your workspace. Distinct domains help organize categorized hub chats.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="wsName" className="font-bold text-[#1A2421]">Workspace Name</Label>
              <Input
                id="wsName"
                placeholder="e.g. Design Team"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="rounded-xl border-[#1A2421]/10 focus-visible:ring-[#0C1412]"
              />
            </div>
          </div>
          <Button onClick={handleCreateWorkspace} className="w-full bg-[#0C1412] hover:bg-[#1A2421] text-white rounded-xl py-6 font-semibold">
            Create Workspace
          </Button>
        </DialogContent>
      </Dialog>

      {/* User Profile Dialog */}
      {selectedFriendId && (
        <UserProfileDialog
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
          userId={selectedFriendId}
          currentUserId={user.id}
        />
      )}

      {/* Call Dialog */}
      <CallDialog
        open={!!callUser}
        onOpenChange={(open) => !open && setCallUser(null)}
        user={callUser}
        isVideo={isVideoCall}
      />
    </div>
  );
};
export default ChatInterface;
