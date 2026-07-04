import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Checkbox } from '@/components/ui/checkbox';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Plus, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface Friend {
  id: string;
  username: string;
  avatar_url: string | null;
  user_tag: string;
}

interface CreateGroupDialogProps {
  onGroupCreated?: () => void;
}

export const CreateGroupDialog: React.FC<CreateGroupDialogProps> = ({ onGroupCreated }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [isOpen, setIsOpen] = useState(false);
  const [groupName, setGroupName] = useState('');
  const [selectedFriends, setSelectedFriends] = useState<string[]>([]);
  const [friends, setFriends] = useState<Friend[]>([]);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      fetchFriends();
    }
  }, [isOpen]);

  const fetchFriends = async () => {
    if (!user) return;
    setLoading(true);

    // TODO: Connect to backend API for friends list
    // Mocking an empty list for now since friends API doesn't exist yet
    setFriends([]);
    
    setLoading(false);
  };

  const toggleFriend = (friendId: string) => {
    setSelectedFriends(prev =>
      prev.includes(friendId)
        ? prev.filter(id => id !== friendId)
        : [...prev, friendId]
    );
  };

  const handleCreateGroup = async () => {
    if (!user || !groupName.trim() || selectedFriends.length === 0) {
      toast({
        title: 'Missing information',
        description: 'Please enter a group name and select at least one friend',
        variant: 'destructive'
      });
      return;
    }

    setCreating(true);

    // TODO: Connect to backend API for group creation
    await new Promise(r => setTimeout(r, 1000));
    
    toast({
      title: 'Group created (Mocked)',
      description: `${groupName} has been created`
    });

    setIsOpen(false);
    setGroupName('');
    setSelectedFriends([]);
    onGroupCreated?.();
    setCreating(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2">
          <Users className="h-4 w-4" />
          <span className="hidden sm:inline">New Group</span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Users className="h-5 w-5 text-primary" />
            Create New Group
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="groupName">Group Name</Label>
            <Input
              id="groupName"
              placeholder="Enter group name..."
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
            />
          </div>

          <div className="space-y-2">
            <Label>Select Friends ({selectedFriends.length} selected)</Label>
            {loading ? (
              <div className="flex items-center justify-center py-8">
                <Loader2 className="h-6 w-6 animate-spin" />
              </div>
            ) : friends.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-8">
                No friends to add. Add some friends first!
              </p>
            ) : (
              <ScrollArea className="h-[200px] rounded-lg border p-2">
                <div className="space-y-2">
                  {friends.map((friend) => (
                    <div
                      key={friend.id}
                      className={`flex items-center gap-3 p-2 rounded-lg cursor-pointer transition-colors ${
                        selectedFriends.includes(friend.id)
                          ? 'bg-primary/10'
                          : 'hover:bg-muted'
                      }`}
                      onClick={() => toggleFriend(friend.id)}
                    >
                      <Checkbox
                        checked={selectedFriends.includes(friend.id)}
                        onCheckedChange={() => toggleFriend(friend.id)}
                      />
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={friend.avatar_url || undefined} />
                        <AvatarFallback>
                          {friend.username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{friend.username}</p>
                        <p className="text-xs text-muted-foreground">#{friend.user_tag}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </ScrollArea>
            )}
          </div>
        </div>

        <div className="flex justify-end gap-2">
          <Button variant="outline" onClick={() => setIsOpen(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleCreateGroup}
            disabled={creating || !groupName.trim() || selectedFriends.length === 0}
            className="gap-2"
          >
            {creating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create Group
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};
