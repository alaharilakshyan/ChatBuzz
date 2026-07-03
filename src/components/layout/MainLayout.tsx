import React from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { ThemeToggle } from '@/components/ui/theme-toggle';
import { Button } from '@/components/ui/button';
import { MessageCircle, Home, Settings, LogOut, Menu } from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useToast } from '@/hooks/use-toast';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleLogout = () => {
    logout();
    toast({
      title: "Logged out",
      description: "You've been logged out successfully.",
    });
    navigate('/login');
  };

  const isActive = (path: string) => location.pathname === path;

  const NavLinks = () => (
    <>
      <Button
        variant={isActive('/') ? 'secondary' : 'ghost'}
        size="sm"
        asChild
        className="w-full sm:w-auto justify-start"
      >
        <Link to="/">
          <Home className="h-4 w-4 mr-2" />
          Home
        </Link>
      </Button>
      <Button
        variant={isActive('/chat') ? 'secondary' : 'ghost'}
        size="sm"
        asChild
        className="w-full sm:w-auto justify-start"
      >
        <Link to="/chat">
          <MessageCircle className="h-4 w-4 mr-2" />
          Chat
        </Link>
      </Button>
    </>
  );

  return (
    <div className="min-h-screen bg-background">
      {/* Top Navigation Bar */}
      <nav className="border-b bg-background/95 backdrop-blur-xl supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-14 items-center px-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 mr-4 md:mr-6">
            <img 
              src="/chatbuzz-logo.png" 
              alt="ChatBuzz" 
              className="w-8 h-8 rounded-lg"
              onError={(e) => {
                e.currentTarget.style.display = 'none';
                e.currentTarget.nextElementSibling?.classList.remove('hidden');
              }}
            />
            <div className="hidden w-8 h-8 bg-gradient-brand rounded-lg items-center justify-center">
              <span className="text-white font-bold text-sm">CB</span>
            </div>
            <span className="hidden font-extrabold sm:inline-block bg-gradient-brand bg-clip-text text-transparent">
              ChatBuzz
            </span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden sm:flex items-center space-x-2 mr-4">
            <NavLinks />
          </div>

          {/* Mobile Menu */}
          <div className="sm:hidden">
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-64">
                <div className="flex flex-col space-y-2 mt-6">
                  <NavLinks />
                </div>
              </SheetContent>
            </Sheet>
          </div>

          {/* Right Side Controls */}
          <div className="flex items-center ml-auto space-x-2">
            <ThemeToggle />
            
            {user && (
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                    <Avatar className="h-8 w-8 ring-2 ring-primary/20">
                      <AvatarImage src={user.avatar} alt={user.username} />
                      <AvatarFallback className="bg-gradient-brand text-white">
                        {user.username.charAt(0).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent className="w-56" align="end" forceMount>
                  <DropdownMenuLabel className="font-normal">
                    <div className="flex flex-col space-y-1">
                      <p className="text-sm font-medium leading-none">{user.username}</p>
                      <p className="text-xs leading-none text-muted-foreground">
                        {user.email}
                      </p>
                    </div>
                  </DropdownMenuLabel>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem asChild>
                    <Link to="/settings">
                      <Settings className="mr-2 h-4 w-4" />
                      <span>Settings</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="mr-2 h-4 w-4" />
                    <span>Log out</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            )}
          </div>
        </div>
      </nav>

      {/* Main Content */}
      <main className="container mx-auto p-2 sm:p-4">
        {children}
      </main>
    </div>
  );
};