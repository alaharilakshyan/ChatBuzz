import React from 'react';
import { useLocation } from 'react-router-dom';

interface MainLayoutProps {
  children: React.ReactNode;
}

export const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  const location = useLocation();
  const isChatPage = location.pathname.startsWith('/chat');
  const isHomePage = location.pathname === '/';
  const noContainer = isChatPage || isHomePage;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Main Content */}
      <main className={`flex-1 flex flex-col ${!noContainer ? 'container mx-auto p-2 sm:p-4' : ''}`}>
        {children}
      </main>
    </div>
  );
};