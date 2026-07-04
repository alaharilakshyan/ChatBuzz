import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Avatar, AvatarImage, AvatarFallback } from '@/components/ui/avatar';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, ArrowLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

const Profile = () => {
  const { user, updateProfile, getToken } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [username, setUsername] = useState(user?.username || '');
  const [bio, setBio] = useState(user?.bio || '');
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    try {
      await updateProfile({ username, bio });
      toast({ title: "Success", description: "Profile updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setSaving(false);
  };

  const uploadFile = async (file: File) => {
    const token = await getToken();
    const formData = new FormData();
    formData.append('file', file);
    
    const res = await fetch(`${API_URL}/uploads/upload`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
      body: formData
    });
    
    if (!res.ok) throw new Error('Failed to upload file');
    return await res.json();
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;
    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "File size must be less than 10MB", variant: "destructive" });
      return;
    }

    setUploading(true);
    try {
      const data = await uploadFile(file);
      await updateProfile({ avatar_url: data.url });
      toast({ title: "Success", description: "Avatar updated successfully" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setUploading(false);
  };

  if (!user) return null;

  return (
    <div className="container max-w-3xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in relative z-10">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>
      
      <div className="mb-8 space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#9AC68A] dark:text-[#4ADE80]">My Profile</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Manage your personal information.</p>
      </div>

      <Card className="p-8 space-y-8 rounded-[32px] border border-white/60 dark:border-slate-800/50 shadow-xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 mb-8 transition-all duration-300">
        <div className="flex flex-col sm:flex-row items-center gap-8 pb-8 border-b border-black/5 dark:border-white/5">
          <div className="relative group">
            <div className="absolute inset-0 bg-[#9AC68A] dark:bg-[#4ADE80] rounded-full blur-xl opacity-30 group-hover:opacity-50 transition-opacity duration-300" />
            <Avatar className="h-32 w-32 border-4 border-white dark:border-slate-800 shadow-xl relative z-10">
              <AvatarImage src={user.avatar_url || undefined} className="object-cover" />
              <AvatarFallback className="text-4xl bg-[#9AC68A] dark:bg-[#4ADE80] text-white dark:text-slate-950 font-bold">
                {user.username.charAt(0).toUpperCase()}
              </AvatarFallback>
            </Avatar>
          </div>
          <div className="flex-1 space-y-4 text-center sm:text-left">
            <div>
              <h3 className="text-2xl font-bold">{user.username}</h3>
              <p className="text-muted-foreground">#{user.user_tag}</p>
            </div>
            <div>
              <Input id="avatar" type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
              <Label htmlFor="avatar">
                <Button variant="outline" disabled={uploading} asChild className="rounded-[16px] shadow-sm hover:border-[#9AC68A] dark:hover:border-[#4ADE80] transition-all bg-white/50 dark:bg-slate-800/50">
                  <span className="cursor-pointer">
                    {uploading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                    Update Avatar
                  </span>
                </Button>
              </Label>
            </div>
          </div>
        </div>

        <div className="space-y-6 max-w-2xl">
          <div className="space-y-2">
            <Label htmlFor="username" className="text-sm font-bold text-gray-700 dark:text-gray-300">Username</Label>
            <Input
              id="username"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              className="h-12 rounded-[16px] bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-white/5 focus-visible:ring-[#9AC68A] dark:focus-visible:ring-[#4ADE80] transition-colors"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="bio" className="text-sm font-bold text-gray-700 dark:text-gray-300">Bio</Label>
            <Textarea
              id="bio"
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              placeholder="Tell us about yourself"
              rows={4}
              className="rounded-[16px] bg-white/50 dark:bg-slate-800/50 border border-black/5 dark:border-white/5 focus-visible:ring-[#9AC68A] dark:focus-visible:ring-[#4ADE80] transition-colors resize-none"
            />
          </div>
          <Button onClick={handleSave} disabled={saving} className="h-12 px-8 rounded-[16px] bg-[#9AC68A] dark:bg-[#4ADE80] text-white dark:text-slate-950 font-bold shadow-md hover:bg-[#8AB67A] dark:hover:bg-[#22C55E] transition-all">
            {saving ? <><Loader2 className="h-4 w-4 animate-spin mr-2" /> Saving...</> : 'Save Profile'}
          </Button>
        </div>
      </Card>
    </div>
  );
};
export default Profile;
