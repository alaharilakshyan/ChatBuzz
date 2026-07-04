import React, { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Loader2, Upload, ArrowLeft, Bell, Lock, Eye } from 'lucide-react';
import { FeedbackDialog } from '@/components/settings/FeedbackDialog';
import { useNavigate } from 'react-router-dom';

const Settings = () => {
  const { user, getToken } = useAuth();
  const { toast } = useToast();
  const [uploadingBackground, setUploadingBackground] = useState(false);
  const navigate = useNavigate();

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000/api';

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

  const handleBackgroundUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!user || !e.target.files || e.target.files.length === 0) return;

    const file = e.target.files[0];
    if (file.size > 10 * 1024 * 1024) {
      toast({ title: "Error", description: "File size must be less than 10MB", variant: "destructive" });
      return;
    }

    setUploadingBackground(true);
    try {
      const data = await uploadFile(file);
      localStorage.setItem('chatBackground', data.url);
      window.dispatchEvent(new Event('storage'));
      toast({ title: "Success", description: "Chat background updated successfully!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
    setUploadingBackground(false);
  };

  if (!user) return null;

  return (
    <div className="container max-w-4xl mx-auto p-4 sm:p-6 lg:p-8 animate-fade-in relative z-10">
      <Button variant="ghost" onClick={() => navigate(-1)} className="mb-6 hover:bg-black/5 dark:hover:bg-white/5 rounded-xl">
        <ArrowLeft className="h-4 w-4 mr-2" />
        Back
      </Button>

      <div className="mb-8 space-y-2">
        <h1 className="text-4xl font-extrabold tracking-tight text-[#9AC68A] dark:text-[#4ADE80]">App Settings</h1>
        <p className="text-gray-500 dark:text-gray-400 text-lg">Customize your chat experience and privacy.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="p-8 space-y-6 rounded-[32px] border border-white/60 dark:border-slate-800/50 shadow-xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 transition-all duration-300">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#9AC68A] dark:text-[#4ADE80]">Appearance</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Personalize your workspace background.</p>
          </div>
          
          <div className="space-y-4">
            <Input id="background" type="file" accept="image/*" onChange={handleBackgroundUpload} className="hidden" />
            <Label htmlFor="background">
              <Button variant="outline" disabled={uploadingBackground} asChild className="w-full h-12 rounded-[16px] shadow-sm hover:border-[#9AC68A] dark:hover:border-[#4ADE80] transition-all bg-white/50 dark:bg-slate-800/50">
                <span className="cursor-pointer">
                  {uploadingBackground ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Upload className="h-4 w-4 mr-2" />}
                  Upload Custom Background
                </span>
              </Button>
            </Label>
            <Button 
              variant="ghost" 
              className="w-full h-12 rounded-[16px] text-red-500 hover:bg-red-500/10 hover:text-red-600 transition-colors"
              onClick={() => {
                localStorage.removeItem('chatBackground');
                window.dispatchEvent(new Event('storage'));
                toast({ title: "Success", description: "Chat background reset to default" });
              }}
            >
              Reset to Default
            </Button>
          </div>
        </Card>

        <Card className="p-8 space-y-6 rounded-[32px] border border-white/60 dark:border-slate-800/50 shadow-xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 transition-all duration-300">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#9AC68A] dark:text-[#4ADE80] flex items-center gap-2"><Bell className="w-5 h-5"/> Notifications</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage when and how you are notified.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 rounded-[16px]">
              <div>
                <p className="font-bold">Push Notifications</p>
                <p className="text-xs text-gray-500">Receive alerts for new messages</p>
              </div>
              <input type="checkbox" className="toggle border-transparent bg-slate-300 dark:bg-slate-700 checked:bg-[#9AC68A]" defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 rounded-[16px]">
              <div>
                <p className="font-bold">Message Previews</p>
                <p className="text-xs text-gray-500">Show message content in notifications</p>
              </div>
              <input type="checkbox" className="toggle border-transparent bg-slate-300 dark:bg-slate-700 checked:bg-[#9AC68A]" defaultChecked />
            </div>
          </div>
        </Card>
        
        <Card className="p-8 space-y-6 rounded-[32px] border border-white/60 dark:border-slate-800/50 shadow-xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 transition-all duration-300">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#9AC68A] dark:text-[#4ADE80] flex items-center gap-2"><Lock className="w-5 h-5"/> Privacy</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Manage who can interact with you.</p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 rounded-[16px]">
              <div>
                <p className="font-bold">Online Status</p>
                <p className="text-xs text-gray-500">Let others see when you're online</p>
              </div>
              <input type="checkbox" className="toggle border-transparent bg-slate-300 dark:bg-slate-700 checked:bg-[#9AC68A]" defaultChecked />
            </div>
            <div className="flex items-center justify-between p-4 bg-white/50 dark:bg-slate-800/50 rounded-[16px]">
              <div>
                <p className="font-bold">Read Receipts</p>
                <p className="text-xs text-gray-500">Show when you've read messages</p>
              </div>
              <input type="checkbox" className="toggle border-transparent bg-slate-300 dark:bg-slate-700 checked:bg-[#9AC68A]" defaultChecked />
            </div>
          </div>
        </Card>

        <Card className="p-8 space-y-6 rounded-[32px] border border-white/60 dark:border-slate-800/50 shadow-xl backdrop-blur-xl bg-white/60 dark:bg-slate-900/40 transition-all duration-300">
          <div className="space-y-2">
            <h2 className="text-2xl font-bold text-[#9AC68A] dark:text-[#4ADE80]">Help & Support</h2>
            <p className="text-sm text-gray-500 dark:text-gray-400">Encountered an issue or have a suggestion?</p>
          </div>
          <div className="pt-2">
            <FeedbackDialog />
          </div>
        </Card>
      </div>
    </div>
  );
};
export default Settings;
