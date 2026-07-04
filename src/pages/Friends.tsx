import React from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FriendRequests } from '@/components/friends/FriendRequests';
import { UserSearch } from '@/components/friends/UserSearch';

const Friends = () => {
  return (
    <div className="container max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in">
      <div className="mb-8 space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight bg-gradient-brand bg-clip-text text-transparent">Friends</h1>
        <p className="text-muted-foreground text-lg">Connect and grow your network.</p>
      </div>
      
      <div className="p-6 sm:p-8 rounded-3xl border-border/60 shadow-elegant backdrop-blur-xl bg-card/95">
        <Tabs defaultValue="search" className="w-full">
          <TabsList className="grid w-full grid-cols-2 p-1 bg-background/50 rounded-xl">
            <TabsTrigger value="search" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Add Friends</TabsTrigger>
            <TabsTrigger value="requests" className="rounded-lg data-[state=active]:bg-white data-[state=active]:shadow-sm">Requests</TabsTrigger>
          </TabsList>
          
          <TabsContent value="search" className="mt-8 animate-fade-in">
            <UserSearch />
          </TabsContent>
          
          <TabsContent value="requests" className="mt-8 animate-fade-in">
            <FriendRequests />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default Friends;
