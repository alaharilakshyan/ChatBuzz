import React from "react";
import { useNavigate } from "react-router-dom";
import { Home, Plus, UserPlus, MessageSquare, Bell, Settings, User, LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useTheme } from "@/contexts/ThemeContext";
import { Sun, Moon } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

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
  onAddContact?: () => void;
  user: any;
}

export const WorkspaceSidebar: React.FC<WorkspaceSidebarProps> = ({
  workspaces,
  activeWorkspaceId,
  onSelectWorkspace,
  onCreateWorkspace,
  onAddContact,
  user,
}) => {
  const { theme, toggleTheme } = useTheme();
  const { logout } = useAuth();
  const navigate = useNavigate();

  return (
    <TooltipProvider>
      <div className="sidebar-wave-hover flex flex-col items-center justify-between w-[72px] py-6 bg-white/60 dark:bg-slate-900/40 backdrop-blur-2xl border border-white/60 dark:border-slate-800/50 rounded-[28px] shadow-xl dark:shadow-2xl flex-shrink-0 h-full z-10 relative transition-colors duration-300">
        {/* Top: Logo & Main Navigation */}
        <div className="flex flex-col items-center gap-6 w-full">
          {/* CB Logo */}
          <div className="w-12 h-12 rounded-[20px] bg-[#9AC68A] dark:bg-[#4ADE80] flex items-center justify-center shadow-lg shadow-[#9AC68A]/30 dark:shadow-[#4ADE80]/30 transition-transform duration-300 hover:scale-105 select-none cursor-pointer" onClick={() => onSelectWorkspace(null)}>
            <span className="text-white dark:text-slate-950 font-extrabold text-lg tracking-tight">CB</span>
          </div>

          <div className="w-8 h-[1px] bg-black/5 dark:bg-white/5 my-1" />

          {/* Navigation Action Buttons */}
          <div className="flex flex-col items-center gap-4 w-full px-2">
            {/* Home / DMs */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => onSelectWorkspace(null)}
                  className={`h-12 w-12 rounded-[20px] transition-all duration-300 ${
                    activeWorkspaceId === null
                      ? "bg-[#9AC68A] dark:bg-[#4ADE80] text-white dark:text-slate-950 shadow-lg shadow-[#9AC68A]/30 dark:shadow-[#4ADE80]/20 scale-105"
                      : "bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 hover:bg-[#9AC68A]/10 dark:hover:bg-[#4ADE80]/10 hover:border-[#9AC68A]/30 dark:hover:border-[#4ADE80]/30 text-gray-500 dark:text-slate-400 hover:text-[#9AC68A] dark:hover:text-[#4ADE80]"
                  }`}
                >
                  <Home className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-semibold text-xs">Direct Messages</p>
              </TooltipContent>
            </Tooltip>

            {/* Add Contact */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={onAddContact}
                  className="h-12 w-12 rounded-[20px] bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 hover:bg-[#9AC68A]/10 dark:hover:bg-[#4ADE80]/10 hover:border-[#9AC68A]/30 dark:hover:border-[#4ADE80]/30 text-gray-500 dark:text-slate-400 hover:text-[#9AC68A] dark:hover:text-[#4ADE80] transition-all duration-300"
                >
                  <UserPlus className="h-5 w-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-semibold text-xs">Add Contact</p>
              </TooltipContent>
            </Tooltip>

            {/* Notifications */}
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-12 w-12 rounded-[20px] bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 hover:bg-[#9AC68A]/10 dark:hover:bg-[#4ADE80]/10 hover:border-[#9AC68A]/30 dark:hover:border-[#4ADE80]/30 text-gray-500 dark:text-slate-400 hover:text-[#9AC68A] dark:hover:text-[#4ADE80] transition-all duration-300 relative"
                >
                  <Bell className="h-5 w-5" />
                  <span className="absolute top-3 right-3 w-2.5 h-2.5 bg-[#4ADE80] border-2 border-white dark:border-slate-900 rounded-full" />
                </Button>
              </TooltipTrigger>
              <TooltipContent side="right">
                <p className="font-semibold text-xs">Notifications</p>
              </TooltipContent>
            </Tooltip>
          </div>

          <div className="w-8 h-[1px] bg-black/5 dark:bg-white/5 my-1" />

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
                      className={`h-12 w-12 rounded-[20px] font-bold text-sm flex items-center justify-center transition-all duration-300 ${
                        isActive
                          ? "bg-[#9AC68A] dark:bg-[#4ADE80] text-white dark:text-slate-950 shadow-lg shadow-[#9AC68A]/30 dark:shadow-[#4ADE80]/20 scale-105"
                          : "bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-white/5 hover:border-[#9AC68A] dark:hover:border-[#4ADE80] text-gray-500 dark:text-slate-300 hover:text-[#9AC68A] dark:hover:text-[#4ADE80] hover:scale-105 shadow-sm"
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
                  className="h-12 w-12 rounded-[20px] border-dashed border-gray-400 dark:border-slate-600 hover:border-[#9AC68A] dark:hover:border-[#4ADE80] hover:bg-[#9AC68A]/10 dark:hover:bg-[#4ADE80]/10 text-gray-500 dark:text-slate-400 hover:text-[#9AC68A] dark:hover:text-[#4ADE80] transition-all duration-300"
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
                onClick={toggleTheme}
                className="h-12 w-12 rounded-[20px] bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 hover:bg-[#9AC68A]/10 dark:hover:bg-[#4ADE80]/10 hover:border-[#9AC68A]/30 dark:hover:border-[#4ADE80]/30 text-gray-500 dark:text-slate-400 hover:text-[#9AC68A] dark:hover:text-[#4ADE80] transition-all duration-300"
              >
                {theme === 'light' ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-semibold text-xs">Toggle Theme</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate('/settings')}
                className="h-12 w-12 rounded-[20px] bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 hover:bg-[#9AC68A]/10 dark:hover:bg-[#4ADE80]/10 hover:border-[#9AC68A]/30 dark:hover:border-[#4ADE80]/30 text-gray-500 dark:text-slate-400 hover:text-[#9AC68A] dark:hover:text-[#4ADE80] transition-all duration-300 relative z-10"
              >
                <Settings className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-semibold text-xs">Settings</p>
            </TooltipContent>
          </Tooltip>

          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                onClick={logout}
                className="h-12 w-12 rounded-[20px] bg-white/40 dark:bg-slate-800/40 border border-white/50 dark:border-slate-700/50 hover:bg-red-500/10 dark:hover:bg-red-500/10 hover:border-red-500/30 dark:hover:border-red-500/30 text-gray-500 dark:text-slate-400 hover:text-red-500 dark:hover:text-red-400 transition-all duration-300 relative z-10"
              >
                <LogOut className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent side="right">
              <p className="font-semibold text-xs">Logout</p>
            </TooltipContent>
          </Tooltip>

          <Avatar 
            onClick={() => navigate('/profile')}
            className="h-12 w-12 ring-2 ring-[#9AC68A]/20 dark:ring-[#4ADE80]/20 ring-offset-2 dark:ring-offset-slate-900 transition-transform duration-300 hover:scale-105 cursor-pointer shadow-lg shadow-[#9AC68A]/20 dark:shadow-[#4ADE80]/20 relative z-10"
          >
            <AvatarImage src={user?.avatar_url || user?.avatar} alt={user?.username} />
            <AvatarFallback className="bg-[#9AC68A] dark:bg-[#4ADE80] text-white dark:text-slate-950 text-lg font-bold">
              {user?.username ? user.username.charAt(0).toUpperCase() : <User className="w-5 h-5" />}
            </AvatarFallback>
          </Avatar>
        </div>
      </div>
    </TooltipProvider>
  );
};
export default WorkspaceSidebar;
