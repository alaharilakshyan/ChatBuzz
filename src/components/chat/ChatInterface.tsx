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
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [isEphemeral, setIsEphemeral] = useState(false);
  const [isOneTimeView, setIsOneTimeView] = useState(false);
  const [showAddContact, setShowAddContact] = useState(false);
  
  const [searchQuery, setSearchQuery] = useState('');
  const [sidebarSearch, setSidebarSearch] = useState('');
  const [workspaceDialogOpen, setWorkspaceDialogOpen] = useState(false);
  const [newWorkspaceName, setNewWorkspaceName] = useState('');
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);
  const [callUser, setCallUser] = useState<Profile | null>(null);
  const [isVideoCall, setIsVideoCall] = useState(false);

  const panelRef = useRef<HTMLDivElement>(null);

  const activeUserOrChannelId = activeWorkspaceId === null ? selectedFriendId : activeChannelId;
  const isChannelType = activeWorkspaceId !== null;
  const { typingUsers, handleTyping, stopTyping } = useTypingIndicator(user?.id, activeUserOrChannelId, isChannelType);

  const activeWorkspace = workspaces.find(w => w.id === activeWorkspaceId);
  const activeChannel = channels.find(c => c.id === activeChannelId);
  const selectedFriend = allProfiles.find(p => p.id === selectedFriendId);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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
        if (!( (senderId === user.id && msg.receiverId === activeChannelId) || (senderId === activeChannelId && msg.receiverId === user.id) )) {
          return;
        }
      } else {
        if (msg.groupId !== activeChannelId) return;
      }

      setMessages(prev => {
        if (prev.some(m => m._id === msg._id)) return prev;
        
        const mappedSender = {
          username: msg.senderId?.username || 'Unknown',
          avatar_url: msg.senderId?.avatar_url || null
        };
        
        // Convert to UI format
        return [...prev, {
          ...msg,
          id: msg._id,
          created_at: msg.createdAt,
          sender_id: senderId,
          is_one_time_view: msg.isOneTimeView,
          viewed_by: msg.viewedBy,
          sender: mappedSender
        } as any];
      });
    };

    const handleMessageViewed = ({ messageId, viewedBy }: { messageId: string, viewedBy: string[] }) => {
      setMessages(prev => prev.map(m => 
        m._id === messageId ? { ...m, viewed_by: viewedBy } : m
      ));
    };

    socket.on('new_message', handleNewMessage);
    socket.on('message_viewed', handleMessageViewed);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('message_viewed', handleMessageViewed);
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
      const res = await fetch(`${API_URL}/users/search`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setAllProfiles(data.map((p: any) => ({ ...p, id: p.clerkId })));
      }
    } catch (err) {
      console.error('Failed to fetch profiles', err);
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
        setMessages(data.map((msg: any) => ({
          ...msg,
          id: msg._id,
          sender_id: msg.senderId?._id || msg.senderId,
          created_at: msg.createdAt,
          is_one_time_view: msg.isOneTimeView,
          viewed_by: msg.viewedBy,
          sender: {
            username: msg.senderId?.username || 'Unknown',
            avatar_url: msg.senderId?.avatar_url || null
          }
        })));
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

    const encryptedContent = await encryptMessage(messageContent, user.id, activeChannelId);

    const payload = {
      senderId: user.id,
      receiverId: activeWorkspaceId ? null : activeChannelId,
      groupId: activeWorkspaceId ? activeChannelId : null,
      content: encryptedContent,
      attachments: attachmentsPayload,
      metadata: { has_card: false },
      isEphemeral,
      isOneTimeView
    };

    socket.emit('send_message', payload);

    setNewMessage('');
    setSelectedFile(null);
    setIsEphemeral(false);
    setIsOneTimeView(false);
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
                        <p className={`text-sm font-bold truncate ${isSelected ? 'text-[#9AC68A] dark:text-[#4ADE80]' : 'text-gray-900 dark:text-white'}`}>{friend.username}</p>
                        <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-0.5">
                          {friend.isOnline ? "Online" : "Offline"}
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
                onBack={() => { setActiveChannelId(null); setSelectedFriendId(null); }}
              />
              <ChatMessages
                messages={messages.filter(msg => searchQuery ? msg.content.toLowerCase().includes(searchQuery.toLowerCase()) : true) as any}
                currentUserId={user.id}
                otherUserId={activeChannelId}
                isLoading={isLoading}
                onDelete={(id) => setMessages(prev => prev.filter(m => m._id !== id))}
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
      <Dialog open={showAddContact} onOpenChange={setShowAddContact}>
        <DialogContent className="sm:max-w-[480px] p-0 overflow-hidden bg-[#0B1120] border-[#1e293b] shadow-2xl rounded-2xl gap-0">
          <div className="h-16 w-full bg-gradient-to-r from-blue-500 to-purple-500 mx-6 mt-6 rounded-sm max-w-[calc(100%-48px)]" />
          <div className="p-6 pt-4">
            <p className="text-gray-300 text-[15px] mb-6">
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
