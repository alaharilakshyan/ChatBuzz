import React, { useState } from "react";
import { Hash, Lock, Plus, ChevronDown, ChevronRight, Volume2, FolderKanban } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

export interface Channel {
  id: string;
  workspace_id: string;
  name: string;
  is_private: boolean;
  allowed_roles: string[];
}

interface ChannelsListProps {
  channels: Channel[];
  activeChannelId: string | null;
  onSelectChannel: (id: string) => void;
  onCreateChannel: (name: string, isPrivate: boolean) => void;
  isOwner: boolean;
}

export const ChannelsList: React.FC<ChannelsListProps> = ({
  channels,
  activeChannelId,
  onSelectChannel,
  onCreateChannel,
  isOwner,
}) => {
  const [channelsExpanded, setChannelsExpanded] = useState(true);
  const [voiceExpanded, setVoiceExpanded] = useState(true);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [newChannelName, setNewChannelName] = useState("");
  const [isPrivateChannel, setIsPrivateChannel] = useState(false);

  const textChannels = channels.filter((c) => !c.name.startsWith("voice-"));
  const voiceChannels = channels.filter((c) => c.name.startsWith("voice-"));

  const handleCreate = () => {
    if (!newChannelName.trim()) {
      toast.error("Channel name cannot be empty");
      return;
    }
    onCreateChannel(newChannelName.trim().toLowerCase().replace(/\s+/g, "-"), isPrivateChannel);
    setNewChannelName("");
    setIsPrivateChannel(false);
    setCreateDialogOpen(false);
  };

  const checkAccess = (channel: Channel): boolean => {
    if (!channel.is_private) return true;
    if (isOwner) return true;
    // Check if the user is a standard member and member is allowed
    return channel.allowed_roles.includes("member");
  };

  return (
    <div className="flex flex-col h-full bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.03)] overflow-hidden">
      {/* Header / Workspace info */}
      <div className="p-4 border-b border-[#1A2421]/10 flex items-center justify-between">
        <h3 className="font-bold text-base text-[#0C1412] tracking-tight flex items-center gap-2">
          <FolderKanban className="w-4 h-4 text-[#1A2421]/60" />
          Workspace Hub
        </h3>
        
        {isOwner && (
          <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="ghost" size="icon" className="h-8 w-8 rounded-xl hover:bg-[#0C1412]/5 text-[#1A2421]/60 hover:text-[#0C1412]">
                <Plus className="h-4.5 w-4.5" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px] rounded-3xl">
              <DialogHeader>
                <DialogTitle className="font-bold text-[#0C1412]">Create Channel</DialogTitle>
                <DialogDescription>
                  Add a new text or voice space to this workspace.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="channelName">Channel Name</Label>
                  <Input
                    id="channelName"
                    placeholder="e.g. general"
                    value={newChannelName}
                    onChange={(e) => setNewChannelName(e.target.value)}
                    className="rounded-xl border-[#1A2421]/10 focus-visible:ring-[#0C1412]"
                  />
                </div>
                <div className="flex items-center justify-between pt-2">
                  <div className="space-y-0.5">
                    <Label htmlFor="private">Private Channel</Label>
                    <p className="text-xs text-muted-foreground">Only authorized roles can view this channel</p>
                  </div>
                  <Switch
                    id="private"
                    checked={isPrivateChannel}
                    onCheckedChange={setIsPrivateChannel}
                  />
                </div>
              </div>
              <Button onClick={handleCreate} className="w-full bg-[#0C1412] hover:bg-[#1A2421] text-white rounded-xl py-6 font-semibold">
                Create Channel
              </Button>
            </DialogContent>
          </Dialog>
        )}
      </div>

      {/* Lists */}
      <div className="flex-1 overflow-y-auto p-3 space-y-4 select-none scrollbar-thin">
        {/* Text Channels Section */}
        <div className="space-y-1">
          <div 
            className="flex items-center justify-between text-xs font-semibold text-[#1A2421]/50 px-2 py-1.5 hover:text-[#0C1412] cursor-pointer"
            onClick={() => setChannelsExpanded(!channelsExpanded)}
          >
            <div className="flex items-center gap-1">
              {channelsExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span className="tracking-wider uppercase">Text Channels</span>
            </div>
          </div>

          {channelsExpanded && (
            <div className="space-y-0.5">
              {textChannels.map((ch) => {
                const isActive = activeChannelId === ch.id;
                const hasAccess = checkAccess(ch);

                return (
                  <button
                    key={ch.id}
                    disabled={!hasAccess}
                    onClick={() => onSelectChannel(ch.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? "bg-[#0C1412] text-white shadow-sm"
                        : hasAccess
                        ? "text-[#1A2421]/75 hover:bg-[#0C1412]/5 hover:text-[#0C1412]"
                        : "opacity-45 text-[#1A2421]/40 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      {ch.is_private ? (
                        <Lock className="w-4 h-4 text-inherit flex-shrink-0" />
                      ) : (
                        <Hash className="w-4 h-4 text-inherit flex-shrink-0" />
                      )}
                      <span className="truncate">{ch.name}</span>
                    </div>
                    {!hasAccess && (
                      <Badge variant="secondary" className="text-[10px] px-1.5 py-0 rounded-md">
                        Restricted
                      </Badge>
                    )}
                  </button>
                );
              })}
              {textChannels.length === 0 && (
                <p className="text-xs text-muted-foreground/60 px-6 py-2">No channels created</p>
              )}
            </div>
          )}
        </div>

        {/* Voice Section */}
        <div className="space-y-1">
          <div 
            className="flex items-center justify-between text-xs font-semibold text-[#1A2421]/50 px-2 py-1.5 hover:text-[#0C1412] cursor-pointer"
            onClick={() => setVoiceExpanded(!voiceExpanded)}
          >
            <div className="flex items-center gap-1">
              {voiceExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
              <span className="tracking-wider uppercase">Voice Areas</span>
            </div>
          </div>

          {voiceExpanded && (
            <div className="space-y-0.5">
              {voiceChannels.map((ch) => {
                const isActive = activeChannelId === ch.id;
                const hasAccess = checkAccess(ch);

                return (
                  <button
                    key={ch.id}
                    disabled={!hasAccess}
                    onClick={() => onSelectChannel(ch.id)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-sm font-medium transition-all duration-200 group ${
                      isActive
                        ? "bg-[#0C1412] text-white shadow-sm"
                        : hasAccess
                        ? "text-[#1A2421]/75 hover:bg-[#0C1412]/5 hover:text-[#0C1412]"
                        : "opacity-45 text-[#1A2421]/40 cursor-not-allowed"
                    }`}
                  >
                    <div className="flex items-center gap-2 truncate">
                      <Volume2 className="w-4 h-4 text-inherit flex-shrink-0" />
                      <span className="truncate">{ch.name.replace("voice-", "")}</span>
                    </div>
                  </button>
                );
              })}
              {voiceChannels.length === 0 && (
                <p className="text-xs text-muted-foreground/60 px-6 py-2">No voice areas</p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
export default ChannelsList;
