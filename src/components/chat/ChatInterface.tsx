import React, { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useLiveNotifications } from '@/hooks/useLiveNotifications';
import { useTypingIndicator } from '@/hooks/useTypingIndicator';
import { encryptMessage } from '@/utils/encryption';
import { ChatHeader } from './ChatHeader';
import { ChatMessages } from './ChatMessages';
import { ChatInput } from './ChatInput';
import { FloatingUserSidebar } from './FloatingUserSidebar';
import { EmptyChat } from './EmptyChat';
import { UserProfileDialog } from './UserProfileDialog';
import { ForwardMessageDialog } from './ForwardMessageDialog';
import { CallDialog } from './CallDialog';
import { GroupList } from './GroupList';
import { GroupChatInterface } from './GroupChatInterface';
import { CreateGroupDialog } from './CreateGroupDialog';
import { UserPlus, Users, Home, Calendar, FileText, Search, MessageSquare, Plus, LogOut, Compass, ArrowLeft } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UserList } from './UserList';
import { Link } from 'react-router-dom';
import { ThemeToggle } from '@/components/ui/theme-toggle';

interface Message {
  id: string;
  sender_id: string;
  receiver_id: string;
  content: string;
  file_url: string | null;
  file_name: string | null;
  is_deleted: boolean;
  created_at: string;
  is_one_time_view?: boolean;
  viewed_by?: string[];
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
  const { toast } = useToast();

  const [friends, setFriends] = useState<Profile[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [addFriendDialog, setAddFriendDialog] = useState(false);
  const [friendUserTag, setFriendUserTag] = useState('');
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set());
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [chatBackground, setChatBackground] = useState<string | null>(null);
  const [isOneTimeView, setIsOneTimeView] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [forwardMessage, setForwardMessage] = useState<Message | null>(null);
  const [callUser, setCallUser] = useState<Profile | null>(null);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [groupRefreshTrigger, setGroupRefreshTrigger] = useState(0);
  const [activeTab, setActiveTab] = useState<'chats' | 'groups'>('chats');
  const [sidebarSearch, setSidebarSearch] = useState('');

  const selectedFriend = friends.find(f => f.id === selectedFriendId);

  // Typing indicator hook
  const { typingUsers, handleTyping, stopTyping } = useTypingIndicator(user?.id, selectedFriendId);

  // Live notifications for new messages
  useLiveNotifications({
    userId: user?.id || '',
    currentChatUserId: selectedFriendId,
    onNewMessage: () => {
      fetchFriends();
    },
  });

  // Fetch friends
  const fetchFriends = async () => {
    if (!user) return;

    const { data: sentFriends, error: sentError } = await supabase
      .from('friends')
      .select(`
        friend_id,
        profiles:friend_id (
          id,
          username,
          user_tag,
          avatar_url,
          bio
        )
      `)
      .eq('user_id', user.id)
      .eq('status', 'accepted');

    const { data: receivedFriends, error: receivedError } = await supabase
      .from('friends')
      .select(`
        user_id,
        profiles:user_id (
          id,
          username,
          user_tag,
          avatar_url,
          bio
        )
      `)
      .eq('friend_id', user.id)
      .eq('status', 'accepted');

    if (sentError || receivedError) {
      console.error('Error fetching friends:', sentError || receivedError);
      return;
    }

    const allFriendProfiles = [
      ...(sentFriends?.map((f: any) => f.profiles).filter(Boolean) || []),
      ...(receivedFriends?.map((f: any) => f.profiles).filter(Boolean) || [])
    ];

    setFriends(allFriendProfiles);
  };

  // Fetch messages
  const fetchMessages = async (friendId: string) => {
    if (!user) return;

    setIsLoading(true);
    const { data, error } = await supabase
      .from('messages')
      .select(`
        *,
        sender:profiles!sender_id (username, avatar_url)
      `)
      .or(`and(sender_id.eq.${user.id},receiver_id.eq.${friendId}),and(sender_id.eq.${friendId},receiver_id.eq.${user.id})`)
      .is('group_id', null)
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Error fetching messages:', error);
      toast({
        title: "Error",
        description: "Failed to load messages",
        variant: "destructive",
      });
    } else {
      setMessages(data || []);
    }
    setIsLoading(false);
  };

  useEffect(() => {
    const loadBackground = () => {
      const savedBackground = localStorage.getItem('chatBackground');
      setChatBackground(savedBackground);
    };
    
    loadBackground();
    window.addEventListener('storage', loadBackground);
    return () => window.removeEventListener('storage', loadBackground);
  }, []);

  useEffect(() => {
    if (user) {
      fetchFriends();

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
        .on('presence', { event: 'join' }, ({ newPresences }) => {
          const userId = (newPresences[0] as any)?.user_id;
          if (userId) {
            setOnlineUsers(prev => new Set([...prev, userId]));
          }
        })
        .on('presence', { event: 'leave' }, ({ leftPresences }) => {
          const userId = (leftPresences[0] as any)?.user_id;
          if (userId) {
            setOnlineUsers(prev => {
              const next = new Set(prev);
              next.delete(userId);
              return next;
            });
          }
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await presenceChannel.track({ user_id: user.id, online_at: new Date().toISOString() });
          }
        });

      const channel = supabase
        .channel('friends-updates')
        .on(
          'postgres_changes',
          {
            event: '*',
            schema: 'public',
            table: 'friends',
          },
          (payload: any) => {
            if (payload.eventType === 'UPDATE' && payload.new.status === 'accepted') {
              toast({
                title: "New Friend! 🎉",
                description: "Someone accepted your friend request!",
              });
            }
            fetchFriends();
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(presenceChannel);
        supabase.removeChannel(channel);
      };
    }
  }, [user]);

  useEffect(() => {
    if (selectedFriendId) {
      setSelectedGroupId(null);
      fetchMessages(selectedFriendId);
      
      const channel = supabase
        .channel('messages')
        .on(
          'postgres_changes',
          {
            event: 'INSERT',
            schema: 'public',
            table: 'messages',
          },
          (payload: any) => {
            if (
              (payload.new.sender_id === selectedFriendId && payload.new.receiver_id === user?.id) ||
              (payload.new.sender_id === user?.id && payload.new.receiver_id === selectedFriendId)
            ) {
              setMessages(prev => {
                if (prev.some(m => m.id === payload.new.id)) return prev;
                return [...prev, payload.new];
              });
            }
          }
        )
        .on(
          'postgres_changes',
          {
            event: 'UPDATE',
            schema: 'public',
            table: 'messages',
          },
          (payload: any) => {
            if (payload.new.sender_id === selectedFriendId || payload.new.receiver_id === selectedFriendId) {
              setMessages(prev => prev.map(msg => msg.id === payload.new.id ? payload.new : msg));
            }
          }
        )
        .subscribe();

      return () => {
        supabase.removeChannel(channel);
      };
    }
  }, [selectedFriendId, user]);

  const handleFriendSelect = (friendId: string) => {
    setSelectedFriendId(friendId);
    setSelectedGroupId(null);
  };

  const handleGroupSelect = (groupId: string) => {
    setSelectedGroupId(groupId);
    setSelectedFriendId(null);
  };

  const handleMessageChange = (value: string) => {
    setNewMessage(value);
    handleTyping();
  };

  const handleSendMessage = async () => {
    if (!user || !selectedFriendId || (!newMessage.trim() && !selectedFile) || isSending) return;

    setIsSending(true);
    setUploading(true);
    stopTyping();

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
        toast({
          title: "Error",
          description: "Failed to upload file",
          variant: "destructive",
        });
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

    const encryptedContent = await encryptMessage(messageContent, user.id, selectedFriendId);

    const isImage = selectedFile && selectedFile.type.startsWith('image/');
    
    const { data, error } = await supabase
      .from('messages')
      .insert({
        sender_id: user.id,
        receiver_id: selectedFriendId,
        content: encryptedContent,
        file_url: fileUrl,
        file_name: fileName,
        file_size: fileSize,
        is_one_time_view: isImage && isOneTimeView,
        viewed_by: [],
      })
      .select(`
        *,
        sender:profiles!sender_id (username, avatar_url)
      `)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      setMessages(prev => [...prev, data]);
      setNewMessage('');
      setSelectedFile(null);
      setIsOneTimeView(false);
    }

    setIsSending(false);
    setUploading(false);
  };

  const handleVoiceRecording = (file: File) => {
    setSelectedFile(file);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleAddFriend = async () => {
    if (!user || !friendUserTag.trim()) return;

    try {
      const { data: friendProfile, error: profileError } = await supabase
        .from('profiles')
        .select('id, username')
        .eq('user_tag', friendUserTag.trim())
        .single();

      if (profileError || !friendProfile) {
        toast({
          title: "Error",
          description: "User not found with that tag",
          variant: "destructive",
        });
        return;
      }

      if (friendProfile.id === user.id) {
        toast({
          title: "Error",
          description: "You cannot add yourself as a friend",
          variant: "destructive",
        });
        return;
      }

      const { data: existingFriend } = await supabase
        .from('friends')
        .select('*')
        .or(`and(user_id.eq.${user.id},friend_id.eq.${friendProfile.id}),and(user_id.eq.${friendProfile.id},friend_id.eq.${user.id})`)
        .single();

      if (existingFriend) {
        toast({
          title: "Info",
          description: existingFriend.status === 'pending' ? "Friend request already sent" : "Already friends",
        });
        return;
      }

      const { error: insertError } = await supabase
        .from('friends')
        .insert({
          user_id: user.id,
          friend_id: friendProfile.id,
          status: 'accepted'
        });

      if (insertError) {
        toast({
          title: "Error",
          description: "Failed to add friend",
          variant: "destructive",
        });
        return;
      }

      toast({
        title: "Success! 🎉",
        description: `${friendProfile.username} added as friend`,
      });

      setAddFriendDialog(false);
      setFriendUserTag('');
      fetchFriends();
    } catch (error) {
      console.error('Add friend error:', error);
      toast({
        title: "Error",
        description: "Something went wrong",
        variant: "destructive",
      });
    }
  };

  const handleVoiceCall = () => {
    if (selectedFriend) {
      setCallUser(selectedFriend);
      setIsVideoCall(false);
    }
  };

  const handleVideoCall = () => {
    if (selectedFriend) {
      setCallUser(selectedFriend);
      setIsVideoCall(true);
    }
  };

  if (!user) return null;

  const friendsWithStatus = friends.map(friend => ({
    ...friend,
    isOnline: onlineUsers.has(friend.id)
  }));

  const isTyping = selectedFriendId ? typingUsers.has(selectedFriendId) : false;

  const filteredFriends = friendsWithStatus.filter(f => 
    f.username.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  return (
    <div className="h-[calc(100vh-4rem)] flex max-w-7xl mx-auto p-2 md:p-6 pb-20 md:pb-6 relative gap-4">
      {/* 1. Left Vertical Icon Sidebar (Desktop only) */}
      <div className="hidden md:flex flex-col items-center justify-between w-16 py-6 bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl shadow-xl flex-shrink-0">
        <div className="flex flex-col items-center gap-6 w-full">
          <div className="w-10 h-10 rounded-xl bg-gradient-brand flex items-center justify-center shadow-md animate-pulse-glow">
            <span className="text-white font-extrabold text-sm">CB</span>
          </div>
          
          <div className="flex flex-col items-center gap-4 w-full px-2">
            <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200">
              <Link to="/">
                <Home className="h-5 w-5" />
              </Link>
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200"
              onClick={() => document.getElementById('sidebar-search-input')?.focus()}
            >
              <Search className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              onClick={() => setAddFriendDialog(true)} 
              className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200"
            >
              <UserPlus className="h-5 w-5" />
            </Button>
            <Button 
              variant="ghost" 
              size="icon" 
              className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200"
              onClick={() => {
                toast({ title: "Calendar Schedules", description: "Scheduling call features coming soon!" });
              }}
            >
              <Calendar className="h-5 w-5" />
            </Button>
            <Button variant="ghost" size="icon" asChild className="h-10 w-10 rounded-xl hover:bg-primary/10 hover:text-primary transition-all duration-200">
              <Link to="/settings">
                <Settings className="h-5 w-5" />
              </Link>
            </Button>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4 w-full">
          <ThemeToggle />
        </div>
      </div>

      {/* Floating Friends Sidebar (Mobile only) */}
      <div className="md:hidden">
        <FloatingUserSidebar
          users={friendsWithStatus}
          selectedUserId={selectedFriendId}
          onUserSelect={handleFriendSelect}
          onlineUsers={onlineUsers}
          currentUserId={user.id}
          onRefresh={fetchFriends}
          isRefreshing={false}
          onGroupSelect={handleGroupSelect}
        />
      </div>

      {/* Add Friend Dialog */}
      <Dialog open={addFriendDialog} onOpenChange={setAddFriendDialog}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-bold">
              <UserPlus className="h-5 w-5 text-primary" />
              Add Friend
            </DialogTitle>
            <DialogDescription>
              Enter your friend's user tag (the 4-digit number) to add them.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 pt-4">
            <div>
              <Label htmlFor="userTag" className="font-semibold">User Tag</Label>
              <Input
                id="userTag"
                placeholder="1234"
                value={friendUserTag}
                onChange={(e) => setFriendUserTag(e.target.value)}
                maxLength={4}
                className="mt-2"
              />
            </div>
            <Button onClick={handleAddFriend} className="w-full bg-gradient-brand hover:opacity-95 text-white font-semibold">
              Add Friend
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* 2. Middle Sidebar (Chats & Groups Tabbed sidebar) */}
      <div className={`${selectedFriendId || selectedGroupId ? 'hidden md:flex' : 'flex'} w-full md:w-80 flex-col bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden shadow-xl flex-shrink-0`}>
        {/* Search */}
        <div className="p-3 border-b border-border/50">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              id="sidebar-search-input"
              placeholder="Search chats..."
              value={sidebarSearch}
              onChange={(e) => setSidebarSearch(e.target.value)}
              className="pl-9 bg-muted/30 border-none h-10 rounded-xl"
            />
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="flex-1 flex flex-col min-h-0">
          <TabsList className="w-full rounded-none bg-muted/10 border-b border-border/30 p-1">
            <TabsTrigger value="chats" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
              Chats
            </TabsTrigger>
            <TabsTrigger value="groups" className="flex-1 rounded-lg data-[state=active]:bg-primary data-[state=active]:text-primary-foreground font-semibold">
              Groups
            </TabsTrigger>
          </TabsList>
          
          <TabsContent value="chats" className="flex-1 m-0 min-h-0 flex flex-col">
            <UserList
              users={filteredFriends}
              selectedUserId={selectedFriendId}
              onUserSelect={handleFriendSelect}
              onlineUsers={onlineUsers}
              currentUserId={user.id}
              onRefresh={fetchFriends}
              isRefreshing={isLoading}
            />
          </TabsContent>
          
          <TabsContent value="groups" className="flex-1 m-0 min-h-0 flex flex-col">
            <div className="p-2 border-b border-border/50">
              <CreateGroupDialog onGroupCreated={() => setGroupRefreshTrigger(prev => prev + 1)} />
            </div>
            <GroupList
              selectedGroupId={selectedGroupId}
              onGroupSelect={handleGroupSelect}
              refreshTrigger={groupRefreshTrigger}
            />
          </TabsContent>
        </Tabs>
      </div>

      {/* 3. Right Chat Area */}
      <div 
        className={`${selectedFriendId || selectedGroupId ? 'flex' : 'hidden md:flex'} flex-1 bg-card/50 backdrop-blur-xl border border-border/50 rounded-2xl overflow-hidden flex flex-col shadow-xl relative`}
        style={chatBackground ? {
          backgroundImage: `linear-gradient(rgba(0, 0, 0, 0.7), rgba(0, 0, 0, 0.7)), url(${chatBackground})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundAttachment: 'fixed'
        } : undefined}
      >
        {selectedGroupId ? (
          <GroupChatInterface groupId={selectedGroupId} onBack={() => setSelectedGroupId(null)} />
        ) : selectedFriend ? (
          <>
            <ChatHeader
              selectedUser={selectedFriend}
              isOnline={onlineUsers.has(selectedFriendId!)}
              isTyping={isTyping}
              isConnected={true}
              onRefresh={() => fetchMessages(selectedFriendId!)}
              isRefreshing={isLoading}
              onUserClick={() => setProfileDialogOpen(true)}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onVoiceCall={handleVoiceCall}
              onVideoCall={handleVideoCall}
              onBack={() => setSelectedFriendId(null)}
            />
            <ChatMessages
              messages={messages.filter(msg => 
                searchQuery ? msg.content.toLowerCase().includes(searchQuery.toLowerCase()) : true
              )}
              currentUserId={user.id}
              otherUserId={selectedFriendId!}
              isLoading={isLoading}
              onDelete={(messageId) => setMessages(prev => prev.map(m => m.id === messageId ? { ...m, is_deleted: true } : m))}
              onForward={(message) => setForwardMessage(message)}
            />
            <ChatInput
              value={newMessage}
              onChange={handleMessageChange}
              onSend={handleSendMessage}
              isDisabled={isSending || uploading}
              onFileSelect={setSelectedFile}
              selectedFile={selectedFile}
              onClearFile={() => setSelectedFile(null)}
              onVoiceRecordingComplete={handleVoiceRecording}
              isOneTimeView={isOneTimeView}
              onOneTimeViewToggle={setIsOneTimeView}
            />
          </>
        ) : (
          <EmptyChat />
        )}
      </div>

      {/* User Profile Dialog */}
      {selectedFriendId && (
        <UserProfileDialog
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
          userId={selectedFriendId}
          currentUserId={user.id}
        />
      )}

      {/* Forward Message Dialog */}
      <ForwardMessageDialog
        open={!!forwardMessage}
        onOpenChange={(open) => !open && setForwardMessage(null)}
        message={forwardMessage ? {
          id: forwardMessage.id,
          content: forwardMessage.content,
          file_url: forwardMessage.file_url,
          file_name: forwardMessage.file_name,
        } : null}
      />

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
