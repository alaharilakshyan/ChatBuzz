import React, { useState, useEffect, useRef } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useSocket } from '@/contexts/SocketContext';
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
import { CreateGroupDialog } from './CreateGroupDialog';
import { UserSearch } from '../friends/UserSearch';
import { GlobalSearchDialog } from './GlobalSearchDialog';
import { MediaGalleryDialog } from './MediaGalleryDialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Search, Sparkles } from 'lucide-react';
import { toast } from 'sonner';
import gsap from 'gsap';

interface Message {
  _id: string;
  id?: string;
  senderId: any;
  receiverId?: string | null;
  groupId?: string | null;
  content: string;
  attachments?: Record<string, unknown>[];
  metadata?: Record<string, unknown>;
  isEphemeral?: boolean;
  expiresAt?: string | null;
  isDeleted?: boolean | null;
  createdAt: string;
  created_at?: string;
  sender_id?: string;
  isOneTimeView?: boolean | null;
  is_one_time_view?: boolean | null;
  viewedBy?: string[] | null;
  viewed_by?: string[] | null;
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
  lastMessage?: {
    _id: string;
    content: string;
    senderId: string;
    sender: {
      username: string;
      avatar_url: string | null;
    };
    createdAt: string;
  } | null;
  unreadCount?: number;
}

export const ChatInterface = () => {
  const { user, getToken } = useAuth();
  const { socket, onlineUsers } = useSocket();
  const { toast: uiToast } = useToast();

  const [workspaces, setWorkspaces] = useState<Workspace[]>([]);
  const [activeWorkspaceId, setActiveWorkspaceId] = useState<string | null>(null);
  const [channels, setChannels] = useState<Channel[]>([]);
  const [activeChannelId, setActiveChannelId] = useState<string | null>(null);
  
  const [allProfiles, setAllProfiles] = useState<Profile[]>([]);
  const [selectedFriendId, setSelectedFriendId] = useState<string | null>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  // Loading overlay animation using GSAP
  const loadingOverlayRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (isLoading && loadingOverlayRef.current) {
      gsap.fromTo(loadingOverlayRef.current, { opacity: 0 }, { opacity: 0.8, duration: 0.3 });
    }
  }, [isLoading]);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [isOneTimeView, setIsOneTimeView] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  const [replyingTo, setReplyingTo] = useState<any>(null);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [callUser, setCallUser] = useState<Profile | null>(null);
  const [isVideoCall, setIsVideoCall] = useState(false);
  const [globalSearchOpen, setGlobalSearchOpen] = useState(false);
  const [mediaGalleryOpen, setMediaGalleryOpen] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  const activeUserOrChannelId = activeWorkspaceId === null ? selectedFriendId : activeChannelId;
  const isChannelType = activeWorkspaceId !== null;
  const { typingUsers, handleTyping, stopTyping } = useTypingIndicator(user?.id, activeUserOrChannelId, isChannelType);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const activeChannel = channels.find(c => c.id === activeChannelId);
  const selectedFriend = allProfiles.find(p => p.id === selectedFriendId);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const normalizeMessage = (msg: any): Message => {
    const sender = typeof msg?.senderId === 'object' && msg.senderId !== null ? msg.senderId : null;
    const senderId = typeof msg?.senderId === 'object' && msg.senderId !== null
      ? (msg.senderId._id || msg.senderId.id || '')
      : (msg?.senderId || '');
    const createdAt = msg?.createdAt || msg?.created_at || new Date().toISOString();
    const viewedBy = Array.isArray(msg?.viewedBy)
      ? msg.viewedBy
      : Array.isArray(msg?.viewed_by)
        ? msg.viewed_by
        : [];

    return {
      ...msg,
      _id: msg?._id || msg?.id || '',
      id: msg?._id || msg?.id || '',
      content: typeof msg?.content === 'string' ? msg.content : '',
      createdAt,
      created_at: createdAt,
      senderId,
      sender_id: senderId,
      isOneTimeView: Boolean(msg?.isOneTimeView ?? msg?.is_one_time_view),
      is_one_time_view: Boolean(msg?.isOneTimeView ?? msg?.is_one_time_view),
      viewedBy,
      viewed_by: viewedBy,
      sender: {
        username: sender?.username || msg?.sender?.username || 'Unknown',
        avatar_url: sender?.avatar_url || msg?.sender?.avatar_url || null
      }
    } as Message;
  };

  useEffect(() => {
    if (panelRef.current) {
      gsap.fromTo(
        panelRef.current.children,
        { opacity: 0, y: 15 },
        { opacity: 1, y: 0, duration: 0.5, stagger: 0.08, ease: "power3.out" }
      );
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (!user) return;
    fetchWorkspaces();
    fetchAllProfiles();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    if (activeWorkspaceId) {
      fetchChannels(activeWorkspaceId);
    } else {
      setChannels([]);
      setActiveChannelId(null);
    }
  }, [activeWorkspaceId, user]);

  useEffect(() => {
    if (!activeChannelId || !user || !socket) {
      setMessages([]);
      return;
    }

    fetchMessages(activeChannelId);
    socket.emit('join_chat', activeChannelId);

    const handleNewMessage = (msg: Message) => {
      const isDM = activeWorkspaceId === null;
      
      const senderId = msg.senderId?._id || msg.senderId;
      
      if (isDM) {
        if (!( (senderId === user?.id && msg.receiverId === activeChannelId) || (senderId === activeChannelId && msg.receiverId === user?.id) )) {
          return;
        }
      } else {
        if (msg.groupId !== activeChannelId) return;
      }

      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        return [...prev, normalizeMessage(msg)];
      });
    };

    const handleMessageViewed = ({ messageId, viewedBy }: { messageId: string, viewedBy: string[] }) => {
      setMessages(prev => prev.map(m => 
        m._id === messageId ? { ...m, viewed_by: viewedBy } : m
      ));
    };

    const handleMessageDeleted = ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.map(m =>
        m._id === messageId ? { ...m, isDeleted: true, content: '' } : m
      ));
    };

    const handleMessageExpired = ({ messageId }: { messageId: string }) => {
      setMessages(prev => prev.filter(m => m._id !== messageId));
    };

    const handleIncomingCall = ({ offer, from, isVideo }: { offer: any, from: string, isVideo: boolean }) => {
      console.log('Received incoming call from:', from);
      const callingFriend = allProfiles.find(p => p.id === from);
      if (callingFriend) {
        setIsVideoCall(isVideo);
        setCallUser(callingFriend);
        // We'll pass incoming offer down to CallDialog
        (window as any).incomingCallOffer = offer;
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_viewed', handleMessageViewed);
    socket.on('message_deleted', handleMessageDeleted);
    socket.on('message_expired', handleMessageExpired);
    socket.on('incoming_call', handleIncomingCall);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_viewed', handleMessageViewed);
      socket.off('message_deleted', handleMessageDeleted);
      socket.off('message_expired', handleMessageExpired);
      socket.off('incoming_call', handleIncomingCall);
    };
  }, [activeChannelId, user, activeWorkspaceId, socket]);

  const fetchWorkspaces = async () => {
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/workspaces`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWorkspaces(data.map((w: any) => ({ ...w, id: w._id })));
      }
    } catch (err) {
      console.error('Failed to fetch workspaces', err);
    }
  };

  const fetchChannels = async (workspaceId: string) => {
    // Need backend channels endpoint implemented
    setChannels([]);
  };

  const fetchAllProfiles = async () => {
    try {
      const token = await getToken();
      // Fetch conversations with last message and unread count
      const res = await fetch(`${API_URL}/chat/conversations/list`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        // Map conversations to profiles with last message info
        setAllProfiles(data.map((c: any) => ({
          ...c.friend,
          id: c.friend._id,
          lastMessage: c.lastMessage,
          unreadCount: c.unreadCount
        })));
      }
    } catch (err) {
      console.error('Failed to fetch conversations', err);
    }
  };

  const fetchMessages = async (targetId: string) => {
    setIsLoading(true);
    try {
      const token = await getToken();
      const res = await fetch(`${API_URL}/chat/${targetId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setMessages((data || []).map((msg: any) => normalizeMessage(msg)));
      }
    } catch (err) {
      console.error('Failed to fetch messages', err);
    }
    setIsLoading(false);
  };

  const handleCreateWorkspace = async () => {
    // Add real API call later
    setWorkspaceDialogOpen(false);
    toast.error("Endpoint not yet built");
  };

  const handleCreateChannel = async (name: string, isPrivate: boolean) => {
    toast.error("Endpoint not yet built");
  };

  const handleSelectFriend = async (friendId: string) => {
    setSelectedFriendId(friendId);
    setActiveChannelId(friendId);
    
    // Mark messages as read when opening conversation
    try {
      const token = await getToken();
      // Get messages to mark as read
      const res = await fetch(`${API_URL}/chat/${friendId}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const messages = await res.json();
        // Mark all unread messages from the other user as read
        const unreadMessages = messages.filter((m: any) => 
          m.senderId !== user?.id && !m.readBy?.includes(user?.id)
        );
        
        await Promise.all(
          unreadMessages.map((m: any) =>
            fetch(`${API_URL}/chat/${m._id}/read`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` }
            })
          )
        );
        
        // Refresh conversations to update unread counts
        fetchAllProfiles();
      }
    } catch (err) {
      console.error('Error marking messages as read:', err);
    }
  };

  const handleMessageChange = (value: string) => {
    setNewMessage(value);
    if (user) {
      handleTyping(user.username);
    }
  };

  const handleSendMessage = async () => {
    if (!user || !activeChannelId || (!newMessage.trim() && !selectedFile) || isSending || !socket) return;

    setIsSending(true);
    setUploading(true);
    stopTyping(user.username);

    let attachmentsPayload = [];
    let messageContent = newMessage.trim();

    if (selectedFile) {
      try {
        const token = await getToken();
        const formData = new FormData();
        formData.append('file', selectedFile);
        const uploadRes = await fetch(`${API_URL}/uploads/upload`, {
          method: 'POST',
          headers: { Authorization: `Bearer ${token}` },
          body: formData
        });
        
        if (uploadRes.ok) {
          const fileData = await uploadRes.json();
          attachmentsPayload.push({
            name: fileData.name,
            size: fileData.size,
            url: fileData.url,
            mime_type: fileData.mime_type
          });
          
          if (selectedFile.type.startsWith('audio/') && !messageContent) {
            messageContent = '[Voice message]';
          } else if (!messageContent) {
            messageContent = 'Sent a file';
          }
        } else {
          toast.error("Failed to upload attachment");
          setIsSending(false);
          setUploading(false);
          return;
        }
      } catch (err) {
        toast.error("Upload error");
        setIsSending(false);
        setUploading(false);
        return;
      }
    }

    const encryptedContent = await encryptMessage(messageContent, user.id, activeWorkspaceId ? null : activeChannelId);

    const payload = {
      senderId: user.id,
      receiverId: activeWorkspaceId ? null : activeChannelId,
      groupId: activeWorkspaceId ? activeChannelId : null,
      content: encryptedContent,
      attachments: attachmentsPayload,
      metadata: { has_card: false },
      isEphemeral,
      isOneTimeView,
      replyTo: replyingTo?._id || null
    };

    socket.emit('send_message', payload);

    setNewMessage('');
    setSelectedFile(null);
    setIsEphemeral(false);
    setIsOneTimeView(false);
    setReplyingTo(null);
    setIsSending(false);
    setUploading(false);
  };

  const handleVoiceRecording = (file: File) => {
    setSelectedFile(file);
    setTimeout(() => handleSendMessage(), 100);
  };

  const handleReply = async (message: any) => {
    try {
      const token = await getToken();
      const messageId = message._id || message.id;
      const res = await fetch(`${API_URL}/chat/${messageId}/reply`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setReplyingTo(data);
      }
    } catch (err) {
      console.error('Error fetching reply context:', err);
    }
  };

  if (!user) return null;

  const friendsWithStatus = allProfiles.map(p => ({
    ...p,
    isOnline: onlineUsers.has(p.id)
  }));

  const filteredFriends = friendsWithStatus.filter(f => 
    f.username.toLowerCase().includes(sidebarSearch.toLowerCase())
  );

  const normalizedSearchQuery = searchQuery.trim().toLowerCase();
  const filteredMessages = messages.filter(msg =>
    !normalizedSearchQuery || (typeof msg.content === 'string' && msg.content.toLowerCase().includes(normalizedSearchQuery))
  );

  const isTyping = typingUsers.size > 0;
  const typingListText = Array.from(typingUsers).join(', ');

  return (
    <div className="h-[100dvh] flex w-full p-4 md:p-6 relative gap-4 bg-[#F4F7F6] dark:bg-slate-950 transition-colors duration-300">
      <WorkspaceSidebar
        workspaces={workspaces.filter(w => w.slug !== 'direct-messages')}
        activeWorkspaceId={activeWorkspaceId}
        onSelectWorkspace={(id) => {
          setActiveWorkspaceId(id);
          setSelectedFriendId(null);
        }}
        onCreateWorkspace={() => setWorkspaceDialogOpen(true)}
        onAddContact={() => setShowAddContact(true)}
        user={user}
      />
      <div ref={panelRef} className="flex gap-4 flex-1 h-full min-w-0">
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
          <div className="w-64 flex flex-col h-full bg-white/60 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/60 dark:border-slate-800/50 rounded-[28px] shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-2xl overflow-hidden flex-shrink-0 transition-colors duration-300">
            <div className="p-5 border-b border-black/5 dark:border-white/5">
              <div className="relative">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  placeholder="Search contacts..."
                  value={sidebarSearch}
                  onChange={(e) => setSidebarSearch(e.target.value)}
                  className="pl-11 bg-white/50 dark:bg-slate-800/50 border-white/40 dark:border-slate-700/50 focus-visible:ring-[#9AC68A] dark:focus-visible:ring-[#4ADE80] h-11 rounded-[16px] text-sm font-medium shadow-sm"
                />
              </div>
            </div>
            <div className="px-5 py-3">
              <span className="text-[11px] uppercase font-bold tracking-wider text-gray-500 dark:text-gray-400">Messages</span>
            </div>
            <ScrollArea className="flex-1 p-2">
              <div className="space-y-0.5">
                {filteredFriends.map((friend) => {
                  const isSelected = selectedFriendId === friend.id;
                  const lastMessagePreview = friend.lastMessage?.content || 'No messages yet';
                  const isLastMessageFromMe = friend.lastMessage?.senderId === user?.id;
                  const unreadCount = friend.unreadCount || 0;
                  
                  return (
                    <button
                      key={friend.id}
                      onClick={() => handleSelectFriend(friend.id)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-[16px] text-left transition-all duration-200 ${
                        isSelected
                          ? "bg-white dark:bg-slate-800 shadow-sm border border-white/60 dark:border-slate-700/50"
                          : "text-gray-600 dark:text-gray-300 hover:bg-white/40 dark:hover:bg-slate-800/40"
                      }`}
                    >
                      <div className="relative">
                        <Avatar className="h-10 w-10 rounded-[14px] border border-black/5 dark:border-white/5">
                          <AvatarImage src={friend.avatar_url || ''} />
                          <AvatarFallback className={isSelected ? "bg-[#9AC68A] dark:bg-[#4ADE80] text-white dark:text-slate-950" : "bg-gray-100 dark:bg-slate-700 text-gray-600 dark:text-gray-300"}>
                            {friend.username.charAt(0).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        {friend.isOnline && (
                          <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-[#4ADE80] border-2 border-white dark:border-slate-800 rounded-full" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className={`text-sm font-bold truncate ${isSelected ? 'text-[#9AC68A] dark:text-[#4ADE80]' : 'text-gray-900 dark:text-white'}`}>{friend.username}</p>
                          {unreadCount > 0 && (
                            <span className="flex-shrink-0 ml-2 px-2 py-0.5 bg-[#9AC68A] dark:bg-[#4ADE80] text-white dark:text-slate-950 text-xs font-bold rounded-full">
                              {unreadCount}
                            </span>
                          )}
                        </div>
                        <p className={`text-xs truncate mt-0.5 ${isSelected ? 'text-gray-600 dark:text-gray-400' : 'text-gray-500 dark:text-gray-500'}`}>
                          {isLastMessageFromMe ? 'You: ' : ''}{lastMessagePreview}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            </ScrollArea>
          </div>
        )}
        <div className="flex-1 bg-white/60 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/60 dark:border-slate-800/50 rounded-[28px] overflow-hidden flex flex-col shadow-[0_20px_50px_rgba(0,0,0,0.05)] dark:shadow-2xl relative min-w-[320px] transition-colors duration-300">
          {activeChannelId ? (
            <>
              <ChatHeader
                selectedUser={activeWorkspaceId === null ? selectedFriend || { username: 'Chat Hub', avatar_url: null, id: '' } as unknown as Profile : { username: `#${activeChannel?.name || 'room'}`, avatar_url: null, id: '' } as unknown as Profile}
                isOnline={activeWorkspaceId === null ? (selectedFriend ? onlineUsers.has(selectedFriend.id) : false) : true}
                isTyping={isTyping}
                isConnected={true}
                onRefresh={() => fetchMessages(activeChannelId)}
                isRefreshing={isLoading}
                onUserClick={() => setProfileDialogOpen(true)}
                searchQuery={searchQuery}
                onSearchChange={setSearchQuery}
                onVoiceCall={() => setCallUser(selectedFriend || null)}
                onVideoCall={() => { setCallUser(selectedFriend || null); setIsVideoCall(true); }}
                onGlobalSearch={() => setGlobalSearchOpen(true)}
                onMediaClick={() => setMediaGalleryOpen(true)}
                onBack={() => { setActiveChannelId(null); setSelectedFriendId(null); }}
              />
              <ChatMessages
                messages={filteredMessages as any}
                currentUserId={user.id}
                otherUserId={activeChannelId}
                isLoading={isLoading}
                onDelete={(id) => setMessages(prev => prev.filter(m => m._id !== id))}
                onReply={handleReply}
              />
              {isTyping && (
                <div className="px-6 py-2 bg-white/40 dark:bg-slate-800/40 backdrop-blur-md border-t border-white/40 dark:border-slate-700/50">
                  <span className="text-xs font-bold text-[#9AC68A] dark:text-[#4ADE80] animate-pulse">
                    ● {typingListText} {typingUsers.size === 1 ? 'is' : 'are'} typing...
                  </span>
                </div>
              )}
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
                isOneTimeView={isOneTimeView}
                onOneTimeViewToggle={setIsOneTimeView}
              />
            </>
          ) : (
            <EmptyChat />
          )}
        </div>
      </div>
      <Dialog open={workspaceDialogOpen} onOpenChange={setWorkspaceDialogOpen}>
        <DialogContent className="sm:max-w-[425px] rounded-[28px] bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl border border-white/60 dark:border-slate-800/50 shadow-2xl">
          <DialogHeader>
            <DialogTitle className="font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <Sparkles className="w-5 h-5 text-[#9AC68A] dark:text-[#4ADE80] animate-pulse" /> Create Workspace
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="wsName" className="font-bold text-gray-700 dark:text-gray-300">Workspace Name</Label>
              <Input
                id="wsName"
                value={newWorkspaceName}
                onChange={(e) => setNewWorkspaceName(e.target.value)}
                className="rounded-[16px] bg-white/50 dark:bg-slate-800/50 border border-white/60 dark:border-slate-700/50 focus-visible:ring-[#9AC68A] dark:focus-visible:ring-[#4ADE80] h-12"
              />
            </div>
          </div>
          <Button onClick={handleCreateWorkspace} className="w-full bg-[#9AC68A] dark:bg-[#4ADE80] hover:bg-[#8AB67A] dark:hover:bg-[#22C55E] text-white dark:text-slate-950 rounded-[16px] py-6 font-bold shadow-md transition-all">
            Create Workspace
          </Button>
        </DialogContent>
      </Dialog>
      {selectedFriendId && (
        <UserProfileDialog
          open={profileDialogOpen}
          onOpenChange={setProfileDialogOpen}
          userId={selectedFriendId}
          currentUserId={user.id}
        />
      )}
      <CallDialog open={!!callUser} onOpenChange={(open) => !open && setCallUser(null)} user={callUser as any} isVideo={isVideoCall} />
      <GlobalSearchDialog
        open={globalSearchOpen}
        onOpenChange={setGlobalSearchOpen}
        onSelectMessage={(targetUserId, messageId) => {
          handleSelectFriend(targetUserId);
        }}
      />
      {selectedFriendId && (
        <MediaGalleryDialog
          open={mediaGalleryOpen}
          onOpenChange={setMediaGalleryOpen}
          targetUserId={selectedFriendId}
        />
      )}
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-white/60 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/60 dark:border-slate-800/50 shadow-2xl rounded-[28px] gap-0">
          <div className="h-16 w-full bg-gradient-to-r from-[#9AC68A] to-[#8AB67A] dark:from-[#4ADE80] dark:to-[#22C55E] mx-6 mt-6 rounded-[16px] max-w-[calc(100%-48px)]" />
          <div className="p-6 pt-4">
            <p className="text-gray-500 dark:text-gray-300 text-[15px] mb-6">
              Search for friends using their username or unique ID tag
              (e.g. username#tag).
            </p>
            <UserSearch />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};
export default ChatInterface;
