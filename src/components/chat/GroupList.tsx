import React, { useState, useEffect } from 'react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Users, Trash2, Loader2 } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface Group {
  id: string;
  name: string;
  avatar_url: string | null;
  created_by: string;
  member_count?: number;
}

interface GroupListProps {
  selectedGroupId: string | null;
  onGroupSelect: (groupId: string) => void;
  refreshTrigger?: number;
}

export const GroupList: React.FC<GroupListProps> = ({
  selectedGroupId,
  onGroupSelect,
  refreshTrigger
}) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [groups, setGroups] = useState<Group[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteGroupId, setDeleteGroupId] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const fetchGroups = async () => {
    if (!user) return;
    
    // TODO: Fetch groups from new backend API
    setGroups([]);
    setLoading(false);
  };

  useEffect(() => {
    fetchGroups();
  }, [user, refreshTrigger]);

  const handleDeleteGroup = async () => {
    if (!deleteGroupId) return;
    setDeleting(true);

    try {
      // TODO: Connect delete group API
      toast({
        title: 'Notice',
        description: 'Delete group API not yet connected',
      });
    } catch (error) {
      console.error('Error deleting group:', error);
    }
    
    setDeleting(false);
    setDeleteGroupId(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-4">
        <Loader2 className="h-5 w-5 animate-spin" />
      </div>
    );
  }

  if (groups.length === 0) {
    return (
      <div className="text-center py-4 text-muted-foreground text-sm">
        No groups yet
      </div>
    );
  }

  return (
    <>
      <ScrollArea className="flex-1">
        <div className="space-y-1 p-2">
          {groups.map((group) => (
            <div
              key={group.id}
              className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all group ${
                selectedGroupId === group.id
                  ? 'bg-primary/10 shadow-sm'
                  : 'hover:bg-muted/50'
              }`}
              onClick={() => onGroupSelect(group.id)}
            >
              <Avatar className="h-10 w-10">
                <AvatarImage src={group.avatar_url || undefined} />
                <AvatarFallback className="bg-gradient-to-br from-primary/80 to-primary text-primary-foreground">
                  <Users className="h-5 w-5" />
                </AvatarFallback>
              </Avatar>
              
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium truncate">{group.name}</p>
                <p className="text-xs text-muted-foreground">Group chat</p>
              </div>

              {group.created_by === user?.id && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="opacity-0 group-hover:opacity-100 h-8 w-8 p-0 text-destructive hover:text-destructive hover:bg-destructive/10"
                  onClick={(e) => {
                    e.stopPropagation();
                    setDeleteGroupId(group.id);
                  }}
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      </ScrollArea>

      <AlertDialog open={!!deleteGroupId} onOpenChange={() => setDeleteGroupId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Group</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this group? This action cannot be undone
              and all messages will be lost.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteGroup}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={deleting}
            >
              {deleting ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
};
