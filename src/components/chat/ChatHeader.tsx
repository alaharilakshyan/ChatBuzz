import React from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RefreshCw, Search, X, Phone, Video, ArrowLeft } from 'lucide-react';

interface User {
  id: string;
  username: string;
  user_tag: string;
  avatar_url: string | null;
  bio: string | null;
  isOnline?: boolean;
}

interface ChatHeaderProps {
  selectedUser: User;
  isOnline: boolean;
  isTyping: boolean;
  isConnected: boolean;
  onRefresh?: () => void;
  isRefreshing?: boolean;
  onUserClick?: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onVoiceCall?: () => void;
  onVideoCall?: () => void;
  onBack?: () => void;
}

export const ChatHeader: React.FC<ChatHeaderProps> = ({ 
  selectedUser, 
  isOnline,
  isTyping,
  isConnected,
  onRefresh,
  isRefreshing = false,
  onUserClick,
  searchQuery = '',
  onSearchChange,
  onVoiceCall,
  onVideoCall,
  onBack
}) => {
  const [showSearch, setShowSearch] = React.useState(false);

  return (
    <div className="border-b border-border/50 backdrop-blur-xl bg-card/80">
      <div className="p-3 md:p-4 flex items-center gap-2 md:gap-4">
        {onBack && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onBack}
            className="md:hidden h-9 w-9 rounded-full hover:bg-muted"
          >
            <ArrowLeft className="h-5 w-5" />
          </Button>
        )}
        <div 
          className="flex items-center gap-3 md:gap-4 flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity"
          onClick={onUserClick}
        >
          <div className="relative">
            <Avatar className="h-10 w-10 md:h-12 md:w-12 ring-2 ring-primary/20 shadow-lg">
              <AvatarImage src={selectedUser.avatar_url || undefined} alt={selectedUser.username} />
              <AvatarFallback className="bg-gradient-to-br from-primary to-accent text-primary-foreground font-bold">
                {selectedUser.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
            {isOnline && (
              <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-card rounded-full animate-pulse" />
            )}
          </div>
          
          <div className="flex-1 min-w-0">
            <h2 className="font-bold text-base md:text-lg truncate">
              {selectedUser.username}
            </h2>
            <div className="flex items-center gap-1">
              {isTyping ? (
                <div className="flex items-center gap-1">
                  <span className="text-xs text-primary font-medium">typing</span>
                  <div className="flex gap-0.5">
                    <span className="w-1 h-1 rounded-full bg-primary typing-dot" />
                    <span className="w-1 h-1 rounded-full bg-primary typing-dot" />
                    <span className="w-1 h-1 rounded-full bg-primary typing-dot" />
                  </div>
                </div>
              ) : isOnline ? (
                <span className="text-xs text-emerald-500 font-medium">online</span>
              ) : (
                <span className="text-xs text-muted-foreground">offline</span>
              )}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-1">
          {onVideoCall && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onVideoCall}
              className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Video className="h-5 w-5" />
            </Button>
          )}
          
          {onVoiceCall && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onVoiceCall}
              className="h-9 w-9 rounded-full hover:bg-primary/10 hover:text-primary transition-colors"
            >
              <Phone className="h-5 w-5" />
            </Button>
          )}
          
          {onSearchChange && (
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setShowSearch(!showSearch)}
              className={`h-9 w-9 rounded-full transition-colors ${showSearch ? 'bg-primary/10 text-primary' : 'hover:bg-muted'}`}
            >
              <Search className="h-5 w-5" />
            </Button>
          )}
          
          {onRefresh && (
            <Button
              variant="ghost"
              size="icon"
              onClick={onRefresh}
              disabled={isRefreshing}
              className="h-9 w-9 rounded-full hover:bg-muted"
            >
              <RefreshCw className={`h-4 w-4 ${isRefreshing ? 'animate-spin' : ''}`} />
            </Button>
          )}
        </div>
      </div>
      
      {showSearch && onSearchChange && (
        <div className="px-3 md:px-4 pb-3 animate-in slide-in-from-top-2 duration-200">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              placeholder="Search messages..."
              className="pl-10 pr-10 bg-muted/50 border-none focus-visible:ring-primary"
              autoFocus
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                onClick={() => onSearchChange('')}
                className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7 p-0 rounded-full"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
};
