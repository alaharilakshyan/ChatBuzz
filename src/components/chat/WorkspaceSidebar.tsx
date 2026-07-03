import React from "react";
import { Home, Plus, Folder, MessageSquare, Bell, Settings, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

export interface Workspace {
  id: string;
  name: string;
  slug: string;
  owner_id: string;
}

interface WorkspaceSidebarProps {
  workspaces: Workspace[];
  activeWorkspaceId: string | null; // null represents "Home/DMs"
  onSelectWorkspace: (id: string | null) => void;
  onCreateWorkspace: () => void;
  user: any;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  user,
}) => {
  return (
    <TooltipProvider>
      <div className="flex flex-col items-center justify-between w-20 py-6 bg-white/70 backdrop-blur-xl border border-white/60 rounded-3xl shadow-[0_20px_50px_rgba(0,0,0,0.03)] flex-shrink-0 h-full">
        {/* Top: Logo & Main Navigation */}
        <div className="flex flex-col items-center gap-6 w-full">
          {/* CB Logo */}
          <div className="w-12 h-12 rounded-2xl bg-[#0C1412] flex items-center justify-center shadow-lg transition-transform duration-300 hover:scale-105 select-none cursor-pointer" onClick={() => onSelectWorkspace(null)}>
            <span className="text-[#F4F7F6] font-extrabold text-base tracking-tight">CB</span>
          </div>

          <div className="w-8 h-[1px] bg-[#1A2421]/10 my-1" />

          {/* Navigation Action Buttons */}
          <div className="flex flex-col items-center gap-4 w-full px-2">
            {/* Home / DMs */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSelectWorkspace(null)}
                  className={`h-12 w-12 rounded-2xl transition-all duration-300 ${
                    activeWorkspaceId === null
                      ? "bg-[#0C1412] text-white shadow-md scale-105"
                      : "hover:bg-[#0C1412]/5 text-[#1A2421]/60 hover:text-[#0C1412]"
                  }`}
                >
                  <Home className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-semibold text-xs">Direct Messages</p>
              </TooltipContent>
            </Tooltip>

            {/* Folder Index / Assets */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-2xl hover:bg-[#0C1412]/5 text-[#1A2421]/60 hover:text-[#0C1412] transition-all duration-300"
                >
                  <Folder className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-semibold text-xs">Files Index</p>
              </TooltipContent>
            </Tooltip>

            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-2xl hover:bg-[#0C1412]/5 text-[#1A2421]/60 hover:text-[#0C1412] transition-all duration-300 relative"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#4EAB77] border-2 border-white rounded-full" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-semibold text-xs">Notifications</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="w-8 h-[1px] bg-[#1A2421]/10 my-1" />

          {/* Workspaces Scrollable Container */}
          <div className="flex flex-col items-center gap-3 w-full max-h-[300px] overflow-y-auto scrollbar-none px-2 py-1">
            {workspaces.map((ws) => {
              const isActive = activeWorkspaceId === ws.id;
              const initials = ws.name.split(" ").map(n => n[0]).join("").substring(0, 2).toUpperCase();

              return (
                <Tooltip key={ws.id}>
                  <TooltipTrigger asChild>
                    <button
                      onClick={() => onSelectWorkspace(ws.id)}
                      className={`h-12 w-12 rounded-2xl font-bold text-sm flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? "bg-[#0C1412] text-white shadow-md scale-105"
                          : "bg-white border border-[#1A2421]/10 hover:border-[#0C1412] text-[#1A2421]/80 hover:text-[#0C1412] hover:scale-105 shadow-sm"
                      }`}
                    >
                      {initials}
                    </button>
                  </TooltipTrigger>
                  <TooltipContent side="right">
                    <p className="font-semibold text-xs">{ws.name}</p>
                  </TooltipContent>
                </Tooltip>
              );
            })}

            {/* Add Workspace Button */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  size="icon"
                  onClick={onCreateWorkspace}
                  className="h-12 w-12 rounded-2xl border-dashed border-[#1A2421]/20 hover:border-[#0C1412] hover:bg-[#0C1412]/5 text-[#1A2421]/60 hover:text-[#0C1412] transition-all duration-300"
                >
                  <Plus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-semibold text-xs">Create Workspace</p>
              </TooltipContent>
            </Tooltip>
          </div>
        </div>

        {/* Bottom: Profile & Settings */}
        <div className="flex flex-col items-center gap-4 w-full px-2">
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="h-12 w-12 rounded-2xl hover:bg-[#0C1412]/5 text-[#1A2421]/60 hover:text-[#0C1412] transition-all duration-300"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-semibold text-xs">Settings</p>
            </TooltipContent>
          </Tooltip>

          <Avatar className="h-10 w-10 ring-2 ring-[#0C1412]/10 ring-offset-2 transition-transform duration-300 hover:scale-105 cursor-pointer">
            <AvatarImage src={user?.avatar_url || user?.avatar} alt={user?.username} />
            <AvatarFallback className="bg-[#0C1412] text-white text-xs font-semibold">
              {user?.username ? user.username.charAt(0).toUpperCase() : <User className="w-4 h-4" />}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </TooltipProvider>
  );
};
export default WorkspaceSidebar;
